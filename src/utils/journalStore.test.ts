import { beforeEach, describe, expect, it } from 'vitest';
import { installMemoryStorage } from '../test/memoryStorage';
import {
  JOURNAL_STORAGE_KEY,
  createJournalEntry,
  exportJournalText,
  formatJournalStamp,
  loadJournalEntries,
  saveJournalEntries,
} from './journalStore';

describe('journalStore', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadJournalEntries()).toEqual([]);
  });

  it('migrates a legacy JSON string into a single dated entry', () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify('a quiet afternoon'));
    const entries = loadJournalEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe('a quiet afternoon');
    expect(entries[0].createdAt).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(JOURNAL_STORAGE_KEY) ?? '[]')).toHaveLength(1);
  });

  it('migrates a raw non-JSON blob without crashing', () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, 'plain kept words');
    const entries = loadJournalEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe('plain kept words');
  });

  it('drops malformed array items and keeps valid pages', () => {
    const valid = createJournalEntry('kept');
    window.localStorage.setItem(
      JOURNAL_STORAGE_KEY,
      JSON.stringify([valid, { id: 12 }, null, { id: 'ok', text: 'still here' }]),
    );
    const entries = loadJournalEntries();
    expect(entries.map(entry => entry.text)).toEqual(['kept', 'still here']);
  });

  it('returns an empty list for unexpected JSON shapes', () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ text: 'nope' }));
    expect(loadJournalEntries()).toEqual([]);
  });

  it('round-trips saved entries and exports a device-local file body', () => {
    const page = createJournalEntry('hello');
    expect(saveJournalEntries([page])).toBe(true);
    expect(loadJournalEntries()[0].text).toBe('hello');
    const exported = exportJournalText([page]);
    expect(exported).toContain('Solace journal');
    expect(exported).toContain('kept on this device');
    expect(exported).toContain('hello');
  });

  it('labels invalid dates as undated', () => {
    expect(formatJournalStamp('not-a-date')).toBe('undated');
  });
});
