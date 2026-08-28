'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import NewLoginLogo from './NewLoginLogo';

interface QuickPreviewScreenProps {
    onComplete: () => void;
    lang?: string;
    autoExpandDelayMs?: number; // Defaults to 8000 (8 seconds)
}

const FLIP_TEXTS = [
    ' Your new shopping buddy ',
    ' try different online shopping ',
    ' shop . connect . invest . enjoy ',
    ' Social e-commerce ',
    ' Shopping, redefined ',
    ' A revolutionary new shopping concept ',
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

export default function QuickPreviewScreen({
    onComplete,
    lang = 'en',
    autoExpandDelayMs = 8000,
}: QuickPreviewScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const [isHydrated, setIsHydrated] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [slideIndex, setSlideIndex] = useState<number>(0);
    const [flipTextIndex, setFlipTextIndex] = useState<number>(0);

    // Trigger hydration on mount
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
        }, autoExpandDelayMs);
        return () => clearTimeout(timer);
    }, [isHydrated, autoExpandDelayMs]);

    // Fast slogan flipping interval (1.4s)
    useEffect(() => {
        if (!isHydrated) return;
        const interval = setInterval(() => {
            setFlipTextIndex((prev) => (prev + 1) % FLIP_TEXTS.length);
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
                        <NewLoginLogo
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
                initial={{ y: 1000 }}
                animate={{ y: !isHydrated ? 1000 : isExpanded ? 0 : 750 }}
                transition={{ duration: isExpanded ? 1.1 : 0.8, ease: [0.25, 1, 0.5, 1] }}
                className="w-full flex flex-col items-center relative z-20"
            >
                {/* Top Spacing to position button perfectly near bottom edge */}
                <FlexibleSpace size={70} share={0.3} />

                {/* 1. Slogan Pill Badge (Top of column) */}
                <div className="w-full flex justify-center z-20">
                    <div className="h-xd-32 px-xd-20 rounded-[16px] bg-[#F4F0FE] border border-[#ECE9FE] flex items-center justify-center  min-w-[270px]">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={flipTextIndex}
                                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="text-xd-14 font-medium text-[#1d1d1d] text-center whitespace-nowrap"
                            >
                                <span className="text-[#4A31E7]">.</span> {translate(FLIP_TEXTS[flipTextIndex])} <span className="text-[#4A31E7]">.</span>
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Gap between Slogan Pill and Dotted Badge: exactly 14px */}
                <FlexibleSpace size={14} share={0.03} />

                {/* 2. Dotted Circular Badge Logo (150px x 150px) */}
                <div className="flex flex-col items-center justify-center flex-shrink-0">
                    <NewLoginLogo
                        variant="badge-ring"
                        dotColor="purple"
                        ringColor="#402CDD"
                        width={150}
                        height={150}
                    />
                </div>

                {/* Gap between Badge and Title (8px) */}
                <FlexibleSpace size={8} share={0.03} />

                {/* 3. Header Title: . Quick Preview . */}
                <div className="w-full flex justify-center items-center flex-shrink-0">
                    <h1 className="text-xd-30 font-bold text-[#1D1D1D] tracking-tight">
                        {translate('. Quick Preview .')}
                    </h1>
                </div>

                {/* Gap between Title and Card (10px) */}
                <FlexibleSpace size={10} share={0.04} />

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

                {/* Gap between Card and Dots (12px) */}
                <FlexibleSpace size={12} share={0.05} />

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

                {/* Gap between Dots and Button (16px) */}
                <FlexibleSpace size={16} share={0.05} />

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

                {/* Bottom space below button to bottom edge */}
                <FlexibleSpace size={42} share={0.5} />
            </motion.div>
        </main>
    );
}
