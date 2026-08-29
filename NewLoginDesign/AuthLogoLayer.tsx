'use client';

import React, { RefObject, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import NewLoginLogo from './NewLoginLogo';
import { AUTH_LOGO_SIZE } from './AuthLogoSlot';

interface Box {
    top: number;
    left: number;
    scale: number;
}

interface AuthLogoLayerProps {
    /** The box the screens slide inside. Every position is measured from it. */
    stageRef: RefObject<HTMLDivElement | null>;
    /** The step now showing. Picks which screen's slot to follow. */
    step: string;
    /**
     * true while the slot itself is moving inside its screen.
     *
     * Only the Quick Preview does that: its whole column lifts off the bottom
     * edge, and the mark is part of that column. On every other screen the slot
     * is still, so one measurement is enough.
     */
    live: boolean;
    dotColor: string;
    ringColor: string;
}

/** Below this nothing is worth a re-render, and rounding noise is not a move. */
const settled = (a: Box, b: Box) =>
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.scale - b.scale) < 0.002;

/**
 * Where the mark travels, and how it lands.
 *
 * A spring, not a tween, and underdamped on purpose: it arrives, goes a little
 * past and comes back. A mark that eases to a stop and holds looks like a slide
 * in a deck; the recoil is what makes it read as an object with weight.
 *
 * How far past is the whole question, and it is a measured number, not a taste.
 * A spring overshoots by `exp(-pi * z / sqrt(1 - z*z))` of the distance it
 * travelled, where `z` is the damping ratio, `damping / (2 * sqrt(stiffness *
 * mass))`. The longest journey in this flow is Terms to the phone screen: on a
 * short canvas that is 174px, ending 24px from the top edge.
 *
 * At the ratio this started on (0.54) the overshoot is 13.5% — 23.5px on that
 * journey, which puts the mark at y = 0.5 and it disappears through the top of
 * the canvas on the way in. That was a real fault, seen on the code and name
 * screens.
 *
 * `damping: 21` puts the ratio at 0.71 and the overshoot at 4.6%: 8px on the
 * same journey, so the mark peaks at y = 16 and stays on screen with room to
 * spare. 8px of recoil is still plainly visible — the mark is 150px tall.
 */
const TRAVEL = {
    type: 'spring' as const,
    stiffness: 220,
    damping: 21,
    mass: 1,
    // The fade is a plain tween. Springing an opacity gives it an overshoot it
    // cannot show, so it just ends up slower than everything around it.
    opacity: { duration: 0.3, ease: 'easeOut' as const },
};

/** No travel at all: the mark is locked to a slot that is moving under it. */
const LOCKED = { duration: 0, opacity: { duration: 0.3, ease: 'easeOut' as const } };

/**
 * The one badge mark, drawn above the screens and moved between them.
 *
 * Before this the logo lived inside each screen, so the slide carried it
 * sideways with everything else. The design wants the opposite: the slider is
 * the content, and the mark is a fixed part of the frame. It moves twice in the
 * whole flow — down when Quick Preview hands over to Get Started, and up when
 * Terms hands over to the phone screen — and then it does not move again.
 *
 * That stillness is not a coincidence, and it is not enforced here. It falls
 * out of `AUTH_LOGO_STOP` in `AuthLogoSlot`: the screens that must agree read
 * the same two numbers, so their slots land on the same pixel and the measured
 * target simply does not change.
 *
 * Measuring, rather than writing the position down here as well, is what makes
 * that true at every viewport height. The slot moves with its screen's own
 * `FlexibleSpace` budget; the mark follows the slot.
 *
 * The measurement uses client rects, not `offsetTop`, because the Quick Preview
 * puts its slot inside a column that is translated and scaled — offsets are
 * layout values and would report where the column would be if it were not
 * moving. Rects are read relative to the screen's own wrapper, so the sideways
 * slide cancels out: both the slot and the wrapper carry it. What is left is
 * the position inside the screen, which is exactly what is wanted.
 *
 * The logo element is never remounted, so its motion pattern runs unbroken from
 * the first screen to the last. That is the whole point of lifting it out.
 */
export default function AuthLogoLayer({
    stageRef,
    step,
    live,
    dotColor,
    ringColor,
}: AuthLogoLayerProps) {
    const [box, setBox] = useState<Box | null>(null);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        let frame = 0;

        const measure = () => {
            const screen = stage.querySelector<HTMLElement>(`[data-auth-step="${step}"]`);
            const slot = screen?.querySelector<HTMLElement>('[data-auth-logo-slot]');
            // No slot on this step. Hold the last place rather than jumping to
            // the corner of the stage.
            if (!screen || !slot) return;

            // AppScaler scales the whole canvas, so a client rect comes back in
            // device px while everything positioned inside it is in design px.
            const k = stage.getBoundingClientRect().height / (stage.clientHeight || 1);
            if (!k) return;

            const screenRect = screen.getBoundingClientRect();
            const slotRect = slot.getBoundingClientRect();
            const next: Box = {
                top: (slotRect.top - screenRect.top) / k,
                left: (slotRect.left - screenRect.left) / k,
                // The Quick Preview column shrinks itself to fit a short screen.
                // Reading the slot's drawn width keeps the mark the size of the
                // hole it is filling, instead of 14% too big for it.
                scale: slotRect.width / k / AUTH_LOGO_SIZE,
            };
            setBox((prev) => (prev && settled(prev, next) ? prev : next));
        };

        measure();
        // The canvas height changes with the viewport, and that is also what
        // changes --xd-flex-deficit, so every space above the slot moves with
        // it. Watching the stage catches both in one callback.
        const observer = new ResizeObserver(measure);
        observer.observe(stage);

        if (live) {
            const tick = () => {
                measure();
                frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        }

        return () => {
            observer.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, [stageRef, step, live]);

    if (!box) return null;

    return (
        <motion.div
            data-auth-logo-layer=""
            // The colour differs per screen — amber on "not registered", green
            // on the name and sign-up success screens. A prop change swaps the
            // fill at once, which reads as a flicker while the mark is moving,
            // so the fill gets a transition of its own.
            className="absolute top-0 left-0 z-30 pointer-events-none [&_path]:transition-[fill] [&_path]:duration-300"
            style={{ transformOrigin: 'top left' }}
            initial={{ x: box.left, y: box.top, scale: box.scale, opacity: 0 }}
            animate={{ x: box.left, y: box.top, scale: box.scale, opacity: 1 }}
            transition={live ? LOCKED : TRAVEL}
        >
            <NewLoginLogo
                variant="badge-ring"
                dotColor={dotColor}
                ringColor={ringColor}
                width={AUTH_LOGO_SIZE}
                height={AUTH_LOGO_SIZE}
            />
        </motion.div>
    );
}
