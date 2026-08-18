'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import AuthService from 'services/auth';
import { translateFunction } from 'utils/functions';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
import { GA_EVENT_NAMES } from 'utils/GAEvents';
import { GAevent } from 'utils/gtag';
import { usePhoneVerifyFlow } from './usePhoneVerifyFlow';
import RdbPhoneInput from './ui/RdbPhoneInput';
import RdbPinInputs from './ui/RdbPinInputs';

/**
 * The two steps this panel owns before the shared verify flow starts.
 *
 * A shopper with no number on file first says which one they are: an existing
 * account goes straight to the phone input, a new one accepts the terms first.
 * Same opening the fullscreen login has (GetStartedScreen → TermsScreen), only
 * laid out for the short cart panel. Kept local to this component so the shared
 * `usePhoneVerifyFlow` step machine — and its other hosts — stay untouched.
 */
type IntroStep = 'choice' | 'terms' | 'done';

interface InlineVerifyPanelProps {
    initialPhone?: string | null;
    /** The account already owns this number — start at the method step. */
    phoneLocked?: boolean;
    onSuccess: () => void;
    onClose: () => void;
    lang?: string;
}

/**
 * The verify flow compressed into the cart footer's expanded button (~200px).
 *
 * Built from the Enhanced `ui/` primitives rather than the Enhanced screens:
 * those screens size themselves against the 430×932 artboard through
 * `FlexibleSpace` (raw artboard px) and overflow a short container. The
 * send/verify/resend logic itself lives in `usePhoneVerifyFlow`, shared with
 * `VerifyPhoneFlow` — only the JSX below is specific to this panel.
 */
export default function InlineVerifyPanel({
    initialPhone,
    phoneLocked = false,
    onSuccess,
    onClose,
    lang = 'en',
}: InlineVerifyPanelProps) {
    const translate = (key: string) => translateFunction(key, lang);

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
        loading,
        sendMethod,
        verifyPin,
    } = usePhoneVerifyFlow({
        initialPhone,
        phoneLocked,
        verify: (code, verificationId) => AuthService.VerifyOtp(code, verificationId),
        onSuccess,
        lang,
        // No `blockedMessage`: this panel renders its own live cooldown/cap
        // message below, the same way SelectMethodScreen does, so a blocked
        // send has an explanation on screen before the shopper even taps.
        // Passing one as well would show two competing messages.
        source: 'InlineVerifyPanel',
    });

    const busy = loading !== '';

    // The account already owns this number, so there is nothing to ask: the
    // flow opens on the method step and the intro is skipped entirely.
    const startsAtMethod = Boolean(phoneLocked && initialPhone);
    const [intro, setIntro] = useState<IntroStep>(startsAtMethod ? 'done' : 'choice');

    const agreeTerms = () => {
        // Same event TermsScreen fires, so accepting the terms here is counted
        // like accepting them in the fullscreen signup.
        GAevent({
            action: GA_EVENT_NAMES.TERMS_SERVICES,
            params: { mission: 'signup', status: 'terms_accepted' },
        });
        setIntro('done');
    };

    // Mirrors SelectMethodScreen's own lock/cap polling, so the countdown ticks
    // down on screen and the method buttons are not tappable while a send would
    // just be re-blocked.
    const [lockRemaining, setLockRemaining] = useState(0);
    const [capReached, setCapReached] = useState(false);
    // A *successful* send arms the very same per-number cooldown a refused one
    // does — `services/auth.ts` locks the number on success so the resend is
    // throttled. So "a cooldown is running" cannot, on its own, mean the send
    // failed: read that way, the red "Wait Ns before trying again" line landed
    // right under the pin inputs the success had just opened. This flag says
    // which of the two armed it, so only a refusal gets the red line.
    const [sendSucceeded, setSendSucceeded] = useState(false);
    useEffect(() => {
        // A different number carries its own cooldown; the last send's outcome
        // says nothing about it.
        setSendSucceeded(false);
        if (!phone) {
            setLockRemaining(0);
            setCapReached(false);
            return;
        }
        const sync = () => {
            setLockRemaining(getNumberLockRemaining(phone));
            setCapReached(isSessionCapReached(phone));
        };
        sync();
        const id = setInterval(sync, 1000);
        return () => clearInterval(id);
    }, [phone]);

    const blocked = lockRemaining > 0 || capReached;

    // Every send in this panel goes through here — first send, method switch and
    // resend alike — so the outcome is recorded on exactly one path.
    const runSend = async (kind: 'whatsapp' | 'sms') => {
        setSendSucceeded(await sendMethod(kind));
    };

    const methodButton = (kind: 'whatsapp' | 'sms', label: string, icon: string) => (
        <button
            onClick={() => runSend(kind)}
            data-pw={`inline-${kind}-receive-otp`}
            disabled={busy || blocked}
            className={`relative mx-0.5 flex flex-1 items-center justify-center h-xd-48 rounded-xd-15 border border-dashed transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                method === kind ? 'border-[#388CFF] bg-[#FCFCFC]' : 'border-[#C3C3C3] bg-white'
            }`}
        >
            <span className="absolute bg-white -top-2.5 left-xd-14 w-5 h-5 flex items-center justify-center">
                <Image src={icon} alt="" width={20} height={20} className="size-xd-20 object-contain" />
            </span>
            <span className="text-xd-14 text-[#1D1D1D]">{label}</span>
        </button>
    );

    return (
        <div
            // Capped at the RDB design canvas width so the panel keeps the same
            // proportions as the fullscreen auth screens on a wide cart footer.
            className="w-full max-w-[430px] mx-auto h-full flex flex-col items-center justify-center gap-xd-8 px-xd-10 font-quicksand"
            // The panel sits inside the cart's Confirm button, whose onClick
            // would otherwise swallow every interaction in here.
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={onClose}
                data-pw="inline-close"
                aria-label={translate('Close')}
                className="self-end w-xd-24 h-xd-24 flex items-center justify-center cursor-pointer"
            >
                <Image
                    src="/assets/icons/auth/close.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="object-contain"
                />
            </button>

            {intro === 'choice' && (
                <>
                
                    {/* Side by side, not stacked as on GetStartedScreen: the cart
                        panel is ~200px tall and two 60px buttons plus the heading
                        do not fit in it. */}
                    <div className="w-full flex items-stretch gap-xd-8">
                        <button
                            onClick={() => setIntro('done')}
                            data-pw="inline-have-account-button"
                            className="xd-dashed-border flex-1 h-xd-48 px-1 rounded-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-13 leading-[1.3] cursor-pointer transition-all active:scale-[0.98]"
                        >
                            {translate('I Have Already Account')}
                        </button>
                        <button
                            onClick={() => setIntro('terms')}
                            data-pw="inline-create-account"
                            className="xd-dashed-border flex-1 h-xd-48 px-1 rounded-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-13 leading-[1.3] cursor-pointer transition-all active:scale-[0.98]"
                        >
                            {translate('New Customer')}
                        </button>
                    </div>
                </>
            )}

            {intro === 'terms' && (
                <>
                    <p className="text-xd-12 leading-[1.4] text-[#1D1D1D] text-center px-xd-10">
                        {translate('To Create New Account Tap “Agree & Continue” To Accept')}{' '}
                        <span className="font-bold">Trydos </span>
                        {translate('terms of services')}
                    </p>
                    <div className="flex items-center gap-xd-5">
                        <Image
                            src="/assets/icons/auth/terms.svg"
                            alt=""
                            width={20}
                            height={20}
                            className="w-xd-20 h-xd-20 object-contain"
                        />
                        <span className="text-xd-12 text-[#388CFF]">
                            {translate('Terms Of Services')}
                        </span>
                    </div>
                    <button
                        onClick={agreeTerms}
                        data-pw="inline-agree-continue"
                        className="w-full h-xd-48 rounded-xd-20 border border-dashed border-[#5D5C5D]/50 bg-[#FAFAFA] text-[#3C3C3C] text-xd-14 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('Agree & Continue')}
                    </button>
                </>
            )}

            {intro === 'done' && step === 'enter-phone' && (
                <div className="w-full h-xd-60">
                    <RdbPhoneInput
                        value={phone}
                        onChange={setPhone}
                        onSend={() => setStep('select-method')}
                        placeholder={translate('Enter Your Phone Number')}
                        lang={lang}
                        isLoading={busy}
                        disableCustomKeypad
                    />
                </div>
            )}

            {step === 'select-method' && (
                <>
                    <div className="w-full flex">
                        {methodButton('whatsapp', translate('Send WhatsApp'), '/assets/icons/auth/whatsapp.svg')}
                        {methodButton('sms', translate('Send SMS'), '/assets/icons/auth/sms.svg')}
                    </div>
                    {/* Omitted when the account already owns this number — the
                        user must verify it, not swap it (same rule VerifyPhoneFlow's
                        `backFromMethod` follows for the fullscreen screens). */}
                    {!phoneLocked && (
                        <button
                            onClick={() => setStep('enter-phone')}
                            data-pw="inline-change-phone-number"
                            className="text-xd-12 text-[#388CFF] underline cursor-pointer"
                        >
                            {translate('Change Number')}
                        </button>
                    )}
                </>
            )}

            {step === 'enter-pin' && (
                <>
                    <RdbPinInputs
                        value={pin}
                        onChange={setPin}
                        onComplete={verifyPin}
                        disabled={busy || isValidPin === 'valid'}
                        isValidPin={isValidPin}
                        autoFocus={false}
                        disableCustomKeypad
                    />
                    <button
                        onClick={() => method && runSend(method)}
                        data-pw="inline-resend-code"
                        disabled={busy || blocked}
                        className="text-xd-12 text-[#388CFF] underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {translate('Resend Code')}
                    </button>
                </>
            )}

            {/* Live cooldown countdown — visible before the shopper taps, and
                ticking, so the wait is explained rather than discovered. Only
                for a send that was actually refused (see `sendSucceeded`). */}
            {lockRemaining > 0 && !sendSucceeded && (
                <p
                    data-pw="otp-cooldown"
                    className="text-xd-11 font-medium text-[#FF5F61] text-center"
                >
                    <span>{translate('Wait')} </span>
                    <span className="font-bold">
                        {lockRemaining}
                        {translate('s')}
                    </span>
                    <span> {translate('before trying again')}</span>
                </p>
            )}

            {/* The code did go out, so the same countdown means only "the resend
                is not open yet". Same one-line slot, stated the way EnterPinScreen
                states it, instead of leaving the disabled resend unexplained. */}
            {lockRemaining > 0 && sendSucceeded && (
                <p data-pw="otp-resend-countdown" className="text-xd-11 text-[#8E8E8E] text-center">
                    <span>{translate('Resend After -')} </span>
                    <span className="font-bold text-[#388CFF]">
                        {lockRemaining}
                        {translate('s')}
                    </span>
                </p>
            )}

            {/* The distinct-number session cap has no countdown of its own — it
                clears on its own window, so it gets a message, not a timer. */}
            {lockRemaining === 0 && capReached && (
                <p
                    data-pw="otp-cap-reached"
                    className="text-xd-11 font-medium text-[#FF5F61] text-center"
                >
                    {translate('Session limit reached. Try again later.')}
                </p>
            )}

            {!blocked && error && (
                <p role="alert" className="text-xd-11 font-medium text-[#FF5F61] text-center">
                    {error}
                </p>
            )}
        </div>
    );
}
