'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Page from 'scaling/Page';
import 'public/styles/rdb-auth.css';
import { followTopTint, type TintHome } from 'components/DemoApp/topTint';
import { UNDER_BAR, isFloatingBarSafari } from 'components/DemoApp1/demo1Layout';
import { LogoAnimationProvider } from './LogoAnimationContext';
import AuthLogoLayer from './AuthLogoLayer';
import LogoAnimationModal from './LogoAnimationModal';
import DemoDeviceInfoModal from './DemoDeviceInfoModal';
import { DEFAULT_LOGO_CONFIG, cloneLogoConfig } from './logoScreenConfig';
import { AUTH_SLIDE } from './authLayout';
import type { LogoConfig, LogoSlotId } from './logoScreenConfig';

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
    | 'country-picker'
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

const transition = AUTH_SLIDE;

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
    // The picker is the top of the same column, so its badge has the same
    // two jobs (see `opensWithColumn` below).
    'country-picker': 'quick-preview-badge',
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

/**
 * Where the client's picks are kept between visits.
 *
 * The demo exists so a client can sit with it and compare, which takes more
 * than one sitting. Losing every choice on a refresh is what made the old
 * single picker tiring to use.
 */
const STORAGE_KEY = 'trydos.logoDemoConfig';

/**
 * The two steps of the one rising column (QuickPreviewScreen): the country
 * picker, then the Quick Preview. They are one screen on stage, so the pill
 * and the badge at the top stay put between them, and only the part under
 * the badge slides.
 */
const opensWithColumn = (step: AuthStep) => step === 'quick-preview' || step === 'country-picker';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const LOGIN_TINT_HOME: TintHome = { host: () => document.body, rest: null };

/**
 * Design-px y inside the 150 x 150 round badge below which the mark is clipped
 * while waiting at the bottom in iPhone Safari 26.
 *
 * Why 66:
 *  - With the column lowered by `SAFARI_BAND / scale` (QuickPreviewScreen),
 *    Safari's floating bar top edge sits at y = 61 design px of the badge
 *    (showing the exact same 61 design px of dotted ring + eyes above the bar).
 *  - 66 tucks 5 design px of the dotted ring behind the top border of Safari's
 *    floating bar (zero gap), while cutting strictly above the "try" glyphs
 *    (which start at y = 69.367 design px) and 84 design px above the bottom of
 *    the ring — so nothing dark smudges behind the glass URL and nothing pokes
 *    out in the uncovered zone below Safari's floating pill.
 */
export const SAFARI_BADGE_CLIP_DESIGN = 66;

/**
 * Rendered synchronously ahead of `<main>` so on every iOS WebKit frame —
 * including frame 0 of a `<Suspense>` client mount on `/demo` — neither
 * `<main>` nor `#app-outer` is ever `position: fixed`. WebKit's
 * `LocalFrameView::fixedContainerEdges` latches onto any screen-wide `fixed`
 * bottom box it sees even once and covers the band above Safari's floating bar
 * with WKWebView's solid `_bottomColorExtensionView`.
 *
 * Kept at `100dvh` / `overflow: hidden` until `[data-safari-under-bar]` turns
 * on so Chrome on iPhone (`CriOS`) and Safari < 26 look identical to `fixed`.
 */
export const IOS_FRAME0_NO_FIXED_CSS =
    '@supports (-webkit-touch-callout: none){' +
    '[data-pw="new-login-widget"][data-safari-column],' +
    '[data-pw="new-login-widget"][data-safari-column] #app-outer{' +
    'position:absolute!important;bottom:auto!important;' +
    '}}';

/**
 * Active only in iPhone Safari 26+ while `country-picker` or `quick-preview`
 * is on stage (`[data-safari-under-bar]`). Mirrors the proven `/demo` document
 * contract (`DemoApp1/ui.tsx` `Layer` + `ScreenPage`, commit `1dfc910bf`):
 *  1. Full-width document ancestry (`html`, `body`, `.site-container`,
 *     `.main-content`, `demo1-app`, `demo-intro-blank`) is `overflow: visible`,
 *     `#ffffff` white, and `100dvh + UNDER_BAR` tall so WebKit tiles real
 *     document content across `SAFARI_BAND` and under Safari's glass bar.
 *  2. `<main>` runs `UNDER_BAR` past `--app-canvas-height` with `overflow-y:
 *     visible`, and `#master-canvas` + `[data-pw="login-stage"]` drop `contain`,
 *     `isolation` and `overflow: hidden` so `AuthLogoLayer` paints across
 *     `SAFARI_BAND` right up to Safari's bar.
 */
export const SAFARI_BAR_CSS =
    'html:has([data-pw="new-login-widget"][data-safari-under-bar]){overflow-x:visible!important;overflow-y:visible!important;background-color:#ffffff!important;}' +
    `body:has([data-pw="new-login-widget"][data-safari-under-bar]){overflow:visible!important;background-color:#ffffff!important;min-height:calc(100dvh + ${UNDER_BAR}px)!important;}` +
    `body:has([data-pw="new-login-widget"][data-safari-under-bar]) .site-container,body:has([data-pw="new-login-widget"][data-safari-under-bar]) .main-content,body:has([data-pw="new-login-widget"][data-safari-under-bar]) [data-pw="demo1-app"],body:has([data-pw="new-login-widget"][data-safari-under-bar]) [data-pw="demo-intro-blank"]{height:auto!important;min-height:calc(100dvh + ${UNDER_BAR}px)!important;overflow:visible!important;background-color:#ffffff!important;}` +
    'body:has([data-pw="new-login-widget"][data-safari-under-bar]) .home-navbar{display:none!important;}' +
    `[data-pw="new-login-widget"][data-safari-under-bar]{position:absolute!important;inset:auto!important;top:var(--login-safari-top,0px)!important;left:0!important;width:100%!important;height:calc(var(--app-canvas-height, 100dvh) + ${UNDER_BAR}px)!important;overflow-x:hidden!important;overflow-y:visible!important;}` +
    '[data-pw="new-login-widget"][data-safari-under-bar] #app-outer{position:absolute!important;inset:0!important;}' +
    '[data-pw="new-login-widget"][data-safari-under-bar] #master-canvas,[data-pw="new-login-widget"][data-safari-under-bar] [data-pw="login-stage"]{contain:none!important;isolation:auto!important;overflow:visible!important;}';

/** True when `el` scrolls on its own and still has room in the gesture's direction. */
function canScrollBox(el: Element, dx: number, dy: number): boolean {
    const style = getComputedStyle(el);
    const scrolls = (overflow: string) => /auto|scroll/.test(overflow);
    const down = Math.abs(dy) >= Math.abs(dx);
    if (down && scrolls(style.overflowY) && el.scrollHeight > el.clientHeight) {
        if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        if (dy < 0) return el.scrollTop > 0;
        return true;
    }
    if ((!down || dy === 0) && scrolls(style.overflowX) && el.scrollWidth > el.clientWidth) {
        return true;
    }
    return false;
}

/**
 * Read the saved picks, filling in anything the file does not carry.
 *
 * Merging per slot rather than trusting the stored object is what stops an old
 * save, written before a slot existed, from leaving that slot undefined and
 * taking the screen down with it.
 */
function readStoredConfig(): LogoConfig {
    const fresh = cloneLogoConfig(DEFAULT_LOGO_CONFIG);
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return fresh;
        const saved = JSON.parse(raw) as Partial<LogoConfig>;
        for (const key of Object.keys(fresh) as LogoSlotId[]) {
            const slot = saved[key];
            if (slot && Array.isArray(slot.steps) && slot.steps.length > 0) {
                fresh[key] = {
                    steps: slot.steps.map((step) => ({ ...step })),
                    loop: Boolean(slot.loop),
                    animateWord: slot.animateWord,
                };
            }
        }
        return fresh;
    } catch {
        // Nothing readable there. The defaults are always a working answer.
        return fresh;
    }
}

interface NewLoginWidgetProps {
    initialStep?: AuthStep;
    onFinish?: () => void;
    /**
     * With no `onFinish`: the page the flow goes to when it ends ("Later",
     * back from the first screen, or the success screen). The demo's sign-in
     * request sets it, so the shopper comes back to the demo.
     */
    exitTo?: string;
    /** Show the floating demo control bar (Flow Steps, Anim, Gap, i). */
    showControls?: boolean;
    /**
     * The country picker's map and rows, for the `country-picker` step. The
     * host draws them, and calls `onPicked` once a country is chosen; the
     * flow then goes on to the Quick Preview. The demo at /demo sets it.
     */
    countryPicker?: (onPicked: () => void) => React.ReactNode;
}

export default function NewLoginWidget({
    initialStep = 'quick-preview',
    onFinish,
    exitTo,
    showControls = true,
    countryPicker,
}: NewLoginWidgetProps) {
    const { lang } = useParams();
    const router = useRouter();
    const finish = onFinish ?? (exitTo ? () => router.push(exitTo) : undefined);
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
    const [isAnimModalOpen, setIsAnimModalOpen] = useState<boolean>(false);
    /** One entry per logo in the flow. The modal writes it. */
    const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO_CONFIG);
    /**
     * true once the Quick Preview column has lifted, so the badge there can
     * change job without the screen having to know about logo config at all.
     */
    const [previewExpanded, setPreviewExpanded] = useState<boolean>(false);
    const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
    /** Folds the demo bar down to its checkbox, so a screenshot shows the design alone. */
    const [hideMenu, setHideMenu] = useState<boolean>(false);
    /**
     * The floor for the gap under the Quick Preview button on a short page.
     * The client tries values here; the screen's own default is what ships.
     */
    const [belowButtonMin, setBelowButtonMin] = useState<number>(0);
    /**
     * The gap over the Quick Preview pill. 56 in the design; the client can
     * try other values here, and the card gives up whatever this adds.
     */
    const [abovePill, setAbovePill] = useState<number>(0);
    /** The device and window numbers, for a bug report from a phone we cannot see. */
    const [isDeviceInfoOpen, setIsDeviceInfoOpen] = useState<boolean>(false);

    /**
     * Saved picks are read after mount, never during render. The server has no
     * localStorage, so reading it in render would give the two passes different
     * markup and React would throw the whole tree away.
     */
    useEffect(() => {
        setLogoConfig(readStoredConfig());
    }, []);

    const applyLogoConfig = (next: LogoConfig) => {
        setLogoConfig(next);
        setIsAnimModalOpen(false);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Private mode, or a full quota. The picks still apply for now.
        }
    };

    /** The box the screens slide inside. `AuthLogoLayer` measures against it. */
    const stageRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLElement>(null);
    const docRoomRef = useRef<HTMLDivElement>(null);

    const inColumn = opensWithColumn(step);
    const [safariBar, setSafariBar] = useState(false);

    useBrowserLayoutEffect(() => {
        if (isFloatingBarSafari(navigator.userAgent)) {
            setSafariBar(true);
        }
    }, []);

    const safariUnderBar = safariBar && inColumn;

    useBrowserLayoutEffect(() => {
        if (!safariUnderBar) return;
        if (window.scrollY !== 0) window.scrollTo(0, 0);

        // Proven on the client's iPhone (commit 1dfc910bf): on a white screen
        // with no header, Safari 26 still cuts at `window.innerHeight` unless a
        // blended white fixed strip sits at the top (isolating WebKit's root
        // group and repainting fixed container edges with nothing at bottom).
        const topStrip = followTopTint('#ffffff', LOGIN_TINT_HOME, { blend: true });
        topStrip.set(1);

        const sync = () => {
            const y = window.scrollY;
            widgetRef.current?.style.setProperty('--login-safari-top', `${y}px`);
            if (docRoomRef.current) {
                docRoomRef.current.style.height = `${y + window.innerHeight + UNDER_BAR}px`;
            }
        };
        sync();

        const html = document.documentElement;
        const prevOverscroll = html.style.getPropertyValue('overscroll-behavior');
        const prevOverscrollPriority = html.style.getPropertyPriority('overscroll-behavior');
        html.style.setProperty('overscroll-behavior', 'none');

        let lastTouch: { x: number; y: number } | null = null;
        const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            lastTouch = t ? { x: t.clientX, y: t.clientY } : null;
        };
        const holdPage = (e: Event) => {
            let dx = 0;
            let dy = 0;
            if (e instanceof WheelEvent) {
                dx = e.deltaX;
                dy = e.deltaY;
            } else if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
                const t = e.touches[0];
                if (t && lastTouch) {
                    dx = lastTouch.x - t.clientX;
                    dy = lastTouch.y - t.clientY;
                }
            }
            for (
                let el = e.target instanceof Element ? e.target : null;
                el && el !== document.body;
                el = el.parentElement
            ) {
                if (canScrollBox(el, dx, dy)) return;
            }
            if (e.cancelable) e.preventDefault();
        };

        window.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync, { passive: true });
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', holdPage, { passive: false });
        document.addEventListener('wheel', holdPage, { passive: false });

        return () => {
            topStrip.release();
            window.removeEventListener('scroll', sync);
            window.removeEventListener('resize', sync);
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', holdPage);
            document.removeEventListener('wheel', holdPage);
            widgetRef.current?.style.removeProperty('--login-safari-top');
            if (prevOverscroll) {
                html.style.setProperty('overscroll-behavior', prevOverscroll, prevOverscrollPriority);
            } else {
                html.style.removeProperty('overscroll-behavior');
            }
        };
    }, [safariUnderBar]);

    const goTo = (nextStep: AuthStep, dir: number = 1) => {
        setDirection(dir);
        setStep(nextStep);
        // Walking back to the column from another screen mounts it again and
        // restarts its 8 second timer, so the badge has to go back to its
        // first job as well. The picker into the Quick Preview is the same
        // column, already up, so the badge keeps its job there.
        if (opensWithColumn(nextStep) && !opensWithColumn(step)) setPreviewExpanded(false);
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
        else if (finish) finish();
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
        opensWithColumn(step) && previewExpanded
            ? 'quick-preview-badge-expanded'
            : STEP_LOGO_SLOT[step];
    const activeSlot = logoConfig[logoSlotId];
    const activeStepCount = activeSlot.steps.length;

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
            {inColumn && <style>{IOS_FRAME0_NO_FIXED_CSS}</style>}
            {safariUnderBar && <style>{SAFARI_BAR_CSS}</style>}
            {safariUnderBar &&
                createPortal(
                    <div
                        ref={docRoomRef}
                        aria-hidden="true"
                        data-pw="login-doc-room"
                        style={{
                            flex: '0 0 0px',
                            width: 0,
                            height: `${window.scrollY + window.innerHeight + UNDER_BAR}px`,
                            pointerEvents: 'none',
                        }}
                    />,
                    document.body,
                )}
            <main
                ref={widgetRef}
                data-pw="new-login-widget"
                data-safari-column={inColumn ? '' : undefined}
                data-safari-under-bar={safariUnderBar ? '' : undefined}
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
                {showControls && (
                <div className="absolute top-3 left-3 z-[999999999999] flex flex-col gap-1.5 items-start font-quicksand select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 0. Hide the menu. Only this checkbox stays, so it can be turned back on. */}
                        <label className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 hover:bg-white text-gray-800 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer">
                            <input
                                type="checkbox"
                                data-pw="demo-hide-menu"
                                checked={hideMenu}
                                onChange={(event) => {
                                    setHideMenu(event.target.checked);
                                    setShowStepBar(false);
                                }}
                                className="accent-[#402CDD] cursor-pointer"
                            />
                            <span>Hide menu</span>
                        </label>

                        {!hideMenu && (
                            <>
                                {/* 1. Flow Steps Toggle Button */}
                                <button
                                    data-pw="demo-flow-steps"
                                    onClick={() => setShowStepBar((prev) => !prev)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 hover:bg-white text-gray-800 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                                >
                                    <span className="w-2 h-2 rounded-full bg-[#402CDD]" />
                                    <span>{showStepBar ? 'Hide Steps' : 'Flow Steps'}</span>
                                </button>

                                {/* 2. Per-screen logo animation modal */}
                                <button
                                    onClick={() => {
                                        setIsAnimModalOpen(true);
                                        setShowStepBar(false);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 hover:bg-white text-gray-800 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                                >
                                    <span className="text-[#402CDD] font-bold">Anim:</span>
                                    <span>
                                        {activeSlot.steps
                                            .map((item) => `${item.animation} ${item.seconds}s`)
                                            .join(' → ')}
                                    </span>
                                    <span className="text-gray-500">
                                        {activeSlot.loop ? 'loop' : 'once'}
                                        {activeStepCount > 1 ? ` · ${activeStepCount} steps` : ''}
                                    </span>
                                </button>

                                {/* 3. The floor for the gap under the Quick Preview button. Above 35
                                    (the design's own gap) it also lifts the button on a full page. */}
                                <label className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 text-gray-800 flex items-center gap-1.5 backdrop-blur-sm">
                                    <span className="text-[#402CDD] font-bold">Gap min:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        data-pw="demo-below-button-min"
                                        value={belowButtonMin}
                                        onChange={(event) => {
                                            const next = Number(event.target.value);
                                            if (Number.isFinite(next)) setBelowButtonMin(Math.max(0, next));
                                        }}
                                        className="w-12 px-1 rounded border border-gray-300 bg-white text-gray-800 text-xs"
                                    />
                                    <span className="text-gray-500">px</span>
                                </label>

                                {/* 4. The gap over the Quick Preview pill (56 in the design). */}
                                <label className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 text-gray-800 flex items-center gap-1.5 backdrop-blur-sm">
                                    <span className="text-[#402CDD] font-bold">Top gap:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        data-pw="demo-above-pill"
                                        value={abovePill}
                                        onChange={(event) => {
                                            const next = Number(event.target.value);
                                            if (Number.isFinite(next)) setAbovePill(Math.max(0, next));
                                        }}
                                        className="w-12 px-1 rounded border border-gray-300 bg-white text-gray-800 text-xs"
                                    />
                                    <span className="text-gray-500">px</span>
                                </label>

                                {/* 5. The device and browser numbers behind the layout. */}
                                <button
                                    data-pw="demo-device-info"
                                    aria-label="Device and browser info"
                                    title="Device and browser info"
                                    onClick={() => {
                                        setIsDeviceInfoOpen(true);
                                        setShowStepBar(false);
                                    }}
                                    className="w-7 h-7 text-xs font-bold rounded-full bg-white/90 shadow border border-gray-200 hover:bg-white text-[#402CDD] transition-all backdrop-blur-sm cursor-pointer"
                                >
                                    i
                                </button>
                            </>
                        )}
                    </div>

                    {/* Step Navigator Strip */}
                    {!hideMenu && showStepBar && (
                        /* Wraps rather than scrolls. A scrolling strip hides
                           half the steps on a narrow window, and the parity
                           browser test cannot click a step it cannot see. */
                        <div className="flex flex-wrap items-center gap-1 bg-black/85 backdrop-blur-md p-1.5 rounded-2xl text-white text-xs max-w-[92vw] shadow-lg animate-fade-in">
                            {[
                                { id: 'quick-preview', label: 'Preview' },
                                { id: 'get-started', label: 'Get Started' },
                                { id: 'terms', label: 'Terms' },
                                { id: 'enter-phone', label: 'Phone' },
                                { id: 'select-method', label: 'method' },
                                { id: 'enter-pin', label: 'OTP/PIN' },
                                { id: 'not-registered', label: 'Not Found' },
                                { id: 'already-registered', label: 'Exist' },
                                { id: 'input-name', label: 'Name' },
                                { id: 'signup-success', label: 'Success' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    data-pw={`demo-step-${item.id}`}
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
                                data-pw="demo-step-qr-sheet"
                                onClick={() => setIsQrOpen(true)}
                                className="px-2 py-1 rounded-full text-[11px] whitespace-nowrap text-gray-300 hover:bg-white/10 cursor-pointer"
                            >
                                QR BottomSheet
                            </button>
                        </div>
                    )}
                </div>
                )}

            {/*
              * The picker. It belongs to the demo route, like the bar above,
              * and it is drawn outside <Page> so the scaled canvas cannot
              * shrink it or clip it.
              */}
            <DemoDeviceInfoModal open={isDeviceInfoOpen} onClose={() => setIsDeviceInfoOpen(false)} />

            <LogoAnimationModal
                open={isAnimModalOpen}
                config={logoConfig}
                currentSlot={logoSlotId}
                onApply={applyLogoConfig}
                onClose={() => setIsAnimModalOpen(false)}
            />

            <Page
                variant="scaled"
                inDocument={inColumn}
                maxDeficit={inColumn ? QUICK_PREVIEW_MAX_DEFICIT : undefined}
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
                    data-pw="login-stage"
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
                            // The picker and the Quick Preview are one screen:
                            // one key, so the stage does not slide between them.
                            key={opensWithColumn(step) ? 'column' : step}
                            data-auth-step={step}
                            custom={direction}
                            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
                            transition={transition}
                            className="absolute inset-0 w-full h-full"
                        >
                            {/* 1. Country Picker, then Quick Preview: one column */}
                            {opensWithColumn(step) && (
                                <QuickPreviewScreen
                                    onComplete={() => goTo('get-started', 1)}
                                    onExpand={() => setPreviewExpanded(true)}
                                    wordmarkSlot={logoConfig['quick-preview-wordmark']}
                                    lang={langCode}
                                    belowButtonMin={belowButtonMin}
                                    abovePill={abovePill}
                                    picker={
                                        step === 'country-picker' && countryPicker
                                            ? countryPicker(() => goTo('quick-preview', 1))
                                            : undefined
                                    }
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
                                        if (finish) finish();
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
                                    // the widget still gets its onFinish, and a
                                    // flow started from /demo goes back there
                                    // (exitTo). On its own the screen simply
                                    // stays put, instead of walking off to the
                                    // home page two and a half seconds after you
                                    // arrive on it.
                                    onDone={finish}
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
                      * `live` is the column of the picker and the Quick Preview.
                      * It lifts off the bottom edge and the mark rides up with
                      * it (and the picker scrolls on a short page), so the mark
                      * has to be locked to the slot frame by frame there. Everywhere else the slot is still,
                      * and the mark springs to it.
                      */}
                    <AuthLogoLayer
                        stageRef={stageRef}
                        step={step}
                        live={inColumn}
                        dotColor={logoColor.dot}
                        ringColor={logoColor.ring}
                        slot={activeSlot}
                        bottomClipDesign={
                            safariUnderBar && !previewExpanded ? SAFARI_BADGE_CLIP_DESIGN : undefined
                        }
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
