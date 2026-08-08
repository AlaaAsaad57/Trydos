'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';

interface SelectMethodScreenProps {
    setMethod: (method: 'sms' | 'whatsapp') => void;
    changeNumber: () => void;
    method?: 'sms' | 'whatsapp' | '';
    phone?: string;
    authType: string;
    loading?: boolean;
    onClose?: () => void;
    /** Message from a failed send, already translated by the caller. */
    error?: string;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

export default function SelectMethodScreen({
    setMethod,
    method,
    changeNumber,
    phone = '',
    authType,
    loading = false,
    onClose,
    error,
    lang = 'en',
}: SelectMethodScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    const [lockRemaining, setLockRemaining] = useState(0);
    const [capReached, setCapReached] = useState(false);

    useEffect(() => {
        const sync = () => {
            if (phone) {
                setLockRemaining(getNumberLockRemaining(phone));
                setCapReached(isSessionCapReached(phone));
            }
        };
        sync();
        const id = setInterval(sync, 1000);
        return () => clearInterval(id);
    }, [phone]);

    const blocked = lockRemaining > 0 || capReached;

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
                                {translate('Choose Verification Method')}
                            </p>
                            <div className="flex pt-xd-8 items-center gap-xd-5">
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
                            <div className="flex pt-xd-8 items-center gap-xd-6">
                                <p className="text-trim-descend text-xd-12 font-medium text-[#1D1D1D]">
                                    +{phone}
                                </p>
                                <button
                                    onClick={changeNumber}
                                    className="text-trim-descend text-xd-12 font-medium text-[#388CFF] underline cursor-pointer"
                                >
                                    {translate('Edit')}
                                </button>
                            </div>
                            <div className="flex pt-xd-8 items-center gap-xd-6">
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

                {/* Bottom half — method buttons */}
                <div className="w-full h-1/2 flex flex-col items-center">
                    <FlexibleSpace size={37} share={0} />
                    <div className="flex w-xd-400">
                        <button
                            onClick={() => !loading && !blocked && setMethod('whatsapp')}
                            disabled={loading || blocked}
                            className={`relative my-1 mx-0.5 w-xd-193 flex flex-1 flex-col items-center justify-center h-xd-60 rounded-xd-20 border border-dashed transition-all cursor-pointer disabled:cursor-not-allowed ${
                                blocked
                                    ? 'opacity-50 border-[#C3C3C3]'
                                    : method === 'whatsapp'
                                      ? 'border-[#388CFF] bg-[#FCFCFC]'
                                      : 'border-[#C3C3C3]'
                            }`}
                        >
                            <span
                                className={`absolute bg-white -top-2.5 left-xd-14 w-5 h-5 flex z-9999 items-center justify-center ${loading && method === 'whatsapp' ? 'animate-bounce-vertical' : ''}`}
                            >
                                <Image
                                    src="/assets/icons/auth/whatsapp.svg"
                                    alt="whatsapp"
                                    width={20}
                                    height={20}
                                    className="size-xd-20 object-contain"
                                />
                            </span>
                            <span className="text-xd-16 font-normal text-[#1D1D1D]">
                                {translate('Send WhatsApp')}
                            </span>
                        </button>

                        <button
                            onClick={() => !loading && !blocked && setMethod('sms')}
                            disabled={loading || blocked}
                            className={`relative my-1 mx-0.5 w-xd-193 flex flex-1 flex-col items-center justify-center h-xd-60 rounded-xd-20 border border-dashed transition-all cursor-pointer disabled:cursor-not-allowed ${
                                blocked
                                    ? 'opacity-50 border-[#C3C3C3]'
                                    : method === 'sms'
                                      ? 'border-[#388CFF] bg-[#FCFCFC]'
                                      : 'border-[#C3C3C3]'
                            }`}
                        >
                            <span
                                className={`absolute bg-white -top-2.5 left-xd-14 w-5 h-5 z-9999 flex items-center justify-center ${loading && method === 'sms' ? 'animate-bounce-vertical' : ''}`}
                            >
                                <Image
                                    src="/assets/icons/auth/sms.svg"
                                    alt="sms"
                                    width={20}
                                    height={20}
                                    className="size-xd-20 object-contain"
                                />
                            </span>
                            <span className="text-xd-16 text-[#1D1D1D]">
                                {translate('Send SMS')}
                            </span>
                        </button>
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

                    {lockRemaining === 0 && capReached && (
                        <div
                            data-cy="otp-cap-reached"
                            className="pt-xd-10 text-xd-12 font-medium text-[#FF5F61] text-center"
                        >
                            {translate('Session limit reached. Try again later.')}
                        </div>
                    )}

                    {!blocked && error && (
                        <div
                            data-cy="send-otp-error"
                            role="alert"
                            className="pt-xd-10 px-xd-20 text-xd-12 font-medium text-[#FF5F61] text-center"
                        >
                            {error}
                        </div>
                    )}

                    <FlexibleSpace grow />
                </div>
            </div>
        </div>
    );
}

