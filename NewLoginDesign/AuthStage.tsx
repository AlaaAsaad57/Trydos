'use client';

import React, { useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { usePageDir } from 'components/DemoApp1/rtl';
import { LogoAnimationProvider } from './LogoAnimationContext';
import AuthLogoLayer from './AuthLogoLayer';
import type { LogoSlotConfig } from './logoScreenConfig';

const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/** The flow colour of the badge mark: purple dots, purple ring. */
export const LOGO_PURPLE = { dot: 'purple', ring: '#402CDD' };

interface AuthStageProps {
    /** The step now showing. A new step slides in; the old one slides out. */
    step: string;
    /** 1 = forward (the next screen comes in from the end side), -1 = back. */
    direction: number;
    /** What the badge mark plays on this step, and its colours. */
    slot: LogoSlotConfig;
    dotColor: string;
    ringColor: string;
    /** true while the logo slot moves inside its screen (the Quick Preview only). */
    live?: boolean;
    /** The screen of this step. */
    children: React.ReactNode;
    /** Drawn over the stage and not slid with the screens (the QR sheet). */
    overlay?: React.ReactNode;
}

/**
 * The stage the new login screens slide on, with the one badge mark above them.
 *
 * Used by the login page (`NewLoginWidget`) and by the verify overlays
 * (`VerifyPhoneFlow`, A-19 in UI-MIGRATION-PLAN.md), so every screen of the new
 * design gets its logo and its slide in the same way. A screen does not draw
 * the logo: it keeps an empty slot (`AuthLogoSlot`), and `AuthLogoLayer`
 * measures that slot and moves the one mark there.
 *
 * A shopper who turned motion off gets a still logo and screens that do not
 * slide (A-10). On a right-to-left page the slide is mirrored (A-13).
 */
export default function AuthStage({
    step,
    direction,
    slot,
    dotColor,
    ringColor,
    live = false,
    children,
    overlay,
}: AuthStageProps) {
    const pageDir = usePageDir();
    /** The side a next screen comes in from: the right, or the left on a right-to-left page. */
    const side = pageDir === 'rtl' ? -1 : 1;
    /** The box the screens slide inside. `AuthLogoLayer` measures against it. */
    const stageRef = useRef<HTMLDivElement>(null);

    return (
        // The provider's own animation is only a fallback: each logo gets its
        // pattern from its slot config.
        <MotionConfig reducedMotion="user">
            <LogoAnimationProvider>
                <div
                    ref={stageRef}
                    /**
                     * Never let the stage scroll, and put it back if it does.
                     *
                     * `overflow: hidden` stops the *user* scrolling. It does not
                     * stop the browser: the box is still a scroll container, and
                     * anything that focuses an element inside a screen that is
                     * still slid off to the right makes the browser scroll this
                     * box to reveal it. Every child then shifts sideways —
                     * including the logo, which belongs to the frame and not to
                     * any screen, so it flew in from the left edge.
                     *
                     * The two things that did it now focus with `preventScroll`,
                     * which is the real fix. This stays as the guard, because the
                     * next focusable thing added to any screen would otherwise
                     * bring the fault straight back, and it would look like a
                     * logo bug rather than a focus one.
                     */
                    onScroll={(event) => {
                        event.currentTarget.scrollLeft = 0;
                        event.currentTarget.scrollTop = 0;
                    }}
                    className="w-full h-full relative overflow-hidden"
                >
                    {/*
                      * Both screens are on stage at once — no `mode="wait"`.
                      * The old screen has to stay until the new one has laid
                      * out, because that is what lets `AuthLogoLayer` measure
                      * the incoming logo slot and start the mark travelling on
                      * the same frame the content starts sliding. It also makes
                      * the slide read as one pager instead of two moves with a
                      * blank gap between them.
                      */}
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={step}
                            data-auth-step={step}
                            custom={direction}
                            initial={{ x: direction * side > 0 ? '100%' : '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction * side > 0 ? '-100%' : '100%', opacity: 0 }}
                            transition={transition}
                            className="absolute inset-0 w-full h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>

                    {/*
                      * The one badge mark, above every screen and outside the
                      * slider. It moves twice in the whole flow and is still
                      * for the rest of it — see AUTH_LOGO_STOP in AuthLogoSlot.
                      *
                      * `live` is the Quick Preview only. That screen lifts its
                      * whole column off the bottom edge and the mark rides up
                      * with it, so the mark has to be locked to the slot frame
                      * by frame there. Everywhere else the slot is still, and
                      * the mark springs to it.
                      */}
                    <AuthLogoLayer
                        stageRef={stageRef}
                        step={step}
                        live={live}
                        dotColor={dotColor}
                        ringColor={ringColor}
                        slot={slot}
                    />

                    {overlay}
                </div>
            </LogoAnimationProvider>
        </MotionConfig>
    );
}
