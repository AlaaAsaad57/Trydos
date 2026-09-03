'use client';

import React, { useEffect, useState } from 'react';
import NewLoginLogo, { NewLoginLogoProps } from './NewLoginLogo';
import type { LogoSlotConfig, LogoStep } from './logoScreenConfig';

/**
 * Plays a slot's list of animations, one after the other.
 *
 * Why a player and not a `repeat` count
 * -------------------------------------
 * "Play it once and stop" could have been done by handing a repeat count down
 * into the ten pattern files, which write `repeat: Infinity` in 43 places, some
 * of them inside `defs` where nothing outside can reach them. Half a pattern
 * looping and half not is worse than no control at all.
 *
 * This walks the list from outside instead. Each step runs for its own number
 * of seconds and then the next one is handed to the logo. `NewLoginLogo`
 * remounts its svg on a pattern change, so each hand-over is clean and the
 * pattern files are untouched.
 *
 * What `loop` means
 * -----------------
 * The list always plays once. `loop` says what happens at the end of it:
 *
 * - `loop: true` — the **last** step carries on for as long as the screen is
 *   shown. The steps before it are an introduction and play once.
 * - `loop: false` — the animation becomes `none`, the mark exactly as drawn.
 *
 * Get Started is the reason for that rule. It builds with Cinematic Assembly
 * and then hands off, and the client asked for the build to happen once while
 * the hand-off keeps going. Restarting the whole list would replay the build
 * every few seconds, which reads as a loading state.
 *
 * A single step that loops is the common case, and it starts no timer at all.
 */

const STATIC_STEP: LogoStep = { animation: 'none', seconds: 0 };

/** What changing the config means: start the list again from the top. */
const signatureOf = (slot: LogoSlotConfig) =>
    `${slot.steps.map((step) => `${step.animation}:${step.seconds}`).join(',')}|${slot.loop}`;

export function useLogoSequence(slot: LogoSlotConfig): LogoStep {
    const signature = signatureOf(slot);
    const [index, setIndex] = useState<number>(0);

    // A new list is a new performance, not a continuation of the old one.
    useEffect(() => {
        setIndex(0);
    }, [signature]);

    const steps = slot.steps.length > 0 ? slot.steps : [STATIC_STEP];
    const finished = index >= steps.length;
    // The last step of a looping slot never ends, so it needs no clock. With
    // one step that is the whole slot, which is nine screens out of twelve.
    const endless = slot.loop && index >= steps.length - 1;

    useEffect(() => {
        if (endless || finished) return;
        const current = steps[index] ?? STATIC_STEP;
        const timer = setTimeout(
            () => {
                // Always forward. Past the end, `finished` above turns the
                // slot into the static mark; a looping slot never gets there
                // because `endless` stopped the clock on its last step.
                setIndex((prev) => prev + 1);
            },
            Math.max(1, current.seconds) * 1000,
        );
        return () => clearTimeout(timer);
        // `signature` stands in for the steps themselves, which are a new array
        // on every render of the owner. Watching the array would clear and
        // rebuild the timer on every render, so a step would never finish.
    }, [signature, index, endless, finished]);

    if (finished) return STATIC_STEP;
    return steps[index] ?? STATIC_STEP;
}

type SequencedLogoProps = Omit<NewLoginLogoProps, 'animationVariant' | 'durationSeconds' | 'animateWord'> & {
    slot: LogoSlotConfig;
};

/**
 * The mark, playing whatever its slot says. The two places that draw a logo —
 * `AuthLogoLayer` and the Quick Preview wordmark — both go through here, so the
 * wiring is written once.
 */
export default function SequencedLogo({ slot, ...logoProps }: SequencedLogoProps) {
    const step = useLogoSequence(slot);
    return (
        <NewLoginLogo
            {...logoProps}
            animationVariant={step.animation}
            durationSeconds={step.seconds > 0 ? step.seconds : undefined}
            animateWord={slot.animateWord}
        />
    );
}
