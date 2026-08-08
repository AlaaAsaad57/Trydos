'use client';

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';

interface TermsScreenProps {
    onAgree?: () => void;
    onLater?: () => void;
    lang?: string;
    variant?: 'floated' | 'fullscreen';
}

export default function TermsScreen({ onAgree, onLater }: TermsScreenProps) {
    return (
        <div className="w-full bg-white flex flex-col font-quicksand h-full">
            <FlexibleSpace size={280} share={0.42} />

            {/* Logo */}
            <div className="flex flex-col items-center justify-center">
                <Image
                    src="/assets/icons/rdb.svg"
                    alt="RDB Logo"
                    width={144}
                    height={104}
                    priority
                    className="w-xd-144 h-xd-104 object-contain"
                />
            </div>
            <FlexibleSpace size={196} share={0.29} />

            {/* Content */}
            <div className="flex flex-col items-center px-xd-20">
                {/* Description */}
                <p className="text-xd-14 leading-[1.4] text-[#1D1D1D] text-center">
                    To Create New Account Tap “Agree & Continue” To Accept{' '}
                    <span className="font-bold">rdb </span>
                    terms of services
                </p>

                <FlexibleSpace size={50} share={0.07} />
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
                    <span className="text-xd-14 text-[#388CFF] font-medium">Terms Of Services</span>
                </div>
                <FlexibleSpace size={50} share={0.07} />

                {/* Button */}
                <button
                    onClick={onAgree}
                    className="w-xd-390 m-1 h-xd-60 rounded-xd-20 border-dashed border border-[#5D5C5D]/50 bg-[#FAFAFA] text-[#3C3C3C] text-xd-16 font-medium cursor-pointer transition-all active:scale-[0.98]"
                >
                    Agree & Continue
                </button>

                {/* Later */}
                <FlexibleSpace size={30} share={0.04} />
                {onLater && (
                    <div className="text-center">
                        <button
                            onClick={onLater}
                            className="text-xd-14 text-[#4D84FF] transition-colors hover:opacity-70 font-medium cursor-pointer"
                        >
                            Later, Take A Look At The App
                        </button>
                    </div>
                )}
            </div>

            <FlexibleSpace size={30} share={0.04} />
        </div>
    );
}
