import { lighten } from '../color';
import { WordmarkEcho } from '../WordmarkEcho';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 2 — Hand-Off. Motion language: weight.
 *
 * One charge is passed from one dot to the other and back, for ever. A market
 * is things changing hands, so the mark does the same thing with the only two
 * objects it has.
 *
 * This is the one pattern in the set built on the animation principles rather
 * than on a curve. Every hand-off has four beats, and the whole thing lives or
 * dies on the fact that they are four different lengths:
 *
 *   anticipation  290ms   the thrower pulls back *away* from the catcher first
 *   throw          240ms   it stretches along its path and lets go
 *   impact          96ms   contact, and the catcher is knocked back on the
 *                          same frame — nothing waits its turn
 *   follow-through 430ms   both overshoot home and settle
 *
 * Then 900ms of complete stillness before the return pass. The stillness is
 * doing as much work as the motion: an accent only reads as an accent if there
 * is nothing either side of it.
 *
 * Volume is kept. A dot that stretches to 1.4 wide is squashed to 0.71 tall, so
 * 1.4 x 0.71 = 0.994 — the shape distorts, the amount of ink does not. This is
 * why the stretch reads as speed rather than as a shape getting bigger.
 *
 * At the peak of the throw the stretched dot reaches about 1.5px past the
 * catcher's edge. That overlap is deliberate: for four frames the two dots are
 * one bar, which is what makes it a hand-off rather than two dots moving near
 * each other.
 *
 * The word and the ring are in it too. The ghost behind the word is dragged a
 * little in the direction of the pass and settles late — secondary motion, the
 * lockup answering the impact instead of ignoring it. On the badge the ring
 * takes the impact as a 2% widening, the container absorbing a knock.
 */

const CYCLE = 4;

type Ease = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | [number, number, number, number];

/** One keyframe of a dot: where it is, what shape it is, how it got there. */
interface Beat {
    t: number;
    x: number;
    sx: number;
    sy: number;
    /** The easing used to *arrive* here. Ignored on the first beat. */
    ease: Ease;
}

/**
 * Merge two half-cycles into the full list a dot needs.
 *
 * Each dot throws once and catches once per cycle, half a cycle apart, and the
 * second half is the first half mirrored — same beats, opposite direction. So
 * the choreography is written once and the mirror is derived. Writing both
 * halves by hand is how the two passes end up subtly different lengths, which
 * reads as a mistake rather than as a rhythm.
 */
function fullCycle(first: Beat[], second: Beat[]): Beat[] {
    const mirrored = second.map((b) => ({ ...b, t: b.t + 0.5, x: -b.x }));
    const rest: Beat = { t: 1, x: 0, sx: 1, sy: 1, ease: 'linear' };
    const all = [...first, ...mirrored, rest].sort((a, b) => a.t - b.t);
    // A dot that starts mid-cycle still has to say where it is at t=0.
    if (all[0].t > 0) all.unshift({ t: 0, x: 0, sx: 1, sy: 1, ease: 'linear' });
    return all;
}

function toMotion(beats: Beat[]) {
    return {
        animate: {
            x: beats.map((b) => b.x),
            scaleX: beats.map((b) => b.sx),
            scaleY: beats.map((b) => b.sy),
        },
        transition: {
            duration: CYCLE,
            times: beats.map((b) => b.t),
            // One easing per segment. A single easing for the whole list is the
            // thing that makes a keyframed throw read as a slide: the pull-back
            // has to ease in, the throw has to accelerate, and the impact has to
            // stop dead. They cannot all be the same curve.
            ease: beats.slice(1).map((b) => b.ease),
            repeat: Infinity,
        },
    };
}

export function relayPattern({ geo, variant, dotColor }: PatternContext): LogoMotion {
    // Free space between the two dot edges. Everything below is a fraction of
    // it, so the choreography rescales itself if the artwork ever changes.
    const free = geo.rightDot.x - geo.leftDot.x - geo.dotR * 2;
    const travel = free * 0.61;
    const pullBack = free * 0.2;
    const recoil = free * 0.29;

    const throwBeats: Beat[] = [
        { t: 0, x: 0, sx: 1, sy: 1, ease: 'linear' },
        // Pull back before going forward. Without this the throw has no weight.
        { t: 0.06, x: -pullBack, sx: 0.88, sy: 1.12, ease: 'easeInOut' },
        // Accelerating into contact, then cut. Real throws do not ease out.
        { t: 0.11, x: travel, sx: 1.4, sy: 0.71, ease: 'easeIn' },
        { t: 0.13, x: travel * 0.62, sx: 0.93, sy: 1.06, ease: 'easeOut' },
        { t: 0.22, x: -pullBack * 0.35, sx: 1.04, sy: 0.97, ease: 'easeOut' },
        { t: 0.3, x: 0, sx: 1, sy: 1, ease: 'easeInOut' },
    ];

    const catchBeats: Beat[] = [
        { t: 0.11, x: 0, sx: 1, sy: 1, ease: 'linear' },
        // Knocked back on the frame of contact, not after it.
        { t: 0.13, x: recoil, sx: 1.2, sy: 0.84, ease: 'easeOut' },
        { t: 0.19, x: recoil * 0.35, sx: 0.94, sy: 1.05, ease: 'easeOut' },
        { t: 0.27, x: 0, sx: 1.02, sy: 0.98, ease: 'easeOut' },
        { t: 0.32, x: 0, sx: 1, sy: 1, ease: 'easeInOut' },
    ];

    // The left dot throws in the first half and catches in the second; the
    // right dot does the opposite. Same two lists, swapped.
    const leftDot = toMotion(fullCycle(throwBeats, catchBeats));
    const rightDot = toMotion(fullCycle(catchBeats, throwBeats));

    // The word lags the pass and arrives late — a heavy thing being pulled by a
    // light one. Impacts land at 0.13 and 0.63, the ghost peaks at 0.17 / 0.67.
    const echo: LogoMotion['behind'] = (
        <WordmarkEcho
            geo={geo}
            tint={lighten(dotColor, 0.42)}
            motion={{
                initial: { x: 0, opacity: 0.1 },
                animate: {
                    x: [0, 0, 1.7, 0, 0, 0, -1.7, 0, 0],
                    opacity: [0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1],
                },
                transition: {
                    duration: CYCLE,
                    times: [0, 0.12, 0.17, 0.34, 0.5, 0.62, 0.67, 0.84, 1],
                    ease: 'easeOut',
                    repeat: Infinity,
                },
            }}
        />
    );

    return {
        // The stretch and the squash both reach past the top of the box.
        overflowVisible: true,
        behind: echo,
        leftDot,
        rightDot,
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { scale: [1, 1, 1.022, 1, 1, 1, 1.022, 1, 1] },
                      transition: {
                          duration: CYCLE,
                          times: [0, 0.12, 0.145, 0.24, 0.5, 0.62, 0.645, 0.74, 1],
                          ease: 'easeOut',
                          repeat: Infinity,
                      },
                  }
                : undefined,
    };
}
