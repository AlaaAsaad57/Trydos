'use client';

import React from 'react';

/** The badge mark is 150 x 150 design px on every screen that shows it. */
export const AUTH_LOGO_SIZE = 150;

/**
 * The two places the mark rests in the flow, and nowhere else.
 *
 * Both are written the way the scaling system writes a vertical space:
 * `height = size - share * --xd-flex-deficit`. So the mark compresses with the
 * rest of the screen instead of being pinned to a fixed pixel.
 *
 * `centre` — Get Started and Terms. The mark sits low, with the buttons under
 * it. Both screens read the same numbers from here, so the mark cannot drift by
 * a few pixels between them at any viewport height.
 *
 * `top` — the phone screen, the method screen, the code screen, and all four
 * outcome screens. The mark sits near the top with the text below it. Seven
 * screens, one position, for the same reason: the design shows the mark parked
 * there, so it must be still while the content slides underneath it.
 *
 * The `top` share is the tighter of the two to set. It has to clear the text
 * block on the phone and code screens, and that block is anchored to the middle
 * of the canvas, so it climbs as the canvas gets shorter. At the shortest
 * canvas the scaling system allows (750 design px) the text starts at 182 and
 * the mark ends at 174. That is where 0.42 comes from — a smaller share and
 * they touch.
 */
export const AUTH_LOGO_STOP = {
    centre: { size: 280, share: 0.45 },
    top: { size: 100, share: 0.42 },
} as const;

export type AuthLogoStop = keyof typeof AUTH_LOGO_STOP;

/**
 * The mark never gets closer than this to the top edge.
 *
 * Without the floor the `top` stop reaches 23.6 at the deepest compression the
 * scaling system allows, and a viewport shorter still would push it negative —
 * the mark would climb out through the top of the canvas, which is what the
 * code and name screens showed. 24 is one notch above that 23.6, so on every
 * height the system actually produces the floor is inert and the stop is doing
 * the work; it only takes over if something later makes the canvas shorter.
 *
 * It cannot go much higher than 24 either: on the phone and code screens the
 * text below starts at 182 at that compression, and the mark is 150 tall.
 */
const TOP_FLOOR = 24;

/** The distance from the top of the screen to the mark, as one CSS length. */
const offsetCss = (stop: AuthLogoStop) => {
    const { size, share } = AUTH_LOGO_STOP[stop];
    return `max(${TOP_FLOOR}px, calc(${size}px - ${share} * var(--xd-flex-deficit, 0px)))`;
};

interface AuthLogoSlotProps {
    /** Which resting place. Leave out to reserve space where the screen is. */
    stop?: AuthLogoStop;
    /**
     * Take the slot out of the flow and pin it to `stop` from the top of the
     * screen.
     *
     * The phone, method and code screens need this. Their layout hangs off a
     * half-canvas box, so a 250px slot dropped into that flow would squeeze the
     * box and drag the text with it. Pinned, the slot moves nothing at all, and
     * it still lands on the same `stop` as the screens that keep it in flow —
     * both read the numbers above.
     */
    absolute?: boolean;
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
 * Measuring beats writing the position down twice — whatever the screen's own
 * spacing does at a given viewport height, the mark follows it.
 */
export default function AuthLogoSlot({
    stop,
    absolute = false,
    className = '',
}: AuthLogoSlotProps) {
    const box = (
        <div data-auth-logo-slot="" aria-hidden="true" className="w-xd-150 h-xd-150 shrink-0" />
    );

    if (absolute) {
        return (
            <div
                aria-hidden="true"
                className={`absolute left-0 w-full flex justify-center pointer-events-none ${className}`}
                style={{ top: offsetCss(stop ?? 'top') }}
            >
                {box}
            </div>
        );
    }

    return (
        <>
            {/* The space above the mark, written by hand rather than with
                FlexibleSpace, so it carries the same floor as the pinned
                variant. A FlexibleSpace clamps a negative height to zero, which
                would put the mark 24px higher here than on the screens that pin
                it, and the two have to land on the same pixel. */}
            {stop && (
                <div
                    aria-hidden="true"
                    style={{ height: offsetCss(stop), flexShrink: 0, minHeight: 0 }}
                />
            )}
            <div className={`w-full flex justify-center ${className}`}>{box}</div>
        </>
    );
}
