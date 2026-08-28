import type { LogoMotion, PatternContext } from '../types';

/**
 * 2 — Drop and Bounce. Motion language: gravity and weight.
 *
 * The dots fall in, land, bounce twice with a shrinking height, then hold
 * still for two seconds before the loop starts again. Three details make it
 * read as weight rather than as a wobble:
 *
 *   1. Fall is fast (easeIn), rise is slow (easeOut). Real gravity does this.
 *   2. Squash on landing keeps its volume — scaleY down, scaleX up by the
 *      matching amount — so the dot never looks like it changed size.
 *   3. The right dot starts 120ms later. Two identical dots landing on the
 *      same frame look like one object; the offset gives them each a weight.
 *
 * The dots leave the top of the viewBox during the fall, so the pattern asks
 * for `overflowVisible`. Without it the svg would cut the dot in half.
 */
export function bouncePattern({ variant }: PatternContext): LogoMotion {
    const keyframes = {
        y: [-26, -26, 0, -9, 0, -3, 0, 0],
        scaleY: [1, 1, 0.76, 1, 0.9, 1, 1, 1],
        scaleX: [1, 1, 1.2, 1, 1.08, 1, 1, 1],
    };

    // 0.00 hold above   0.06 release   0.30 first landing   0.48 apex
    // 0.62 second landing   0.74 apex   0.82 rest   1.00 loop
    const times = [0, 0.06, 0.3, 0.48, 0.62, 0.74, 0.82, 1];
    const ease = ['linear', 'easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn', 'linear'] as const;

    const transition = (delay: number) => ({
        duration: 3.4,
        times,
        ease: [...ease],
        repeat: Infinity,
        delay,
    });

    return {
        overflowVisible: true,
        leftDot: { animate: keyframes, transition: transition(0) },
        rightDot: { animate: keyframes, transition: transition(0.12) },
        // The ring takes the hit of the landing and settles back.
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { scale: [1, 1, 0.985, 1, 0.995, 1, 1, 1] },
                      transition: transition(0),
                  }
                : undefined,
    };
}
