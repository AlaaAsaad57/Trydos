'use client';

import React from 'react';

import { XD, fromBottom } from './authLayout';

/** The badge mark is 150 x 150 design px on every screen that shows it. */
export const AUTH_LOGO_SIZE = XD.logo.size;

/**
 * The two places the mark rests in the flow, and nowhere else.
 *
 * Both are design px out of the XD file. `top` is a plain top. `centre` keeps
 * its distance from the bottom of the real page (`fromBottom`), because on a
 * phone in Safari the page is shorter than the artboard and the buttons under
 * the mark move up with it — see authLayout.ts.
 *
 * `top` (116) — the phone screen, the method screen, the code screen, and all
 * four outcome screens. Seven screens, one number, so the mark is completely
 * still while the content slides underneath it.
 *
 * `centre` (390) — Get Started and Terms. The mark sits low, with the buttons
 * under it. Both screens read the same number, so the mark cannot drift between
 * them.
 *
 * These used to be 100 and 280, written as a size and a `share` of the old flex
 * budget. The budget is gone (AppScaler pins it to zero) and both numbers were
 * wrong: the design says 116 and 390.
 */
export const AUTH_LOGO_STOP = {
    centre: fromBottom(XD.logo.centre),
    top: XD.logo.top,
} as const;

export type AuthLogoStop = keyof typeof AUTH_LOGO_STOP;

interface AuthLogoSlotProps {
    /**
     * Which resting place.
     *
     * Leave it out to reserve space where the slot sits in the flow. Only the
     * quick preview does that: its whole column lifts and shrinks, and the mark
     * is part of that column, so it cannot be pinned to the canvas.
     */
    stop?: AuthLogoStop;
    className?: string;
}

/**
 * The place a screen keeps for the shared mark.
 *
 * The screens no longer draw the badge logo. `NewLoginWidget` draws one logo
 * above all of them and moves it, so the mark holds still while the content
 * slides sideways, and travels only when the design puts it somewhere else.
 *
 * A screen still has to say where the mark belongs, and this is how it says it:
 * an empty box the exact size of the logo, marked for the widget to measure.
 * Measuring beats writing the position down twice — whatever the screen does,
 * the mark follows it.
 */
export default function AuthLogoSlot({ stop, className = '' }: AuthLogoSlotProps) {
    const box = (
        <div data-auth-logo-slot="" aria-hidden="true" className="w-xd-150 h-xd-150 shrink-0" />
    );

    if (stop) {
        return (
            <div
                aria-hidden="true"
                className={`absolute left-0 w-full flex justify-center pointer-events-none ${className}`}
                style={{ top: AUTH_LOGO_STOP[stop] }}
            >
                {box}
            </div>
        );
    }

    return <div className={`w-full flex justify-center ${className}`}>{box}</div>;
}
