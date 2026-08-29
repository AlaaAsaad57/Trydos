'use client';

import React, { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Page from 'scaling/Page';
import 'public/styles/rdb-auth.css';
import {
    LogoAnimationProvider,
    LOGO_ANIMATION_PRESETS,
    DEFAULT_LOGO_ANIMATION,
    DEFAULT_LOGO_DURATION,
    MIN_LOGO_DURATION,
    MAX_LOGO_DURATION,
    clampLogoDuration,
    LogoAnimationType,
} from './LogoAnimationContext';
import AuthLogoLayer from './AuthLogoLayer';

// New Screens in NewLoginDesign
import QuickPreviewScreen from './QuickPreviewScreen';
import NewGetStartedScreen from './NewGetStartedScreen';
import NewTermsScreen from './NewTermsScreen';
import NewEnterPhoneScreen from './NewEnterPhoneScreen';
import NewSelectMethodScreen from './NewSelectMethodScreen';
import NewEnterPinScreen from './NewEnterPinScreen';
import NewNotFoundScreen from './NewNotFoundScreen';
import NewAlreadyExistScreen from './NewAlreadyExistScreen';
import NewInputNameScreen from './NewInputNameScreen';
import NewSuccessScreen from './NewSuccessScreen';
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
    'not-registered': { dot: 'orange', ring: '#FAAA2E' },
    'input-name': { dot: 'green', ring: '#28C452' },
    // Both endings are the same screen in the same green — see NewSuccessScreen.
    'login-success': { dot: 'green', ring: '#28C452' },
    'signup-success': { dot: 'green', ring: '#28C452' },
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

    const [showStepBar, setShowStepBar] = useState<boolean>(false);
    const [showAnimBar, setShowAnimBar] = useState<boolean>(false);
    const [logoAnimation, setLogoAnimation] = useState<LogoAnimationType>(DEFAULT_LOGO_ANIMATION);
    /** Seconds for one loop of the picked pattern. The client sets it below. */
    const [logoDuration, setLogoDuration] = useState<number>(DEFAULT_LOGO_DURATION);
    const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

    /** The box the screens slide inside. `AuthLogoLayer` measures against it. */
    const stageRef = useRef<HTMLDivElement>(null);

    const goTo = (nextStep: AuthStep, dir: number = 1) => {
        setDirection(dir);
        setStep(nextStep);
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
        if (step === 'login-success' || step === 'signup-success') return '#E0FFEE';
        return '#FFFFFF';
    };

    const logoColor = STEP_LOGO_COLOR[step] ?? LOGO_PURPLE;
    const activePreset =
        LOGO_ANIMATION_PRESETS.find((preset) => preset.id === logoAnimation) ??
        LOGO_ANIMATION_PRESETS[0];

    return (
        <LogoAnimationProvider
            animation={logoAnimation}
            setAnimation={setLogoAnimation}
            durationSeconds={logoDuration}
            setDurationSeconds={setLogoDuration}
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
                {/*
                  * Floating demo control bar: the flow steps, the logo motion
                  * picker and how long one loop of it runs.
                  *
                  * It sits over the widget and belongs to the demo route, not
                  * to the design. Nothing here changes a screen's own layout.
                  */}
                <div className="fixed top-3 left-3 z-[999999999999] flex flex-col gap-1.5 items-start font-quicksand select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 1. Flow Steps Toggle Button */}
                        <button
                            onClick={() => {
                                setShowStepBar((prev) => !prev);
                                if (!showStepBar) setShowAnimBar(false);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 hover:bg-white text-gray-800 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                        >
                            <span className="w-2 h-2 rounded-full bg-[#402CDD]" />
                            <span>{showStepBar ? 'Hide Steps' : 'Flow Steps'}</span>
                        </button>

                        {/* 2. Logo Animation Selector Toggle Button */}
                        <button
                            onClick={() => {
                                setShowAnimBar((prev) => !prev);
                                if (!showAnimBar) setShowStepBar(false);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 hover:bg-white text-gray-800 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                        >
                            <span>{activePreset.icon}</span>
                            <span className="text-[#402CDD] font-bold">Anim:</span>
                            <span>{activePreset.shortName}</span>
                            <span className="text-gray-500">{logoDuration}s</span>
                        </button>
                    </div>

                    {/* Step Navigator Strip */}
                    {showStepBar && (
                        <div className="flex items-center gap-1 bg-black/85 backdrop-blur-md p-1.5 rounded-full text-white text-xs max-w-[92vw] overflow-x-auto shadow-lg animate-fade-in">
                            {[
                                { id: 'quick-preview', label: 'Preview' },
                                { id: 'get-started', label: 'Get Started' },
                                { id: 'terms', label: 'Terms' },
                                { id: 'enter-phone', label: 'Phone' },
                                { id: 'select-method', label: 'Method' },
                                { id: 'enter-pin', label: 'OTP/PIN' },
                                { id: 'not-registered', label: 'Not Found' },
                                { id: 'already-registered', label: 'Exist' },
                                { id: 'input-name', label: 'Name' },
                                { id: 'signup-success', label: 'Success' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => goTo(item.id as AuthStep, 1)}
                                    className={`px-2 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                                        step === item.id
                                            ? 'bg-[#402CDD] font-bold text-white shadow'
                                            : 'text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                            <button
                                onClick={() => setIsQrOpen(true)}
                                className="px-2 py-1 rounded-full text-[11px] whitespace-nowrap text-gray-300 hover:bg-white/10 cursor-pointer"
                            >
                                QR BottomSheet
                            </button>
                        </div>
                    )}

                    {/* Logo Animation Options Strip */}
                    {showAnimBar && (
                        <div className="flex flex-col gap-1 bg-black/90 backdrop-blur-md p-2 rounded-2xl text-white text-xs max-w-[92vw] shadow-2xl border border-white/10 animate-fade-in">
                            <div className="flex items-center justify-between pb-1 px-1 border-b border-white/10 text-[11px] text-gray-400">
                                <span className="font-semibold text-white/90">Pick Logo Animation:</span>
                                <span className="text-[10px] text-[#A688FA]">{activePreset.tagline}</span>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                                {LOGO_ANIMATION_PRESETS.map((preset) => {
                                    const isSelected = logoAnimation === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => setLogoAnimation(preset.id)}
                                            className={`px-2.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#402CDD] text-white font-bold shadow-[0_0_12px_rgba(64,44,221,0.6)] ring-1 ring-white/30 scale-[1.02]'
                                                    : 'bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white'
                                            }`}
                                            title={`${preset.description}

Best for: ${preset.bestFor}`}
                                        >
                                            <span className="text-sm">{preset.icon}</span>
                                            <span>{preset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/*
                              * How long one loop takes, in whole seconds.
                              *
                              * Only the length of the loop changes. Each beat
                              * inside a pattern is written as a fraction of the
                              * cycle, so a pattern picked apart at 20 seconds is
                              * the same choreography as at 1 second, played
                              * slower. `none` has no loop, so the control is
                              * disabled there rather than lying about it.
                              */}
                            <div className="flex items-center gap-2 pt-1.5 px-1 border-t border-white/10">
                                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                    Loop length:
                                </span>
                                <input
                                    type="range"
                                    min={MIN_LOGO_DURATION}
                                    max={MAX_LOGO_DURATION}
                                    step={1}
                                    value={logoDuration}
                                    disabled={logoAnimation === 'none'}
                                    onChange={(event) =>
                                        setLogoDuration(clampLogoDuration(Number(event.target.value)))
                                    }
                                    title={`One loop of "${activePreset.label}" takes ${logoDuration} seconds`}
                                    className="flex-1 min-w-[120px] accent-[#402CDD] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                />
                                <input
                                    type="number"
                                    min={MIN_LOGO_DURATION}
                                    max={MAX_LOGO_DURATION}
                                    step={1}
                                    value={logoDuration}
                                    disabled={logoAnimation === 'none'}
                                    onChange={(event) =>
                                        setLogoDuration(clampLogoDuration(Number(event.target.value)))
                                    }
                                    className="w-12 bg-white/10 rounded-md px-1.5 py-0.5 text-[11px] text-center text-white outline-none focus:ring-1 focus:ring-[#402CDD] disabled:opacity-40"
                                />
                                <span className="text-[11px] text-gray-400">s</span>
                                <button
                                    onClick={() => setLogoDuration(DEFAULT_LOGO_DURATION)}
                                    disabled={logoDuration === DEFAULT_LOGO_DURATION}
                                    className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
                                    lang={langCode}
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
