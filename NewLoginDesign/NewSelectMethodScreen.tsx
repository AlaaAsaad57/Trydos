'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import XdDashedBorder from 'components/Login/Enhanced/ui/XdDashedBorder';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
import { translateFunction } from 'utils/functions';
import { authHeadingKey } from 'components/Login/Enhanced/authHeadings';
import AuthLogoSlot from './AuthLogoSlot';
import { formatPhoneDigits } from 'components/Login/Enhanced/ui/RdbPhoneInput';
import { XD, XD_LINE3_ICON_GAP } from './authLayout';

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

/** The two buttons, at x 20 and x 217. 193 wide each, 4 apart. */
const BUTTON_LEFT = {
    whatsapp: XD.box.left,
    sms: XD.box.left + XD.method.width + XD.method.gap,
} as const;

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

    const methodButton = (
        kind: 'whatsapp' | 'sms',
        icon: string,
        label: string,
        testId: string,
    ) => {
        const selected = method === kind;
        return (
            <button
                onClick={() => !loading && !blocked && setMethod(kind)}
                data-pw={testId}
                disabled={loading || blocked}
                className={`absolute rounded-xd-20 transition-all cursor-pointer disabled:cursor-not-allowed ${
                    blocked ? 'opacity-50' : ''
                } ${selected ? 'bg-[#FCFCFC]' : 'bg-white'}`}
                style={{
                    top: XD.box.top,
                    left: BUTTON_LEFT[kind],
                    width: XD.method.width,
                    height: XD.box.height,
                }}
            >
                <XdDashedBorder
                    width={XD.method.width}
                    height={XD.box.height}
                    radius={XD.box.radius}
                    color={selected && !blocked ? '#388CFF' : '#C3C3C3'}
                />
                {/* The icon straddles the top border: 12 in, 10 above. The white
                    square behind it is what breaks the dashes. */}
                <span
                    className={`absolute bg-white flex items-center justify-center ${
                        loading && selected ? 'animate-bounce-vertical' : ''
                    }`}
                    style={{
                        left: XD.method.iconLeft,
                        top: -XD.method.iconAbove,
                        width: XD.method.iconSize,
                        height: XD.method.iconSize,
                    }}
                >
                    <Image
                        src={icon}
                        alt={kind}
                        width={XD.method.iconSize}
                        height={XD.method.iconSize}
                        className="object-contain"
                    />
                </span>
                <span
                    className="absolute w-full text-xd-16 font-normal text-[#1D1D1D] text-center"
                    style={{ top: 20, left: 0 }}
                >
                    {translate(label)}
                </span>
            </button>
        );
    };

    return (
        /* Same grid as every other screen. This one adds the number row, so the
           privacy line moves from 389 to 412 — see XD.head.line4WithRow. */
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
                {translate('Choose verification method')}
            </p>

            <div
                className="absolute flex items-center"
                style={{
                    top: XD.head.line3,
                    left: XD.textLeft,
                    gap: XD_LINE3_ICON_GAP.method,
                }}
            >
                <span className="text-xd-12 font-normal text-[#1D1D1D]">
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

            {/* The number and the edit control are one flat blue line in the
                design: same size, same weight, same colour, no underline. */}
            <div
                className="absolute flex items-center"
                style={{ top: XD.head.line4, left: XD.textLeft, gap: 5 }}
            >
                <span data-pw="method-phone" className="text-xd-12 font-medium text-[#388CFF]">
                    +{formatPhoneDigits(phone ?? '')}
                </span>
                {changeNumber && (
                    <button
                        onClick={changeNumber}
                        data-pw="edit-phone-number"
                        className="text-xd-12 font-medium text-[#388CFF] cursor-pointer"
                    >
                        {translate('edit')}
                    </button>
                )}
            </div>

            <div
                className="absolute flex items-center"
                style={{ top: XD.head.line4WithRow, left: XD.textLeft, gap: 10.5 }}
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

            {methodButton(
                'whatsapp',
                '/assets/icons/auth/whatsapp.svg',
                'send WhatsApp',
                'whatsapp-receive-otp',
            )}
            {methodButton('sms', '/assets/icons/auth/sms.svg', 'Send Sms', 'sms-receive-otp')}

            {lockRemaining > 0 && (
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
            )}

            {lockRemaining === 0 && capReached && (
                <div
                    data-pw="otp-cap-reached"
                    className="absolute w-full text-xd-12 font-medium text-[#FF5F61] text-center"
                    style={{ top: XD.box.top + XD.box.height + 10, left: 0 }}
                >
                    {translate('Session limit reached. Try again later.')}
                </div>
            )}

            {!blocked && error && (
                <div
                    data-pw="send-otp-error"
                    role="alert"
                    className="absolute px-xd-20 w-full text-xd-12 font-medium text-[#FF5F61] text-center"
                    style={{ top: XD.box.top + XD.box.height + 10, left: 0 }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}
