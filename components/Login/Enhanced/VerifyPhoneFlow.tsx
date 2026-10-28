'use client';

import { useState } from 'react';
import { usePhoneVerifyFlow, type PhoneVerifyStep } from './usePhoneVerifyFlow';
import type { AuthFlowType } from './authHeadings';

// The new design's screens and stage (A-19 in UI-MIGRATION-PLAN.md).
import AuthStage, { LOGO_PURPLE } from 'NewLoginDesign/AuthStage';
import { DEFAULT_LOGO_CONFIG } from 'NewLoginDesign/logoScreenConfig';
import NewGetStartedScreen from 'NewLoginDesign/NewGetStartedScreen';
import NewTermsScreen from 'NewLoginDesign/NewTermsScreen';
import NewEnterPhoneScreen from 'NewLoginDesign/NewEnterPhoneScreen';
import NewSelectMethodScreen from 'NewLoginDesign/NewSelectMethodScreen';
import NewEnterPinScreen from 'NewLoginDesign/NewEnterPinScreen';
import QrBottomSheet from 'NewLoginDesign/QrBottomSheet';
import { GAevent } from 'utils/gtag';
import { GA_AUTH_SCREEN, GA_BUTTONS_NAMES, GA_EVENT_NAMES } from 'utils/GAEvents';

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
    /** Picks the heading each screen shows — see `authHeadings.ts`. */
    authType?: AuthFlowType;
    /**
     * Checkout (A-27): a shopper with no number on file first says who they
     * are on Get Started ("I have already account" / "New customer"), and a new
     * customer accepts the terms, before the phone step. Skipped when the
     * account already owns its number.
     */
    withIntro?: boolean;
    /** Names the host in the analytics and the error log. */
    source?: string;
}

/** The two steps a checkout shopper with no number sees before the phone step. */
type IntroStep = 'get-started' | 'terms';

/**
 * Phone → method → OTP, on the new design's screens and stage.
 *
 * The verify-only part of the login (`NewLoginWidget`), shown as an overlay on
 * the page the shopper is on, because that page waits for the result (A-19 in
 * UI-MIGRATION-PLAN.md): the phone re-verify, the personal-info phone change
 * and `VerifyUser`. The send/verify plumbing lives in `usePhoneVerifyFlow`.
 */
export default function VerifyPhoneFlow({
    initialPhone,
    phoneLocked = false,
    verify,
    onSuccess,
    onClose,
    lang = 'en',
    // Every host of this component is confirming a number, not logging in —
    // the login/signup headings belong to the login page's own flow.
    authType = 'verify',
    withIntro = false,
    source = 'VerifyPhoneFlow',
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
        attemptsLocked,
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
        source,
    });

    // A number the account owns needs no intro: the flow opens on the method step.
    const [intro, setIntro] = useState<IntroStep | null>(
        withIntro && !(phoneLocked && initialPhone) ? 'get-started' : null,
    );
    const moveIntro = (next: IntroStep | null, dir = 1) => {
        setDirection(dir);
        setIntro(next);
    };
    /** The step on show: an intro step, or the verify step behind it. */
    const shown = intro ?? step;
    const [isQrOpen, setIsQrOpen] = useState(false);

    /** Get Started's QR button: the sheet with "Soon available" (A-23), and the
     *  same two events the login page sends for it. */
    const openQr = () => {
        GAevent({
            action: GA_EVENT_NAMES.LOGIN_START,
            params: { method_otp: 'qr', button_name: GA_BUTTONS_NAMES.LOGIN_METHOD_QR_BUTTON },
        });
        GAevent({
            action: GA_EVENT_NAMES.SCREEN_VIEW,
            params: { screen_name: GA_AUTH_SCREEN.QR_LOGIN_SCREEN, screen_path: window.location.pathname },
        });
        setIsQrOpen(true);
    };

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
        <AuthStage
            step={shown}
            direction={direction}
            // Every step shares its name with one of the login's logo slots.
            slot={DEFAULT_LOGO_CONFIG[shown]}
            dotColor={LOGO_PURPLE.dot}
            ringColor={LOGO_PURPLE.ring}
            overlay={
                withIntro && (
                    <QrBottomSheet isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} lang={lang} />
                )
            }
        >
            {intro === 'get-started' && (
                <NewGetStartedScreen
                    onExistingAccount={() => moveIntro(null)}
                    onNewCustomer={() => moveIntro('terms')}
                    // "Later" leaves the verify, as the panel's close did.
                    onLater={onClose}
                    onScanQr={openQr}
                    lang={lang}
                />
            )}

            {intro === 'terms' && (
                <NewTermsScreen
                    onAgree={() => moveIntro(null)}
                    onLater={() => moveIntro('get-started', -1)}
                    lang={lang}
                />
            )}

            {!intro && step === 'enter-phone' && (
                <NewEnterPhoneScreen
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

            {!intro && step === 'select-method' && (
                <NewSelectMethodScreen
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

            {!intro && step === 'enter-pin' && (
                <NewEnterPinScreen
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
                    attemptsLocked={attemptsLocked}
                    loading={loading}
                    error={error}
                    variant="fullscreen"
                    lang={lang}
                    onClose={onClose}
                />
            )}
        </AuthStage>
    );
}
