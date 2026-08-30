'use client';

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import { GA_EVENT_NAMES } from 'utils/GAEvents';
import { GAevent } from 'utils/gtag';
import AuthLogoSlot from './AuthLogoSlot';
import DashedFrame from 'scaling/DashedFrame';

interface NewTermsScreenProps {
    onAgree?: () => void;
    onLater?: () => void;
    lang?: string;
    variant?: 'floated' | 'fullscreen';
}

export default function NewTermsScreen({ onAgree, onLater, lang = 'en' }: NewTermsScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    return (
        <div className="w-full bg-white flex flex-col font-quicksand">
            {/* Same resting place as Get Started, from the same constant. */}
            <AuthLogoSlot stop="centre" />
            <FlexibleSpace size={150} share={0.25} />

            {/* Content */}
            <div className="flex flex-col items-center px-xd-20">
                {/* Description */}
                <p className="text-xd-14 leading-xd-20 text-[#1D1D1D] text-center">
                    {translate('To Create New Account Tap “Agree & Continue” To Accept')}{' '}
                    <span className="font-bold">Trydos </span>
                    {translate('terms of services')}
                </p>

                <FlexibleSpace size={65} share={0.07} />
                {/* Terms icon + label */}
                <div className="flex flex-col items-center">
                    <div className="w-xd-40 h-xd-40 flex items-center justify-center rounded-xd-10">
                        <Image
                            src="/assets/icons/auth/terms.svg"
                            alt="terms"
                            width={25}
                            height={25}
                            className="w-xd-25 h-xd-25 object-contain"
                        />
                    </div>
                    <span className="text-trim-descend text-xd-14 leading-xd-20 text-[#388CFF]">
                        {translate('Terms Of Services')}
                    </span>
                </div>
                <FlexibleSpace size={50} share={0.07} />

                {/* Button */}
                <button
                    onClick={() => {
                        GAevent({
                            action: GA_EVENT_NAMES.TERMS_SERVICES,
                            params: { mission: 'signup', status: 'terms_accepted' },
                        });
                        onAgree?.();
                    }}
                    data-pw="agree-continue"
                    className="relative w-xd-390 h-xd-60 rounded-xd-20 bg-[#FAFAFA] text-[#3C3C3C] text-xd-16 leading-xd-20 cursor-pointer transition-all active:scale-[0.98]"
                >
                    <DashedFrame radius={20} color="#5D5C5D" />
                    <span className="text-trim">{translate('Agree & Continue')}</span>
                </button>

                {/* Later */}
                <FlexibleSpace size={26} share={0.04} />
                {onLater && (
                    <div className="text-center">
                        <button
                            onClick={onLater}
                            data-pw="take-look"
                            className="text-trim-descend text-xd-14 leading-xd-20 text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                        >
                            {translate('Later, Take A Look At The App')}
                        </button>
                    </div>
                )}
            </div>

            <FlexibleSpace size={30} share={0.04} />
        </div>
    );
}
