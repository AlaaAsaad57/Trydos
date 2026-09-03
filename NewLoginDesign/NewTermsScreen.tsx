'use client';

import Image from 'next/image';
import XdDashedBorder from 'components/Login/Enhanced/ui/XdDashedBorder';
import { translateFunction } from 'utils/functions';
import { GA_EVENT_NAMES } from 'utils/GAEvents';
import { GAevent } from 'utils/gtag';
import AuthLogoSlot from './AuthLogoSlot';
import { XD } from './authLayout';

interface NewTermsScreenProps {
    onAgree?: () => void;
    onLater?: () => void;
    lang?: string;
    variant?: 'floated' | 'fullscreen';
}

export default function NewTermsScreen({ onAgree, onLater, lang = 'en' }: NewTermsScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    return (
        <div className="w-full h-full bg-white font-quicksand relative">
            {/* Same low resting place as Get Started, from the same number. */}
            <AuthLogoSlot stop="centre" />

            {/* A wrapping block, so it keeps its own XD line height (20 on 14px)
                rather than the 1.25 the single-line text uses. One colour and
                one weight — the design does not bold the product name. */}
            <p
                className="absolute text-xd-14 font-normal text-[#1D1D1D] text-center"
                style={{
                    top: XD.terms.body,
                    left: XD.box.left,
                    width: XD.box.width,
                    lineHeight: XD.terms.bodyLineHeight,
                }}
            >
                {translate('To Create new account Tap “agree & Continue” to accept')} Trydos{' '}
                {translate('Terms of services')}
            </p>

            <Image
                src="/assets/icons/auth/terms.svg"
                alt="terms"
                width={XD.terms.icon.size}
                height={XD.terms.icon.size}
                className="absolute object-contain"
                style={{
                    top: XD.terms.icon.top,
                    left: XD.terms.icon.left,
                    width: XD.terms.icon.size,
                    height: XD.terms.icon.size,
                }}
            />

            <span
                className="absolute w-full text-center text-xd-14 font-normal text-[#388CFF]"
                style={{ top: XD.terms.linkLine, left: 0 }}
            >
                {translate('Terms of services')}
            </span>

            <button
                onClick={() => {
                    GAevent({
                        action: GA_EVENT_NAMES.TERMS_SERVICES,
                        params: { mission: 'signup', status: 'terms_accepted' },
                    });
                    onAgree?.();
                }}
                data-pw="agree-continue"
                className="absolute rounded-xd-20 bg-[#FAFAFA] text-[#3C3C3C] text-xd-16 font-normal cursor-pointer transition-all active:scale-[0.98]"
                style={{
                    top: XD.cta.primary,
                    left: XD.box.left,
                    width: XD.box.width,
                    height: XD.box.height,
                }}
            >
                <XdDashedBorder
                    width={XD.box.width}
                    height={XD.box.height}
                    radius={XD.box.radius}
                    color="#5D5C5D"
                />
                <span className="absolute w-full text-center" style={{ top: 20, left: 0 }}>
                    {translate('agree & continue')}
                </span>
            </button>

            {onLater && (
                <button
                    onClick={onLater}
                    data-pw="take-look"
                    className="absolute w-full text-center text-xd-14 font-normal text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                    style={{ top: XD.cta.link, left: 0 }}
                >
                    {translate('Later, take a look at the app')}
                </button>
            )}
        </div>
    );
}
