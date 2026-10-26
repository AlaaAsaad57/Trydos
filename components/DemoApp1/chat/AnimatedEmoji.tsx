"use client";

import type { AnimationItem } from "lottie-web";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

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
/** The built animations nobody shows right now, one per emoji. */
const idle = new Map<string, Item>();

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
  box.style.cssText = "position:absolute;inset:0;display:block";
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
  const item = idle.get(code);
  if (!item) return null;
  idle.delete(code);
  return item;
};

/**
 * An emoji leaves the screen: it rests on its first frame and waits for the
 * next one that wants it. The second one of a kind is not kept.
 */
function giveBack(item: Item) {
  item.anim.goToAndStop(0, true);
  item.box.remove();
  if (idle.has(item.code)) item.anim.destroy();
  else idle.set(item.code, item);
}

/**
 * Builds the player and emojis ahead of time, one after the other so no frame
 * carries the whole bill. By default preloads the primary reaction bar emojis.
 */
export function preloadAnimatedEmojis(emojis: readonly string[] = PRIMARY_REACTIONS) {
  if (!canAnimate()) return;
  emojis.forEach((emoji, i) => {
    const code = emojiToCode(emoji);
    if (!code) return;
    setTimeout(() => {
      if (idle.has(code)) return;
      build(code)
        .then((item) => {
          if (idle.has(code)) item.anim.destroy();
          else idle.set(code, item);
        })
        .catch(() => {});
    }, 150 + i * 120);
  });
}

/**
 * One animated emoji. `play` is a counter: every new value (above 0) runs the
 * animation once from the start, after `delay` seconds. 0 leaves it resting.
 */
export default function AnimatedEmoji({
  emoji,
  size,
  play = 0,
  delay = 0,
}: {
  emoji: string;
  size: number;
  play?: number;
  delay?: number;
}) {
  const holder = useRef<HTMLSpanElement>(null);
  const item = useRef<Item | null>(null);
  const [ready, setReady] = useState(false);
  const code = emojiToCode(emoji);

  // A layout effect: an emoji that is ready goes on in the first frame, with no
  // glimpse of the phone's own one first.
  useLayoutEffect(() => {
    const el = holder.current;
    if (!code || !el || !canAnimate()) return;
    let dead = false;
    const show = (it: Item) => {
      item.current = it;
      el.appendChild(it.box);
      setReady(true);
    };
    const now = takeIdle(code);
    if (now) show(now);
    else
      build(code)
        .then((it) => {
          if (dead) giveBack(it);
          else show(it);
        })
        .catch(() => {});
    return () => {
      dead = true;
      if (item.current) giveBack(item.current);
      item.current = null;
      setReady(false);
    };
  }, [code]);
  useEffect(() => {
    if (!play || !ready) return;
    const run = setTimeout(() => item.current?.anim.goToAndPlay(0, true), delay * 1000);
    return () => clearTimeout(run);
  }, [play, ready, delay]);

  return (
    <span
      aria-hidden="true"
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        ref={holder}
        className="absolute inset-0 block"
        style={{ opacity: ready ? 1 : 0 }}
      />
      <span
        className="block select-none"
        style={{ fontSize: size * 0.9, lineHeight: 1, opacity: ready ? 0 : 1 }}
      >
        {emoji}
      </span>
    </span>
  );
}
