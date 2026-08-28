'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * The eight logo motion patterns, plus "none".
 *
 * Each id is one motion language, not one setting of a shared one. The full
 * reasoning for each lives beside its code in `animations/patterns/`.
 */
export type LogoAnimationType =
    | 'none'
    | 'wink'    // 1. character   — the dots are eyes and behave like eyes
    | 'bounce'  // 2. gravity     — weight, squash on landing, follow-through
    | 'magnet'  // 3. spring      — tension built, held, then released
    | 'wave'    // 4. fluid       — one sine crossing the mark, volume kept
    | 'comet'   // 5. light       — the mark holds still, the light travels
    | 'radar'   // 6. instrument  — fixed rate, linear timing, the mark answers
    | 'spark'   // 7. ambient     — long mismatched periods, no visible repeat
    | 'reveal'; // 8. entrance    — plays once on mount, then perfectly still

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
        icon: '👀',
        tagline: 'Character — the dots are eyes',
        description:
            'The two dots look slowly around and blink, and now and then wink with one eye. Blinks last 110ms and come at an uneven gap, so it reads as alive rather than as a timer. The wordmark never moves.',
        bestFor: 'The first screen, where the brand should feel friendly.',
    },
    {
        id: 'bounce',
        label: 'Drop & Bounce',
        shortName: 'Bounce',
        icon: '🏀',
        tagline: 'Gravity — weight and follow-through',
        description:
            'The dots fall in, land with a squash that keeps its volume, bounce twice and rest. The right dot lands 120ms after the left one, which is what gives each of them a weight of its own.',
        bestFor: 'A moment of arrival — a screen the shopper just landed on.',
    },
    {
        id: 'magnet',
        label: 'Magnetic Pull',
        shortName: 'Magnet',
        icon: '🧲',
        tagline: 'Spring — tension held, then released',
        description:
            'The dots draw together until they almost touch, hold, then snap apart and settle. A short field line crackles across the gap while they are close. How far they travel is measured from the real gap, so they can never overlap.',
        bestFor: 'Screens about connecting — sign in, pairing, QR.',
    },
    {
        id: 'wave',
        label: 'Liquid Wave',
        shortName: 'Wave',
        icon: '🌊',
        tagline: 'Fluid — one sine crossing the mark',
        description:
            'A slow wave passes through the dots from left to right, the right one a third of a cycle behind. On the badge the wave carries on into the ring: the ring lights up dot by dot, and stays dotted.',
        bestFor: 'Waiting screens — sending a code, checking a number.',
    },
    {
        id: 'comet',
        label: 'Comet Trail',
        shortName: 'Comet',
        icon: '☄️',
        tagline: 'Light — the mark holds still',
        description:
            'A glowing head with a fading tail runs around the badge ring and lights the ring dots as it passes. On the header lockup it orbits the two dots and slips behind them, which gives the flat mark depth.',
        bestFor: 'A hero moment. The strongest of the eight on a big logo.',
    },
    {
        id: 'radar',
        label: 'Radar Sweep',
        shortName: 'Radar',
        icon: '📡',
        tagline: 'Instrument — fixed rate, no easing',
        description:
            'A wedge turns at a constant rate, a ping goes out once per turn, and each dot answers on the frame the sweep reaches it. All timing is linear, because instruments do not accelerate.',
        bestFor: 'Anything that is working — verifying, searching, scanning.',
    },
    {
        id: 'spark',
        label: 'Constellation',
        shortName: 'Spark',
        icon: '✨',
        tagline: 'Ambient — nothing repeats visibly',
        description:
            'Small sparkles drift around the mark on periods of 28 to 52 seconds, so the eye never catches the loop, and the dots twinkle underneath. Built for screens people sit on, where a short loop starts to nag.',
        bestFor: 'Long screens — terms, onboarding, anything with reading.',
    },
    {
        id: 'reveal',
        label: 'Cinematic Assembly',
        shortName: 'Reveal',
        icon: '🎬',
        tagline: 'Entrance — plays once, then still',
        description:
            'The ring draws itself, the wordmark wipes in from the left, then the dots drop in on a spring. The wipe uses a clip path, never a stroke on the letters, so the glyphs are never thickened. Ends pixel-identical to the static logo.',
        bestFor: 'The opening screen, or a success screen.',
    },
    {
        id: 'none',
        label: 'None (static)',
        shortName: 'Static',
        icon: '⏹️',
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
