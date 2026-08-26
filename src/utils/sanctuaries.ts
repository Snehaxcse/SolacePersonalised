export const SANCTUARY_IDS = ['studio', 'library', 'garden', 'arcade'] as const;

export type SanctuaryType = (typeof SANCTUARY_IDS)[number];

export interface SanctuaryMeta {
  id: SanctuaryType;
  label: string;
  need: string;
  route: string;
}

export const SANCTUARIES: Record<SanctuaryType, SanctuaryMeta> = {
  studio: {
    id: 'studio',
    label: 'the studio',
    need: 'I need to let something out.',
    route: '/sanctuary/studio',
  },
  library: {
    id: 'library',
    label: 'the library',
    need: 'I need somewhere quiet.',
    route: '/sanctuary/library',
  },
  garden: {
    id: 'garden',
    label: 'the garden',
    need: 'I need to slow down.',
    route: '/sanctuary/garden',
  },
  arcade: {
    id: 'arcade',
    label: 'the arcade',
    need: 'I need my mind somewhere else.',
    route: '/sanctuary/arcade',
  },
};

export const SANCTUARY_TYPES: SanctuaryType[] = [...SANCTUARY_IDS];

export const SANCTUARY_LABELS: Record<SanctuaryType, string> = {
  studio: SANCTUARIES.studio.label,
  library: SANCTUARIES.library.label,
  garden: SANCTUARIES.garden.label,
  arcade: SANCTUARIES.arcade.label,
};

export const SANCTUARY_NEEDS: Record<SanctuaryType, string> = {
  studio: SANCTUARIES.studio.need,
  library: SANCTUARIES.library.need,
  garden: SANCTUARIES.garden.need,
  arcade: SANCTUARIES.arcade.need,
};

export function isSanctuaryType(value: unknown): value is SanctuaryType {
  return value === 'studio' || value === 'library' || value === 'garden' || value === 'arcade';
}

export function sanctuaryRoute(type: SanctuaryType): string {
  return SANCTUARIES[type].route;
}
