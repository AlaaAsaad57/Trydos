import { cubicBezier } from "framer-motion";
import { C } from "../demo1Layout";

/**
 * The product's flight into the bag, in four steps:
 *
 *  1. Lift: a copy of the photo rises a little off its place and grows by 3.5 %.
 *  2. Flight: the copy follows a curve to the bag. Early on it gets small and its
 *     box closes to a circle with a thin white edge and a soft shadow, so it
 *     reads as one object over the card's own photo. Two faint copies follow the
 *     small circle as a soft trail.
 *  3. Landing: the copy is gone at the moment the bag's ring takes the item
 *     (`onLand`). The ring's photo, the count and the bag are React's part.
 *  4. Answer: two thin rings spread out of the bag's ring, small stars burst
 *     around it, and the bag gives a small push and glows purple for a moment.
 *
 * Small stars in the bag's own purple and yellow also twinkle where the copy has
 * just passed, and drift down a little as they fade.
 *
 * Web Animations and plain DOM, not React and not a frame loop. The browser can
 * run transform and opacity away from the main thread, so the flight stays
 * smooth while the tap re-renders the sheet. The bag's state changes on landing
 * only, through `onLand`.
 *
 * The copies hang on a fixed point with no size, like every fixed thing of the
 * demo (see EDGE_ANCHOR in demo1Layout.ts): Safari 26 must find no box as wide
 * as the screen at the window's edge.
 *
 * The motion does not ask for prefers-reduced-motion, because this demo shows
 * motion to its owner, whose machine has that setting on. The real app must
 * decide this separately.
 */

/** Over everything, also the bag: the same top z-index, and later on the page. */
const TOP_Z = "2147483647";

/** The part of the time that goes to the lift. */
const LIFT = 0.2;
const STEPS = 48;
const LIFT_UP = 8;
const LIFT_SCALE = 1.035;
/** The largest tilt on the way, in degrees. */
const TILT = 5;

/** How far the curve swings out to the side, as a part of the way, and the most it may in px. */
const SWING = 0.28;
const SWING_MAX = 110;

/** The part of the time the box takes to close to a circle, after the lift. */
const CLOSE = 0.34;
/** The white edge, as a part of the circle's width: about 1.3 px on the bag's ring. */
const EDGE = 0.03;
/** The soft shadow's width, as a part of the circle's width. */
const SHADOW = 1.5;

/** How strong each copy of the trail is. */
const TRAIL = [0.34, 0.16] as const;
/** How far apart the trail's copies are at the flight's top speed, and the most they may wait, in ms. */
const TRAIL_GAP = 40;
const TRAIL_WAIT_MAX = 55;
/** A smootherstep's top speed is 1.875 times its mean speed. */
const TOP_SPEED = 1.875;

/** A star with four points, in a 24 px box. */
const STAR = "M12 0C12.8 7.6 16.4 11.2 24 12C16.4 12.8 12.8 16.4 12 24C11.2 16.4 7.6 12.8 0 12C7.6 11.2 11.2 7.6 12 0Z";
/** The bag's purple, its yellow handle, and a lighter purple that also shows on the dark page. */
const STAR_COLORS = [C.purple, "#FFC44D", "#A79BFF"] as const;
/** When a star comes up behind the copy, as a part of the flight's time. Only once the copy is a small circle. */
const DUST_AT = [0.46, 0.54, 0.62, 0.7, 0.78, 0.86] as const;
const DUST_MS = 640;
/** How many stars burst around the ring on landing, and how far they go in px. */
const BURST = 8;
const BURST_NEAR = 30;
const BURST_FAR = 50;
const BURST_MS = 680;
/** The bag's own shadow (BagPill), and its short purple glow on landing. */
const BAG_SHADOW = "0 3px 3px rgba(0, 0, 0, 0.161)";
const BAG_GLOW = "0 0 22px rgba(74, 49, 231, 0.55)";

/** Slow at both ends, with no jump in speed (a "smootherstep"). */
const smooth = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);

const bezier = (a: number, b: number, c: number, d: number, p: number) => {
  const q = 1 - p;
  return q * q * q * a + 3 * q * q * p * b + 3 * q * p * p * c + p * p * p * d;
};

const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/**
 * The copy's transform at each step of the time. The curve starts by going out
 * to the side away from the bag, where the screen has room, and it comes to the
 * bag from below.
 */
function flightPath(from: DOMRect, to: DOMRect, startScale: number, ease: (u: number) => number) {
  const s = centre(from);
  const e = centre(to);
  const way = Math.hypot(e.x - s.x, e.y - s.y);
  const side = e.x >= window.innerWidth / 2 ? -1 : 1;
  const swing = Math.min(way * SWING, SWING_MAX) * side;
  const a = { x: s.x + swing, y: s.y - LIFT_UP - way * 0.12 };
  const b = { x: e.x + swing * 0.5, y: e.y + way * 0.38 };
  const endScale = to.width / Math.min(from.width, from.height);
  /** The copy's middle at time `t` of the flight (0 to 1). */
  const at = (t: number) => {
    if (t < LIFT) return { x: s.x, y: s.y - LIFT_UP * smooth(t / LIFT) };
    const p = ease((t - LIFT) / (1 - LIFT));
    return { x: bezier(s.x, a.x, b.x, e.x, p), y: bezier(s.y - LIFT_UP, a.y, b.y, e.y, p) };
  };

  const frames: Keyframe[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const { x, y } = at(t);
    let scale: number;
    let tilt = 0;
    if (t < LIFT) {
      const u = smooth(t / LIFT);
      scale = startScale + (LIFT_SCALE - startScale) * u;
    } else {
      const u = (t - LIFT) / (1 - LIFT);
      const p = ease(u);
      // Even steps of scale look even in size only on a log scale. The power makes
      // the copy small early, while the way it has gone is still short.
      scale = LIFT_SCALE * Math.pow(endScale / LIFT_SCALE, Math.pow(p, 0.6));
      tilt = Math.sin(Math.PI * p) * TILT * side;
    }
    frames.push({
      transform: `translate3d(${(x - from.width / 2).toFixed(2)}px, ${(y - from.height / 2).toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
    });
  }
  return { frames, at };
}

/** The copy's box closes from the photo's shape to the circle in its middle. */
function closingClip(from: DOMRect, round: readonly [number, number, number, number]) {
  const d = Math.min(from.width, from.height);
  const v = (from.height - d) / 2;
  const h = (from.width - d) / 2;
  return [
    { clipPath: `inset(0px 0px 0px 0px round ${round.map((r) => `${r}px`).join(" ")})` },
    { clipPath: `inset(${v}px ${h}px ${v}px ${h}px round ${d / 2}px ${d / 2}px ${d / 2}px ${d / 2}px)` },
  ];
}

/** The soft shadow and the white edge of the main copy, both on the circle in the box's middle. */
function circleParts(box: HTMLElement, from: DOMRect, duration: number) {
  const d = Math.min(from.width, from.height);
  const shadow = document.createElement("div");
  const w = d * SHADOW;
  shadow.style.cssText = `position:absolute;left:${(from.width - w) / 2}px;top:${(from.height - w) / 2 + d * 0.06}px;width:${w}px;height:${w}px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,0,0,0.42), rgba(0,0,0,0.26) 62%, rgba(0,0,0,0));opacity:0;`;
  box.prepend(shadow);
  const edge = document.createElement("div");
  edge.style.cssText = `position:absolute;left:${(from.width - d) / 2}px;top:${(from.height - d) / 2}px;width:${d}px;height:${d}px;box-sizing:border-box;border-radius:50%;border:${d * EDGE}px solid #fff;opacity:0;`;
  box.appendChild(edge);
  const closed = LIFT + CLOSE;
  const show = [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: closed - 0.1 },
    { opacity: 1, offset: closed },
    { opacity: 1, offset: 0.95 },
    { opacity: 0, offset: 1 },
  ];
  const timing = { duration, easing: "linear", fill: "both" } as const;
  shadow.animate(show, timing);
  edge.animate(show, timing);
}

function photoCopy(src: string, from: DOMRect) {
  const box = document.createElement("div");
  box.style.cssText = `position:absolute;left:0;top:0;width:${from.width}px;height:${from.height}px;will-change:transform,opacity;`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.decoding = "sync";
  img.style.cssText = "display:block;width:100%;height:100%;object-fit:cover;max-width:none;";
  box.appendChild(img);
  return { box, img };
}

/** A thin ring that spreads out of the place the item landed. */
function ripple(anchor: HTMLElement, at: DOMRect, delay: number, peak: number) {
  const ring = document.createElement("div");
  ring.style.cssText = `position:absolute;left:${at.left}px;top:${at.top}px;width:${at.width}px;height:${at.height}px;border-radius:50%;border:1px solid ${C.purple};opacity:0;`;
  anchor.appendChild(ring);
  return ring.animate(
    [
      { transform: "scale(0.9)", opacity: peak },
      { transform: "scale(2.1)", opacity: 0 },
    ],
    { duration: 620, delay, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  ).finished;
}

const between = (low: number, high: number) => low + Math.random() * (high - low);
const anyColor = () => STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

/** One star at (x, y): it grows, turns, moves by (dx, dy), and shrinks away. */
function twinkle(anchor: HTMLElement, x: number, y: number, dx: number, dy: number, duration: number, delay: number) {
  const size = between(9, 16);
  const star = document.createElement("div");
  star.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;opacity:0;`;
  star.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" style="display:block"><path d="${STAR}" fill="${anyColor()}"/></svg>`;
  anchor.appendChild(star);
  return star.animate(
    [
      // The easing is on each step: over the whole animation it would bring the
      // star's peak far too early, and the star would be gone before it is seen.
      { transform: "translate(0px, 0px) scale(0) rotate(0deg)", opacity: 0, easing: "ease-out" },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(1) rotate(50deg)`, opacity: 1, offset: 0.4, easing: "ease-in" },
      { transform: `translate(${dx}px, ${dy}px) scale(0) rotate(130deg)`, opacity: 0 },
    ],
    { duration, delay, easing: "linear", fill: "both" },
  ).finished;
}

/**
 * Sends a copy of `photo` from the box `from` to the box `to`.
 *
 * `round` is the corners of the photo at `from`. `startScale` under 1 makes the
 * copy grow out of its place first (a tap on the bar's button). `duration` is in
 * ms. `ease` is the flight's curve: null is slow at both ends.
 */
export function flyToBag({
  photo,
  from,
  round,
  to,
  bag,
  bagIcon,
  startScale = 1,
  duration,
  ease,
  onLand,
}: {
  photo: string;
  from: DOMRect;
  round: readonly [number, number, number, number];
  to: DOMRect;
  bag: () => HTMLElement | null;
  bagIcon: () => HTMLElement | null;
  startScale?: number;
  duration: number;
  ease: readonly [number, number, number, number] | null;
  onLand: () => void;
}) {
  const anchor = document.createElement("div");
  anchor.setAttribute("aria-hidden", "true");
  anchor.dataset.pw = "demo-buy-flight";
  anchor.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:${TOP_Z};`;
  document.body.appendChild(anchor);

  const curve = ease ? cubicBezier(ease[0], ease[1], ease[2], ease[3]) : smooth;
  const { frames: path, at } = flightPath(from, to, startScale, curve);
  const clip = closingClip(from, round);
  const clipTiming = {
    duration: duration * CLOSE,
    delay: duration * LIFT,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "both",
  } as const;

  // The wait follows the speed, so the copies keep the same distance on a long
  // flight (from the bar) and on a short one (from the card).
  const way = Math.hypot(centre(to).x - centre(from).x, centre(to).y - centre(from).y);
  const topSpeed = (TOP_SPEED * way) / (duration * (1 - LIFT));
  const wait = Math.min(TRAIL_WAIT_MAX, TRAIL_GAP / topSpeed);

  // The trail goes in first, so the main copy lies over it. It starts only when
  // the copy is a small circle: large faint photos over the card look like a fault.
  [...TRAIL].reverse().forEach((opacity, i) => {
    const delay = wait * (TRAIL.length - i);
    const { box, img } = photoCopy(photo, from);
    anchor.appendChild(box);
    img.animate(clip, { ...clipTiming, delay: clipTiming.delay + delay });
    box.animate(path, { duration, delay, easing: "linear", fill: "both" });
    box.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: LIFT + CLOSE },
        { opacity, offset: LIFT + CLOSE + 0.08 },
        { opacity, offset: 0.86 },
        { opacity: 0, offset: 1 },
      ],
      { duration, delay, easing: "linear", fill: "both" },
    );
  });

  const { box, img } = photoCopy(photo, from);
  circleParts(box, from, duration);
  anchor.appendChild(box);
  img.animate(clip, clipTiming);
  const flight = box.animate(path, { duration, easing: "linear", fill: "both" });
  box.animate(
    [
      { opacity: startScale < 1 ? 0 : 1, offset: 0 },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.95 },
      { opacity: 0, offset: 1 },
    ],
    { duration, easing: "linear", fill: "both" },
  );

  const dust = DUST_AT.map((t) => {
    const { x, y } = at(t);
    return twinkle(anchor, x + between(-16, 16), y + between(-12, 12), between(-8, 8), between(8, 18), DUST_MS, t * duration);
  });

  const land = () => {
    onLand();
    bag()?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.045)", offset: 0.35 },
        { transform: "scale(1)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
    bag()?.animate(
      [{ boxShadow: BAG_SHADOW }, { boxShadow: BAG_GLOW, offset: 0.3 }, { boxShadow: BAG_SHADOW }],
      { duration: 760, easing: "ease-out" },
    );
    bagIcon()?.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-1.5px) scale(1.14)", offset: 0.4 },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: 460, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
    const { x, y } = centre(to);
    const burst = Array.from({ length: BURST }, (_, i) => {
      const angle = ((i + between(-0.25, 0.25)) / BURST) * Math.PI * 2;
      const far = between(BURST_NEAR, BURST_FAR);
      return twinkle(anchor, x, y, Math.cos(angle) * far, Math.sin(angle) * far, BURST_MS, between(0, 70));
    });
    return Promise.all([ripple(anchor, to, 0, 0.6), ripple(anchor, to, 110, 0.28), ...burst, ...dust]);
  };

  flight.finished.then(land, land).finally(() => anchor.remove());
}
