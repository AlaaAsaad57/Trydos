'use client';

import Image from 'next/image';
import XdDashedBorder from 'components/Login/Enhanced/ui/XdDashedBorder';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import { XD, XD_WIDE_LABEL_TRACKING } from './authLayout';

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
            className="w-full h-full font-quicksand relative"
            style={{ backgroundColor: '#F4F8FF' }}
        >
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
                {translate('already registered !')}
            </h2>

            <p
                className="absolute text-xd-16 font-medium text-[#1D1D1D]"
                style={{ top: XD.head.line2, left: XD.textLeft }}
            >
                {translate('this number already registered with us')}
            </p>

            <div
                className="absolute flex items-center"
                style={{ top: XD.head.line3, left: XD.textLeft, gap: 7.5 }}
            >
                <span className="text-xd-12 font-normal text-[#1D1D1D]">+{phone}</span>
                <div className="w-xd-15 h-xd-15 shrink-0">
                    <Image
                        src="/assets/icons/auth/blue-info.svg"
                        alt="info"
                        width={15}
                        height={15}
                        className="object-contain"
                    />
                </div>
            </div>

            <button
                onClick={onLogIn}
                data-pw="login-continue"
                className="absolute rounded-xd-20 bg-[#FAFAFA] text-[#1D1D1D] text-xd-16 font-normal transition-all active:scale-[0.98] cursor-pointer"
                style={{
                    top: XD.cta.primary,
                    left: XD.box.left,
                    width: XD.box.width,
                    height: XD.box.height,
                    letterSpacing: XD_WIDE_LABEL_TRACKING,
                }}
            >
                <XdDashedBorder
                    width={XD.box.width}
                    height={XD.box.height}
                    radius={XD.box.radius}
                    color="#707070"
                />
                <span className="absolute w-full text-center" style={{ top: 20, left: 0 }}>
                    {translate('login & Continue')}
                </span>
            </button>

            <button
                onClick={onCancel}
                data-pw="cancel-take-look"
                className="absolute w-full text-center text-xd-14 font-normal text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                style={{ top: XD.cta.link, left: 0, letterSpacing: XD_WIDE_LABEL_TRACKING }}
            >
                {translate('Cancel & take a look at the app')}
            </button>
        </div>
    );
}
