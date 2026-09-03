'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RdbPhoneInput from 'components/Login/Enhanced/ui/RdbPhoneInput';
import { getNumberLockRemaining } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';
import { authHeadingKey } from 'components/Login/Enhanced/authHeadings';
import AuthLogoSlot from './AuthLogoSlot';
import { XD, XD_LINE3_ICON_GAP } from './authLayout';

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
        /* Every block is placed at its own design y, straight from XD. The
           canvas is always the full 430 x 932 artboard, so a top is a top on
           every device. Stacking these with margins is what put the whole
           screen 15 to 27 px too high before. */
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

            {/* The mark's resting place — the same 116 on all seven screens that
                park it at the top, so it does not move while they slide. */}
            <AuthLogoSlot stop="top" />

            <h2
                className="absolute text-xd-30 font-bold text-[#1D1D1D]"
                style={{ top: XD.head.title, left: XD.textLeft }}
            >
                {translate(authHeadingKey(authType))}
            </h2>

            <p
                className="absolute text-xd-16 font-normal text-[#1D1D1D]"
                style={{ top: XD.head.line2, left: XD.textLeft }}
            >
                {translate('Enter your phone number registered with us')}
            </p>

            <div
                className="absolute flex items-center"
                style={{
                    top: XD.head.line3,
                    left: XD.textLeft,
                    gap: XD_LINE3_ICON_GAP.phone,
                }}
            >
                <span className="text-xd-12 font-medium text-[#1D1D1D]">
                    {translate('We will send a verification code to the number')}
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

            <div
                className="absolute flex items-center"
                style={{ top: XD.head.line4, left: XD.textLeft, gap: 10.5 }}
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

            <div
                className="absolute"
                style={{
                    top: XD.box.top,
                    left: XD.box.left,
                    width: XD.box.width,
                    height: XD.box.height,
                }}
            >
                <RdbPhoneInput
                    onSend={handleSubmit}
                    value={phone}
                    onChange={setPhone}
                    placeholder={translate('Enter your phone number')}
                    lang={lang}
                    isLoading={loading || lockRemaining > 0}
                />
            </div>

            {/* Under the input, above the line the keyboard starts on. */}
            {lockRemaining > 0 ? (
                <div
                    data-pw="otp-cooldown"
                    className="absolute w-full text-xd-12 font-medium text-[#FF5F61] text-center"
                    style={{ top: XD.box.top + XD.box.height + 10, left: 0 }}
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
                        className="absolute px-xd-20 w-full text-xd-12 font-medium text-[#FF5F61] text-center"
                        style={{ top: XD.box.top + XD.box.height + 10, left: 0 }}
                    >
                        {error}
                    </div>
                )
            )}
        </div>
    );
}
