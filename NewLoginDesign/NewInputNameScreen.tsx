'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';

interface NewInputNameScreenProps {
    onSubmit: (name: string) => void | Promise<void>;
    loading?: boolean;
    name?: string;
    setName?: (name: string) => void;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

export default function NewInputNameScreen({
    onSubmit,
    loading,
    name: propName,
    setName: propSetName,
    lang = 'en',
}: NewInputNameScreenProps) {
    const [internalName, setInternalName] = useState('');
    const name = propName !== undefined ? propName : internalName;
    const setName = propSetName || setInternalName;
    const translate = (key: string) => translateFunction(key, lang);

    /**
     * Focus the field on arrival, without letting the browser scroll to it.
     *
     * `autoFocus` used to do this, and it cannot be told not to scroll. This
     * screen slides in from a full width to the right, so the browser scrolled
     * the nearest scroll container to reveal the field — and `overflow: hidden`
     * still is a scroll container. Everything inside it shifted sideways,
     * including the shared logo, which is not part of this screen at all.
     */
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus({ preventScroll: true });
    }, []);

    const handleSubmit = () => {
        const trimmed = name.trim();
        if (!trimmed || loading) return;
        onSubmit(trimmed);
    };

    const canSubmit = name.trim().length > 0;

    return (
        <div
            className="w-full h-full flex flex-col items-start font-quicksand"
            style={{ backgroundColor: '#F4FFF4' }}
        >
            {/* Top space, then the mark's resting place — AUTH_LOGO_STOP.top,
                shared with the phone, method and code screens. */}
            <AuthLogoSlot stop="top" />

            {/* 20px clearance below logo */}
            <FlexibleSpace size={20} share={0.03} />

            {/* Title block */}
            <div className="w-full px-xd-30 flex flex-col items-start">
                <h2 className="text-xd-30 font-bold text-[#1D1D1D]">
                    {translate('Enter Your Name !')}
                </h2>
                <p className="text-xd-16 font-medium text-[#1D1D1D] mt-xd-8">
                    {translate('Last Step And Enjoy Our Services')}
                </p>
                <p className="text-xd-12 font-normal text-[#1D1D1D] mt-xd-4">
                    {translate('Ensure Greater Security And Protect Your Funds')}
                </p>
            </div>

            {/* Space between title and input */}
            <FlexibleSpace size={140} share={0.25} />

            {/* Input row */}
            <div className="w-full px-xd-15">
                <div className="relative flex items-center w-full h-xd-60 rounded-xd-20 border border-dashed border-[#C3C3C3] focus-within:border-[#388CFF] px-xd-16 transition-colors bg-white">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={translate('Enter Your Name Exact ID')}
                        ref={inputRef}
                        data-pw="input-user-name-field"
                        className="flex-1 bg-transparent outline-none text-xd-16 font-medium text-[#1D1D1D] placeholder:text-[#1D1D1D]/40 caret-[#1D1D1D] [caret-shape:underscore]"
                    />
                    {canSubmit && (
                        <button
                            onClick={handleSubmit}
                            data-pw="submit-user-name"
                            disabled={!!loading}
                            className="shrink-0 flex items-center justify-center disabled:opacity-50 cursor-pointer"
                            aria-label={translate('Continue')}
                        >
                            <Image
                                src="/assets/icons/auth/arrow-right.svg"
                                alt="continue"
                                width={20}
                                height={20}
                                className="object-contain"
                            />
                        </button>
                    )}
                </div>
            </div>

            <FlexibleSpace grow share={0.5} />
        </div>
    );
}
