/**
 * Library journal storage.
 *
 * Key: solace_journal_entries
 * Legacy schema: JSON string (one undated blob)
 * Current schema: JournalEntry[]
 *
 * Migration is one-way and lossless: a legacy string becomes a single dated entry.
 * Malformed values do not crash. Failed writes do not overwrite the previous key.
 */

export const JOURNAL_STORAGE_KEY = 'solace_journal_entries';

export interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

export function createJournalEntry(text = ''): JournalEntry {
  const createdAt = nowIso();
  return {
    id: `j-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt,
    updatedAt: createdAt,
  };
}

function asEntry(value: unknown): JournalEntry | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.text !== 'string') return null;
  const createdAt = typeof v.createdAt === 'string' ? v.createdAt : nowIso();
  const updatedAt = typeof v.updatedAt === 'string' ? v.updatedAt : createdAt;
  return { id: v.id, text: v.text, createdAt, updatedAt };
}

function persistJournal(entries: JournalEntry[]): boolean {
  try {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function loadJournalEntries(): JournalEntry[] {
  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (raw == null || raw === '') return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const entries = [createJournalEntry(raw)];
      persistJournal(entries);
      return entries;
    }

    if (typeof parsed === 'string') {
      if (!parsed.trim()) return [];
      const entries = [createJournalEntry(parsed)];
      persistJournal(entries);
      return entries;
    }

    if (Array.isArray(parsed)) {
      return parsed.map(asEntry).filter((entry): entry is JournalEntry => entry !== null);
    }

    return [];
  } catch {
    return [];
  }
}

export function saveJournalEntries(entries: JournalEntry[]): boolean {
  return persistJournal(entries);
}

export function formatJournalStamp(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'undated';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function exportJournalText(entries: JournalEntry[]): string {
  const pages = entries
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(entry => `--- ${formatJournalStamp(entry.createdAt)} ---\n${entry.text.trim() || '(empty page)'}`);
  return `Solace journal\nkept on this device\n\n${pages.join('\n\n')}\n`;
}
