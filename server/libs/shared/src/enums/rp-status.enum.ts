/** ER2-806: opt-in RP presence status of a character. */
export enum RpStatus {
  /** In character, currently playing */
  IC = 'ic',
  /** Looking for RP */
  LFRP = 'lfrp',
  /** Online, but out of character */
  OOC = 'ooc',
}

export const RP_STATUSES: readonly RpStatus[] = Object.freeze([RpStatus.IC, RpStatus.LFRP, RpStatus.OOC]);
