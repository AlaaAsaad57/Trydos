/**
 * shapes.ts — decoration outlines shared between patterns.
 *
 * The mark's own artwork never lives here; that is `logoPaths.ts`, generated
 * from the design files. This is only for things a pattern draws itself, kept
 * in one place so two patterns cannot end up with two sparkles that are subtly
 * different shapes.
 */

/** A four-point sparkle, radius 1, centred on its own origin. */
export const STAR = 'M0,-1 Q0.2,-0.2 1,0 Q0.2,0.2 0,1 Q-0.2,0.2 -1,0 Q-0.2,-0.2 0,-1 Z';
