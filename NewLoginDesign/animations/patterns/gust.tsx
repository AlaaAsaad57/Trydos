import { Spin } from '../Spin';
import { lighten } from '../color';
import { ringCircumference } from '../geometry';
import { BADGE_RING_PATH } from '../../logoPaths';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 8 — Gust. Motion language: a wave through a row.
 *
 * A gust of wind crosses the mark from left to right in 900ms, once every 4
 * seconds. Everything it passes leans, lifts and settles — in order, never
 * together. The rest of the loop is calm.
 *
 * Why it needed the letters split
 * -------------------------------
 * A wave needs things in a row to travel along. Before the wordmark was cut
 * into one path per letter there was nothing in a row on this mark: two dots
 * and one word-shaped blob. Now there are six letters on the header lockup and
 * three on the badge, and the ring is about two hundred little dots bent into a
 * circle. Those are the two best wave surfaces the mark has, and this pattern
 * is built on both of them.
 *
 * The stagger is the whole trick. Each letter starts 60ms after the one to its
 * left, so on the header the far end is still rising while the near end has
 * begun to settle. Move them together and the word bounces, which reads as a
 * fault. Move them in sequence and it reads as wind.
 *
 * A letter leans by rotating, never by skewing. A skew is what wind does to a
 * flag, and it is also how a bad renderer fakes an italic — on a logo that is
 * damage. A rotation moves the letter and leaves the letterform exactly as the
 * design file drew it.
 */

const CYCLE = 4;
/** How long the gust takes to cross one letter, as a fraction of the cycle. */
const CROSS = 0.9 / CYCLE;
/** Gap between one letter starting and the next, as a fraction of the cycle. */
const STAGGER = 0.06 / CYCLE;
/**
 * A short calm before the gust arrives, as a fraction of the cycle.
 *
 * It is not only for the look. Without it the first letter's rest frame and the
 * top of the cycle land on the same time, and two keyframes at the same time
 * are not a hold — they are a step. Framer Motion accepts the list without
 * complaint and plays something other than what was written.
 */
const LEAD = 0.02;
/** 95ms, as a fraction of the 4s cycle — the same lid speed as `wink`. */
const LID = 0.02375;

/** Lean, in degrees. Small on purpose: past about 6 the word looks broken. */
const LEAN = 4;
/** Lift, in viewBox units. */
const LIFT = 2;

export function gustPattern({ geo, variant, dotColor, ringColor, uid, cycle = CYCLE }: PatternContext): LogoMotion {
    const tint = lighten(variant === 'badge-ring' ? ringColor : dotColor, 0.42);
    const maskId = `${uid}-gust-ring`;

    /**
     * One letter's whole cycle.
     *
     * Seven keyframes: rest, still-resting, leaning, past it, a small return
     * the other way, settled, rest. The second frame is what holds the letter
     * still until the gust reaches it, so one shared 4s clock produces the
     * stagger and no letter needs a transition of its own.
     *
     * The last keyframe equals the first, so the loop has no seam.
     */
    const letter = (index: number) => {
        // The last letter still has to finish inside the cycle, so the start is
        // capped rather than allowed to push the tail past 1.
        const start = Math.min(LEAD + index * STAGGER, 1 - CROSS - 0.02);
        return {
            animate: {
                rotate: [0, 0, LEAN, LEAN * 0.55, -LEAN * 0.22, 0, 0],
                y: [0, 0, -LIFT, -LIFT * 0.5, LIFT * 0.18, 0, 0],
                // A letter lifted by wind also travels a little downwind. Half
                // the lift: a letter that moves as far sideways as it rises
                // reads as sliding, not as being picked up.
                x: [0, 0, LIFT * 0.5, LIFT * 0.3, -LIFT * 0.1, 0, 0],
            },
            transition: {
                duration: cycle,
                times: [
                    0,
                    start,
                    start + CROSS * 0.35,
                    start + CROSS * 0.6,
                    start + CROSS * 0.85,
                    start + CROSS,
                    1,
                ],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
        };
    };

    /**
     * The eyes lean back, are pushed, and settle — then blink once after the
     * gust has gone by.
     *
     * They move before the letters do, because the gust reaches the top of the
     * mark first. Peak travel is 7.4, inside the header lockup's limit of about
     * 8.5, where the left dot's edge starts 12.6 from the left of the box.
     *
     * The squint is a squash, not a lid: `scaleY` down with a touch of `scaleX`
     * up. That is a dot being pressed by moving air. The blink afterwards is
     * the full 95ms lid, so it reads as a separate event rather than as the
     * squint ending.
     */
    const eye = {
        animate: {
            x: [0, -3.2, 7.4, 4.1, 0, 0, 0, 0],
            scaleY: [1, 0.78, 0.7, 0.86, 1, 0.08, 1, 1],
            scaleX: [1, 1.04, 1.06, 1.02, 1, 1, 1, 1],
        },
        transition: {
            duration: cycle,
            times: [0, 0.02, 0.07, 0.14, 0.2, 0.2 + LID, 0.2 + 2 * LID, 1],
            ease: 'easeOut' as const,
            repeat: Infinity,
        },
    };

    const letters = geo.letters.map((_, index) => letter(index));

    if (variant !== 'badge-ring') {
        // The eyes and the letters both rise past the top of their box.
        return { overflowVisible: true, leftDot: eye, rightDot: eye, letters };
    }

    /**
     * The same wave, running round the ring.
     *
     * Two arcs turn together: a long dim tail and a short bright head just
     * ahead of it. They are drawn as one stroked circle each, cut into a single
     * visible arc with `stroke-dasharray` — the on length is the arc, the off
     * length is the rest of the track — so the shape needs no path data of its
     * own and cannot drift.
     *
     * The pair is painted over the ring and masked to the ring's own artwork,
     * so what changes colour is the ring's little dots and the gaps between
     * them stay empty. A plain arc painted here without the mask would join the
     * dots up and quietly turn the dotted ring solid.
     */
    const track = ringCircumference(geo);
    const arc = (length: number, opacity: number, offset: number) => (
        <circle
            cx={geo.ring!.cx}
            cy={geo.ring!.cy}
            r={geo.ring!.r}
            fill="none"
            stroke={tint}
            // Wider than the ring dots are across (1.876), so the mask decides
            // the shape and this only decides the colour.
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${length} ${track - length}`}
            strokeDashoffset={offset}
            opacity={opacity}
        />
    );

    return {
        overflowVisible: true,
        defs: (
            <mask id={maskId}>
                {/* The ring's own artwork, filled white. It is the same string
                    the ring is drawn from, so the mask cannot fall out of
                    register with the thing it is masking. */}
                <path d={BADGE_RING_PATH} transform="translate(-0.004 0)" fill="#fff" />
            </mask>
        ),
        leftDot: eye,
        rightDot: eye,
        letters,
        ringOverlay: (
            <g
                data-logo-decoration="gust-ring"
                mask={`url(#${maskId})`}
                style={{ pointerEvents: 'none' }}
            >
                {/* One lap per cycle, so the wave reaches the top of the ring as
                    the gust reaches the letters. 0 to 360 closes the loop. */}
                <Spin cx={geo.ring!.cx} cy={geo.ring!.cy} radius={geo.ring!.r + 4} seconds={cycle}>
                    {arc(track * 0.24, 0.3, 0)}
                    {arc(track * 0.08, 0.95, -track * 0.24)}
                </Spin>
            </g>
        ),
        // The ring itself keeps turning underneath. One lap per 70 seconds is
        // slow enough not to compete with the gust, and 0 to 360 lands it back
        // exactly where it started.
        ring: {
            animate: { rotate: [0, 360] },
            transition: { duration: 70, ease: 'linear', repeat: Infinity },
        },
    };
}
