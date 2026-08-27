import { beforeEach, describe, expect, it } from 'vitest';
import { installMemoryStorage } from '../test/memoryStorage';
import { parseCompanionProxyPayload, readHeldNotes, writeHeldNote } from './companionService';

describe('parseCompanionProxyPayload', () => {
  it('reads a valid companion reply', () => {
    expect(parseCompanionProxyPayload({
      text: 'I am here.',
      crisis: true,
      offer: 'garden',
    })).toEqual({
      text: 'I am here.',
      crisis: true,
      offer: 'garden',
    });
  });

  it('treats missing crisis as false and drops unknown offers', () => {
    expect(parseCompanionProxyPayload({
      text: 'okay',
      offer: 'waiting-room',
    })).toEqual({
      text: 'okay',
      crisis: false,
      offer: null,
    });
  });

  it('throws on payloads without a text string', () => {
    expect(() => parseCompanionProxyPayload(null)).toThrow('Invalid proxy response');
    expect(() => parseCompanionProxyPayload({ error: 'unavailable' })).toThrow('Invalid proxy response');
    expect(() => parseCompanionProxyPayload({ text: 12 })).toThrow('Invalid proxy response');
  });
});

describe('held notes', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('ignores malformed session storage and keeps new notes on this device', () => {
    window.sessionStorage.setItem('solace_companion_held', '{');
    expect(readHeldNotes()).toEqual([]);
    const notes = writeHeldNote('keep this');
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe('keep this');
    expect(readHeldNotes()[0].text).toBe('keep this');
  });
});
