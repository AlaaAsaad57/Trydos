'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * The ten logo motion patterns, plus "none".
 *
 * Each id is one motion language, not one setting of a shared one. The full
 * reasoning for each lives beside its code in `animations/patterns/`.
 *
 * The last three are newer than the rest and rest on a change to the artwork:
 * the wordmark is now also generated as one path per letter, so a pattern can
 * move the letters separately. The first seven cannot, and they still draw the
 * word as the single path they were written against.
 */
export type LogoAnimationType =
    | 'none'
    | 'wink'    // 1. character   - the dots are eyes and behave like eyes
    | 'relay'   // 2. weight      - a charge thrown from one dot to the other
    | 'firefly' // 3. character   - a sparkle flies a lap, the eyes follow it
    | 'canon'   // 4. character   - one eye leads, the other is half a beat late
    | 'tempo'   // 5. staccato    - hard steps on a beat, silence in between
    | 'spark'    // 6. ambient     - long mismatched periods, no visible repeat
    | 'reveal'   // 7. build       - assembles, holds, then unbuilds, for ever
    | 'gust'     // 8. wave        - wind crosses, the letters lean in sequence
    | 'escape'   // 9. comedy      - a letter falls out of the word and is stared at
    | 'sway';    // 10. solid body - the whole mark hangs and swings, eyes trailing

export interface LogoAnimationPreset {
    id: LogoAnimationType;
    label: string;
    shortName: string;
    icon: string;
    /** One line for the picker header. */
    tagline: string;
    /** What it does and what it is for. Shown as the button tooltip. */
    description: string;
    /** Where it belongs. Helps the client pick, rather than only look. */
    bestFor: string;
}

export const LOGO_ANIMATION_PRESETS: LogoAnimationPreset[] = [
    {
        id: 'wink',
        label: 'Buddy Wink',
        shortName: 'Wink',
        icon: '\u{1F440}',
        tagline: 'Character - the dots are eyes',
        description:
            'The two dots dart from one point to the next and hold there, blink, and now and then wink with one eye. The glances are wide and mostly sideways, so they read as looking at something. Blinks last 95ms and come at an uneven gap. The wordmark never moves.',
        bestFor: 'The first screen, where the brand should feel friendly.',
    },
    {
        id: 'relay',
        label: 'Hand-Off',
        shortName: 'Relay',
        icon: '\u{1F91D}',
        tagline: 'Weight - thrown, caught, absorbed',
        description:
            'One dot pulls back, stretches across and hands its weight to the other, which is knocked back on the frame of contact and springs home. The word is dragged after the pass and arrives late; the ring takes the knock as a 2% widening. Then nearly a second of stillness before the return pass.',
        bestFor: 'A marketplace moment - cart, checkout, anything exchanged.',
    },
    {
        id: 'firefly',
        label: 'Firefly',
        shortName: 'Firefly',
        icon: '\u2734\uFE0F',
        tagline: 'Character - the eyes have something to watch',
        description:
            'A sparkle drifts a slow lap around the mark and both eyes follow it the whole way round, aimed at it separately so they converge a little as it passes close. The sparkle goes behind the letters and comes out the other side. Two blinks a lap, timed for the moments it is hidden.',
        bestFor: 'Any screen. The eyes move for a reason, so it reads at any size.',
    },
    {
        id: 'canon',
        label: 'Half a Beat',
        shortName: 'Canon',
        icon: '\u{1F440}',
        tagline: 'Character - one eye is always quicker',
        description:
            'The eyes glance around, but one leads and the other arrives a quarter of a second later, hurrying and overshooting before it settles. The dot that leads is always the one moving away, which is what lets the glances be three times wider than a pair moving together could manage. The word and the ring tip after them.',
        bestFor: 'A screen with personality - welcome, or a first sign-in.',
    },
    {
        id: 'tempo',
        label: 'Downbeat',
        shortName: 'Tempo',
        icon: '\u{1F941}',
        tagline: 'Staccato - hard steps, and silence',
        description:
            'Everything else in the set glides; this one snaps. At 100 BPM the two bars have sixteen slots and only six are used - the 3-3-2 tresillo - so ten of them are silent. Every move is linear and lasts 58ms, every hold is dead flat, and nothing travels more than 1.9px.',
        bestFor: 'A screen that needs energy. Live shopping, a launch.',
    },
    {
        id: 'spark',
        label: 'Constellation',
        shortName: 'Spark',
        icon: '\u2728',
        tagline: 'Ambient - nothing repeats visibly',
        description:
            'Small sparkles drift around the mark on periods of 28 to 52 seconds, so the eye never catches the loop, and the dots twinkle underneath. Built for screens people sit on, where a short loop starts to nag.',
        bestFor: 'Long screens - terms, onboarding, anything with reading.',
    },
    {
        id: 'reveal',
        label: 'Cinematic Assembly',
        shortName: 'Reveal',
        icon: '\u{1F3AC}',
        tagline: 'Build - assembled, then taken apart',
        description:
            'The ring draws itself, the wordmark wipes in from the left, then the dots drop in. It holds the finished mark for about two seconds, then runs the whole build backwards - dots out first, then the word, then the ring - and starts again. The wipe uses a clip path, never a stroke on the letters, so the glyphs are never thickened.',
        bestFor: 'A screen that is held for a while, such as the Quick Preview.',
    },
    {
        id: 'gust',
        label: 'Gust',
        shortName: 'Gust',
        icon: '\u{1F343}',
        tagline: 'Wave - wind crosses, in order',
        description:
            'A gust crosses the mark in 900ms and everything it passes leans, lifts and settles - each letter starting 60ms after the one to its left, so the far end is still rising while the near end is coming down. The eyes squint into it and blink once after it has gone. On the badge the same wave runs round the ring, tinting its little dots and leaving the gaps between them empty. Then six seconds of calm.',
        bestFor: 'Any screen. The clearest use of the word itself.',
    },
    {
        id: 'escape',
        label: 'Escape',
        shortName: 'Escape',
        icon: '\u{1F62E}',
        tagline: 'Comedy - and a held beat',
        description:
            'Everything is still for three seconds. The last letter of the word slips, tips over and lies there. The eyes snap to it, hold wide, then narrow into a flat stare for a whole second while nothing at all moves. Then the letter hops back, the rest of the word bounces after it, and the mark goes still again.',
        bestFor: 'Get Started, Success, Quick Preview. Not a PIN screen.',
    },
    {
        id: 'sway',
        label: 'Sway',
        shortName: 'Sway',
        icon: '\u{1F3D7}\uFE0F',
        tagline: 'One solid object, hanging',
        description:
            'The mark hangs from a point above itself and swings, like a shop sign on its bracket. Every letter, both dots and the ring are placed by one swing angle, so nothing ever moves against anything else - the word tips like a beam because the maths says it should, not because it was written in. The two dots run the same swing 100ms late, which is the only thing in the file that is not rigid and is what stops it looking like a sliding picture.',
        bestFor: 'Anywhere calm. The most restrained pattern in the set.',
    },
    {
        id: 'none',
        label: 'None (static)',
        shortName: 'Static',
        icon: '\u23F9\uFE0F',
        tagline: 'The logo exactly as drawn',
        description:
            'No motion at all. This is also what every pattern falls back to when the device asks for reduced motion.',
        bestFor: 'Comparing against the original before choosing.',
    },
];

export const DEFAULT_LOGO_ANIMATION: LogoAnimationType = 'wink';

interface LogoAnimationContextValue {
    animation: LogoAnimationType;
    setAnimation: (anim: LogoAnimationType) => void;
    /**
     * Play the pattern even when the device asks for reduced motion.
     *
     * Off everywhere in the product: a shopper who turned animation off in
     * their settings meant it. The demo route turns it on, because a picker
     * that shows a still logo on a machine with animations disabled tells the
     * person choosing nothing at all.
     */
    ignoreReducedMotion: boolean;
}

const LogoAnimationContext = createContext<LogoAnimationContextValue>({
    animation: DEFAULT_LOGO_ANIMATION,
    setAnimation: () => {},
    ignoreReducedMotion: false,
});

export function LogoAnimationProvider({
    children,
    animation: controlledAnimation,
    setAnimation: controlledSetAnimation,
    initialAnimation = DEFAULT_LOGO_ANIMATION,
    ignoreReducedMotion = false,
}: {
    children: ReactNode;
    animation?: LogoAnimationType;
    setAnimation?: (anim: LogoAnimationType) => void;
    initialAnimation?: LogoAnimationType;
    ignoreReducedMotion?: boolean;
}) {
    const [internalAnimation, setInternalAnimation] = useState<LogoAnimationType>(initialAnimation);

    const animation = controlledAnimation !== undefined ? controlledAnimation : internalAnimation;
    const setAnimation = controlledSetAnimation !== undefined ? controlledSetAnimation : setInternalAnimation;

    return (
        <LogoAnimationContext.Provider value={{ animation, setAnimation, ignoreReducedMotion }}>
            {children}
        </LogoAnimationContext.Provider>
    );
}

export function useLogoAnimation() {
    return useContext(LogoAnimationContext);
}
