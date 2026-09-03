import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLogoSequence } from '../../NewLoginDesign/useLogoSequence';
import NewLoginLogo from '../../NewLoginDesign/NewLoginLogo';
import { DEFAULT_LOGO_CONFIG } from '../../NewLoginDesign/logoScreenConfig';
import type { LogoSlotConfig, LogoSlotId } from '../../NewLoginDesign/logoScreenConfig';
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

    it('plays a looping chain once and then holds its last step for ever', () => {
        // Get Started is the case: Cinematic Assembly is an introduction, and an
        // introduction that plays again every few seconds reads as a loading
        // state. "Loop" means the last step keeps going, not that the intro
        // comes back.
        const { result } = renderHook(() => useLogoSequence({ ...chain, loop: true }));

        act(() => {
            vi.advanceTimersByTime(5_100);
        });
        act(() => {
            vi.advanceTimersByTime(5_100);
        });

        expect(
            result.current.animation,
            'a looping chain went back to its first step (Cinematic Assembly) after Hand-Off, so the build plays again and again',
        ).toBe('relay');

        act(() => {
            vi.advanceTimersByTime(60_000);
        });
        expect(
            result.current.animation,
            'the last step of a looping chain was replaced a minute later, so the mark restarts its motion for no reason',
        ).toBe('relay');
        expect(
            vi.getTimerCount(),
            'the last step of a looping chain still has a timer running, which it never needs',
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

describe('the design defaults are the picks the client applied on 3 September 2026', () => {
    /**
     * The client sat with the modal on the staging site and applied these. The
     * modal saves to that one browser only, so the defaults in the file are the
     * only way a fresh browser, or localhost, plays the same thing.
     */
    const play = (id: LogoSlotId) =>
        DEFAULT_LOGO_CONFIG[id].steps.map((step) => `${step.animation}/${step.seconds}`).join(' then ');

    it('Get Started builds once for 3 seconds and then hands off for ever', () => {
        expect(
            play('get-started'),
            'Get Started no longer plays Cinematic Assembly for 3s then Hand-Off for 3s',
        ).toBe('reveal/3 then relay/3');
        expect(
            DEFAULT_LOGO_CONFIG['get-started'].loop,
            'Get Started must keep the Hand-Off going after the build, so its loop must be on',
        ).toBe(true);
    });

    it('the Quick Preview wordmark builds once in 3 seconds, glyphs held, and stays built', () => {
        const slot = DEFAULT_LOGO_CONFIG['quick-preview-wordmark'];

        expect(play('quick-preview-wordmark'), 'the centre wordmark is not on a 3s Cinematic Assembly').toBe(
            'reveal/3',
        );
        expect(slot.loop, 'the centre wordmark must build once and stop, not take itself apart').toBe(false);
        expect(slot.animateWord, 'the Quick Preview wordmark went back to wiping its glyphs in').toBe(false);
    });

    it('the Quick Preview badge hands off at 3 seconds, before and after the column lifts', () => {
        expect(play('quick-preview-badge'), 'the bottom round badge is not on a 3s Hand-Off').toBe('relay/3');
        expect(DEFAULT_LOGO_CONFIG['quick-preview-badge'].loop, 'the bottom round badge stopped looping').toBe(true);
        expect(
            play('quick-preview-badge-expanded'),
            'the expanded badge is not on a 3s Hand-Off once the 8 seconds are up',
        ).toBe('relay/3');
        expect(
            DEFAULT_LOGO_CONFIG['quick-preview-badge-expanded'].loop,
            'the expanded badge stopped looping',
        ).toBe(true);
    });

    it('Terms and every screen after it hand off at 3 seconds on a loop', () => {
        const screens: LogoSlotId[] = [
            'terms',
            'enter-phone',
            'select-method',
            'enter-pin',
            'not-registered',
            'already-registered',
            'input-name',
            'success',
        ];
        for (const id of screens) {
            expect(play(id), `the "${id}" screen is not on a 3s Hand-Off`).toBe('relay/3');
            expect(DEFAULT_LOGO_CONFIG[id].loop, `the "${id}" screen stopped looping`).toBe(true);
        }
    });
});
