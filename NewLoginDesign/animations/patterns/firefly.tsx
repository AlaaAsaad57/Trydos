import { motion } from 'framer-motion';
import { lighten } from '../color';
import { STAR } from '../shapes';
import type { LogoGeometry } from '../geometry';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 3 — Firefly. Motion language: character with a reason.
 *
 * A single sparkle drifts a slow lap around the mark, and the two eyes follow
 * it the whole way round.
 *
 * The point of it is the *motivation*. `wink` moves the eyes because eyes move;
 * this one moves them because there is something to look at, and that changes
 * how the same amount of travel reads. An eye that drifts 6px on its own looks
 * restless. An eye that turns 6px to keep a sparkle in sight looks like it is
 * paying attention — and the viewer can see why it moved, which is the whole
 * difference between animation and movement.
 *
 * It is also why this one is legible on a small screen where a bare idle is
 * not: the sparkle tells you where to look before the eyes do.
 *
 * The eyes are rigged the way cartoon eyes are rigged. Each dot's offset is the
 * *unit* vector towards the sparkle times a fixed reach, so it always points
 * dead at it and never tries to reach it. Both eyes are aimed separately, so
 * when the sparkle passes close they converge slightly — a real pair of eyes
 * crossing on something near. Nothing in the numbers below says "converge"; it
 * falls out of aiming two things at one point.
 *
 * Everything is sampled from one lap of one ellipse, so the loop is seamless by
 * construction: the last sample is the first sample.
 *
 * The sparkle is painted behind the mark, so it passes behind the letters and
 * comes out the other side. That is how the word takes part — it is what the
 * sparkle goes behind — without a glyph being touched.
 *
 * Two blinks per lap, at the two moments the sparkle is behind the word and
 * there is nothing to miss.
 */

const CYCLE = 4;
const SAMPLES = 48;
/** How far an eye turns. The limit is the header lockup, where the left dot's
 *  edge starts 12.6 from the left of the box. */
const REACH = 6.5;
const BLINK_SHUT = 0.08;
/** 95ms, as a fraction of the 4s cycle — the same blink length as `wink`. */
const LID = 0.02375;

/** The lap the sparkle flies. Inside the ring on the badge, round the lockup
 *  on the header. */
function track(geo: LogoGeometry) {
    if (geo.ring) {
        const inset = geo.ring.r - 7;
        return { cx: geo.ring.cx, cy: geo.ring.cy, rx: inset, ry: inset };
    }
    return {
        cx: geo.width / 2,
        cy: geo.height / 2,
        rx: geo.width / 2 - 12,
        ry: geo.height / 2 - 4,
    };
}

export function fireflyPattern({ geo, variant, dotColor, ringColor, cycle = CYCLE }: PatternContext): LogoMotion {
    const path = track(geo);
    const tint = lighten(variant === 'badge-ring' ? ringColor : dotColor, 0.28);

    const times: number[] = [];
    const flight: { x: number; y: number }[] = [];
    for (let i = 0; i <= SAMPLES; i += 1) {
        const t = i / SAMPLES;
        const a = 2 * Math.PI * t;
        times.push(t);
        flight.push({
            x: path.cx + path.rx * Math.cos(a),
            y: path.cy + path.ry * Math.sin(a),
        });
    }

    /** Aim one eye at the sparkle at every sample. */
    const aim = (dot: { x: number; y: number }) => {
        const x: number[] = [];
        const y: number[] = [];
        for (const f of flight) {
            const dx = f.x - dot.x;
            const dy = f.y - dot.y;
            // Guard the one case the maths cannot answer: a sparkle exactly on
            // the pupil has no direction, and 0/0 would write NaN into the
            // transform and freeze the dot where it stands.
            const len = Math.hypot(dx, dy) || 1;
            x.push((REACH * dx) / len);
            y.push((REACH * dy) / len);
        }
        return { x, y };
    };

    const look = (dot: { x: number; y: number }) => {
        const { x, y } = aim(dot);
        return {
            animate: {
                x,
                y,
                // Two blinks a lap, on their own clock. Sharing the sample grid
                // would round a 95ms lid up to a 146ms one.
                scaleY: [1, 1, BLINK_SHUT, 1, 1, BLINK_SHUT, 1, 1],
            },
            transition: {
                x: { duration: cycle, times, ease: 'linear' as const, repeat: Infinity },
                y: { duration: cycle, times, ease: 'linear' as const, repeat: Infinity },
                scaleY: {
                    duration: cycle,
                    times: [0, 0.3, 0.3 + LID, 0.3 + 2 * LID, 0.77, 0.77 + LID, 0.77 + 2 * LID, 1],
                    ease: 'easeOut' as const,
                    repeat: Infinity,
                },
            },
        };
    };

    return {
        overflowVisible: true,
        behind: (
            <g data-logo-decoration="firefly" style={{ pointerEvents: 'none' }}>
                <motion.g
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    initial={{ x: flight[0].x, y: flight[0].y }}
                    animate={{ x: flight.map((f) => f.x), y: flight.map((f) => f.y) }}
                    transition={{ duration: cycle, times, ease: 'linear', repeat: Infinity }}
                >
                    {/* Drawn at the origin and flown by the transform above, so
                        the flight path is written once rather than once per
                        shape. The twinkle runs on its own period on purpose —
                        3.1s against a 7s lap never lines up, so the sparkle
                        never brightens at the same point of the circuit twice. */}
                    <motion.path
                        d={STAR}
                        fill={tint}
                        transform="scale(3.4)"
                        initial={{ opacity: 0.35, scale: 0.7 }}
                        animate={{
                            opacity: [0.35, 1, 0.5, 0.95, 0.35],
                            scale: [0.7, 1.25, 0.85, 1.15, 0.7],
                        }}
                        transition={{ duration: 3.1, ease: 'easeInOut', repeat: Infinity }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                </motion.g>
            </g>
        ),
        leftDot: look(geo.leftDot),
        rightDot: look(geo.rightDot),
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { rotate: [0, 360] },
                      transition: { duration: 60, ease: 'linear', repeat: Infinity },
                  }
                : undefined,
    };
}
