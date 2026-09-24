'use client';

import React from 'react';
import Image from 'next/image';
import XdDashedBorder from 'components/Login/Enhanced/ui/XdDashedBorder';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import { XD, fromBottom } from './authLayout';

interface NewGetStartedScreenProps {
    onExistingAccount?: () => void;
    onNewCustomer?: () => void;
    onLater?: () => void;
    onScanQr?: () => void;
    lang?: string;
    variant?: 'floated' | 'fullscreen';
}

export default function NewGetStartedScreen({
    onExistingAccount,
    onNewCustomer,
    onLater,
    onScanQr,
    lang = 'en',
}: NewGetStartedScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    const wideButton = (
        top: number | string,
        onClick: (() => void) | undefined,
        label: string,
        testId: string,
    ) => (
        <button
            onClick={onClick}
            data-pw={testId}
            className="absolute rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 font-normal cursor-pointer transition-all active:scale-[0.98]"
            style={{ top, left: XD.box.left, width: XD.box.width, height: XD.box.height }}
        >
            <XdDashedBorder
                width={XD.box.width}
                height={XD.box.height}
                radius={XD.box.radius}
                color="#5D5C5D"
            />
            <span className="absolute w-full text-center" style={{ top: 20, left: 0 }}>
                {translate(label)}
            </span>
        </button>
    );

    return (
        <main className="w-full h-full bg-white font-quicksand relative">
            {onScanQr && (
                <button
                    onClick={onScanQr}
                    data-pw="scan-qr-code"
                    className="absolute flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                        top: XD.control.top,
                        right: XD.control.right,
                        width: XD.control.qrSize,
                        height: XD.control.qrSize,
                    }}
                    aria-label={translate('Scan QR Code')}
                >
                    <Image
                        src="/assets/icons/auth/qrlogin.svg"
                        alt="scan qr"
                        width={XD.control.qrSize}
                        height={XD.control.qrSize}
                        className="object-contain"
                        style={{ width: XD.control.qrSize, height: XD.control.qrSize }}
                    />
                </button>
            )}

            {/* The low resting place, shared with Terms — that is why the mark
                does not shift when this screen slides away. */}
            <AuthLogoSlot stop="centre" />

            {/* Truly centred. The title reads a little left of centre on the
                artboard, but only because of the leading ". " — that is an
                eyeball, not a measurement. */}
            <h2
                data-pw="get-started"
                className="absolute w-full text-center text-xd-30 font-bold text-[#1D1D1D]"
                style={{ top: fromBottom(XD.getStarted.title), left: 0 }}
            >
                {translate('. Get Started .')}
            </h2>

            {wideButton(fromBottom(XD.cta.second), onExistingAccount, 'I have already account', 'have-account-button')}
            {wideButton(fromBottom(XD.cta.primary), onNewCustomer, 'New customer', 'create-account')}

            {onLater && (
                <button
                    onClick={onLater}
                    data-pw="take-look"
                    className="absolute w-full text-center text-xd-14 font-normal text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                    style={{ top: fromBottom(XD.cta.link), left: 0 }}
                >
                    {translate('Later, take a look at the app')}
                </button>
            )}
        </main>
    );
}
