'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NumericKeypad } from './NumericKeypad';
import { useIsTouchDevice } from 'hooks/useIsTouchDevice';

interface RdbPinInputsProps {
    value: string;
    onComplete: (value: string) => void;
    onChange: (value: string) => void;
    disabled?: boolean;
    isValidPin?: 'valid' | 'notvalid' | 'reenter' | '';
    label?: string;
    labelTone?: 'default' | 'error';
    autoFocus?: boolean;
    isExpired?: boolean;
}

export default function RdbPinInputs({
    isValidPin = '',
    value,
    onComplete,
    onChange,
    disabled = false,
    label,
    labelTone = 'default',
    autoFocus = true,
    isExpired = false,
}: RdbPinInputsProps) {
    const isTouch = useIsTouchDevice();
    const showCustomKeypad = isTouch;

    const [pin, setPin] = useState<string[]>(Array(6).fill(''));
    const [shake, setShake] = useState(false);
    const [shakeNonce, setShakeNonce] = useState(0);
    const [keypadOpen, setKeypadOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLDivElement>(null);
    const keypadRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const disabledRef = useRef(disabled);
    useEffect(() => { disabledRef.current = disabled; }, [disabled]);

    // Open keypad on mount
    useEffect(() => {
        if (!disabled && showCustomKeypad && autoFocus) {
            const t = setTimeout(() => setKeypadOpen(true), 300);
            return () => clearTimeout(t);
        }
        if (!disabled && !showCustomKeypad && autoFocus) {
            const t = setTimeout(() => hiddenInputRef.current?.focus(), 300);
            return () => clearTimeout(t);
        }
    }, [disabled, showCustomKeypad, autoFocus]);

    // Restore keypad when disabled transitions true → false
    useEffect(() => {
        if (!disabled && showCustomKeypad) {
            setKeypadOpen(true);
        } else if (!disabled && !showCustomKeypad) {
            if (document.activeElement !== hiddenInputRef.current) {
                hiddenInputRef.current?.focus();
            }
        }
    }, [disabled]);

    // Close keypad when clicking outside input AND keypad
    useEffect(() => {
        if (!keypadOpen) return;
        function handleClick(e: MouseEvent | TouchEvent) {
            if (disabledRef.current) return;
            const target = e.target as Node;
            if (inputRef.current && inputRef.current.contains(target)) return;
            if (keypadRef.current && keypadRef.current.contains(target)) return;
            setKeypadOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('touchstart', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('touchstart', handleClick);
        };
    }, [keypadOpen]);

    useEffect(() => {
        const newPin = value.split('').slice(0, 6);
        while (newPin.length < 6) newPin.push('');
        setPin(newPin);
    }, [value]);

    useEffect(() => {
        if (isValidPin === 'notvalid') {
            setShakeNonce((current) => current + 1);
            setShake(true);
            const t = setTimeout(() => setShake(false), 700);
            return () => clearTimeout(t);
        }
    }, [isValidPin]);

    const activeIndex =
        disabled || (!showCustomKeypad && !isFocused) ? -1 : pin.findIndex((d) => d === '');

    const addDigit = useCallback(
        (digit: string) => {
            setPin((prev) => {
                const firstEmpty = prev.findIndex((d) => d === '');
                if (firstEmpty === -1) return prev;
                const next = [...prev];
                next[firstEmpty] = digit;
                return next;
            });
            const firstEmpty = pin.findIndex((d) => d === '');
            if (firstEmpty === -1) return;
            const next = [...pin];
            next[firstEmpty] = digit;
            const combined = next.join('');
            onChange(combined);
            if (next.every((d) => d !== '')) {
                setTimeout(() => onComplete(combined), 0);
            }
        },
        [pin, onChange, onComplete],
    );

    const removeDigit = useCallback(() => {
        setPin((prev) => {
            const lastFilled = [...prev].reverse().findIndex((d) => d !== '');
            if (lastFilled === -1) return prev;
            const idx = 5 - lastFilled;
            const next = [...prev];
            next[idx] = '';
            onChange(next.join(''));
            return next;
        });
    }, [onChange]);

    const getBoxClass = (digit: string, i: number) => {
        const isActive = activeIndex === i;
        if (isValidPin === 'valid') return 'border border-[#78D97F] bg-[#FCFFFC]';
        if (isValidPin === 'notvalid') return 'border border-dashed border-[#FF5F61] bg-white';
        if (isExpired && !digit) return 'border border-dashed border-[#FDCA57] bg-[#FCFCFC]';
        if (isExpired && digit) return 'border border-dashed border-[#FDCA57] bg-white';
        if (isActive) return 'border border-[#4D84FF]/50 border-dashed bg-white';
        if (digit) return 'border border-[#4D84FF]/50 bg-white';
        return 'border border-dashed border-[#C3C3C3] bg-[#FCFCFC]';
    };

    return (
        <>
            <div
                ref={inputRef}
                className="flex flex-col items-center gap-xd-5 w-full cursor-pointer"
                onClick={() => {
                    if (disabled) return;
                    if (showCustomKeypad) setKeypadOpen(true);
                    else {
                        hiddenInputRef.current?.focus();
                        setIsFocused(true);
                    }
                }}
            >
                <div
                    key={shakeNonce}
                    className={`flex items-center justify-center gap-xd-5 w-full ${shake ? 'animate-shake-horizontal' : ''}`}
                >
                    {pin.map((digit, i) => (
                        <div
                            key={i}
                            className={`relative size-xd-60 flex items-center my-xd-2 justify-center rounded-xd-15 transition-all duration-150 ${getBoxClass(digit, i)}`}
                        >
                            {digit && (
                                <span className="text-xd-16 font-semibold text-[#1D1D1D] pointer-events-none select-none">
                                    {digit}
                                </span>
                            )}

                            {activeIndex === i &&
                                !digit &&
                                isValidPin !== 'valid' &&
                                isValidPin !== 'notvalid' && (
                                    <div className="w-[7%] aspect-square bg-[#8E8E8E] rounded-full animate-blink pointer-events-none" />
                                )}
                        </div>
                    ))}
                </div>
                {label && (
                    <p
                        className={`text-xd-11 mt-xd-8 ${
                            labelTone === 'error' ? 'text-[#FF5F61] font-medium' : 'text-[#1D1D1D]'
                        }`}
                    >
                        {label}
                    </p>
                )}
            </div>

            {showCustomKeypad ? (
                <NumericKeypad
                    open={keypadOpen && isValidPin !== 'valid' && !isExpired}
                    onPress={addDigit}
                    onBackspace={removeDigit}
                    disabled={disabled}
                    keypadRef={keypadRef}
                />
            ) : (
                <input
                    ref={hiddenInputRef}
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    // Lets the browser/OS offer the code it just saw in an SMS.
                    autoComplete="one-time-code"
                    className="sr-only"
                    value={value}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        onChange(digits);
                        if (digits.length === 6) onComplete(digits);
                    }}
                />
            )}
        </>
    );
}
