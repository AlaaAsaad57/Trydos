'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { LogError, translateFunction } from 'utils/functions';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
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

type Step = 'enter-phone' | 'select-method' | 'enter-pin';

/**
 * The verify flow compressed into the cart footer's expanded button (~200px).
 *
 * Built from the Enhanced `ui/` primitives rather than the Enhanced screens:
 * those screens size themselves against the 430×932 artboard through
 * `FlexibleSpace` (raw artboard px) and overflow a short container.
 */
export default function InlineVerifyPanel({
    initialPhone,
    phoneLocked = false,
    onSuccess,
    onClose,
    lang = 'en',
}: InlineVerifyPanelProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const { verficationID } = useAppStore();

    const startsAtMethod = Boolean(phoneLocked && initialPhone);
    const [step, setStep] = useState<Step>(startsAtMethod ? 'select-method' : 'enter-phone');
    const [phone, setPhone] = useState(initialPhone || '');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const errorText = (e: unknown) => {
        const message = e instanceof Error ? e.message : '';
        const useful = message && message !== 'Wrong Code' && message !== 'user not found';
        return useful ? message : translate('Something went wrong');
    };

    const send = async (selected: 'sms' | 'whatsapp') => {
        if (busy) return;
        if (getNumberLockRemaining(phone) > 0 || isSessionCapReached(phone)) {
            setError(
                `${translate('Wait')} ${getNumberLockRemaining(phone)}s ${translate('before trying again')}`
            );
            return;
        }
        setMethod(selected);
        setError('');
        setBusy(true);
        try {
            await AuthService.SendOtp(phone, selected === 'whatsapp' ? 1 : 0, () => {});
            setPin('');
            setIsValidPin('');
            setBusy(false);
            setStep('enter-pin');
        } catch (e) {
            setBusy(false);
            setError(errorText(e));
            LogError({ error: e, scenario: 'Error sending OTP in InlineVerifyPanel' });
        }
    };

    const verify = async (inputPin: string) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            await AuthService.VerifyOtp(inputPin, verficationID as string, '', () => {});
            setIsValidPin('valid');
            setBusy(false);
            setTimeout(onSuccess, 600);
        } catch (e) {
            setBusy(false);
            setIsValidPin('notvalid');
            setError(translate('Please Enter The Correct Code Sent To Your Phone'));
            LogError({ error: e, scenario: 'Error verifying OTP in InlineVerifyPanel' });
            setTimeout(() => {
                setIsValidPin('');
                setPin('');
            }, 1500);
        }
    };

    const methodButton = (kind: 'whatsapp' | 'sms', label: string, icon: string) => (
        <button
            onClick={() => send(kind)}
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
                        onComplete={verify}
                        disabled={busy || isValidPin === 'valid'}
                        isValidPin={isValidPin}
                        autoFocus={false}
                    />
                    <button
                        onClick={() => method && send(method)}
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
