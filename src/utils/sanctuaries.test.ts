import { describe, expect, it } from 'vitest';
import {
  SANCTUARIES,
  SANCTUARY_IDS,
  isSanctuaryType,
  sanctuaryRoute,
} from './sanctuaries';

describe('sanctuary metadata', () => {
  it('covers exactly the four rooms', () => {
    expect([...SANCTUARY_IDS]).toEqual(['studio', 'library', 'garden', 'arcade']);
    expect(Object.keys(SANCTUARIES).sort()).toEqual([...SANCTUARY_IDS].sort());
  });

  it('validates known ids and rejects everything else', () => {
    expect(isSanctuaryType('garden')).toBe(true);
    expect(isSanctuaryType('studio')).toBe(true);
    expect(isSanctuaryType('companion')).toBe(false);
    expect(isSanctuaryType('')).toBe(false);
    expect(isSanctuaryType(null)).toBe(false);
    expect(isSanctuaryType(4)).toBe(false);
  });

  it('keeps routes, labels, and needs aligned for each room', () => {
    for (const id of SANCTUARY_IDS) {
      const meta = SANCTUARIES[id];
      expect(meta.id).toBe(id);
      expect(meta.route).toBe(sanctuaryRoute(id));
      expect(meta.route).toBe(`/sanctuary/${id}`);
      expect(meta.label.startsWith('the ')).toBe(true);
      expect(meta.need.length).toBeGreaterThan(8);
    }
  });
});
