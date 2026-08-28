import { Spin } from '../Spin';
import { BADGE_RING_PATH } from '../../logoPaths';
import { lighten } from '../color';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 4 — Liquid Wave. Motion language: fluid, continuous, no corners.
 *
 * A sine wave passes through the mark from left to right. The right dot runs
 * the same keyframes as the left one, a third of a cycle later, so the pair
 * reads as one wave crossing them rather than two dots bobbing on their own.
 *
 * The squash keeps its volume: whenever scaleY drops by a factor, scaleX rises
 * by the same factor. That is what stops a soft wobble from looking like the
 * dot is growing and shrinking.
 *
 * On the badge the wave carries on into the ring. A pale band rotates inside a
 * mask, and the thing being masked is the ring path itself — so the ring's own
 * little dots brighten one after another and the gaps between them stay empty.
 * Painting a plain arc instead would turn the dotted ring into a solid one,
 * which is exactly the kind of quiet damage this whole set is built to avoid.
 */
export function wavePattern({ variant, geo, uid, ringColor }: PatternContext): LogoMotion {
    const cycle = 3.2;
    const keyframes = {
        y: [0, -5.2, 0, 5.2, 0],
        scaleY: [1, 0.86, 1, 1.14, 1],
        scaleX: [1, 1.163, 1, 0.877, 1],
    };
    const transition = (delay: number) => ({
        duration: cycle,
        ease: 'easeInOut' as const,
        repeat: Infinity,
        delay,
    });

    const dots = {
        leftDot: { animate: keyframes, transition: transition(0) },
        rightDot: { animate: keyframes, transition: transition(cycle / 3) },
    };

    if (variant !== 'badge-ring' || !geo.ring) return dots;

    const maskId = `${uid}-wave-band`;
    const gradientId = `${uid}-wave-gradient`;
    // Big enough that the band still covers the ring when it sits at 45 degrees.
    const span = geo.width * 2.2;
    const offset = (span - geo.width) / 2;

    return {
        ...dots,
        defs: (
            <>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="42%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="58%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.width} height={geo.height}>
                    <Spin cx={geo.ring.cx} cy={geo.ring.cy} radius={span / 2} seconds={cycle * 2}>
                        <rect
                            x={-offset}
                            y={-offset}
                            width={span}
                            height={span}
                            fill={`url(#${gradientId})`}
                        />
                    </Spin>
                </mask>
            </>
        ),
        ringOverlay: (
            <path
                data-logo-decoration="wave-ring"
                d={BADGE_RING_PATH}
                transform="translate(-0.004 0)"
                fill={lighten(ringColor, 0.72)}
                mask={`url(#${maskId})`}
                style={{ pointerEvents: 'none' }}
            />
        ),
    };
}
