'use client';

import { useRef, useState } from 'react';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { LogError, translateFunction } from 'utils/functions';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
import { GA_BUTTONS_NAMES, GA_EVENT_NAMES } from 'utils/GAEvents';
import { GAevent } from 'utils/gtag';
import { normalizeDialInput } from './ui/RdbPhoneInput';

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
    // Per-field selector: a whole-store destructure would re-render every host
    // of this hook (cart, re-auth widget, session-expired prompt, settings) on
    // any unrelated store write.
    const verficationID = useAppStore((s) => s.verficationID);

    const startsAtMethod = Boolean(phoneLocked && initialPhone);
    const [step, setStep] = useState<PhoneVerifyStep>(startsAtMethod ? 'select-method' : 'enter-phone');
    // `phone` is digits only, everywhere. The screens render it as `+{phone}`
    // and `AuthService.SendOtp` is given it raw, so a seed value carrying its
    // own prefix — `userProfile.phone` is stored as "+963…", and the settings
    // form hands over whatever the shopper typed — would otherwise show "++963…"
    // and send a differently-shaped number than the login flow does.
    // `normalizeDialInput` is the same helper RdbPhoneInput applies to typed
    // input, so a seeded number and a typed one end up identical.
    const [phone, setPhone] = useState(normalizeDialInput(initialPhone || ''));
    const [method, setMethod] = useState<Method>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<LoadingState>('');

    // The pin inputs can fire onComplete twice inside one tick, before `loading`
    // has re-rendered, and each extra submit burns a server-side attempt.
    const verifyingRef = useRef(false);
    // Verify attempts made since the last successful send — read inside the
    // resend's GA payload the way `FullEnhancedLoginWidget` does with its own
    // `attemptsRef`. A ref (not state) because it's read inside an async
    // callback and must reflect the count as of the request, not of render.
    const attemptsRef = useRef(0);

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

    /**
     * Error text for a failed send/resend. A send the limiter blocked has
     * already armed the client cooldown (`utils/otpLocks`) from the same
     * response, and the screens render a live countdown off that lock — so the
     * server's static "Please wait N seconds before trying again" is dropped.
     * Keeping it would park it in the very slot the countdown occupies, hidden
     * behind it and then revealed the instant the countdown reaches 0: a second
     * timer, frozen on the number it was issued with, that never ticks down.
     */
    const sendErrorText = (e: unknown) => (getNumberLockRemaining(phone) > 0 ? '' : errorText(e));

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
        // Mirrors FullEnhancedLoginWidget's handleSelectMethod: fired on send
        // intent (before the server result), attributed to this hook's host
        // via `source` since this flow has no login/signup mission of its own.
        GAevent({
            action: GA_EVENT_NAMES.SEND_OTP,
            params: {
                method: selected,
                source,
                button_name:
                    selected === 'whatsapp'
                        ? GA_BUTTONS_NAMES.CHOOSE_WHATSAPP_BUTTON
                        : GA_BUTTONS_NAMES.CHOOSE_SMS_BUTTON,
            },
        });
        try {
            await AuthService.SendOtp(phone, selected === 'whatsapp' ? 1 : 0, () => {});
            attemptsRef.current = 0;
            setPin('');
            setIsValidPin('');
            setLoading('');
            setStep('enter-pin');
            onAdvance?.();
        } catch (e) {
            setLoading('');
            setError(sendErrorText(e));
            LogError({ error: e, scenario: `Error sending OTP in ${source}` });
        }
    };

    const resend = async () => {
        if (!phone || !method || loading) return;
        if (getNumberLockRemaining(phone) > 0) return;

        setError('');
        setLoading('resend-pin');
        // Mirrors FullEnhancedLoginWidget's handleResendOtp.
        GAevent({
            action: GA_EVENT_NAMES.RESEND_OTP,
            params: {
                method,
                attempts: attemptsRef.current,
                source,
                button_name: GA_BUTTONS_NAMES.RESEND_OTP_BUTTON,
            },
        });
        try {
            await AuthService.SendOtp(phone, method === 'whatsapp' ? 1 : 0, () => {});
            attemptsRef.current = 0;
            setPin('');
            setIsValidPin('');
            setLoading('');
        } catch (e) {
            setLoading('');
            setError(sendErrorText(e));
            LogError({ error: e, scenario: `Error resending OTP in ${source}` });
        }
    };

    const verifyPin = async (inputPin: string) => {
        if (loading || verifyingRef.current) return;
        verifyingRef.current = true;
        attemptsRef.current += 1;
        setError('');
        setLoading('verify-pin');
        try {
            const result = await verify(inputPin, verficationID as string);
            setIsValidPin('valid');
            setLoading('');
            // Let the green "valid" state land before the host tears us down.
            //
            // Do NOT add a `clearTimeout` cleanup here. `AuthService.VerifyOtp`
            // (services/auth.ts) calls `setShouldAuthinticated(false)` BEFORE it
            // resolves. `NavbarClient.tsx` gates `ConfirmMobilePhoneWidget` /
            // `SessionExpiredWidget` on that marker (and the settings overlays
            // gate `VerifyPhoneFlow` on it too), so by the time this timer fires
            // the whole subtree — widget, VerifyPhoneFlow, this hook — has
            // already unmounted. `handleSuccess`/`onSuccess` in the host only
            // runs because this detached timer survives the unmount, carrying
            // the pre-clear state in its closure. Clearing it on unmount would
            // silently drop `verify_completed_returned_to_checkout`,
            // `setAddStory(true)` for "open Story", `ChatConroller(true)` for
            // "open chat", and the `expiredSessionPhone` cleanup — with no error
            // anywhere to flag it.
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
