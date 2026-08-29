import type { TargetAndTransition } from 'framer-motion';
import type { ElementMotion, LogoMotion } from './types';

/**
 * Fill in where each animated value starts.
 *
 * Framer Motion writes svg values as attributes, not only as styles. On the
 * first render, before it holds a value of its own, an animated attribute is
 * written out as the literal string "undefined" — `opacity="undefined"`,
 * `r="undefined"` — and the browser rejects the attribute and drops the shape.
 * The only sign is a console message, so a decoration can go missing without
 * anything on the screen saying why.
 *
 * A keyframe list already says where it starts: it is the first keyframe. This
 * copies that into `initial` so every pattern gets it without having to
 * remember, and so a new pattern cannot forget.
 *
 * A pattern that sets its own `initial` keeps it. `reveal` does, because it
 * starts somewhere other than its first keyframe on purpose.
 */
function withStartValues(motion?: ElementMotion): ElementMotion | undefined {
    if (!motion?.animate || motion.initial) return motion;

    const start: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(motion.animate)) {
        if (Array.isArray(value) && value.length > 0) start[key] = value[0];
    }

    if (Object.keys(start).length === 0) return motion;
    return { ...motion, initial: start as TargetAndTransition };
}

export function normaliseMotion(motion: LogoMotion): LogoMotion {
    return {
        ...motion,
        leftDot: withStartValues(motion.leftDot),
        rightDot: withStartValues(motion.rightDot),
        ring: withStartValues(motion.ring),
        // Letters need this more than anything else does. A pattern that
        // staggers six of them writes six keyframe lists, and one missing
        // starting value there is a letter rendered with transform="undefined"
        // — the browser drops it, so the word loses a letter and nothing on the
        // screen says which pattern did it.
        letters: motion.letters?.map((letter) => withStartValues(letter) ?? letter),
    };
}
