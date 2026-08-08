'use client';

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';

type RegistrationStatusScreenProps =
    | {
          variant: 'already-registered';
          phone?: string;
          onLoginAndContinue?: () => void;
          onCancel?: () => void;
          lang?: string;
      }
    | {
          variant: 'not-registered';
          phone?: string;
          onCreateAccount?: () => void;
          onCancel?: () => void;
          lang?: string;
      };

const variantConfig = {
    'already-registered': {
        bg: '#F4F8FF',
        icon: '/assets/icons/auth/blue-info.svg',
        phoneFontWeight: 'font-normal',
        buttonGap: 'gap-xd-30',
        title: 'Already Registered !',
        description: 'This Number Already Registered With Us',
        primaryLabel: 'Login & Continue',
    },
    'not-registered': {
        bg: '#FFF9F0',
        icon: '/assets/icons/auth/warn-info.svg',
        phoneFontWeight: 'font-semibold',
        buttonGap: 'gap-xd-20',
        title: 'Not Registered !',
        description: 'Sorry, This Number Is Not Registered With Us !',
        primaryLabel: 'Create New Account & Continue',
    },
};

export default function RegistrationStatusScreen(props: RegistrationStatusScreenProps) {
    const { variant, phone, onCancel } = props;
    const cfg = variantConfig[variant];

    const handlePrimary =
        variant === 'already-registered' ? props.onLoginAndContinue : props.onCreateAccount;

    return (
        <div className="w-full h-full flex flex-col items-start font-quicksand" style={{ backgroundColor: cfg.bg }}>
            {/* Top space */}
            <FlexibleSpace grow share={0.6} />

            {/* Info content */}
            <div className="px-xd-30 h-1/2 flex items-end">
                <div className="flex flex-col items-start justify-start">
                    <h2 className="text-xd-30 font-bold text-[#1D1D1D]">{cfg.title}</h2>
                    <p className="text-xd-16 font-medium text-[#1D1D1D] mt-xd-10">
                        {cfg.description}
                    </p>
                    <div className="flex items-center gap-xd-2 mt-xd-6">
                        <p className={`text-xd-12 ${cfg.phoneFontWeight} text-[#1D1D1D]`}>
                            +{phone}
                        </p>
                        <div className="w-xd-15 h-xd-15 ml-2 shrink-0">
                            <Image
                                src={cfg.icon}
                                alt="info"
                                width={15}
                                height={15}
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
                <FlexibleSpace size={85} share={0} />
            </div>

            {/* Middle space */}
            <FlexibleSpace size={106} share={0} />

            <div className="h-1/2 flex flex-col items-center">
                {/* Action buttons pinned near bottom */}
                <FlexibleSpace size={296} share={0.4} />
                <div className={`flex flex-col items-center px-xd-15 pb-xd-45 ${cfg.buttonGap}`}>
                    <button
                        onClick={handlePrimary}
                        className="w-xd-390 h-xd-60 rounded-xd-20 bg-[#FAFAFA] text-[#1D1D1D] text-xd-16 font-normal shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {cfg.primaryLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="text-xd-13 text-[#4D84FF] transition-colors hover:opacity-70 font-medium cursor-pointer"
                    >
                        Cancel & Take A Look At The App
                    </button>
                </div>

                <FlexibleSpace size={54} share={0} />
            </div>
        </div>
    );
}
