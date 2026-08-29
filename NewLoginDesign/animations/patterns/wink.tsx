import type { LogoMotion, PatternContext } from '../types';

/**
 * 1 — Buddy Wink. Motion language: character animation.
 *
 * The two dots read as a pair of eyes, so they behave like eyes. Two layers
 * run at once and never fight, because they use different properties:
 *
 *   idle    x / y      a 4.6s curious look-around, both eyes together
 *   blink   scaleY     driven from a timer, 95ms shut, spring back open
 *
 * The look-around is built as darts and holds, not as one smooth sine. Real
 * eyes jump to a target in well under 100ms and then sit on it; a sine spends
 * every frame moving, which reads as drifting or as swaying, never as looking.
 * The `times` array below is what buys that: a glance takes 2% of the cycle to
 * travel (92ms) and then holds for 6-16% (0.3-0.7s). The hold is the part that
 * reads — a travel much over ~150ms stops being a glance and becomes a slide.
 *
 * It is mostly left and right, and it is wide. An eye that glances a couple of
 * px is not glancing, it is trembling: at the size the header mark is drawn the
 * move has to be a real fraction of the dot to register at all. Vertical stays
 * small, because looking up and down reads as thinking, and this one is meant
 * to read as looking at something.
 *
 * The blink is short on purpose. A blink that takes longer than about 150ms
 * stops reading as a blink and starts reading as "sleepy".
 */
export function winkPattern({ variant, blink }: PatternContext): LogoMotion {
    // Peak travel is 9, four fifths of the dot's own radius (11.32). The limit
    // is the header lockup, where the left dot's edge starts 12.6 from the left
    // of the box: at 9 there is 3.6 of air left, and past about 12 the eye
    // leaves the artwork. Both dots always move together, so the pair can never
    // close on itself however far it goes.
    //
    // Six glances, five of them mostly sideways, none of them a there-and-back
    // pair — a glance that returns the way it came reads as a metronome. The
    // short one at 0.44 is a double-take: it lands near where the eye already
    // was, which is the thing that makes it look like it is deciding.
    const idle = {
        x: [0, 0, 9.0, 9.0, -9.0, -9.0, -4.5, -4.5, 8.2, 8.2, -6.0, -6.0, 3.0, 3.0, 0, 0],
        y: [0, 0, -0.6, -0.6, -0.3, -0.3, 1.8, 1.8, 0.4, 0.4, -1.2, -1.2, 1.4, 1.4, 0, 0],
    };
    const idleTimes = [
        0, 0.07, 0.09, 0.24, 0.26, 0.42, 0.44, 0.52, 0.54, 0.68, 0.7, 0.82, 0.84, 0.92, 0.94, 1,
    ];
    const idleTransition = {
        x: { duration: 4.6, times: idleTimes, ease: 'easeOut' as const, repeat: Infinity },
        y: { duration: 4.6, times: idleTimes, ease: 'easeOut' as const, repeat: Infinity },
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
