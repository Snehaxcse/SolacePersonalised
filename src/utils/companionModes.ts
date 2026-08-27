export const COMPANION_MODES = ['listen', 'stay', 'untangle', 'step'] as const;

export type CompanionMode = (typeof COMPANION_MODES)[number];

export interface CompanionModeMeta {
  id: CompanionMode;
  title: string;
  prompt: string;
  opener: string;
}

export const COMPANION_MODE_META: Record<CompanionMode, CompanionModeMeta> = {
  listen: {
    id: 'listen',
    title: 'Just listen',
    prompt: 'I need somewhere to put this.',
    opener: "I'm here. Put it wherever you need.",
  },
  stay: {
    id: 'stay',
    title: 'Stay with me',
    prompt: "Help me understand what I'm feeling.",
    opener: 'We can stay with it. What feels closest right now?',
  },
  untangle: {
    id: 'untangle',
    title: 'Help me untangle it',
    prompt: 'Ask questions and help me think.',
    opener: 'We can take this slowly. What feels most tangled?',
  },
  step: {
    id: 'step',
    title: 'Help me take a step',
    prompt: "I'm ready to figure out what I can do.",
    opener: 'When you are ready, we can look at what might be possible.',
  },
};

export function isCompanionMode(value: unknown): value is CompanionMode {
  return value === 'listen' || value === 'stay' || value === 'untangle' || value === 'step';
}
