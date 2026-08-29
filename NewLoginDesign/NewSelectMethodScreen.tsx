'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';
import { authHeadingKey } from 'components/Login/Enhanced/authHeadings';
import AuthLogoSlot from './AuthLogoSlot';

interface NewSelectMethodScreenProps {
    setMethod: (method: 'sms' | 'whatsapp') => void;
    changeNumber?: () => void;
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

export default function NewSelectMethodScreen({
    setMethod,
    method,
    changeNumber,
    phone = '',
    authType,
    loading = false,
    onClose,
    error,
    lang = 'en',
}: NewSelectMethodScreenProps) {
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
                                <p
                                    data-pw="method-phone"
                                    className="text-trim-descend text-xd-12 font-medium text-[#1D1D1D]"
                                >
                                    +{phone}
                                </p>
                                {changeNumber && (
                                    <button
                                        onClick={changeNumber}
                                        data-pw="edit-phone-number"
                                        className="text-trim-descend text-xd-12 font-medium text-[#388CFF] underline cursor-pointer"
                                    >
                                        {translate('Edit')}
                                    </button>
                                )}
                            </div>
                            <div className="flex pt-xd-8 items-center gap-xd-6">
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

                {/* Bottom half — live method buttons */}
                <div className="w-full h-1/2 flex flex-col items-center">
                    <FlexibleSpace size={37} share={0} />
                    <div className="flex w-xd-400">
                        <button
                            onClick={() => !loading && !blocked && setMethod('whatsapp')}
                            data-pw="whatsapp-receive-otp"
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
                            data-pw="sms-receive-otp"
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
                            data-pw="otp-cooldown"
                            className="pt-xd-10 text-xd-12 font-medium text-[#FF5F61] text-center"
                        >
                            <span>{translate('Wait')} </span>
                            <span className="font-bold">{lockRemaining}{translate('s')}</span>
                            <span> {translate('before trying again')}</span>
                        </div>
                    )}

                    {lockRemaining === 0 && capReached && (
                        <div
                            data-pw="otp-cap-reached"
                            className="pt-xd-10 text-xd-12 font-medium text-[#FF5F61] text-center"
                        >
                            {translate('Session limit reached. Try again later.')}
                        </div>
                    )}

                    {!blocked && error && (
                        <div
                            data-pw="send-otp-error"
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
