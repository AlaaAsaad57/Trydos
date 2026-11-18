/*
  The order journey: one product goes Buy → Preparing → Shipped → Delivered.

  Everything on the stage is a pure function of one number, `ms`, the time in
  the story. So the same code can play the story, jump to a status, scrub, and
  show a still frame for "reduce motion". Nothing here keeps state between
  frames: the springs are solved from their start time every frame.

  Timing uses only the iOS curves the app already uses:
    flight   [0.16, 1, 0.3, 1]  690 ms   buyMotion.ts FLIGHT_EASE
    spring   0.4 s, bounce 0.3          buyMotion.ts SHEET_TRANSITION
    standard [0.2, 0, 0, 1]             flyToBag.ts
    in-out   [0.45, 0, 0.55, 1]         ListingParts.tsx LABEL_EASE
    exit     [0.36, 0, 0.66, 0]         MessageMenu.tsx CLOSE_TRANSITION
    pop      [0.22, 1.12, 0.36, 1]      MessageMenu.tsx EMOJI_POP_EASE

  The stage is an SVG with viewBox "0 -62 880 196". The line is at y = 110.
*/

export const G = 110;
export const DOTS: readonly number[] = [100, 300, 500, 700];
export const LINE_END = 872;
export const END_MS = 14350;

/* ---------- curves ---------- */

export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

export const EASE = {
  flight: cubicBezier(0.16, 1, 0.3, 1),
  std: cubicBezier(0.2, 0, 0, 1),
  inout: cubicBezier(0.45, 0, 0.55, 1),
  exit: cubicBezier(0.36, 0, 0.66, 0),
  pop: cubicBezier(0.22, 1.12, 0.36, 1),
};

/* The iOS spring: visualDuration 0.4 s, bounce 0.3 (damping ratio 0.7). */
const SPZ = 0.7, SPW = (2 * Math.PI) / 0.4, SPWD = SPW * Math.sqrt(1 - SPZ * SPZ);
export function spring(ms: number) {
  if (ms <= 0) return 0;
  const s = ms / 1000;
  return 1 - Math.exp(-SPZ * SPW * s) * (Math.cos(SPWD * s) + ((SPZ * SPW) / SPWD) * Math.sin(SPWD * s));
}
/* The same spring's answer to one push: a short wobble that dies out. */
export const kick = (ms: number, start: number) =>
  ms < start ? 0 : Math.exp((-SPZ * SPW * (ms - start)) / 1000) * Math.sin((SPWD * (ms - start)) / 1000);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const tw = (ms: number, s: number, d: number, ease: (x: number) => number) => ease(clamp((ms - s) / d));
const sp = (ms: number, s: number) => spring(ms - s);
const D2R = Math.PI / 180;
const deriv = (f: (t: number) => number, t: number, h = 12) => ((f(t + h) - f(t - h)) / (2 * h)) * 1000; // px/s
const deriv2 = (f: (t: number) => number, t: number, h = 12) => ((f(t + h) - 2 * f(t) + f(t - h)) / (h * h)) * 1e6; // px/s²
const P = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;

/*
  A spring-damper pushed by an acceleration a(t) in px/s²:
    θ'' = −ω²θ − 2ζωθ' − gain·a
  solved every 4 ms from t0 to ms. Returns θ, clamped to ±cap.
*/
export function springBody(
  accelAt: (t: number) => number,
  t0: number,
  ms: number,
  hz: number,
  zeta: number,
  gain: number,
  cap: number,
) {
  if (ms <= t0) return 0;
  const w = 2 * Math.PI * hz, dt = 0.004;
  let th = 0, om = 0;
  for (let t = t0; t < ms; t += 4) {
    om += (-w * w * th - 2 * zeta * w * om - gain * accelAt(t)) * dt;
    th += om * dt;
  }
  return clamp(th, -cap, cap);
}

/* 2-bone inverse kinematics. s = +1 bends forward (knee), s = −1 bends back (elbow). */
export function ik(hx: number, hy: number, tx: number, ty: number, a: number, b: number, s: number) {
  let dx = tx - hx, dy = ty - hy, d = Math.hypot(dx, dy);
  const m = a + b - 0.02;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; }
  d = Math.max(d, Math.abs(a - b) + 0.05);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const ang = th - s * al;
  return { jx: hx + a * Math.cos(ang), jy: hy + a * Math.sin(ang), ex: hx + dx, ey: hy + dy };
}

/* ---------- the story's clock ---------- */

/*
  1. Buy        0.15 – 1.95 s  the photo comes up, the Buy icon taps it, it drops onto the Buy dot
  2. Preparing  1.45 – 5.95 s  the employee walks to the Buy dot, squats, lifts the product,
                               turns, carries it to the Preparing dot and packs it
  3. Shipped    5.95 – 10.45 s he carries it to the rocket and loads it; the rocket flies to Delivered
  4. Delivered  9.75 – 14.35 s the truck backs up from the end of the line, takes the product,
                               and drives it to the customer's map
*/
export const T = {
  appear: 1450,
  drop: 1600, dropMs: 360,        // the product falls onto the Buy dot (gravity)
  crouch: 2850, grab: 3300, rise: 3800,
  turn: 3800, turnMs: 220,
  arrive: 5050,                   // at the Preparing dot
  ribbon: 5150, ribbon2: 5350, bow: 5650,
  load: 7530, toss: 7600, tossMs: 420, release: 7920,
  fade: 8250,
};

/* Walk segments: from → to, and +1 for forward, −1 for a step backwards. */
const WALKS = [
  { t0: 1750, t1: 2850, x0: 282, x1: 116, dir: 1 },   // to the product, facing left
  { t0: 4020, t1: 5050, x0: 116, x1: 282, dir: 1 },   // back to the Preparing dot, carrying
  { t0: 5950, t1: 7550, x0: 282, x1: 452, dir: 1 },   // to the rocket, carrying
  { t0: 8000, t1: 8520, x0: 452, x1: 428, dir: -1 },  // two steps back from the rocket
];
export const PRODUCT_REST = { x: DOTS[0], y: G - 1.5 - 13.5 * 0.8 };

/* ---------- the employee ---------- */

export const WALKER = { stride: 26, thigh: 10, shin: 10, upper: 7.4, fore: 7.4, foot: 3.8 };

export function workerX(ms: number) {
  let x = WALKS[0].x0;
  for (const w of WALKS) {
    if (ms >= w.t1) x = w.x1;
    else if (ms > w.t0) return lerp(w.x0, w.x1, EASE.inout((ms - w.t0) / (w.t1 - w.t0)));
  }
  return x;
}
/* −1 while he faces left (walking to the product), +1 after he turns round. */
export const faceAt = (ms: number) => lerp(-1, 1, tw(ms, T.turn, T.turnMs, EASE.inout));
const carrying = (ms: number) => ms >= T.grab && ms < T.release;

/* Walking speed 0..1 (1 = 70 px/s or more). */
const walkAmount = (ms: number) => clamp(Math.abs(deriv(workerX, ms)) / 70);
/* Stride grows with speed. With the product in his arms he takes shorter steps. */
export const strideAt = (amount: number, loaded = false) => WALKER.stride * (0.35 + 0.65 * amount) * (loaded ? 0.86 : 1);

/* Where a foot sits in the stance part of the step (c from 0 to 0.6), before it is planted. */
const stanceRx = (c: number, L: number) => lerp(0.3 * L, -0.3 * L, c / 0.6);
const legC = (phase: number, leg: number) => (((phase + leg * 0.5 + 0.2) % 1) + 1) % 1;

/*
  Walk the legs forward to time ms, 4 ms at a time.

  phase: how many strides he has walked. Each small move adds
  distance ÷ the stride length at that moment.

  Each foot remembers the spot where it touched the line (plant). While it is
  on the line, its offset from the hip is plant − distance, so it stays exactly
  on that spot, even while the stride gets shorter as he slows down. When it
  lifts, it remembers where it left (from), and swings to the next touch-down.
*/
type LegState = { plant: number; from: number };
export function walkState(ms: number) {
  let phase = 0, dist = 0, L = strideAt(0);
  const legs: LegState[] = [0, 1].map((leg) => {
    const c = legC(0, leg);
    return c < 0.6 ? { plant: stanceRx(c, L), from: 0 } : { plant: 0, from: -0.3 * L };
  });
  for (const w of WALKS) {
    const end = Math.min(ms, w.t1);
    for (let t = w.t0; t < end; t += 4) {
      const t1 = Math.min(t + 4, end);
      const ds = w.dir * Math.abs(workerX(t1) - workerX(t));
      L = strideAt(walkAmount((t + t1) / 2), carrying(t));
      const before = [0, 1].map((leg) => legC(phase, leg));
      phase += ds / L;
      dist += ds;
      [0, 1].forEach((leg) => {
        const c0 = before[leg], c1 = legC(phase, leg);
        const was = c0 < 0.6, now = c1 < 0.6;
        if (!was && now) legs[leg].plant = dist + stanceRx(c1, L);       // touches down
        if (was && !now) legs[leg].from = legs[leg].plant - dist;        // lifts off
      });
    }
    if (ms < w.t1) break;
  }
  return { phase, dist, L, legs };
}

/*
  One leg at a time: 60 % of a stride on the line, 40 % in the air.
  On the line the foot stays on its planted spot (see walkState). At the end of
  the stance the heel lifts and the foot turns on its toes (toe-off). At the end
  of the swing the toes point up, so the heel touches the line first (heel strike).
*/
export function legPhase(state: ReturnType<typeof walkState>, leg: number, amount: number, dirSign: number, loaded = false) {
  const c = legC(state.phase, leg), L = state.L;
  let rx: number, lift: number, angle: number;
  if (c < 0.6) {
    rx = state.legs[leg].plant - state.dist;
    lift = 0;
    const strike = clamp(1 - c / 0.1);          // heel on the line, toes still up
    const toeOff = clamp((c - 0.46) / 0.14);    // heel rises before the swing
    angle = -12 * strike + 24 * EASE.std(toeOff);
  } else {
    const s = (c - 0.6) / 0.4;
    // forward: from where it lifted to the next touch-down in front; backwards: the other way
    const p = dirSign > 0 ? s : 1 - s;
    rx = lerp(state.legs[leg].from, dirSign > 0 ? 0.3 * L : -0.3 * L, EASE.inout(p));
    lift = (loaded ? 3.4 : 4.2) * Math.sin(Math.PI * s);
    angle = lerp(24, -12, EASE.inout(s));
  }
  // Below about 20 px/s the lifted foot comes down onto the line.
  const w = clamp(amount * 3.5);
  return { c, rx, lift: lift * w, angle: angle * w, stance: c < 0.6 };
}

/* How deep he squats to pick the product up: 0 standing, 1 lowest. */
const squat = (ms: number) =>
  ms < T.grab ? tw(ms, T.crouch, T.grab - T.crouch, EASE.inout) : 1 - tw(ms, T.grab + 60, T.rise - T.grab - 60, EASE.inout);

/*
  The pose is worked out facing right (forward = +x). renderScene mirrors the
  whole figure with faceAt(), so he can face left on the way to the product.
*/
export function manPose(ms: number, clk = 0, loop: string | null = null) {
  const W = WALKER;
  const x = workerX(ms), face = faceAt(ms), fs = face < 0 ? -1 : 1;
  const v = deriv(workerX, ms) * fs;                                 // speed in his own forward direction
  const amount = walkAmount(ms);
  const loaded = carrying(ms);
  const state = walkState(ms);
  const dirSign = WALKS.some((w) => w.dir < 0 && ms > w.t0 && ms < w.t1) ? -1 : 1;
  const legs = [0, 1].map((i) => legPhase(state, i, amount, dirSign, loaded));

  // Hip height comes from the leg on the line: the body vaults over a straight leg.
  const LEN = W.thigh + W.shin - 0.8;
  let hh = Infinity;
  legs.forEach((l) => { if (l.lift < 0.6) hh = Math.min(hh, Math.sqrt(LEN * LEN - l.rx * l.rx)); });
  if (!isFinite(hh)) hh = Math.sqrt(LEN * LEN - legs[0].rx * legs[0].rx);
  const restH = Math.sqrt(LEN * LEN - 1.8 * 1.8);
  let sway = 0;
  const sq = squat(ms);
  hh -= 9 * sq;                                                       // squats down to the product
  hh -= 1.3 * kick(ms, T.grab);                                       // takes the weight
  if (loaded) hh -= 0.5;                                              // knees a little bent under the load
  if (ms >= T.load && ms < T.load + 520) hh -= 2.2 * Math.sin(Math.PI * tw(ms, T.load, 520, EASE.inout)); // bends to lift
  if (loop === "preparing") { hh -= 0.35 * (1 + Math.sin(clk / 360)); sway = 0.7 * Math.sin(clk / 720); }
  const hip = { x: x + sway, y: G - 1 - hh };

  // Lean: forward with speed, plus a spring that answers his acceleration
  // (he leans into the start and catches himself when he stops).
  const accel = (t: number) => deriv2(workerX, t) * (faceAt(t) < 0 ? -1 : 1);
  let lean = v * 0.018 + springBody(accel, 1700, Math.min(ms, 8600), 1.6, 0.5, 0.012, 6);
  lean += 34 * sq;                                                    // bends over the product
  if (loaded) lean -= 3 * (1 - sq);                                   // leans back to balance the load
  lean -= 2 * Math.sin(Math.PI * tw(ms, 1700, 220, EASE.inout));      // shifts his weight before the first step
  if (ms >= T.load && ms < T.load + 520) lean += 6 * Math.sin(Math.PI * tw(ms, T.load, 520, EASE.inout));
  if (loop === "preparing") lean += 1.2 * Math.sin(clk / 720);
  const la = lean * D2R;
  const sh = { x: hip.x + Math.sin(la) * 13.5, y: hip.y - Math.cos(la) * 13.5 };
  // The head keeps steadier than the hips, as a walking person's does; it looks down at the product.
  const headSteady = (restH - hh) * 0.45 * (1 - sq);
  const nod = la + 10 * sq * D2R;
  const head = { x: sh.x + Math.sin(nod) * 6.2 + 1.1, y: sh.y - Math.cos(nod) * 6.2 - headSteady };

  // Feet: the ball of the foot is the planted point; the ankle follows the foot angle.
  const feet = legs.map((l) => {
    const a = l.angle * D2R;
    const groundY = G - 2.4 - l.lift;
    let ax = hip.x - sway + l.rx, ay = groundY;
    if (l.angle > 0) {                     // toe-off: pivot on the toes
      const toeX = ax + W.foot;
      ax = toeX - W.foot * Math.cos(a);
      ay = groundY - W.foot * Math.sin(a);
    }
    return { ax, ay, a, lift: l.lift };
  });
  const knees = feet.map((f) => ik(hip.x, hip.y, f.ax, f.ay, W.thigh, W.shin, 1));

  // Arms. Empty: they swing against the legs. Squatting: they reach the product.
  // Carrying: they hold it at the chest. At the rocket: they lift it in.
  const carry = ms < T.grab ? 0 : 1 - tw(ms, T.release, 320, EASE.std);
  const reach = Math.sin(Math.PI * tw(ms, T.load, 520, EASE.inout));
  const swing = -(legs[0].rx - legs[1].rx) * 0.45 * (1 - carry);
  const hang = { x: sh.x + 1.2 + swing, y: sh.y + 14 };
  const hold = { x: sh.x + 9.9, y: sh.y + 3.4 };
  const up = { x: sh.x + 13, y: sh.y - 1.5 };
  // The product's spot on the Buy dot, in his own (facing right) frame.
  const grabX = x + (PRODUCT_REST.x - x) / (face || 1) - 3.5, grabY = PRODUCT_REST.y + 3;
  const toGrab = ms < T.grab ? EASE.inout(clamp((ms - T.crouch) / (T.grab - T.crouch - 40))) : 1 - tw(ms, T.grab + 80, 420, EASE.inout);
  let hx = lerp(hang.x, hold.x, carry), hy = lerp(hang.y, hold.y, carry);
  hx = lerp(hx, grabX, toGrab); hy = lerp(hy, grabY, toGrab);
  hx = lerp(hx, up.x, reach); hy = lerp(hy, up.y, reach);
  const armN = ik(sh.x, sh.y, hx, hy, W.upper, W.fore, -1);
  const shF = { x: sh.x - 1.2, y: sh.y + 0.6 };
  const armF = ik(shF.x, shF.y, hx - 1.6 - swing * 2, hy + 0.8, W.upper, W.fore, -1);
  const anchor = { x: armN.ex + 3.5, y: armN.ey - 3 };
  // Where the product is on the page (his frame mirrored back).
  const anchorWorld = { x: x + face * (anchor.x - x), y: anchor.y };
  return { x, v, face, hip, sh, head, feet, knees, armN, armF, shF, anchor, anchorWorld, lean, legs, sq };
}

/* ---------- the rocket ---------- */

export const PAD = { x: DOTS[2], y: G - 20.5 };
export const LAND = { x: DOTS[3], y: G - 20.5 };
const RB = [PAD, { x: DOTS[2], y: G - 186 }, { x: DOTS[3], y: G - 186 }, LAND];
export function rocketPath(p: number) {
  const u = 1 - p, a = u * u * u, b = 3 * u * u * p, c = 3 * u * p * p, d = p * p * p;
  return { x: a * RB[0].x + b * RB[1].x + c * RB[2].x + d * RB[3].x, y: a * RB[0].y + b * RB[1].y + c * RB[2].y + d * RB[3].y };
}
export const ROCKET = { appear: 5750, loaded: 8020, ignite: 8150, start: 8650, ms: 1800, handOff: 11270, relight: 11650, leave: 11750 };
export const FLIGHT_START = ROCKET.start, FLIGHT_MS = ROCKET.ms, TOUCHDOWN = FLIGHT_START + FLIGHT_MS;
const flightPos = (ms: number) => rocketPath(EASE.inout(clamp((ms - FLIGHT_START) / FLIGHT_MS)));

export function rocketState(ms: number) {
  const R = ROCKET;
  let x = PAD.x, y = PAD.y, tilt = 0, th = 0, sq = 1, p = -1, op = 0, legs = 1, comp = 0;
  const s = sp(ms, R.appear);
  if (ms >= R.appear) { op = tw(ms, R.appear, 180, EASE.std); y += (1 - s) * 10; }
  sq -= 0.06 * kick(ms, R.loaded);
  comp += 1.4 * kick(ms, R.loaded);
  if (ms >= R.ignite && ms < FLIGHT_START) {
    const k = tw(ms, R.ignite, 500, EASE.inout);
    th = 1.25 * k;
    x += Math.sin(ms * 1.1) * 0.45 * k;
    y += Math.sin(ms * 1.7) * 0.3 * k + 0.9 * k;
    comp += 0.9 * k;
  }
  if (ms >= FLIGHT_START && ms < TOUCHDOWN) {
    p = tw(ms, FLIGHT_START, FLIGHT_MS, EASE.inout);
    const b = flightPos(ms);
    x = b.x; y = b.y;
    // The body follows its own velocity: it leans into the climb and the
    // cruise, and stands up again as it slows down to land (a gravity turn).
    const a = flightPos(ms - 10), c = flightPos(ms + 10);
    const vx = (c.x - a.x) * 50, vy = (c.y - a.y) * 50;            // px/s
    tilt = (Math.atan2(vx, Math.abs(vy) + 45) / D2R) * 0.85;
    th = p < 0.3 ? lerp(1.3, 0.6, p / 0.3) : p < 0.62 ? lerp(0.6, 0.45, (p - 0.3) / 0.32) : lerp(0.45, 1.15, clamp((p - 0.62) / 0.3));
    x += Math.sin(ms * 1.1) * 0.35 * (1 - clamp(p / 0.12));
    legs = 1 - tw(ms, FLIGHT_START + 150, 300, EASE.std) + sp(ms, TOUCHDOWN - 450);
  } else if (ms >= TOUCHDOWN) {
    x = LAND.x; y = LAND.y; legs = 1;
    comp = 2.2 * kick(ms, TOUCHDOWN);
    sq = 1 - 0.06 * kick(ms, TOUCHDOWN);
    th = 1.1 * (1 - tw(ms, TOUCHDOWN, 300, EASE.std));
    comp += 1.2 * kick(ms, R.handOff);                                        // the product leaves
    if (ms >= R.relight && ms < R.leave) { th = tw(ms, R.relight, 100, EASE.std) * 1.25; x += Math.sin(ms * 1.1) * 0.4; comp += 0.8; }
    if (ms >= R.leave) { const k = tw(ms, R.leave, 500, EASE.exit); y = lerp(LAND.y, -160, k); th = 1.25; legs = 1 - tw(ms, R.leave + 30, 250, EASE.std); }
    if (ms >= R.leave + 300) op *= 1 - tw(ms, R.leave + 300, 200, EASE.std);
  }
  return { x, y, tilt, th, s, sq, p, op, legs: clamp(legs, 0, 1.1), comp };
}
type RocketState = ReturnType<typeof rocketState>;

export function nozzle(st: RocketState) {
  const a = (st.tilt - 45) * D2R, sc = 1.9 * st.s, vx = -2.9 * sc, vy = 2.7 * sc;
  return {
    x: st.x + vx * Math.cos(a) - vy * Math.sin(a),
    y: st.y + vx * Math.sin(a) + vy * Math.cos(a),
    ex: -Math.sin(st.tilt * D2R),
    ey: Math.cos(st.tilt * D2R),
  };
}

/* ---------- the truck ---------- */

export const TRUCK = { end: 845, meet: 732, show: 8050, backStart: 9750, backMs: 1400, takes: 11800, goStart: 11950, goMs: 1200 };
export function truckX(ms: number) {
  const K = TRUCK;
  if (ms < K.backStart) return K.end;
  if (ms < K.backStart + K.backMs) return lerp(K.end, K.meet, EASE.inout((ms - K.backStart) / K.backMs));
  if (ms < K.goStart) return K.meet;
  if (ms < K.goStart + K.goMs) return lerp(K.meet, K.end, EASE.inout((ms - K.goStart) / K.goMs));
  return K.end;
}
const truckA = (t: number) => deriv2(truckX, t);
const WHEEL_R = 3.1 * 1.4;
export const truckPitch = (ms: number) => springBody(truckA, TRUCK.backStart - 50, ms, 2.4, 0.42, 1.3, 5);

function roofPoint(tx: number, pitch: number, tb: number) {
  const px = 2.6 * 1.4, py = -3.14 * 1.4, dx = -5.2 * 1.4 - px, dy = -17.4 * 1.4 - py, a = pitch * D2R;
  return { x: tx + px + dx * Math.cos(a) - dy * Math.sin(a), y: G - 1 + tb + py + dx * Math.sin(a) + dy * Math.cos(a) - 10.6 };
}

/*
  A thrown product: x moves at a steady speed and y follows a parabola,
  which is the path of a real throw under gravity. h is the top of the arc.
*/
function arc(p: number, x0: number, y0: number, x1: number, y1: number, h: number) {
  return { x: lerp(x0, x1, p), y: lerp(y0, y1, p) - 4 * h * p * (1 - p) };
}

/* ---------- statuses ---------- */

export const HOUSE = { at: 13200, ms: 450 };
export const REACHED_AT = [1120, T.arrive, ROCKET.loaded, 13550];
export type JourneyStatus = "buy" | "preparing" | "shipped" | "out" | "delivered";
/* Where the story rests for each status, and the quiet loop it runs there. */
export const REST_MS: Record<JourneyStatus, number> = { buy: 1590, preparing: 5900, shipped: 9550, out: 12550, delivered: END_MS };
export const statusAt = (ms: number): JourneyStatus | null =>
  ms >= REACHED_AT[3] ? "delivered" : ms >= TRUCK.goStart ? "out" : ms >= REACHED_AT[2] ? "shipped" : ms >= REACHED_AT[1] ? "preparing" : ms >= REACHED_AT[0] ? "buy" : null;

/* ---------- drawing ---------- */

export type Parts = Record<string, any>;
const NS = "http://www.w3.org/2000/svg";

export function collectParts(root: Element): Parts {
  const q = (c: string) => root.querySelector(".x-" + c);
  const S: Parts = {};
  ["fill", "ring", "shProd", "shWork", "shRock", "shTruck", "pinWrap", "pinGreen", "burst", "check", "checkPath", "drop",
    "truck", "tbody", "tlines", "brake", "rev", "rocket", "rframe", "rocketInner", "flame", "glow", "heat", "rlines", "legL", "legR",
    "man", "manFront", "armF", "legF", "shoeF", "torso", "legN", "shoeN", "hair", "head", "armN",
    "prod", "prodInner", "ribV", "ribH", "bow", "badge", "cursor", "tap"].forEach((k) => (S[k] = q(k)));
  S.dots = Array.from(root.querySelectorAll(".x-dot"));
  S.wheels = Array.from(root.querySelectorAll(".x-wh"));
  const sg = q("smoke");
  sg.replaceChildren();
  const make = (n: number, fill: string) => {
    const a: Element[] = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("fill", fill);
      c.setAttribute("opacity", "0");
      sg.appendChild(c);
      a.push(c);
    }
    return a;
  };
  S.trail = make(36, "#E7E7EB");
  S.ground = make(12, "#E9E5DD");
  S.live = make(6, "#E7E7EB");
  S.exh = make(8, "#D9D9DE");
  S.dust = make(9, "#E6E0D4");
  return S;
}

const A = (el: Element, k: string, v: number | string) =>
  el.setAttribute(k, typeof v === "number" ? String(+v.toFixed(3)) : v);

const GREEN = "#26C13F", INK = "#1D1D1D";

/*
  Draw the whole stage at time `ms`. `clk` is a free clock for the quiet loop
  of the status the story rests on (`idle`), so a resting order still breathes.
*/
export function renderScene(S: Parts, ms: number, clk: number, idle: JourneyStatus | null, reduce = false) {
  const loop = idle && !reduce ? idle : null;
  const K = TRUCK;

  /* ===== truck: body on springs, wheels that turn ===== */
  const tx = truckX(ms), tv = deriv(truckX, ms), ta = truckA(ms);
  let pitch = truckPitch(ms);
  let tb = 0;
  if (Math.abs(tv) > 2) tb = Math.sin(tx * 0.9) * 0.25 * clamp(Math.abs(tv) / 120);    // road
  if (ms >= K.show && Math.abs(tv) < 2) tb += 0.13 * Math.sin((loop ? clk : ms) / 21);   // engine idle
  tb += 0.9 * kick(ms, K.takes);                                                        // takes the weight
  if (loop === "out") { tb = Math.sin(clk / 45) * 0.22; pitch += 0.4 * Math.sin(clk / 160); }
  const tOp = tw(ms, K.show, 300, EASE.std);
  A(S.truck, "transform", `translate(${tx} ${G - 1}) scale(1.4)`);
  A(S.truck, "opacity", tOp);
  A(S.tbody, "transform", `translate(0 ${tb}) rotate(${pitch} 2.6 -3.14)`);
  const wang = (tx - K.end) / WHEEL_R / D2R + (loop === "out" ? clk * 0.5 : 0);
  S.wheels.forEach((w: Element) => A(w, "transform", `rotate(${wang})`));
  const fwd = tv > 2 || loop === "out";
  A(S.tlines, "opacity", tv < -2 ? 0 : 1);
  A(S.tlines, "transform", fwd ? `translate(${-1.2 - 1.3 * Math.sin((loop ? clk : ms) / 38)} 0)` : "translate(0 0)");
  A(S.rev, "opacity", tv < -2 ? 0.95 : 0);
  const braking = (Math.abs(tv) > 3 && ta * tv < 0) || (ms > K.backStart + K.backMs && ms < K.backStart + K.backMs + 350) || (ms > K.goStart + K.goMs && ms < K.goStart + K.goMs + 450);
  A(S.brake, "opacity", braking ? 0.95 : 0);
  A(S.shTruck, "cx", tx + 3);
  A(S.shTruck, "opacity", 0.13 * tOp);
  S.exh.forEach((c: Element, i: number) => {
    const t0 = (i < 4 ? K.backStart : K.goStart) + (i % 4) * 90, k = (ms - t0) / 700;
    if (k < 0 || k > 1) return A(c, "opacity", 0);
    const g = EASE.std(k);
    A(c, "cx", tx - 21 - g * 6); A(c, "cy", G - 4 - g * 5); A(c, "r", 1 + g * 3.5); A(c, "opacity", 0.7 * (1 - k));
  });

  /* dust: the tyres when the truck brakes hard, and the product landing on the Buy dot */
  const DUST: [number, number, number][] = [
    [K.backStart + K.backMs * 0.62, truckX(K.backStart + K.backMs * 0.62) - 6, 1],
    [K.goStart + K.goMs * 0.62, truckX(K.goStart + K.goMs * 0.62) + 13, -1],
    [T.drop + T.dropMs, PRODUCT_REST.x, 0],
  ];
  S.dust.forEach((c: Element, i: number) => {
    const [t0b, wx, away] = DUST[Math.floor(i / 3)];
    const j = i % 3, t0 = t0b + j * 70, k = (ms - t0) / 650;
    if (k < 0 || k > 1) return A(c, "opacity", 0);
    const g = EASE.flight(k);
    const dir = away === 0 ? (j % 2 ? 1 : -1) : away;
    A(c, "cx", wx + dir * g * (6 + j * 3)); A(c, "cy", G - 2 - g * (2 + j)); A(c, "r", 1 + g * (away === 0 ? 1.8 : 2.6)); A(c, "opacity", 0.7 * (1 - k));
  });

  /* ===== employee ===== */
  const M = manPose(ms, clk, loop);
  const wIn = sp(ms, T.appear);
  let wOp = ms >= T.appear ? tw(ms, T.appear, 220, EASE.std) : 0;
  if (ms >= T.fade) wOp *= 1 - tw(ms, T.fade, 350, EASE.exit);
  const wS = lerp(0.85, 1, wIn), wDy = (1 - wIn) * 8;
  // He turns round by scaling through zero: the 2D way to show a body turning.
  const fx0 = M.face * wS;
  const mT = `translate(${M.x} ${G - 1 + wDy}) scale(${fx0} ${wS}) translate(${-M.x} ${-(G - 1)})`;
  A(S.man, "transform", mT); A(S.manFront, "transform", mT);
  A(S.man, "opacity", wOp); A(S.manFront, "opacity", wOp);
  const leg = (k: ReturnType<typeof ik>) => `M${P(M.hip.x, M.hip.y)} L${P(k.jx, k.jy)} L${P(k.ex, k.ey)}`;
  const shoe = (k: ReturnType<typeof ik>, f: { a: number }) =>
    `M${P(k.ex - 0.6 * Math.cos(f.a), k.ey - 0.6 * Math.sin(f.a))} L${P(k.ex + WALKER.foot * Math.cos(f.a), k.ey + WALKER.foot * Math.sin(f.a))}`;
  A(S.legN, "d", leg(M.knees[0])); A(S.shoeN, "d", shoe(M.knees[0], M.feet[0]));
  A(S.legF, "d", leg(M.knees[1])); A(S.shoeF, "d", shoe(M.knees[1], M.feet[1]));
  A(S.torso, "d", `M${P(M.hip.x, M.hip.y - 1.5)} L${P(M.sh.x, M.sh.y + 1.2)}`);
  A(S.head, "cx", M.head.x); A(S.head, "cy", M.head.y);
  const flow = Math.sin(clk / 300) * 0.3 - M.v * 0.004;                          // the ponytail trails behind
  A(S.hair, "d", `M${P(M.head.x - 3.4, M.head.y - 2.6)} q${P(-4.6 + flow * 4, 0.6)} ${P(-5.4 + flow * 6, 6.4)} q${P(2.4, -2.2)} ${P(5.8, -3.6)} z`);
  A(S.armN, "d", `M${P(M.sh.x, M.sh.y)} L${P(M.armN.jx, M.armN.jy)} L${P(M.armN.ex, M.armN.ey)}`);
  A(S.armF, "d", `M${P(M.shF.x, M.shF.y)} L${P(M.armF.jx, M.armF.jy)} L${P(M.armF.ex, M.armF.ey)}`);
  A(S.shWork, "cx", M.x); A(S.shWork, "rx", 10 + 3 * M.sq); A(S.shWork, "opacity", 0.12 * wOp);
  // The product swings in his hands when he starts and stops (spring on his acceleration).
  const carrySwing = springBody((t) => deriv2(workerX, t), WALKS[1].t0 - 50, Math.min(ms, T.toss), 3, 0.45, 4.2, 12);

  /* ===== rocket ===== */
  const R = rocketState(ms);
  let ry = R.y;
  if (loop === "shipped") ry += 2.2 * Math.sin(clk / 420);
  const tt = loop === "shipped" ? clk : ms;
  const flick = R.th * (0.86 + 0.22 * Math.sin(tt / 31) + 0.08 * Math.sin(tt / 13));
  // the engine swings against the turn, as a gimballed engine steers a real rocket
  const tiltRate = R.p >= 0 ? (rocketState(ms + 16).tilt - rocketState(ms - 16).tilt) / 32 : 0;
  const gimbal = clamp(-tiltRate * 260, -14, 14);
  A(S.rocket, "transform", `translate(${R.x} ${ry}) scale(${1 / Math.sqrt(R.sq)} ${R.sq})`);
  A(S.rframe, "transform", `rotate(${R.tilt})`);
  A(S.rocketInner, "transform", `rotate(-45) scale(${1.9 * R.s}) translate(-7.5 -7.5)`);
  A(S.rocket, "opacity", R.op);
  A(S.flame, "transform", `translate(4.9 9.9) rotate(${135 + gimbal}) scale(${Math.max(flick, 0.001)} ${0.55 + 0.45 * clamp(R.th)})`);
  A(S.glow, "opacity", clamp(R.th) * 0.75);
  A(S.glow, "r", 6 + flick * 5);
  const flying = R.p > 0.08 && R.p < 0.9 ? 1 : 0;
  A(S.rlines, "opacity", flying * clamp(Math.sin(Math.PI * R.p) * 1.6));
  const legGeo = (side: number) => {
    const k = R.legs, s = R.s;
    const hx = side * 2.2 * s, hy = 4 * s;
    const fx = lerp(side * 3.2, side * 9.2, k) * s, fy = (lerp(11, 19.6, k) - R.comp) * s;
    return `M${P(hx, hy)} L${P(fx, fy)} M${P(fx - 1.8 * s, fy)} L${P(fx + 1.8 * s, fy)}`;
  };
  A(S.legL, "d", legGeo(-1)); A(S.legR, "d", legGeo(1));
  const rh = clamp((PAD.y - ry) / 90);
  A(S.shRock, "cx", R.x); A(S.shRock, "rx", 11 * R.s * (1 - rh * 0.7)); A(S.shRock, "opacity", 0.12 * R.op * (1 - rh));
  // the flame lights the line when it is close to the ground
  const near = clamp(1 - (PAD.y - ry) / 40);
  A(S.heat, "cx", R.x); A(S.heat, "opacity", clamp(R.th) * near * 0.55 * R.op);

  S.trail.forEach((c: Element, i: number) => {
    const t0 = FLIGHT_START - 150 + i * ((FLIGHT_MS + 250) / S.trail.length), life = 1300;
    if (ms < t0 || ms > t0 + life) return A(c, "opacity", 0);
    const st = rocketState(t0), nz = nozzle(st), k = (ms - t0) / life, g = EASE.std(k), push = 6 + st.th * 6;
    // the smoke leaves the engine fast, slows in the air, rises a little as it cools
    A(c, "cx", nz.x + nz.ex * push * g + (i % 2 ? 1 : -1) * g * 2.5);
    A(c, "cy", nz.y + nz.ey * push * g + g * 4 - k * k * 6);
    A(c, "r", 1.6 + g * (4 + st.th * 4));
    A(c, "opacity", 0.75 * (1 - k) * clamp(st.th * 1.4));
  });
  S.live.forEach((c: Element, i: number) => {
    if (loop !== "shipped") return A(c, "opacity", 0);
    const k = (clk / 1100 + i / S.live.length) % 1, nz = nozzle({ ...R, y: ry }), g = EASE.std(k);
    A(c, "cx", nz.x + nz.ex * (4 + g * 14) + (i % 2 ? 1 : -1) * g * 2); A(c, "cy", nz.y + nz.ey * (4 + g * 14) + g * 3);
    A(c, "r", 1.4 + g * 5); A(c, "opacity", 0.7 * (1 - k));
  });
  const events: [number, number][] = [[ROCKET.ignite + 20, PAD.x], [TOUCHDOWN - 260, LAND.x], [ROCKET.relight + 20, LAND.x]];
  let ev: [number, number] | null = null;
  for (const e of events) if (ms >= e[0] && ms < e[0] + 1100) ev = e;
  S.ground.forEach((c: Element, i: number) => {
    if (!ev) return A(c, "opacity", 0);
    const k = (ms - ev[0]) / 1100, g = EASE.flight(k), dir = i % 2 ? 1 : -1, lane = Math.floor(i / 2);
    A(c, "cx", ev[1] + dir * (3 + g * (9 + lane * 7))); A(c, "cy", G - 3 - g * (1 + lane * 1.4));
    A(c, "r", 1.6 + g * (2.4 + lane * 1.1)); A(c, "opacity", 0.85 * (1 - k));
  });

  /* ===== the product ===== */
  const press = ms < 1000 ? 0 : ms < 1120 ? tw(ms, 1000, 120, EASE.std) : 1 - sp(ms, 1120);
  let px = DOTS[0], py = G - 22, ps = sp(ms, 150), pOp = ms >= 150 ? tw(ms, 150, 150, EASE.std) : 0, pr = 0, free = true;
  let sqX = 1, sqY = 1;
  ps *= 1 - 0.07 * press;
  if (loop === "buy") py += 1.3 * Math.sin(clk / 520);
  const squash = (t0: number, amt = 1) => { const k = kick(ms, t0) * amt; sqY -= 0.12 * k; sqX += 0.08 * k; };
  if (ms >= T.drop && ms < T.grab) {
    // it falls onto the Buy dot: y grows with t² (gravity), then it squashes and settles
    const p = clamp((ms - T.drop) / T.dropMs);
    ps = lerp(1, 0.8, EASE.std(p));
    px = PRODUCT_REST.x;
    py = lerp(G - 22, PRODUCT_REST.y, p * p);
    squash(T.drop + T.dropMs, 1.4);
  } else if (ms >= T.grab && ms < T.toss) {
    // in his hands: it rides on his hands and swings on a spring
    px = M.anchorWorld.x; py = M.anchorWorld.y; ps = 0.8; free = false;
    pr = M.face * (M.lean * 0.5 + carrySwing - 34 * M.sq * 0.5);
    squash(T.grab, 0.6);
  } else if (ms >= T.toss && ms < ROCKET.loaded) {
    const a0 = manPose(T.toss).anchorWorld, p = clamp((ms - T.toss) / T.tossMs);
    const q = arc(p, a0.x, a0.y, PAD.x, G - 26, 12);
    px = q.x; py = q.y; ps = lerp(0.8, 0.3, EASE.std(p)); pOp = 1 - clamp((p - 0.7) / 0.3); pr = -10 * Math.sin(p * Math.PI);
  } else if (ms >= ROCKET.loaded && ms < ROCKET.handOff) {
    pOp = 0;
  } else if (ms >= ROCKET.handOff) {
    const roofSwing = springBody(truckA, K.backStart - 50, ms, 3.2, 0.35, 2.2, 8);
    if (ms < K.takes) {
      const p = clamp((ms - ROCKET.handOff) / (K.takes - ROCKET.handOff)), r = roofPoint(K.meet, pitch, tb);
      const q = arc(p, LAND.x, G - 26, r.x, r.y, 26);
      px = q.x; py = q.y; ps = lerp(0.3, 0.78, EASE.std(clamp(p * 1.3))); pOp = clamp(p / 0.12); pr = 12 * Math.sin(p * Math.PI);
    } else if (ms < HOUSE.at) {
      const r = roofPoint(tx, pitch, tb);
      px = r.x - roofSwing * 0.25; py = r.y; ps = 0.78; pr = pitch + roofSwing; free = false;
      squash(K.takes);
    } else if (ms < HOUSE.at + HOUSE.ms) {
      const p = clamp((ms - HOUSE.at) / HOUSE.ms), r = roofPoint(K.end, pitch, tb);
      const q = arc(p, r.x, r.y, 867, 30, 18);
      px = q.x; py = q.y; ps = lerp(0.78, 0.3, EASE.std(p)); pOp = 1 - clamp((p - 0.75) / 0.25);
    } else pOp = 0;
  }
  A(S.prod, "transform", `translate(${px} ${py}) rotate(${pr}) scale(${ps})`);
  A(S.prodInner, "transform", `translate(0 13.5) scale(${sqX} ${sqY}) translate(0 -13.5)`);
  A(S.prod, "opacity", pOp);
  const ph = clamp((G - (py + 13.5 * ps)) / 90);
  A(S.shProd, "cx", px); A(S.shProd, "rx", 9 * ps * (1 - ph * 0.6) * sqX); A(S.shProd, "opacity", free ? 0.14 * pOp * (1 - ph) : 0);
  A(S.badge, "transform", `translate(9.5 -11.5) scale(${EASE.pop(clamp((ms - 1120) / 320))})`);
  const rv = tw(ms, T.ribbon, 360, EASE.std), rhz = tw(ms, T.ribbon2, 360, EASE.std);
  A(S.ribV, "transform", `translate(0 -13.5) scale(1 ${rv}) translate(0 13.5)`); A(S.ribV, "opacity", rv > 0 ? 0.92 : 0);
  A(S.ribH, "transform", `scale(${rhz} 1)`); A(S.ribH, "opacity", rhz > 0 ? 0.92 : 0);
  A(S.bow, "transform", `translate(0 4) scale(${EASE.pop(clamp((ms - T.bow) / 320))})`);

  /* ===== the Buy icon ===== */
  {
    const p = tw(ms, 300, 690, EASE.flight), out = tw(ms, 1300, 260, EASE.exit);
    const cx = lerp(200, 118.8, p) + out * 10, cy = lerp(20, G - 27.1, p) - out * 10;
    A(S.cursor, "transform", `translate(${cx} ${cy}) scale(${1.8 * (1 - 0.14 * press) * (1 - 0.3 * out)}) translate(-7.5 -7.5)`);
    A(S.cursor, "opacity", tw(ms, 300, 160, EASE.std) * (1 - out));
    const k = clamp((ms - 1120) / 450);
    A(S.tap, "r", 2 + EASE.std(k) * 12); A(S.tap, "opacity", k > 0 && k < 1 ? 0.5 * (1 - k) : 0);
  }

  /* ===== the line: black from its start up to the product ===== */
  let fx = DOTS[0];
  if (ms >= T.grab) fx = clamp(M.anchorWorld.x, DOTS[0], DOTS[1]);
  if (ms >= T.arrive) fx = lerp(clamp(M.anchorWorld.x, DOTS[0], DOTS[1]), DOTS[1], tw(ms, T.arrive, 300, EASE.std));
  if (ms >= WALKS[2].t0) fx = clamp(M.anchorWorld.x, DOTS[1], 480);
  if (ms >= T.toss) {
    const from = clamp(manPose(T.toss).anchorWorld.x, DOTS[1], 480);
    fx = lerp(from, DOTS[2], tw(ms, T.toss, T.tossMs, EASE.std));
  }
  if (ms >= FLIGHT_START) fx = lerp(DOTS[2], DOTS[3], R.p >= 0 ? R.p : 1);
  if (ms >= ROCKET.handOff) fx = lerp(DOTS[3], K.meet - 7, tw(ms, ROCKET.handOff, K.takes - ROCKET.handOff, EASE.std));
  if (ms >= K.goStart) fx = Math.max(K.meet - 7, tx - 7);
  if (ms >= HOUSE.at) fx = lerp(K.end - 7, LINE_END, tw(ms, HOUSE.at, HOUSE.ms, EASE.std));
  A(S.fill, "x2", fx);
  A(S.fill, "opacity", 1);

  /* ===== dots ===== */
  const reached = REACHED_AT.map((t) => ms >= t);
  const cur = reached.lastIndexOf(true);
  S.dots.forEach((d: Element, i: number) => A(d, "r", reached[i] ? 6 : 5.5));
  let rk = -1, rop = 0.45;
  if (cur >= 0) {
    rk = clamp((ms - REACHED_AT[cur]) / 650);
    if (rk >= 1) { if (loop && cur < 3) { rk = (clk % 1800) / 1800; rop = 0.25; } else rk = -1; }
  }
  if (rk > 0 && rk < 1) {
    A(S.ring, "cx", DOTS[cur]); A(S.ring, "r", 6 + EASE.std(rk) * 13); A(S.ring, "opacity", rop * (1 - rk)); A(S.ring, "stroke", cur === 3 ? GREEN : INK);
  } else A(S.ring, "opacity", 0);
  const done = REACHED_AT[3];
  A(S.check, "transform", `translate(${DOTS[3]} ${G}) scale(${EASE.pop(clamp((ms - done) / 320))})`);
  A(S.checkPath, "stroke-dashoffset", 1 - tw(ms, done + 100, 300, EASE.std));

  /* ===== the customer's map ===== */
  const gp = tw(ms, done, 300, EASE.std);
  A(S.pinGreen, "opacity", gp);
  A(S.drop, "stroke", gp > 0.5 ? GREEN : "#CFCFCF");
  const pb = 1 + 0.18 * kick(ms, done + 50);
  A(S.pinWrap, "transform", `translate(845 60) scale(${pb}) translate(-845 -60)`);
  const bk = clamp((ms - done - 50) / 650);
  A(S.burst, "r", 4 + EASE.std(bk) * 24); A(S.burst, "opacity", bk > 0 && bk < 1 ? 0.6 * (1 - bk) : 0);

  return { reached, cur, delivered: ms >= done + 50 };
}
