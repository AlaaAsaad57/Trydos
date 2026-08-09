'use client';

import { useRef, useState } from 'react';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { LogError, translateFunction } from 'utils/functions';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';

export type PhoneVerifyStep = 'enter-phone' | 'select-method' | 'enter-pin';

type Method = 'sms' | 'whatsapp' | '';

// 'send-phone' is never set (the phone step has nothing to await) but stays in
// the union so hosts that compare against it — VerifyPhoneFlow passes
// `loading === 'send-phone'` straight through to EnterPhoneScreen — keep
// type-checking against a literal that is actually part of this type.
type LoadingState = '' | 'send-phone' | 'send-pin' | 'resend-pin' | 'verify-pin';

export interface UsePhoneVerifyFlowOptions {
    /** Pre-filled number. When `phoneLocked` is true the flow starts at the method step. */
    initialPhone?: string | null;
    /** The account already owns this number — do not let the user swap it. */
    phoneLocked?: boolean;
    /** Injected so a caller can verify against a different endpoint (e.g. the
     *  settings flow's VerifyOtpForUpdatePhone instead of VerifyOtp). */
    verify: (code: string, verificationId: string) => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    lang?: string;
    /**
     * Builds the message to show as `error` when a send is blocked by the
     * client-side cooldown/cap guard. Omit when the host already renders its
     * own cooldown/cap message (VerifyPhoneFlow's select-method screen reads
     * the phone value itself) — the block then stays silent, matching that
     * screen's existing behaviour. A host with no such screen (InlineVerifyPanel)
     * supplies this to surface a visible error instead.
     */
    blockedMessage?: (secondsRemaining: number) => string;
    /**
     * Runs right after a send moves the step to 'enter-pin', for a host that
     * tracks its own layout-only state alongside the step (VerifyPhoneFlow's
     * slide-transition direction).
     */
    onAdvance?: () => void;
    /** Distinguishes LogError scenarios per host component. */
    source: string;
}

export interface UsePhoneVerifyFlowResult {
    step: PhoneVerifyStep;
    setStep: (step: PhoneVerifyStep) => void;
    phone: string;
    setPhone: (phone: string) => void;
    method: Method;
    pin: string;
    setPin: (pin: string) => void;
    isValidPin: 'valid' | 'notvalid' | '';
    error: string;
    setError: (error: string) => void;
    loading: LoadingState;
    /** Sends the OTP for the first time (or after a method switch) and, on success, advances to 'enter-pin'. */
    sendMethod: (selected: 'sms' | 'whatsapp') => Promise<void>;
    /** Resends on the already-selected method without changing step. */
    resend: () => Promise<void>;
    verifyPin: (inputPin: string) => Promise<void>;
}

/**
 * Layout-independent phone verify flow: state plus the send/verify/resend
 * calls against `AuthService` and the client-side OTP guard
 * (`utils/otpLocks`). Shared by `VerifyPhoneFlow` (the fullscreen Enhanced
 * screens, animated with framer-motion) and `InlineVerifyPanel` (the cart's
 * ~200px footer panel, built from the `ui/` primitives) — the two differ only
 * in JSX/layout, animation direction, and how a blocked send is surfaced, all
 * of which stay with the caller.
 */
export function usePhoneVerifyFlow({
    initialPhone,
    phoneLocked = false,
    verify,
    onSuccess,
    lang = 'en',
    blockedMessage,
    onAdvance,
    source,
}: UsePhoneVerifyFlowOptions): UsePhoneVerifyFlowResult {
    const translate = (key: string) => translateFunction(key, lang);
    const { verficationID } = useAppStore();

    const startsAtMethod = Boolean(phoneLocked && initialPhone);
    const [step, setStep] = useState<PhoneVerifyStep>(startsAtMethod ? 'select-method' : 'enter-phone');
    const [phone, setPhone] = useState(initialPhone || '');
    const [method, setMethod] = useState<Method>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<LoadingState>('');

    // The pin inputs can fire onComplete twice inside one tick, before `loading`
    // has re-rendered, and each extra submit burns a server-side attempt.
    const verifyingRef = useRef(false);

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

    const sendMethod = async (selected: 'sms' | 'whatsapp') => {
        if (loading) return;
        const remaining = getNumberLockRemaining(phone);
        // The screen renders its own cooldown / cap message when `blockedMessage`
        // is omitted, so returning silently still leaves the user with an
        // explanation on screen.
        if (remaining > 0 || isSessionCapReached(phone)) {
            if (blockedMessage) setError(blockedMessage(remaining));
            return;
        }
        setMethod(selected);
        setError('');
        setLoading('send-pin');
        try {
            await AuthService.SendOtp(phone, selected === 'whatsapp' ? 1 : 0, () => {});
            setPin('');
            setIsValidPin('');
            setLoading('');
            setStep('enter-pin');
            onAdvance?.();
        } catch (e) {
            setLoading('');
            setError(errorText(e));
            LogError({ error: e, scenario: `Error sending OTP in ${source}` });
        }
    };

    const resend = async () => {
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
            LogError({ error: e, scenario: `Error resending OTP in ${source}` });
        }
    };

    const verifyPin = async (inputPin: string) => {
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
            LogError({ error: e, scenario: `Error verifying OTP in ${source}` });
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

    return {
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
    };
}
