import React from 'react';

/**
 * The preview slides: an icon, a title and a line about one side of Trydos.
 *
 * Two places show them, as one slider: the quick preview at the start of the
 * login (QuickPreviewScreen), and the card of the demo's sign-in request
 * (components/DemoApp1/screens/SignInSlides.tsx). A change here shows in both.
 *
 * The words are translation keys; each place looks them up its own way.
 */
export type PreviewSlide = {
    id: number;
    /** The line icon, `#402CDD`, at `size` px. */
    icon: (size: number) => React.ReactNode;
    titleKey: string;
    descKey: string;
};

export const PREVIEW_SLIDES: PreviewSlide[] = [
    {
        id: 0,
        icon: (size) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#402CDD"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
        ),
        titleKey: 'Exclusive Shopping & Boutiques',
        descKey: 'Discover exclusive shopping channels, boutiques and premium deals tailored for you.',
    },
    {
        id: 1,
        icon: (size) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#402CDD"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        titleKey: 'Social E-Commerce & Community',
        descKey: 'Connect, shop together, and experience interactive social commerce like never before.',
    },
    {
        id: 2,
        icon: (size) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#402CDD"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                <path d="M5 3v4" />
                <path d="M19 17v4" />
                <path d="M3 5h4" />
                <path d="M17 19h4" />
            </svg>
        ),
        titleKey: 'Smart, Fast & Rewarding',
        descKey: 'Invest, earn points, and enjoy seamless one-touch checkout with total safety.',
    },
];
