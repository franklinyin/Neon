import { getStaffBBox } from './SelectTools';

/**
 * Find the staff whose visual bbox is nearest to SVG-relative (x, y).
 */
export function findNearestStaff(x: number, y: number): SVGGElement | null {
  const staves = Array.from(document.querySelectorAll<SVGGElement>('.staff'));
  if (staves.length === 0) return null;

  let best: SVGGElement | null = null;
  let bestDist = Infinity;

  for (const staff of staves) {
    const bbox = getStaffBBox(staff);
    const cx = Math.max(bbox.ulx, Math.min(x, bbox.lrx));
    const cy = Math.max(bbox.uly, Math.min(y, bbox.lry));
    const dist = (x - cx) ** 2 + (y - cy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = staff;
    }
  }

  return best;
}

/**
 * Convert an SVG-/facsimile-relative y into a discrete staff @loc.
 * Verovio: loc 0 = bottom staff line; each +1 is one half staff-space up.
 *
 * Staff geometry comes from the rendered staff (itself placed from existing
 * MEI facsimile zones). Stage 1 assumes a standard 5-line staff (4 spaces).
 */
export function yToLoc(y: number, staff: SVGGElement): number {
  const bbox = getStaffBBox(staff);
  const staffSpace = (bbox.lry - bbox.uly) / 4;
  const halfSpace = staffSpace / 2;
  if (!Number.isFinite(staffSpace) || halfSpace === 0) {
    return NaN;
  }
  return Math.round((bbox.lry - y) / halfSpace);
}
