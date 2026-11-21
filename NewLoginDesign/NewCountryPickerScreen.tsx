'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import { DEFAULT_LOGO_CONFIG } from './logoScreenConfig';
import type { LogoSlotConfig } from './logoScreenConfig';
import {
    COLLAPSED_TAIL,
    COLUMN_START_Y,
    PreviewWordmark,
    SloganPill,
    columnRise,
} from './QuickPreviewScreen';

interface NewCountryPickerScreenProps {
    /**
     * What is under the logo: the map and the country rows. The host draws
     * it (the demo's picker, `CountryPickerBody`), so this screen holds only
     * the parts it shares with the Quick Preview.
     */
    body: React.ReactNode;
    lang?: string;
    autoExpandDelayMs?: number; // Defaults to 8000 (8 seconds), as the Quick Preview
    /** Fired when the column lifts, so the widget gives the badge its second job. */
    onExpand?: () => void;
    /** What the centre wordmark plays for the first eight seconds. */
    wordmarkSlot?: LogoSlotConfig;
}

/** The pill box starts at 56 in the design file, as in the Quick Preview. */
const ABOVE_PILL = 56;

/** The pill ends at 86, the mark starts at 98. */
const PILL_TO_LOGO = 12;

/**
 * The country picker, as a login step: XD `Ramaaz pay signin – 16`.
 *
 * It takes the Quick Preview's place in the flow, and it starts the same way:
 *
 * 1. The start animation. The wordmark plays in the middle of the page, and
 *    the column waits below it: only the slogan pill and the top of the
 *    badge ring show over the bottom edge (COLLAPSED_TAIL).
 * 2. After eight seconds the wordmark fades away and the column rises to the
 *    top, with the same time and curve (columnRise).
 *
 * The top of the column is the Quick Preview's own: the same flipping pill
 * (SloganPill) at y 56, and the same shared badge mark at y 98 (AuthLogoSlot,
 * which the widget fills with the one mark it moves between screens). So when
 * the shopper picks a country and Get Started slides in, the mark travels
 * down to its place there, as it does after the Quick Preview.
 *
 * The picker is taller than a short page (its last row ends at y 846 of
 * 932). The Quick Preview gives up height from its card; the map and the
 * rows cannot shrink, so once the column is up, the screen scrolls.
 */
export default function NewCountryPickerScreen({
    body,
    lang = 'en',
    autoExpandDelayMs = 8000,
    onExpand,
    wordmarkSlot = DEFAULT_LOGO_CONFIG['quick-preview-wordmark'],
}: NewCountryPickerScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    /**
     * Where the column peeks: the pill's top COLLAPSED_TAIL above the bottom
     * edge. It starts under the page (COLUMN_START_Y), the same as on the
     * server, and the first measure after mount moves it up to the peek.
     */
    const [collapsedY, setCollapsedY] = useState<number>(COLUMN_START_Y);

    const canvasRef = useRef<HTMLElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);

    // Measured from the real canvas, as in the Quick Preview.
    useEffect(() => {
        const canvas = canvasRef.current;
        const pill = pillRef.current;
        if (!canvas || !pill) return;
        const measure = () =>
            setCollapsedY(Math.max(0, canvas.clientHeight - COLLAPSED_TAIL - pill.offsetTop));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, []);

    // The same eight seconds as the Quick Preview, from mount (effects run
    // only in the browser, after hydration).
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExpanded(true);
            onExpand?.();
        }, autoExpandDelayMs);
        return () => clearTimeout(timer);
        // `onExpand` is left out on purpose: it is a new function on every
        // render of the widget, and watching it would restart the timer.
    }, [autoExpandDelayMs]);

    return (
        <main
            ref={canvasRef}
            data-pw="login-country-picker"
            // Until the column is up, nothing scrolls: the column is below the
            // edge on purpose. Once it is up, a short page scrolls to the rows.
            className={`w-full h-full bg-white flex flex-col items-center font-quicksand relative select-none ${
                isExpanded ? 'overflow-x-hidden overflow-y-auto' : 'overflow-hidden'
            }`}
        >
            <PreviewWordmark show={!isExpanded} slot={wordmarkSlot} />

            <motion.div
                initial={{ y: COLUMN_START_Y }}
                animate={{ y: isExpanded ? 0 : collapsedY }}
                transition={columnRise(isExpanded)}
                className="w-full flex flex-col items-center relative z-20 shrink-0"
            >
                <FlexibleSpace size={ABOVE_PILL} />
                <SloganPill translate={translate} pillRef={pillRef} />
                <FlexibleSpace size={PILL_TO_LOGO} />
                <AuthLogoSlot />
                {body}
            </motion.div>
        </main>
    );
}
