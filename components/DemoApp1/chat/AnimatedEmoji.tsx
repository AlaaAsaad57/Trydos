"use client";

import type { AnimationItem } from "lottie-web";
import React, { useEffect, useLayoutEffect, useRef } from "react";

/**
 * The reaction emojis as animated emojis, the way Telegram shows its own:
 * each one is a small Lottie animation that plays once and rests on its first
 * frame (the plain emoji). They are Google's Noto animated emoji (CC BY 4.0,
 * see public/assets/demo/emoji/LICENSE.txt). The files are named by code point.
 *
 * Until the animation is loaded (or if it cannot be), the phone's own emoji
 * is drawn instead, so the bar never shows an empty cell.
 */
const CODE: Record<string, string> = {
  // WhatsApp primary reaction bar
  "👍": "1f44d",
  "❤️": "2764_fe0f",
  "😂": "1f602",
  "😮": "1f62e",
  "😢": "1f622",
  "🙏": "1f64f",
  "😘": "1f618",

  // Popular expanded reaction set
  "🔥": "1f525",
  "🎉": "1f389",
  "👏": "1f44f",
  "😍": "1f60d",
  "🤔": "1f914",
  "😊": "1f60a",
  "🤣": "1f923",
  "😉": "1f609",
  "🤩": "1f929",
  "😎": "1f60e",
  "👀": "1f440",
  "💯": "1f4af",
  "🚀": "1f680",
  "✨": "2728",
  "💔": "1f494",
  "👎": "1f44e",
  "💀": "1f480",
  "🙌": "1f64c",
  "🫡": "1fae1",
  "😱": "1f631",
  "🥳": "1f973",
  "🥺": "1f97a",
  "🤝": "1f91d",
  "🤯": "1f92f",
  "😏": "1f60f",
  "✅": "2705",

  // Smileys & Emotion
  "🥰": "1f970",
  "😜": "1f61c",
  "🤪": "1f92a",
  "🤑": "1f911",
  "🤤": "1f924",
  "😴": "1f634",
  "🤐": "1f910",
  "🤨": "1f928",
  "😐": "1f610",
  "😑": "1f611",
  "🙄": "1f644",
  "😬": "1f62c",
  "🤥": "1f925",
  "😌": "1f60c",
  "😔": "1f614",
  "😷": "1f637",
  "🤒": "1f912",
  "🤕": "1f915",
  "🤢": "1f922",
  "🤮": "1f92e",
  "🤧": "1f927",
  "🥵": "1f975",
  "🥶": "1f976",
  "🥴": "1f974",
  "😵": "1f635",
  "🤠": "1f920",
  "🥸": "1f978",
  "🤓": "1f913",
  "🧐": "1f9d0",
  "😕": "1f615",
  "😟": "1f61f",
  "🙁": "1f641",
  "☹️": "2639_fe0f",
  "😯": "1f62f",
  "😲": "1f632",
  "😳": "1f633",
  "🥹": "1f979",
  "😦": "1f626",
  "😧": "1f627",
  "😨": "1f628",
  "😰": "1f630",
  "😥": "1f625",
  "😭": "1f62d",
  "😖": "1f616",
  "😣": "1f623",
  "😞": "1f61e",
  "😓": "1f613",
  "😩": "1f629",
  "😫": "1f62b",
  "🥱": "1f971",
  "😤": "1f624",
  "😡": "1f621",
  "😠": "1f620",
  "🤬": "1f92c",
  "😈": "1f608",
  "👿": "1f47f",
  "💩": "1f4a9",
  "🤡": "1f921",
  "👻": "1f47b",
  "👽": "1f47d",
  "👾": "1f47e",
  "🤖": "1f916",

  // Gestures & People
  "🫶": "1faf6",
  "✌️": "270c_fe0f",
  "🤞": "1f91e",
  "🤟": "1f91f",
  "🤘": "1f918",
  "🤙": "1f919",
  "👋": "1f44b",
  "👌": "1f44c",
  "🤌": "1f90f",
  "👊": "1f44a",
  "🤛": "1f91b",
  "🤜": "1f91c",
  "💪": "1f4aa",

  // Hearts
  "🧡": "1f9e1",
  "💛": "1f49b",
  "💚": "1f49a",
  "💙": "1f499",
  "💜": "1f49c",
  "🖤": "1f5a4",
  "🤍": "1f90d",
  "🤎": "1f90e",
  "💖": "1f496",
  "💗": "1f497",
  "💓": "1f493",
  "💞": "1f49e",
  "💕": "1f495",
  "💘": "1f498",
  "💝": "1f49d",

  // Objects, Nature & Activities
  "💥": "1f4a5",
  "🌟": "1f31f",
  "⭐": "2b50",
  "⚡": "26a1",
  "🌈": "1f308",
  "💎": "1f48e",
  "🏆": "1f3c6",
  "🥇": "1f947",
  "🎁": "1f381",
  "🎈": "1f388",
  "🎊": "1f38a",
  "🍾": "1f37e",
  "🍻": "1f37b",
  "☕": "2615",
  "🍕": "1f355",
  "🍔": "1f354",
  "🥑": "1f951",
  "🍩": "1f369",
  "🍦": "1f366",
  "🍿": "1f37f",
  "🎯": "1f3af",
  "🎶": "1f3b6",
  "🔔": "1f514",
  "💡": "1f4a1",
  "❌": "274c",
  "⚠️": "26a0_fe0f",
  "❓": "2753",
  "❗": "2757",
};

/** All emojis that have local animated files bundled in /assets/demo/emoji/. */
export const SUPPORTED_EMOJIS = Object.keys(CODE);

/** Primary reactions shown in the quick reaction bar. */
export const PRIMARY_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "😘"] as const;

/** Extended popular reactions ready for emoji pickers and more-reactions sheets. */
export const POPULAR_REACTIONS = [
  "🔥", "🎉", "👏", "😍", "🤔", "😊", "🤣", "😉",
  "🤩", "😎", "👀", "💯", "🚀", "✨", "💔", "👎",
  "💀", "🙌", "🫡", "😱", "🥳", "🥺", "🤝", "🤯",
  "😏", "✅",
] as const;

/** Converts an emoji character into its Noto Lottie hex code point. */
export function emojiToCode(emoji: string): string {
  if (CODE[emoji]) return CODE[emoji];
  const clean = emoji.replace(/\uFE0F/g, "");
  if (CODE[clean]) return CODE[clean];
  const withVs = clean + "\uFE0F";
  if (CODE[withVs]) return CODE[withVs];

  return Array.from(emoji)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("_");
}

/** No animation runs in the unit tests' fake browser (it has no canvas). */
const canAnimate = () =>
  typeof navigator !== "undefined" && !/jsdom/i.test(navigator.userAgent);

type Lottie = typeof import("lottie-web").default;
/** One emoji's animation, already built, in a box of its own that can be moved. */
type Item = { code: string; box: HTMLSpanElement; anim: AnimationItem };

let player: Promise<Lottie> | null = null;
const files = new Map<string, Promise<string>>();
/** The built animations nobody shows right now, pooled per emoji code. */
const MAX_POOL = 3;
const idle = new Map<string, Item[]>();

const loadPlayer = () => (player ??= import("lottie-web").then((m) => m.default));
const loadFile = (code: string) => {
  let file = files.get(code);
  if (!file) {
    file = fetch(`/assets/demo/emoji/${code}.json`).then((r) => {
      if (r.ok) return r.text();
      // Dynamic fallback to official Noto Emoji Lottie CDN if not stored locally.
      return fetch(`https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/lottie.json`).then(
        (cdnRes) => {
          if (!cdnRes.ok) throw new Error(`emoji ${code}: ${cdnRes.status}`);
          return cdnRes.text();
        },
      );
    });
    // A failed load is tried again the next time.
    file.catch(() => files.delete(code));
    files.set(code, file);
  }
  return file;
};

/** Builds an emoji's animation: the player writes its drawing into a box that stays with the item. */
async function build(code: string): Promise<Item> {
  const [lottie, text] = await Promise.all([loadPlayer(), loadFile(code)]);
  const box = document.createElement("span");
  box.style.cssText =
    "position:absolute;inset:0;display:block;transform:translateZ(0);backface-visibility:hidden";
  const anim = lottie.loadAnimation({
    container: box,
    renderer: "svg",
    loop: false,
    autoplay: false,
    // Parsed again for each one: the player writes into its data.
    animationData: JSON.parse(text),
  });
  anim.goToAndStop(0, true);
  return { code, box, anim };
}

/** An animation that is ready now, or null (then `build` it). Built ones are not built again. */
const takeIdle = (code: string): Item | null => {
  const list = idle.get(code);
  if (!list || list.length === 0) return null;
  const item = list.pop()!;
  if (list.length === 0) idle.delete(code);
  return item;
};

/**
 * An emoji leaves the screen: it rests on its first frame and waits for the
 * next one that wants it, up to MAX_POOL instances per code.
 */
function giveBack(item: Item) {
  item.anim.goToAndStop(0, true);
  item.box.remove();
  const list = idle.get(item.code);
  if (!list) {
    idle.set(item.code, [item]);
  } else if (list.length < MAX_POOL) {
    list.push(item);
  } else {
    item.anim.destroy();
  }
}

/**
 * Builds the player and emojis ahead of time, one after the other so no frame
 * carries the whole bill. Pre-warms 2 instances per primary reaction so both
 * message chips and the quick reaction bar always have warm instances ready.
 */
export function preloadAnimatedEmojis(emojis: readonly string[] = PRIMARY_REACTIONS) {
  if (!canAnimate()) return;
  let step = 0;
  for (const emoji of emojis) {
    const code = emojiToCode(emoji);
    if (!code) continue;
    const copies = emojis === PRIMARY_REACTIONS ? 2 : 1;
    for (let c = 0; c < copies; c++) {
      const wait = 80 + step * 55;
      step++;
      setTimeout(() => {
        const list = idle.get(code);
        if (list && list.length >= copies) return;
        build(code)
          .then((item) => giveBack(item))
          .catch(() => {});
      }, wait);
    }
  }
}

/**
 * One animated emoji. `play` is a counter: every new value (above 0) runs the
 * animation once from the start, after `delay` seconds. 0 leaves it resting.
 * `lazy` defers building until the element is within the scroll viewport.
 */
export default function AnimatedEmoji({
  emoji,
  size,
  play = 0,
  delay = 0,
  lazy = false,
}: {
  emoji: string;
  size: number;
  play?: number;
  delay?: number;
  lazy?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const holder = useRef<HTMLSpanElement>(null);
  const fallback = useRef<HTMLSpanElement>(null);
  const item = useRef<Item | null>(null);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playRef = useRef({ play, delay });
  playRef.current = { play, delay };
  const code = emojiToCode(emoji);

  const triggerPlay = (p: number, d: number) => {
    if (playTimer.current) {
      clearTimeout(playTimer.current);
      playTimer.current = null;
    }
    if (!p || !item.current) return;
    playTimer.current = setTimeout(() => {
      item.current?.anim.goToAndPlay(0, true);
    }, d * 1000);
  };

  // A layout effect: an emoji that is ready goes on in the first frame via direct
  // DOM opacity updates (zero extra React re-renders during menu opening).
  useLayoutEffect(() => {
    const el = holder.current;
    const fb = fallback.current;
    const container = root.current;
    if (!code || !el || !fb || !canAnimate()) return;
    let dead = false;
    let obs: IntersectionObserver | null = null;
    let deferTimer: ReturnType<typeof setTimeout> | null = null;

    const show = (it: Item) => {
      item.current = it;
      el.appendChild(it.box);
      el.style.opacity = "1";
      fb.style.opacity = "0";
      if (playRef.current.play > 0) {
        triggerPlay(playRef.current.play, playRef.current.delay);
      }
    };

    const loadNow = () => {
      if (dead || item.current) return;
      const now = takeIdle(code);
      if (now) {
        show(now);
      } else {
        build(code)
          .then((it) => {
            if (dead) giveBack(it);
            else show(it);
          })
          .catch(() => {});
      }
    };

    const warm = takeIdle(code);
    if (warm) {
      show(warm);
    } else if (lazy && typeof IntersectionObserver !== "undefined" && container) {
      obs = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            obs?.disconnect();
            obs = null;
            deferTimer = setTimeout(loadNow, 16);
          }
        },
        { rootMargin: "40px" },
      );
      obs.observe(container);
    } else {
      loadNow();
    }

    return () => {
      dead = true;
      obs?.disconnect();
      if (deferTimer) clearTimeout(deferTimer);
      if (playTimer.current) {
        clearTimeout(playTimer.current);
        playTimer.current = null;
      }
      if (item.current) giveBack(item.current);
      item.current = null;
      el.style.opacity = "0";
      fb.style.opacity = "1";
    };
  }, [code, lazy]);

  useEffect(() => {
    if (!play || !item.current) return;
    triggerPlay(play, delay);
    return () => {
      if (playTimer.current) {
        clearTimeout(playTimer.current);
        playTimer.current = null;
      }
    };
  }, [play, delay]);

  return (
    <span
      ref={root}
      aria-hidden="true"
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        ref={holder}
        className="absolute inset-0 block"
        style={{ opacity: 0 }}
      />
      <span
        ref={fallback}
        className="block select-none"
        style={{ fontSize: size * 0.9, lineHeight: 1, opacity: 1 }}
      >
        {emoji}
      </span>
    </span>
  );
}
