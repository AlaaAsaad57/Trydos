'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';

import { XD } from 'NewLoginDesign/authLayout';
import XdDashedBorder from './XdDashedBorder';
import { NumericKeypad } from './NumericKeypad';
import { useIsTouchDevice } from 'hooks/useIsTouchDevice';
import { translateFunction } from 'utils/functions';

interface CountryData {
    code: string;
    flag: string;
    name: string;
    dialCode: string;
    maxLocal: number;
}

const COUNTRIES: CountryData[] = [
    { code: 'SY', flag: '🇸🇾', name: 'Syria', dialCode: '963', maxLocal: 9 },
    { code: 'TR', flag: '🇹🇷', name: 'Turkey', dialCode: '90', maxLocal: 10 },
    { code: 'IQ', flag: '🇮🇶', name: 'Iraq', dialCode: '964', maxLocal: 10 },
    { code: 'JO', flag: '🇯🇴', name: 'Jordan', dialCode: '962', maxLocal: 9 },
    { code: 'LB', flag: '🇱🇧', name: 'Lebanon', dialCode: '961', maxLocal: 8 },
    { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', dialCode: '966', maxLocal: 9 },
    { code: 'AE', flag: '🇦🇪', name: 'UAE', dialCode: '971', maxLocal: 9 },
    { code: 'EG', flag: '🇪🇬', name: 'Egypt', dialCode: '20', maxLocal: 10 },
    { code: 'US', flag: '🇺🇸', name: 'United States', dialCode: '1', maxLocal: 10 },
    { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', dialCode: '44', maxLocal: 10 },
    { code: 'DE', flag: '🇩🇪', name: 'Germany', dialCode: '49', maxLocal: 11 },
    { code: 'FR', flag: '🇫🇷', name: 'France', dialCode: '33', maxLocal: 9 },
    { code: 'IT', flag: '🇮🇹', name: 'Italy', dialCode: '39', maxLocal: 10 },
    { code: 'ES', flag: '🇪🇸', name: 'Spain', dialCode: '34', maxLocal: 9 },
    { code: 'NL', flag: '🇳🇱', name: 'Netherlands', dialCode: '31', maxLocal: 9 },
    { code: 'SE', flag: '🇸🇪', name: 'Sweden', dialCode: '46', maxLocal: 9 },
    { code: 'KW', flag: '🇰🇼', name: 'Kuwait', dialCode: '965', maxLocal: 8 },
    { code: 'QA', flag: '🇶🇦', name: 'Qatar', dialCode: '974', maxLocal: 8 },
    { code: 'BH', flag: '🇧🇭', name: 'Bahrain', dialCode: '973', maxLocal: 8 },
    { code: 'OM', flag: '🇴🇲', name: 'Oman', dialCode: '968', maxLocal: 8 },
    { code: 'PS', flag: '🇵🇸', name: 'Palestine', dialCode: '970', maxLocal: 9 },
    { code: 'YE', flag: '🇾🇪', name: 'Yemen', dialCode: '967', maxLocal: 9 },
    { code: 'LY', flag: '🇱🇾', name: 'Libya', dialCode: '218', maxLocal: 9 },
    { code: 'SD', flag: '🇸🇩', name: 'Sudan', dialCode: '249', maxLocal: 9 },
    { code: 'TN', flag: '🇹🇳', name: 'Tunisia', dialCode: '216', maxLocal: 8 },
    { code: 'DZ', flag: '🇩🇿', name: 'Algeria', dialCode: '213', maxLocal: 9 },
    { code: 'MA', flag: '🇲🇦', name: 'Morocco', dialCode: '212', maxLocal: 9 },
    { code: 'IN', flag: '🇮🇳', name: 'India', dialCode: '91', maxLocal: 10 },
    { code: 'PK', flag: '🇵🇰', name: 'Pakistan', dialCode: '92', maxLocal: 10 },
    { code: 'BD', flag: '🇧🇩', name: 'Bangladesh', dialCode: '880', maxLocal: 10 },
    { code: 'CN', flag: '🇨🇳', name: 'China', dialCode: '86', maxLocal: 11 },
    { code: 'JP', flag: '🇯🇵', name: 'Japan', dialCode: '81', maxLocal: 11 },
    { code: 'KR', flag: '🇰🇷', name: 'South Korea', dialCode: '82', maxLocal: 11 },
    { code: 'RU', flag: '🇷🇺', name: 'Russia', dialCode: '7', maxLocal: 10 },
    { code: 'BR', flag: '🇧🇷', name: 'Brazil', dialCode: '55', maxLocal: 11 },
    { code: 'MX', flag: '🇲🇽', name: 'Mexico', dialCode: '52', maxLocal: 10 },
    { code: 'CA', flag: '🇨🇦', name: 'Canada', dialCode: '1', maxLocal: 10 },
    { code: 'AU', flag: '🇦🇺', name: 'Australia', dialCode: '61', maxLocal: 9 },
];

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

const MIN_PHONE_DIGITS = 10;
const DEFAULT_MAX_TOTAL = 15;

interface RdbPhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend?: () => void;
    isLoading?: boolean;
    placeholder?: string;
    lang?: string;
    /**
     * Fall back to the device's own keyboard instead of the in-app keypad.
     *
     * The keypad is `position: fixed` at the bottom of the viewport, so it
     * covers any host that also sits at the bottom — the cart's ~200px footer
     * panel is hidden entirely behind it. The device keyboard scrolls the
     * focused field into view instead. Fullscreen hosts have the room and keep
     * the keypad, so this defaults to off.
     */
    disableCustomKeypad?: boolean;
}

/**
 * Digits only, with the international prefix the user actually types stripped:
 * "+963...", "00963...", "0963..." all become "963...". Without this a number
 * typed the way most people type it matches no dial code, is treated as an
 * unknown-country number, and is sent to the backend with the leading zeros
 * still on it.
 */
export const normalizeDialInput = (input: string): string => {
    let digits = (input || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return digits;
};

export default function RdbPhoneInput({
    value,
    onChange,
    onSend,
    isLoading = false,
    placeholder,
    lang = 'en',
    disableCustomKeypad = false,
}: RdbPhoneInputProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const resolvedPlaceholder = placeholder ?? translate('Phone Number');
    const isTouch = useIsTouchDevice();
    const showCustomKeypad = isTouch && !disableCustomKeypad;

    const [isFocused, setIsFocused] = useState(false);
    const [keypadOpen, setKeypadOpen] = useState(false);
    const inputRef = useRef<HTMLDivElement>(null);
    const keypadRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoading && showCustomKeypad) {
            const t = setTimeout(() => setKeypadOpen(true), 300);
            return () => clearTimeout(t);
        }
        if (!isLoading && !showCustomKeypad) {
            const t = setTimeout(() => {
                hiddenInputRef.current?.focus();
                setIsFocused(true);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [isLoading, showCustomKeypad]);

    // Close keypad when clicking outside input AND keypad
    useEffect(() => {
        if (!keypadOpen) return;
        function handleClick(e: MouseEvent | TouchEvent) {
            const target = e.target as Node;
            if (inputRef.current && inputRef.current.contains(target)) return;
            if (keypadRef.current && keypadRef.current.contains(target)) return;
            setKeypadOpen(false);
            setIsFocused(false);
        }
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('touchstart', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('touchstart', handleClick);
        };
    }, [keypadOpen]);

    const digits = normalizeDialInput(value);

    const detectedCountry = useMemo(() => {
        if (!digits) return null;
        for (const country of SORTED_COUNTRIES) {
            if (digits.startsWith(country.dialCode)) return country;
        }
        return null;
    }, [digits]);

    const formatNumber = useCallback((d: string): string => {
        if (!d) return '';
        let matchedDialCode = '';
        for (const country of SORTED_COUNTRIES) {
            if (d.startsWith(country.dialCode)) {
                matchedDialCode = country.dialCode;
                break;
            }
        }
        if (matchedDialCode) {
            const rest = d.slice(matchedDialCode.length);
            const groups = rest.match(/.{1,3}/g) || [];
            return [matchedDialCode, ...groups].join(' ');
        }
        const groups = d.match(/.{1,3}/g) || [];
        return groups.join(' ');
    }, []);

    const displayValue = useMemo(() => formatNumber(digits), [digits, formatNumber]);

    const maxTotalDigits = useMemo(() => {
        if (!detectedCountry) return DEFAULT_MAX_TOTAL;
        return detectedCountry.dialCode.length + detectedCountry.maxLocal;
    }, [detectedCountry]);

    const isValidPhone = detectedCountry
        ? digits.length === maxTotalDigits
        : digits.length >= MIN_PHONE_DIGITS;

    const handleKeypadPress = useCallback(
        (digit: string) => {
            if (digits.length >= maxTotalDigits) return;
            onChange(digits + digit);
        },
        [digits, onChange, maxTotalDigits],
    );

    const handleKeypadBackspace = useCallback(() => {
        if (digits.length > 0) {
            onChange(digits.slice(0, -1));
        }
    }, [digits, onChange]);

    return (
        <div className="flex flex-col w-full items-center">
            {/*
              * The 390 x 60 input box.
              *
              * Everything inside is placed at its own design x, measured from
              * the box's own left edge, exactly as the XD file has it: flag 20,
              * phone icon 19.7, plus 52, number 65, send arrow 20 in from the
              * right. A flex row with gaps cannot reproduce those, because the
              * gaps in the design are not equal and do not come out of the text
              * widths.
              *
              * The 16px text sits at top 20. With `line-height: 1.25` that puts
              * its baseline at 36 from the box top, which is where XD puts it.
              */}
            <div
                ref={inputRef}
                data-pw="phone-number-display"
                onClick={() => {
                    setIsFocused(true);
                    if (showCustomKeypad) setKeypadOpen(true);
                    else hiddenInputRef.current?.focus();
                }}
                className="relative w-full h-xd-60 cursor-text"
            >
                <XdDashedBorder
                    width={XD.box.width}
                    height={XD.box.height}
                    radius={XD.box.radius}
                    color={isFocused || isValidPhone ? '#388CFF' : '#5D5C5D'}
                />

                {/* Country flag — straddles the top border, 6.5 above it. */}
                {detectedCountry && (
                    <span
                        className="absolute shrink-0 overflow-hidden rounded-sm"
                        style={{ left: 20, top: -6.5, width: 20, height: 13 }}
                    >
                        <img
                            src={`https://flagcdn.com/w40/${detectedCountry.code.toLowerCase()}.png`}
                            alt="flag"
                            className="w-full h-full object-cover"
                        />
                    </span>
                )}

                {/* Phone icon — dims when empty. */}
                <Image
                    src="/assets/icons/auth/phone.svg"
                    alt="phone"
                    width={21}
                    height={24}
                    className={`absolute object-contain transition-opacity ${digits ? 'opacity-100' : 'opacity-50'}`}
                    style={{ left: 19.7, top: (XD.box.height - 24.3) / 2, width: 20.9, height: 24.3 }}
                />

                {/* Plus sign */}
                <span
                    className={`absolute ${digits ? 'text-[#1D1D1D]' : 'text-[#8D8D8D]'} text-xd-16 font-medium select-none`}
                    style={{ left: 52, top: 20 }}
                >
                    +
                </span>

                {/* The value, or the placeholder, both starting at the caret. */}
                <div
                    className="absolute flex items-end"
                    style={{ left: 65, top: 20, right: 45 }}
                >
                    {displayValue ? (
                        <>
                            <span className="font-medium text-xd-16 text-[#1D1D1D] truncate">
                                {displayValue}
                            </span>
                            {(keypadOpen || isFocused) && !isValidPhone && (
                                <Image
                                    src="/assets/icons/auth/phone-cursor.svg"
                                    alt=""
                                    width={10}
                                    height={1}
                                    className="animate-blink shrink-0"
                                    style={{ width: 10, height: 1, transform: 'translateY(4px)' }}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <Image
                                src="/assets/icons/auth/phone-cursor.svg"
                                alt=""
                                width={10}
                                height={1}
                                className={`animate-blink shrink-0 ${keypadOpen || isFocused ? '' : 'opacity-0!'}`}
                                style={{ width: 10, height: 1, transform: 'translateY(4px)' }}
                            />
                            <span className="text-xd-16 font-normal text-[#C3C3C3] truncate">
                                {resolvedPlaceholder}
                            </span>
                        </>
                    )}
                </div>

                {/* Send arrow — shows when the number is complete. */}
                {isValidPhone && onSend && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSend();
                        }}
                        data-pw="send-phone-number"
                        disabled={isLoading}
                        className="absolute shrink-0 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ right: 20, top: 20, width: 20, height: 20 }}
                        aria-label={translate('Send phone number')}
                    >
                        <Image
                            src="/assets/icons/auth/arrow-right.svg"
                            alt="send"
                            width={20}
                            height={20}
                            className="object-contain"
                            style={{ width: 20, height: 20 }}
                        />
                    </button>
                )}
            </div>

            {/* Custom keypad */}
            {showCustomKeypad ? (
                <NumericKeypad
                    open={keypadOpen && !isLoading}
                    onPress={handleKeypadPress}
                    onBackspace={handleKeypadBackspace}
                    disabled={isLoading}
                    keypadRef={keypadRef}
                />
            ) : (
                <input
                    ref={hiddenInputRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="off"
                    data-pw="input-phone-number-field"
                    className="sr-only"
                    value={digits}
                    disabled={isLoading}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && isValidPhone && onSend) onSend();
                    }}
                    onChange={(e) => {
                        onChange(normalizeDialInput(e.target.value).slice(0, maxTotalDigits));
                    }}
                />
            )}
        </div>
    );
}
