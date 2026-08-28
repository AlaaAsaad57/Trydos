import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Spin — turns its children about a point you name.
 *
 * Rotating a decoration about the middle of the badge sounds like one line of
 * css, and it is the one thing in this whole set that does not work the obvious
 * way. `transform-origin: 75px 75px` on an svg element is measured against the
 * *reference box* picked by `transform-box`, and the default reference box is
 * not the element. In practice the pivot lands somewhere else entirely: the
 * radar wedge swung around a point inside the letters instead of the middle of
 * the ring, and the comet head sat still at three o'clock instead of orbiting.
 *
 * `transform-box: fill-box` removes the guesswork, because it makes the
 * reference box the element's own bounding box, and `transform-origin: center`
 * is then exactly the middle of that box. The catch is that the middle of the
 * box is only the point we want if the box happens to be centred on it.
 *
 * So this component adds one invisible circle, centred on the pivot and wide
 * enough to contain everything else inside. That forces the bounding box to be
 * square and centred on the pivot, which makes `center` the pivot, exactly,
 * with no coordinate arithmetic to get wrong. The circle has no fill and no
 * stroke, so it paints nothing — including inside a `<mask>`, where a painted
 * shape would have changed what the mask lets through.
 *
 * `radius` must be at least as far as the furthest thing in `children`, or the
 * children push the box out of shape and the pivot drifts again.
 */
export function Spin({
    cx,
    cy,
    radius,
    seconds,
    clockwise = true,
    children,
}: {
    cx: number;
    cy: number;
    /** Must reach past the furthest child, or the pivot drifts. */
    radius: number;
    seconds: number;
    clockwise?: boolean;
    children: ReactNode;
}) {
    return (
        <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            // Keyframes, not a bare 360: a bare target does nothing if something
            // already put the element at 360, which is what server rendering does.
            initial={{ rotate: 0 }}
            animate={{ rotate: clockwise ? [0, 360] : [0, -360] }}
            transition={{ duration: seconds, ease: 'linear', repeat: Infinity }}
        >
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="none" />
            {children}
        </motion.g>
    );
}
