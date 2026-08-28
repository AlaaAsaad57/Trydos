import { motion } from 'framer-motion';
import { ringCircumference } from '../geometry';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 8 — Cinematic Assembly. Motion language: an entrance, played once.
 *
 * The mark builds itself in three beats, then stops for good:
 *
 *   0.00s  the ring draws itself round, anti-clockwise from the top
 *   0.30s  the wordmark is wiped in from the left
 *   0.95s  the two dots drop in on a spring, 80ms apart
 *
 * The wordmark is not "drawn" by stroking the letters and animating a dash.
 * That trick is everywhere, and on this mark it is wrong: it needs a stroke
 * added to a fill-only glyph, and a 1.5px stroke on a 176px logo thickens every
 * letter and closes up the counters — the holes inside the d and the o. This
 * uses a clip path instead. A clip only ever hides part of the artwork and
 * hands the rest back exactly as drawn, so at every frame of the wipe the
 * letters that are showing are the real letters.
 *
 * The ring is treated the same way: it is masked by a growing arc, not redrawn.
 *
 * Nothing repeats. When the last spring settles the mark is pixel-identical to
 * the static logo. It plays again when the logo mounts again, which on the auth
 * flow means once per screen the shopper walks into.
 */
export function revealPattern({ variant, geo, uid }: PatternContext): LogoMotion {
    const clipId = `${uid}-reveal-wipe`;
    const w = geo.wordmark;
    const isBadge = variant === 'badge-ring' && geo.ring !== null;

    const wipeDelay = isBadge ? 0.3 : 0.15;
    const dropDelay = isBadge ? 0.95 : 0.75;

    const wipe = (
        <clipPath id={clipId}>
            <motion.rect
                x={w.x - 3}
                y={w.y - 4}
                height={w.height + 8}
                // Static width as well: the first render has no animation value
                // yet, and width="undefined" is rejected.
                width={0}
                initial={{ width: 0 }}
                animate={{ width: w.width + 6 }}
                transition={{ duration: 0.85, delay: wipeDelay, ease: [0.22, 1, 0.36, 1] }}
            />
        </clipPath>
    );

    const drop = (delay: number) => ({
        initial: { y: -16, scale: 0.5, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1 },
        transition: {
            type: 'spring' as const,
            stiffness: 340,
            damping: 17,
            delay,
        },
    });

    const dots = {
        leftDot: drop(dropDelay),
        rightDot: drop(dropDelay + 0.08),
    };

    if (!isBadge || !geo.ring) {
        return { overflowVisible: true, defs: wipe, wordmarkClipId: clipId, ...dots };
    }

    const { cx, cy, r } = geo.ring;
    const c = ringCircumference(geo);
    const maskId = `${uid}-reveal-ring`;

    return {
        overflowVisible: true,
        defs: (
            <>
                {wipe}
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.width} height={geo.height}>
                    <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="#fff"
                        // 5 is wider than the ring's own dots (diameter 1.876),
                        // so the mask never shaves one in half as it passes.
                        strokeWidth={5}
                        strokeDasharray={c}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        initial={{ strokeDashoffset: c }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
                    />
                </mask>
            </>
        ),
        wordmarkClipId: clipId,
        ringMaskId: maskId,
        ...dots,
    };
}
