/** ER2-807: what a reaction is attached to. */
export enum ReactionTargetType {
  STORY = 'story',
  IMAGE = 'image',
}

/** ER2-807: fixed German reaction set. */
export enum ReactionKind {
  // Stories
  GAENSEHAUT = 'gaensehaut',
  MEHR_DAVON = 'mehr-davon',
  HERZSCHMERZ = 'herzschmerz',
  SPANNEND = 'spannend',
  // Images
  WUNDERSCHOEN = 'wunderschoen',
  STIMMUNGSVOLL = 'stimmungsvoll',
}

export const REACTION_TARGET_TYPES: readonly ReactionTargetType[] = Object.freeze([
  ReactionTargetType.STORY,
  ReactionTargetType.IMAGE,
]);

export const REACTION_KINDS_BY_TARGET: Readonly<{ [type in ReactionTargetType]: readonly ReactionKind[] }> = Object.freeze({
  [ReactionTargetType.STORY]: Object.freeze([
    ReactionKind.GAENSEHAUT,
    ReactionKind.MEHR_DAVON,
    ReactionKind.HERZSCHMERZ,
    ReactionKind.SPANNEND,
  ]),
  [ReactionTargetType.IMAGE]: Object.freeze([
    ReactionKind.WUNDERSCHOEN,
    ReactionKind.STIMMUNGSVOLL,
  ]),
});

/** German display labels */
export const REACTION_LABELS: Readonly<{ [kind in ReactionKind]: string }> = Object.freeze({
  [ReactionKind.GAENSEHAUT]: 'Gänsehaut',
  [ReactionKind.MEHR_DAVON]: 'Mehr davon',
  [ReactionKind.HERZSCHMERZ]: 'Herzschmerz',
  [ReactionKind.SPANNEND]: 'Spannend',
  [ReactionKind.WUNDERSCHOEN]: 'Wunderschön',
  [ReactionKind.STIMMUNGSVOLL]: 'Stimmungsvoll',
});

export function isReactionKindAllowed(targetType: ReactionTargetType, kind: string): kind is ReactionKind {
  return (REACTION_KINDS_BY_TARGET[targetType] || []).includes(kind as ReactionKind);
}
