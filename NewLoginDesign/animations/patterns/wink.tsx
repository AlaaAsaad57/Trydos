import type { LogoMotion, PatternContext } from '../types';

/**
 * 1 — Buddy Wink. Motion language: character animation.
 *
 * The two dots read as a pair of eyes, so they behave like eyes. Two layers
 * run at once and never fight, because they use different properties:
 *
 *   idle    x / y      a 6.4s curious look-around, both eyes together
 *   blink   scaleY     driven from a timer, 95ms shut, spring back open
 *
 * The look-around is built as darts and holds, not as one smooth sine. Real
 * eyes jump to a target in well under 100ms and then sit on it; a sine spends
 * every frame moving, which reads as drifting or as swaying, never as looking.
 * The `times` array below is what buys that: a glance takes 2% of the cycle to
 * travel (128ms) and then holds for 14-18% (0.9-1.2s). The hold is the part
 * that reads — a travel much over ~150ms stops being a glance and becomes a
 * slide.
 *
 * The blink is short on purpose. A blink that takes longer than about 150ms
 * stops reading as a blink and starts reading as "sleepy".
 */
export function winkPattern({ variant, blink }: PatternContext): LogoMotion {
    // Peak travel is 4.2, a little over a third of the dot's own radius
    // (11.32). Far enough that a glance is unmistakable at badge size, and
    // still well inside the gap between the two dots, so they never collide.
    //
    // Order of glances: right, far left, down-right, up-left, small right,
    // centre. Uneven on purpose — a there-and-back pair looks like a metronome.
    const idle = {
        x: [0, 0, 4.2, 4.2, -4.2, -4.2, 2.6, 2.6, -3.0, -3.0, 1.4, 1.4, 0, 0],
        y: [0, 0, -1.1, -1.1, -0.4, -0.4, 2.4, 2.4, -1.9, -1.9, 0.8, 0.8, 0, 0],
    };
    const idleTimes = [0, 0.1, 0.12, 0.3, 0.32, 0.5, 0.52, 0.66, 0.68, 0.82, 0.84, 0.94, 0.96, 1];
    const idleTransition = {
        x: { duration: 6.4, times: idleTimes, ease: 'easeInOut' as const, repeat: Infinity },
        y: { duration: 6.4, times: idleTimes, ease: 'easeInOut' as const, repeat: Infinity },
        scaleY: { type: 'spring' as const, stiffness: 1100, damping: 34 },
    };

    return {
        leftDot: {
            animate: { ...idle, scaleY: blink.left },
            transition: idleTransition,
        },
        rightDot: {
            animate: { ...idle, scaleY: blink.right },
            transition: idleTransition,
        },
        // An up-glance lifts the dot past the top of the viewBox — on the header
        // lockup the dot's top edge sits exactly on y=0 — so the svg has to be
        // allowed to paint outside its box, or the glance arrives flat-topped.
        overflowVisible: true,
        // One turn in 40 seconds. Too slow to watch, fast enough to feel awake.
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { rotate: [0, 360] },
                      transition: { duration: 40, ease: 'linear', repeat: Infinity },
                  }
                : undefined,
    };
}
