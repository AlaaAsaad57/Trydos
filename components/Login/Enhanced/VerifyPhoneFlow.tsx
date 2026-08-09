'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePhoneVerifyFlow, type PhoneVerifyStep } from './usePhoneVerifyFlow';

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

const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/**
 * Phone → method → OTP, rendering the Enhanced screens as-is.
 *
 * This is the verify-only subset of what `FullEnhancedLoginWidget` does.
 * That widget is deliberately not refactored onto this component: it also
 * carries splash, terms, QR, name and success, and it is the one auth path
 * already in production. The screens are shared; the send/verify plumbing
 * lives in `usePhoneVerifyFlow`, shared with `InlineVerifyPanel`.
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
    // Layout-only: which way the next screen slides in. The hook doesn't know
    // about animation, so it stays here and is nudged by `goTo` (manual nav)
    // and `onAdvance` (the hook's own send → 'enter-pin' transition).
    const [direction, setDirection] = useState(1);

    const {
        step,
        setStep,
        phone,
        setPhone,
        method,
        pin,
        setPin,
        isValidPin,
        error,
        setError,
        loading,
        sendMethod,
        resend,
        verifyPin,
    } = usePhoneVerifyFlow({
        initialPhone,
        phoneLocked,
        verify,
        onSuccess,
        lang,
        onAdvance: () => setDirection(1),
        source: 'VerifyPhoneFlow',
    });

    const goTo = (next: PhoneVerifyStep, dir = 1) => {
        setDirection(dir);
        setError('');
        setStep(next);
    };

    const handleSendPhone = () => {
        if (!phone || loading) return;
        goTo('select-method', 1);
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
                            setMethod={sendMethod}
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
                            onSubmit={verifyPin}
                            onResend={resend}
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
