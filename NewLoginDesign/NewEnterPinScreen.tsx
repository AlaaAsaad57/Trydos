'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import RdbPinInputs from 'components/Login/Enhanced/ui/RdbPinInputs';
import { getNumberLockRemaining } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';
import { authHeadingKey } from 'components/Login/Enhanced/authHeadings';
import AuthLogoSlot from './AuthLogoSlot';
import { formatPhoneDigits } from 'components/Login/Enhanced/ui/RdbPhoneInput';
import { XD, XD_LINE3_ICON_GAP } from './authLayout';

interface NewEnterPinScreenProps {
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

/**
 * Where the grey hint after the number starts.
 *
 * Not a gap: the design puts it at a fixed x, and the number before it is a
 * different length in every country. Read off the artboard, and it agrees with
 * the real Quicksand advance widths — the number ends at 141.1 and this is the
 * next thing on the row.
 */
const HINT_LEFT = 146;

export default function NewEnterPinScreen({
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
}: NewEnterPinScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    const [timeLeft, setTimeLeft] = useState(timerSeconds);
    const [canResend, setCanResend] = useState(false);
    const [codeSpent, setCodeSpent] = useState(false);

    const sentAtRef = useRef(Date.now());
    const onTimerExpiredRef = useRef(onTimerExpired);
    useEffect(() => {
        onTimerExpiredRef.current = onTimerExpired;
    }, [onTimerExpired]);
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
            sentAtRef.current = Date.now();
            setCodeSpent(false);
            setPin('');
        }
    };

    const canAskAgain = canResend && !loading;
    const codeExpired = codeSpent && !loading;
    const methodLabel = method === 'whatsapp' ? translate('Whatsapp') : translate('SMS');

    /* The wrong and expired artboards lift the code row and put a message under
       it. Every other state leaves the row on the normal 503 line. */
    const lifted = codeExpired || isValidPin === 'notvalid';
    const otpTop = lifted ? XD.box.topLifted : XD.box.top;

    /* The resend line is a row of its own, so it pushes the privacy line down.
       That is exactly what `Registration - 16` (the expired code) shows. */
    const privacyTop = canAskAgain ? XD.head.line4Expired : XD.head.line4WithRow;

    /** One flat blue string: 12 Medium #388CFF, no underline anywhere on it. */
    const resendLink = (
        onClick: () => void,
        label: string,
        testId: string,
    ) => (
        <button
            onClick={onClick}
            data-pw={testId}
            className="text-xd-12 font-medium text-[#388CFF] cursor-pointer"
        >
            {translate(label)}
        </button>
    );

    return (
        <div className="w-full h-full bg-white font-quicksand relative">
            {onClose && (
                <button
                    onClick={onClose}
                    data-pw="close"
                    className="absolute flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                        top: XD.control.top,
                        right: XD.control.right,
                        width: XD.control.closeSize,
                        height: XD.control.closeSize,
                    }}
                    aria-label={translate('Close')}
                >
                    <Image
                        src="/assets/icons/auth/close.svg"
                        alt="close"
                        width={XD.control.closeSize}
                        height={XD.control.closeSize}
                        className="object-contain"
                    />
                </button>
            )}

            <AuthLogoSlot stop="top" />

            <h2
                className="absolute text-xd-30 font-bold text-[#1D1D1D]"
                style={{ top: XD.head.title, left: XD.textLeft }}
            >
                {translate(authHeadingKey(authType))}
            </h2>

            <p
                className="absolute text-xd-16 font-medium text-[#1D1D1D]"
                style={{ top: XD.head.line2, left: XD.textLeft }}
            >
                {`${translate('enter verification code sent to your')} ${methodLabel}`}
            </p>

            <div
                className="absolute flex items-center"
                style={{
                    top: XD.head.line3,
                    left: XD.textLeft,
                    gap: XD_LINE3_ICON_GAP.code,
                }}
            >
                <span className="text-xd-12 font-normal text-[#1D1D1D]">
                    {translate('We have sent a verification code to the number')}
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

            {/* The number sits at the text margin; the hint after it starts at a
                fixed x, not a gap, because the number length changes by country. */}
            <span
                className="absolute text-xd-12 font-normal text-[#1D1D1D]"
                style={{ top: XD.head.line4, left: XD.textLeft }}
            >
                +{formatPhoneDigits(phone ?? '')}
            </span>
            <div
                className="absolute flex items-center"
                style={{ top: XD.head.line4, left: HINT_LEFT, gap: 11.6 }}
            >
                <span className="text-xd-12 font-normal text-[#C3C3C3]">
                    {canAskAgain
                        ? translate("Didn’t you receive a code?")
                        : `${translate('resend after -')} ${formatTime(timeLeft)}`}
                </span>
                <div className="w-xd-15 h-xd-15 shrink-0">
                    <Image
                        src="/assets/icons/auth/info.svg"
                        alt="info"
                        width={15}
                        height={15}
                        className="object-contain"
                    />
                </div>
            </div>

            {canAskAgain && (
                <div
                    className="absolute flex items-center"
                    style={{ top: XD.head.line4WithRow, left: XD.textLeft, gap: 5 }}
                >
                    {resendLink(handleResend, 'resend code', 'resend-code')}
                    {changeNumber && (
                        <>
                            <span className="text-xd-12 font-medium text-[#388CFF]">
                                {translate('or')}
                            </span>
                            {resendLink(changeNumber, 'Change Number', 'change-phone-number')}
                        </>
                    )}
                    {changeMethod && (
                        <>
                            <span className="text-xd-12 font-medium text-[#388CFF]">
                                {translate('or')}
                            </span>
                            {resendLink(changeMethod, 'method', 'change-otp-method')}
                        </>
                    )}
                </div>
            )}

            <div
                className="absolute flex items-center"
                style={{ top: privacyTop, left: XD.textLeft, gap: 10.5 }}
            >
                <span className="text-xd-11 font-normal text-[#4A31E7]">
                    {translate('Your privacy is completely safe')}
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

            <div className="absolute" style={{ top: otpTop, left: XD.box.left }}>
                <RdbPinInputs
                    value={pin}
                    onChange={setPin}
                    onComplete={handlePinComplete}
                    disabled={loading === 'verify-pin' || isValidPin === 'valid' || codeExpired}
                    isValidPin={isValidPin}
                    isExpired={codeExpired}
                />
            </div>

            {codeExpired && (
                <p
                    className="absolute w-full text-xd-11 font-medium text-[#1D1D1D] text-center"
                    style={{ top: XD.otpMessageTop, left: 0 }}
                >
                    {translate('The code sent has expired')}
                </p>
            )}
            {!codeExpired && error && (
                <p
                    data-pw="verify-otp-error"
                    role="alert"
                    className="absolute w-full px-xd-20 text-xd-11 font-medium text-[#FF5F61] text-center"
                    style={{ top: XD.otpMessageTop, left: 0 }}
                >
                    {error}
                </p>
            )}
        </div>
    );
}
