'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';

interface SplashScreenProps {
    onFinish?: () => void;
    autoAdvanceMs?: number;
    lang?: string;
    variant?: 'floated' | 'fullscreen';
}

export default function SplashScreen({
    onFinish,
    autoAdvanceMs = 2500,
    lang = 'en',
}: SplashScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    useEffect(() => {
        if (!onFinish || !autoAdvanceMs) return;
        const timer = setTimeout(() => {
            onFinish();
        }, autoAdvanceMs);
        return () => clearTimeout(timer);
    }, [onFinish, autoAdvanceMs]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-between bg-white font-quicksand relative overflow-hidden select-none">
            {/* Background Decorative Accents */}
            <div className="absolute -top-xd-100 -start-xd-100 w-xd-300 h-xd-300 bg-[#F4F8FF] rounded-full blur-3xl opacity-70 pointer-events-none" />
            <div className="absolute -bottom-xd-100 -end-xd-100 w-xd-300 h-xd-300 bg-[#E0FFEE] rounded-full blur-3xl opacity-50 pointer-events-none" />

            <FlexibleSpace size={240} share={0.4} />

            {/* Brand Logo & Name */}
            <div className="flex flex-col items-center z-10">
                <div className="w-xd-144 h-xd-104 relative flex items-center justify-center animate-pulse">
                    <Image
                        src="/assets/icons/rdb.svg"
                        alt="RDB Logo"
                        width={144}
                        height={104}
                        priority
                        className="w-xd-144 h-xd-104 object-contain"
                    />
                </div>
                <h1 className="text-xd-32 font-bold text-[#1D1D1D] mt-xd-16 tracking-tight text-trim-descend">
                    {translate('Trydos')}
                </h1>
            </div>

            <FlexibleSpace size={120} share={0.2} />

            {/* Subtle Loading Spinner & Tagline */}
            <div className="flex flex-col items-center pb-xd-50 z-10">
                <div className="w-xd-28 h-xd-28 border-2 border-[#388CFF] border-t-transparent rounded-full animate-spin mb-xd-16" />
                <p className="text-xd-12 font-medium text-[#8E8E8E] text-center tracking-wide">
                    {translate('Your Trusted Commerce Partner')}
                </p>
            </div>

            <FlexibleSpace size={40} share={0} />
        </div>
    );
}
