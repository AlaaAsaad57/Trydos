'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';

interface AuthSuccessScreenProps {
    variant: 'login' | 'signup';
    onDone?: () => void;
    delayMs?: number;
    lang?: string;
}

const variantStyles = {
    login: {
        title: 'Login Successfully !',
        subtitle: 'Welcome Back, Enjoy Our Services',
        bg: '#E0FFEE',
        cls: 'outer-bg-login-success',
    },
    signup: {
        title: 'Sign Up Successfully !',
        subtitle: 'Enjoy With Our Services',
        bg: '#E0FFEE',
        cls: 'outer-bg-signup-success',
    },
};

export default function AuthSuccessScreen({
    variant,
    onDone,
    delayMs = 1500,
    lang = 'en',
}: AuthSuccessScreenProps) {
    const { title, subtitle, bg, cls } = variantStyles[variant];
    const translate = (key: string) => translateFunction(key, lang);

    const onDoneRef = useRef(onDone);
    useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

    useEffect(() => {
        const timer = setTimeout(() => onDoneRef.current?.(), delayMs);
        return () => clearTimeout(timer);
    }, [delayMs]);

    return (
        <div data-pw="welcome" className={`w-full h-full flex flex-col items-start font-quicksand ${cls}`} style={{ backgroundColor: bg }}>
            {/* Top space */}
            <FlexibleSpace size={366} share={0.5} />

            {/* Centered content */}
            <div className="w-full flex flex-col items-center text-center px-xd-30">
                <h2 className="text-xd-30 font-bold text-[#1D1D1D]">{translate(title)}</h2>
                <p className="text-xd-16 mt-xd-5 text-[#1D1D1D] font-medium">{translate(subtitle)}</p>
            </div>

            {/* Bottom space */}
            <FlexibleSpace size={566} share={0.5} />
        </div>
    );
}
