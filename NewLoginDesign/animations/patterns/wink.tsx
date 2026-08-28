import type { LogoMotion, PatternContext } from '../types';

/**
 * 1 — Buddy Wink. Motion language: character animation.
 *
 * The two dots read as a pair of eyes, so they behave like eyes. Two layers
 * run at once and never fight, because they use different properties:
 *
 *   idle    x / y      a slow 7s look-around, both eyes together, ±1.2px
 *   blink   scaleY     driven from a timer, 110ms shut, spring back open
 *
 * The blink is short on purpose. A blink that takes longer than about 150ms
 * stops reading as a blink and starts reading as "sleepy".
 */
export function winkPattern({ variant, blink }: PatternContext): LogoMotion {
    // 2.8px is a quarter of the dot's own radius: small enough to read as a
    // glance, big enough to actually see at the size the badge is drawn.
    const idle = {
        x: [0, 2.8, 0, -2.8, 0],
        y: [0, -1.8, 0, 1.4, 0],
    };
    const idleTransition = {
        x: { duration: 5, ease: 'easeInOut' as const, repeat: Infinity },
        y: { duration: 5, ease: 'easeInOut' as const, repeat: Infinity },
        scaleY: { type: 'spring' as const, stiffness: 900, damping: 32 },
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
