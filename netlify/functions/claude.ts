/**
 * Server-side Anthropic proxy for Solace.
 *
 * The API key stays in the function environment. The browser may only send
 * a known action plus bounded input — never a free-form model call.
 *
 * Production rate limiting (not in this function): Netlify WAF / IP rate
 * limits, or a shared store (e.g. Netlify Blobs / Upstash) for per-IP and
 * per-day caps. In-memory counters are not enough across serverless instances.
 */

const MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_SHORT = 120;
const MAX_MEDIUM = 2_000;
const MAX_LONG = 16_000;
const MAX_HISTORY = 4;
const MAX_HISTORY_TEXT = 500;

const BASE_SYSTEM = `You are part of Solace, a mental wellness companion. You are never a therapist. You never diagnose. You are simply present, warm, and human. Your responses are always short, never generic, and always feel handwritten rather than generated.`;

const STUDIO_TRIGGERS = new Set([
  'welcome',
  'observation',
  'pause',
  'release',
  'save',
  'user_message',
]);

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded?: boolean;
}

interface ProxySuccess {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function json(statusCode: number, payload: Record<string, string>) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(payload) };
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function decodeBody(event: NetlifyEvent): string | null {
  const raw = event.body ?? '';
  if (!event.isBase64Encoded) return raw;
  try {
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  if (value.length === 0 || value.length > max) return null;
  return value;
}

function getAnthropicKey(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const key = env?.ANTHROPIC_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

function parseHistory(
  value: unknown
): Array<{ role: 'ai' | 'user'; text: string }> | null {
  if (!Array.isArray(value) || value.length > MAX_HISTORY) return null;
  const history: Array<{ role: 'ai' | 'user'; text: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (item.role !== 'ai' && item.role !== 'user') return null;
    if (typeof item.text !== 'string' || item.text.length > MAX_HISTORY_TEXT) return null;
    history.push({ role: item.role, text: item.text });
  }
  return history;
}

function buildCompanionUserMessage(body: Record<string, unknown>): string | null {
  const dominantColors = readString(body.dominantColors, MAX_MEDIUM);
  const trigger = readString(body.trigger, MAX_SHORT);
  if (!dominantColors || !trigger || !STUDIO_TRIGGERS.has(trigger)) return null;
  if (typeof body.minutesDrawing !== 'number' || !Number.isFinite(body.minutesDrawing)) return null;
  if (body.minutesDrawing < 0 || body.minutesDrawing > 24 * 60) return null;
  if (typeof body.isFirstVisit !== 'boolean') return null;

  const history = parseHistory(body.history ?? []);
  if (!history) return null;

  if (body.userMessage !== undefined && body.userMessage !== null) {
    if (typeof body.userMessage !== 'string' || body.userMessage.length > MAX_LONG) return null;
  }

  const historyStr = history
    .slice(-MAX_HISTORY)
    .map(m => `${m.role === 'ai' ? 'companion' : 'user'}: ${m.text}`)
    .join('\n');

  const userMessage = body.userMessage;
  return `Colors on canvas: ${dominantColors}. Time spent: ${body.minutesDrawing} minutes. First visit: ${body.isFirstVisit}. Trigger: ${trigger}.${typeof userMessage === 'string' && userMessage ? ` User said: "${userMessage}"` : ''}${historyStr ? `\n\nRecent exchange:\n${historyStr}` : ''}`;
}

function buildProxyRequest(body: unknown): ProxySuccess | null {
  if (!isRecord(body) || typeof body.action !== 'string') return null;

  switch (body.action) {
    case 'studio_suggestion': {
      const colorInfo = readString(body.colorInfo, MAX_MEDIUM);
      if (!colorInfo) return null;
      return {
        maxTokens: 150,
        userMessage: `The drawing has ${colorInfo}`,
        systemPrompt: `You are a gentle creative companion. The user has been drawing. Based on the colors and energy described, suggest in one soft poetic sentence what you might gently add to their work. Never be prescriptive. Always be warm. Never use the word AI or assistant.`,
      };
    }
    case 'library_nook': {
      const weather = readString(body.weather, MAX_SHORT);
      if (!weather) return null;
      return {
        maxTokens: 500,
        userMessage: `The person is feeling ${weather} today.`,
        systemPrompt: `Based on the emotional state described, curate three pieces of text: one short poem of 4-6 lines, one paragraph of gentle prose under 60 words, one single sentence of quiet wisdom. Return as JSON: {"poem": string, "prose": string, "sentence": string}. Match the emotional register — if stormy, something that acknowledges darkness. If clear, something that celebrates lightness. Never be falsely cheerful.`,
      };
    }
    case 'journal_reflection': {
      const journalText = readString(body.journalText, MAX_LONG);
      if (!journalText) return null;
      return {
        maxTokens: 150,
        userMessage: journalText,
        systemPrompt: `The user has written a private journal entry. Respond with exactly one sentence beginning with either "I notice…" or "I wonder if…" Be a compassionate witness, not a therapist. Never give advice. Never suggest action. Just reflect back with warmth what you heard.`,
      };
    }
    case 'word_of_day':
      return {
        maxTokens: 500,
        userMessage: 'Give me a word for today.',
        systemPrompt: `Generate one English word that could serve as a gentle emotional anchor for someone who needs calm today. Return JSON: {"word": string, "explanation": string} where explanation is one soft sentence about why this word might help.`,
      };
    case 'garden_reminder':
      return {
        maxTokens: 500,
        userMessage: 'Give me a gentle reminder for today.',
        systemPrompt: `Generate one gentle reminder for someone who needs calm today. It should be soft, specific, and never generic. Not "you've got this." Something quieter. Something that notices the small things. Under 15 words. No punctuation except a period at the end.`,
      };
    case 'word_association_start':
      return {
        maxTokens: 500,
        userMessage: 'Give me a starting word.',
        systemPrompt: `Generate one concrete noun as a starting word for a word association game. Return only the single word, no punctuation.`,
      };
    case 'word_association_observation': {
      const startWord = readString(body.startWord, MAX_SHORT);
      const endWord = readString(body.endWord, MAX_SHORT);
      if (!startWord || !endWord) return null;
      return {
        maxTokens: 150,
        userMessage: `The person started with "${startWord}" and ended with "${endWord}".`,
        systemPrompt: `Given a word association journey, respond with one warm observation about the journey from the first to last word. Be curious, not analytical. Under 25 words.`,
      };
    }
    case 'focus_message':
      return {
        maxTokens: 100,
        userMessage: 'I just completed a focus session.',
        systemPrompt: `Generate one short encouraging message for someone who just completed a focus session. Under 12 words. Warm, specific, never generic. No exclamation marks.`,
      };
    case 'curiosity':
      return {
        maxTokens: 500,
        userMessage: 'Tell me something fascinating.',
        systemPrompt: `Generate one genuinely fascinating fact or idea. It should spark curiosity and delight. It should have nothing to do with productivity, wellness, or self-improvement. Just pure interesting. Under 40 words.`,
      };
    case 'ai_draw_shape': {
      const canvasDesc = readString(body.canvasDesc, MAX_MEDIUM);
      if (!canvasDesc) return null;
      return {
        maxTokens: 500,
        userMessage: canvasDesc,
        systemPrompt: `You are the creative companion inside Solace Studio. The user has drawn something. Based on the canvas description, suggest one small complementary element to gently add beside their work — never on top, never competing. Return only JSON: { "shape": string (one of: leaf, star, crescent, loose_circle, bird, petal, small_branch, teardrop), "position": { "x": number, "y": number } as percentage of canvas (0-100), "color": string (soft harmonious hex), "description": string (one gentle sentence about why you added this) }`,
      };
    }
    case 'studio_companion': {
      const userMessage = buildCompanionUserMessage(body);
      if (!userMessage) return null;
      return {
        maxTokens: 150,
        userMessage,
        systemPrompt: `You are the quiet creative companion inside The Studio, a space within Solace. The user is working. Be genuinely present — not a therapist, not an assistant. A friend sitting beside someone who is making something, who occasionally says something real. Messages always short — never more than two sentences, sometimes just three words. You notice things. Respond to energy and color, not just content. Never ask more than one question per exchange. Never give advice. Never sound AI-generated. Never use the words canvas, drawing, or creating. Sound like a human who is paying attention.`,
      };
    }
    default:
      return null;
  }
}

export async function handler(event: NetlifyEvent) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const contentType = event.headers['content-type'] ?? event.headers['Content-Type'] ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json(400, { error: 'invalid_request' });
  }

  const raw = decodeBody(event);
  if (raw === null) {
    return json(400, { error: 'invalid_request' });
  }

  if (byteLength(raw) > MAX_BODY_BYTES) {
    return json(413, { error: 'too_large' });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(400, { error: 'invalid_request' });
  }

  const proxyRequest = buildProxyRequest(parsed);
  if (!proxyRequest) {
    return json(400, { error: 'invalid_request' });
  }

  const apiKey = getAnthropicKey();
  if (!apiKey) {
    return json(503, { error: 'unavailable' });
  }

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: proxyRequest.maxTokens,
        system: `${BASE_SYSTEM}\n\n${proxyRequest.systemPrompt}`,
        messages: [{ role: 'user', content: proxyRequest.userMessage }],
      }),
    });
  } catch {
    return json(503, { error: 'unavailable' });
  }

  if (!anthropicResponse.ok) {
    return json(502, { error: 'unavailable' });
  }

  let data: unknown;
  try {
    data = await anthropicResponse.json();
  } catch {
    return json(502, { error: 'unavailable' });
  }

  const text =
    isRecord(data) &&
    Array.isArray(data.content) &&
    isRecord(data.content[0]) &&
    typeof data.content[0].text === 'string'
      ? data.content[0].text
      : '';

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({ text }),
  };
}
