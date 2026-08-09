'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
// Imported here (not in AuthSections) so it ships with this lazy chunk — the
// `xd-*` utilities it pulls in are used only by these screens.
import 'public/styles/rdb-auth.css';
import { LogError, translateFunction } from 'utils/functions';
import Page from 'scaling/Page';
import SearchParamUpdater from 'components/global/ParamsUpdater';
import { fetchStoriesForUser } from 'serverRequests';
import {
    GA_AUTH_SCREEN,
    GA_BUTTONS_NAMES,
    GA_EVENT_NAMES,
    GA_EXCEPTIONS_DESCRIPTIONS,
} from 'utils/GAEvents';
import { GAevent } from 'utils/gtag';

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

// Screen names reported to analytics. Kept next to the step union so a new step
// can't silently ship without a screen_view.
const SCREEN_NAMES: Partial<Record<AuthStep, string>> = {
    'get-started': GA_AUTH_SCREEN.SELECT_AUTHINTCTION_METHOD_SCREEN,
    terms: GA_AUTH_SCREEN.AGREE_TERMS_SCREEN,
    'enter-phone': GA_AUTH_SCREEN.PHONE_NUMBER_INPUT_SCREEN,
    'select-method': GA_AUTH_SCREEN.OTP_RECEIVING_METHOD_SCREEN,
    'enter-pin': GA_AUTH_SCREEN.OTP_INPUT_SCREEN,
    'already-registered': GA_AUTH_SCREEN.USER_ALREADY_EXISTS_SCREEN,
    'not-registered': GA_AUTH_SCREEN.USER_NOT_FOUND_SCREEN,
    'login-success': GA_AUTH_SCREEN.WELCOME_SCREEN,
    'signup-success': GA_AUTH_SCREEN.WELCOME_SCREEN,
    'input-name': GA_AUTH_SCREEN.USER_NAME_INPUT_SCREEN,
    'qr-login': GA_AUTH_SCREEN.QR_LOGIN_SCREEN,
};

// Steps the user reaches only AFTER the OTP was accepted. Closing from one of
// these is not an abandoned login, so it must not be reported as a cancel.
const AUTHENTICATED_STEPS: AuthStep[] = [
    'login-success',
    'signup-success',
    'input-name',
    'already-registered',
];

// The backend name is 1 char for placeholder accounts; the old widget used the
// same `> 1` test to decide whether a user still owes us a real name.
const hasRealName = (name?: string | null) =>
    typeof name === 'string' && name.trim().length > 1;

export default function FullEnhancedLoginWidget() {
    const { lang } = useParams();
    const router = useRouter();
    const { loginOpen, setLoginOpen, verficationID, language, setStoryData } = useAppStore();
    const [user, setUser] = useState<{ name: string; already_exists: boolean } | null>(null);
    const langParts = typeof lang === 'string' ? lang.split('-') : [];
    const country = langParts[0] || 'gb';
    const langCode = langParts[1] || 'en';
    const translate = (key: string) => translateFunction(key, langCode);

    const [step, setStep] = useState<AuthStep>('get-started');
    const [direction, setDirection] = useState(1);

    const [authType, setAuthType] = useState<'signIn' | 'signUp'>('signUp');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<
        'send-phone' | 'send-pin' | 'resend-pin' | 'verify-pin' | ''
    >('');

    // Read inside async callbacks, so a ref rather than state — the GA payload
    // must carry the attempt number as of the request, not of the last render.
    const attemptsRef = useRef(0);
    // The pin inputs can fire onComplete twice within one tick (before `loading`
    // has re-rendered), and each extra submit burns a server-side attempt.
    const verifyingRef = useRef(false);

    // `mission_name` / `context` in the old widget: "login" or "signup".
    const mission = authType === 'signIn' ? 'login' : 'signup';
    const methodLabel = method === 'whatsapp' ? 'whatsapp' : 'sms';

    const goTo = (nextStep: AuthStep, dir = 1) => {
        setDirection(dir);
        setError('');
        setStep(nextStep);
    };

    // One screen_view per step, mirroring the old stepIndicator effect.
    useEffect(() => {
        const screenName = SCREEN_NAMES[step];
        if (!screenName) return;
        GAevent({
            action: GA_EVENT_NAMES.SCREEN_VIEW,
            params: { screen_name: screenName, screen_path: window.location.pathname },
        });
    }, [step]);

    const close = () => {
        setLoginOpen(false);
    };

    /** Closing before the OTP was accepted = an abandoned login/signup. */
    const handleClose = () => {
        if (!AUTHENTICATED_STEPS.includes(step)) {
            GAevent({
                action:
                    authType === 'signIn'
                        ? GA_EVENT_NAMES.CANCEL_LOGIN
                        : GA_EVENT_NAMES.CANCEL_SIGNUP,
                params: { context: mission, button_name: GA_BUTTONS_NAMES.CLOSE_LOGIN },
            });
        }
        close();
    };

    /** The "Later, take a look" links — a deliberate skip, not a close. */
    const handleLater = () => {
        GAevent({
            action: GA_EVENT_NAMES.LATER_TAKE_LOOK_CLICKED,
            params: {
                screen_name: SCREEN_NAMES[step] || '',
                screen_path: window.location.pathname,
                button_name: GA_BUTTONS_NAMES.LATER_TAKE_LOOK_BUTTON,
            },
        });
        close();
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
            handleClose();
        }
    };

    if (!loginOpen) return null;

    /**
     * A failed request carries either a backend message (already localised by
     * the API) or nothing useful — fall back to a translated generic line
     * rather than showing "undefined" or an internal string.
     */
    const errorText = (e: unknown, fallbackKey = 'Something went wrong') => {
        const message = e instanceof Error ? e.message : '';
        const useful = message && message !== 'Wrong Code' && message !== 'user not found';
        return useful ? message : translate(fallbackKey);
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

    /**
     * Re-sync everything that was rendered for the guest: server components hold
     * the pre-login markup, and the story rail holds the guest's story set.
     */
    const refreshAfterAuth = async () => {
        try {
            router.refresh();
            const storiesData = await fetchStoriesForUser(language, country, 1);
            if (storiesData?.data) setStoryData(storiesData.data);
        } catch (e) {
            LogError({
                error: e,
                scenario: 'Error refreshing stories after auth in FullEnhancedLoginWidget',
            });
        }
    };

    const handleSendPhone = () => {
        if (!phone || loading) return;
        GAevent({
            action: GA_EVENT_NAMES.CONFIRM_PHONE_NUMBER,
            params: {
                input_valid: true,
                mission_name: mission,
                button_name: GA_BUTTONS_NAMES.CONFIRM_PHONE_NUMBER_BUTTON,
            },
        });
        setLoading('send-phone');
        setTimeout(() => {
            setLoading('');
            goTo('select-method', 1);
        }, 300);
    };

    const handleSelectMethod = async (selectedMethod: 'sms' | 'whatsapp') => {
        if (loading) return;
        // The screens render their own cooldown / cap message, so a silent
        // return here still leaves the user with an explanation on screen.
        if (getNumberLockRemaining(phone) > 0 || isSessionCapReached(phone)) return;

        setMethod(selectedMethod);
        setError('');
        setLoading('send-pin');
        const isViaWhatsapp = selectedMethod === 'whatsapp' ? 1 : 0;

        GAevent({
            action: GA_EVENT_NAMES.SEND_OTP,
            params: {
                method: selectedMethod,
                mission_name: mission,
                button_name:
                    selectedMethod === 'whatsapp'
                        ? GA_BUTTONS_NAMES.CHOOSE_WHATSAPP_BUTTON
                        : GA_BUTTONS_NAMES.CHOOSE_SMS_BUTTON,
            },
        });

        try {
            // Throws on any failure (including our own rate limiter), so the
            // success path below runs only when a code really went out.
            await AuthService.SendOtp(phone, isViaWhatsapp, () => {});
            attemptsRef.current = 0;
            setPin('');
            setIsValidPin('');
            setLoading('');
            goTo('enter-pin', 1);
        } catch (e) {
            setLoading('');
            setError(sendErrorText(e));
            GAevent({
                action: GA_EVENT_NAMES.EXCEPTION,
                params: {
                    description: GA_EXCEPTIONS_DESCRIPTIONS.OTP_SEND_FAILED,
                    context: mission,
                    mission_name: mission,
                },
            });
            LogError({
                error: e,
                scenario: 'Error in handleSelectMethod in FullEnhancedLoginWidget',
            });
        }
    };

    const handleVerifyPin = async (inputPin: string) => {
        if (loading || verifyingRef.current) return;
        verifyingRef.current = true;
        attemptsRef.current += 1;
        const attempts = attemptsRef.current;
        setError('');
        setLoading('verify-pin');

        try {
            const [alreadyExists, userName] = await AuthService.VerifyOtp(
                inputPin,
                verficationID,
                '',
                () => {},
            );
            setUser({ name: userName, already_exists: alreadyExists });
            setIsValidPin('valid');

            GAevent({
                action: GA_EVENT_NAMES.VERIFY_OTP,
                params: {
                    method: methodLabel,
                    mission_name: mission,
                    button_name: 'N/A',
                    status: 'success',
                    attempts,
                },
            });
            GAevent({
                action:
                    authType === 'signIn' ? GA_EVENT_NAMES.LOGIN : GA_EVENT_NAMES.SIGN_UP,
                params: { method_otp: 'phone', success: true },
            });

            refreshAfterAuth();

            setTimeout(() => {
                setLoading('');
                if (authType === 'signUp') {
                    // An existing account that already has a name is a genuine
                    // "you're already registered"; one without a name still owes
                    // us the name, so it goes through the normal success path.
                    if (alreadyExists && hasRealName(userName)) {
                        goTo('already-registered', 1);
                    } else {
                        goTo('signup-success', 1);
                    }
                } else if (!alreadyExists) {
                    goTo('not-registered', 1);
                } else {
                    goTo('login-success', 1);
                }
            }, 1000);
        } catch (e) {
            setLoading('');
            GAevent({
                action: GA_EVENT_NAMES.VERIFY_OTP,
                params: {
                    method: methodLabel,
                    mission_name: mission,
                    button_name: 'N/A',
                    status: 'failed',
                    attempts,
                },
            });
            GAevent({
                action:
                    authType === 'signIn' ? GA_EVENT_NAMES.LOGIN : GA_EVENT_NAMES.SIGN_UP,
                params: { method_otp: 'phone', success: false },
            });
            GAevent({
                action: GA_EVENT_NAMES.EXCEPTION,
                params: {
                    description: GA_EXCEPTIONS_DESCRIPTIONS.OTP_INCORRECT,
                    context: mission,
                    mission_name: mission,
                },
            });
            LogError({
                error: e,
                scenario: 'Error in handleVerifyPin in FullEnhancedLoginWidget',
            });

            // The backend tells us the number simply isn't registered — that is
            // its own screen, not a "wrong code" retry.
            if (e instanceof Error && e.message === 'user not found') {
                setIsValidPin('');
                setPin('');
                goTo('not-registered', 1);
                return;
            }

            setIsValidPin('notvalid');
            setError(translate('Please Enter The Correct Code Sent To Your Phone'));
            setTimeout(() => {
                setIsValidPin('');
                setPin('');
            }, 1500);
        } finally {
            // Released once the request has settled: a retry (or a resend that
            // brings the user back to this screen) must not stay blocked.
            verifyingRef.current = false;
        }
    };

    const handleResendOtp = async () => {
        if (!phone || !method || loading) return;
        if (getNumberLockRemaining(phone) > 0) return;

        setError('');
        setLoading('resend-pin');
        GAevent({
            action: GA_EVENT_NAMES.RESEND_OTP,
            params: {
                method: methodLabel,
                attempts: attemptsRef.current,
                mission_name: mission,
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
            GAevent({
                action: GA_EVENT_NAMES.EXCEPTION,
                params: {
                    description: GA_EXCEPTIONS_DESCRIPTIONS.OTP_SEND_FAILED,
                    context: mission,
                    mission_name: mission,
                },
            });
            LogError({
                error: e,
                scenario: 'Error in handleResendOtp in FullEnhancedLoginWidget',
            });
        }
    };

    const handleAfterSuccess = () => {
        // A fresh signup always names the account. A login only needs the name
        // step when the account still hasn't got one.
        if (step === 'signup-success' || !hasRealName(user?.name)) {
            goTo('input-name', 1);
        } else {
            close();
        }
    };

    const handleNameSubmit = async (enteredName: string) => {
        setName(enteredName);
        GAevent({
            action: GA_EVENT_NAMES.CREATE_ACCOUNT_CONTINUE,
            params: {
                method_otp: 'phone',
                name_entered: true,
                button_name: GA_BUTTONS_NAMES.CONFIRM_NAME_BUTTON,
            },
        });
        try {
            await AuthService.UpdateName(enteredName);
        } catch (e) {
            // The account exists either way — don't trap the user on this screen.
            LogError({
                error: e,
                scenario: 'Error in handleNameSubmit in FullEnhancedLoginWidget',
            });
        }
        close();
    };

    /**
     * The phone approved the QR login. `services/qrLogin` is still the
     * localStorage mock, so no session is issued here — re-sync and close so the
     * screen is never a dead end. When the real endpoints land, exchange the
     * request id for a session BEFORE closing.
     */
    const handleQrApproved = () => {
        GAevent({
            action: GA_EVENT_NAMES.LOGIN,
            params: { method_otp: 'qr', success: true },
        });
        refreshAfterAuth();
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
        <>
            {/* Adds ?login=true and a synthetic history entry so a browser/Android
                back press closes the widget instead of navigating the page away. */}
            <SearchParamUpdater searchKey="login" searchValue="true" />
            <main
                className="fixed inset-0 z-[99999999999] w-full h-dvh overflow-hidden font-quicksand transition-all duration-[300]"
                style={{ backgroundColor: getScreenBg() }}
            >
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
                                {step === 'splash' && (
                                    <SplashScreen
                                        onFinish={() => goTo('get-started', 1)}
                                        lang={langCode}
                                        variant="fullscreen"
                                    />
                                )}

                                {step === 'get-started' && (
                                    <GetStartedScreen
                                        onExistingAccount={() => {
                                            GAevent({
                                                action: GA_EVENT_NAMES.LOGIN_START,
                                                params: {
                                                    method_otp: 'phone',
                                                    button_name:
                                                        GA_BUTTONS_NAMES.I_HAVE_ALREADY_ACCOUNT_BUTTON,
                                                },
                                            });
                                            setAuthType('signIn');
                                            goTo('enter-phone', 1);
                                        }}
                                        onNewCustomer={() => {
                                            GAevent({
                                                action: GA_EVENT_NAMES.SIGNUP_START,
                                                params: {
                                                    method_otp: 'phone',
                                                    button_name:
                                                        GA_BUTTONS_NAMES.CREATE_NEW_ACCOUNT_BUTTON,
                                                },
                                            });
                                            setAuthType('signUp');
                                            goTo('terms', 1);
                                        }}
                                        onLater={handleLater}
                                        onScanQr={() => {
                                            GAevent({
                                                action: GA_EVENT_NAMES.LOGIN_START,
                                                params: {
                                                    method_otp: 'qr',
                                                    button_name:
                                                        GA_BUTTONS_NAMES.LOGIN_METHOD_QR_BUTTON,
                                                },
                                            });
                                            goTo('qr-login', 1);
                                        }}
                                        lang={langCode}
                                        variant="fullscreen"
                                    />
                                )}

                                {step === 'terms' && (
                                    <TermsScreen
                                        onAgree={() => goTo('enter-phone', 1)}
                                        onLater={handleLater}
                                        lang={langCode}
                                        variant="fullscreen"
                                    />
                                )}

                                {step === 'enter-phone' && (
                                    <EnterPhoneScreen
                                        authType={authType}
                                        phone={phone}
                                        setPhone={setPhone}
                                        onSubmit={handleSendPhone}
                                        loading={loading === 'send-phone'}
                                        error={error}
                                        variant="fullscreen"
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
                                        error={error}
                                        variant="fullscreen"
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
                                        onTimerExpired={() =>
                                            GAevent({
                                                action: GA_EVENT_NAMES.TIMER_EXPIRED,
                                                params: {
                                                    method: methodLabel,
                                                    mission_name: mission,
                                                },
                                            })
                                        }
                                        changeMethod={() => goTo('select-method', -1)}
                                        changeNumber={() => goTo('enter-phone', -1)}
                                        isValidPin={isValidPin}
                                        loading={loading}
                                        error={error}
                                        variant="fullscreen"
                                        lang={langCode}
                                        onClose={handleBack}
                                    />
                                )}

                                {step === 'already-registered' && (
                                    <AlreadyExistScreen
                                        phone={phone}
                                        // The OTP was already accepted, so this
                                        // account is signed in — just finish.
                                        onLogIn={() => {
                                            setAuthType('signIn');
                                            goTo('login-success', 1);
                                        }}
                                        onCancel={handleLater}
                                        onClose={handleBack}
                                        variant="fullscreen"
                                        lang={langCode}
                                    />
                                )}

                                {step === 'not-registered' && (
                                    <NotFoundScreen
                                        phone={phone}
                                        onCreateAccount={() => {
                                            setAuthType('signUp');
                                            goTo('input-name', 1);
                                        }}
                                        onCancel={handleLater}
                                        onClose={handleBack}
                                        variant="fullscreen"
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
                                        variant="fullscreen"
                                        lang={langCode}
                                    />
                                )}

                                {step === 'qr-login' && (
                                    <QrLoginScreen
                                        onApproved={handleQrApproved}
                                        onClose={handleBack}
                                        onBack={handleBack}
                                        variant="fullscreen"
                                        lang={langCode}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Page>
            </main>
        </>
    );
}
