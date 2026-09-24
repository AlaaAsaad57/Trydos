import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// `useReducedMotion` reads matchMedia once and caches it, so stubbing the media
// query after the module has loaded proves nothing. Replacing the hook is the
// only way to be sure this test is really testing the reduced-motion path.
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
    return { ...actual, useReducedMotion: () => true };
});

import NewLoginLogo from '../../NewLoginDesign/NewLoginLogo';
import {
    LogoAnimationProvider,
    LOGO_ANIMATION_PRESETS,
} from '../../NewLoginDesign/LogoAnimationContext';

/**
 * A shopper who has asked their phone to stop things moving has asked for that
 * everywhere, and a login screen is not the place to argue. Every pattern must
 * fall back to the static logo — not to a slower version of itself, and not to
 * a static logo that still carries the pattern's leftover decoration.
 *
 * The check compares each pattern's output against the "none" output. Anything
 * a pattern adds — a mask, a filter, a sparkle, a moved dot — shows up as a
 * difference, so this catches a pattern that forgets to ask.
 */
describe('NewLoginLogo — reduced motion turns every pattern back into the static logo', () => {
    for (const variant of ['header', 'badge-ring'] as const) {
        const still = render(
            <LogoAnimationProvider initialAnimation="none">
                <NewLoginLogo variant={variant} dotColor="#402CDD" ringColor="#28C452" />
            </LogoAnimationProvider>,
        ).container.querySelector('svg')!.innerHTML;

        for (const preset of LOGO_ANIMATION_PRESETS) {
            if (preset.id === 'none') continue;

            it(`${variant}: pattern "${preset.id}" renders the static logo when reduced motion is on`, () => {
                const svg = render(
                    <LogoAnimationProvider initialAnimation={preset.id}>
                        <NewLoginLogo variant={variant} dotColor="#402CDD" ringColor="#28C452" />
                    </LogoAnimationProvider>,
                ).container.querySelector('svg')!;

                expect(
                    svg.querySelectorAll('[data-logo-decoration]').length === 0,
                    `${variant}: pattern "${preset.id}" still drew its decoration with reduced motion on`,
                ).toBe(true);

                expect(
                    svg.innerHTML,
                    `${variant}: pattern "${preset.id}" does not match the static logo with reduced motion on, so it is still doing something the shopper asked it not to do`,
                ).toBe(still);
            });
        }
    }
});
