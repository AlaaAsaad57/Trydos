'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RdbPhoneInput from 'components/Login/Enhanced/ui/RdbPhoneInput';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { getNumberLockRemaining } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';
import { authHeadingKey } from 'components/Login/Enhanced/authHeadings';
import AuthLogoSlot from './AuthLogoSlot';

interface NewEnterPhoneScreenProps {
    onSubmit: (phone: string) => void;
    loading?: boolean;
    phone: string;
    authType: string;
    setPhone: (phone: string) => void;
    onClose?: () => void;
    /** Message from a failed send/verify, already translated by the caller. */
    error?: string;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

export default function NewEnterPhoneScreen({
    onSubmit,
    loading,
    phone,
    authType,
    setPhone,
    onClose,
    error,
    lang = 'en',
}: NewEnterPhoneScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const [lockRemaining, setLockRemaining] = useState(0);

    useEffect(() => {
        const sync = () => {
            setLockRemaining(getNumberLockRemaining(phone));
        };
        sync();
        const id = setInterval(sync, 1000);
        return () => clearInterval(id);
    }, [phone]);

    const handleSubmit = () => {
        if (lockRemaining > 0) return;
        onSubmit(phone);
    };

    return (
        <div className="w-full h-full flex flex-col items-start bg-white font-quicksand relative">
            {/* Close button */}
            <div className="flex absolute justify-end right-xd-30 top-xd-30 z-10">
                {onClose && (
                    <button
                        onClick={onClose}
                        data-pw="close"
                        className="w-xd-24 h-xd-24 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        aria-label={translate('Close')}
                    >
                        <Image
                            src="/assets/icons/auth/close.svg"
                            alt="close"
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                    </button>
                )}
            </div>

            {/* The mark's resting place. Pinned rather than in the flow: the
                block below hangs off half the canvas, and a 250px slot dropped
                into that flow would squeeze it and drag the text up with it.
                The stop is the same one the outcome screens use. */}
            <AuthLogoSlot stop="top" absolute />

            <FlexibleSpace size={0} share={0.3} />

            <div className="w-full h-full flex flex-col items-start">
                {/* Top half — title + info. The mark is pinned above, not in this stack. */}
                <div className="w-full h-1/2 flex flex-col justify-end px-xd-20 items-start">
                    <div className="h-xd-115 w-full">
                        <h2 className="text-trim-descend text-xd-30 px-xd-20 font-bold text-[#1D1D1D]">
                            {translate(authHeadingKey(authType))}
                        </h2>
                        <div className="w-full flex px-xd-20 flex-col pt-xd-12 items-start">
                            <p className="text-trim-descend text-xd-16 text-[#1D1D1D] font-normal">
                                {translate('Enter Your Phone Number Registered With Us')}
                            </p>
                            <div className="flex items-center pt-xd-8 gap-xd-5">
                                <span className="text-trim-descend text-xd-12 text-[#1D1D1D] font-medium">
                                    {translate('We Will Send A Verification Code To The Number')}
                                </span>
                                <div className="w-xd-15 h-xd-15 shrink-0">
                                    <Image
                                        src="/assets/icons/auth/sim.svg"
                                        alt="sim"
                                        width={15}
                                        height={15}
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center pt-xd-8 gap-xd-5">
                                <span className="text-trim-descend text-xd-11 text-[#4A31E7] font-medium">
                                    {translate('Your Privacy Is Completely Safe')}
                                </span>
                                <div className="w-xd-14 h-xd-14 shrink-0 flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="#4A31E7"
                                    >
                                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <FlexibleSpace size={60} share={0} />
                </div>

                {/* Bottom half — phone input */}
                <FlexibleSpace size={35} share={0} />
                <div className="w-full h-1/2 flex flex-col items-center">
                    <div className="w-xd-390 h-xd-60">
                        <RdbPhoneInput
                            onSend={handleSubmit}
                            value={phone}
                            onChange={setPhone}
                            placeholder={translate('Enter Your Phone Number')}
                            lang={lang}
                            isLoading={loading || lockRemaining > 0}
                        />
                    </div>
                    {lockRemaining > 0 ? (
                        <div
                            data-pw="otp-cooldown"
                            className="pt-xd-10 text-xd-12 font-medium text-[#FF5F61] text-center"
                        >
                            <span>{translate('Wait')} </span>
                            <span className="font-bold">
                                {lockRemaining}
                                {translate('s')}
                            </span>
                            <span> {translate('before trying again')}</span>
                        </div>
                    ) : (
                        error && (
                            <div
                                data-pw="phone-error"
                                role="alert"
                                className="pt-xd-10 px-xd-20 text-xd-12 font-medium text-[#FF5F61] text-center"
                            >
                                {error}
                            </div>
                        )
                    )}
                    <FlexibleSpace grow />
                </div>
            </div>
        </div>
    );
}
