import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { maxPullIn } from '../geometry';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 3 — Magnetic Pull. Motion language: spring tension.
 *
 * The dots draw together until they almost touch, hold for a beat, then snap
 * apart, overshoot, and settle. The beat of stillness before the snap is what
 * sells it: tension needs time to build, or the release has nothing to release.
 *
 * How far they may travel is not a guessed number. `maxPullIn` works it out
 * from the real gap between the dots, so the two can never overlap, whatever
 * the variant.
 *
 * The field line is drawn behind the dots, so the only part of it anyone ever
 * sees is the piece crossing the gap. When the gap closes the line is hidden by
 * the dots themselves — no extra work needed to hide it.
 */
export function magnetPattern({ geo, dotColor, variant }: PatternContext): LogoMotion {
    const pull = maxPullIn(geo) * 0.9;
    const overshoot = 6.5;

    //        rest  pulled in  hold   snap   settle  rest
    const times = [0, 0.3, 0.44, 0.56, 0.72, 1];
    const transition: Transition = {
        duration: 3.4,
        times,
        ease: ['easeIn', 'linear', 'easeOut', 'easeInOut', 'linear'],
        repeat: Infinity,
    };

    const line = (
        <motion.line
            data-logo-decoration="magnet-field"
            x1={geo.leftDot.x}
            y1={geo.leftDot.y}
            x2={geo.rightDot.x}
            y2={geo.rightDot.y}
            stroke={dotColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="2 2.4"
            style={{ pointerEvents: 'none' }}
            initial={{ opacity: 0, strokeDashoffset: 0 }}
            animate={{ opacity: [0, 0.95, 0.95, 0, 0, 0], strokeDashoffset: [0, -17.6] }}
            transition={{
                opacity: transition,
                strokeDashoffset: { duration: 0.8, ease: 'linear', repeat: Infinity },
            }}
        />
    );

    return {
        behind: line,
        leftDot: {
            animate: {
                x: [0, pull, pull, -overshoot, 0, 0],
                scale: [1, 1, 1, 1.22, 1, 1],
            },
            transition,
        },
        rightDot: {
            animate: {
                x: [0, -pull, -pull, overshoot, 0, 0],
                scale: [1, 1, 1, 1.22, 1, 1],
            },
            transition,
        },
        // The ring takes the discharge: one flicker on the frame the dots part.
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { opacity: [1, 1, 1, 0.55, 1, 1], scale: [1, 1, 1, 1.02, 1, 1] },
                      transition,
                  }
                : undefined,
    };
}
