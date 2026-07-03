# Luck-Price Engine Unification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three separate, DOM-mutating luck-price implementations (listing card, product page, add-to-cart sheet) with one declarative engine — a `luck` Zustand slice as single source of truth per product, a shared `useLuckTimer` hook, and one persistence layer — fixing the "luck price stays after the counter expires" bug and removing all `classList`/`querySelector`/`localStorage("counter")` hacks.

**Architecture:** A new `luck` store slice holds one deadline-based timer record per product id (`deadlineTs` while running, `pausedRemaining` while paused, `expired`). A shared `useLuckTimer(id, { isLuck, visible })` hook starts/pauses/resumes/expires that record — folding navigation, tab-hidden, and off-screen into a single pause gate — and returns `{ luckActive, secondsLeft }`. Every surface renders declaratively from the hook. Persistence (localStorage timer map + the `redemed_ids` cookie) makes one window continuous across card → sheet → product page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Zustand 5, `react-timer-hook` (existing dep), TailwindCSS 4.

## Global Constraints

- **No test suite / no test files.** Per `CLAUDE.md`, validation is type-checking + lint + manual verification. Do NOT create `*.test.*` / `*.spec.*` files. (Verbatim: "There is no test suite … Do not add test files unless explicitly asked.")
- **Per-task gate (replaces the TDD cycle):** `npx tsc --noEmit` introduces **no new errors vs. the Task 0 baseline**, and `pnpm lint` passes on touched files. Then the task's manual checks.
- **Package manager is `pnpm`.** Never invoke `npm`/`yarn`.
- **Store rules:** slices live in `store/<domain>/reducer.ts` and are spread into `useAppStore` in `store/index.ts`. In non-React code use `useAppStore.getState()`; never call the hook in a Server Component. Devtools middleware stays only in `store/index.ts` (dev-only) — do not add middleware elsewhere.
- **Path aliases:** `utils/...`, `store`, `components/...`, `hooks/...` resolve from repo root (`tsconfig.json` `"*": ["./*"]`).
- **Canonical redeemed cookie value is the string `redemed_ids`** (misspelled but matches every writer and every server reader). Do NOT rename the cookie; only fix the `redeemd_ids` misspelled *reads*.
- **Luck window default = 50 seconds**, expressed once as `DEFAULT_LUCK_SECONDS`.
- **React Compiler is enabled** — do not add manual `useMemo`/`useCallback` without a profiled reason.

---

### Task 0: Baseline snapshot

**Files:** none (records baseline only).

- [ ] **Step 1: Capture the current type-check baseline**

Run: `npx tsc --noEmit 2>&1 | tee /tmp/luck-tsc-baseline.txt; echo "---"; grep -c "error TS" /tmp/luck-tsc-baseline.txt || echo 0`
Expected: some count `N` (possibly 0). Record `N` — later tasks must not exceed it.

- [ ] **Step 2: Capture the current lint baseline for the files this plan touches**

Run: `pnpm lint 2>&1 | tail -30`
Expected: note any pre-existing warnings/errors in the target files so new ones are distinguishable.

- [ ] **Step 3: Confirm the reported bug repro path (read-only)**

Confirm on a luck product card: the "Luck!" badge + `-Ns` counter + orange price beside Buy + strike-through render, and that after the counter hits 0 the orange price can persist (esp. if navigating). No code change — this documents the "before".

---

### Task 1: Luck persistence + constants util

**Files:**
- Create: `utils/luck/index.ts`

**Interfaces:**
- Consumes: `getCookie`, `setCookie` from `utils/cookies/cookie-manager`.
- Produces:
  - `DEFAULT_LUCK_SECONDS: number` (= 50)
  - `REDEEMED_IDS_COOKIE: string` (= "redemed_ids")
  - `LUCK_TIMERS_STORAGE_KEY: string` (= "luck_timers")
  - `interface LuckTimer { deadlineTs: number | null; pausedRemaining: number | null; expired: boolean }`
  - `interface RedeemedEntry { id: string | number; showingDate: string }`
  - `getRedeemedIds(): RedeemedEntry[]`
  - `isRedeemed(id: string | number): boolean`
  - `addRedeemedId(id: string | number): void`
  - `readTimer(id: string | number): LuckTimer | null`
  - `writeTimer(id: string | number, timer: LuckTimer | null): void`
  - `computeSecondsLeft(timer: LuckTimer | null | undefined, now: number): number`

- [ ] **Step 1: Create the util with all exports**

```ts
// utils/luck/index.ts
import { getCookie, setCookie } from "utils/cookies/cookie-manager";

export const DEFAULT_LUCK_SECONDS = 50;
/** Canonical redeemed-products cookie (intentionally matches the existing
 *  misspelled key that every writer + server reader already uses). */
export const REDEEMED_IDS_COOKIE = "redemed_ids";
export const LUCK_TIMERS_STORAGE_KEY = "luck_timers";

const MAX_REDEEMED = () =>
  parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH ?? "") || 5;

export interface LuckTimer {
  /** epoch ms; set while the countdown is running */
  deadlineTs: number | null;
  /** seconds remaining; set while paused */
  pausedRemaining: number | null;
  expired: boolean;
}

export interface RedeemedEntry {
  id: string | number;
  showingDate: string;
}

// ---- redeemed record (cookie; also read server-side to gate is_luck) ----

export function getRedeemedIds(): RedeemedEntry[] {
  return getCookie<RedeemedEntry[]>(REDEEMED_IDS_COOKIE) ?? [];
}

export function isRedeemed(id: string | number): boolean {
  return getRedeemedIds().some((e) => String(e.id) === String(id));
}

export function addRedeemedId(id: string | number): void {
  const ids = getRedeemedIds();
  if (ids.some((e) => String(e.id) === String(id))) return;
  const max = MAX_REDEEMED();
  const entry: RedeemedEntry = { id, showingDate: new Date().toISOString() };
  const next =
    ids.length < max ? [...ids, entry] : [...ids.slice(1, max), entry];
  setCookie(REDEEMED_IDS_COOKIE, next);
}

// ---- per-product timer persistence (localStorage; survives hard nav) ----

function readTimers(): Record<string, LuckTimer> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LUCK_TIMERS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function readTimer(id: string | number): LuckTimer | null {
  return readTimers()[String(id)] ?? null;
}

export function writeTimer(
  id: string | number,
  timer: LuckTimer | null,
): void {
  if (typeof window === "undefined") return;
  const all = readTimers();
  if (timer === null) delete all[String(id)];
  else all[String(id)] = timer;
  try {
    localStorage.setItem(LUCK_TIMERS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / disabled storage — non-fatal */
  }
}

// ---- derivation ----

export function computeSecondsLeft(
  timer: LuckTimer | null | undefined,
  now: number,
): number {
  if (!timer) return DEFAULT_LUCK_SECONDS;
  if (timer.expired) return 0;
  if (timer.deadlineTs != null) {
    return Math.max(0, Math.ceil((timer.deadlineTs - now) / 1000));
  }
  return timer.pausedRemaining ?? 0;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: count ≤ Task 0 baseline `N`.

- [ ] **Step 3: Lint the new file**

Run: `pnpm lint 2>&1 | grep "utils/luck" || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add utils/luck/index.ts
git commit -m "feat(luck): persistence + constants util (single source for keys/derivation)"
```

---

### Task 2: `luck` store slice

**Files:**
- Create: `store/luck/reducer.ts`
- Modify: `store/index.ts` (import + spread + type union)

**Interfaces:**
- Consumes: `LuckTimer`, `DEFAULT_LUCK_SECONDS`, `isRedeemed`, `readTimer`, `writeTimer`, `addRedeemedId` from `utils/luck`.
- Produces (on `useAppStore`):
  - state `luckByProduct: Record<string, LuckTimer>`
  - `startLuck(id: string | number, seconds?: number): void`
  - `pauseLuck(id: string | number): void`
  - `resumeLuck(id: string | number): void`
  - `expireLuck(id: string | number): void`

- [ ] **Step 1: Create the slice**

```ts
// store/luck/reducer.ts
import {
  DEFAULT_LUCK_SECONDS,
  LuckTimer,
  addRedeemedId,
  isRedeemed,
  readTimer,
  writeTimer,
} from "utils/luck";

export interface LuckState {
  luckByProduct: Record<string, LuckTimer>;
}

const initialState: LuckState = {
  luckByProduct: {},
};

const key = (id: string | number) => String(id);

export const useLuckStore = (set, get) => ({
  ...initialState,

  /** Begin (or rehydrate) a product's luck window. No-op if already tracked
   *  in-memory or already redeemed; adopts a persisted window if present. */
  startLuck: (id: string | number, seconds: number = DEFAULT_LUCK_SECONDS) => {
    const k = key(id);
    const existing = get().luckByProduct[k];
    if (existing) return;

    if (isRedeemed(id)) {
      const expiredTimer: LuckTimer = {
        deadlineTs: null,
        pausedRemaining: 0,
        expired: true,
      };
      set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: expiredTimer } }));
      return;
    }

    const persisted = readTimer(id);
    const timer: LuckTimer =
      persisted ??
      {
        deadlineTs: Date.now() + seconds * 1000,
        pausedRemaining: null,
        expired: false,
      };
    writeTimer(id, timer);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: timer } }));
  },

  pauseLuck: (id: string | number) => {
    const k = key(id);
    const t = get().luckByProduct[k];
    if (!t || t.expired || t.deadlineTs == null) return; // not running
    const remaining = Math.max(0, Math.ceil((t.deadlineTs - Date.now()) / 1000));
    const next: LuckTimer = {
      deadlineTs: null,
      pausedRemaining: remaining,
      expired: false,
    };
    writeTimer(id, next);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: next } }));
  },

  resumeLuck: (id: string | number) => {
    const k = key(id);
    const t = get().luckByProduct[k];
    if (!t || t.expired || t.pausedRemaining == null) return; // not paused
    const next: LuckTimer = {
      deadlineTs: Date.now() + t.pausedRemaining * 1000,
      pausedRemaining: null,
      expired: false,
    };
    writeTimer(id, next);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: next } }));
  },

  expireLuck: (id: string | number) => {
    const k = key(id);
    const t = get().luckByProduct[k];
    if (t?.expired) return;
    const next: LuckTimer = {
      deadlineTs: null,
      pausedRemaining: 0,
      expired: true,
    };
    writeTimer(id, next);
    addRedeemedId(id);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: next } }));
  },
});
```

- [ ] **Step 2: Wire the slice into the combined store**

In `store/index.ts`:

Add the import after the other slice imports (near line 10):
```ts
import { useLuckStore } from "./luck/reducer";
```

Add to the `AppState` type union (after `ReturnType<typeof useSearchStore> &`, before the inline `{ _hasHydrated ... }` block, ~line 27):
```ts
  ReturnType<typeof useLuckStore> &
```

Add to the spread block (after `...useCartStore(set, get),`, ~line 48):
```ts
      ...useLuckStore(set, get),
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: count ≤ baseline `N`.

- [ ] **Step 4: Lint**

Run: `pnpm lint 2>&1 | grep -E "store/luck|store/index" || echo "clean"`
Expected: `clean`.

- [ ] **Step 5: Manual store smoke (dev console)**

Start `pnpm dev`, open the app, in the browser console:
```js
const s = window; // if store isn't exposed, add temporary `window.__luck = useAppStore` in dev only, then revert
```
Simplest check instead: verify no runtime error on load and `useAppStore.getState().luckByProduct` is `{}` (add a throwaway `console.log` in a client component if needed, then remove). This is a sanity check; the real verification happens in Task 4.

- [ ] **Step 6: Commit**

```bash
git add store/luck/reducer.ts store/index.ts
git commit -m "feat(luck): luck store slice (deadline-based per-product timer state)"
```

---

### Task 3: Shared `useLuckTimer` hook

**Files:**
- Create: `hooks/useLuckTimer.ts`

**Interfaces:**
- Consumes: `useAppStore` from `store`; `computeSecondsLeft`, `isRedeemed` from `utils/luck`.
- Produces: `useLuckTimer(id, opts): { luckActive: boolean; secondsLeft: number }` where
  `opts: { isLuck: boolean; visible?: boolean }` (`visible` defaults to `true`).

- [ ] **Step 1: Create the hook**

```ts
// hooks/useLuckTimer.ts
"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "store";
import { computeSecondsLeft, isRedeemed } from "utils/luck";

interface UseLuckTimerOpts {
  isLuck: boolean;
  /** false when the card is off-screen; the hook also folds in tab-hidden
   *  and in-app navigation. Defaults to true (always-visible surfaces). */
  visible?: boolean;
}

/**
 * Single source of truth for one product's luck countdown.
 * - starts (or rehydrates) the window on mount when `isLuck` and not redeemed
 * - pauses on navigation / tab-hidden / off-screen, resumes from remaining
 * - expires exactly once when the countdown reaches 0 while running
 */
export function useLuckTimer(
  id: string | number,
  { isLuck, visible = true }: UseLuckTimerOpts,
): { luckActive: boolean; secondsLeft: number } {
  const k = String(id);
  const timer = useAppStore((s) => s.luckByProduct[k]);
  const isNavigating = useAppStore((s) => s.isNavigating);
  const startLuck = useAppStore((s) => s.startLuck);
  const pauseLuck = useAppStore((s) => s.pauseLuck);
  const resumeLuck = useAppStore((s) => s.resumeLuck);
  const expireLuck = useAppStore((s) => s.expireLuck);

  const [tabHidden, setTabHidden] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Start / rehydrate the window once, for luck products only.
  useEffect(() => {
    if (isLuck && id != null && !isRedeemed(id)) startLuck(id);
  }, [id, isLuck, startLuck]);

  // Track tab visibility.
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const paused = Boolean(isNavigating) || tabHidden || visible === false;

  // Drive pause/resume from the single gate.
  useEffect(() => {
    if (!isLuck || !timer || timer.expired) return;
    if (paused) pauseLuck(id);
    else resumeLuck(id);
  }, [paused, isLuck, timer?.expired, id, pauseLuck, resumeLuck]);

  // 1-second tick, only while actively running.
  const running = Boolean(timer && !timer.expired && timer.deadlineTs != null);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [running]);

  const secondsLeft = computeSecondsLeft(timer, now);

  // Expire exactly once when a running countdown hits 0.
  useEffect(() => {
    if (running && secondsLeft <= 0 && timer && !timer.expired) {
      expireLuck(id);
    }
  }, [running, secondsLeft, timer?.expired, id, expireLuck]);

  const luckActive = Boolean(isLuck) && !(timer?.expired ?? false);
  return { luckActive, secondsLeft };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: count ≤ baseline `N`.

- [ ] **Step 3: Lint**

Run: `pnpm lint 2>&1 | grep "hooks/useLuckTimer" || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add hooks/useLuckTimer.ts
git commit -m "feat(luck): shared useLuckTimer hook (pause gate + one-shot expiry)"
```

---

### Task 4: Migrate the listing card (fixes the reported bug)

**Files:**
- Modify: `components/products/ProductCard/index.tsx`
- Modify: `components/ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx`
- Modify: `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx`
- Modify: `components/ServerWrapper/ProductWrapper/RenderPrice.tsx`
- Modify: `components/ServerWrapper/ProductWrapper/OfferPrice.tsx`
- Modify: `public/styles/product-card.css`

**Interfaces:**
- Consumes: `useLuckTimer` from `hooks/useLuckTimer`.
- Produces: `RenderPrice` and `OfferPrice` gain a `luckActive: boolean` prop (replacing internal reliance on `is_luck` + CSS). `ProductButtonWrapper` gains `luckActive: boolean` + `secondsLeft: number` props and renders its own countdown/price from them.

- [ ] **Step 1: `OfferPrice` — gate the strike-through on `luckActive`**

Replace the whole file `components/ServerWrapper/ProductWrapper/OfferPrice.tsx`:
```tsx
export const OfferPrice = ({ price, luckActive }) => {
  return (
    <span
      className="old-price ml-[3px] relative bold color-dark-gray flex f-12 "
      data-cy="product-offer-price"
    >
      {price}
      {luckActive && (
        <svg
          className="absolute w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="1"
        >
          <line
            x2="100%"
            transform="translate(0 0.5)"
            fill="none"
            strokeLinecap="round"
            stroke="#ff6200"
            strokeWidth="1"
          />
        </svg>
      )}
    </span>
  );
};
```
(Note: `redeem_show` class removed — visibility is now the `luckActive` conditional.)

- [ ] **Step 2: `RenderPrice` — pass `luckActive` through**

Replace the whole file `components/ServerWrapper/ProductWrapper/RenderPrice.tsx`:
```tsx
import { RoundPrice } from "utils/server";
import { OfferPrice } from "./OfferPrice";

export const RenderPrice = ({
  luckActive,
  flash_price,
  offer_price,
  price,
  currency,
}) => {
  return (
    <OfferPrice
      luckActive={luckActive}
      price={RoundPrice({
        num: flash_price ?? offer_price ?? price,
        rate: currency?.exchange_rate,
        points: currency?.decimal_digits,
      })}
    />
  );
};
```

- [ ] **Step 3: `ProductButtonWrapper` — become presentational (no timer, no DOM)**

Replace the whole file `components/ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx`:
```tsx
"use client";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";

function ProductButtonWrapper({
  language,
  currency,
  is_luck,
  luckActive = false,
  secondsLeft = 0,
  id,
  luck_price,
  slug,
  InitialProductData = {},
  sizes_filters = null,
}) {
  const isRtl = language === "ar" || language === "ku";

  const AddToCart = () => {
    const { setSelectedProductForCart } = useAppStore.getState();
    setSelectedProductForCart({
      ...InitialProductData,
      shouldUpdate: 0,
      id: id,
      showRedeemPrice: luckActive,
      is_from_listing: true,
      sizes_filters: sizes_filters?.length > 0 ? sizes_filters : undefined,
      seconds: luckActive ? secondsLeft : 0,
    });
  };

  return (
    <>
      <div
        style={{
          left: !isRtl ? "initial" : "0px",
          right: isRtl ? "initial" : "0px",
          direction: isRtl ? "rtl" : "ltr",
        }}
        className="buy-button pb-[10px] px-[4px] light-text flex-col align-start justify-end cursor-pointer absolute z-50 bottom-0 pr-[10px] h-[40px] items-center"
        data-cy="buy-button"
        onClick={(e) => {
          e.preventDefault();
          AddToCart();
        }}
      >
        {luckActive && (
          <div className="flex flex-row items-center gap-[2px] w-full justify-end">
            <ClockIcon />
            <div className="flex flex-row text-[#ff6200]">
              <span id={`counter-${id}`} className="bold text-[10px]">
                -{secondsLeft}
              </span>
              <span>{translateFunction("s", language)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-row items-center product_prices gap-[6px]">
          <div
            className={`text-[10px] pt-[2px] flex align-start regular items-center gap-[2px] ${
              luckActive ? "text-[#ff6200]" : "text-[#1d1d1d]"
            }`}
          >
            <span>{translateFunction("Buy", language)}</span>
            {luckActive && (
              <RedeemPrice
                price={RoundPrice({
                  num: luck_price,
                  rate: currency?.exchange_rate,
                  language: language,
                  points: currency?.decimal_digits,
                })}
                symbol={currency?.symbol}
              />
            )}
          </div>
          <img
            src={"/icons/BuyButton.svg"}
            width={15}
            height={15}
            alt="buy Button"
            className="max-h-[20px] max-w-[40px]"
          />
        </div>
      </div>

      {luckActive && (
        <div
          className="absolute pr-[5px] pl-[8px] text-nowrap flex-row h-[19px] gap-[2px] items-center top-[-8px] left-0 z-99 rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px] bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px] flex"
          style={{ border: "1px solid #FF6200", direction: isRtl ? "rtl" : "ltr" }}
        >
          <ClockIcon />
          <span className="whitespace-nowrap bold">
            {translateFunction("Luck!", language)}{" "}
          </span>
          <span className="whitespace-nowrap ">
            {translateFunction("Add To Bag Within ", language)}
          </span>
          <span className="whitespace-nowrap bold ">{secondsLeft}</span>
          <span className="whitespace-nowrap ">
            {translateFunction("seconds", language)}
          </span>
        </div>
      )}
    </>
  );
}

export default ProductButtonWrapper;

const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.77,1.235,7.4,1.874l1.28.739.369-.639a.37.37,0,0,0-.136-.505L8.275,1.1A.369.369,0,0,0,7.77,1.235Z" fill="#ff6200" />
    <path d="M5.5,1.664a4.845,4.845,0,0,1,.688.055v-.6l.473,0V.344A.344.344,0,0,0,6.316,0H4.687a.344.344,0,0,0-.344.344v.773l.469,0v.6A4.845,4.845,0,0,1,5.5,1.664Z" fill="#ff6200" />
    <path d="M5.5,2.063A4.469,4.469,0,1,0,9.969,6.531,4.469,4.469,0,0,0,5.5,2.063ZM7.588,8.632l-2.6-1.8V4.284h.751V6.435l2.28,1.579Z" fill="#ff6200" />
  </svg>
);

const RedeemPrice = ({ price, symbol }) => (
  <div className="gap-[2px] items-center flex">
    <span
      className="text-[10px] pt-[2px] flex align-start bold relative text-[#FF5724]"
      data-cy="product-redeem-price"
    >
      {price}
    </span>
    <span className="text-[8px] light pt-[2px] flex align-start">{symbol}</span>
  </div>
);
```
Removed: `useLuckyDrawTimer`, `useState(redeem_expired)`, `onExpire`, `configureRedeemedProducts`, `classList.remove`, `flash`/`endDate` timer math (unused for luck here), and all `redeem_show` classes. `is_luck` prop kept for callers/compat but visibility is driven by `luckActive`.

- [ ] **Step 4: `ProductCard` — own the timer, feed `luckActive`/`secondsLeft` down**

In `components/products/ProductCard/index.tsx`:

Add import near the other imports (top of file):
```tsx
import { useLuckTimer } from "hooks/useLuckTimer";
```

Immediately after the `deriveCardProps` destructure block (after line 71, the `} = p;`), add:
```tsx
  const [inView, setInView] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !is_luck) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [is_luck]);
  const { luckActive, secondsLeft } = useLuckTimer(id, {
    isLuck: Boolean(is_luck),
    visible: inView,
  });
```
Add `useEffect, useRef, useState` to the existing `react` import at the top (add `import { useEffect, useRef, useState } from "react";` if not present).

Change the root `div` (line ~135-138) to attach the ref and drive the class from `luckActive`:
```tsx
    <div
      ref={cardRef}
      id={`product_${slug}`}
      className={`${luckActive ? "product_redeem" : ""}  relative flex`}
    >
```

Change the `<RenderPrice .../>` call (line ~424) to pass `luckActive` (remove `is_luck`):
```tsx
            <RenderPrice
              currency={currency}
              flash_price={flash_price}
              luckActive={luckActive}
              offer_price={offer_price}
              price={price}
            />
```

Change the `<ProductButtonWrapper .../>` call (line ~438) — drop `endDate`/`flash_deal_price`/`is_flashDeal`/`offer_price`/`price`, add `luckActive`/`secondsLeft`:
```tsx
      <ProductButtonWrapper
        InitialProductData={InitialProductData}
        slug={slug}
        currency={currency}
        id={id}
        is_luck={is_luck}
        luckActive={luckActive}
        secondsLeft={secondsLeft}
        language={language}
        luck_price={luck_price}
        sizes_filters={sizes_filters}
      />
```
Leave the `shouldShowOrangeBorder()` image-border logic as-is for this task (it keys off `is_luck || isFlash`; border color reverting on expiry is covered by the `.product_redeem` CSS in Step 6 — the image uses `product-media-redeem-show`, which is scoped under `.product_redeem`).

- [ ] **Step 5: `ProductColorsCards` — read the same window per product id**

In `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx`:

Make it a client component and use the hook once per product (the color cards are variants of the same `InitialProductData.id`). Add at the very top:
```tsx
"use client";
import { useLuckTimer } from "hooks/useLuckTimer";
```
Inside the component body, before `return (`:
```tsx
  const { luckActive, secondsLeft } = useLuckTimer(InitialProductData?.id, {
    isLuck: Boolean(InitialProductData?.is_luck),
  });
```
Change the `<RenderPrice .../>` call (line ~145): replace `is_luck={InitialProductData?.is_luck}` with `luckActive={luckActive}`.

Change the `<ProductButtonWrapper .../>` call (line ~159): add `luckActive={luckActive}` and `secondsLeft={secondsLeft}`; it may keep passing `is_luck` for compat.

- [ ] **Step 6: CSS — drop the display toggle, keep styling**

Replace `public/styles/product-card.css` with:
```css
.product_redeem .buy-card-text {
  color: #ff6200 !important;
}
.product-media-redeem-show {
  border: 1px solid #d3d3d3 !important;
}
.product_redeem .product-media-redeem-show {
  border: 1px solid #ff6200 !important;
}
.buy-card-text {
  color: #1d1d1d;
}
```
Removed: `.redeem_show { display:none !important }` and `.product_redeem .redeem_show { display:flex !important }` (visibility is now React-driven).

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: count ≤ baseline `N`.

- [ ] **Step 8: Lint**

Run: `pnpm lint 2>&1 | grep -E "ProductCard|ProductButtonWrapper|ProductColorsCards|RenderPrice|OfferPrice" || echo "clean"`
Expected: `clean`.

- [ ] **Step 9: Manual verification (the bug)**

`pnpm dev`, open a listing with a luck product:
1. Badge + `-Ns` counter + orange luck price + orange strike-through + orange border/Buy-text all render.
2. Let the counter reach 0 **while the card is on screen** → **all** of them revert to the normal price atomically. ✅ (primary bug)
3. Reload with the counter mid-run, then navigate away (skeleton) and back → the countdown was **paused** during navigation and resumes from the remaining seconds; it does not sit stuck at 0. ✅
4. Scroll the card off-screen and back → pauses/resumes. Switch browser tabs and back → pauses/resumes.
5. Open the color bottom-sheet → variant cards show the **same** remaining seconds and expire together with the main card.

- [ ] **Step 10: Commit**

```bash
git add components/products/ProductCard/index.tsx \
  components/ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx \
  components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx \
  components/ServerWrapper/ProductWrapper/RenderPrice.tsx \
  components/ServerWrapper/ProductWrapper/OfferPrice.tsx \
  public/styles/product-card.css
git commit -m "refactor(luck): listing card renders luck UI declaratively from useLuckTimer

Fixes luck price persisting after the counter expires; removes imperative
classList/onExpire and the per-variant timer race; navigation now pauses."
```

---

### Task 5: Migrate the Add-to-Cart sheet

**Files:**
- Modify: `components/Cart/AddToCart/ExtraInfoArea.tsx`
- Modify: `components/Cart/AddToCart/AddToCartComponent.tsx`
- Modify: `components/Cart/AddToCart/Button.tsx`
- Modify: `components/Cart/AddToCart/PricesRow.tsx`
- Modify: `components/Cart/AddToCart/Card.tsx`

**Interfaces:**
- Consumes: `useLuckTimer` from `hooks/useLuckTimer`; `isRedeemed` from `utils/luck`.
- Produces: the sheet reads `{ luckActive, secondsLeft }` for the selected product id; `LuckEnd`/`expireLuck`/`hideRedeemPriceIfItsStillShown`/`localStorage("counter")` are removed. `ExtraInfoArea` gains `luckActive`/`secondsLeft` props.

- [ ] **Step 1: `ExtraInfoArea` — render the luck bar from props, delete DOM/Timer hacks**

In `components/Cart/AddToCart/ExtraInfoArea.tsx`:
- Add `luckActive` and `secondsLeft` to the component props.
- Delete `configureRedeemedProducts`, `hideRedeemPriceIfItsStillShown`, and `getCounters` (all dead once the shared engine drives state).
- Remove the `import Timer from "components/Login/Timer";` line.
- In the `if (isLuck)` branch, replace the `<Timer ... />` element with the live seconds and gate the whole branch on `luckActive`:

Replace the `if (isLuck) { return ( ... ) }` block's `<Timer>` usage:
```tsx
            <span className="bold">{secondsLeft}</span>
```
and change the branch guard from `if (isLuck)` to `if (isLuck && luckActive)`.

(Keep the rest of the bar markup — `ClockIcon`, "Luck!", "Add To Bag Within", `luck_price`, symbol, border svg — unchanged.)

- [ ] **Step 2: `AddToCartComponent` — drive luck from the engine**

In `components/Cart/AddToCart/AddToCartComponent.tsx`:
- Add near the top of the component body (after `ProductData` is available):
```tsx
  const { luckActive, secondsLeft } = useLuckTimer(ProductData?.id, {
    isLuck: Boolean(ProductData?.is_luck),
  });
```
with `import { useLuckTimer } from "hooks/useLuckTimer";` and `import { isRedeemed } from "utils/luck";`.
- Replace `shouldShowLuck()`'s body to use the util (line ~260):
```tsx
  const shouldShowLuck = () => {
    if (!ProductData.is_luck) return false;
    return !isRedeemed(ProductData?.id);
  };
```
- Delete the local `configureRedeemedProducts` (line ~291) — redeemed recording now happens in `expireLuck` inside the engine.
- Replace both `LuckEnd={() => { ... querySelector(".product-redeem-counter") ... }}` (line ~907) and `expireLuck={() => { ... querySelector(".product-redeem-counter") ... }}` (line ~971) with no-ops or remove the props entirely (the engine owns expiry). If `ExtraInfoArea`/`Button` no longer accept them, delete the props.
- Pass `luckActive={luckActive}` and `secondsLeft={secondsLeft}` to `<ExtraInfoArea>` (line ~904 area) and drop the `isLuck={ProductData?.is_luck && shouldShowLuck()}` in favor of `isLuck={ProductData?.is_luck}` + the new `luckActive`.
- Remove the `key={ProductData?.is_luck}` remount hack (line ~957) if present on the button (no longer needed; state is external).

- [ ] **Step 3: `Button.tsx` — remove `expireLuck` prop usage**

In `components/Cart/AddToCart/Button.tsx`: remove the `expireLuck` param (line ~28) and its call (line ~296). Adding to cart already records redemption via the engine when appropriate; if the intent was "adding to cart ends the luck window," call the store instead:
```tsx
// at top: import { useAppStore } from "store";  (already imported in this file)
// where expireLuck() was called:
useAppStore.getState().expireLuck(product?.id);
```
(Keep this only if the product is currently luck-active; guard with `if (product?.is_luck) ...`.)

- [ ] **Step 4: `PricesRow.tsx` / `Card.tsx` — gate luck price on the engine**

In `components/Cart/AddToCart/PricesRow.tsx`: replace `shouldShowLuck()` (reads cookie directly, line ~21) with the `isRedeemed` util for consistency:
```tsx
import { isRedeemed } from "utils/luck";
// ...
  const shouldShowLuck = () => !isRedeemed(id);
```
`Card.tsx`'s `Prices` shows `luck_price` when `luck_price > 0`; leave as-is (it's fed a gated `luck_price` by the parent). Verify no `redeem`/DOM logic remains.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: count ≤ baseline `N`.

- [ ] **Step 6: Lint**

Run: `pnpm lint 2>&1 | grep "Cart/AddToCart" || echo "clean"`
Expected: `clean`.

- [ ] **Step 7: Manual verification**

Tap Buy on a luck card → sheet opens:
1. The luck bar shows the **same** countdown continuing from the card (not reset to 50).
2. Let it reach 0 in the sheet → the luck bar and luck price disappear; normal price shown.
3. Add the product to the bag → the luck window ends and does not reappear for that product.
4. No console errors; no `#product-redeem-counter` reach-in.

- [ ] **Step 8: Commit**

```bash
git add components/Cart/AddToCart/ExtraInfoArea.tsx \
  components/Cart/AddToCart/AddToCartComponent.tsx \
  components/Cart/AddToCart/Button.tsx \
  components/Cart/AddToCart/PricesRow.tsx \
  components/Cart/AddToCart/Card.tsx
git commit -m "refactor(luck): add-to-cart sheet reads shared luck engine (no Timer/DOM hacks)"
```

---

### Task 6: Migrate the product page + fix the cookie-name bug

**Files:**
- Modify: `components/products/ProductRedeemCounter.tsx`
- Modify: `components/Server/product/ProductPhotoSliderWrapper.tsx`
- Modify: `components/Product/ProductFooter.tsx`
- Modify: `components/Server/product/ProductPrices/PricesRowClientLogic.tsx`

**Interfaces:**
- Consumes: `useLuckTimer` from `hooks/useLuckTimer`; `REDEEMED_IDS_COOKIE` from `utils/luck`.

- [ ] **Step 1: Fix the two misspelled cookie reads**

In `components/Server/product/ProductPhotoSliderWrapper.tsx:27` change:
```tsx
    let redeemed: any = await getCookieServer<any[]>("redemed_ids");
```
In `components/Product/ProductFooter.tsx:37` change the same `"redeemd_ids"` → `"redemed_ids"`.
(Prefer importing `REDEEMED_IDS_COOKIE` from `utils/luck` and using it, to prevent recurrence.)

- [ ] **Step 2: Rewrite `ProductRedeemCounter` onto the hook**

Replace `components/products/ProductRedeemCounter.tsx` with a declarative version:
```tsx
"use client";
import { useLuckTimer } from "hooks/useLuckTimer";
import { translateFunction } from "utils/functions";

function ProductRedeemCounter({ language, product_id }) {
  const { luckActive, secondsLeft } = useLuckTimer(product_id, {
    isLuck: true, // only rendered by the server when the product is luck-eligible
  });
  if (!luckActive) return null;

  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      id="product-redeem-counter"
      className={`${
        isRtl
          ? "flex-row-reverse right-0 rounded-tl-[4px] rounded-tr-[15px] rounded-br-[4px] rounded-bl-[15px]"
          : "flex-row left-0 rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px]"
      } flex absolute pr-[5px] pl-[8px] text-nowrap h-[19px] gap-[2px] items-center top-[5px] z-99999999999 bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px]`}
      style={{ border: "1px solid #FF6200" }}
    >
      <ClockIcon />
      <span className="whitespace-nowrap bold">
        {translateFunction("Luck!", language)}
      </span>
      <span className="whitespace-nowrap ">
        {translateFunction("Add To Bag Within ", language)}
      </span>
      <span className="whitespace-nowrap bold">{secondsLeft}</span>
      <span className="whitespace-nowrap ">
        {translateFunction("seconds", language)}
      </span>
    </div>
  );
}

export default ProductRedeemCounter;

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">
    <path d="M7.77,1.235,7.4,1.874l1.28.739.369-.639a.37.37,0,0,0-.136-.505L8.275,1.1A.369.369,0,0,0,7.77,1.235Z" fill="#ff6200" />
    <path d="M5.5,1.664a4.845,4.845,0,0,1,.688.055v-.6l.473,0V.344A.344.344,0,0,0,6.316,0H4.687a.344.344,0,0,0-.344.344v.773l.469,0v.6A4.845,4.845,0,0,1,5.5,1.664Z" fill="#ff6200" />
    <path d="M5.5,2.063A4.469,4.469,0,1,0,9.969,6.531,4.469,4.469,0,0,0,5.5,2.063ZM7.588,8.632l-2.6-1.8V4.284h.751V6.435l2.28,1.579Z" fill="#ff6200" />
  </svg>
);
```
Removed: `localStorage("counter")`, `getCounters`, `finishCounter`, `configureRedeemedProducts`, the `<Timer>` and `Spinner`, the store `selected_product_for_add_to_cart` dependency, and all DOM `querySelector`/`style.display` mutation.

- [ ] **Step 3: `PricesRowClientLogic` — read redeemed state via util**

In `components/Server/product/ProductPrices/PricesRowClientLogic.tsx:18`, keep the redeemed check but source the key from `utils/luck` (`getCookie(REDEEMED_IDS_COOKIE)`), so all readers agree. If it also needs live luck state, use `useLuckTimer(id, { isLuck })` and gate on `luckActive`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: count ≤ baseline `N`.

- [ ] **Step 5: Lint**

Run: `pnpm lint 2>&1 | grep -E "ProductRedeemCounter|ProductPhotoSliderWrapper|ProductFooter|PricesRowClientLogic" || echo "clean"`
Expected: `clean`.

- [ ] **Step 6: Manual verification**

1. Open a luck product page → counter runs; reaching 0 removes the badge and the luck price reverts (product page).
2. Card → tap product → land on the product page: the countdown **continues** the same window (not reset).
3. After the window expires (or add-to-cart), **reload** the product page → it is shown as **non-luck** (cookie-name fix: the page now honors `redemed_ids`).

- [ ] **Step 7: Commit**

```bash
git add components/products/ProductRedeemCounter.tsx \
  components/Server/product/ProductPhotoSliderWrapper.tsx \
  components/Product/ProductFooter.tsx \
  components/Server/product/ProductPrices/PricesRowClientLogic.tsx
git commit -m "refactor(luck): product page on shared engine + fix redeemd_ids cookie typo"
```

---

### Task 7: Dead-code sweep + final verification

**Files:**
- Delete/trim: `components/ListingPage/LuckyDrawer.tsx` (if `useLuckyDrawTimer` now has no importers)
- Verify: no remaining `localStorage("counter")`, `redeem_show`, `querySelector("#product-redeem-counter"|".product-redeem-counter")`, or `redeemd_ids` in the tree.

- [ ] **Step 1: Find orphaned luck code**

Run:
```bash
grep -rn "useLuckyDrawTimer" --include=*.tsx --include=*.ts . | grep -v node_modules
grep -rn "redeem_show\|product-redeem-counter\|localStorage.*counter\|\"counter\"\|redeemd_ids" --include=*.tsx --include=*.ts . | grep -v node_modules
```
Expected: only definitions with no consumers (safe to delete) and no stray `redeemd_ids`/`redeem_show`.

- [ ] **Step 2: Delete `LuckyDrawer.tsx` if unused**

If `grep` shows `useLuckyDrawTimer` has no importers, delete `components/ListingPage/LuckyDrawer.tsx`. If something still imports it, resolve that first.

- [ ] **Step 3: Knip for unused exports/files**

Run: `pnpm knip 2>&1 | grep -iE "luck|redeem|LuckyDrawer" || echo "clean"`
Expected: no unexpected luck-related unused exports (or clean).

- [ ] **Step 4: Full type-check + lint**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (≤ baseline `N`) and `pnpm lint`.

- [ ] **Step 5: Production build sanity**

Run: `pnpm build`
Expected: build succeeds (no type errors, no failed pages).

- [ ] **Step 6: End-to-end manual pass (the journey)**

One luck product, one sitting: card counter → 0 reverts everything; navigate away/back pauses+resumes; card → sheet → product page is one continuous window; after expiry, reloading each surface shows non-luck; color variants share one window. No console errors, no residual orange UI after expiry anywhere.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(luck): remove dead LuckyDrawer/counter/redeem_show code after unification"
```

---

## Self-Review

**Spec coverage:**
- §3.1 luck slice → Task 2. §3.2 hook → Task 3. §3.3 persistence + cookie-typo fix → Task 1 (util) + Task 6 Step 1. §3.4 declarative rendering / DOM-hack removal → Tasks 4–6 + Task 7. §3.5 color-variant single window → Task 4 Step 5. §2.1 root-cause bug → Task 4. §6 validation → the manual steps in Tasks 4–7. All spec sections mapped.
- Out-of-scope items (cookie rename, backend `is_luck`, OTP `Timer`) are respected — `Login/Timer.tsx` is untouched; server `is_luck` gating unchanged.

**Placeholder scan:** engine code (util, slice, hook) is complete and literal. Consumer edits give exact before/after snippets and line anchors; large files (`AddToCartComponent`, `ProductButtonWrapper`) show the specific blocks to change rather than dumping 900 lines — anchors + snippets are the actual content needed.

**Type consistency:** `LuckTimer` shape, `startLuck/pauseLuck/resumeLuck/expireLuck` names, `useLuckTimer(id, { isLuck, visible })` → `{ luckActive, secondsLeft }`, `computeSecondsLeft`, `REDEEMED_IDS_COOKIE`, `DEFAULT_LUCK_SECONDS` are used identically across Tasks 1→6. `RenderPrice`/`OfferPrice` switch from `is_luck` to `luckActive` consistently (Task 4 Steps 1–2, 4–5).
