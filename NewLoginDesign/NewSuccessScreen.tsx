'use client';

import { useEffect, useRef } from 'react';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';

interface NewSuccessScreenProps {
    variant: 'login' | 'signup';
    name?: string;
    onDone?: () => void;
    delayMs?: number;
    lang?: string;
}

export default function NewSuccessScreen({
    variant = 'signup',
    name,
    onDone,
    delayMs = 2500,
    lang = 'en',
}: NewSuccessScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    const onDoneRef = useRef(onDone);
    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    useEffect(() => {
        const timer = setTimeout(() => onDoneRef.current?.(), delayMs);
        return () => clearTimeout(timer);
    }, [delayMs]);

    const isLogin = variant === 'login';

    return (
        <div
            data-pw="welcome"
            className="w-full h-full flex flex-col items-start font-quicksand"
            /*
             * One colour for both endings. Welcome used to paint itself cream
             * (#FFFDF6) while the widget painted mint (#E0FFEE) around it and
             * OUTER_BG did the same, so the screen sat in a border of a colour
             * it did not use. Signing in and signing up are the same moment for
             * the shopper, so they get the same screen.
             */
            style={{ backgroundColor: '#E0FFEE' }}
        >
            {/* Top space, then the mark's resting place — AUTH_LOGO_STOP.top,
                shared with the phone, method and code screens. */}
            <AuthLogoSlot stop="top" />

            {/* 20px clearance below logo */}
            <FlexibleSpace size={20} share={0.03} />

            {/* Content block aligned to start (left) with px-xd-30 */}
            <div className="w-full px-xd-30 flex flex-col items-start">
                <h2 className="text-xd-30 font-bold text-[#1D1D1D]">
                    {isLogin ? translate('Welcome !') : translate('Sign Up Successfully !')}
                </h2>

                {isLogin ? (
                    <>
                        <p className="text-xd-16 font-medium text-[#1D1D1D] mt-xd-8">
                            {name || 'Mohamad Katmawi'}
                        </p>
                        <p className="text-xd-12 font-normal text-[#1D1D1D] mt-xd-4">
                            {translate('Enjoy With Our Services')}
                        </p>
                    </>
                ) : (
                    <p className="text-xd-16 font-medium text-[#1D1D1D] mt-xd-8">
                        {translate('Last Step And Enjoy Our Services')}
                    </p>
                )}
            </div>

            {/* Bottom space */}
            <FlexibleSpace grow share={0.8} />
        </div>
    );
}
