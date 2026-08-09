# Auth Widgets on Enhanced Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the four remaining old-UI auth surfaces (cart order button, re-auth, session expired, change phone) onto the Enhanced (rdb) components, then delete the legacy components that leaves dead.

**Architecture:** Three of the four surfaces become fullscreen scaled overlays hosting the existing Enhanced screens through a shared `VerifyPhoneFlow`; the cart's inline 200px panel composes the `Enhanced/ui/` primitives instead, because the screens' vertical rhythm is tuned to a 932px artboard. `FullEnhancedLoginWidget` is left untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand 5 (`store`), TailwindCSS 4 with the custom `xd-*` utilities, framer-motion, the `scaling/` canvas engine.

**Design doc:** `docs/superpowers/specs/2026-08-08-auth-widgets-enhanced-design.md`

## Global Constraints

- **No test suite.** CLAUDE.md: the project "relies on clean code and type-checking, not tests". Do **not** add test files. Every task verifies with `pnpm lint`, `pnpm build`, and a stated manual check.
- **Every user-visible string is translated.** Resolve through `translateFunction(key, lang)`. Before using a key, confirm it exists in **all three** of `public/translations/translations.{ar,tr,ku}.js` with `grep -F '"<exact string>":'`. If missing, add it to all three files **in the same edit, before** using it in code. Never invent a synonym for an existing key; never merge two distinct strings under one key.
- **Stack-agnostic naming.** No `go`, `laravel`, `nest`, `next`, … in any identifier, file name, cookie key, header, or log payload. The two backends are the **gateway** and the **core** backend.
- **React Compiler is on** (`reactCompiler: true`). Do not add `useMemo`/`useCallback` without a profiled reason.
- **Tailwind breakpoints are inverted max-widths:** `xs`/`sm` = max 480px, `md` = max 768px, `lg2` = max 912px, `lg` = min 769px.
- **Import style:** bare aliases resolve from repo root — `components/…`, `services/…`, `utils/…`, `store`, `scaling/…`.
- Enhanced files use **4-space indent and single quotes**; the older `components/Login/*` and `components/Cart/*` files use 2-space and double quotes. Match the file you are in.
- Commit after every task. Branch is `rdb-auth-ui`; do not switch branches.

---

### Task 1: Overlay host

Adds the transparent `#app-outer` variant and the reusable fullscreen overlay shell that Tasks 3, 4 and 6 mount into.

**Files:**
- Modify: `scaling/scale.config.ts:52-62` (the `OUTER_BG` map)
- Create: `components/Login/Enhanced/AuthOverlay.tsx`

**Interfaces:**
- Consumes: `Page` from `scaling/Page` (`variant`, `outerBg`, `children`).
- Produces: `AuthOverlay({ children, onBackdropClick?, zIndex? })` — default export from `components/Login/Enhanced/AuthOverlay.tsx`.

**Why it is shaped this way:** `rdb-auth.css` sets `#master-canvas { contain: strict; isolation: isolate }`, which seals the canvas off from the page behind it — a backdrop rendered inside `<Page>` dims nothing. It also paints `#app-outer` opaque `#ffffff`, which would hide the backdrop entirely. `AppScaler` already injects `#app-outer:has(.outer-bg-<key>) { background: <value> }` for every entry in `OUTER_BG`, so adding a `'transparent'` entry is enough — no new global CSS.

- [ ] **Step 1: Add the transparent outer-background key**

In `scaling/scale.config.ts`, inside the `OUTER_BG` object, add as the last entry:

```ts
  'signup-success': '#E0FFEE',
  /** Auth overlays that must let the dimmed page show through. `AppScaler`
   *  injects `#app-outer:has(.outer-bg-overlay) { background: transparent }`,
   *  which overrides the opaque `#app-outer` rule in rdb-auth.css. */
  overlay: 'transparent',
} as const;
```

- [ ] **Step 2: Create the overlay shell**

Create `components/Login/Enhanced/AuthOverlay.tsx`:

```tsx
'use client';

import React from 'react';
import Page from 'scaling/Page';
// The `xd-*` utilities and the `#app-outer` / `#master-canvas` rules the scaled
// canvas relies on live here. Imported so an overlay works even on a page that
// never loaded the login widget.
import 'public/styles/rdb-auth.css';

/**
 * Fullscreen host for an auth surface, mirroring the rdb gate treatment
 * (`PasscodeGate`, `SessionTakeoverOverlay`): a dimming backdrop, then the
 * 430px design canvas scaled to fit on top of it.
 *
 * The backdrop is a sibling of `<Page>`, never a child. `#master-canvas` carries
 * `contain: strict; isolation: isolate`, so anything inside the canvas is sealed
 * off from the page behind and cannot dim it.
 */
export default function AuthOverlay({
    children,
    onBackdropClick,
    zIndex = 9999999999999,
}: {
    children: React.ReactNode;
    /** Omit to make the backdrop inert — the default for a blocking surface. */
    onBackdropClick?: () => void;
    zIndex?: number;
}) {
    return (
        <>
            <div
                className="fixed inset-0 bg-[#0000004d]"
                style={{ zIndex }}
                onClick={onBackdropClick}
                aria-hidden="true"
            />
            <div className="fixed inset-0 w-full h-dvh font-quicksand" style={{ zIndex: zIndex + 1 }}>
                <Page variant="scaled" outerBg="overlay">
                    {children}
                </Page>
            </div>
        </>
    );
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm lint`
Expected: no new errors mentioning `AuthOverlay` or `scale.config`.

- [ ] **Step 4: Commit**

```bash
git add scaling/scale.config.ts components/Login/Enhanced/AuthOverlay.tsx
git commit -m "feat(auth): add AuthOverlay fullscreen host for the Enhanced screens"
```

---

### Task 2: Shared verify flow

The phone → method → OTP sequence, reusing the three existing Enhanced screens unchanged. Every later task consumes this.

**Files:**
- Create: `components/Login/Enhanced/VerifyPhoneFlow.tsx`

**Interfaces:**
- Consumes: `EnterPhoneScreen`, `SelectMethodScreen`, `EnterPinScreen` from `components/Login/Enhanced/screens/`; `AuthService` from `services/auth`; `getNumberLockRemaining`, `isSessionCapReached` from `utils/otpLocks`; `useAppStore` from `store`.
- Produces: `VerifyPhoneFlow(props: VerifyPhoneFlowProps)` — default export. Exported type `VerifyPhoneFlowProps`:

```ts
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
    /** 'signIn' picks the "Login !" heading, 'signUp' picks "Sign Up !". */
    authType?: 'signIn' | 'signUp';
}
```

**Note for the implementer:** `AuthService.SendOtp(mobilePhone, is_via_whatsapp, errorCallback)` throws on any failure including our own rate limiter, so the success path runs only when a code really went out. `AuthService.VerifyOtp(code, verificationId, username, editPhoneFunc)` resolves to `[alreadyExists, name]` and already sets `reAuthResult: "success"` and `shouldAuthinticated: false` in the store. `AuthService.VerifyOtpForUpdatePhone(code, verificationId)` resolves to the `id_token` string.

- [ ] **Step 1: Create the flow component**

Create `components/Login/Enhanced/VerifyPhoneFlow.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { LogError, translateFunction } from 'utils/functions';
import { getNumberLockRemaining, isSessionCapReached } from 'utils/otpLocks';

import EnterPhoneScreen from './screens/EnterPhoneScreen';
import SelectMethodScreen from './screens/SelectMethodScreen';
import EnterPinScreen from './screens/EnterPinScreen';

export interface VerifyPhoneFlowProps {
    initialPhone?: string | null;
    phoneLocked?: boolean;
    verify: (code: string, verificationId: string) => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onClose: () => void;
    lang?: string;
    authType?: 'signIn' | 'signUp';
}

type Step = 'enter-phone' | 'select-method' | 'enter-pin';

const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/**
 * Phone → method → OTP, rendering the Enhanced screens as-is.
 *
 * This is the verify-only subset of what `FullEnhancedLoginWidget` does.
 * That widget is deliberately not refactored onto this component: it also
 * carries splash, terms, QR, name and success, and it is the one auth path
 * already in production. The screens are shared; the send/verify plumbing is
 * not.
 */
export default function VerifyPhoneFlow({
    initialPhone,
    phoneLocked = false,
    verify,
    onSuccess,
    onClose,
    lang = 'en',
    authType = 'signIn',
}: VerifyPhoneFlowProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const { verficationID } = useAppStore();

    const startsAtMethod = Boolean(phoneLocked && initialPhone);
    const [step, setStep] = useState<Step>(startsAtMethod ? 'select-method' : 'enter-phone');
    const [direction, setDirection] = useState(1);
    const [phone, setPhone] = useState(initialPhone || '');
    const [method, setMethod] = useState<'sms' | 'whatsapp' | ''>('');
    const [pin, setPin] = useState('');
    const [isValidPin, setIsValidPin] = useState<'valid' | 'notvalid' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<'send-phone' | 'send-pin' | 'resend-pin' | 'verify-pin' | ''>('');

    // The pin inputs can fire onComplete twice inside one tick, before `loading`
    // has re-rendered, and each extra submit burns a server-side attempt.
    const verifyingRef = useRef(false);

    const goTo = (next: Step, dir = 1) => {
        setDirection(dir);
        setError('');
        setStep(next);
    };

    /**
     * A failed request carries either a backend message (already localised by
     * the API) or nothing useful — fall back to a translated generic line rather
     * than showing "undefined" or an internal string.
     */
    const errorText = (e: unknown) => {
        const message = e instanceof Error ? e.message : '';
        const useful = message && message !== 'Wrong Code' && message !== 'user not found';
        return useful ? message : translate('Something went wrong');
    };

    const handleSendPhone = () => {
        if (!phone || loading) return;
        goTo('select-method', 1);
    };

    const handleSelectMethod = async (selected: 'sms' | 'whatsapp') => {
        if (loading) return;
        // The screen renders its own cooldown / cap message, so returning
        // silently still leaves the user with an explanation on screen.
        if (getNumberLockRemaining(phone) > 0 || isSessionCapReached(phone)) return;

        setMethod(selected);
        setError('');
        setLoading('send-pin');
        try {
            await AuthService.SendOtp(phone, selected === 'whatsapp' ? 1 : 0, () => {});
            setPin('');
            setIsValidPin('');
            setLoading('');
            goTo('enter-pin', 1);
        } catch (e) {
            setLoading('');
            setError(errorText(e));
            LogError({ error: e, scenario: 'Error sending OTP in VerifyPhoneFlow' });
        }
    };

    const handleResend = async () => {
        if (!phone || !method || loading) return;
        if (getNumberLockRemaining(phone) > 0) return;

        setError('');
        setLoading('resend-pin');
        try {
            await AuthService.SendOtp(phone, method === 'whatsapp' ? 1 : 0, () => {});
            setPin('');
            setIsValidPin('');
            setLoading('');
        } catch (e) {
            setLoading('');
            setError(errorText(e));
            LogError({ error: e, scenario: 'Error resending OTP in VerifyPhoneFlow' });
        }
    };

    const handleVerify = async (inputPin: string) => {
        if (loading || verifyingRef.current) return;
        verifyingRef.current = true;
        setError('');
        setLoading('verify-pin');
        try {
            const result = await verify(inputPin, verficationID as string);
            setIsValidPin('valid');
            setLoading('');
            // Let the green "valid" state land before the host tears us down.
            setTimeout(() => onSuccess(result), 600);
        } catch (e) {
            setLoading('');
            setIsValidPin('notvalid');
            setError(translate('Please Enter The Correct Code Sent To Your Phone'));
            LogError({ error: e, scenario: 'Error verifying OTP in VerifyPhoneFlow' });
            setTimeout(() => {
                setIsValidPin('');
                setPin('');
            }, 1500);
        } finally {
            // Released once the request settled: a retry, or a resend that brings
            // the user back here, must not stay blocked.
            verifyingRef.current = false;
        }
    };

    /** Back from the method step returns to the phone step only when editable. */
    const backFromMethod = () => (phoneLocked ? onClose() : goTo('enter-phone', -1));

    return (
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
                    {step === 'enter-phone' && (
                        <EnterPhoneScreen
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

                    {step === 'select-method' && (
                        <SelectMethodScreen
                            phone={phone}
                            method={method}
                            setMethod={handleSelectMethod}
                            changeNumber={backFromMethod}
                            loading={loading === 'send-pin'}
                            error={error}
                            variant="fullscreen"
                            lang={lang}
                            authType={authType}
                            onClose={onClose}
                        />
                    )}

                    {step === 'enter-pin' && (
                        <EnterPinScreen
                            phone={phone}
                            method={method}
                            pin={pin}
                            authType={authType}
                            setPin={setPin}
                            onSubmit={handleVerify}
                            onResend={handleResend}
                            changeMethod={() => goTo('select-method', -1)}
                            // Hidden when the account owns the number: the user
                            // must verify this one, not swap it.
                            changeNumber={phoneLocked ? undefined : () => goTo('enter-phone', -1)}
                            isValidPin={isValidPin}
                            loading={loading}
                            error={error}
                            variant="fullscreen"
                            lang={lang}
                            onClose={onClose}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
```

- [ ] **Step 2: Confirm `SelectMethodScreen` hides Edit when the phone is locked**

`SelectMethodScreen` always renders its Edit button. With `phoneLocked`, `changeNumber` is wired to `onClose` above, which would close the whole surface — wrong. Open `components/Login/Enhanced/screens/SelectMethodScreen.tsx` and make the Edit button conditional. Replace lines 103-113 with:

```tsx
                            <div className="flex pt-xd-8 items-center gap-xd-6">
                                <p className="text-trim-descend text-xd-12 font-medium text-[#1D1D1D]">
                                    +{phone}
                                </p>
                                {/* Omitted when the account already owns this
                                    number — the user must verify it, not swap it. */}
                                {changeNumber && (
                                    <button
                                        onClick={changeNumber}
                                        className="text-trim-descend text-xd-12 font-medium text-[#388CFF] underline cursor-pointer"
                                    >
                                        {translate('Edit')}
                                    </button>
                                )}
                            </div>
```

Then widen the prop type on line 11 from `changeNumber: () => void;` to `changeNumber?: () => void;`.

- [ ] **Step 3: Pass `undefined` rather than `onClose` when locked**

In `VerifyPhoneFlow.tsx`, replace the `backFromMethod` helper and its use:

```tsx
    // Locked numbers have no phone step to go back to, so no Edit affordance.
    const backFromMethod = phoneLocked ? undefined : () => goTo('enter-phone', -1);
```

and in `SelectMethodScreen`, `changeNumber={backFromMethod}` now correctly passes `undefined`.

- [ ] **Step 4: Verify `FullEnhancedLoginWidget` still compiles**

`FullEnhancedLoginWidget.tsx:598` passes `changeNumber={() => goTo('enter-phone', -1)}` — still valid against an optional prop.

Run: `pnpm lint`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add components/Login/Enhanced/VerifyPhoneFlow.tsx components/Login/Enhanced/screens/SelectMethodScreen.tsx
git commit -m "feat(auth): add VerifyPhoneFlow sharing the Enhanced phone/method/OTP screens"
```

---

### Task 3: Session-expired screen

**Files:**
- Modify: `public/translations/translations.ar.js`, `translations.tr.js`, `translations.ku.js`
- Create: `components/Login/Enhanced/screens/SessionExpiredScreen.tsx`
- Modify: `components/Login/SessionExpiredWidget.tsx` (whole file)

**Interfaces:**
- Consumes: `AuthOverlay` (Task 1).
- Produces: `SessionExpiredScreen({ onLogin, onContinueAsGuest, lang })` — default export.

**Translation gap found during design:** the bare key `"Login"` is **missing from all three files** (`"Login !"`, `"Login & Continue"`, `"Login with QR"` exist; bare `"Login"` does not). `SessionExpiredWidget` renders it today, so it ships untranslated. Fix it in Step 1.

- [ ] **Step 1: Add the missing `Login` key to all three translation files**

Confirm it is really absent first:

```bash
grep -Fn '"Login":' public/translations/translations.ar.js public/translations/translations.tr.js public/translations/translations.ku.js
```

Expected: no output. Then add one entry to each file, placed alphabetically next to the existing `"Login !"` line:

- `translations.ar.js`: `"Login": "تسجيل الدخول",`
- `translations.tr.js`: `"Login": "Giriş Yap",`
- `translations.ku.js`: `"Login": "چوونەژوورەوە",`

Re-run the grep above. Expected: one hit per file.

- [ ] **Step 2: Create the screen**

The other three keys it needs — `"Your session has expired"`, `"Please login again to get back to your account, or continue browsing as a guest."`, `"Continue as Guest"` — already exist in all three files.

Create `components/Login/Enhanced/screens/SessionExpiredScreen.tsx`:

```tsx
'use client';

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';

interface SessionExpiredScreenProps {
    onLogin: () => void;
    onContinueAsGuest: () => void;
    lang?: string;
}

/**
 * The "your session ended" prompt, in the same visual language as
 * `GetStartedScreen`. By the time this renders, /api/auth/expire has already
 * cleared the dead session and registered a fresh guest — the app behind the
 * overlay is usable.
 */
export default function SessionExpiredScreen({
    onLogin,
    onContinueAsGuest,
    lang = 'en',
}: SessionExpiredScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    return (
        <main className="w-full h-full bg-white flex flex-col font-quicksand relative">
            <FlexibleSpace size={280} share={0.45} />

            <div className="flex flex-col items-center">
                <Image
                    src="/icons/Logo.svg"
                    alt=""
                    width={144}
                    height={104}
                    priority
                    className="w-xd-144 h-xd-104 object-contain"
                />
            </div>

            <FlexibleSpace size={174} share={0.28} />

            <div className="flex flex-col items-center">
                <h2 className="text-xd-30 font-bold text-[#1D1D1D] h-xd-40 text-center">
                    {translate('Your session has expired')}
                </h2>
                <FlexibleSpace size={24} share={0.04} />

                <div className="w-full flex items-center justify-center">
                    <p className="text-xd-13 leading-[1.6] w-xd-376 text-center font-normal text-[#5D5C5D]">
                        {translate(
                            'Please login again to get back to your account, or continue browsing as a guest.'
                        )}
                    </p>
                </div>

                <FlexibleSpace size={35} share={0.042} />
                <div className="flex py-xd-6 flex-col items-center">
                    <button
                        onClick={onLogin}
                        data-cy="session-expired-login"
                        className="xd-dashed-border w-xd-390 h-xd-60 leading-[1.3] rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('Login')}
                    </button>
                    <button
                        onClick={onContinueAsGuest}
                        data-cy="session-expired-guest"
                        className="xd-dashed-border w-xd-390 h-xd-60 leading-[1.3] rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 mt-xd-8 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('Continue as Guest')}
                    </button>
                </div>

                <FlexibleSpace size={35} share={0} />
            </div>
        </main>
    );
}
```

- [ ] **Step 3: Rewire the widget**

Replace the whole body of `components/Login/SessionExpiredWidget.tsx`. Every behaviour in the old file is preserved: Login re-arms the marker as `"seller"` on seller routes and `"expired-login"` elsewhere; Continue as Guest sets `reAuthResult: "cancelled"`, clears the marker, then redirects home on seller routes or reloads everywhere else. The `createPortal` wrapper and the Escape handler go — `AuthOverlay` is already `position: fixed` at the top of the stack, and the backdrop is intentionally inert so a stray click cannot dismiss a session prompt.

```tsx
'use client';

import { useCallback } from 'react';
import { useAppStore } from 'store';
import AuthOverlay from './Enhanced/AuthOverlay';
import SessionExpiredScreen from './Enhanced/screens/SessionExpiredScreen';

/**
 * Session-expired prompt for a previously verified shopper whose refresh
 * failed. By the time this renders, /api/auth/expire has already cleared the
 * dead session and registered a fresh guest — the app is usable behind the
 * prompt.
 *
 * Login → hands off to the phone-verify widget ("expired-login" marker, or
 * "seller" on the dashboard); parked 401 requests keep waiting because the
 * marker stays truthy. Continue as Guest → cancels the re-auth wait and
 * reloads (redirects home on seller routes) so the UI drops the stale
 * logged-in state and renders the fresh guest session.
 */
function SessionExpiredWidget() {
    const { language, setShouldAuthinticated, setReAuthResult } = useAppStore();

    // Same seller detection the phone-verify widget's dismiss uses: a guest
    // can't stay on the seller dashboard, so both buttons behave differently.
    const isSeller =
        typeof window !== 'undefined' && window.location.pathname.includes('/seller');

    const handleLogin = useCallback(() => {
        // reAuthResult stays "pending" — the OTP widget owns the outcome now.
        setShouldAuthinticated(isSeller ? 'seller' : 'expired-login');
    }, [setShouldAuthinticated, isSeller]);

    const handleContinueAsGuest = useCallback(() => {
        setReAuthResult('cancelled');
        setShouldAuthinticated(false);
        // Server state already moved to the fresh guest. A guest has no business
        // on the seller dashboard — send them to the storefront; elsewhere
        // reload so server-rendered content stops showing the old account.
        if (isSeller) {
            window.location.href = '/';
            return;
        }
        window.location.reload();
    }, [setReAuthResult, setShouldAuthinticated, isSeller]);

    return (
        <AuthOverlay>
            <SessionExpiredScreen
                onLogin={handleLogin}
                onContinueAsGuest={handleContinueAsGuest}
                lang={language}
            />
        </AuthOverlay>
    );
}

export default SessionExpiredWidget;
```

- [ ] **Step 4: Verify**

Run: `pnpm lint`
Expected: no new errors, and no i18n error about `"Login"` (Step 1 added it).

Manual: in dev, set the marker from the console — `useAppStore.getState().setShouldAuthinticated("expired")` — and confirm the fullscreen prompt renders over a dimmed page, Login swaps to the verify widget, Continue as Guest reloads.

- [ ] **Step 5: Commit**

```bash
git add public/translations components/Login/Enhanced/screens/SessionExpiredScreen.tsx components/Login/SessionExpiredWidget.tsx
git commit -m "feat(auth): move the session-expired prompt onto the Enhanced overlay"
```

---

### Task 4: Re-auth widget

The busiest surface. Every rule listed below exists in the current file and must survive.

**Files:**
- Modify: `components/Login/ConfirmMobilePhoneWidget.tsx` (whole file)

**Interfaces:**
- Consumes: `AuthOverlay` (Task 1), `VerifyPhoneFlow` (Task 2).

**Rules to preserve, with their current line numbers in the old file:**
- `:25-28` — `expiredSessionPhone` is used **only** for the `"expired-login"` and `"seller"` markers; every other flow asks for a phone.
- `:31-33` — the flow source is captured once at mount, because the marker is cleared the instant verification succeeds.
- `:34-43` — `DisableScroll()` on mount, `EnableScroll()` on unmount, and a `VERIFY_FLOW_OPENED` order event.
- `:63-92` — dismiss: seller routes (marker `"seller"` **or** a path containing `/seller`) redirect home, everything else reloads; `STORIES-TOKEN` is cleared through `/api/auth/clear-tokens` with `keepalive` **unless** the marker is `"expired-login"` (expire already cleared them); the store writes are wrapped in `try/catch` so a throwing subscriber can never prevent the navigation.
- `:136-141` — the phone is treated as present when `userProfile.phone` is not `null`/`0`/`"0"`, or when a preserved expired-session phone exists.
- `:143-164` — on success: report `VERIFY_COMPLETED_RETURNED_TO_CHECKOUT` when the flow was opened from checkout, fire `setAddStory(true)` for `"open Story"`, `ChatConroller(true)` for `"open chat"`, clear `expiredSessionPhone`, then clear the marker.

- [ ] **Step 1: Rewrite the widget**

```tsx
'use client';

import React, { useEffect } from 'react';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { ChatConroller, DisableScroll, EnableScroll } from 'utils/tinyUtils';
import { ORDER_EVENTS, resolveVerifyFlowSource, trackOrder } from 'utils/orderFunnel';
import AuthOverlay from './Enhanced/AuthOverlay';
import VerifyPhoneFlow from './Enhanced/VerifyPhoneFlow';

function ConfirmMobilePhoneWidget() {
    const {
        setShouldAuthinticated,
        shouldAuthinticated,
        setAddStory,
        setReAuthResult,
        expiredSessionPhone,
        setExpiredSessionPhone,
        language,
    } = useAppStore();

    // Phone preserved when /api/auth/expire cleared the previous session — the
    // fresh guest profile no longer carries it. Only the session-expired
    // re-login markers may use it, so every other flow keeps asking for a phone.
    const savedExpiredPhone =
        shouldAuthinticated === 'expired-login' || shouldAuthinticated === 'seller'
            ? expiredSessionPhone
            : null;

    // Capture the source the verify widget was opened from once, at mount — the
    // store marker is cleared to `false` the moment verification succeeds.
    const flowSourceRef = React.useRef(resolveVerifyFlowSource(shouldAuthinticated));

    useEffect(() => {
        DisableScroll();
        trackOrder(ORDER_EVENTS.VERIFY_FLOW_OPENED, { flow_source: flowSourceRef.current });
        return () => {
            EnableScroll();
        };
    }, []);

    const userData = useAppStore.getState().userProfile;
    const accountPhone =
        userData?.phone !== null &&
        (userData as any)?.phone !== 0 &&
        userData?.phone !== '0'
            ? userData?.phone
            : null;
    const knownPhone = accountPhone || savedExpiredPhone;

    /**
     * Dismissal without verifying: seller routes redirect home (a guest can't
     * use the dashboard); every other flow/route reloads so the page re-renders
     * against whatever token is currently stored — never against stale client
     * state.
     *
     * The navigation is the one guaranteed step: every bit of teardown is
     * best-effort and must never prevent it (a store write can re-render
     * subscribers synchronously — a throw there would otherwise kill this
     * handler before the reload).
     */
    const handleDismiss = () => {
        const isSeller =
            shouldAuthinticated === 'seller' ||
            window.location.pathname.includes('/seller');

        // Clear sub-service tokens via server route. keepalive lets the request
        // survive the navigation below. Skipped when opened from the
        // session-expired prompt — /api/auth/expire already cleared them.
        if (shouldAuthinticated !== 'expired-login') {
            try {
                fetch('/api/auth/clear-tokens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tokens: ['STORIES-TOKEN'] }),
                    credentials: 'include',
                    keepalive: true,
                });
            } catch {}
        }
        try {
            setReAuthResult('cancelled');
            setShouldAuthinticated(false);
        } catch {}

        if (isSeller) {
            window.location.href = '/';
        } else {
            window.location.reload();
        }
    };

    const handleSuccess = () => {
        // Verification succeeded; if this flow was opened from the checkout
        // gate, the user is being returned to checkout.
        if (flowSourceRef.current === 'checkout') {
            trackOrder(ORDER_EVENTS.VERIFY_COMPLETED_RETURNED_TO_CHECKOUT, {
                flow_source: flowSourceRef.current,
            });
        }
        if (shouldAuthinticated === 'open Story') {
            setAddStory(true);
        }
        if (shouldAuthinticated === 'open chat') {
            ChatConroller(true);
        }
        if (savedExpiredPhone) {
            setExpiredSessionPhone(null);
        }
        setShouldAuthinticated(false);
    };

    return (
        <AuthOverlay>
            <VerifyPhoneFlow
                initialPhone={knownPhone}
                phoneLocked={Boolean(knownPhone)}
                verify={(code, verificationId) =>
                    AuthService.VerifyOtp(code, verificationId, '', () => {})
                }
                onSuccess={handleSuccess}
                onClose={handleDismiss}
                lang={language}
                authType="signIn"
            />
        </AuthOverlay>
    );
}

export default ConfirmMobilePhoneWidget;
```

- [ ] **Step 2: Verify**

Run: `pnpm lint`
Expected: no new errors.

Manual: from the console run `useAppStore.getState().setShouldAuthinticated(true)`. Confirm the overlay appears over a dimmed page; with a verified account the flow opens at the method step with no Edit link; the close button reloads the page.

- [ ] **Step 3: Commit**

```bash
git add components/Login/ConfirmMobilePhoneWidget.tsx
git commit -m "feat(auth): move the re-auth widget onto the Enhanced overlay"
```

---

### Task 5: Cart inline panel

The only surface that must **not** take over the screen. It lives inside the cart footer's 200px expanded button.

**Files:**
- Create: `components/Login/Enhanced/InlineVerifyPanel.tsx`
- Modify: `components/Cart/OrderButton.tsx:628-645`
- Possibly modify: `public/translations/translations.{ar,tr,ku}.js`

**Interfaces:**
- Consumes: `RdbPhoneInput`, `RdbPinInputs` from `components/Login/Enhanced/ui/`; `AuthService`; `utils/otpLocks`.
- Produces: `InlineVerifyPanel({ initialPhone, phoneLocked, onSuccess, onClose, lang })` — default export.

**Why primitives and not screens:** `EnterPhoneScreen` / `SelectMethodScreen` / `EnterPinScreen` lay out as `w-full h-full` over the 430×932 artboard and space themselves with `FlexibleSpace`, whose `size` is raw px tuned to that artboard. Dropped into a 200px box they keep artboard-sized gaps and overflow. `NumericKeypad` (used by `RdbPinInputs`) already portals to `<body>` as `position: fixed`, so it behaves identically here and inside the canvas.

- [ ] **Step 1: Check the strings this panel needs**

```bash
for k in "Enter Your Phone Number" "Send WhatsApp" "Send SMS" "Resend Code" "Wait" "before trying again" "Please Enter The Correct Code Sent To Your Phone" "Something went wrong"; do
  printf "%-52s" "$k"
  for f in ar tr ku; do
    if grep -qF "\"$k\":" public/translations/translations.$f.js; then printf "%s=Y " $f; else printf "%s=N " $f; fi
  done; echo
done
```

Expected: `Y` for all three languages on every key (verified during design). If any shows `N`, add it to all three files before continuing.

- [ ] **Step 2: Create the panel**

```tsx
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
```

- [ ] **Step 3: Swap it into the cart**

In `components/Cart/OrderButton.tsx`, replace the `<ConfirmMobile … />` block (currently lines 632-645, inside `{option ? ( … )}`) with:

```jsx
                    <InlineVerifyPanel
                      initialPhone={
                        userData?.phone !== null &&
                        // @ts-ignore — phone is typed loosely across the store
                        userData?.phone !== 0 &&
                        userData?.phone !== "0"
                          ? userData?.phone
                          : null
                      }
                      phoneLocked={
                        userData?.phone !== null &&
                        // @ts-ignore
                        userData?.phone !== 0 &&
                        userData?.phone !== "0"
                      }
                      onClose={() => {
                        setOption(false);
                      }}
                      onSuccess={() => {
                        GoToOrders(true);
                      }}
                      lang={languageVariable}
                    />
```

Then replace the import on line 9:

```js
import InlineVerifyPanel from "components/Login/Enhanced/InlineVerifyPanel";
```

Check that `languageVariable` is the language string in scope in this component (it is used for `RoundPrice` around line 566). If it is not a plain language code, use `useAppStore.getState().language` instead.

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm build`
Expected: both pass.

Manual: as a guest with items in the cart, press Confirm & Continue. The panel expands in place — the page must **not** be taken over. Complete an OTP and confirm the order proceeds. On a touch device confirm the numeric keypad slides up over the page and the digits land in the boxes.

- [ ] **Step 5: Commit**

```bash
git add components/Login/Enhanced/InlineVerifyPanel.tsx components/Cart/OrderButton.tsx
git commit -m "feat(cart): rebuild the inline verify panel on the Enhanced primitives"
```

---

### Task 6: Settings change-phone

Two hosts collapse into one. `components/settings/PersonalInfo.tsx` and the `ConfirmationModal` inlined at the bottom of `components/setting/profile/PersonalInfoForm.tsx` are the same component with a different close icon.

**Files:**
- Modify: `components/setting/profile/PersonalInfoForm.tsx:228-250` and `:622-655` (delete the inlined `ConfirmationModal`)
- Modify: `components/setting/profile/VerifyUser.tsx:63-79`
- Delete: `components/settings/ConfirmMobileChange.tsx`, `components/settings/PersonalInfo.tsx`

**Interfaces:**
- Consumes: `AuthOverlay` (Task 1), `VerifyPhoneFlow` (Task 2).

**The two modes:**
- `forVerify: true` (`VerifyUser`) — the account already owns the number; verify it with `AuthService.VerifyOtp`. Success just closes.
- `forVerify: false` (`PersonalInfoForm`) — the user typed a **new** number; verify with `AuthService.VerifyOtpForUpdatePhone`, which resolves to the `id_token` string that the profile save then sends as its `id_token` field.

- [ ] **Step 1: Rewire `PersonalInfoForm`**

Delete the whole `const ConfirmationModal = ({ … }) => { … };` block at the bottom of the file (starts at line 622, ends at the final `};`), and remove the now-unused `createPortal` and `ConfirmMobileChange` imports.

Replace the `{isPhoneShouldChange && (<ConfirmationModal … />)}` block (line 228 onward) with:

```jsx
      {isPhoneShouldChange && (
        <AuthOverlay>
          <VerifyPhoneFlow
            initialPhone={phoneInput.value}
            phoneLocked
            // A NEW number: verify it against the phone-update endpoint, which
            // returns the id_token the profile save must carry.
            verify={(code, verificationId) =>
              AuthService.VerifyOtpForUpdatePhone(code, verificationId)
            }
            onSuccess={(idToken) => {
              updateUserProfile({
                ...userProfileData,
                phone: phoneInput.modifiedValue?.includes("+")
                  ? phoneInput.modifiedValue
                  : `+${phoneInput.modifiedValue}`,
                alternative_phone: alternativePhoneInput.modifiedValue || "",
                id_token: idToken,
              });
              setIsPhoneShouldChange(false);
            }}
            onClose={() => setIsPhoneShouldChange(false)}
            lang={language}
          />
        </AuthOverlay>
      )}
```

Add the imports at the top of the file:

```js
import AuthService from "services/auth";
import AuthOverlay from "components/Login/Enhanced/AuthOverlay";
import VerifyPhoneFlow from "components/Login/Enhanced/VerifyPhoneFlow";
```

`AuthService` may already be imported — check before adding a duplicate.

- [ ] **Step 2: Rewire `VerifyUser`**

Replace the `{isModalOpen && mounted && createPortal(…)}` block (lines 63-79) with:

```jsx
      {isModalOpen && mounted && (
        <AuthOverlay>
          <VerifyPhoneFlow
            initialPhone={phone}
            phoneLocked
            // The account already owns this number — a plain login verify.
            verify={(code, verificationId) =>
              AuthService.VerifyOtp(code, verificationId, "", () => {})
            }
            onSuccess={() => setIsModalOpen(false)}
            onClose={() => setIsModalOpen(false)}
          />
        </AuthOverlay>
      )}
```

Swap the imports: drop `import { ConfirmationModal } from "components/settings/PersonalInfo";` and `createPortal`, add:

```js
import AuthService from "services/auth";
import AuthOverlay from "components/Login/Enhanced/AuthOverlay";
import VerifyPhoneFlow from "components/Login/Enhanced/VerifyPhoneFlow";
```

- [ ] **Step 3: Delete the old flow**

```bash
git rm components/settings/ConfirmMobileChange.tsx components/settings/PersonalInfo.tsx
```

- [ ] **Step 4: Confirm nothing else referenced them**

```bash
grep -rn "ConfirmMobileChange\|settings/PersonalInfo" --include=*.tsx --include=*.ts app components services utils store
```

Expected: no output.

- [ ] **Step 5: Verify**

Run: `pnpm lint && pnpm build`
Expected: both pass.

Manual: Settings → Profile → Personal Info → change the phone → Save. The overlay opens straight at the method step, OTP completes, and the profile saves. Then, on an account with an unverified number, press "Verify Now" and confirm the same overlay verifies it.

- [ ] **Step 6: Commit**

```bash
git add -A components/setting components/settings
git commit -m "feat(settings): move the change-phone flow onto the Enhanced overlay"
```

---

### Task 7: Drop legacy mode and enforce one canvas at a time

**Files:**
- Modify: `components/Home/AuthSections.tsx`
- Modify: `components/Home/NavbarClient.tsx:37-42`

**Why mutual exclusion:** `AppScaler` hardcodes `id="app-outer"` and `id="master-canvas"`, writes `--app-scale` and `--xd-flex-deficit` on `:root`, and resets `body.overflow`/`background` on unmount with **no refcount**. Two scaled surfaces mounted together produce duplicate ids (so `UnscaledPortal`'s `getElementById` resolves to the wrong node) and the first unmount releases the scroll lock the second still needs. `loginOpen` and `shouldAuthinticated` are gated independently today, so a 401 arriving while login is open mounts two.

Login wins. That is safe because `AuthService.VerifyOtp` already sets `reAuthResult: "success"` and clears `shouldAuthinticated` (`services/auth.ts:225-229`), so a parked 401 resolves through the login widget too.

- [ ] **Step 1: Strip the legacy branch from `AuthSections`**

Replace the whole file with:

```tsx
import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";
import FullEnhancedLoginWidget from "components/Login/Enhanced/FullEnhancedLoginWidget";

const CallContainer = dynamic(
  () => import("components/Chat/pages/CallContainer"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  loading: () => <LandingPage afterLoad={true} />,
});

function AuthSections() {
  const loginOpen = useAppStore((s) => s.loginOpen);
  const chatOpen = useAppStore((s) => s.chatVar);
  const call = useAppStore((s) => s.call);

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && <FullEnhancedLoginWidget />}
      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
```

- [ ] **Step 2: Find every consumer of the removed export**

`AUTH_WIDGET_MODE` and the `AuthWidgetMode` type were exported from that file.

```bash
grep -rn "AUTH_WIDGET_MODE\|AuthWidgetMode\|NEXT_PUBLIC_AUTH_WIDGET_MODE" --include=*.tsx --include=*.ts --include=*.md app components services utils store docs
```

Fix every hit. If `NEXT_PUBLIC_AUTH_WIDGET_MODE` appears in `.env*` files or `README`, remove those lines too.

- [ ] **Step 3: Make the auth surfaces mutually exclusive**

In `components/Home/NavbarClient.tsx`, add the selector alongside the others:

```jsx
  const loginOpen = useAppStore((s) => s.loginOpen);
```

and replace the two widget lines (37-42) with:

```jsx
      {/* One scaled canvas at a time: AppScaler hardcodes #app-outer /
          #master-canvas and writes --app-scale on :root, so two mounted
          together fight over both. The login widget wins — its VerifyOtp
          already clears `shouldAuthinticated` and sets reAuthResult
          "success", so a parked 401 resolves through it too. */}
      {!loginOpen && shouldAuthinticated === "expired" && !LoggingOut && (
        <SessionExpiredWidget />
      )}
      {!loginOpen &&
        shouldAuthinticated &&
        shouldAuthinticated !== "expired" &&
        !LoggingOut && <ConfirmMobilePhoneWidget />}
```

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm build`
Expected: both pass.

Manual: open the login widget, then from the console run `useAppStore.getState().setShouldAuthinticated(true)`. Only the login widget must be visible. Close it and the verify overlay takes over.

- [ ] **Step 5: Commit**

```bash
git add components/Home/AuthSections.tsx components/Home/NavbarClient.tsx
git commit -m "refactor(auth): drop the legacy login widget and keep one scaled canvas at a time"
```

---

### Task 8: Delete the dead components

Nothing should import any of these once Tasks 3-7 have landed. Prove it before deleting.

**Files:**
- Delete: `components/Login/NewLoginWidget.tsx`, `PhoneInput.tsx`, `SendMethod.tsx`, `LogInPins.tsx`, `SignSteps.tsx`, `AccountNotFound.tsx`, `AlreadyRegistered.tsx`, `InputName.tsx`, `LoginMethods.tsx`, `PrivacyConfirm.tsx`, `WelcomeSignup.tsx`, `WelcomingWidget.tsx`, `PhoneNumberError.tsx`, `Border.tsx`
- Delete: `components/Cart/ConfirmMobile.tsx`
- Delete: `public/styles/newLogin.css`, `public/styles/login.css`

**Do NOT delete — these look dead and are not:**
- `components/Login/Timer.tsx` → `Cart/CartItem.tsx:1`, `Orders/OrderRetailsReturnInfo.tsx:4`
- `components/Login/SessionTimer.tsx` → `app/simulateUser/page.tsx`, `global/DeferredLayoutClients.tsx`
- `components/Login/QrScannerModal.tsx`, `QrApprovalSheet.tsx` → `setting/profile/index.tsx`
- `components/global/Border.tsx` — a different file from `components/Login/Border.tsx`; the many `Border` hits across `Cart/AddToCart/`, `products/`, `Server/` resolve to the global one

- [ ] **Step 1: Prove each file is unreferenced**

```bash
for f in NewLoginWidget PhoneInput SendMethod LogInPins SignSteps AccountNotFound AlreadyRegistered InputName LoginMethods PrivacyConfirm WelcomeSignup WelcomingWidget PhoneNumberError; do
  printf "%-20s " "$f"
  grep -rn "Login/$f\"\|Login/$f'\|\"\./$f\"\|'\./$f'" --include=*.tsx --include=*.ts app components services utils store | grep -v "components/Login/$f.tsx" | tr '\n' ' '
  echo
done
echo "--- Login/Border ---"
grep -rn "Login/Border" --include=*.tsx --include=*.ts app components
echo "--- Cart/ConfirmMobile ---"
grep -rn "Cart/ConfirmMobile\|\./ConfirmMobile\"" --include=*.tsx --include=*.ts app components
echo "--- css ---"
grep -rn "newLogin.css\|styles/login.css" --include=*.tsx --include=*.ts app components
```

Expected: every line blank after the file name. **If any hit remains, stop and fix that consumer before deleting anything.**

- [ ] **Step 2: Delete**

```bash
git rm components/Login/NewLoginWidget.tsx components/Login/PhoneInput.tsx \
  components/Login/SendMethod.tsx components/Login/LogInPins.tsx \
  components/Login/SignSteps.tsx components/Login/AccountNotFound.tsx \
  components/Login/AlreadyRegistered.tsx components/Login/InputName.tsx \
  components/Login/LoginMethods.tsx components/Login/PrivacyConfirm.tsx \
  components/Login/WelcomeSignup.tsx components/Login/WelcomingWidget.tsx \
  components/Login/PhoneNumberError.tsx components/Login/Border.tsx \
  components/Cart/ConfirmMobile.tsx \
  public/styles/newLogin.css public/styles/login.css
```

- [ ] **Step 3: Let the tooling find what the grep missed**

Run: `pnpm knip`

Read the "Unused files" and "Unused exports" sections. Anything newly listed under `components/Login/` or `components/settings/` is a leftover from this change — delete it. Anything listed that predates this work is out of scope; leave it.

- [ ] **Step 4: Full verification**

Run: `pnpm lint && pnpm build`
Expected: both pass with no unresolved-import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(auth): delete the legacy login components left dead by the Enhanced port"
```

---

### Task 9: Manual pass over all four surfaces

No automated coverage exists, so this is the real gate. Run against `pnpm dev`.

- [ ] **Step 1: Cart, guest shopper**

Add an item, press Confirm & Continue. The panel expands **inline** — the page must not be taken over. Enter a phone, pick a method, enter the OTP. The order proceeds. Press the close button mid-flow and confirm the button collapses back to "Confirm & Continue".

- [ ] **Step 2: Re-auth**

Console: `useAppStore.getState().setShouldAuthinticated(true)`. The fullscreen overlay renders over a dimmed page. On a verified account it opens at the method step with **no Edit link**. Complete the OTP — the overlay closes without a page reload. Reopen and press close instead: the page reloads.

- [ ] **Step 3: Session expired**

Console: `useAppStore.getState().setShouldAuthinticated("expired")`. Confirm the button labels are translated in `ar`, `tr` and `ku` (the `"Login"` key added in Task 3). Login swaps to the verify overlay with the phone preloaded. Back out, retrigger, press Continue as Guest — the page reloads as a guest.

- [ ] **Step 4: Settings change phone**

Settings → Profile → Personal Info → change the number → Save → OTP → the profile saves with the new number. Then "Verify Now" on an unverified account → the same overlay → verified badge appears.

- [ ] **Step 5: Two surfaces at once**

Open the login widget, then `setShouldAuthinticated(true)` from the console. Only the login widget renders. Close it; the verify overlay appears. Confirm the page scroll is still locked while either is open and released after both close.

- [ ] **Step 6: RTL**

Repeat Steps 1 and 2 with `?lang=ar`. Confirm the panel and overlay lay out right-to-left and no label is left in English.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix(auth): corrections from the manual pass over the four verify surfaces"
```

---

## Self-review notes

- **Spec coverage:** overlay host → Task 1; shared flow → Task 2; session-expired screen → Task 3; re-auth → Task 4; cart inline panel → Task 5; settings change-phone → Task 6; legacy removal + mutual exclusion → Task 7; dead-code deletion → Task 8; validation → Task 9. `FullEnhancedLoginWidget` untouched, as the spec's Out of Scope requires.
- **Known gap made explicit:** the `"Login"` translation key is missing from all three files today (Task 3, Step 1). This is a pre-existing bug the port surfaces.
- **Type consistency:** `VerifyPhoneFlow` exposes `verify(code, verificationId) => Promise<unknown>` in Tasks 2, 4 and 6; `onSuccess(result: unknown)` is narrowed to the `id_token` string only at the `PersonalInfoForm` call site, which is the only consumer that reads it.
- **The one edit outside the new files** is `SelectMethodScreen`'s Edit button becoming conditional (Task 2, Step 2). `FullEnhancedLoginWidget` still passes a function there, so its behaviour is unchanged.
