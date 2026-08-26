import { isAiEnabled } from './aiConsent';

async function invokeClaude(payload: Record<string, unknown>): Promise<string> {
  if (!isAiEnabled()) {
    throw new Error('AI not enabled');
  }

  const response = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Claude proxy error: ${response.status}`);

  const data: unknown = await response.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    !('text' in data) ||
    typeof data.text !== 'string'
  ) {
    throw new Error('Invalid proxy response');
  }

  return data.text;
}

export async function getStudioSuggestion(colorInfo: string): Promise<string> {
  try {
    return await invokeClaude({ action: 'studio_suggestion', colorInfo });
  } catch {
    return 'I notice something tender taking shape here — perhaps a soft edge of light finding its way through.';
  }
}

export async function getLibraryReadingNook(): Promise<{ poem: string; prose: string; sentence: string }> {
  try {
    const raw = await invokeClaude({ action: 'library_nook' });
    const json = extractJSON(raw);
    if (
      json &&
      typeof json.poem === 'string' &&
      typeof json.prose === 'string' &&
      typeof json.sentence === 'string'
    ) {
      return { poem: json.poem, prose: json.prose, sentence: json.sentence };
    }
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
    return await invokeClaude({ action: 'journal_reflection', journalText });
  } catch {
    return 'I notice how honestly you hold what is yours.';
  }
}

export async function getWordOfDay(): Promise<{ word: string; explanation: string }> {
  try {
    const raw = await invokeClaude({ action: 'word_of_day' });
    const json = extractJSON(raw);
    if (json && typeof json.word === 'string' && typeof json.explanation === 'string') {
      return { word: json.word, explanation: json.explanation };
    }
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
    return await invokeClaude({ action: 'garden_reminder' });
  } catch {
    return 'You do not have to earn rest.';
  }
}

export async function getWordAssociationStart(): Promise<string> {
  try {
    const raw = await invokeClaude({ action: 'word_association_start' });
    return raw.trim().split(/\s+/)[0] ?? 'ocean';
  } catch {
    return 'ocean';
  }
}

export async function getWordAssociationObservation(startWord: string, endWord: string): Promise<string> {
  try {
    return await invokeClaude({ action: 'word_association_observation', startWord, endWord });
  } catch {
    return `Interesting — the mind knows where it wants to wander.`;
  }
}

export async function getFocusMessage(): Promise<string> {
  try {
    return await invokeClaude({ action: 'focus_message' });
  } catch {
    return 'Something worth noticing was built in that quiet.';
  }
}

export async function getRandomCuriosity(): Promise<string> {
  try {
    return await invokeClaude({ action: 'curiosity' });
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
    const raw = await invokeClaude({ action: 'ai_draw_shape', canvasDesc });
    const json = extractJSON(raw);
    if (!json) return null;
    return json as unknown as AIShapeResult;
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
  const fallbacks: Record<StudioConversationContext['trigger'], string> = {
    welcome: 'something quiet beginning here.',
    observation: 'there\'s a warmth to this that I keep coming back to.',
    pause: 'the stillness has its own shape.',
    release: 'that took courage.',
    save: 'glad you kept that one.',
    user_message: 'I\'m here.',
  };

  try {
    return await invokeClaude({
      action: 'studio_companion',
      dominantColors: ctx.dominantColors,
      minutesDrawing: ctx.minutesDrawing,
      isFirstVisit: ctx.isFirstVisit,
      history: ctx.history.slice(-4),
      trigger: ctx.trigger,
      userMessage: ctx.userMessage,
    });
  } catch {
    return fallbacks[ctx.trigger];
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
