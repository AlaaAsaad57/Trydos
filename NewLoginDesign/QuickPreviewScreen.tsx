'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { FLEX_RANGE } from 'scaling/scale.config';
import { translateFunction } from 'utils/functions';
import SequencedLogo from './useLogoSequence';
import AuthLogoSlot from './AuthLogoSlot';
import { DEFAULT_LOGO_CONFIG } from './logoScreenConfig';
import type { LogoSlotConfig } from './logoScreenConfig';

interface QuickPreviewScreenProps {
    onComplete: () => void;
    lang?: string;
    autoExpandDelayMs?: number; // Defaults to 8000 (8 seconds)
    /**
     * Fired when the column lifts. The widget uses it to give the badge its
     * second job, so this screen never has to know about logo config.
     */
    onExpand?: () => void;
    /** What the centre wordmark plays for the first eight seconds. */
    wordmarkSlot?: LogoSlotConfig;
}

/**
 * The slogans, as components rather than as strings.
 *
 * A string can only ever be one run of one colour. These lines are not that:
 * the full stops around them are purple while the words are near-black, and
 * "shop . connect . invest . enjoy" has three more of them in the middle. Held
 * as strings, that styling had to be bolted on at the one place they were
 * rendered, which meant every slogan was forced to wear the same decoration.
 *
 * Each entry now draws itself, so a slogan can carry its own emphasis, its own
 * separators, or an icon, without touching the five beside it.
 *
 * Each still resolves its wording through `translate`, and the English key is
 * unchanged, so no translation is lost by the move.
 */
type FlipLabel = (translate: (key: string) => string) => React.ReactNode;

/** The purple full stop the design puts around a slogan. */
const Stop = () => <span className="text-[#4A31E7]">.</span>;

/** The plain shape: a purple stop, the words, a purple stop. */
const bookended =
    (key: string): FlipLabel =>
    (translate) => (
        <>
            <Stop /> {translate(key)} <Stop />
        </>
    );

/**
 * The same shape, with the last `count` words a step heavier.
 *
 * The design does not set one weight for a whole slogan. ". Your new shopping
 * buddy ." is Quicksand-Regular 14 with the run "shopping buddy" — and only
 * that run — in Quicksand-Medium. Reading the emphasis off the end of the
 * translated line keeps the sentence as one key, the same way `leadWordBold`
 * reads it off the front.
 */
const tailWordsMedium =
    (key: string, count: number): FlipLabel =>
    (translate) => {
        const words = translate(key).trim().split(' ');
        const head = words.slice(0, -count).join(' ');
        const tail = words.slice(-count).join(' ');
        return (
            <>
                <Stop /> {head} <span className="font-medium">{tail}</span> <Stop />
            </>
        );
    };

/**
 * The same shape, with the first word in bold.
 *
 * "try different online shopping" opens on the brand word, and the badge mark
 * beside it is the word "try" on its own (see `mocks/QuickPreview2.png`), so
 * the slogan leans on it. Bolding it is what ties the two together.
 *
 * The sentence stays one translation key, and the bold is taken off the front
 * of whatever comes back. Splitting it into "try" plus a second key would hand
 * a translator a bare verb with no sentence around it.
 */
const leadWordBold =
    (key: string): FlipLabel =>
    (translate) => {
        const [lead, ...rest] = translate(key).trim().split(' ');
        return (
            <>
                <Stop /> <span className="font-bold">{lead}</span> {rest.join(' ')} <Stop />
            </>
        );
    };

const FLIP_LABELS: FlipLabel[] = [
    tailWordsMedium(' Your new shopping buddy ', 2),
    leadWordBold(' try different online shopping '),
    bookended(' shop . connect . invest . enjoy '),
    bookended(' Social e-commerce '),
    bookended(' Shopping, redefined '),
    bookended(' A revolutionary new shopping concept '),
];

const PREVIEW_SLIDES = [
    {
        id: 0,
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
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
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
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
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
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

/**
 * Collapsed state — how far the pill's top edge sits above the bottom edge of
 * the canvas, in design px, read off the mock (`mocks/QuickPreview1.png`).
 *
 * The pill box there runs 837 -> 869 and the artboard is 932 tall, so the tail
 * is 932 - 837 = 95. Below the pill sit the 14px gap and the top 49px of the
 * 150px badge ring, which is the arc-plus-eyes peek the mock shows.
 *
 * This is measured from the BOTTOM on purpose. The old code translated the
 * column down by a fixed 750px from the top, which only lands correctly when
 * the canvas is exactly DESIGN_H (932). A phone gives ~838, so the pill landed
 * on the bottom edge and the whole ring fell outside `overflow-hidden`.
 */
const COLLAPSED_TAIL = 95;

/**
 * How much of a gap the flex system is allowed to take away.
 *
 * The seven spacers on this screen add up to 164 design px. The flex system
 * asks for up to FLEX_RANGE (182) of them, which is more than they have. The
 * old shares divided the whole ask over those 164px, so on a short screen every
 * spacer hit zero at the same moment: the pagination dots sat on the card
 * border and the button sat on the dots. That is what Safari on a phone showed,
 * and Chrome on a laptop did not, because a laptop window is tall enough that
 * the deficit never gets there.
 *
 * Each gap now gives up at most half of itself. The 18px the spacers cannot
 * cover, and the rest of the deficit past that, are taken by `fitScale` below:
 * it shrinks the whole column evenly, so every gap stays in proportion to the
 * design instead of closing to nothing.
 *
 * `flexShare` is computed rather than written out, so the numbers cannot drift
 * away from the sizes beside them.
 */
const FLEX_GIVE = 0.5;
const flexShare = (size: number) => (size * FLEX_GIVE) / FLEX_RANGE;

export default function QuickPreviewScreen({
    onComplete,
    lang = 'en',
    autoExpandDelayMs = 8000,
    onExpand,
    wordmarkSlot = DEFAULT_LOGO_CONFIG['quick-preview-wordmark'],
}: QuickPreviewScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const [isHydrated, setIsHydrated] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [slideIndex, setSlideIndex] = useState<number>(0);
    const [flipTextIndex, setFlipTextIndex] = useState<number>(0);

    const canvasRef = useRef<HTMLElement>(null);
    const columnRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);

    /**
     * Where the column sits, measured from the real canvas instead of assumed.
     *
     * `collapsedY` puts the pill's top edge COLLAPSED_TAIL above the bottom
     * edge, so the ring peeks by the same amount on every screen height.
     *
     * `fitScale` is the guard for the expanded state, and on a phone it is
     * always doing something. The spacers below give up at most half of
     * themselves (see FLEX_GIVE), so the column is taller than the canvas on
     * any screen shorter than the 932px artboard. This shrinks it to fit, from
     * the top centre, which keeps every gap in the design's proportion instead
     * of closing the small ones first.
     */
    const [fit, setFit] = useState<{ collapsedY: number; fitScale: number }>({
        collapsedY: 1000,
        fitScale: 1,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const column = columnRef.current;
        const pill = pillRef.current;
        if (!canvas || !column || !pill) return;

        const measure = () => {
            const canvasH = canvas.clientHeight;
            const columnH = column.offsetHeight;
            setFit({
                // pill.offsetTop is the top spacer, which the flex deficit
                // shrinks. Reading it beats recomputing it from the constants.
                collapsedY: Math.max(0, canvasH - COLLAPSED_TAIL - pill.offsetTop),
                fitScale: columnH > canvasH ? canvasH / columnH : 1,
            });
        };

        measure();
        // offsetHeight/clientHeight are layout sizes, so the transform this
        // writes back cannot re-trigger the observer.
        const observer = new ResizeObserver(measure);
        observer.observe(canvas);
        observer.observe(column);
        return () => observer.disconnect();
    }, []);

    // Trigger hydration on mount. Declared after the measure effect so the
    // slide-up starts from a measured offset, not the off-screen default.
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Embla Carousel hook with touch & mouse swipe support
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        dragFree: false,
    });

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSlideIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    // Strictly timed 8-second preview (non-bypassable), starts after hydration
    useEffect(() => {
        if (!isHydrated) return;
        const timer = setTimeout(() => {
            setIsExpanded(true);
            onExpand?.();
        }, autoExpandDelayMs);
        return () => clearTimeout(timer);
        // `onExpand` is deliberately not a dependency. It is a fresh closure on
        // every render of the widget, so watching it would restart the eight
        // seconds on any unrelated state change.
    }, [isHydrated, autoExpandDelayMs]);

    // Fast slogan flipping interval (1.4s)
    useEffect(() => {
        if (!isHydrated) return;
        const interval = setInterval(() => {
            setFlipTextIndex((prev) => (prev + 1) % FLIP_LABELS.length);
        }, 1400);
        return () => clearInterval(interval);
    }, [isHydrated]);

    const handleNext = () => {
        if (slideIndex < PREVIEW_SLIDES.length - 1) {
            emblaApi?.scrollNext();
        } else {
            onComplete();
        }
    };

    const scrollToSlide = (index: number) => {
        emblaApi?.scrollTo(index);
    };

    const isLastSlide = slideIndex === PREVIEW_SLIDES.length - 1;

    return (
        <main
            ref={canvasRef}
            data-pw="quick-preview-screen"
            className="w-full bg-white flex flex-col items-center font-quicksand h-full relative overflow-hidden select-none"
        >
            {/* ======================================================== */}
            {/* CENTRAL WORDMARK LOGO (Shown during initial 8s state)     */}
            {/* ======================================================== */}
            <AnimatePresence>
                {!isExpanded && (
                    <motion.div
                        key="center-wordmark-logo"
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5, ease: 'easeInOut' } }}
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                    >
                        {/* The mark that sits above the slider for the first
                            eight seconds. It plays whatever its slot says; the
                            design starts it on Cinematic Assembly with the
                            glyphs held still, so the ring draws and the eyes
                            drop around a word that is already there. */}
                        <SequencedLogo
                            slot={wordmarkSlot}
                            variant="header"
                            dotColor="purple"
                            width={176}
                            height={88}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======================================================== */}
            {/* UNIFIED PREVIEW COLUMN: Physical Transform from Bottom   */}
            {/* ======================================================== */}
            <motion.div
                key="qp-unified-column"
                ref={columnRef}
                initial={{ y: 1000, scale: 1 }}
                animate={{
                    y: !isHydrated ? 1000 : isExpanded ? 0 : fit.collapsedY,
                    scale: isExpanded ? fit.fitScale : 1,
                }}
                transition={{ duration: isExpanded ? 1.1 : 0.8, ease: [0.25, 1, 0.5, 1] }}
                style={{ transformOrigin: 'top center' }}
                className="w-full flex flex-col items-center relative z-20"
            >
                {/* Top space above the pill. Mock: the pill box starts at 55. */}
                <FlexibleSpace size={55} share={flexShare(55)} />

                {/*
                  * 1. Slogan Pill Badge (Top of column)
                  *
                  * The whole pill turns over, and the text goes with it. Before
                  * this the pill stood still and only the words inside it faded
                  * up and down, which is a cross-fade, not a flip.
                  *
                  * The pill is also only as wide as its own line now. The old
                  * `min-w-[270px]` held every short slogan out to the width of
                  * the longest one, and it was raw px on a screen that is
                  * otherwise all design px, so it did not shrink with the
                  * canvas. The mock shows a pill hugging its text.
                  *
                  * The wrapper carries the height, not the pill alone. With
                  * `mode="wait"` there is a moment between the two pills where
                  * nothing is in the box; without a height here the column would
                  * lose 32px for that moment, and the measure effect above would
                  * move the badge underneath on every flip.
                  */}
                <div
                    ref={pillRef}
                    className="w-full h-xd-32 flex justify-center items-center z-20 flex-shrink-0"
                    style={{ perspective: 600 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={flipTextIndex}
                            initial={{ rotateX: -90, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            exit={{ rotateX: 90, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{ transformOrigin: 'center', backfaceVisibility: 'hidden' }}
                            className="h-xd-32 px-xd-20 rounded-[16px] bg-[#F4F0FE] border border-[#ECE9FE] flex items-center justify-center whitespace-nowrap"
                        >
                            <span className="text-xd-14 font-normal text-[#1d1d1d] text-center">
                                {FLIP_LABELS[flipTextIndex](translate)}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Gap between Slogan Pill and Dotted Badge: exactly 14px */}
                <FlexibleSpace size={14} share={flexShare(14)} />

                {/* 2. Dotted Circular Badge Logo (150px x 150px) */}
                {/* The badge that peeks over the bottom edge while the column
                    is still down, and rides it up. It is the shared mark, so it
                    carries straight on into Get Started rather than being
                    swapped for a second copy. Buddy Wink is its pattern: the
                    dots look around and blink, and the word never moves. */}
                <AuthLogoSlot />

                {/* Gap between Badge and Title (16px in the mock) */}
                <FlexibleSpace size={16} share={flexShare(16)} />

                {/* 3. Header Title: . Quick Preview . */}
                <div className="w-full flex justify-center items-center flex-shrink-0">
                    <h1 className="text-xd-30 font-bold text-[#1D1D1D]">
                        {translate('. Quick Preview .')}
                    </h1>
                </div>

                {/* Gap between Title and Card (16px in the mock) */}
                <FlexibleSpace size={16} share={flexShare(16)} />

                {/* 4. Main Interactive Preview Card Container (390px x 473px) */}
                <div className="w-xd-390 h-xd-473 rounded-xd-20 border-[1px] border-[#4A31E7] bg-white flex flex-col items-center justify-center p-xd-16 relative shadow-[0_4px_24px_rgba(74,49,231,0.06)] overflow-hidden flex-shrink-0">
                    {/* Embla Carousel Swiper Area (Mouse & Touch Swipe) */}
                    <div
                        className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing"
                        ref={emblaRef}
                    >
                        <div className="flex h-full touch-pan-y">
                            {PREVIEW_SLIDES.map((slide) => (
                                <div
                                    key={slide.id}
                                    className="flex-[0_0_100%] min-w-0 h-full flex flex-col items-center justify-center px-xd-20 text-center select-none"
                                >
                                    <div className="w-xd-100 h-xd-100 rounded-full bg-[#F4F0FE] flex items-center justify-center mb-xd-20 shadow-inner border border-[#ECE9FE]">
                                        {slide.icon}
                                    </div>
                                    <h3 className="text-xd-20 font-bold text-[#1D1D1D] mb-xd-8">
                                        {translate(slide.titleKey)}
                                    </h3>
                                    <p className="text-xd-14 text-[#5D5C5D] font-normal leading-[1.6] max-w-xd-320">
                                        {translate(slide.descKey)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Gap between Card and Dots (10px in the mock) */}
                <FlexibleSpace size={10} share={flexShare(10)} />

                {/* 5. Pagination Dots (3 Dots matching Mock) */}
                <div className="flex items-center gap-xd-8 pb-xd-2 flex-shrink-0">
                    {PREVIEW_SLIDES.map((slide) => (
                        <button
                            key={slide.id}
                            onClick={() => scrollToSlide(slide.id)}
                            aria-label={`Slide ${slide.id + 1}`}
                            className={`transition-all duration-300 cursor-pointer ${
                                slideIndex === slide.id
                                    ? 'w-xd-18 h-xd-6 rounded-full bg-[#1D1D1D]'
                                    : 'w-xd-6 h-xd-6 rounded-full border border-[#1D1D1D] bg-transparent hover:bg-[#1D1D1D]/30'
                            }`}
                        />
                    ))}
                </div>

                {/* Gap between Dots and Button (20px in the mock) */}
                <FlexibleSpace size={20} share={flexShare(20)} />

                {/* 6. Action Button: Next (Dashed purple) vs Get Started (Solid purple) */}
                <div className="w-full flex justify-center flex-shrink-0">
                    {!isLastSlide ? (
                        <button
                            onClick={handleNext}
                            data-pw="quick-preview-next"
                            style={{
                                backgroundImage:
                                    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='390' height='60' fill='none'><rect x='0.5' y='0.5' width='389' height='59' rx='19.5' stroke='%234A31E7' stroke-width='0.75' stroke-dasharray='3 3'/></svg>\")",
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                            }}
                            className="w-xd-390 h-xd-60 rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 font-normal cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-[#F8F7FF] flex items-center justify-center"
                        >
                            {translate('Next')}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            data-pw="quick-preview-get-started"
                            className="w-xd-390 h-xd-60 rounded-xd-20 bg-[#402CDD] text-white text-xd-16 font-normal cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-[#3623c7] shadow-[0_6px_22px_rgba(64,44,221,0.38)] flex items-center justify-center"
                        >
                            {translate('Get Started')}
                        </button>
                    )}
                </div>

                {/*
                  * Bottom space below the button. Mock: the button ends at
                  * 896, the artboard at 932.
                  */}
                <FlexibleSpace size={33} share={flexShare(33)} />
            </motion.div>
        </main>
    );
}
