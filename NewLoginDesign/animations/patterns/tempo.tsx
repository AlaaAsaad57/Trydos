import { lighten } from '../color';
import { WordmarkEcho } from '../WordmarkEcho';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 5 — Downbeat. Motion language: staccato.
 *
 * Everything else in this set glides. This one does not move at all, then moves
 * in 58ms, then does not move again — and that is the point of it being here.
 * A picker of patterns that all ease is a picker of one pattern; a hard, held
 * step next to five smooth curves is a real choice.
 *
 * It is arranged rather than animated. One tempo drives the whole thing:
 *
 *   100 BPM  ->  beat 600ms  ->  eighth note 300ms  ->  two bars = 4.8s
 *
 * The 16 eighth-note slots of those two bars are the only times anything is
 * allowed to happen, and only six of them are used: 0, 3, 6, 8, 11, 14. That is
 * the tresillo — 3-3-2 — which is why it reads as a rhythm and not as a twitch.
 * Ten of the sixteen slots are silent.
 *
 *   slot 0, 8    downbeat: both dots take a 7% accent, the word's ghost knocks
 *                sideways, and on the badge the ring widens 2.8%
 *   slot 3, 11   off-beat: the right dot alone, sideways then up
 *   slot 6, 14   off-beat: the left dot alone, down then sideways
 *
 * Every move is `linear` and lasts 58ms, and every hold is dead flat. Easing a
 * 2px step is what turns a beat back into a pulse, so there is none anywhere in
 * this file. The displacement is never more than 1.9px either: at that size a
 * hard step reads as attack, and one big enough to see clearly on its own would
 * read as the logo being knocked about.
 *
 * Each hit returns to rest one slot later, so the mark is in register for most
 * of every bar and is exactly in register at the top of the loop.
 */

const CYCLE = 4.8;
const SLOTS = 16;
/** 58ms, as a fraction of the cycle. Long enough to not tear, short enough to
 *  land as an attack rather than as a move. */
const SNAP = 0.012;

interface Hit {
    slot: number;
    x?: number;
    y?: number;
    scale?: number;
}

interface Frame {
    t: number;
    x: number;
    y: number;
    scale: number;
}

const REST = { x: 0, y: 0, scale: 1 };

/**
 * Turn a list of hits into keyframes.
 *
 * Each hit is four points — leave rest, arrive, hold, return — and the gaps
 * between hits are left to interpolate flat between two identical rest values.
 * Building it this way rather than by hand is what guarantees the two bars are
 * the same length and that the last frame is the first frame.
 */
function staccato(hits: Hit[]): Frame[] {
    const frames = new Map<number, Frame>();
    const put = (t: number, v: { x: number; y: number; scale: number }) => {
        // Round, or 3/16 + SNAP and 0.1995 become two frames a microsecond apart.
        frames.set(Number(t.toFixed(5)), { t: Number(t.toFixed(5)), ...v });
    };

    put(0, REST);
    put(1, REST);

    for (const hit of hits) {
        const at = { x: hit.x ?? 0, y: hit.y ?? 0, scale: hit.scale ?? 1 };
        const start = hit.slot / SLOTS;
        const end = (hit.slot + 1) / SLOTS;
        if (start > 0) put(start, REST);
        put(start + SNAP, at);
        put(end, at);
        put(end + SNAP, REST);
    }

    // Slot 0 gets no rest frame of its own — t=0 is already rest, put there
    // first, and that same frame is what the hit leaves from.
    return [...frames.values()].sort((a, b) => a.t - b.t);
}

function toMotion(hits: Hit[]) {
    const frames = staccato(hits);
    return {
        animate: {
            x: frames.map((f) => f.x),
            y: frames.map((f) => f.y),
            scale: frames.map((f) => f.scale),
        },
        transition: {
            duration: CYCLE,
            times: frames.map((f) => f.t),
            ease: 'linear' as const,
            repeat: Infinity,
        },
    };
}

export function tempoPattern({ geo, variant, dotColor }: PatternContext): LogoMotion {
    return {
        overflowVisible: true,
        behind: (
            <WordmarkEcho
                geo={geo}
                tint={lighten(dotColor, 0.38)}
                motion={{
                    initial: { x: 0, opacity: 0.12 },
                    animate: {
                        x: [0, 1.4, 1.4, 0, 0, 1.4, 1.4, 0, 0],
                        opacity: [0.12, 0.2, 0.2, 0.12, 0.12, 0.2, 0.2, 0.12, 0.12],
                    },
                    transition: {
                        duration: CYCLE,
                        times: [0, SNAP, 1 / SLOTS, 1 / SLOTS + SNAP, 0.5, 0.5 + SNAP, 9 / SLOTS, 9 / SLOTS + SNAP, 1],
                        ease: 'linear',
                        repeat: Infinity,
                    },
                }}
            />
        ),
        leftDot: toMotion([
            { slot: 0, scale: 1.07 },
            { slot: 6, y: 1.7 },
            { slot: 8, scale: 1.07 },
            { slot: 14, x: -1.9 },
        ]),
        rightDot: toMotion([
            { slot: 0, scale: 1.07 },
            { slot: 3, x: 1.9 },
            { slot: 8, scale: 1.07 },
            { slot: 11, y: -1.7 },
        ]),
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { scale: [1, 1.028, 1.028, 1, 1, 1.028, 1.028, 1, 1] },
                      transition: {
                          duration: CYCLE,
                          times: [0, SNAP, 1 / SLOTS, 1 / SLOTS + SNAP, 0.5, 0.5 + SNAP, 9 / SLOTS, 9 / SLOTS + SNAP, 1],
                          ease: 'linear' as const,
                          repeat: Infinity,
                      },
                  }
                : undefined,
    };
}
