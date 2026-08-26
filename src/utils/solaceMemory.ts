import { getWeatherFromAnswer, type SanctuaryType } from './scoringAlgorithm';

export type { SanctuaryType };

export const SUGGESTED_SANCTUARY_KEY = 'solace_sanctuary_type';
export const QUIZ_WEATHER_KEY = 'solace_quiz_weather';
export const PLANT_PROGRESS_KEY = 'solace_plant_progress';

export const SANCTUARY_TYPES: SanctuaryType[] = ['studio', 'library', 'garden', 'arcade'];

export const SANCTUARY_LABELS: Record<SanctuaryType, string> = {
  studio: 'the studio',
  library: 'the library',
  garden: 'the garden',
  arcade: 'the arcade',
};

export const SANCTUARY_NEEDS: Record<SanctuaryType, string> = {
  studio: 'I need to let something out.',
  library: 'I need somewhere quiet.',
  garden: 'I need to slow down.',
  arcade: 'I need my mind somewhere else.',
};

const WEATHERS = new Set(['stormy', 'cloudy', 'partly sunny', 'clear']);

export function isSanctuaryType(value: unknown): value is SanctuaryType {
  return value === 'studio' || value === 'library' || value === 'garden' || value === 'arcade';
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private mode / quota
  }
}

function parseMaybeJson(raw: string | null): unknown {
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function readSuggestedSanctuary(): SanctuaryType | null {
  const parsed = parseMaybeJson(readStorage(SUGGESTED_SANCTUARY_KEY));
  return isSanctuaryType(parsed) ? parsed : null;
}

export function saveSuggestedSanctuary(type: SanctuaryType): void {
  writeStorage(SUGGESTED_SANCTUARY_KEY, type);
}

export function readQuizWeather(): string | null {
  const parsed = parseMaybeJson(readStorage(QUIZ_WEATHER_KEY));
  return typeof parsed === 'string' && WEATHERS.has(parsed) ? parsed : null;
}

export function saveQuizWeatherFromAnswers(answers: (number | null)[]): void {
  const weather = getWeatherFromAnswer(answers[0] ?? null);
  if (!WEATHERS.has(weather)) return;
  writeStorage(QUIZ_WEATHER_KEY, JSON.stringify(weather));
}

export function readPlantProgress(fallbackStage?: unknown): number {
  const parsed = parseMaybeJson(readStorage(PLANT_PROGRESS_KEY));
  if (typeof parsed === 'number' && Number.isFinite(parsed)) {
    return clampProgress(parsed);
  }
  if (typeof fallbackStage === 'number' && Number.isFinite(fallbackStage)) {
    return clampProgress(fallbackStage);
  }
  const stageParsed = parseMaybeJson(readStorage('solace_plant_stage'));
  if (typeof stageParsed === 'number' && Number.isFinite(stageParsed)) {
    return clampProgress(stageParsed);
  }
  return 0;
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(4, Math.max(0, value));
}

export function progressToStage(progress: number): 0 | 1 | 2 | 3 | 4 {
  const n = Math.floor(clampProgress(progress));
  if (n <= 0) return 0;
  if (n >= 4) return 4;
  return n as 1 | 2 | 3;
}
