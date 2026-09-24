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
    /**
     * The tries ran out — three wrong codes since the last one arrived. Kills the
     * boxes exactly the way a spent code does. The words come through `error`,
     * not from here, so the expired line still wins when both are true.
     */
    attemptsLocked?: boolean;
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
    attemptsLocked = false,
    timerSeconds = 120,
    error,
    onTimerExpired,
    lang = 'en',
}: EnterPinScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    // TWO CLOCKS, AND THEY ARE NOT THE SAME THING.
    //
    //   canResend — our own send cooldown: how long until this number may be
    //               sent ANOTHER code. It comes from `utils/otpLocks`, which
    //               mirrors the server's rate limit (OTP_COOLDOWN_SECONDS, 60
    //               by default).
    //   codeSpent — how long the code already in the shopper's hand is worth
    //               typing. Nothing on the wire tells us this, so it is the
    //               screen's own `timerSeconds` counted from when the code was
    //               sent.
    //
    // This screen used to drive both off the cooldown, which broke twice. A
    // send that arms no cooldown — an allow-listed test number
    // (services/auth.ts skips the lock for one), or any browser where
    // sessionStorage is unavailable, so `utils/otpLocks` silently keeps
    // nothing — opened this screen already saying the code had expired, with
    // the boxes disabled: a shopper holding a real code with no way to type
    // it, and a Resend that landed them straight back in the same state. And
    // when the cooldown did run, it killed a still-valid code the moment the
    // resend unlocked, because our rate limit is not the backend's lifetime.
    const [timeLeft, setTimeLeft] = useState(timerSeconds);
    const [canResend, setCanResend] = useState(false);
    const [codeSpent, setCodeSpent] = useState(false);

    // When the code the shopper is holding was sent. The screen is put up as
    // the send resolves, so that is the start of it; a resend starts it again.
    // A ref, not state, so moving it never restarts the ticker below.
    const sentAtRef = useRef(Date.now());

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
            setCodeSpent(Date.now() - sentAtRef.current >= timerSeconds * 1000);
        };
        sync();
        const timer = setInterval(sync, 1000);
        return () => clearInterval(timer);
    }, [phone, timerSeconds]);

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
            // A new code carries its own life; the old one's is spent either
            // way and must not be held against the code replacing it.
            sentAtRef.current = Date.now();
            setCodeSpent(false);
            setPin('');
        }
    };

    /** The shopper may ask for another code, or change how it arrives. */
    const canAskAgain = canResend && !loading;
    /** The code they were sent is past its life — typing it is pointless. */
    const codeExpired = codeSpent && !loading;
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
                        <h2 className="text-xd-30 px-xd-20 font-bold text-[#1D1D1D]">
                            {translate(authHeadingKey(authType))}
                        </h2>
                        <div className="w-full flex pl-xd-20 pt-xd-12 flex-col items-start">
                            <p className="text-xd-16 text-[#1D1D1D] font-medium">
                                {`${translate('Enter Verification Code Sent To Your')} ${methodLabel}`}
                            </p>
                            <div className="flex items-center pt-xd-8 gap-xd-5">
                                <span className="text-xd-12 text-[#1D1D1D]">
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
                                <span className="text-xd-12 font-normal text-[#1D1D1D]">
                                    +{phone}
                                </span>
                                {!canAskAgain ? (
                                    <span className="text-xd-12 font-normal text-[#C3C3C3]">
                                        {translate('Resend After -')}{' '}
                                        <span className="text-[#388CFF] font-bold">
                                            {formatTime(timeLeft)}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-xd-12 font-normal text-[#C3C3C3]">
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
                            {canAskAgain && (
                                <div className="flex items-center pt-xd-8 gap-xd-5">
                                    <button
                                        onClick={handleResend}
                                        data-pw="resend-code"
                                        className="text-xd-13 text-[#388CFF] underline cursor-pointer"
                                    >
                                        {translate('Resend Code')}
                                    </button>
                                    {changeNumber && (
                                        <>
                                            <span className="text-xd-12 text-[#8E8E8E]">
                                                {translate('Or')}
                                            </span>
                                            <button
                                                onClick={changeNumber}
                                                data-pw="change-phone-number"
                                                className="text-xd-13 text-[#388CFF] underline cursor-pointer"
                                            >
                                                {translate('Change Number')}
                                            </button>
                                        </>
                                    )}
                                    {changeMethod && (
                                        <>
                                            <span className="text-xd-12 text-[#8E8E8E]">
                                                {translate('Or')}
                                            </span>
                                            <button
                                                onClick={changeMethod}
                                                data-pw="change-otp-method"
                                                className="text-xd-13 text-[#388CFF] underline cursor-pointer"
                                            >
                                                {translate('Method')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                            <span className="flex items-center pt-xd-8 gap-xd-5">
                                <p className="text-xd-12 font-normal text-[#C3C3C3]">
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
                        // `isExpired` is not decoration next to `disabled`: it is
                        // the only thing that closes the on-screen keypad
                        // (RdbPinInputs gates the keypad on it, and its
                        // outside-click closer gives up while disabled). A lock
                        // that set `disabled` alone would strand an open keypad
                        // over dead boxes with no way to shut it.
                        disabled={
                            loading === 'verify-pin' ||
                            isValidPin === 'valid' ||
                            codeExpired ||
                            attemptsLocked
                        }
                        isValidPin={isValidPin}
                        isExpired={codeExpired || attemptsLocked}
                    />
                    {codeExpired && (
                        <p className="text-xd-11 pt-1 font-medium text-[#1D1D1D]">
                            {translate('The Code Sent Has Expired')}
                        </p>
                    )}
                    {!codeExpired && error && (
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

