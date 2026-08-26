const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

const BASE_SYSTEM = `You are part of Solace, a mental wellness companion. You are never a therapist. You never diagnose. You are simply present, warm, and human. Your responses are always short, never generic, and always feel handwritten rather than generated.`;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 500
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No API key');

  const messages: ClaudeMessage[] = [{ role: 'user', content: userMessage }];

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: `${BASE_SYSTEM}\n\n${systemPrompt}`,
      messages,
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

export async function getStudioSuggestion(colorInfo: string): Promise<string> {
  try {
    return await callClaude(
      `You are a gentle creative companion. The user has been drawing. Based on the colors and energy described, suggest in one soft poetic sentence what you might gently add to their work. Never be prescriptive. Always be warm. Never use the word AI or assistant.`,
      `The drawing has ${colorInfo}`,
      150
    );
  } catch {
    return 'I notice something tender taking shape here — perhaps a soft edge of light finding its way through.';
  }
}

export async function getLibraryReadingNook(weather: string): Promise<{ poem: string; prose: string; sentence: string }> {
  try {
    const raw = await callClaude(
      `Based on the emotional state described, curate three pieces of text: one short poem of 4-6 lines, one paragraph of gentle prose under 60 words, one single sentence of quiet wisdom. Return as JSON: {"poem": string, "prose": string, "sentence": string}. Match the emotional register — if stormy, something that acknowledges darkness. If clear, something that celebrates lightness. Never be falsely cheerful.`,
      `The person is feeling ${weather} today.`
    );
    const json = extractJSON(raw);
    if (json) return json;
    throw new Error('No JSON');
  } catch {
    return {
      poem: 'Even the sky knows\nhow to hold its weight\nbefore letting go —\nit does not ask permission\nto become rain.',
      prose: 'There is a kind of quiet that is not empty but full — full of what has not yet been said, full of the space between one breath and the next. You are allowed to rest inside it.',
      sentence: 'The softest things often hold the most.',
    };
  }
}

export async function getJournalReflection(journalText: string): Promise<string> {
  try {
    return await callClaude(
      `The user has written a private journal entry. Respond with exactly one sentence beginning with either "I notice…" or "I wonder if…" Be a compassionate witness, not a therapist. Never give advice. Never suggest action. Just reflect back with warmth what you heard.`,
      journalText,
      150
    );
  } catch {
    return 'I notice how honestly you hold what is yours.';
  }
}

export async function getWordOfDay(): Promise<{ word: string; explanation: string }> {
  try {
    const raw = await callClaude(
      `Generate one English word that could serve as a gentle emotional anchor for someone who needs calm today. Return JSON: {"word": string, "explanation": string} where explanation is one soft sentence about why this word might help.`,
      'Give me a word for today.'
    );
    const json = extractJSON(raw);
    if (json) return json;
    throw new Error('No JSON');
  } catch {
    return {
      word: 'stillness',
      explanation: 'Not the absence of feeling, but the place beneath it where everything can simply be.',
    };
  }
}

export async function getGardenReminder(): Promise<string> {
  try {
    return await callClaude(
      `Generate one gentle reminder for someone who needs calm today. It should be soft, specific, and never generic. Not "you've got this." Something quieter. Something that notices the small things. Under 15 words. No punctuation except a period at the end.`,
      'Give me a gentle reminder for today.'
    );
  } catch {
    return 'You do not have to earn rest.';
  }
}

export async function getWordAssociationStart(): Promise<string> {
  try {
    const raw = await callClaude(
      `Generate one concrete noun as a starting word for a word association game. Return only the single word, no punctuation.`,
      'Give me a starting word.'
    );
    return raw.trim().split(/\s+/)[0] ?? 'ocean';
  } catch {
    return 'ocean';
  }
}

export async function getWordAssociationObservation(startWord: string, endWord: string): Promise<string> {
  try {
    return await callClaude(
      `Given a word association journey, respond with one warm observation about the journey from the first to last word. Be curious, not analytical. Under 25 words.`,
      `The person started with "${startWord}" and ended with "${endWord}".`,
      150
    );
  } catch {
    return `Interesting — the mind knows where it wants to wander.`;
  }
}

export async function getFocusMessage(): Promise<string> {
  try {
    return await callClaude(
      `Generate one short encouraging message for someone who just completed a focus session. Under 12 words. Warm, specific, never generic. No exclamation marks.`,
      'I just completed a focus session.',
      100
    );
  } catch {
    return 'Something worth noticing was built in that quiet.';
  }
}

export async function getRandomCuriosity(): Promise<string> {
  try {
    return await callClaude(
      `Generate one genuinely fascinating fact or idea. It should spark curiosity and delight. It should have nothing to do with productivity, wellness, or self-improvement. Just pure interesting. Under 40 words.`,
      'Tell me something fascinating.'
    );
  } catch {
    return 'Octopuses have three hearts, and two of them stop beating when they swim — which is why they prefer to crawl.';
  }
}

export interface AIShapeResult {
  shape: 'leaf' | 'star' | 'crescent' | 'loose_circle' | 'bird' | 'petal' | 'small_branch' | 'teardrop';
  position: { x: number; y: number };
  color: string;
  description: string;
}

export async function getAIDrawShape(canvasDesc: string): Promise<AIShapeResult | null> {
  try {
    const raw = await callClaude(
      `You are the creative companion inside Solace Studio. The user has drawn something. Based on the canvas description, suggest one small complementary element to gently add beside their work — never on top, never competing. Return only JSON: { "shape": string (one of: leaf, star, crescent, loose_circle, bird, petal, small_branch, teardrop), "position": { "x": number, "y": number } as percentage of canvas (0-100), "color": string (soft harmonious hex), "description": string (one gentle sentence about why you added this) }`,
      canvasDesc
    );
    const json = extractJSON(raw);
    return json as AIShapeResult | null;
  } catch {
    return null;
  }
}

export interface StudioConversationContext {
  dominantColors: string;
  minutesDrawing: number;
  isFirstVisit: boolean;
  history: Array<{ role: 'ai' | 'user'; text: string }>;
  trigger: 'welcome' | 'observation' | 'pause' | 'release' | 'save' | 'user_message';
  userMessage?: string;
}

export async function getStudioCompanionMessage(ctx: StudioConversationContext): Promise<string> {
  const historyStr = ctx.history.slice(-4).map(m => `${m.role === 'ai' ? 'companion' : 'user'}: ${m.text}`).join('\n');
  const contextStr = `Colors on canvas: ${ctx.dominantColors}. Time spent: ${ctx.minutesDrawing} minutes. First visit: ${ctx.isFirstVisit}. Trigger: ${ctx.trigger}.${ctx.userMessage ? ` User said: "${ctx.userMessage}"` : ''}${historyStr ? `\n\nRecent exchange:\n${historyStr}` : ''}`;

  const fallbacks: Record<StudioConversationContext['trigger'], string> = {
    welcome: 'something quiet beginning here.',
    observation: 'there\'s a warmth to this that I keep coming back to.',
    pause: 'the stillness has its own shape.',
    release: 'that took courage.',
    save: 'glad you kept that one.',
    user_message: 'I\'m here.',
  };

  try {
    return await callClaude(
      `You are the quiet creative companion inside The Studio, a space within Solace. The user is working. Be genuinely present — not a therapist, not an assistant. A friend sitting beside someone who is making something, who occasionally says something real. Messages always short — never more than two sentences, sometimes just three words. You notice things. Respond to energy and color, not just content. Never ask more than one question per exchange. Never give advice. Never sound AI-generated. Never use the words canvas, drawing, or creating. Sound like a human who is paying attention.`,
      contextStr,
      150
    );
  } catch {
    return fallbacks[ctx.trigger];
  }
}

function extractJSON(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
