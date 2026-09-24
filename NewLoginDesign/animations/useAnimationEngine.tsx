'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LOGO_GEOMETRY } from './geometry';
import { LOGO_PATTERNS } from './patterns';
import { normaliseMotion } from './normalise';
import { STATIC_MOTION } from './types';
import type { BlinkState, LogoMotion, LogoVariant } from './types';
import type { LogoAnimationType } from '../LogoAnimationContext';

const EYES_OPEN: BlinkState = { left: 1, right: 1 };
const SHUT = 0.08;

/**
 * Eye-lid timer for the `wink` pattern.
 *
 * A blink is 95ms. A wink holds one eye 165ms, because a one-eyed shut that
 * lasts as long as a blink reads as a glitch rather than as a joke. The gap
 * between blinks is between 1.1s and 2.4s: a fixed gap is the thing that makes
 * a blinking character look mechanical.
 *
 * Both the gap and the shut are shorter than they were (1.8-3.6s, 110ms). A
 * quicker, more frequent blink is what pairs with the darting look-around in
 * `wink.tsx` — a slow lid over fast eyes reads as drowsy, not as curious.
 */
function useBlink(active: boolean): BlinkState {
    const [state, setState] = useState<BlinkState>(EYES_OPEN);

    useEffect(() => {
        if (!active) {
            setState(EYES_OPEN);
            return;
        }

        let shutTimer: ReturnType<typeof setTimeout>;
        let openTimer: ReturnType<typeof setTimeout>;

        const schedule = () => {
            shutTimer = setTimeout(
                () => {
                    const isWink = Math.random() < 0.22;
                    setState(isWink ? { left: 1, right: SHUT } : { left: SHUT, right: SHUT });
                    openTimer = setTimeout(
                        () => {
                            setState(EYES_OPEN);
                            schedule();
                        },
                        isWink ? 165 : 95,
                    );
                },
                1100 + Math.random() * 1300,
            );
        };

        schedule();
        return () => {
            clearTimeout(shutTimer);
            clearTimeout(openTimer);
        };
    }, [active]);

    return state;
}

/**
 * Turns a pattern id into the props the logo component applies.
 *
 * Four rules hold for every pattern, and they are kept here rather than
 * trusted to each one:
 *
 *   1. The server sends the static mark; motion starts in the browser.
 *      Framer Motion has no clock on the server, so a motion element rendered
 *      there with an `animate` target and no `initial` writes the *target* into
 *      the html — a ring told to turn to 360 degrees arrives already turned to
 *      360. The browser then hydrates, sees it is already at the target, and
 *      never animates. It looks like a dead pattern, and only on the screens
 *      that are server rendered. Holding motion back to after mount removes the
 *      whole class of fault, and it removes the hydration mismatch that rule 2
 *      would otherwise cause, because the server cannot know a media query.
 *   2. `prefers-reduced-motion` wins, unless the caller says otherwise. The
 *      reader asked the operating system to stop things moving; a login screen
 *      is not the place to argue. The demo route can override it, because a
 *      picker that shows nothing on a machine with animations turned off is
 *      not a picker.
 *   3. The loop length is the caller's to set. `cycleSeconds` is handed
 *      straight to the pattern; left out, each pattern uses the cycle it was
 *      designed on. Nothing here rescales a pattern from outside, because the
 *      part of a pattern that lives inside `defs` cannot be reached from here,
 *      and half a pattern running at a different speed is worse than none.
 *   4. Ids are namespaced with React's `useId`. Two logos are on screen at once
 *      on the Quick Preview, and svg ids are global to the document — without
 *      this the second logo's mask would quietly capture the first one's.
 */
export function useAnimationEngine(
    animation: LogoAnimationType,
    variant: LogoVariant,
    dotColor: string,
    ringColor: string,
    ignoreReducedMotion = false,
    cycleSeconds?: number,
): LogoMotion {
    const reactId = useId();
    const prefersReduced = useReducedMotion();
    const factory = LOGO_PATTERNS[animation];

    // False on the server and on the first browser render, so both produce the
    // same static markup. See rule 1 above.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    /**
     * The gate exists because the server cannot know the reduced-motion setting.
     * When the caller overrides that setting, the server does know: the pattern
     * will play. So it sends the pattern's first frame (every animated value
     * carries its start, see `normaliseMotion`), the browser renders the same
     * first frame, and the motion carries on from what is already on screen.
     *
     * Sending the finished mark there instead is what made the Quick Preview
     * logo flash: the browser drew the whole logo, hydrated, and then wiped the
     * eyes away to start the build.
     */
    const allowed = ignoreReducedMotion || !prefersReduced;
    const active = Boolean(factory) && allowed && (mounted || ignoreReducedMotion);
    const blink = useBlink(active && animation === 'wink');

    return useMemo(() => {
        if (!active || !factory) return STATIC_MOTION;
        const uid = `logo${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;
        return normaliseMotion({
            isActive: true,
            ...factory({
                variant,
                geo: LOGO_GEOMETRY[variant],
                dotColor,
                ringColor,
                uid,
                blink,
                cycle: cycleSeconds,
            }),
        });
    }, [active, factory, variant, dotColor, ringColor, reactId, blink, cycleSeconds]);
}
