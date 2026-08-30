'use client';

import React from 'react';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import DashedFrame from 'scaling/DashedFrame';

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

    return (
        <main className="w-full bg-white flex flex-col font-quicksand h-full relative">
            {onScanQr && (
                <div className="flex absolute justify-end right-xd-30 top-xd-30 z-10">
                    <button
                        onClick={onScanQr}
                        data-pw="scan-qr-code"
                        className="w-xd-24 h-xd-24 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        aria-label={translate('Scan QR Code')}
                    >
                        <Image
                            src="/assets/icons/auth/qrlogin.svg"
                            alt="scan qr"
                            width={25}
                            height={25}
                            className="object-contain"
                        />
                    </button>
                </div>
            )}

            {/* Space above the mark, then the place the mark rests. Both come
                from AUTH_LOGO_STOP.centre, which Terms reads too — that is why
                the mark does not shift when this screen slides away. */}
            <AuthLogoSlot stop="centre" />

            {/* Space between logo and content */}
            <FlexibleSpace size={174} share={0.28} />

            {/* Bottom Section with live scaling points */}
            <div className="flex flex-col items-center">
                <FlexibleSpace size={54} share={0.04} />
                <h2
                    data-pw="get-started"
                    className="text-trim-descend text-xd-30 font-bold text-[#1D1D1D] text-center"
                >
                    {translate('. Get Started .')}
                </h2>

                {/* Buttons */}
                <FlexibleSpace size={28} share={0.042} />
                <div className="flex py-xd-6 flex-col items-center">
                    <button
                        onClick={onExistingAccount}
                        data-pw="have-account-button"
                        className="relative w-xd-390 h-xd-60 leading-xd-20 rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        <DashedFrame radius={20} color="#5D5C5D" />
                        <span className="text-trim">{translate('I Have Already Account')}</span>
                    </button>
                    <button
                        onClick={onNewCustomer}
                        data-pw="create-account"
                        className="relative w-xd-390 h-xd-60 leading-xd-20 rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 mt-xd-8 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        <DashedFrame radius={20} color="#5D5C5D" />
                        <span className="text-trim">{translate('New Customer')}</span>
                    </button>
                </div>

                {/* Footer Link */}
                <FlexibleSpace size={28} share={0.02} />
                {onLater && (
                    <button
                        onClick={onLater}
                        data-pw="take-look"
                        className="text-trim-descend text-xd-14 leading-xd-20 text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                    >
                        {translate('Later, Take A Look At The App')}
                    </button>
                )}
                <FlexibleSpace size={35} share={0} />
            </div>
        </main>
    );
}
