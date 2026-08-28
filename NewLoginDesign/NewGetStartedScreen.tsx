'use client';

import React from 'react';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import NewLoginLogo from './NewLoginLogo';

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

            {/* Space above logo */}
            <FlexibleSpace size={280} share={0.45} />

            {/* Centered Dotted Badge Ring Logo */}
            <div className="flex flex-col items-center">
                <NewLoginLogo
                    variant="badge-ring"
                    dotColor="purple"
                    ringColor="#402CDD"
                    width={150}
                    height={150}
                />
            </div>

            {/* Space between logo and content */}
            <FlexibleSpace size={174} share={0.28} />

            {/* Bottom Section with live scaling points */}
            <div className="flex flex-col items-center">
                <FlexibleSpace size={24} share={0.04} />
                <h2
                    data-pw="get-started"
                    className="text-xd-30 font-bold text-[#1D1D1D] h-xd-40 text-center tracking-tight"
                >
                    {translate('. Get Started .')}
                </h2>

                {/* Buttons */}
                <FlexibleSpace size={35} share={0.042} />
                <div className="flex py-xd-6 flex-col items-center">
                    <button
                        onClick={onExistingAccount}
                        data-pw="have-account-button"
                        className="xd-dashed-border w-xd-390 h-xd-60 leading-[1.3] rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('I Have Already Account')}
                    </button>
                    <button
                        onClick={onNewCustomer}
                        data-pw="create-account"
                        className="xd-dashed-border w-xd-390 h-xd-60 leading-[1.3] rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 mt-xd-8 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('New Customer')}
                    </button>
                </div>

                {/* Footer Link */}
                <FlexibleSpace size={30} share={0.02} />
                {onLater && (
                    <button
                        onClick={onLater}
                        data-pw="take-look"
                        className="text-xd-13 text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                    >
                        {translate('Later, Take A Look At The App')}
                    </button>
                )}
                <FlexibleSpace size={35} share={0} />
            </div>
        </main>
    );
}
