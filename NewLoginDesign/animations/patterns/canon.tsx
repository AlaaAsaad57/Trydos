import { lighten } from '../color';
import { WordmarkEcho } from '../WordmarkEcho';
import type { LogoMotion, PatternContext } from '../types';

/**
 * 4 — Half a Beat. Motion language: character, two of them.
 *
 * The eyes glance around, but they are not one pair moving together — one of
 * them is always a quarter of a second quicker, and the slower one hurries to
 * catch up and overshoots slightly before it settles.
 *
 * That lag is the whole pattern. A pair of eyes animated in perfect sync reads
 * as a mechanism; a pair with one leading reads as two things paying attention
 * to the same thing, which is the difference between a logo that moves and a
 * logo that is watching something. `wink` moves both eyes as one on purpose,
 * because it is one character being idle. This is the other reading of the same
 * two dots.
 *
 * Who leads is not a choice, it is a rule with a reason. **The dot that leads is
 * always the one moving away from the other.** During the 256ms of lag the two
 * are at different offsets, and if the near one moved first the gap would close
 * by that much: the dots are 30.2 apart and 22.6 wide, so there is only 7.5 of
 * air between them and a wide glance would put one inside the other. Leading
 * with the far dot opens the gap instead of closing it, which is why the
 * glances here can be 8.5px — three times what a converging pair could manage,
 * and the reason they are visible at all on a phone.
 *
 * So the lead alternates by itself, without a rule about taking turns:
 *
 *   glance right   the right dot leads, the left catches up and overshoots
 *   glance left    the left dot leads, the right catches up and overshoots
 *
 * The leader never overshoots and the follower always does. The leader decided;
 * the follower is reacting, and a reaction that arrives late arrives fast.
 *
 * The head turns with the eyes. The shadow behind the word slides 1.5px after
 * each glance and the ring tips 2.2 degrees, both a frame behind the leader, so
 * the whole mark is looking rather than just the two dots.
 */

const CYCLE = 4;
const BLINK_SHUT = 0.08;
/** 95ms as a fraction of the cycle — the same lid as `wink` and `firefly`. */
const LID = 0.02375;

/** Blinks sit inside the holds, where there is nothing to miss. */
const blink = {
    scaleY: [1, 1, BLINK_SHUT, 1, 1, BLINK_SHUT, 1, 1],
    times: [0, 0.2, 0.2 + LID, 0.2 + 2 * LID, 0.7, 0.7 + LID, 0.7 + 2 * LID, 1],
};

export function canonPattern({ geo, variant, dotColor, cycle = CYCLE }: PatternContext): LogoMotion {
    // Leader at 0.05, follower 0.04 of a cycle (256ms) behind, dart 0.02 (128ms).
    const leftDot = {
        animate: {
            //          rest  wait  over   settle hold   LEAD   hold   over  settle hold  LEAD  rest
            x: [0, 0, 10.1, 8.5, 8.5, -8.5, -8.5, 7.3, 6.0, 6.0, 0, 0],
            y: [0, 0, -0.5, -0.4, -0.4, -0.2, -0.2, 1.9, 1.6, 1.6, 0, 0],
            scaleY: blink.scaleY,
        },
        transition: {
            x: {
                duration: cycle,
                times: [0, 0.09, 0.11, 0.145, 0.3, 0.32, 0.59, 0.61, 0.645, 0.78, 0.8, 1],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
            y: {
                duration: cycle,
                times: [0, 0.09, 0.11, 0.145, 0.3, 0.32, 0.59, 0.61, 0.645, 0.78, 0.8, 1],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
            scaleY: {
                duration: cycle,
                times: blink.times,
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
        },
    };

    const rightDot = {
        animate: {
            //       LEAD  hold  over   settle hold  LEAD  hold  over  settle rest
            x: [0, 0, 8.5, 8.5, -10.1, -8.5, -8.5, 6.0, 6.0, -1.4, 0, 0],
            y: [0, 0, -0.4, -0.4, -0.3, -0.2, -0.2, 1.6, 1.6, 0.4, 0, 0],
            scaleY: blink.scaleY,
        },
        transition: {
            x: {
                duration: cycle,
                times: [0, 0.05, 0.07, 0.34, 0.36, 0.395, 0.55, 0.57, 0.82, 0.84, 0.875, 1],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
            y: {
                duration: cycle,
                times: [0, 0.05, 0.07, 0.34, 0.36, 0.395, 0.55, 0.57, 0.82, 0.84, 0.875, 1],
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
            scaleY: {
                duration: cycle,
                times: blink.times,
                ease: 'easeOut' as const,
                repeat: Infinity,
            },
        },
    };

    // The word and the ring answer the leader, a frame late, at a tenth of the
    // travel. Enough to tie them to the glance, not enough to be seen moving.
    const followTimes = [0, 0.07, 0.09, 0.32, 0.34, 0.61, 0.63, 0.8, 0.82, 1];

    return {
        overflowVisible: true,
        behind: (
            <WordmarkEcho
                geo={geo}
                tint={lighten(dotColor, 0.42)}
                motion={{
                    initial: { x: 0, opacity: 0.13 },
                    animate: {
                        x: [0, 0, 1.5, 1.5, -1.5, -1.5, 1.1, 1.1, 0, 0],
                        opacity: [0.13, 0.13, 0.18, 0.18, 0.18, 0.18, 0.16, 0.16, 0.13, 0.13],
                    },
                    transition: {
                        duration: cycle,
                        times: followTimes,
                        ease: 'easeOut',
                        repeat: Infinity,
                    },
                }}
            />
        ),
        leftDot,
        rightDot,
        ring:
            variant === 'badge-ring'
                ? {
                      animate: { rotate: [0, 0, 2.2, 2.2, -2.2, -2.2, 1.6, 1.6, 0, 0] },
                      transition: {
                          duration: cycle,
                          times: followTimes,
                          ease: 'easeOut' as const,
                          repeat: Infinity,
                      },
                  }
                : undefined,
    };
}
