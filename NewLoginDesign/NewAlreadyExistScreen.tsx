'use client';

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';

interface NewAlreadyExistScreenProps {
    phone: string;
    onLogIn: () => void;
    /** "Cancel & take a look at the app" — leaves the flow, keeps the account. */
    onCancel: () => void;
    onClose?: () => void;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

export default function NewAlreadyExistScreen({
    phone,
    onLogIn,
    onCancel,
    onClose,
    lang = 'en',
}: NewAlreadyExistScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    return (
        <div
            data-pw="registered"
            className="w-full h-full flex flex-col items-start font-quicksand relative"
            style={{ backgroundColor: '#F4F8FF' }}
        >
            {/* Top-right close/back button */}
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

            {/* Top space, then the mark's resting place — AUTH_LOGO_STOP.top,
                shared with the phone, method and code screens. */}
            <AuthLogoSlot stop="top" />

            {/* 20px clearance below logo */}
            <FlexibleSpace size={20} share={0.03} />

            {/* Title & Info block */}
            <div className="w-full px-xd-30 flex flex-col items-start">
                <h2 className="text-xd-30 font-bold text-[#1D1D1D]">
                    {translate('Already Registered !')}
                </h2>
                <p className="text-xd-16 font-medium text-[#1D1D1D] mt-xd-10">
                    {translate('This Number Already Registered With Us')}
                </p>
                <div className="flex items-center gap-xd-2 mt-xd-6">
                    <p className="text-xd-12 font-normal text-[#1D1D1D]">
                        +{phone}
                    </p>
                    <div className="w-xd-15 h-xd-15 ml-2 shrink-0">
                        <Image
                            src="/assets/icons/auth/blue-info.svg"
                            alt="info"
                            width={15}
                            height={15}
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Expands to push buttons to the bottom */}
            <FlexibleSpace grow share={0.7} />

            {/* Bottom buttons */}
            <div className="w-full flex flex-col items-center px-xd-15 pb-xd-10">
                <button
                    onClick={onLogIn}
                    data-pw="login-continue"
                    className="w-xd-390 h-xd-60 rounded-xd-20 border border-dashed border-[#5D5C5D]/40 bg-[#FAFAFA] text-[#1D1D1D] text-xd-16 font-normal transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
                >
                    {translate('Login & Continue')}
                </button>
                <button
                    onClick={onCancel}
                    data-pw="cancel-take-look"
                    className="text-xd-13 text-[#4D84FF] mt-xd-20 transition-colors hover:opacity-70 cursor-pointer"
                >
                    {translate('Cancel & Take A Look At The App')}
                </button>
            </div>

            <FlexibleSpace size={35} share={0.05} />
        </div>
    );
}
