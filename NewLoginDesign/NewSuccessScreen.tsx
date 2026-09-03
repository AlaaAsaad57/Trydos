'use client';

import { useEffect, useRef } from 'react';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import { XD } from './authLayout';

interface NewSuccessScreenProps {
    variant: 'login' | 'signup';
    name?: string;
    onDone?: () => void;
    delayMs?: number;
    lang?: string;
}

/**
 * The two endings are two screens in the design, not one.
 *
 * `Registration - 27` (sign-up done) is mint `#D8FFEA` with a green mark.
 * `Registration - 33` (welcome back) is cream `#FFFEF2` with the purple mark.
 * The code had merged them into one green screen; the design keeps them apart,
 * so this does too. The mark's colour is chosen by `NewLoginWidget`.
 */
export const SUCCESS_BG = {
    signup: '#D8FFEA',
    login: '#FFFEF2',
} as const;

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
            className="w-full h-full font-quicksand relative"
            style={{ backgroundColor: SUCCESS_BG[isLogin ? 'login' : 'signup'] }}
        >
            <AuthLogoSlot stop="top" />

            <h2
                className="absolute text-xd-30 font-bold text-[#1D1D1D]"
                style={{ top: XD.head.title, left: XD.textLeft }}
            >
                {isLogin ? translate('Welcome !') : translate('Sign up successfully !')}
            </h2>

            <p
                className="absolute text-xd-16 font-medium text-[#1D1D1D]"
                style={{ top: XD.head.line2, left: XD.textLeft }}
            >
                {isLogin ? name || '' : translate('Last step and enjoy our services')}
            </p>

            {isLogin && (
                <p
                    className="absolute text-xd-12 font-normal text-[#1D1D1D]"
                    style={{ top: XD.head.line3, left: XD.textLeft }}
                >
                    {translate('Enjoy with our services')}
                </p>
            )}
        </div>
    );
}
