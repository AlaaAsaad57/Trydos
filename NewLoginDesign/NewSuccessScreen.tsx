'use client';

import { useEffect, useRef } from 'react';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import NewLoginLogo from './NewLoginLogo';

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
            style={{ backgroundColor: isLogin ? '#FFFDF6' : '#E0FFEE' }}
        >
            {/* Top space before logo */}
            <FlexibleSpace size={100} share={0.15} />

            {/* Centered Dotted Badge Ring Logo */}
            <div className="w-full flex justify-center">
                <NewLoginLogo
                    variant="badge-ring"
                    dotColor={isLogin ? 'purple' : 'green'}
                    ringColor={isLogin ? '#402CDD' : '#28C452'}
                    width={150}
                    height={150}
                />
            </div>

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
