'use client';

import React, { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Page from 'scaling/Page';
import 'public/styles/rdb-auth.css';
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

interface NewLoginWidgetProps {
    initialStep?: AuthStep;
    onFinish?: () => void;
}

export default function NewLoginWidget({
    initialStep = 'quick-preview',
    onFinish,
}: NewLoginWidgetProps) {
    const { lang } = useParams();
    const router = useRouter();
    const langCode = typeof lang === 'string' ? lang.split('-')[1] || 'en' : 'en';

    const [step, setStep] = useState<AuthStep>(initialStep);
    const [direction, setDirection] = useState<number>(1);
    const [authType, setAuthType] = useState<'signIn' | 'signUp'>('signUp');
    const [phone, setPhone] = useState<string>('905528002000');
    const [name, setName] = useState<string>('');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('whatsapp');
    const [pin, setPin] = useState<string>('');
    const [loading, setLoading] = useState<string>('');
    const [error, setError] = useState<string | undefined>(undefined);

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
        setStep(nextStep);
        // Walking back to the Quick Preview restarts its 8 second timer, so the
        // badge has to go back to its first job as well.
        if (nextStep === 'quick-preview') setPreviewExpanded(false);
    };

    const handleBack = () => {
        if (step === 'enter-pin') goTo('select-method', -1);
        else if (step === 'select-method') goTo('enter-phone', -1);
        else if (step === 'enter-phone') goTo(authType === 'signUp' ? 'terms' : 'get-started', -1);
        else if (step === 'terms') goTo('get-started', -1);
        else if (step === 'get-started') goTo('quick-preview', -1);
        else if (step === 'qr-login') goTo('get-started', -1);
        else if (step === 'already-registered' || step === 'not-registered') goTo('enter-phone', -1);
        else if (step === 'input-name') goTo('enter-pin', -1);
        else if (onFinish) onFinish();
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
        <LogoAnimationProvider
            /**
             * Only a fallback now. Every logo on screen is handed its own
             * pattern and its own loop length by its slot config, so nothing
             * reads the provider's animation any more.
             */
            /**
             * Always on here, and only here. Windows and macOS both have a
             * setting that turns animation off system wide, and a good number
             * of machines have it on. The product respects it. This demo exists
             * to be looked at, and it cannot do that job if the machine it is
             * opened on shows a still logo — a picker that shows nothing is not
             * a picker.
             */
            ignoreReducedMotion
        >
            <main
                data-pw="new-login-widget"
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
                            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
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
                                        setAuthType('signIn');
                                        goTo('enter-phone', 1);
                                    }}
                                    onNewCustomer={() => {
                                        setAuthType('signUp');
                                        goTo('terms', 1);
                                    }}
                                    onLater={() => {
                                        if (onFinish) onFinish();
                                        else router.push(`/${langCode}`);
                                    }}
                                    onScanQr={() => setIsQrOpen(true)}
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
                                    onSubmit={(enteredPhone) => {
                                        setPhone(enteredPhone);
                                        goTo('select-method', 1);
                                    }}
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
                                    setMethod={(m) => {
                                        setMethod(m as 'sms' | 'whatsapp');
                                        goTo('enter-pin', 1);
                                    }}
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
                                    onSubmit={() => {
                                        if (authType === 'signUp') {
                                            goTo('input-name', 1);
                                        } else {
                                            goTo('login-success', 1);
                                        }
                                    }}
                                    onResend={() => {}}
                                    changeMethod={() => goTo('select-method', -1)}
                                    changeNumber={() => goTo('enter-phone', -1)}
                                    isValidPin={pin.length === 6 ? 'valid' : ''}
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
                                    onCancel={() => goTo('get-started', -1)}
                                    onClose={handleBack}
                                    lang={langCode}
                                />
                            )}

                            {/* 8. User Already Exists Screen */}
                            {step === 'already-registered' && (
                                <NewAlreadyExistScreen
                                    phone={phone}
                                    onLogIn={() => {
                                        setAuthType('signIn');
                                        goTo('login-success', 1);
                                    }}
                                    onCancel={() => goTo('get-started', -1)}
                                    onClose={handleBack}
                                    lang={langCode}
                                />
                            )}

                            {/* 9. Name Input Screen */}
                            {step === 'input-name' && (
                                <NewInputNameScreen
                                    name={name}
                                    setName={setName}
                                    onSubmit={() => goTo('signup-success', 1)}
                                    lang={langCode}
                                />
                            )}

                            {/* 10. Success Screens */}
                            {(step === 'login-success' || step === 'signup-success') && (
                                <NewSuccessScreen
                                    variant={step === 'login-success' ? 'login' : 'signup'}
                                    name={name}
                                    // The demo stops here. A host that embeds
                                    // the widget still gets its onFinish; on its
                                    // own the screen simply stays put, instead of
                                    // walking off to the home page two and a half
                                    // seconds after you arrive on it.
                                    onDone={onFinish}
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
                        onApproved={(token) => {
                            setIsQrOpen(false);
                            goTo('login-success', 1);
                        }}
                        lang={langCode}
                    />
                </div>
            </Page>
        </main>
        </LogoAnimationProvider>
    );
}
