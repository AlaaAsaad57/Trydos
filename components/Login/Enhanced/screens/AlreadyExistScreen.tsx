"use client";

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';

interface AlreadyExistScreenProps {
  phone: string;
  onLogIn: () => void;
  /** "Cancel & take a look at the app" — leaves the flow, keeps the account. */
  onCancel: () => void;
  onClose?: () => void;
  variant?: 'floated' | 'fullscreen';
  lang?: string;
}

export default function AlreadyExistScreen({
  phone,
  onLogIn,
  onCancel,
  onClose,
  variant = 'floated',
  lang = 'en',
}: AlreadyExistScreenProps) {
  const translate = (key: string) => translateFunction(key, lang);

  return (
    <div data-pw="registered" className="w-full h-full flex flex-col items-start bg-[#F4F8FF] font-quicksand relative" style={{ backgroundColor: '#F4F8FF' }}>
      {/* Top-right close/back button */}
      <div className="flex absolute justify-end right-xd-30 top-xd-30 z-10">
        {onClose && (
          <button
            onClick={onClose}
            data-pw="close"
            className="w-xd-24 h-xd-24 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={translate("Close")}
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

      <FlexibleSpace grow share={0.6} />

      {/* Info content */}
      <div className="w-full px-xd-30 h-1/2 flex items-end justify-start">
        <div className="flex flex-col items-start justify-start w-full">
          <h2 className="text-xd-30 font-bold text-[#1D1D1D]">
            {translate("Already Registered !")}
          </h2>
          <p className="text-xd-16 font-medium text-[#1D1D1D] mt-xd-10">
            {translate("This Number Already Registered With Us")}
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
        <FlexibleSpace size={85} share={0} />
      </div>

      <FlexibleSpace size={106} share={0} />

      <div className="w-full h-1/2 flex flex-col items-center">
        <FlexibleSpace size={296} share={0.4} />
        <div className="flex flex-col items-center gap-xd-30 px-xd-15 pb-xd-45">
          <button
            onClick={onLogIn}
            data-pw="login-continue"
            className="w-xd-390 h-xd-60 rounded-xd-20 bg-[#FAFAFA] text-[#1D1D1D] text-xd-16 font-normal shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
          >
            {translate("Login & Continue")}
          </button>
          <button
            onClick={onCancel}
            data-pw="cancel-take-look"
            className="text-xd-13 text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
          >
            {translate("Cancel & Take A Look At The App")}
          </button>
        </div>
        <FlexibleSpace size={54} share={0} />
      </div>
    </div>
  );
}
