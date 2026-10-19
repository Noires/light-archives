/**
 * Same result as `a == b` for ids that may arrive as numbers or numeric strings
 * (unvalidated nested DTO values), without relying on loose equality.
 */
export function looseIdEquals(a: number | string | null | undefined, b: number | string | null | undefined): boolean {
  const aMissing = a === null || a === undefined;
  const bMissing = b === null || b === undefined;

  if (aMissing || bMissing) {
    return aMissing && bMissing;
  }

  return typeof a === typeof b ? a === b : Number(a) === Number(b);
}
