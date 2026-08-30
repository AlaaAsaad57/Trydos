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
 * The first is the chain player. Get Started builds itself and then hands off
 * once and stops; every other screen repeats one pattern. Watching that by eye
 * takes ten seconds an attempt and a wrong step looks the same as a slow one.
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

    it('starts the list again when the slot does loop', () => {
        const { result } = renderHook(() => useLogoSequence({ ...chain, loop: true }));

        act(() => {
            vi.advanceTimersByTime(5_100);
        });
        act(() => {
            vi.advanceTimersByTime(5_100);
        });

        expect(
            result.current.animation,
            'a looping slot did not go back to its first step after the last one',
        ).toBe('reveal');
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
    it('builds Get Started once and then stops', () => {
        const slot = DEFAULT_LOGO_CONFIG['get-started'];

        expect(
            slot.steps.map((step) => `${step.animation}/${step.seconds}`).join(' then '),
            'Get Started no longer plays Cinematic Assembly for 5s then Hand-Off for 5s',
        ).toBe('reveal/5 then relay/5');
        expect(slot.loop, 'Get Started started looping, and it must play once and stop').toBe(false);
    });

    it('holds the Quick Preview glyphs still and winks its badge slowly', () => {
        expect(
            DEFAULT_LOGO_CONFIG['quick-preview-wordmark'].animateWord,
            'the Quick Preview wordmark went back to wiping its glyphs in',
        ).toBe(false);
        expect(
            DEFAULT_LOGO_CONFIG['quick-preview-badge'].steps[0].seconds,
            'the bottom round badge is no longer on a 10 second wink',
        ).toBe(10);
        expect(
            DEFAULT_LOGO_CONFIG['quick-preview-badge-expanded'].steps[0].animation,
            'the badge does not switch to Hand-Off once the 8 seconds are up',
        ).toBe('relay');
    });
});
