"use client";

import React from 'react';
import { Phone } from 'lucide-react';
import { translateFunction } from 'utils/functions';
import useDetectKeyboardOpen from 'use-detect-keyboard-open';

interface RdbAuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  showPhoneIcon?: boolean;
  variant?: 'floated' | 'fullscreen';
  lang?: string;
}

export default function RdbAuthLayout({
  children,
  title,
  showPhoneIcon = true,
  variant = 'floated',
  lang,
}: RdbAuthLayoutProps) {
  const isKeyboardOpen = useDetectKeyboardOpen(200);
  const displayTitle = title ?? translateFunction("Sign in to your account", lang);

  const containerClasses =
    variant === 'fullscreen'
      ? "w-full h-dvh flex flex-col items-start bg-white overflow-hidden font-quicksand"
      : "w-full h-full flex flex-col items-start bg-white overflow-hidden font-quicksand";

  return (
    <div className={containerClasses}>
      {/* Top 60% Section: Header & Interactive Form */}
      <div className={`w-full flex flex-col items-center justify-end pb-4 px-6 transition-all duration-300 ${isKeyboardOpen ? 'h-full pt-4 pb-2' : 'h-[60%] pt-6'}`}>
        <div className={`flex flex-col items-center text-center transition-all duration-300 ${isKeyboardOpen ? 'mb-2' : 'mb-6'}`}>
          <h2 className="text-[24px] sm:text-[28px] font-semibold text-gray-800 tracking-tight">
            {displayTitle}
          </h2>
          {showPhoneIcon && !isKeyboardOpen && (
            <div className="mt-3 mb-1">
              <Phone className="w-8 h-8 text-gray-400 stroke-[1.5px]" />
            </div>
          )}
        </div>

        <div className="w-full flex flex-col items-center">{children}</div>
      </div>

      {/* Bottom 40% Section: Backdrop Glass Layer */}
      {!isKeyboardOpen && (
        <div className="h-[40%] w-full relative bg-gray-900/90 backdrop-blur-2xl">
          <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
        </div>
      )}
    </div>
  );
}
