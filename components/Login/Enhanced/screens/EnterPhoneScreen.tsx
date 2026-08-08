'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RdbPhoneInput from '../ui/RdbPhoneInput';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { getNumberLockRemaining } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';

interface EnterPhoneScreenProps {
    onSubmit: (phone: string) => void;
    loading?: boolean;
    phone: string;
    authType: string;
    setPhone: (phone: string) => void;
    onClose?: () => void;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

export default function EnterPhoneScreen({
    onSubmit,
    loading,
    phone,
    authType,
    setPhone,
    onClose,
    lang = 'en',
}: EnterPhoneScreenProps) {
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

            <FlexibleSpace size={0} share={0.3} />

            <div className="w-full h-full flex flex-col items-start">
                {/* Top half — title + info */}
                <div className="w-full h-1/2 flex flex-col justify-end px-xd-20 items-start">
                    <div className="h-xd-115 w-full">
                        <h2 className="text-trim-descend text-xd-30 px-xd-20 font-bold text-[#1D1D1D]">
                            {authType === 'signUp'
                                ? translate('Sign Up !')
                                : translate('Login !')}
                        </h2>
                        <div className="w-full flex px-xd-20 flex-col pt-xd-12 items-start">
                            <p className="text-trim-descend text-xd-16 text-[#1D1D1D] font-medium">
                                {translate('Enter Your Phone Number Registered With Us')}
                            </p>
                            <div className="flex items-center pt-xd-8 gap-xd-5">
                                <span className="text-trim-descend text-xd-12 text-[#1D1D1D]">
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
                                <span className="text-trim-descend text-xd-11 text-[#C3C3C3]">
                                    {translate('Your Privacy Is Completely Safe')}
                                </span>
                                <div className="w-xd-14 h-xd-14 shrink-0">
                                    <Image
                                        src="/assets/icons/auth/shield.svg"
                                        alt="shield"
                                        width={14}
                                        height={14}
                                        className="object-contain"
                                    />
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
                    {lockRemaining > 0 && (
                        <div
                            data-cy="otp-cooldown"
                            className="pt-xd-10 text-xd-12 font-medium text-[#FF5F61] text-center"
                        >
                            <span>{translate('Wait')} </span>
                            <span className="font-bold">{lockRemaining}s</span>
                            <span> {translate('before trying again')}</span>
                        </div>
                    )}
                    <FlexibleSpace grow />
                </div>
            </div>
        </div>
    );
}

