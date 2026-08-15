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
 * Convert an SVG-relative y into a discrete staff @loc.
 * Verovio: loc 0 = bottom staff line; each +1 is one half staff-space up.
 */
export function yToLoc(y: number, staff: SVGGElement): number {
  const bbox = getStaffBBox(staff);
  const lines = Math.max(staff.querySelectorAll('path').length, 2);
  const staffSpace = (bbox.lry - bbox.uly) / (lines - 1);
  const halfSpace = staffSpace / 2;
  return Math.round((bbox.lry - y) / halfSpace);
}
