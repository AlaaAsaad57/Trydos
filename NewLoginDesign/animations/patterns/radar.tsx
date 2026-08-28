import { motion } from 'framer-motion';
import { BADGE_RING_PATH } from '../../logoPaths';
import { ringCircumference } from '../geometry';
import { Spin } from '../Spin';
import { lighten } from '../color';
import type { LogoMotion, PatternContext } from '../types';

const SWEEP = 2.8;
const WEDGE_DEGREES = 52;

/**
 * 6 — Radar Sweep. Motion language: instruments and precision.
 *
 * Where the comet is one bright object moving, the radar is a machine doing a
 * job: a wedge turns at a fixed rate, a ping goes out once per turn, and each
 * dot answers on the frame the sweep reaches it. Nothing here uses a spring or
 * an ease-out. Linear timing is the point — instruments do not accelerate.
 *
 * The dot answer times are worked out from where the dots actually sit, not
 * guessed: the left dot is 245 degrees round from the sweep's start and the
 * right one is 295, which is 0.68 and 0.82 of a turn.
 *
 * The wedge and the ring highlight both turn through `Spin`, which pivots on a
 * point you name. Rotating them with a plain `transform-origin` put the pivot
 * inside the letters and threw the wedge across the mark — see Spin.tsx.
 *
 * Header: no ring, so the sweep becomes a scan line crossing the mark, and the
 * dots answer as it reaches each of them. Same machine, flat instead of round.
 */
export function radarPattern({ variant, geo, uid, ringColor, dotColor }: PatternContext): LogoMotion {
    const gradientId = `${uid}-radar-fade`;

    const ping = (at: number) => ({
        animate: { scale: [1, 1, 1.14, 1, 1] },
        transition: {
            duration: SWEEP,
            times: [0, at, Math.min(at + 0.05, 0.95), Math.min(at + 0.16, 0.99), 1],
            ease: 'easeOut' as const,
            repeat: Infinity,
        },
    });

    if (variant !== 'badge-ring' || !geo.ring) {
        const travel = geo.width + 20;
        const band = geo.dotR * 2 + 4;

        return {
            defs: (
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={dotColor} stopOpacity="0" />
                    <stop offset="100%" stopColor={dotColor} stopOpacity="0.8" />
                </linearGradient>
            ),
            behind: (
                <motion.rect
                    data-logo-decoration="radar-scan"
                    x={-26}
                    y={-2}
                    width={26}
                    height={band}
                    fill={`url(#${gradientId})`}
                    style={{ pointerEvents: 'none' }}
                    initial={{ x: -26 }}
                    animate={{ x: [-26, travel, travel] }}
                    transition={{
                        duration: SWEEP,
                        times: [0, 0.62, 1],
                        ease: 'linear',
                        repeat: Infinity,
                    }}
                />
            ),
            leftDot: ping(0.11),
            rightDot: ping(0.21),
        };
    }

    const { cx, cy, r } = geo.ring;
    const c = ringCircumference(geo);
    const maskId = `${uid}-radar-edge`;
    const rad = (WEDGE_DEGREES * Math.PI) / 180;
    // Wedge trails behind the leading edge, which sits at 3 o'clock and turns
    // clockwise. Sweep flag 0 walks the arc anti-clockwise, i.e. backwards.
    const wedge = `M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx + r * Math.cos(-rad)} ${cy + r * Math.sin(-rad)} Z`;

    return {
        defs: (
            <>
                <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1={cx + r}
                    y1={cy}
                    x2={cx + r * Math.cos(-rad)}
                    y2={cy + r * Math.sin(-rad)}
                >
                    <stop offset="0%" stopColor={ringColor} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={ringColor} stopOpacity="0" />
                </linearGradient>
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.width} height={geo.height}>
                    <Spin cx={cx} cy={cy} radius={r + 4} seconds={SWEEP}>
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke="#fff"
                            strokeWidth={4}
                            strokeDasharray={`${(c * WEDGE_DEGREES) / 360} ${c - (c * WEDGE_DEGREES) / 360}`}
                            transform={`rotate(${-WEDGE_DEGREES} ${cx} ${cy})`}
                        />
                    </Spin>
                </mask>
            </>
        ),
        behind: (
            <g data-logo-decoration="radar" style={{ pointerEvents: 'none' }}>
                <motion.circle
                    cx={cx}
                    cy={cy}
                    // Static r as well as the animated one: the first render has
                    // no animation value yet, and r="undefined" is rejected by
                    // the browser, which then drops the circle.
                    r={6}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={1.8}
                    opacity={0}
                    initial={{ r: 6, opacity: 0.45 }}
                    animate={{ r: [6, r], opacity: [0.45, 0] }}
                    transition={{ duration: SWEEP, ease: 'easeOut', repeat: Infinity }}
                />
                <Spin cx={cx} cy={cy} radius={r + 4} seconds={SWEEP}>
                    <path d={wedge} fill={`url(#${gradientId})`} />
                </Spin>
            </g>
        ),
        ringOverlay: (
            <path
                data-logo-decoration="radar-ring"
                d={BADGE_RING_PATH}
                transform="translate(-0.004 0)"
                fill={lighten(ringColor, 0.7)}
                mask={`url(#${maskId})`}
                style={{ pointerEvents: 'none' }}
            />
        ),
        leftDot: ping(0.68),
        rightDot: ping(0.82),
    };
}
