import { describe, expect, it } from 'vitest';
import { calculateSanctuary, getWeatherFromAnswer } from './scoringAlgorithm';

describe('calculateSanctuary', () => {
  it('breaks all-zero ties toward garden', () => {
    expect(calculateSanctuary([null, null, null, null, null, null, null, null])).toBe('garden');
  });

  it('maps a studio-leaning set of answers to studio', () => {
    expect(calculateSanctuary([2, 2, 1, 2, 3, 1, 0, 0])).toBe('studio');
  });

  it('maps a library-leaning set of answers to library', () => {
    expect(calculateSanctuary([1, 1, 2, 0, 0, 2, 3, 2])).toBe('library');
  });

  it('maps an arcade-leaning set of answers to arcade', () => {
    expect(calculateSanctuary([3, 3, 0, 1, 1, 3, 1, 2])).toBe('arcade');
  });

  it('maps a garden-leaning set of answers to garden', () => {
    expect(calculateSanctuary([0, 0, 4, 3, 2, 0, 2, 1])).toBe('garden');
  });
});

describe('getWeatherFromAnswer', () => {
  it('maps the first-question answers to weather labels', () => {
    expect(getWeatherFromAnswer(0)).toBe('stormy');
    expect(getWeatherFromAnswer(1)).toBe('cloudy');
    expect(getWeatherFromAnswer(2)).toBe('partly sunny');
    expect(getWeatherFromAnswer(3)).toBe('clear');
  });

  it('treats a missing answer as clear', () => {
    expect(getWeatherFromAnswer(null)).toBe('clear');
  });
});
