'use client';

import { useEffect, useRef } from 'react';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import { AUTH_SUCCESS_BG } from 'scaling/scale.config';
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
             * The XD ends the two journeys on different colours: signing up on
             * mint, signing in on cream. They were once folded into one colour
             * to fix a real bug — this screen painted itself cream while the
             * widget and OUTER_BG painted mint around it, so it sat in a border
             * of a colour it did not use. That bug stays fixed: all three read
             * the same two values, so the screen and its surround always agree.
             */
            style={{ backgroundColor: isLogin ? AUTH_SUCCESS_BG.login : AUTH_SUCCESS_BG.signup }}
        >
            {/* Top space, then the mark's resting place — AUTH_LOGO_STOP.top,
                shared with the phone, method and code screens. */}
            <AuthLogoSlot stop="top" />

            {/* 20px clearance below logo */}
            <FlexibleSpace size={17} share={0.03} />

            {/* Content block aligned to start (left) with px-xd-30 */}
            <div className="w-full px-xd-40 flex flex-col items-start">
                <h2 className="text-trim-descend text-xd-30 font-bold text-[#1D1D1D]">
                    {isLogin ? translate('Welcome !') : translate('Sign Up Successfully !')}
                </h2>

                {isLogin ? (
                    <>
                        <FlexibleSpace size={47} share={0.05} />
                        <p className="text-trim-descend text-xd-16 leading-xd-20 font-medium text-[#1D1D1D]">
                            {name || 'Mohamad Katmawi'}
                        </p>
                        <FlexibleSpace size={12} share={0} />
                        <p className="text-trim-descend text-xd-12 leading-xd-16 font-normal text-[#1D1D1D]">
                            {translate('Enjoy With Our Services')}
                        </p>
                    </>
                ) : (
                    <>
                        <FlexibleSpace size={47} share={0.05} />
                        <p className="text-trim-descend text-xd-16 leading-xd-20 font-medium text-[#1D1D1D]">
                            {translate('Last Step And Enjoy Our Services')}
                        </p>
                    </>
                )}
            </div>

            {/* Bottom space */}
            <FlexibleSpace grow share={0.8} />
        </div>
    );
}
