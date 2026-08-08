'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { LogError } from 'utils/functions';
import Page from 'scaling/Page';

import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';

// Screens

import GetStartedScreen from './screens/GetStartedScreen';
import TermsScreen from './screens/TermsScreen';
import EnterPhoneScreen from './screens/EnterPhoneScreen';
import SelectMethodScreen from './screens/SelectMethodScreen';
import EnterPinScreen from './screens/EnterPinScreen';
import AlreadyExistScreen from './screens/AlreadyExistScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import AuthSuccessScreen from './screens/AuthSuccessScreen';
import InputNameScreen from './screens/InputNameScreen';
import QrLoginScreen from './screens/QrLoginScreen';
import SplashScreen from './screens/SplashScreen';

type AuthStep =
    | 'splash'
    | 'get-started'
    | 'terms'
    | 'enter-phone'
    | 'select-method'
    | 'enter-pin'
    | 'already-registered'
    | 'not-registered'
    | 'login-success'
    | 'signup-success'
    | 'input-name'
    | 'qr-login';

const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

export default function EnhancedLoginWidget() {
    const { lang } = useParams();
    const { loginOpen, setLoginOpen, verficationID } = useAppStore();

    const langCode = typeof lang === 'string' ? lang.split('-')[1] : 'en';

    const [step, setStep] = useState<AuthStep>('get-started');
    const [direction, setDirection] = useState(1);

    const [authType, setAuthType] = useState<'signIn' | 'signUp'>('signUp');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [loading, setLoading] = useState<
        'send-phone' | 'send-pin' | 'resend-pin' | 'verify-pin' | ''
    >('');

    const goTo = (nextStep: AuthStep, dir = 1) => {
        setDirection(dir);
        setStep(nextStep);
    };

    const close = () => {
        setLoginOpen(false);
    };

    const handleBack = () => {
        if (step === 'terms') {
            goTo('get-started', -1);
        } else if (step === 'enter-phone') {
            if (authType === 'signUp') {
                goTo('terms', -1);
            } else {
                goTo('get-started', -1);
            }
        } else if (step === 'select-method') {
            goTo('enter-phone', -1);
        } else if (step === 'enter-pin') {
            goTo('select-method', -1);
        } else if (step === 'already-registered' || step === 'not-registered') {
            goTo('enter-phone', -1);
        } else if (step === 'qr-login') {
            goTo('get-started', -1);
        } else {
            close();
        }
    };

    if (!loginOpen) return null;

    const handleSendPhone = () => {
        if (!phone) return;
        setLoading('send-phone');
        setTimeout(() => {
            setLoading('');
            goTo('select-method', 1);
        }, 300);
    };

    const handleSelectMethod = async (selectedMethod: 'sms' | 'whatsapp') => {
        if (getNumberLockRemaining(phone) > 0 || isSessionCapReached(phone)) return;
        setMethod(selectedMethod);
        setLoading('send-pin');
        const isViaWhatsapp = selectedMethod === 'whatsapp' ? 1 : 0;

        try {
            let isError = false;
            let errorMsg = '';

            await AuthService.SendOtp(phone, isViaWhatsapp, (err: any) => {
                isError = true;
                errorMsg = err?.message || 'Error sending OTP';
            });

            setLoading('');
            if (!isError) {
                setPin('');
                goTo('enter-pin', 1);
            } else {
                if (errorMsg.includes('already') || errorMsg.includes('exist')) {
                    goTo('already-registered', 1);
                } else if (errorMsg.includes('not found') || errorMsg.includes('registered')) {
                    goTo('not-registered', 1);
                }
            }
        } catch (error) {
            setLoading('');
            LogError({ error, scenario: 'Error in handleSelectMethod in EnhancedLoginWidget' });
        }
    };

    const handleVerifyPin = async (inputPin: string) => {
        setLoading('verify-pin');
        try {
            let isSuccess = false;

            await AuthService.VerifyOtp(inputPin, verficationID, name, () => {});
            isSuccess = true;

            if (isSuccess) {
                setIsValidPin('valid');
                setTimeout(() => {
                    setLoading('');
                    if (authType === 'signUp') {
                        goTo('signup-success', 1);
                    } else {
                        goTo('login-success', 1);
                    }
                }, 1000);
            } else {
                setIsValidPin('notvalid');
                setLoading('');
                setTimeout(() => {
                    setIsValidPin('');
                    setPin('');
                }, 1500);
            }
        } catch (error) {
            setIsValidPin('notvalid');
            setLoading('');
            setTimeout(() => {
                setIsValidPin('');
                setPin('');
            }, 1500);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || !method || getNumberLockRemaining(phone) > 0) return;
        setLoading('resend-pin');
        const isViaWhatsapp = method === 'whatsapp' ? 1 : 0;
        try {
            await AuthService.SendOtp(phone, isViaWhatsapp, () => {});
            setLoading('');
        } catch (error) {
            setLoading('');
        }
    };

    const handleAfterSuccess = () => {
        if (step === 'signup-success') {
            goTo('input-name', 1);
        } else {
            close();
        }
    };

    const handleNameSubmit = async (enteredName: string) => {
        setName(enteredName);
        try {
            await AuthService.UpdateName(enteredName);
        } catch (e) {}
        close();
    };

    const getScreenBg = () => {
        if (step === 'already-registered') return '#F4F8FF';
        if (step === 'not-registered') return '#FFF9F0';
        if (step === 'input-name') return '#F4FFF4';
        if (step === 'login-success' || step === 'signup-success') return '#E0FFEE';
        return '#FFFFFF';
    };

    return (
        <main
            className="fixed inset-0 z-[99999] w-full h-dvh flex items-center justify-center font-quicksand transition-colors duration-500"
            style={{ backgroundColor: getScreenBg() }}
        >
            <div className="w-full max-w-[430px] h-[90vh] max-h-[880px] bg-white rounded-[32px] overflow-hidden relative shadow-2xl">
                <Page
                    variant="scaled"
                    outerBg={
                        step === 'input-name'
                            ? 'passcode'
                            : step === 'already-registered'
                              ? 'already-registered'
                              : step === 'not-registered'
                                ? 'not-registered'
                                : step === 'login-success' || step === 'signup-success'
                                  ? 'login-success'
                                  : undefined
                    }
                >
                    <div className="w-full h-full relative overflow-hidden bg-white">
                        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                            <motion.div
                                key={step}
                                custom={direction}
                                initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
                                transition={transition}
                                className="absolute inset-0 w-full h-full"
                            >
                                {step === 'splash' && (
                                    <SplashScreen
                                        onFinish={() => goTo('get-started', 1)}
                                        lang={langCode}
                                        variant="floated"
                                    />
                                )}

                                {step === 'get-started' && (
                                    <GetStartedScreen
                                        onExistingAccount={() => {
                                            setAuthType('signIn');
                                            goTo('enter-phone', 1);
                                        }}
                                        onNewCustomer={() => {
                                            setAuthType('signUp');
                                            goTo('terms', 1);
                                        }}
                                        onLater={close}
                                        onScanQr={() => {
                                            goTo('qr-login', 1);
                                        }}
                                        lang={langCode}
                                        variant="floated"
                                    />
                                )}

                                {step === 'terms' && (
                                    <TermsScreen
                                        onAgree={() => goTo('enter-phone', 1)}
                                        onLater={close}
                                        lang={langCode}
                                        variant="floated"
                                    />
                                )}

                                {step === 'enter-phone' && (
                                    <EnterPhoneScreen
                                        authType={authType}
                                        phone={phone}
                                        setPhone={setPhone}
                                        onSubmit={handleSendPhone}
                                        loading={loading === 'send-phone'}
                                        variant="floated"
                                        lang={langCode}
                                        onClose={handleBack}
                                    />
                                )}

                                {step === 'select-method' && (
                                    <SelectMethodScreen
                                        phone={phone}
                                        method={method}
                                        setMethod={handleSelectMethod}
                                        changeNumber={() => goTo('enter-phone', -1)}
                                        loading={loading === 'send-pin'}
                                        variant="floated"
                                        lang={langCode}
                                        authType={authType}
                                        onClose={handleBack}
                                    />
                                )}

                                {step === 'enter-pin' && (
                                    <EnterPinScreen
                                        phone={phone}
                                        method={method}
                                        pin={pin}
                                        authType={authType}
                                        setPin={setPin}
                                        onSubmit={handleVerifyPin}
                                        onResend={handleResendOtp}
                                        changeMethod={() => goTo('select-method', -1)}
                                        changeNumber={() => goTo('enter-phone', -1)}
                                        isValidPin={isValidPin}
                                        loading={loading}
                                        variant="floated"
                                        lang={langCode}
                                        onClose={handleBack}
                                    />
                                )}

                                {step === 'already-registered' && (
                                    <AlreadyExistScreen
                                        phone={phone}
                                        onLogIn={() => {
                                            setAuthType('signIn');
                                            goTo('select-method', 1);
                                        }}
                                        onChangeNumber={close}
                                        onClose={handleBack}
                                        variant="floated"
                                        lang={langCode}
                                    />
                                )}

                                {step === 'not-registered' && (
                                    <NotFoundScreen
                                        phone={phone}
                                        onCreateAccount={() => {
                                            setAuthType('signUp');
                                            goTo('terms', 1);
                                        }}
                                        onChangeNumber={close}
                                        onClose={handleBack}
                                        variant="floated"
                                        lang={langCode}
                                    />
                                )}

                                {(step === 'login-success' || step === 'signup-success') && (
                                    <AuthSuccessScreen
                                        variant={step === 'login-success' ? 'login' : 'signup'}
                                        onDone={handleAfterSuccess}
                                        delayMs={1500}
                                        lang={langCode}
                                    />
                                )}

                                {step === 'input-name' && (
                                    <InputNameScreen
                                        name={name}
                                        setName={setName}
                                        onSubmit={handleNameSubmit}
                                        variant="floated"
                                        lang={langCode}
                                    />
                                )}

                                {step === 'qr-login' && (
                                    <QrLoginScreen
                                        onClose={handleBack}
                                        onBack={handleBack}
                                        variant="floated"
                                        lang={langCode}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Page>
            </div>
        </main>
    );
}
