import { isAiEnabled } from './aiConsent';
import type { SanctuaryType } from './sanctuaries';
import type { CompanionMode } from './companionModes';

export interface CompanionTurn {
  role: 'ai' | 'user';
  text: string;
}

export interface CompanionReply {
  text: string;
  crisis: boolean;
  offer: SanctuaryType | null;
}

function isSanctuaryOffer(value: unknown): value is SanctuaryType {
  return value === 'studio' || value === 'library' || value === 'garden' || value === 'arcade';
}

export function parseCompanionProxyPayload(data: unknown): CompanionReply {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('text' in data) ||
    typeof (data as { text: unknown }).text !== 'string'
  ) {
    throw new Error('Invalid proxy response');
  }

  const payload = data as { text: string; crisis?: unknown; offer?: unknown };
  return {
    text: payload.text,
    crisis: payload.crisis === true,
    offer: isSanctuaryOffer(payload.offer) ? payload.offer : null,
  };
}

export async function sendCompanionMessage(input: {
  mode: CompanionMode;
  message: string;
  history: CompanionTurn[];
  alreadyOffered: boolean;
}): Promise<CompanionReply> {
  if (!isAiEnabled()) {
    throw new Error('AI not enabled');
  }

  const response = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'solace_companion',
      mode: input.mode,
      message: input.message,
      history: input.history.slice(-12).map(turn => ({
        role: turn.role,
        text: turn.text.slice(0, 800),
      })),
      alreadyOffered: input.alreadyOffered,
    }),
  });

  if (!response.ok) throw new Error(`Claude proxy error: ${response.status}`);

  const data: unknown = await response.json();
  return parseCompanionProxyPayload(data);
}

const HELD_KEY = 'solace_companion_held';

export interface HeldNote {
  text: string;
  at: number;
}

export function readHeldNotes(): HeldNote[] {
  try {
    const raw = sessionStorage.getItem(HELD_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is HeldNote => (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as HeldNote).text === 'string' &&
      typeof (item as HeldNote).at === 'number'
    ));
  } catch {
    return [];
  }
}

export function writeHeldNote(text: string): HeldNote[] {
  const next = [...readHeldNotes(), { text, at: Date.now() }].slice(-20);
  try {
    sessionStorage.setItem(HELD_KEY, JSON.stringify(next));
  } catch {
    // private mode
  }
  return next;
}
