'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LogoAnimationType =
    | 'none'
    | 'buddy'        // Concept 1 — Liquid Mascot & Gooey Eyes (cursor parallax + blink/wink)
    | 'orbital'      // Concept 2 — Orbital Motion & Stroke Unveil
    | 'morph-bag'    // Concept 3 — MorphSVG Bag-to-Brand (path interpolation)
    | 'elastic'      // Concept 4 — Elastic Spline & Magnetic Tension
    | 'portal';      // Concept 5 — Liquid Portal & Displacement Ripple

export interface LogoAnimationPreset {
    id: LogoAnimationType;
    label: string;
    shortName: string;
    icon: string;
    tagline: string;
    description: string;
}

export const LOGO_ANIMATION_PRESETS: LogoAnimationPreset[] = [
    {
        id: 'buddy',
        label: 'Shipping Buddy Eyes',
        shortName: 'Buddy Eyes',
        icon: '👁️',
        tagline: 'Cursor-Following Living Eyes',
        description:
            'The two dots follow your cursor like living eyes with spring physics, auto-blink every 3s, and a random wink. The dashed ring rotates as an ambient radar.',
    },
    {
        id: 'orbital',
        label: 'Orbital Motion',
        shortName: 'Orbital',
        icon: '🪐',
        tagline: 'Dots Orbit the Arch — Glowing Trail',
        description:
            'The two dots spin rapidly around the bottom dotted arch trajectory, emitting a glowing particle trail, then snap back with a radial shockwave.',
    },
    {
        id: 'morph-bag',
        label: 'Bag-to-Brand',
        shortName: 'Morph Bag',
        icon: '🛍️',
        tagline: 'Shopping Bag Morphs into Trydos',
        description:
            'A shopping bag outline unties and morphs into the "trydos" typography curves. The bag handle detaches and contracts into the two iconic blue dots.',
    },
    {
        id: 'elastic',
        label: 'Elastic Tension',
        shortName: 'Elastic',
        icon: '🧲',
        tagline: 'Magnetic Poles & Rubber Cord Physics',
        description:
            'The two dots act as magnetic poles tethered by an elastic rubber cord that pulls and weaves with damped harmonic oscillation. The cord breathes rhythmically.',
    },
    {
        id: 'portal',
        label: 'Liquid Portal',
        shortName: 'Portal',
        icon: '🌊',
        tagline: 'Displacement Ripple & Letter Emergence',
        description:
            'SVG feTurbulence + feDisplacementMap animate liquid ripples within expanding circular portals from which the letters emerge crisply into 2D.',
    },
    {
        id: 'none',
        label: 'None (Static)',
        shortName: 'Static',
        icon: '⏹️',
        tagline: 'Original Static Logo',
        description: 'Disables all logo animations, preserving the original still SVG appearance.',
    },
];

interface LogoAnimationContextValue {
    animation: LogoAnimationType;
    setAnimation: (anim: LogoAnimationType) => void;
}

const LogoAnimationContext = createContext<LogoAnimationContextValue>({
    animation: 'buddy',
    setAnimation: () => {},
});

export function LogoAnimationProvider({
    children,
    animation: controlledAnimation,
    setAnimation: controlledSetAnimation,
    initialAnimation = 'buddy',
}: {
    children: ReactNode;
    animation?: LogoAnimationType;
    setAnimation?: (anim: LogoAnimationType) => void;
    initialAnimation?: LogoAnimationType;
}) {
    const [internalAnimation, setInternalAnimation] = useState<LogoAnimationType>(initialAnimation);

    const animation = controlledAnimation !== undefined ? controlledAnimation : internalAnimation;
    const setAnimation = controlledSetAnimation !== undefined ? controlledSetAnimation : setInternalAnimation;

    return (
        <LogoAnimationContext.Provider value={{ animation, setAnimation }}>
            {children}
        </LogoAnimationContext.Provider>
    );
}

export function useLogoAnimation() {
    return useContext(LogoAnimationContext);
}
