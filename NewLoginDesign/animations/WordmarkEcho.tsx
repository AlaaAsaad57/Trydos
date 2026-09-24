import { motion } from 'framer-motion';
import type { LogoGeometry } from './geometry';
import type { ElementMotion } from './types';

/**
 * WordmarkEcho — a coloured shadow of the word, painted behind the mark.
 *
 * The problem it solves
 * ---------------------
 * The wordmark is the third element of the logo, next to the dots and the
 * ring, so a pattern that leaves it out is only animating two thirds of the
 * mark. But no pattern may transform, stroke, filter or recolour the glyphs —
 * see the rules in README.md — and the one handle it does have, a clip path,
 * can only *hide* part of the word. A clip is right for an entrance, where the
 * word is uncovered once and then left alone. It is wrong for a loop, because
 * a loop would have to hide the word again on every pass.
 *
 * So this takes the other road. It paints a second copy of the same glyph
 * outline *behind* the real one and animates that. The real letters are never
 * touched: they are the same `<path>` with the same fill, sitting on top. What
 * moves is a tinted ghost that shows only where it sticks out from behind the
 * letters — a couple of px of colour along one edge.
 *
 * Both the outline and its transform come from `geometry.ts`, which is also
 * where the component reads them, so the ghost cannot drift off the letters.
 *
 * Keep it quiet. Around 1-2px of offset and 10-20% opacity reads as depth. Much
 * more than that stops looking like a shadow and starts looking like a printing
 * plate out of register, which on a logo is damage rather than motion.
 */
export function WordmarkEcho({
    geo,
    tint,
    motion: props,
}: {
    geo: LogoGeometry;
    tint: string;
    /** Must carry its own `initial` — see rule 5b in README.md. */
    motion: ElementMotion;
}) {
    return (
        <motion.g
            data-logo-decoration="wordmark-echo"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', pointerEvents: 'none', ...props.style }}
            initial={props.initial}
            animate={props.animate}
            transition={props.transition}
        >
            <path d={geo.wordmarkPath} transform={geo.wordmarkTransform} fill={tint} />
        </motion.g>
    );
}
