import { motion } from 'framer-motion';
import { Spin } from '../Spin';
import { lighten } from '../color';
import { STAR } from '../shapes';
import type { LogoMotion, PatternContext } from '../types';

interface Seed {
    /** Where on the track, in degrees, and how far off it. */
    angle: number;
    radiusOffset: number;
    size: number;
    period: number;
    twinkle: number;
    delay: number;
}

// Fixed seeds, not random ones. Random values differ between the server render
// and the browser render, which makes React throw away the markup and rebuild
// it. They also make the animation impossible to review twice.
const SPARK_SEEDS: Seed[] = [
    { angle: 18, radiusOffset: 6, size: 4.2, period: 4.9, twinkle: 1.3, delay: 0 },
    { angle: 96, radiusOffset: -7, size: 3.1, period: 6.7, twinkle: 1.8, delay: 0.6 },
    { angle: 158, radiusOffset: 8.5, size: 4.8, period: 4, twinkle: 1.1, delay: 1.1 },
    { angle: 232, radiusOffset: -5, size: 3.5, period: 7.3, twinkle: 2, delay: 0.3 },
    { angle: 310, radiusOffset: 7, size: 3.9, period: 5.5, twinkle: 1.5, delay: 1.6 },
];

/**
 * 7 — Constellation. Motion language: ambient, premium, almost still.
 *
 * The other patterns ask to be watched. This one does not. Small sparkles drift
 * around the mark on mismatched periods — 4, 4.9, 5.5, 6.7 and 7.3 seconds — so
 * no two of them come back to the same place together, and the dots twinkle
 * underneath on a sixth period again.
 *
 * The periods used to run 28 to 52 seconds, which meant the eye could never
 * catch a repeat at all. They were shortened when the whole set was brought to
 * a 4 second cycle. The idea survives — the five still never line up — but be
 * honest about the cost: a patient viewer can now find the loop, which is
 * exactly what the long periods were there to prevent.
 *
 * Every sparkle sits behind the mark. On the badge that matters: the ring's own
 * dots stay crisp and fully saturated on top, and a sparkle passing the ring
 * reads as depth rather than as a smudge on the artwork.
 */
export function sparkPattern({ variant, geo, ringColor, dotColor }: PatternContext): LogoMotion {
    const tint = lighten(variant === 'badge-ring' ? ringColor : dotColor, 0.35);

    const sparkle = (key: string, x: number, y: number, s: Seed) => (
        <motion.g
            key={key}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ opacity: 0.1, scale: 0.5 }}
            animate={{ opacity: [0.1, 1, 0.25, 0.95, 0.1], scale: [0.5, 1.3, 0.75, 1.15, 0.5] }}
            transition={{
                duration: s.twinkle,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: s.delay,
            }}
        >
            <path d={STAR} transform={`translate(${x} ${y}) scale(${s.size})`} fill={tint} />
        </motion.g>
    );

    const dotTwinkle = (delay: number) => ({
        animate: { opacity: [1, 0.7, 1], scale: [1, 1.07, 1] },
        transition: { duration: 4, ease: 'easeInOut' as const, repeat: Infinity, delay },
    });

    if (variant !== 'badge-ring' || !geo.ring) {
        const cx = (geo.leftDot.x + geo.rightDot.x) / 2;
        const cy = geo.leftDot.y;
        return {
            overflowVisible: true,
            behind: (
                <g data-logo-decoration="spark-field" style={{ pointerEvents: 'none' }}>
                    {SPARK_SEEDS.map((s, i) => {
                        const rad = (s.angle * Math.PI) / 180;
                        const rx = 30 + s.radiusOffset;
                        const ry = 17 + s.radiusOffset * 0.5;
                        return sparkle(
                            `header-${i}`,
                            cx + rx * Math.cos(rad),
                            cy + ry * Math.sin(rad),
                            s,
                        );
                    })}
                </g>
            ),
            leftDot: dotTwinkle(0),
            rightDot: dotTwinkle(1.3),
        };
    }

    const { cx, cy, r } = geo.ring;

    return {
        behind: (
            <g data-logo-decoration="spark-field" style={{ pointerEvents: 'none' }}>
                {SPARK_SEEDS.map((s, i) => (
                    <Spin
                        key={`orbit-${i}`}
                        cx={cx}
                        cy={cy}
                        // Past the furthest sparkle: track + offset + its own size.
                        radius={r + 16}
                        seconds={s.period}
                        clockwise={i % 2 === 0}
                    >
                        <g transform={`rotate(${s.angle} ${cx} ${cy})`}>
                            {sparkle(`badge-${i}`, cx + r + s.radiusOffset, cy, s)}
                        </g>
                    </Spin>
                ))}
            </g>
        ),
        // Slow enough to stay ambient, quick enough to notice on a long screen.
        ring: {
            animate: { rotate: [0, 360] },
            transition: { duration: 45, ease: 'linear', repeat: Infinity },
        },
        leftDot: dotTwinkle(0),
        rightDot: dotTwinkle(1.3),
    };
}
