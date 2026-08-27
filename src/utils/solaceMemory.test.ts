import { beforeEach, describe, expect, it } from 'vitest';
import { installMemoryStorage } from '../test/memoryStorage';
import {
  PLANT_PROGRESS_KEY,
  SUGGESTED_SANCTUARY_KEY,
  clampProgress,
  progressToStage,
  readPlantProgress,
  readQuizWeather,
  readSuggestedSanctuary,
  saveQuizWeatherFromAnswers,
  saveSuggestedSanctuary,
} from './solaceMemory';

describe('garden progress helpers', () => {
  it('clamps progress to 0–4', () => {
    expect(clampProgress(-2)).toBe(0);
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(4.8)).toBe(4);
    expect(clampProgress(2.25)).toBe(2.25);
  });

  it('maps progress to exclusive plant stages', () => {
    expect(progressToStage(0)).toBe(0);
    expect(progressToStage(0.75)).toBe(0);
    expect(progressToStage(1)).toBe(1);
    expect(progressToStage(2.9)).toBe(2);
    expect(progressToStage(3)).toBe(3);
    expect(progressToStage(4)).toBe(4);
  });
});

describe('localStorage memory helpers', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('reads a suggested sanctuary and ignores malformed values', () => {
    saveSuggestedSanctuary('library');
    expect(readSuggestedSanctuary()).toBe('library');
    window.localStorage.setItem(SUGGESTED_SANCTUARY_KEY, 'not-a-room');
    expect(readSuggestedSanctuary()).toBeNull();
    window.localStorage.setItem(SUGGESTED_SANCTUARY_KEY, '{');
    expect(readSuggestedSanctuary()).toBeNull();
  });

  it('stores quiz weather from the first answer', () => {
    saveQuizWeatherFromAnswers([0, 2, 1]);
    expect(readQuizWeather()).toBe('stormy');
  });

  it('reads plant progress, falling back from a numeric stage when needed', () => {
    window.localStorage.setItem(PLANT_PROGRESS_KEY, '2.5');
    expect(readPlantProgress()).toBe(2.5);
    window.localStorage.removeItem(PLANT_PROGRESS_KEY);
    window.localStorage.setItem('solace_plant_stage', '3');
    expect(readPlantProgress()).toBe(3);
    window.localStorage.setItem(PLANT_PROGRESS_KEY, 'nope');
    expect(readPlantProgress(1)).toBe(1);
  });
});
