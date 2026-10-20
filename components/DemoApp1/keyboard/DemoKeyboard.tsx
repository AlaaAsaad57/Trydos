"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsTouchDevice } from "hooks/useIsTouchDevice";
import { useDemoDebug } from "../../DemoApp/demoDebug";
import { DEMO_KEYBOARD, NATIVE_TEXT_KEYBOARD } from "../../DemoApp/demoKeyboard";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  COLUMN_W,
  EDGE_ANCHOR,
  PAGE_MAX,
  SHEET,
  UNDER_BAR,
} from "../demo1Layout";
import {
  isPad,
  kindOf,
  letterRows,
  padRows,
  startsSentence,
  type Action,
  type FieldKind,
  type Key,
  type Language,
  type PadKey,
  type Page,
} from "./layouts";
import {
  deleteBackward,
  insertText,
  textBefore,
  type TextField,
} from "./typeInto";

/**
 * The demo's own keyboard: the iOS 26 keyboard, drawn by the page.
 *
 * On a phone or a tablet it takes the place of the device's keyboard for
 * the number fields of the demo. The letters (a name, an address, an email, a
 * search) are typed with the device's own keyboard while NATIVE_TEXT_KEYBOARD
 * is on (demoKeyboard.ts): those fields are not touched here. With a mouse and
 * a real keyboard it is never shown.
 *
 * How the device's keyboard is kept away
 * --------------------------------------
 * Every number field on the page gets `inputmode="none"`: the browser then
 * gives the field focus and a caret, but opens no keyboard and no form bar.
 * What the field asked for (`decimal`, `tel`, `numeric`, …) is kept on it as
 * `data-kb`, and picks the keys shown here. The fields are marked by this
 * component (`adopt`), also the ones that come later with a sheet, so a screen
 * needs no change to use the keyboard.
 *
 * How it types
 * ------------
 * The field in use keeps the focus: a key stops the press from moving it.
 * The key then writes into the field through `typeInto.ts`, and the field's
 * own `onChange` runs.
 *
 * Where it is
 * -----------
 * On <body>, in the document: an `absolute` anchor with no size, kept at the
 * window's end while the page scrolls, like a sheet's layer (Layer in ui.tsx).
 * Safari 26 draws a fixed box only down to the window's end, which is above
 * its floating bar; only the document is drawn under the bar. So the panel
 * runs on under the bar (UNDER_BAR) and the bar lies on the keyboard's glass.
 * The keys end with the window, over the bar.
 *
 * Its glass is as wide as the page column. Its keys are as wide as Safari's
 * bar (BAR_SIDE of padding on each side). It has the bar's glass, so the
 * two read as one set.
 *
 * It moves nothing: no scroll, no room added to the page, no sheet moved up.
 * A field that is under the keys stays there until the shopper scrolls to it.
 */

const TEXT_FIELD =
  'input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]):not([type="button"]):not([type="submit"]), textarea';

/** The field's own `inputmode`, kept so it can be given back. */
const NATIVE_MODE = "data-kb-native";

/**
 * What a field asks for. Read from the field itself, not only from the mark:
 * a field that takes the focus the moment it is added is read before the
 * sweep has marked it.
 */
function kindFor(field: Element): FieldKind {
  const mark = field.getAttribute("data-kb");
  if (mark) return mark as FieldKind;
  const mode = field.getAttribute("inputmode");
  return kindOf(field.getAttribute("type") ?? "text", mode === "none" ? null : mode);
}

/**
 * Whether this keyboard types into the field. With NATIVE_TEXT_KEYBOARD the
 * letters go to the device's keyboard, so only the number pads are ours.
 * `NATIVE_TEXT_KEYBOARD` is read here, when asked, and not once at load.
 */
const ownsField = (field: Element) =>
  !NATIVE_TEXT_KEYBOARD || isPad(kindFor(field));

/**
 * Marks a field for this keyboard and keeps the device's keyboard off it.
 * A field this keyboard does not own is not touched at all: it keeps its own
 * `inputmode`, so the device's keyboard opens on it as it always did. Writing
 * nothing also keeps the observer in `DemoKeyboard` from seeing a change.
 */
function adopt(field: Element) {
  if (!ownsField(field)) return;
  const mode = field.getAttribute("inputmode");
  if (mode === "none" && field.hasAttribute("data-kb")) return;
  if (mode !== "none") field.setAttribute(NATIVE_MODE, mode ?? "");
  field.setAttribute(
    "data-kb",
    kindOf(field.getAttribute("type") ?? "text", mode === "none" ? null : mode),
  );
  field.setAttribute("inputmode", "none");
}

/** Gives a field back to the device's keyboard. */
function release(field: Element) {
  const mode = field.getAttribute(NATIVE_MODE);
  if (mode === null) return;
  if (mode === "") field.removeAttribute("inputmode");
  else field.setAttribute("inputmode", mode);
  field.removeAttribute(NATIVE_MODE);
  field.removeAttribute("data-kb");
}

const isTextField = (el: unknown): el is TextField =>
  el instanceof HTMLElement &&
  el.matches(TEXT_FIELD) &&
  !(el as TextField).readOnly &&
  !(el as TextField).disabled;

/** A text field this keyboard types into: the keyboard comes up on its focus. */
const isOurField = (el: unknown): el is TextField =>
  isTextField(el) && ownsField(el);

type Shift = "off" | "on" | "lock";

const SPRING = {
  type: "spring" as const,
  damping: 32,
  stiffness: 380,
  mass: 0.75,
};

/**
 * The keyboard's sizes, in px, measured on screenshots of the iOS 26 keyboard
 * (a 402 pt iPhone): keys 6 apart and 10 under each other, 22 between the
 * panel's top and the first keys, corners 8.5 on a key and 26 on the panel.
 */
const TOP = 16;

/**
 * How far Safari 26's floating bar starts from each side of the screen, in
 * px. Measured on a picture from a 440 pt iPhone; the keyboard is as wide.
 */
const BAR_SIDE = 34;

/**
 * The dark keyboard's colours. The phone's dark theme uses them, and so does
 * the debug switch that shows the dark keyboard on a light phone.
 */
const DARK = `
    --dkb-panel: linear-gradient(180deg, rgba(34, 36, 42, 0.52), rgba(18, 19, 23, 0.58));
    --dkb-rim: linear-gradient(165deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.08) 28%, rgba(255, 255, 255, 0.02) 62%, rgba(255, 255, 255, 0.22));
    --dkb-glow: rgba(255, 255, 255, 0.12);
    --dkb-key: rgba(255, 255, 255, 0.19);
    --dkb-key-edge: rgba(255, 255, 255, 0.22);
    --dkb-down: rgba(255, 255, 255, 0.42);
    --dkb-pop: rgba(112, 112, 118, 0.98);
    --dkb-ink: #ffffff;
    --dkb-soft: rgba(235, 235, 245, 0.75);
    --dkb-shade: 0 1px 2px rgba(0, 0, 0, 0.3);
    --dkb-lens: blur(40px) saturate(170%) brightness(0.8);
`;
const CHIN = 58;

/**
 * The height of one row of keys with the gap under it. The iPhone's keys are
 * taller on a wider phone: 52 on a 402 pt screen, 56 on a 440 pt one.
 */
const rowHeight = () =>
  Math.round(
    Math.min(56, Math.max(52, Math.min(window.innerWidth, PAGE_MAX) * 0.128)),
  );
/** Under the number pad there is no globe key, only a little room. */
const PAD_CHIN = 14;

const STYLE = `
.dkb {
  /* The colour of Safari's bar, measured on pictures from the iPhone. The
     bar's pills are white at about 48 %, and they lie on this panel's tail,
     which Safari fades to about a sixth under its bar. A panel at 53 % then
     has the pills' colour, whatever the page's colour is. */
  --dkb-panel: rgba(255, 255, 255, 0.53);
  --dkb-rim: linear-gradient(165deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.2) 28%, rgba(255, 255, 255, 0.06) 62%, rgba(255, 255, 255, 0.55));
  --dkb-glow: rgba(255, 255, 255, 0.55);
  --dkb-key: rgba(255, 255, 255, 0.96);
  --dkb-key-edge: rgba(255, 255, 255, 0.95);
  --dkb-down: rgba(255, 255, 255, 0.55);
  --dkb-pop: rgba(255, 255, 255, 0.97);
  --dkb-ink: #000000;
  --dkb-soft: rgba(40, 40, 46, 0.78);
  /* Over a white page the panel is white too: the shade is what shows a key. */
  --dkb-shade: 0 1px 2.5px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  --dkb-lens: blur(24px) saturate(180%);
  color: var(--dkb-ink);
  font-family: -apple-system, "SF Pro Text", system-ui, sans-serif;
  /* Liquid glass: a thin tint, so the page shows through; the blur, the
     strong colour and the bright rim are what make it read as glass. */
  background: var(--dkb-panel);
  -webkit-backdrop-filter: var(--dkb-lens);
  backdrop-filter: var(--dkb-lens);
  box-shadow: inset 0 1.5px 1px var(--dkb-glow), inset 0 10px 24px -12px var(--dkb-glow),
    0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  /* The top corners are the sheets' (the wallet sheets' 50); the bottom ones
     run on under Safari's bar. */
  border-radius: ${SHEET.radiusWallet}px ${SHEET.radiusWallet}px 26px 26px;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}
/* The rim of the glass: a 1 px line that is bright where the light falls
   (top left, bottom right) and nearly gone between. */
.dkb::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background: var(--dkb-rim);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  pointer-events: none;
}
@media (prefers-color-scheme: dark) {
  .dkb {
${DARK}  }
}
.dkb[data-theme="dark"] {
${DARK}}
.dkb-row { display: flex; height: var(--dkb-row); }
.dkb-cell {
  position: relative;
  min-width: 0;
  padding: 5px 3px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.dkb-face {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 8.5px;
  background: var(--dkb-key);
  box-shadow: inset 0 1px 0 var(--dkb-key-edge), var(--dkb-shade);
  font-size: 25px;
  line-height: 1;
  transition: background-color 0.05s;
}
.dkb-mod .dkb-face { font-size: 17px; }
.dkb-go .dkb-face { background: #007aff; color: #ffffff; }
.dkb-down .dkb-face { background: var(--dkb-down); }
.dkb-pop {
  position: absolute;
  left: -22%;
  bottom: calc(100% - 9px);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 144%;
  height: 60px;
  border-radius: 14px;
  background: var(--dkb-pop);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  font-size: 36px;
  pointer-events: none;
}
.dkb-chin {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${CHIN}px;
  padding: 0 16px 4px;
  color: var(--dkb-soft);
}
.dkb-chin button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
}
`;

export default function DemoKeyboard({
  locale,
  t,
}: {
  /** The locale segment, e.g. `sy-ar`: the page's language picks the first letters. */
  locale: string;
  t: (key: DemoKey) => string;
}) {
  const touch = useIsTouchDevice();
  const { darkKeyboard } = useDemoDebug();
  const on = touch && DEMO_KEYBOARD;

  const [field, setField] = useState<TextField | null>(null);
  const [language, setLanguage] = useState<Language>(
    locale.split("-")[1] === "ar" ? "ar" : "en",
  );
  const [page, setPage] = useState<Page>("letters");
  const [shift, setShift] = useState<Shift>("off");
  const [down, setDown] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const repeat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shiftAt = useRef(0);

  const kind: FieldKind =
    (field?.getAttribute("data-kb") as FieldKind | null) ?? "text";
  const pad = isPad(kind);
  // An email is typed in Latin letters, whatever the page's language.
  const letters: Language = kind === "email" ? "en" : language;
  const row = on ? rowHeight() : 54;

  // Every text field on the page is marked for this keyboard, and so is each
  // one that comes later (a sheet, a new screen).
  useEffect(() => {
    if (!on) return;
    const sweep = (root: ParentNode) => {
      if (root instanceof Element && root.matches(TEXT_FIELD)) adopt(root);
      root.querySelectorAll(TEXT_FIELD).forEach(adopt);
    };
    sweep(document.body);
    const watch = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "attributes") {
          const target = change.target as Element;
          if (target.matches(TEXT_FIELD)) adopt(target);
        } else
          change.addedNodes.forEach((node) => {
            if (node instanceof Element) sweep(node);
          });
      }
      // A field that left the page with its sheet gives no blur.
      setField((now) => (now && !now.isConnected ? null : now));
    });
    watch.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inputmode"],
    });
    return () => {
      watch.disconnect();
      document.querySelectorAll(`[${NATIVE_MODE}]`).forEach(release);
    };
  }, [on]);

  // The keyboard follows the focus: up on a text field, away when no text
  // field has it.
  useEffect(() => {
    if (!on) {
      setField(null);
      return;
    }
    const take = (next: TextField) => {
      setField(next);
      setPage("letters");
      setDown(null);
      setShift(
        startsSentence(
          textBefore(next),
          (next.getAttribute("data-kb") as FieldKind | null) ?? "text",
        )
          ? "on"
          : "off",
      );
    };
    const onIn = (e: FocusEvent) => {
      if (!isTextField(e.target)) return;
      // A letter field of the device's own keyboard: the page's keyboard,
      // up for the number field before it, goes away.
      if (isOurField(e.target)) take(e.target);
      else setField(null);
    };
    const onOut = () =>
      // A moment later: the focus may be on its way to the next field.
      setTimeout(() => {
        if (!isOurField(document.activeElement)) setField(null);
      }, 0);
    if (isOurField(document.activeElement)) take(document.activeElement);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, [on]);

  // A tap on the page outside the field in use puts the keyboard away. On
  // the click, not on the press: a scroll of the page must not close it, and
  // a sheet hands its taps to its fields on the click.
  useEffect(() => {
    if (!field) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || panel.current?.contains(target)) return;
      // The demo's own switches: the tester changes the keyboard's theme
      // or the page's colour with the keyboard up.
      if (target.closest('[data-pw="demo-controls"]')) return;
      setTimeout(() => {
        if (document.activeElement !== field) return;
        // The tap was on the field, or on the small box drawn round it.
        for (
          let box: Element | null = target;
          box && box.getBoundingClientRect().height <= 150;
          box = box.parentElement
        )
          if (box.contains(field)) return;
        field.blur();
      }, 0);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [field]);

  const stopRepeat = () => {
    if (repeat.current) {
      clearTimeout(repeat.current);
      clearInterval(repeat.current);
      repeat.current = null;
    }
  };
  useEffect(() => {
    if (!field) stopRepeat();
    return stopRepeat;
  }, [field]);

  const shown = field !== null;

  // The anchor is in the document, so it follows the window's end by hand.
  useLayoutEffect(() => {
    if (!shown) return;
    const follow = () => {
      if (anchor.current)
        anchor.current.style.top = `${window.scrollY + window.innerHeight}px`;
    };
    follow();
    window.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", follow);
    };
  }, [shown]);

  // A press on the keys must not take the focus off the field.
  useEffect(() => {
    const box = panel.current;
    if (!shown || !box) return;
    const keep = (e: Event) => e.preventDefault();
    box.addEventListener("touchstart", keep, { passive: false });
    box.addEventListener("mousedown", keep);
    return () => {
      box.removeEventListener("touchstart", keep);
      box.removeEventListener("mousedown", keep);
    };
  }, [shown]);

  const afterTyping = (to: TextField) => {
    if (shift === "lock") return;
    setShift(startsSentence(textBefore(to), kind) ? "on" : "off");
  };

  const type = (char: string) => {
    if (!field) return;
    insertText(field, shift === "off" ? char : char.toUpperCase());
    afterTyping(field);
  };

  const erase = () => {
    if (!field) return;
    deleteBackward(field);
    afterTyping(field);
  };

  const act = (action: Action) => {
    if (!field) return;
    switch (action) {
      case "shift": {
        const now = Date.now();
        const twice = now - shiftAt.current < 300;
        shiftAt.current = now;
        setShift(twice ? "lock" : shift === "off" ? "on" : "off");
        return;
      }
      case "back":
        erase();
        // Held down: after 400 ms it goes on, one character every 80 ms.
        stopRepeat();
        repeat.current = setTimeout(() => {
          repeat.current = setInterval(erase, 80) as unknown as ReturnType<
            typeof setTimeout
          >;
        }, 400);
        return;
      case "numbers":
      case "symbols":
      case "letters":
        setPage(action);
        return;
      case "space":
        type(" ");
        return;
      case "return": {
        const went = field.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        );
        if (!went) return;
        if (field instanceof HTMLTextAreaElement) type("\n");
        else field.blur();
        return;
      }
    }
  };

  /** The press of one key: `id` names it for the pressed look. */
  const press = (id: string, run: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      setDown(id);
      run();
    },
    onPointerUp: () => {
      stopRepeat();
      setDown(null);
    },
    onPointerLeave: () => {
      stopRepeat();
      setDown((now) => (now === id ? null : now));
    },
    onPointerCancel: () => {
      stopRepeat();
      setDown(null);
    },
  });

  const actionLabel: Record<Action, DemoKey> = {
    shift: "Shift",
    back: "Delete",
    numbers: "Numbers",
    symbols: "Symbols",
    letters: "Letters",
    space: "Space",
    return: kind === "search" ? "Search" : "Return",
  };

  const actionFace = (action: Action) => {
    switch (action) {
      case "shift":
        return <ShiftIcon state={shift} />;
      case "back":
        return <BackIcon />;
      case "numbers":
        return "123";
      case "symbols":
        return "#+=";
      case "letters":
        return letters === "ar" ? "أ ب ج" : "ABC";
      case "space":
        return null;
      case "return":
        return kind === "search" ? <SearchIcon /> : <ReturnIcon />;
    }
  };

  const drawKey = (key: Key, i: number) => {
    if (key.type === "gap")
      return <div key={i} style={{ flex: `${key.grow} 1 0` }} />;
    if (key.type === "char") {
      const face =
        page === "letters" && shift !== "off"
          ? key.char.toUpperCase()
          : key.char;
      const id = `char-${key.char}`;
      return (
        <button
          key={id}
          type="button"
          tabIndex={-1}
          data-pw={`kb-key-${key.char}`}
          className={`dkb-cell ${down === id ? "dkb-down" : ""}`}
          style={{ flex: `${key.grow ?? 1} 1 0` }}
          {...press(id, () => type(key.char))}
        >
          <span className="dkb-face">{face}</span>
          {down === id && <span className="dkb-pop">{face}</span>}
        </button>
      );
    }
    const { action } = key;
    return (
      <button
        key={action}
        type="button"
        tabIndex={-1}
        aria-label={t(actionLabel[action])}
        aria-pressed={action === "shift" ? shift !== "off" : undefined}
        data-pw={`kb-${action}`}
        data-shift={action === "shift" ? shift : undefined}
        className={`dkb-cell ${action === "space" ? "" : "dkb-mod"} ${action === "return" && kind === "search" ? "dkb-go" : ""} ${down === action ? "dkb-down" : ""}`}
        style={{ flex: `${key.grow} 1 0` }}
        {...press(action, () => act(action))}
      >
        <span className="dkb-face">{actionFace(action)}</span>
      </button>
    );
  };

  const drawPadKey = (key: PadKey, i: number) => {
    if (key.type === "empty") return <div key={i} style={{ flex: "1 1 0" }} />;
    if (key.type === "action")
      return (
        <button
          key="back"
          type="button"
          tabIndex={-1}
          aria-label={t("Delete")}
          data-pw="kb-back"
          className={`dkb-cell dkb-mod ${down === "back" ? "dkb-down" : ""}`}
          style={{ flex: "1 1 0" }}
          {...press("back", () => act("back"))}
        >
          <span className="dkb-face" style={{ background: "none", boxShadow: "none" }}>
            <BackIcon />
          </span>
        </button>
      );
    const id = `char-${key.char}`;
    return (
      <button
        key={id}
        type="button"
        tabIndex={-1}
        data-pw={`kb-key-${key.char}`}
        className={`dkb-cell ${down === id ? "dkb-down" : ""}`}
        style={{ flex: "1 1 0" }}
        {...press(id, () => type(key.char))}
      >
        <span className="dkb-face">{key.char}</span>
      </button>
    );
  };

  if (!on || typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {field && (
          <div
            key="keyboard"
            ref={anchor}
            style={{
              ...EDGE_ANCHOR,
              position: "absolute",
              top: window.scrollY + window.innerHeight,
              zIndex: 2147483647,
            }}
          >
            <motion.div
              ref={panel}
              dir="ltr"
              data-pw="demo-keyboard"
              data-kind={kind}
              data-language={pad ? undefined : letters}
              data-page={pad ? "pad" : page}
              // "app": the phone's theme. "dark": the debug switch.
              data-theme={darkKeyboard ? "dark" : "app"}
              className="dkb"
              style={{
                position: "absolute",
                // The page column. The padding keeps the keys as wide as
                // Safari's bar.
                left: `calc(${COLUMN_W} / -2)`,
                right: `calc(${COLUMN_W} / -2)`,
                // The glass runs on under Safari's bar; the keys end
                // with the window.
                bottom: -UNDER_BAR,
                padding: `${TOP}px ${BAR_SIDE + 3}px ${UNDER_BAR}px`,
                ["--dkb-row" as string]: `${row}px`,
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SPRING}
            >
              <style>{STYLE}</style>
              {pad
                ? padRows(kind).map((row, r) => (
                    <div key={r} className="dkb-row">
                      {row.map(drawPadKey)}
                    </div>
                  ))
                : letterRows(letters, page, kind).map((row, r) => (
                    <div key={r} className="dkb-row">
                      {row.map(drawKey)}
                    </div>
                  ))}
              {pad ? (
                <div style={{ height: PAD_CHIN }} />
              ) : (
                <div className="dkb-chin">
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={t("Next keyboard")}
                    data-pw="kb-globe"
                    {...press("globe", () => {
                      setLanguage(letters === "en" ? "ar" : "en");
                      setPage("letters");
                    })}
                  >
                    <GlobeIcon />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

const icon = (w: number, h: number) => ({
  width: w,
  height: h,
  viewBox: `0 0 ${w} ${h}`,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  style: { pointerEvents: "none" as const },
});

function ShiftIcon({ state }: { state: Shift }) {
  return (
    <svg {...icon(22, 22)} fill={state === "off" ? "none" : "currentColor"}>
      <path d="M11 2.5 2.5 11.5h4.6v4h7.8v-4h4.6L11 2.5Z" />
      {state === "lock" && <path d="M7.1 19.5h7.8" strokeWidth={2} />}
    </svg>
  );
}

function BackIcon() {
  return (
    <svg {...icon(26, 20)}>
      <path d="M9 1.5h13a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H9L1.5 10 9 1.5Z" />
      <path d="m12.5 6.5 7 7m0-7-7 7" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg {...icon(22, 20)}>
      <path d="M19 3.5v6a3 3 0 0 1-3 3H4" />
      <path d="m8 8-4.5 4.5L8 17" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...icon(20, 20)} strokeWidth={2}>
      <circle cx="8.5" cy="8.5" r="6" />
      <path d="m13 13 5 5" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg {...icon(24, 24)}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c2.6 2.6 4 5.900 4 9.500s-1.400 6.900-4 9.500c-2.600-2.600-4-5.900-4-9.500s1.400-6.900 4-9.500Z" />
    </svg>
  );
}
