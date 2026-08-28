import { BADGE_RING_PATH } from '../../logoPaths';
import { ringCircumference } from '../geometry';
import { Spin } from '../Spin';
import { darken, lighten } from '../color';
import type { LogoMotion, PatternContext } from '../types';

const SPIN = 3.2;

/**
 * 5 — Comet Trail. Motion language: travelling light.
 *
 * A bright head with a fading tail runs around the mark. Nothing about the
 * mark itself moves — the light does. That is the whole idea, and it is the
 * safest kind of motion there is for a logo, because the artwork is never
 * touched at all.
 *
 * Badge: the tail is three arcs of the same circle, laid over each other at
 * 1.0, 0.55 and 0.22 opacity and lengths 16, 44 and 86. Stacked, they read as
 * one trail that fades out behind the head, without needing a gradient along a
 * curve — which svg cannot do. The three arcs are the mask, and the thing
 * masked is the ring path, so only the ring's own dots light up, and the gaps
 * between them stay empty.
 *
 * The group turns anti-clockwise so the leading tip of the dash sits at the
 * start of the path, which is where the glowing head is parked.
 *
 * Header: there is no ring, so the comet orbits the dot pair instead. It is
 * drawn behind them, so it slips behind each dot as it passes and comes out
 * the other side. The pass gives the flat mark a sense of depth.
 *
 * Both spins go through `Spin`, which is the only thing here that pivots
 * reliably — see the note in Spin.tsx.
 */
export function cometPattern({ variant, geo, uid, ringColor, dotColor }: PatternContext): LogoMotion {
    const glowId = `${uid}-comet-glow`;
    const trailBlurId = `${uid}-comet-trail-blur`;

    const glowFilter = (
        <filter id={glowId} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    );

    if (variant !== 'badge-ring' || !geo.ring) {
        // Orbit radius 20 clears the dot centres, which sit 15.1 from the middle,
        // so the comet passes behind each dot rather than beside it.
        const cx = (geo.leftDot.x + geo.rightDot.x) / 2;
        const cy = geo.leftDot.y;
        const orbit = 20;

        return {
            overflowVisible: true,
            defs: glowFilter,
            behind: (
                <g data-logo-decoration="comet-orbit" style={{ pointerEvents: 'none' }}>
                    <Spin cx={cx} cy={cy} radius={orbit + 6} seconds={SPIN} clockwise={false}>
                        <circle
                            cx={cx + orbit}
                            cy={cy}
                            r={4.4}
                            fill={lighten(dotColor, 0.2)}
                            filter={`url(#${glowId})`}
                        />
                        <circle cx={cx + orbit} cy={cy} r={2.2} fill={dotColor} />
                    </Spin>
                </g>
            ),
        };
    }

    const { cx, cy, r } = geo.ring;
    const c = ringCircumference(geo);
    const maskId = `${uid}-comet-trail`;
    const arc = (length: number, opacity: number) => (
        <circle
            key={length}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#fff"
            strokeOpacity={opacity}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${length} ${c - length}`}
        />
    );

    return {
        defs: (
            <>
                {glowFilter}
                <filter id={trailBlurId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.4" />
                </filter>
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.width} height={geo.height}>
                    <Spin cx={cx} cy={cy} radius={r + 4} seconds={SPIN} clockwise={false}>
                        {arc(86, 0.22)}
                        {arc(44, 0.55)}
                        {arc(16, 1)}
                    </Spin>
                </mask>
            </>
        ),
        behind: (
            <g data-logo-decoration="comet-head" style={{ pointerEvents: 'none' }}>
                {/* The glow runs along the track, behind the ring. It is blurred
                    and soft, so it reads as light on the track rather than as a
                    solid arc, and the ring's own dots stay sharp on top of it. */}
                <Spin cx={cx} cy={cy} radius={r + 12} seconds={SPIN} clockwise={false}>
                    <g filter={`url(#${trailBlurId})`}>
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={lighten(ringColor, 0.15)}
                            strokeOpacity={0.5}
                            strokeWidth={9}
                            strokeLinecap="round"
                            strokeDasharray={`${70} ${c - 70}`}
                        />
                    </g>
                    <circle
                        cx={cx + r}
                        cy={cy}
                        r={5.5}
                        fill={lighten(ringColor, 0.2)}
                        filter={`url(#${glowId})`}
                    />
                </Spin>
            </g>
        ),
        ringOverlay: (
            <path
                data-logo-decoration="comet-ring"
                d={BADGE_RING_PATH}
                transform="translate(-0.004 0)"
                fill={darken(ringColor, 0.5)}
                mask={`url(#${maskId})`}
                style={{ pointerEvents: 'none' }}
            />
        ),
        // The head reaches the top of the badge a quarter of the way round, and
        // it comes at the top from the right, so the right dot answers first.
        leftDot: {
            animate: { scale: [1, 1, 1.1, 1, 1] },
            transition: { duration: SPIN, times: [0, 0.22, 0.29, 0.42, 1], ease: 'easeOut', repeat: Infinity },
        },
        rightDot: {
            animate: { scale: [1, 1, 1.1, 1, 1] },
            transition: { duration: SPIN, times: [0, 0.15, 0.22, 0.35, 1], ease: 'easeOut', repeat: Infinity },
        },
    };
}
