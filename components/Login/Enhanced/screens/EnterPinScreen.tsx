'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import RdbPinInputs from '../ui/RdbPinInputs';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { getNumberLockRemaining } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';
import { authHeadingKey } from '../authHeadings';

interface EnterPinScreenProps {
    onSubmit: (pin: string) => void;
    changeMethod?: () => void;
    changeNumber?: () => void;
    onClose?: () => void;
    phone?: string;
    method?: string;
    pin: string;
    authType?: string;
    setPin: (pin: string) => void;
    onResend?: () => void;
    loading?: string;
    isValidPin?: 'valid' | 'notvalid' | '';
    timerSeconds?: number;
    /** Message from a failed verify, already translated by the caller. */
    error?: string;
    /** Fires once when the resend cooldown runs out (analytics only). */
    onTimerExpired?: () => void;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

export default function EnterPinScreen({
    onSubmit,
    changeMethod,
    changeNumber,
    onClose,
    phone = '',
    method = 'sms',
    pin,
    authType = 'signUp',
    setPin,
    onResend,
    loading = '',
    isValidPin = '',
    timerSeconds = 120,
    error,
    onTimerExpired,
    lang = 'en',
}: EnterPinScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const [timeLeft, setTimeLeft] = useState(timerSeconds);
    const [canResend, setCanResend] = useState(false);

    // Kept in a ref so the interval below never restarts just because the
    // parent handed us a new function identity.
    const onTimerExpiredRef = useRef(onTimerExpired);
    useEffect(() => {
        onTimerExpiredRef.current = onTimerExpired;
    }, [onTimerExpired]);
    // One report per cooldown, not one per tick. Starts "already reported" so a
    // screen that opens with no cooldown running (storage disabled, resumed
    // session) doesn't report an expiry that never happened.
    const reportedExpiryRef = useRef(true);

    useEffect(() => {
        const sync = () => {
            const remaining = phone ? getNumberLockRemaining(phone) : 0;
            if (remaining > 0) {
                setTimeLeft(remaining);
                setCanResend(false);
                reportedExpiryRef.current = false;
            } else {
                setTimeLeft(0);
                setCanResend(true);
                if (!reportedExpiryRef.current) {
                    reportedExpiryRef.current = true;
                    onTimerExpiredRef.current?.();
                }
            }
        };
        sync();
        const timer = setInterval(sync, 1000);
        return () => clearInterval(timer);
    }, [phone]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePinComplete = (value: string) => {
        setPin(value);
        onSubmit(value);
    };

    const handleResend = () => {
        if (phone && getNumberLockRemaining(phone) > 0) return;
        if (onResend) {
            onResend();
            setCanResend(false);
            setPin('');
        }
    };

    const isExpired = canResend && !loading;
    const methodLabel = method === 'whatsapp' ? translate('Whatsapp') : translate('SMS');

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

            <div className="w-full h-full flex flex-col items-start">
                {/* Top half — title + OTP info */}
                <div className="w-full h-1/2 flex flex-col justify-end px-xd-20 items-start">
                    <div className="h-xd-138 w-full relative">
                        <h2 className="text-trim-descend text-xd-30 px-xd-20 font-bold text-[#1D1D1D]">
                            {translate(authHeadingKey(authType))}
                        </h2>
                        <div className="w-full flex pl-xd-20 pt-xd-12 flex-col items-start">
                            <p className="text-trim-descend text-xd-16 text-[#1D1D1D] font-medium">
                                {`${translate('Enter Verification Code Sent To Your')} ${methodLabel}`}
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
                                <span className="text-trim-descend text-xd-12 font-normal text-[#1D1D1D]">
                                    +{phone}
                                </span>
                                {!isExpired ? (
                                    <span className="text-trim-descend text-xd-12 font-normal text-[#C3C3C3]">
                                        {translate('Resend After -')}{' '}
                                        <span className="text-[#388CFF] font-bold">
                                            {formatTime(timeLeft)}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-trim-descend text-xd-12 font-normal text-[#C3C3C3]">
                                        {translate("Didn't You Receive A Code?")}
                                    </span>
                                )}
                                <div className="w-xd-15 h-xd-15 shrink-0">
                                    <Image
                                        src="/assets/icons/auth/info.svg"
                                        alt="info"
                                        width={15}
                                        height={15}
                                        className="object-contain text-[#C3C3C3]"
                                    />
                                </div>
                            </div>
                            {isExpired && (
                                <div className="flex items-center pt-xd-8 gap-xd-5">
                                    <button
                                        onClick={handleResend}
                                        data-pw="resend-code"
                                        className="text-trim-descend text-xd-13 text-[#388CFF] underline cursor-pointer"
                                    >
                                        {translate('Resend Code')}
                                    </button>
                                    {changeNumber && (
                                        <>
                                            <span className="text-trim-descend text-xd-12 text-[#8E8E8E]">
                                                {translate('Or')}
                                            </span>
                                            <button
                                                onClick={changeNumber}
                                                data-pw="change-phone-number"
                                                className="text-trim-descend text-xd-13 text-[#388CFF] underline cursor-pointer"
                                            >
                                                {translate('Change Number')}
                                            </button>
                                        </>
                                    )}
                                    {changeMethod && (
                                        <>
                                            <span className="text-trim-descend text-xd-12 text-[#8E8E8E]">
                                                {translate('Or')}
                                            </span>
                                            <button
                                                onClick={changeMethod}
                                                data-pw="change-otp-method"
                                                className="text-trim-descend text-xd-13 text-[#388CFF] underline cursor-pointer"
                                            >
                                                {translate('Method')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                            <span className="flex items-center pt-xd-8 gap-xd-5">
                                <p className="text-trim-descend text-xd-12 font-normal text-[#C3C3C3]">
                                    {translate('Your Privacy Is Completely Safe')}
                                </p>
                                <div className="w-xd-14 h-xd-14 shrink-0">
                                    <Image
                                        src="/assets/icons/auth/shield.svg"
                                        alt="shield"
                                        width={14}
                                        height={14}
                                        className="object-contain text-[#C3C3C3]"
                                    />
                                </div>
                            </span>
                        </div>
                    </div>
                    <FlexibleSpace size={40} share={0} />
                </div>

                {/* Bottom half — OTP inputs */}
                <div className="w-full h-1/2 flex flex-col items-center">
                    <FlexibleSpace size={30} share={0} />
                    <RdbPinInputs
                        value={pin}
                        onChange={setPin}
                        onComplete={handlePinComplete}
                        disabled={loading === 'verify-pin' || isValidPin === 'valid' || isExpired}
                        isValidPin={isValidPin}
                        isExpired={isExpired}
                    />
                    {isExpired && (
                        <p className="text-xd-11 pt-1 font-medium text-[#1D1D1D]">
                            {translate('The Code Sent Has Expired')}
                        </p>
                    )}
                    {!isExpired && error && (
                        <p
                            data-pw="verify-otp-error"
                            role="alert"
                            className="text-xd-11 pt-1 px-xd-20 font-medium text-[#FF5F61] text-center"
                        >
                            {error}
                        </p>
                    )}
                    <FlexibleSpace grow />
                </div>
            </div>
        </div>
    );
}

