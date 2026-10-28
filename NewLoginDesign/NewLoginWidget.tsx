'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Page from 'scaling/Page';
import { usePageDir } from 'components/DemoApp1/rtl';
import 'public/styles/rdb-auth.css';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { fetchStoriesForUser } from 'serverRequests';
import { LogError, translateFunction } from 'utils/functions';
import { GAevent } from 'utils/gtag';
import {
    GA_AUTH_SCREEN,
    GA_BUTTONS_NAMES,
    GA_EVENT_NAMES,
    GA_EXCEPTIONS_DESCRIPTIONS,
} from 'utils/GAEvents';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';
import { LOGIN_RETURN_PARAM, safeReturnPath } from 'utils/loginPath';
// The cap's size lives with the shared verify flow, so every copy of the
// counter agrees on the number.
import { MAX_VERIFY_ATTEMPTS } from 'components/Login/Enhanced/usePhoneVerifyFlow';
import { LogoAnimationProvider } from './LogoAnimationContext';
import AuthLogoLayer from './AuthLogoLayer';
import { DEFAULT_LOGO_CONFIG } from './logoScreenConfig';
import type { LogoSlotId } from './logoScreenConfig';

// New Screens in NewLoginDesign
import QuickPreviewScreen, { QUICK_PREVIEW_MAX_DEFICIT } from './QuickPreviewScreen';
import NewGetStartedScreen from './NewGetStartedScreen';
import NewTermsScreen from './NewTermsScreen';
import NewEnterPhoneScreen from './NewEnterPhoneScreen';
import NewSelectMethodScreen from './NewSelectMethodScreen';
import NewEnterPinScreen from './NewEnterPinScreen';
import NewNotFoundScreen from './NewNotFoundScreen';
import NewAlreadyExistScreen from './NewAlreadyExistScreen';
import NewInputNameScreen from './NewInputNameScreen';
import NewSuccessScreen, { SUCCESS_BG } from './NewSuccessScreen';
import QrBottomSheet from './QrBottomSheet';

export type AuthStep =
    | 'quick-preview'
    | 'get-started'
    | 'terms'
    | 'enter-phone'
    | 'select-method'
    | 'enter-pin'
    | 'already-registered'
    | 'not-registered'
    | 'input-name'
    | 'login-success'
    | 'signup-success'
    | 'qr-login';

const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/**
 * The badge mark's colour, per step.
 *
 * Purple is the flow colour and covers every screen that does not say
 * otherwise. The three outcome screens each have their own, and each one
 * matches the background that screen paints.
 */
const LOGO_PURPLE = { dot: 'purple', ring: '#402CDD' };
const STEP_LOGO_COLOR: Partial<Record<AuthStep, { dot: string; ring: string }>> = {
    // XD recolours the ring and the two eye dots on their own. On "not
    // registered" only the dots turn amber — the ring stays the flow purple.
    'not-registered': { dot: 'orange', ring: '#402CDD' },
    'input-name': { dot: 'green', ring: '#28C452' },
    // The two endings are two screens. Welcome back keeps the purple mark on
    // cream; sign-up done is the green mark on mint. See NewSuccessScreen.
    'login-success': LOGO_PURPLE,
    'signup-success': { dot: 'green', ring: '#28C452' },
};

/**
 * Which logo config a step reads.
 *
 * Both success steps share one entry, because they are one screen in one green
 * (see NewSuccessScreen). The Quick Preview is not here at all: it has two
 * marks and its badge changes job halfway through, so the widget picks its slot
 * from `previewExpanded` below.
 */
const STEP_LOGO_SLOT: Record<AuthStep, LogoSlotId> = {
    'quick-preview': 'quick-preview-badge',
    'get-started': 'get-started',
    terms: 'terms',
    'enter-phone': 'enter-phone',
    'select-method': 'select-method',
    'enter-pin': 'enter-pin',
    'already-registered': 'already-registered',
    'not-registered': 'not-registered',
    'input-name': 'input-name',
    'login-success': 'success',
    'signup-success': 'success',
    'qr-login': 'get-started',
};

// Screen names reported to analytics, as the live widget reports them. The
// Quick Preview has none, as the live splash had none.
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

// Steps the shopper reaches only AFTER the code was accepted. Leaving from one
// of these is not an abandoned login, so it is not reported as a cancel.
const AUTHENTICATED_STEPS: AuthStep[] = [
    'login-success',
    'signup-success',
    'input-name',
    'already-registered',
];

// The backend name is 1 character for placeholder accounts; the live widget
// uses the same `> 1` test to decide whether an account still owes a name.
const hasRealName = (name?: string | null) =>
    typeof name === 'string' && name.trim().length > 1;

interface NewLoginWidgetProps {
    initialStep?: AuthStep;
    /**
     * Called instead of leaving the page, when a host embeds the widget. On the
     * login page (`/[lang]/login`) there is none, and the widget goes back to
     * the page in `?next=` (A-20 in UI-MIGRATION-PLAN.md).
     */
    onFinish?: () => void;
}

export default function NewLoginWidget({
    initialStep = 'quick-preview',
    onFinish,
}: NewLoginWidgetProps) {
    const { lang } = useParams();
    const router = useRouter();
    const langSegment = typeof lang === 'string' ? lang : 'sy-en';
    const [country] = langSegment.split('-');
    const langCode = langSegment.split('-')[1] || 'en';
    const translate = (key: string) => translateFunction(key, langCode);
    const pageDir = usePageDir();
    /** The side a next screen comes in from: the right, or the left on a right-to-left page. */
    const side = pageDir === 'rtl' ? -1 : 1;
    const { verficationID, language, setStoryData } = useAppStore();

    const [step, setStep] = useState<AuthStep>(initialStep);
    const [direction, setDirection] = useState<number>(1);
    const [authType, setAuthType] = useState<'signIn' | 'signUp'>('signUp');
    const [phone, setPhone] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('');
    const [pin, setPin] = useState<string>('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [loading, setLoading] = useState<
        'send-phone' | 'send-pin' | 'resend-pin' | 'verify-pin' | ''
    >('');
    const [savingName, setSavingName] = useState(false);
    const [error, setError] = useState<string>('');
    // Wrong codes since the last code arrived; the boxes lock at
    // MAX_VERIFY_ATTEMPTS. State, not a ref: the boxes and the "tries left"
    // line are drawn from it.
    const [wrongCodes, setWrongCodes] = useState(0);
    // Every check, the good one included, for the analytics `attempts` field.
    // Not the cap's counter: keep the two apart, as the live widget does.
    const attemptsRef = useRef(0);
    // The boxes can report a finished code twice in one tick, and each extra
    // check spends a try on the server.
    const verifyingRef = useRef(false);

    // `mission_name` / `context` in the analytics: "login" or "signup".
    const mission = authType === 'signIn' ? 'login' : 'signup';
    const methodLabel = method === 'whatsapp' ? 'whatsapp' : 'sms';

    /** One entry per logo in the flow: the design's picks (DEFAULT_LOGO_CONFIG). */
    const logoConfig = DEFAULT_LOGO_CONFIG;
    /**
     * true once the Quick Preview column has lifted, so the badge there can
     * change job without the screen having to know about logo config at all.
     */
    const [previewExpanded, setPreviewExpanded] = useState<boolean>(false);
    const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

    /** The box the screens slide inside. `AuthLogoLayer` measures against it. */
    const stageRef = useRef<HTMLDivElement>(null);

    const goTo = (nextStep: AuthStep, dir: number = 1) => {
        setDirection(dir);
        setError('');
        setStep(nextStep);
        // Walking back to the Quick Preview restarts its 8 second timer, so the
        // badge has to go back to its first job as well.
        if (nextStep === 'quick-preview') setPreviewExpanded(false);
    };

    // One screen_view per step, as the live widget sends.
    useEffect(() => {
        const screenName = SCREEN_NAMES[step];
        if (!screenName) return;
        GAevent({
            action: GA_EVENT_NAMES.SCREEN_VIEW,
            params: { screen_name: screenName, screen_path: window.location.pathname },
        });
    }, [step]);

    /**
     * Leaves the login: back to the page in `?next=`, or the home page when
     * there is none (A-20). A host that embeds the widget gets `onFinish`.
     */
    const leave = () => {
        if (onFinish) {
            onFinish();
            return;
        }
        const next = new URLSearchParams(window.location.search).get(LOGIN_RETURN_PARAM);
        router.replace(safeReturnPath(next, langSegment));
    };

    /** Leaving before the code was accepted = an abandoned login or sign-up. */
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
        leave();
    };

    /** The "Later, take a look" links: a chosen skip, not a close. */
    const handleLater = () => {
        GAevent({
            action: GA_EVENT_NAMES.LATER_TAKE_LOOK_CLICKED,
            params: {
                screen_name: SCREEN_NAMES[step] || '',
                screen_path: window.location.pathname,
                button_name: GA_BUTTONS_NAMES.LATER_TAKE_LOOK_BUTTON,
            },
        });
        leave();
    };

    /**
     * A failed request carries a backend message (already in the shopper's
     * language) or nothing useful: fall back to a translated line rather than
     * "undefined" or an internal string.
     */
    const errorText = (e: unknown, fallbackKey = 'Something went wrong') => {
        const message = e instanceof Error ? e.message : '';
        const useful = message && message !== 'Wrong Code' && message !== 'user not found';
        return useful ? message : translate(fallbackKey);
    };

    /**
     * The words for a failed send. A send the limiter blocked has already armed
     * the cooldown (`utils/otpLocks`), and the screens draw a live countdown from
     * it, so the server's fixed "Please wait N seconds" is dropped.
     */
    const sendErrorText = (e: unknown) => (getNumberLockRemaining(phone) > 0 ? '' : errorText(e));

    /**
     * Brings back what was drawn for the guest: `router.refresh()` drops the
     * router's cached pages, so the page in `?next=` is fetched again with the
     * new session, and the story rail gets the shopper's stories.
     */
    const refreshAfterAuth = async () => {
        try {
            router.refresh();
            const storiesData = await fetchStoriesForUser(language, country, 1);
            if (storiesData?.data) setStoryData(storiesData.data);
        } catch (e) {
            LogError({ error: e, scenario: 'Error refreshing stories after auth in NewLoginWidget' });
        }
    };

    const handleSendPhone = (enteredPhone: string) => {
        if (!enteredPhone || loading) return;
        setPhone(enteredPhone);
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
        // The screen draws its own cooldown / cap message, so a silent return
        // still leaves the shopper with an explanation on screen.
        if (getNumberLockRemaining(phone) > 0 || isSessionCapReached(phone)) return;

        setMethod(selectedMethod);
        setError('');
        setLoading('send-pin');
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
            // Throws on any failure (our own rate limiter included), so what
            // follows runs only when a code really went out.
            await AuthService.SendOtp(phone, selectedMethod === 'whatsapp' ? 1 : 0, () => {});
            attemptsRef.current = 0;
            setWrongCodes(0);
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
            LogError({ error: e, scenario: 'Error in handleSelectMethod in NewLoginWidget' });
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
            const [alreadyExists, userName] = await AuthService.VerifyOtp(inputPin, verficationID);
            setIsValidPin('valid');
            if (hasRealName(userName)) setName(userName);

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
                action: authType === 'signIn' ? GA_EVENT_NAMES.LOGIN : GA_EVENT_NAMES.SIGN_UP,
                params: { method_otp: 'phone', success: true },
            });

            refreshAfterAuth();

            setTimeout(() => {
                setLoading('');
                if (authType === 'signUp') {
                    // An account that already has a name is a real "you are
                    // already registered"; one with no name still owes the name.
                    if (alreadyExists && hasRealName(userName)) goTo('already-registered', 1);
                    else goTo('input-name', 1);
                } else if (!alreadyExists) {
                    goTo('not-registered', 1);
                } else if (!hasRealName(userName)) {
                    // A-22: the name first, then "Welcome back".
                    goTo('input-name', 1);
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
                action: authType === 'signIn' ? GA_EVENT_NAMES.LOGIN : GA_EVENT_NAMES.SIGN_UP,
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
            LogError({ error: e, scenario: 'Error in handleVerifyPin in NewLoginWidget' });

            // The number has no account: its own screen, not a wrong-code retry.
            if (e instanceof Error && e.message === 'user not found') {
                setIsValidPin('');
                setPin('');
                goTo('not-registered', 1);
                return;
            }

            const isWrongCode =
                !(e as { isServerError?: boolean })?.isServerError &&
                e instanceof Error &&
                (e.message === 'Wrong Code' || e.message.toLowerCase().includes('wrong code'));

            if (isWrongCode) {
                const next = wrongCodes + 1;
                setWrongCodes(next);
                setIsValidPin('notvalid');
                setError(
                    next >= MAX_VERIFY_ATTEMPTS
                        ? translate('Too many wrong codes. Ask for a new code.')
                        : `${translate('Please Enter The Correct Code Sent To Your Phone')} — ${translate('Tries left')}: ${MAX_VERIFY_ATTEMPTS - next}`,
                );
                setTimeout(() => {
                    setIsValidPin('');
                    setPin('');
                }, 1500);
            } else {
                // A server, network or timeout error: clear the boxes, spend no
                // try, and show what went wrong.
                setIsValidPin('');
                setPin('');
                setError(errorText(e));
            }
        } finally {
            // Free again once the request has settled, so a retry is not blocked.
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
            setWrongCodes(0);
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
            LogError({ error: e, scenario: 'Error in handleResendOtp in NewLoginWidget' });
        }
    };

    const handleNameSubmit = async (enteredName: string) => {
        if (savingName) return;
        setName(enteredName);
        setSavingName(true);
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
            // The account exists either way; the shopper is not trapped here.
            LogError({ error: e, scenario: 'Error in handleNameSubmit in NewLoginWidget' });
        }
        setSavingName(false);
        goTo(authType === 'signUp' ? 'signup-success' : 'login-success', 1);
    };

    const handleBack = () => {
        if (step === 'enter-pin') goTo('select-method', -1);
        else if (step === 'select-method') goTo('enter-phone', -1);
        else if (step === 'enter-phone') goTo(authType === 'signUp' ? 'terms' : 'get-started', -1);
        else if (step === 'terms') goTo('get-started', -1);
        else if (step === 'get-started') goTo('quick-preview', -1);
        else if (step === 'qr-login') goTo('get-started', -1);
        else if (step === 'already-registered' || step === 'not-registered') goTo('enter-phone', -1);
        else handleClose();
    };

    // Full viewport background color matching live scaling system
    const getScreenBg = (): string => {
        if (step === 'not-registered') return '#FFF9F0';
        if (step === 'already-registered') return '#F4F8FF';
        if (step === 'input-name') return '#F4FFF4';
        if (step === 'login-success') return SUCCESS_BG.login;
        if (step === 'signup-success') return SUCCESS_BG.signup;
        return '#FFFFFF';
    };

    const logoColor = STEP_LOGO_COLOR[step] ?? LOGO_PURPLE;
    const logoSlotId: LogoSlotId =
        step === 'quick-preview' && previewExpanded
            ? 'quick-preview-badge-expanded'
            : STEP_LOGO_SLOT[step];
    const activeSlot = logoConfig[logoSlotId];

    return (
        // A shopper who turned motion off gets a still logo and screens that do
        // not slide (decided in Stage 1 of UI-MIGRATION-PLAN.md). The provider's
        // own animation is only a fallback: each logo gets its pattern from its
        // slot config.
        <MotionConfig reducedMotion="user">
        <LogoAnimationProvider>
            <main
                data-pw="new-login-widget"
                dir={pageDir}
                className="fixed inset-0 z-[99999999999] w-full h-dvh overflow-hidden font-quicksand transition-colors duration-300"
                style={{ backgroundColor: getScreenBg() }}
            >
            <Page
                variant="scaled"
                maxDeficit={step === 'quick-preview' ? QUICK_PREVIEW_MAX_DEFICIT : undefined}
                outerBg={
                    step === 'input-name'
                        ? 'passcode'
                        : step === 'already-registered'
                          ? 'already-registered'
                          : step === 'not-registered'
                            ? 'not-registered'
                            : step === 'login-success'
                              ? 'login-success'
                              : step === 'signup-success'
                                ? 'signup-success'
                                : undefined
                }
            >
                <div
                    ref={stageRef}
                    /**
                     * Never let the stage scroll, and put it back if it does.
                     *
                     * `overflow: hidden` stops the *user* scrolling. It does not
                     * stop the browser: the box is still a scroll container, and
                     * anything that focuses an element inside a screen that is
                     * still slid off to the right makes the browser scroll this
                     * box to reveal it. Every child then shifts sideways —
                     * including the logo, which belongs to the frame and not to
                     * any screen, so it flew in from the left edge.
                     *
                     * The two things that did it now focus with `preventScroll`,
                     * which is the real fix. This stays as the guard, because the
                     * next focusable thing added to any screen would otherwise
                     * bring the fault straight back, and it would look like a
                     * logo bug rather than a focus one.
                     */
                    onScroll={(event) => {
                        event.currentTarget.scrollLeft = 0;
                        event.currentTarget.scrollTop = 0;
                    }}
                    className="w-full h-full relative overflow-hidden"
                >
                    {/*
                      * Both screens are on stage at once — no `mode="wait"`.
                      * The old screen has to stay until the new one has laid
                      * out, because that is what lets `AuthLogoLayer` measure
                      * the incoming logo slot and start the mark travelling on
                      * the same frame the content starts sliding. It also makes
                      * the slide read as one pager instead of two moves with a
                      * blank gap between them.
                      */}
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={step}
                            data-auth-step={step}
                            custom={direction}
                            initial={{ x: direction * side > 0 ? '100%' : '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction * side > 0 ? '-100%' : '100%', opacity: 0 }}
                            transition={transition}
                            className="absolute inset-0 w-full h-full"
                        >
                            {/* 1. Quick Preview Screen */}
                            {step === 'quick-preview' && (
                                <QuickPreviewScreen
                                    onComplete={() => goTo('get-started', 1)}
                                    onExpand={() => setPreviewExpanded(true)}
                                    wordmarkSlot={logoConfig['quick-preview-wordmark']}
                                    lang={langCode}
                                    // Fixed at 0: this is how the client approved the screen on /loginDemo
                                    // (the screen's own defaults would be 35 and 56). Decided in Stage 1.
                                    belowButtonMin={0}
                                    abovePill={0}
                                />
                            )}

                            {/* 2. Get Started Screen (matches live flow layout) */}
                            {step === 'get-started' && (
                                <NewGetStartedScreen
                                    onExistingAccount={() => {
                                        GAevent({
                                            action: GA_EVENT_NAMES.LOGIN_START,
                                            params: {
                                                method_otp: 'phone',
                                                button_name: GA_BUTTONS_NAMES.I_HAVE_ALREADY_ACCOUNT_BUTTON,
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
                                                button_name: GA_BUTTONS_NAMES.CREATE_NEW_ACCOUNT_BUTTON,
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
                                                button_name: GA_BUTTONS_NAMES.LOGIN_METHOD_QR_BUTTON,
                                            },
                                        });
                                        // The QR is a sheet here, not a step, so its
                                        // screen_view is sent when it opens.
                                        GAevent({
                                            action: GA_EVENT_NAMES.SCREEN_VIEW,
                                            params: {
                                                screen_name: GA_AUTH_SCREEN.QR_LOGIN_SCREEN,
                                                screen_path: window.location.pathname,
                                            },
                                        });
                                        setIsQrOpen(true);
                                    }}
                                    lang={langCode}
                                />
                            )}

                            {/* 3. Terms Screen */}
                            {step === 'terms' && (
                                <NewTermsScreen
                                    onAgree={() => goTo('enter-phone', 1)}
                                    onLater={() => goTo('get-started', -1)}
                                    lang={langCode}
                                />
                            )}

                            {/* 4. Phone Input Screen */}
                            {step === 'enter-phone' && (
                                <NewEnterPhoneScreen
                                    authType={authType}
                                    phone={phone}
                                    setPhone={setPhone}
                                    onSubmit={handleSendPhone}
                                    loading={loading === 'send-phone'}
                                    error={error}
                                    lang={langCode}
                                    onClose={handleBack}
                                />
                            )}

                            {/* 5. Method Selection Screen */}
                            {step === 'select-method' && (
                                <NewSelectMethodScreen
                                    phone={phone}
                                    method={method}
                                    setMethod={handleSelectMethod}
                                    changeNumber={() => goTo('enter-phone', -1)}
                                    loading={loading === 'send-pin'}
                                    error={error}
                                    lang={langCode}
                                    authType={authType}
                                    onClose={handleBack}
                                />
                            )}

                            {/* 6. OTP Pin Screen */}
                            {step === 'enter-pin' && (
                                <NewEnterPinScreen
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
                                            params: { method: methodLabel, mission_name: mission },
                                        })
                                    }
                                    changeMethod={() => goTo('select-method', -1)}
                                    changeNumber={() => goTo('enter-phone', -1)}
                                    isValidPin={isValidPin}
                                    attemptsLocked={wrongCodes >= MAX_VERIFY_ATTEMPTS}
                                    loading={loading}
                                    error={error}
                                    lang={langCode}
                                    onClose={handleBack}
                                />
                            )}

                            {/* 7. User Not Found Screen */}
                            {step === 'not-registered' && (
                                <NewNotFoundScreen
                                    phone={phone}
                                    onCreateAccount={() => {
                                        setAuthType('signUp');
                                        goTo('input-name', 1);
                                    }}
                                    // "Cancel & take a look at the app": the code was
                                    // already accepted, so the shopper leaves signed in.
                                    onCancel={handleLater}
                                    onClose={handleBack}
                                    lang={langCode}
                                />
                            )}

                            {/* 8. User Already Exists Screen */}
                            {step === 'already-registered' && (
                                <NewAlreadyExistScreen
                                    phone={phone}
                                    // The code was already accepted, so this account is
                                    // signed in: just finish.
                                    onLogIn={() => {
                                        setAuthType('signIn');
                                        goTo('login-success', 1);
                                    }}
                                    onCancel={handleLater}
                                    onClose={handleBack}
                                    lang={langCode}
                                />
                            )}

                            {/* 9. Name Input Screen */}
                            {step === 'input-name' && (
                                <NewInputNameScreen
                                    name={name}
                                    setName={setName}
                                    onSubmit={handleNameSubmit}
                                    loading={savingName}
                                    lang={langCode}
                                />
                            )}

                            {/* 10. Success Screens */}
                            {(step === 'login-success' || step === 'signup-success') && (
                                <NewSuccessScreen
                                    variant={step === 'login-success' ? 'login' : 'signup'}
                                    name={name}
                                    // The end of the flow: back to the page the
                                    // shopper left (A-20).
                                    onDone={leave}
                                    delayMs={2500}
                                    lang={langCode}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/*
                      * The one badge mark, above every screen and outside the
                      * slider. It moves twice in the whole flow and is still
                      * for the rest of it — see AUTH_LOGO_STOP in AuthLogoSlot.
                      *
                      * `live` is the Quick Preview only. That screen lifts its
                      * whole column off the bottom edge and the mark rides up
                      * with it, so the mark has to be locked to the slot frame
                      * by frame there. Everywhere else the slot is still, and
                      * the mark springs to it.
                      */}
                    <AuthLogoLayer
                        stageRef={stageRef}
                        step={step}
                        live={step === 'quick-preview'}
                        dotColor={logoColor.dot}
                        ringColor={logoColor.ring}
                        slot={activeSlot}
                    />

                    {/* QR Bottom Sheet Modal (slides up over GetStarted) */}
                    <QrBottomSheet
                        isOpen={isQrOpen}
                        onClose={() => setIsQrOpen(false)}
                        lang={langCode}
                    />
                </div>
            </Page>
        </main>
        </LogoAnimationProvider>
        </MotionConfig>
    );
}
