import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLogoSequence } from '../../NewLoginDesign/useLogoSequence';
import NewLoginLogo from '../../NewLoginDesign/NewLoginLogo';
import { DEFAULT_LOGO_CONFIG } from '../../NewLoginDesign/logoScreenConfig';
import type { LogoSlotConfig } from '../../NewLoginDesign/logoScreenConfig';
import { LogoAnimationProvider } from '../../NewLoginDesign/LogoAnimationContext';

/**
 * What these tests are for.
 *
 * Two things carry the per-screen logo settings, and both are invisible in a
 * screenshot.
 *
 * The first is the chain player. Get Started builds itself once and then hands
 * off for as long as the screen is shown; every other screen repeats one
 * pattern. Watching that by eye takes seconds an attempt, and a build that
 * wrongly replays looks the same as a slow one until you have sat through two
 * cycles.
 *
 * The second is `animateWord: false`, which is how the Quick Preview gets a
 * cinematic build whose glyphs do not wipe in. If the clip comes back, the word
 * wipes again — which is exactly what it did before, so nothing on the screen
 * says it regressed.
 */

/** A slot written out here rather than read, so the test says what it means. */
const chain: LogoSlotConfig = {
    steps: [
        { animation: 'reveal', seconds: 5 },
        { animation: 'relay', seconds: 5 },
    ],
    loop: false,
};

describe('useLogoSequence — a screen plays its steps in order', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('moves to the second step only after the first step has had its seconds', () => {
        const { result } = renderHook(() => useLogoSequence(chain));

        expect(
            result.current.animation,
            'the chain did not start on its first step (Cinematic Assembly)',
        ).toBe('reveal');

        act(() => {
            vi.advanceTimersByTime(4_900);
        });
        expect(
            result.current.animation,
            'the first step gave way before its 5 seconds were up',
        ).toBe('reveal');

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(
            result.current.animation,
            'the chain did not move on to Hand-Off after the first step finished',
        ).toBe('relay');
    });

    it('ends on the plain static mark when the slot does not loop', () => {
        const { result } = renderHook(() => useLogoSequence(chain));

        // One act() per step. A step's timer is only scheduled once React has
        // committed the step before it, and a commit cannot happen in the
        // middle of a single advanceTimersByTime call.
        act(() => {
            vi.advanceTimersByTime(5_100);
        });
        act(() => {
            vi.advanceTimersByTime(5_100);
        });

        expect(
            result.current.animation,
            'a slot with loop off kept animating after its last step instead of going still',
        ).toBe('none');
    });

    it('holds the last step for ever when the slot does loop, instead of replaying the build', () => {
        const { result } = renderHook(() => useLogoSequence({ ...chain, loop: true }));

        act(() => {
            vi.advanceTimersByTime(5_100);
        });
        expect(
            result.current.animation,
            'the looping chain did not reach Hand-Off after Cinematic Assembly had its 5 seconds',
        ).toBe('relay');

        act(() => {
            vi.advanceTimersByTime(60_000);
        });
        expect(
            result.current.animation,
            'the looping chain went back to Cinematic Assembly, so Get Started replays its build like a loading state',
        ).toBe('relay');
        expect(
            vi.getTimerCount(),
            'the last step of a looping chain scheduled a timer, which it never needs',
        ).toBe(0);
    });

    it('holds one looping step for ever without a timer', () => {
        const { result } = renderHook(() =>
            useLogoSequence({ steps: [{ animation: 'wink', seconds: 5 }], loop: true }),
        );

        act(() => {
            vi.advanceTimersByTime(60_000);
        });

        expect(
            result.current.animation,
            'the single wink step was replaced, so nine screens would restart their motion for no reason',
        ).toBe('wink');
        expect(
            vi.getTimerCount(),
            'a single looping step scheduled a timer, which it never needs',
        ).toBe(0);
    });
});

describe('NewLoginLogo — animateWord=false holds the glyphs still', () => {
    const draw = (animateWord: boolean) =>
        render(
            <LogoAnimationProvider ignoreReducedMotion>
                <NewLoginLogo
                    variant="header"
                    dotColor="#402CDD"
                    ringColor="#402CDD"
                    animationVariant="reveal"
                    animateWord={animateWord}
                />
            </LogoAnimationProvider>,
        );

    it('leaves the wordmark clipped when the word may move', () => {
        const { container } = draw(true);
        const group = container.querySelector('[data-logo-part="wordmark"]');

        expect(
            group?.getAttribute('clip-path'),
            'Cinematic Assembly stopped wiping the word in, so the default build lost its reveal',
        ).toMatch(/^url\(#/);
    });

    it('takes the clip away when the word must hold still', () => {
        const { container } = draw(false);
        const group = container.querySelector('[data-logo-part="wordmark"]');

        expect(
            group?.getAttribute('clip-path'),
            'the word is still clipped, so the Quick Preview glyphs wipe in when they should stand still',
        ).toBeNull();
    });
});

describe('the design defaults are the ones the flow was signed off on', () => {
    it('builds Get Started once and then hands off for good', () => {
        const slot = DEFAULT_LOGO_CONFIG['get-started'];

        expect(
            slot.steps.map((step) => `${step.animation}/${step.seconds}`).join(' then '),
            'Get Started no longer plays Cinematic Assembly for 3s then Hand-Off for 3s',
        ).toBe('reveal/3 then relay/3');
        expect(
            slot.loop,
            'Get Started stopped looping, so its Hand-Off ends on the plain logo instead of carrying on',
        ).toBe(true);
    });

    it('builds the Quick Preview wordmark once, with its glyphs held still', () => {
        const slot = DEFAULT_LOGO_CONFIG['quick-preview-wordmark'];

        expect(
            slot.animateWord,
            'the Quick Preview wordmark went back to wiping its glyphs in',
        ).toBe(false);
        expect(
            slot.steps[0].animation,
            'the Quick Preview wordmark no longer plays Cinematic Assembly',
        ).toBe('reveal');
        expect(
            slot.loop,
            'the Quick Preview wordmark started looping, so its build replays inside the first 8 seconds',
        ).toBe(false);
    });

    it('plays Hand-Off on a loop on every screen the client did not single out', () => {
        // Named one by one, because a count would not say which screen drifted.
        for (const id of [
            'quick-preview-badge',
            'quick-preview-badge-expanded',
            'terms',
            'enter-phone',
            'select-method',
            'enter-pin',
            'not-registered',
            'already-registered',
            'input-name',
            'success',
        ] as const) {
            const slot = DEFAULT_LOGO_CONFIG[id];
            expect(
                slot.steps.map((step) => step.animation).join(' then '),
                `the "${id}" logo no longer plays Hand-Off on its own`,
            ).toBe('relay');
            expect(slot.loop, `the "${id}" logo stopped looping`).toBe(true);
        }
    });

    it('runs every step of every screen for 3 seconds', () => {
        for (const [id, slot] of Object.entries(DEFAULT_LOGO_CONFIG)) {
            slot.steps.forEach((step, index) => {
                expect(
                    step.seconds,
                    `step ${index + 1} of the "${id}" logo is not on the agreed 3 seconds`,
                ).toBe(3);
            });
        }
    });
});
