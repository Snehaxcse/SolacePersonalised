import type { SanctuaryType } from './sanctuaries';

// Scoring map for each question
// Each entry: [questionIndex, answerIndex] → { sanctuary: score }
type SanctuaryKey = 'STUDIO' | 'LIBRARY' | 'GARDEN' | 'ARCADE';

interface ScoreMap {
  [key: string]: { [sanctuary in SanctuaryKey]?: number };
}

const SCORE_MAP: ScoreMap = {
  // Q1: How are you feeling right now?
  'q0_a0': { GARDEN: 3, LIBRARY: 1 },       // Stormy
  'q0_a1': { LIBRARY: 2, GARDEN: 1 },       // Cloudy
  'q0_a2': { STUDIO: 2, ARCADE: 1 },        // Partly Sunny
  'q0_a3': { ARCADE: 3, STUDIO: 1 },        // Clear

  // Q2: What does calm feel like to you?
  'q1_a0': { GARDEN: 3 },                   // Silence
  'q1_a1': { LIBRARY: 2, ARCADE: 1 },       // Gentle noise
  'q1_a2': { STUDIO: 3 },                   // Creating
  'q1_a3': { ARCADE: 3 },                   // Moving

  // Q3: What do you naturally reach for when overwhelmed?
  'q2_a0': { ARCADE: 2, GARDEN: 1 },        // Music
  'q2_a1': { STUDIO: 3 },                   // Drawing/writing
  'q2_a2': { LIBRARY: 3 },                  // Reading
  'q2_a3': { LIBRARY: 2 },                  // Talking
  'q2_a4': { GARDEN: 3 },                   // Quiet

  // Q4: How does your mind work at its best?
  'q3_a0': { LIBRARY: 3 },                  // Focused
  'q3_a1': { ARCADE: 2, STUDIO: 1 },        // Jumping
  'q3_a2': { STUDIO: 3 },                   // Hands
  'q3_a3': { LIBRARY: 2, GARDEN: 1 },       // Listening

  // Q5: What kind of space feels safest?
  'q4_a0': { LIBRARY: 3 },                  // Cozy/enclosed
  'q4_a1': { GARDEN: 2 },                   // Open/airy
  'q4_a2': { GARDEN: 3 },                   // Nature
  'q4_a3': { STUDIO: 3 },                   // Create

  // Q6: When something is bothering you, you prefer to:
  'q5_a0': { GARDEN: 3 },                   // Sit quietly
  'q5_a1': { STUDIO: 3 },                   // Express creatively
  'q5_a2': { LIBRARY: 2 },                  // Talk through
  'q5_a3': { ARCADE: 3 },                   // Distract gently

  // Q7: What brings you the most joy?
  'q6_a0': { STUDIO: 3 },                   // Beautiful
  'q6_a1': { ARCADE: 2, LIBRARY: 1 },       // Problem
  'q6_a2': { LIBRARY: 2, GARDEN: 1 },       // Connecting
  'q6_a3': { LIBRARY: 3 },                  // Learning

  // Q8: Right now, what do you need most?
  'q7_a0': { STUDIO: 3 },                   // Create
  'q7_a1': { GARDEN: 3 },                   // Breathe
  'q7_a2': { ARCADE: 2, LIBRARY: 1 },       // Focus
  'q7_a3': { GARDEN: 3, LIBRARY: 1 },       // Exist
};

export type { SanctuaryType };

export function calculateSanctuary(answers: (number | null)[]): SanctuaryType {
  const scores: { [k in SanctuaryKey]: number } = { STUDIO: 0, LIBRARY: 0, GARDEN: 0, ARCADE: 0 };

  answers.forEach((answer, qIndex) => {
    if (answer === null) return;
    const key = `q${qIndex}_a${answer}`;
    const contributions = SCORE_MAP[key];
    if (!contributions) return;
    (Object.keys(contributions) as SanctuaryKey[]).forEach(s => {
      scores[s] += contributions[s] ?? 0;
    });
  });

  // Tie-breaking: GARDEN > LIBRARY > STUDIO > ARCADE
  const tieOrder: SanctuaryKey[] = ['GARDEN', 'LIBRARY', 'STUDIO', 'ARCADE'];
  const maxScore = Math.max(...Object.values(scores));
  for (const s of tieOrder) {
    if (scores[s] === maxScore) {
      return s.toLowerCase() as SanctuaryType;
    }
  }
  return 'garden';
}

export function getWeatherFromAnswer(answer: number | null): string {
  if (answer === 0) return 'stormy';
  if (answer === 1) return 'cloudy';
  if (answer === 2) return 'partly sunny';
  return 'clear';
}
