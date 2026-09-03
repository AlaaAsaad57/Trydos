'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import XdDashedBorder from 'components/Login/Enhanced/ui/XdDashedBorder';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import { XD } from './authLayout';

interface NewInputNameScreenProps {
    onSubmit: (name: string) => void | Promise<void>;
    loading?: boolean;
    name?: string;
    setName?: (name: string) => void;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

/** The field's own inner margin, from the box's left edge. */
const FIELD_INSET = 20;

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
    const [focused, setFocused] = useState(false);
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
            className="w-full h-full font-quicksand relative"
            style={{ backgroundColor: '#F4FFF4' }}
        >
            <AuthLogoSlot stop="top" />

            <h2
                className="absolute text-xd-30 font-bold text-[#1D1D1D]"
                style={{ top: XD.head.title, left: XD.textLeft }}
            >
                {translate('enter your name !')}
            </h2>

            <p
                className="absolute text-xd-16 font-medium text-[#1D1D1D]"
                style={{ top: XD.head.line2, left: XD.textLeft }}
            >
                {translate('Last step and enjoy our services')}
            </p>

            <p
                className="absolute text-xd-12 font-normal text-[#1D1D1D]"
                style={{ top: XD.head.line3, left: XD.textLeft }}
            >
                {translate('ensure greater security and protect your funds')}
            </p>

            <div
                className="absolute rounded-xd-20 bg-white"
                style={{
                    top: XD.box.top,
                    left: XD.box.left,
                    width: XD.box.width,
                    height: XD.box.height,
                }}
            >
                <XdDashedBorder
                    width={XD.box.width}
                    height={XD.box.height}
                    radius={XD.box.radius}
                    color={focused ? '#388CFF' : '#8D8D8D'}
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder={translate('Enter your Name exact id')}
                    ref={inputRef}
                    data-pw="input-user-name-field"
                    className="absolute bg-transparent outline-none text-xd-16 font-normal text-[#1D1D1D] placeholder:text-[#C3C3C3] caret-[#1D1D1D] [caret-shape:underscore]"
                    style={{
                        left: FIELD_INSET,
                        top: 20,
                        right: FIELD_INSET + 25,
                        lineHeight: 1.25,
                    }}
                />
                {canSubmit && (
                    <button
                        onClick={handleSubmit}
                        data-pw="submit-user-name"
                        disabled={!!loading}
                        className="absolute flex items-center justify-center disabled:opacity-50 cursor-pointer"
                        style={{ right: FIELD_INSET, top: 20, width: 20, height: 20 }}
                        aria-label={translate('Continue')}
                    >
                        <Image
                            src="/assets/icons/auth/arrow-right.svg"
                            alt="continue"
                            width={20}
                            height={20}
                            className="object-contain"
                            style={{ width: 20, height: 20 }}
                        />
                    </button>
                )}
            </div>
        </div>
    );
}
