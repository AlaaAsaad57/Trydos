'use client';

import Image from 'next/image';
import AuthService from 'services/auth';
import { translateFunction } from 'utils/functions';
import { getNumberLockRemaining } from 'utils/otpLocks';
import { usePhoneVerifyFlow } from './usePhoneVerifyFlow';
import RdbPhoneInput from './ui/RdbPhoneInput';
import RdbPinInputs from './ui/RdbPinInputs';

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
        verify: (code, verificationId) => AuthService.VerifyOtp(code, verificationId, '', () => {}),
        onSuccess,
        lang,
        // This panel has no screen of its own to render a cooldown/cap
        // message (unlike VerifyPhoneFlow's select-method screen), so a
        // blocked send needs a visible error here.
        blockedMessage: (secondsRemaining) =>
            `${translate('Wait')} ${secondsRemaining}s ${translate('before trying again')}`,
        source: 'InlineVerifyPanel',
    });

    const busy = loading !== '';

    const methodButton = (kind: 'whatsapp' | 'sms', label: string, icon: string) => (
        <button
            onClick={() => sendMethod(kind)}
            disabled={busy}
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
            className="w-full h-full flex flex-col items-center justify-center gap-xd-8 px-xd-10 font-quicksand"
            // The panel sits inside the cart's Confirm button, whose onClick
            // would otherwise swallow every interaction in here.
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={onClose}
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

            {step === 'enter-phone' && (
                <div className="w-full h-xd-60">
                    <RdbPhoneInput
                        value={phone}
                        onChange={setPhone}
                        onSend={() => setStep('select-method')}
                        placeholder={translate('Enter Your Phone Number')}
                        lang={lang}
                        isLoading={busy}
                    />
                </div>
            )}

            {step === 'select-method' && (
                <div className="w-full flex">
                    {methodButton('whatsapp', translate('Send WhatsApp'), '/assets/icons/auth/whatsapp.svg')}
                    {methodButton('sms', translate('Send SMS'), '/assets/icons/auth/sms.svg')}
                </div>
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
                    />
                    <button
                        onClick={() => method && sendMethod(method)}
                        disabled={busy || getNumberLockRemaining(phone) > 0}
                        className="text-xd-12 text-[#388CFF] underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {translate('Resend Code')}
                    </button>
                </>
            )}

            {error && (
                <p role="alert" className="text-xd-11 font-medium text-[#FF5F61] text-center">
                    {error}
                </p>
            )}
        </div>
    );
}
