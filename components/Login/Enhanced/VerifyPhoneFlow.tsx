'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { LogError, translateFunction } from 'utils/functions';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';

import EnterPhoneScreen from './screens/EnterPhoneScreen';
import SelectMethodScreen from './screens/SelectMethodScreen';
import EnterPinScreen from './screens/EnterPinScreen';

export interface VerifyPhoneFlowProps {
    /** Pre-filled number. When `phoneLocked` is true the phone step is skipped. */
    initialPhone?: string | null;
    /** The account already owns this number — do not let the user swap it. */
    phoneLocked?: boolean;
    /** Injected so the settings flow can call VerifyOtpForUpdatePhone instead. */
    verify: (code: string, verificationId: string) => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onClose: () => void;
    lang?: string;
    /** 'signIn' picks the "Login !" heading, 'signUp' picks "Sign Up !". */
    authType?: 'signIn' | 'signUp';
}

type Step = 'enter-phone' | 'select-method' | 'enter-pin';

const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/**
 * Phone → method → OTP, rendering the Enhanced screens as-is.
 *
 * This is the verify-only subset of what `FullEnhancedLoginWidget` does.
 * That widget is deliberately not refactored onto this component: it also
 * carries splash, terms, QR, name and success, and it is the one auth path
 * already in production. The screens are shared; the send/verify plumbing is
 * not.
 */
export default function VerifyPhoneFlow({
    initialPhone,
    phoneLocked = false,
    verify,
    onSuccess,
    onClose,
    lang = 'en',
    authType = 'signIn',
}: VerifyPhoneFlowProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const { verficationID } = useAppStore();

    const startsAtMethod = Boolean(phoneLocked && initialPhone);
    const [step, setStep] = useState<Step>(startsAtMethod ? 'select-method' : 'enter-phone');
    const [direction, setDirection] = useState(1);
    const [phone, setPhone] = useState(initialPhone || '');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<'send-phone' | 'send-pin' | 'resend-pin' | 'verify-pin' | ''>('');

    // The pin inputs can fire onComplete twice inside one tick, before `loading`
    // has re-rendered, and each extra submit burns a server-side attempt.
    const verifyingRef = useRef(false);

    const goTo = (next: Step, dir = 1) => {
        setDirection(dir);
        setError('');
        setStep(next);
    };

    /**
     * A failed request carries either a backend message (already localised by
     * the API) or nothing useful — fall back to a translated generic line rather
     * than showing "undefined" or an internal string.
     */
    const errorText = (e: unknown) => {
        const message = e instanceof Error ? e.message : '';
        const useful = message && message !== 'Wrong Code' && message !== 'user not found';
        return useful ? message : translate('Something went wrong');
    };

    const handleSendPhone = () => {
        if (!phone || loading) return;
        goTo('select-method', 1);
    };

    const handleSelectMethod = async (selected: 'sms' | 'whatsapp') => {
        if (loading) return;
        // The screen renders its own cooldown / cap message, so returning
        // silently still leaves the user with an explanation on screen.
        if (getNumberLockRemaining(phone) > 0 || isSessionCapReached(phone)) return;

        setMethod(selected);
        setError('');
        setLoading('send-pin');
        try {
            await AuthService.SendOtp(phone, selected === 'whatsapp' ? 1 : 0, () => {});
            setPin('');
            setIsValidPin('');
            setLoading('');
            goTo('enter-pin', 1);
        } catch (e) {
            setLoading('');
            setError(errorText(e));
            LogError({ error: e, scenario: 'Error sending OTP in VerifyPhoneFlow' });
        }
    };

    const handleResend = async () => {
        if (!phone || !method || loading) return;
        if (getNumberLockRemaining(phone) > 0) return;

        setError('');
        setLoading('resend-pin');
        try {
            await AuthService.SendOtp(phone, method === 'whatsapp' ? 1 : 0, () => {});
            setPin('');
            setIsValidPin('');
            setLoading('');
        } catch (e) {
            setLoading('');
            setError(errorText(e));
            LogError({ error: e, scenario: 'Error resending OTP in VerifyPhoneFlow' });
        }
    };

    const handleVerify = async (inputPin: string) => {
        if (loading || verifyingRef.current) return;
        verifyingRef.current = true;
        setError('');
        setLoading('verify-pin');
        try {
            const result = await verify(inputPin, verficationID as string);
            setIsValidPin('valid');
            setLoading('');
            // Let the green "valid" state land before the host tears us down.
            setTimeout(() => onSuccess(result), 600);
        } catch (e) {
            setLoading('');
            setIsValidPin('notvalid');
            setError(translate('Please Enter The Correct Code Sent To Your Phone'));
            LogError({ error: e, scenario: 'Error verifying OTP in VerifyPhoneFlow' });
            setTimeout(() => {
                setIsValidPin('');
                setPin('');
            }, 1500);
        } finally {
            // Released once the request settled: a retry, or a resend that brings
            // the user back here, must not stay blocked.
            verifyingRef.current = false;
        }
    };

    // Locked numbers have no phone step to go back to, so no Edit affordance.
    const backFromMethod = phoneLocked ? undefined : () => goTo('enter-phone', -1);

    return (
        <div className="w-full h-full relative overflow-hidden">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
                    transition={transition}
                    className="absolute inset-0 w-full h-full"
                >
                    {step === 'enter-phone' && (
                        <EnterPhoneScreen
                            authType={authType}
                            phone={phone}
                            setPhone={setPhone}
                            onSubmit={handleSendPhone}
                            loading={loading === 'send-phone'}
                            error={error}
                            variant="fullscreen"
                            lang={lang}
                            onClose={onClose}
                        />
                    )}

                    {step === 'select-method' && (
                        <SelectMethodScreen
                            phone={phone}
                            method={method}
                            setMethod={handleSelectMethod}
                            changeNumber={backFromMethod}
                            loading={loading === 'send-pin'}
                            error={error}
                            variant="fullscreen"
                            lang={lang}
                            authType={authType}
                            onClose={onClose}
                        />
                    )}

                    {step === 'enter-pin' && (
                        <EnterPinScreen
                            phone={phone}
                            method={method}
                            pin={pin}
                            authType={authType}
                            setPin={setPin}
                            onSubmit={handleVerify}
                            onResend={handleResend}
                            changeMethod={() => goTo('select-method', -1)}
                            // Hidden when the account owns the number: the user
                            // must verify this one, not swap it.
                            changeNumber={phoneLocked ? undefined : () => goTo('enter-phone', -1)}
                            isValidPin={isValidPin}
                            loading={loading}
                            error={error}
                            variant="fullscreen"
                            lang={lang}
                            onClose={onClose}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
