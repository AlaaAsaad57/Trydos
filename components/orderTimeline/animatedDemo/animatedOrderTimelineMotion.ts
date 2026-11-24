import type { OrderStage } from "../../DemoApp/demoOrders";
import {
  EASE,
  clamp,
  ik,
  kick,
  lerp,
  spring,
  springBody,
} from "../journeyMotion";

/*
  High-physics dual-product engine for the Demo Order Timeline (`viewBox="0 0 406 54"`),
  applying the exact physics primitives of `/timeline`'s first example
  (`OrderJourney` / `journeyMotion.ts` — iOS cubic-beziers, analytical springs
  & kicks, spring-damper ODE suspension & inertia sway, and 2-bone IK
  foot-planted walking) to 100% NEW XD ICONS from `Home Page – 60..66`:

    • Each product in the order (Product 0 = Blue Pajama, Product 1 = Pink Shirt)
      runs its OWN independent staggered journey through the 6 XD icons!
    • Each product's REAL photo IS the physical delivered parcel/box — riding on
      the cart, sealed on the packing desk, held individually in the carrier's
      arms (`orderCarryPurple`), peeking inside the rocket's circular porthole
      during gravity-turn flight, tossed rightward onto the periwinkle truck
      stopping AFTER the landed rocket (268.55 > 248), and hopping onto Delivered.
    • Because product photos live down on the physical parcel plane (y ≈ 18..33),
      the top order-label strip (y = 3..17) stays 100% clear and unobstructed —
      even when TWO status labels (`Packing` + `Shipping Operations` / `Remaining
      1 Day`) appear simultaneously during the split stage!
*/

export const G = 37; // Track centerline y
export const TRACK_TOP = 35.2; // Physical ground plane during live animation (top of 4px bar)
export const XD_TRUCK_Y = 39.85; // Exact XD resting bottom-of-wheels for HP 61 parity
export const DOTS: readonly [number, number, number] = [57, 207, 349];
export const END_MS = 15800;

const D2R = Math.PI / 180;
const tw = (ms: number, s: number, d: number, ease: (x: number) => number) =>
  ease(clamp((ms - s) / d));
const sp = (ms: number, s: number) => spring(ms - s);
const deriv = (f: (t: number) => number, t: number, h = 12) =>
  ((f(t + h) - f(t - h)) / (2 * h)) * 1000;
const deriv2 = (f: (t: number) => number, t: number, h = 12) =>
  ((f(t + h) - 2 * f(t) + f(t - h)) / (h * h)) * 1e6;
const P = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;

function arc(
  p: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  h: number,
) {
  return {
    x: lerp(x0, x1, p),
    y: lerp(y0, y1, p) - 4 * h * p * (1 - p),
  };
}

/* ---------- Exact XD palette ---------- */

const PURPLE = "#4A31E7";
const GREEN_BAR = "#31E770";
const CYAN_BAR = "#38E0FF";
const INK = "#1D1D1D";
const LINE_GREY = "#DFDFDF";
const DOT_HINT = "#B2B2B2";

/**
 * Deterministic milestone timestamps for step-by-step seeking when an order's
 * status (or an individual item's status) changes from backend / UI interaction.
 */
export const REST_MS: Record<Exclude<OrderStage, "showcase">, number> = {
  preparing: 2600,
  split: 7200,
  shipped: 13200,
  pickup: 14550,
  delivered: END_MS,
};

/* ---------- Spatial Zones (strict left-to-right order, zero overlap) ---------- */

const CART_GEO = { x0: 14, xStop: 64, xOut: 10 };
const WORK_GEO = { x: 82, yLive: 21.8, yRest: 24.006 };
const CARRY_GEO = { x0: 104, x1: 188, xBack: 174 };

// Rocket launches from x = 208 (at Shipped DOT 1 = 207) and lands at x = 248.
// Truck stops AFTER the landed rocket at x = 268.55 (rear bumper 257.35 > 254)!
const ROCKET_SCALE = 0.88;
const ROCKET_PAD = { x: 208, y: TRACK_TOP - 9.4 };
const ROCKET_LAND = { x: 248, y: TRACK_TOP - 9.4 };
const ROCKET_XD_REST = { x: 236.01, y: 34.44 }; // Exact XD HP 62 rocket center
const ROCKET_BEZ = [
  ROCKET_PAD,
  { x: 215, y: -28 },
  { x: 241, y: -28 },
  ROCKET_LAND,
];

function rocketPath(p: number) {
  const u = 1 - p;
  const a = u * u * u;
  const b = 3 * u * u * p;
  const c = 3 * u * p * p;
  const d = p * p * p;
  return {
    x:
      a * ROCKET_BEZ[0].x +
      b * ROCKET_BEZ[1].x +
      c * ROCKET_BEZ[2].x +
      d * ROCKET_BEZ[3].x,
    y:
      a * ROCKET_BEZ[0].y +
      b * ROCKET_BEZ[1].y +
      c * ROCKET_BEZ[2].y +
      d * ROCKET_BEZ[3].y,
  };
}

/* ---------- Per-Product Staggered Journey Schedules ---------- */

type ProductRun = {
  id: 0 | 1;
  cart: { enter: number; arrive: number; unload: number; leave: number; gone: number };
  work: { appear: number; impact: number; seal: number; fade: number };
  carry: {
    appear: number;
    grab: number;
    walkStart: number;
    walkEnd: number;
    load: number;
    toss: number;
    tossMs: number;
    release: number;
    backStart: number;
    backEnd: number;
    fade: number;
  };
  rocket: {
    appear: number;
    loaded: number;
    ignite: number;
    flightStart: number;
    flightMs: number;
    touchdown: number;
    handOff: number;
    handOffMs: number;
    relight: number;
    leave: number;
  };
  truckTakes: number;
  roofDx: number;
  delivHopStart: number;
  delivHopMs: number;
  delivX: number;
};

const RUNS: readonly [ProductRun, ProductRun] = [
  // Product 0 — Blue Pajama (Lead product: launches first, creating the live split state!)
  {
    id: 0,
    cart: { enter: 100, arrive: 1220, unload: 1250, leave: 1520, gone: 2040 },
    work: { appear: 1320, impact: 1560, seal: 2150, fade: 3420 },
    carry: {
      appear: 3480,
      grab: 3680,
      walkStart: 3740,
      walkEnd: 5260,
      load: 5300,
      toss: 5380,
      tossMs: 380,
      release: 5640,
      backStart: 5700,
      backEnd: 6040,
      fade: 6080,
    },
    rocket: {
      appear: 5120,
      loaded: 5760,
      ignite: 6020,
      flightStart: 6380,
      flightMs: 1540,
      touchdown: 7920,
      handOff: 8420,
      handOffMs: 420,
      relight: 8920,
      leave: 9000,
    },
    truckTakes: 8840,
    roofDx: -0.6,
    delivHopStart: 14720,
    delivHopMs: 420,
    delivX: 355, // Exact XD HP 66 Pajama center
  },
  // Product 1 — Pink Shirt (Second product: packed & carried while Pajama flies & boards truck!)
  {
    id: 1,
    cart: { enter: 4050, arrive: 5170, unload: 5200, leave: 5470, gone: 5990 },
    work: { appear: 5270, impact: 5510, seal: 6150, fade: 7850 },
    carry: {
      appear: 7920,
      grab: 8120,
      walkStart: 8180,
      walkEnd: 9700,
      load: 9740,
      toss: 9820,
      tossMs: 380,
      release: 10080,
      backStart: 10140,
      backEnd: 10480,
      fade: 10520,
    },
    rocket: {
      appear: 9520,
      loaded: 10200,
      ignite: 10460,
      flightStart: 10820,
      flightMs: 1500,
      touchdown: 12320,
      handOff: 12720,
      handOffMs: 420,
      relight: 13200,
      leave: 13280,
    },
    truckTakes: 13140,
    roofDx: -8.6,
    delivHopStart: 14860,
    delivHopMs: 420,
    delivX: 344, // Exact XD HP 66 Shirt center
  },
];

// Truck reverses from right and parks cleanly AFTER the landed rocket (268.55 > 248!),
// receives Product 0 (Pajama) then Product 1 (Pink Shirt), then cruises to Pickup & Delivered!
const TRUCK = {
  show: 7260,
  backStart: 7460,
  backMs: 900, // Parked at 268.55 by 8360 (before Rocket 0 handOff at 8420)
  goStart: 13440,
  goMs: 1040, // Reaches xPickup = 330 at 14480
  finishStart: 14700,
  finishMs: 420,
  xStart: 344,
  xMeet: 268.55,
  xPickup: 330,
  xEnd: 356,
};

const DELIVER_DONE = 15280;

/* ---------- Shared 2-Bone IK Foot-Planting Walker Helper ---------- */

type WalkSeg = { t0: number; t1: number; x0: number; x1: number; dir: number };

const stanceRx = (c: number, L: number) => lerp(0.3 * L, -0.3 * L, c / 0.6);
const legC = (phase: number, leg: number) =>
  (((phase + leg * 0.5 + 0.2) % 1) + 1) % 1;

function solveWalkState(
  ms: number,
  segs: WalkSeg[],
  xFn: (t: number) => number,
  baseStride: number,
  refSpeed: number,
) {
  let phase = 0;
  let dist = 0;
  const strideFor = (amt: number) => baseStride * (0.38 + 0.62 * amt);
  let L = strideFor(0);
  const legs = [0, 1].map((leg) => {
    const c = legC(0, leg);
    return c < 0.6
      ? { plant: stanceRx(c, L), from: 0 }
      : { plant: 0, from: -0.3 * L };
  });
  for (const w of segs) {
    const end = Math.min(ms, w.t1);
    for (let t = w.t0; t < end; t += 4) {
      const t1 = Math.min(t + 4, end);
      const ds = w.dir * Math.abs(xFn(t1) - xFn(t));
      const amt = clamp(Math.abs(deriv(xFn, (t + t1) / 2)) / refSpeed);
      L = strideFor(amt);
      const before = [0, 1].map((leg) => legC(phase, leg));
      phase += ds / L;
      dist += ds;
      [0, 1].forEach((leg) => {
        const c0 = before[leg];
        const c1 = legC(phase, leg);
        const was = c0 < 0.6;
        const now = c1 < 0.6;
        if (!was && now) legs[leg].plant = dist + stanceRx(c1, L);
        if (was && !now) legs[leg].from = legs[leg].plant - dist;
      });
    }
    if (ms < w.t1) break;
  }
  return { phase, dist, L, legs };
}

function solveLegPhase(
  state: ReturnType<typeof solveWalkState>,
  leg: number,
  amount: number,
  dirSign: number,
  liftMax: number,
) {
  const c = legC(state.phase, leg);
  const L = state.L;
  let rx: number;
  let lift: number;
  if (c < 0.6) {
    rx = state.legs[leg].plant - state.dist;
    lift = 0;
  } else {
    const s = (c - 0.6) / 0.4;
    const p = dirSign > 0 ? s : 1 - s;
    rx = lerp(
      state.legs[leg].from,
      dirSign > 0 ? 0.3 * L : -0.3 * L,
      EASE.inout(p),
    );
    lift = liftMax * Math.sin(Math.PI * s);
  }
  const w = clamp(amount * 3.5);
  return { rx, lift: lift * w };
}

/* ---------- 1. Parameterized Supplier Cart Kinematics (orderCartPurple) ---------- */

const CART_WHEEL_R = 1.22;

function cartWalksFor(c: ProductRun["cart"]): WalkSeg[] {
  return [
    { t0: c.enter, t1: c.arrive, x0: CART_GEO.x0, x1: CART_GEO.xStop, dir: 1 },
    { t0: c.leave, t1: c.gone, x0: CART_GEO.xStop, x1: CART_GEO.xOut, dir: -1 },
  ];
}

function cartXFor(ms: number, c: ProductRun["cart"]) {
  let x = CART_GEO.x0;
  for (const w of cartWalksFor(c)) {
    if (ms >= w.t1) x = w.x1;
    else if (ms > w.t0) {
      const ease = w.dir > 0 ? EASE.inout : EASE.exit;
      return lerp(w.x0, w.x1, ease((ms - w.t0) / (w.t1 - w.t0)));
    }
  }
  return x;
}

function cartPusherPose(ms: number, c: ProductRun["cart"]) {
  const xFn = (t: number) => cartXFor(t, c);
  const cx = xFn(ms);
  const px = cx - 7.8;
  const v = deriv(xFn, ms);
  const amt = clamp(Math.abs(v) / 42);
  const dirSign = ms > c.leave ? -1 : 1;
  const st = solveWalkState(ms, cartWalksFor(c), xFn, 11.5, 42);
  const legs = [0, 1].map((i) => solveLegPhase(st, i, amt, dirSign, 1.9));

  const thigh = 4.6;
  const shin = 4.6;
  const LEN = thigh + shin - 0.35;
  let hh = Infinity;
  legs.forEach((l) => {
    if (l.lift < 0.35) {
      hh = Math.min(hh, Math.sqrt(Math.max(1, LEN * LEN - l.rx * l.rx)));
    }
  });
  if (!isFinite(hh)) {
    hh = Math.sqrt(Math.max(1, LEN * LEN - legs[0].rx * legs[0].rx));
  }

  const hip = { x: px, y: TRACK_TOP - 0.5 - hh };
  const ca = (t: number) => deriv2(xFn, t);
  const lean =
    14 +
    v * 0.08 +
    springBody(ca, c.enter - 40, Math.min(ms, c.gone + 80), 2.1, 0.48, 0.015, 8);
  const la = lean * D2R;
  const sh = {
    x: hip.x + Math.sin(la) * 6.0,
    y: hip.y - Math.cos(la) * 6.0,
  };
  const head = {
    x: sh.x + Math.sin(la) * 3.1 + 0.4,
    y: sh.y - Math.cos(la) * 3.1,
  };
  const knees = legs.map((l) =>
    ik(hip.x, hip.y, hip.x + l.rx, TRACK_TOP - 0.8 - l.lift, thigh, shin, 1),
  );
  const arm = ik(sh.x, sh.y, cx - 2.3, TRACK_TOP - 9.0, 3.8, 3.8, -1);
  return { cx, px, v, hip, sh, head, knees, arm, ca };
}

/* ---------- 2. Parameterized Box Carrier Kinematics (orderCarryPurple) ---------- */

function carryWalksFor(cy: ProductRun["carry"]): WalkSeg[] {
  return [
    { t0: cy.walkStart, t1: cy.walkEnd, x0: CARRY_GEO.x0, x1: CARRY_GEO.x1, dir: 1 },
    { t0: cy.backStart, t1: cy.backEnd, x0: CARRY_GEO.x1, x1: CARRY_GEO.xBack, dir: -1 },
  ];
}

function carryXFor(ms: number, cy: ProductRun["carry"]) {
  let x = CARRY_GEO.x0;
  for (const w of carryWalksFor(cy)) {
    if (ms >= w.t1) x = w.x1;
    else if (ms > w.t0) {
      return lerp(w.x0, w.x1, EASE.inout((ms - w.t0) / (w.t1 - w.t0)));
    }
  }
  return x;
}

function carryPose(ms: number, cy: ProductRun["carry"]) {
  const xFn = (t: number) => carryXFor(t, cy);
  const x = xFn(ms);
  const v = deriv(xFn, ms);
  const amt = clamp(Math.abs(v) / 48);
  const loaded = ms >= cy.grab && ms < cy.release;
  const dirSign = ms > cy.backStart && ms < cy.backEnd ? -1 : 1;
  const st = solveWalkState(ms, carryWalksFor(cy), xFn, loaded ? 12.2 : 13.8, 48);
  const legs = [0, 1].map((i) =>
    solveLegPhase(st, i, amt, dirSign, loaded ? 1.85 : 2.2),
  );

  const thigh = 4.9;
  const shin = 4.9;
  const LEN = thigh + shin - 0.4;
  let hh = Infinity;
  legs.forEach((l) => {
    if (l.lift < 0.35) {
      hh = Math.min(hh, Math.sqrt(Math.max(1, LEN * LEN - l.rx * l.rx)));
    }
  });
  if (!isFinite(hh)) {
    hh = Math.sqrt(Math.max(1, LEN * LEN - legs[0].rx * legs[0].rx));
  }
  const restH = Math.sqrt(LEN * LEN - 0.8);
  hh -= 0.75 * kick(ms, cy.grab);
  if (loaded) hh -= 0.35;
  if (ms >= cy.load && ms < cy.load + 440) {
    hh -= 1.45 * Math.sin(Math.PI * tw(ms, cy.load, 440, EASE.inout));
  }
  const hip = { x, y: TRACK_TOP - 0.5 - hh };

  const accel = (t: number) => deriv2(xFn, t);
  let lean =
    v * 0.024 +
    springBody(accel, cy.walkStart - 40, Math.min(ms, cy.fade), 1.8, 0.5, 0.015, 7);
  if (loaded) lean -= 2.2;
  if (ms >= cy.load && ms < cy.load + 440) {
    lean += 8 * Math.sin(Math.PI * tw(ms, cy.load, 440, EASE.inout));
  }
  const la = lean * D2R;
  const sh = {
    x: hip.x + Math.sin(la) * 6.5,
    y: hip.y - Math.cos(la) * 6.5,
  };
  const headSteady = (restH - hh) * 0.45;
  const head = {
    x: sh.x + Math.sin(la) * 3.1 + 0.3,
    y: sh.y - Math.cos(la) * 3.1 - headSteady,
  };
  const knees = legs.map((l) =>
    ik(hip.x, hip.y, hip.x + l.rx, TRACK_TOP - 0.8 - l.lift, thigh, shin, 1),
  );

  const carry = ms < cy.grab ? 0 : 1 - tw(ms, cy.release, 240, EASE.std);
  const reach = Math.sin(Math.PI * tw(ms, cy.load, 440, EASE.inout));
  const swing = -(legs[0].rx - legs[1].rx) * 0.42 * (1 - carry);
  const hang = { x: sh.x + 0.6 + swing, y: sh.y + 6.4 };
  const hold = { x: sh.x + 6.0, y: sh.y + 2.2 };
  const up = { x: sh.x + 7.8, y: sh.y - 1.2 };
  let hx = lerp(hang.x, hold.x, carry);
  let hy = lerp(hang.y, hold.y, carry);
  hx = lerp(hx, up.x, reach);
  hy = lerp(hy, up.y, reach);

  const armN = ik(sh.x, sh.y, hx, hy, 3.9, 3.9, -1);
  const shF = { x: sh.x - 0.6, y: sh.y + 0.4 };
  const armF = ik(shF.x, shF.y, hx - 0.8 - swing * 1.5, hy + 0.4, 3.9, 3.9, -1);
  // Single product photo-parcel rests squarely on the carrier's bent forearms!
  const boxAnchor = { x: armN.ex + 1.4, y: armN.ey - 1.0 };
  const carrySwing = springBody(
    accel,
    cy.walkStart - 40,
    Math.min(ms, cy.toss),
    3.1,
    0.4,
    4.4,
    13,
  );
  return { x, v, hip, sh, head, knees, armN, armF, shF, boxAnchor, lean, carrySwing };
}

/* ---------- 3. Parameterized Rocket Kinematics (208 -> 248) ---------- */

function rocketStateFor(ms: number, R: ProductRun["rocket"]) {
  const flightPos = (t: number) =>
    rocketPath(EASE.inout(clamp((t - R.flightStart) / R.flightMs)));

  let x = ROCKET_PAD.x;
  let y = ROCKET_PAD.y;
  let tilt = 0;
  let th = 0;
  let sq = 1;
  let p = -1;
  let op = 0;
  let legs = 1;
  let comp = 0;
  const s = sp(ms, R.appear) * ROCKET_SCALE;

  if (ms >= R.appear) {
    op = tw(ms, R.appear, 180, EASE.std);
    y += (1 - sp(ms, R.appear)) * 6;
  }

  sq -= 0.065 * kick(ms, R.loaded);
  comp += 1.0 * kick(ms, R.loaded);

  if (ms >= R.ignite && ms < R.flightStart) {
    const k = tw(ms, R.ignite, R.flightStart - R.ignite, EASE.inout);
    tilt = lerp(0, 12, k);
    th = 1.25 * k;
    x += Math.sin(ms * 1.15) * 0.35 * k;
    y += Math.sin(ms * 1.7) * 0.22 * k + 0.45 * k;
    comp += 0.55 * k;
  }

  if (ms >= R.flightStart && ms < R.touchdown) {
    p = tw(ms, R.flightStart, R.flightMs, EASE.inout);
    const b = flightPos(ms);
    x = b.x;
    y = b.y;
    const a = flightPos(ms - 10);
    const c = flightPos(ms + 10);
    const vx = (c.x - a.x) * 50;
    const vy = (c.y - a.y) * 50;
    const velAng = Math.atan2(vx, -vy) / D2R;
    const retro = tw(ms, R.touchdown - 440, 440, EASE.inout);
    tilt = lerp(clamp(velAng, 0, 145), 0, retro);
    th =
      p < 0.3
        ? lerp(1.25, 0.6, p / 0.3)
        : p < 0.65
          ? lerp(0.6, 0.42, (p - 0.3) / 0.35)
          : lerp(0.42, 1.18, clamp((p - 0.65) / 0.3));
    x += Math.sin(ms * 1.15) * 0.25 * (1 - clamp(p / 0.14));
    legs =
      1 -
      tw(ms, R.flightStart + 120, 260, EASE.std) +
      sp(ms, R.touchdown - 400);
  } else if (ms >= R.touchdown) {
    x = ROCKET_LAND.x;
    y = ROCKET_LAND.y;
    tilt = 0;
    legs = 1;
    comp = 1.55 * kick(ms, R.touchdown);
    sq = 1 - 0.07 * kick(ms, R.touchdown);
    th = 1.05 * (1 - tw(ms, R.touchdown, 280, EASE.std));
    comp += 0.85 * kick(ms, R.handOff);
    if (ms >= R.relight && ms < R.leave) {
      th = tw(ms, R.relight, 90, EASE.std) * 1.25;
      x += Math.sin(ms * 1.15) * 0.3;
      comp += 0.55;
    }
    if (ms >= R.leave) {
      const k = tw(ms, R.leave, 440, EASE.exit);
      y = lerp(ROCKET_LAND.y, -95, k);
      th = 1.25;
      legs = 1 - tw(ms, R.leave + 20, 200, EASE.std);
    }
    if (ms >= R.leave + 240) {
      op *= 1 - tw(ms, R.leave + 240, 190, EASE.std);
    }
  }

  return { x, y, tilt, th, s, sq, p, op, legs: clamp(legs, 0, 1.1), comp };
}

type RocketState = ReturnType<typeof rocketStateFor>;

function nozzle(st: RocketState) {
  const a = st.tilt * D2R;
  const d = 7.2 * st.s;
  return {
    x: st.x - Math.sin(a) * d,
    y: st.y + Math.cos(a) * d,
    ex: -Math.sin(a),
    ey: Math.cos(a),
  };
}

/* ---------- 4. Truck Kinematics (stops AFTER landed rocket: 268.55 > 248!) ---------- */

function truckX(ms: number) {
  const K = TRUCK;
  if (ms < K.backStart) return K.xStart;
  if (ms < K.backStart + K.backMs) {
    return lerp(K.xStart, K.xMeet, EASE.inout((ms - K.backStart) / K.backMs));
  }
  if (ms < K.goStart) return K.xMeet;
  if (ms < K.goStart + K.goMs) {
    return lerp(K.xMeet, K.xPickup, EASE.inout((ms - K.goStart) / K.goMs));
  }
  if (ms < K.finishStart) return K.xPickup;
  if (ms < K.finishStart + K.finishMs) {
    return lerp(
      K.xPickup,
      K.xEnd,
      EASE.inout((ms - K.finishStart) / K.finishMs),
    );
  }
  return K.xEnd;
}

const truckA = (t: number) => deriv2(truckX, t);
const WHEEL_R = 2.0;
const truckPitch = (ms: number) =>
  springBody(truckA, TRUCK.backStart - 40, ms, 2.5, 0.42, 1.5, 5.5);

function roofSlot(
  tx: number,
  pitch: number,
  tb: number,
  baseY: number,
  dx: number,
) {
  // Cargo roof sits at local y = -11.2 above wheel bottom; parcel sits flush on top of cargo bed
  const dy = -9.6;
  const a = pitch * D2R;
  return {
    x: tx + dx * Math.cos(a) - dy * Math.sin(a),
    y: baseY + tb - 2.0 + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

/* ---------- DOM Parts Collector ---------- */

export type TimelineParts = Record<string, any>;
const NS = "http://www.w3.org/2000/svg";

export function collectTimelineParts(root: Element): TimelineParts {
  const q = (c: string) => root.querySelector(".x-" + c);
  const S: TimelineParts = {};
  [
    "rail",
    "fillMain",
    "fillMainStroke",
    "fillSub",
    "fillSubStroke",
    "cyanShimmer",
    "ring",
    "ring2",
    "shCart",
    "shP0",
    "shP1",
    "shCarry",
    "shRock",
    "shTruck",
    "heat",
    "cart",
    "cartPusher",
    "cartLegF",
    "cartLegN",
    "cartTorso",
    "cartHead",
    "cartArm",
    "cartRig",
    "cartDeck",
    "cartBox1",
    "work",
    "workInner",
    "workDesk",
    "workTopBox",
    "workGarment",
    "workTorso",
    "workFarArm",
    "workHair",
    "workHead",
    "workArm",
    "carry",
    "carryFront",
    "carryArmF",
    "carryArmN",
    "carryLegF",
    "carryLegN",
    "carryTorso",
    "carryHead",
    "truck",
    "tbody",
    "tlines",
    "brake",
    "rev",
    "rocket",
    "rframe",
    "rlegs",
    "rocketInner",
    "flame",
    "glow",
    "rlines",
    "legL",
    "legR",
    "rocketPort",
    "rPhoto0",
    "rPhoto1",
    "parcel0",
    "parcel0Inner",
    "parcel0Border",
    "parcel0Frame",
    "parcel0Tape",
    "parcel1",
    "parcel1Inner",
    "parcel1Frame",
    "parcel1Tape",
  ].forEach((k) => {
    S[k] = q(k);
  });
  S.dots = Array.from(root.querySelectorAll(".x-dot"));
  S.wheels = Array.from(root.querySelectorAll(".x-wh"));
  S.wheelHubs = Array.from(root.querySelectorAll(".x-whHub"));
  S.cartWheels = Array.from(root.querySelectorAll(".x-cartWh"));

  const sg = q("smoke");
  if (sg) {
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
    S.trail = make(28, "#E7E7EB");
    S.ground = make(10, "#E9E5DD");
    S.live = make(6, "#E7E7EB");
    S.exh = make(6, "#D9D9DE");
    S.dust = make(9, "#E6E0D4");
    S.roadDust = make(5, "#E2E0EA");
  }
  return S;
}

const A = (el: Element | null | undefined, k: string, v: number | string) => {
  if (!el) return;
  el.setAttribute(k, typeof v === "number" ? String(+v.toFixed(3)) : v);
};

/* ---------- Dual-Zone Non-Overlapping HUD Reported Back to React ---------- */

export type FloatingBadgeKind =
  | "Packing"
  | "Shipping Operations"
  | "Remaining 1 Day"
  | "Waiting Pickup 30";

export type LiveTimelineHud = {
  visualStage: OrderStage;
  isMoving: boolean;
  prepCount: number;
  shipCount: number;
  delivCount: number;
  badgeLeft: FloatingBadgeKind | null;
  badgeLeftX: number;
  badgeLeftY: number;
  badgeRight: FloatingBadgeKind | null;
  badgeRightX: number;
  badgeRightY: number;
};

export function hudAt(
  ms: number,
  idleStage: OrderStage | null,
  leftX = 69,
  rightX = 258,
): LiveTimelineHud {
  if (idleStage) {
    const prepCount =
      idleStage === "preparing"
        ? 2
        : idleStage === "split" || idleStage === "showcase"
          ? 1
          : 0;
    const shipCount =
      idleStage === "split" || idleStage === "showcase"
        ? 1
        : idleStage === "shipped" || idleStage === "pickup"
          ? 2
          : 0;
    const delivCount = idleStage === "delivered" ? 2 : 0;
    return {
      visualStage: idleStage,
      isMoving: false,
      prepCount,
      shipCount,
      delivCount,
      badgeLeft: null,
      badgeLeftX: leftX,
      badgeLeftY: 3,
      badgeRight: null,
      badgeRightX: rightX,
      badgeRightY: 3,
    };
  }

  // Compute each product's live individual stage
  let prepCount = 0;
  let shipCount = 0;
  let delivCount = 0;
  for (const r of RUNS) {
    if (ms < r.rocket.loaded) prepCount++;
    else if (ms < r.delivHopStart + r.delivHopMs) shipCount++;
    else delivCount++;
  }

  // Left-zone label: active whenever any product is still in Preparing
  const badgeLeft: FloatingBadgeKind | null = prepCount > 0 ? "Packing" : null;

  // Right-zone label: active whenever any product is in Shipped / Shipping / Pickup
  let badgeRight: FloatingBadgeKind | null = null;
  if (shipCount > 0) {
    const rocket0Flying =
      ms >= RUNS[0].rocket.loaded && ms < RUNS[0].rocket.handOff + 220;
    const rocket1Flying =
      ms >= RUNS[1].rocket.loaded && ms < RUNS[1].rocket.handOff + 220;
    if (ms >= TRUCK.goStart + TRUCK.goMs * 0.45 && ms < DELIVER_DONE - 180) {
      badgeRight = "Waiting Pickup 30";
    } else if (rocket0Flying || rocket1Flying) {
      badgeRight = "Shipping Operations";
    } else if (ms < DELIVER_DONE - 180) {
      badgeRight = "Remaining 1 Day";
    }
  }

  let visualStage: OrderStage = "preparing";
  if (delivCount === 2) visualStage = "delivered";
  else if (prepCount > 0 && shipCount > 0) visualStage = "split";
  else if (badgeRight === "Waiting Pickup 30") visualStage = "pickup";
  else if (shipCount > 0) visualStage = "shipped";

  return {
    visualStage,
    isMoving: true,
    prepCount,
    shipCount,
    delivCount,
    badgeLeft,
    badgeLeftX: leftX,
    badgeLeftY: 3,
    badgeRight,
    badgeRightX: rightX,
    badgeRightY: 3,
  };
}

/* ---------- Main Frame Renderer (Zero React Re-Renders!) ---------- */

export function renderTimelineScene(
  S: TimelineParts,
  ms: number,
  clk: number,
  idleStage: OrderStage | null,
  reduce = false,
): LiveTimelineHud {
  const loop = idleStage && !reduce ? idleStage : null;
  const atRest = idleStage !== null;

  if (idleStage === "showcase") {
    hideAllActors(S);
    A(S.rail, "fill", LINE_GREY);
    A(S.fillMain, "width", 84);
    A(S.fillMain, "fill", PURPLE);
    A(S.fillMainStroke, "opacity", 0);
    A(S.fillSub, "opacity", 0);
    A(S.fillSubStroke, "opacity", 0);
    A(S.cyanShimmer, "opacity", 0);
    A(S.dots[0], "fill", PURPLE);
    A(S.dots[1], "fill", DOT_HINT);
    A(S.dots[2], "fill", LINE_GREY);
    A(S.ring, "opacity", 0);
    A(S.ring2, "opacity", 0);
    return hudAt(ms, idleStage);
  }

  if (atRest) {
    hideAllActors(S);
    return renderRestingStage(S, idleStage, clk, loop);
  }

  /* =====================================================================
     LIVE DUAL-PRODUCT PHYSICS JOURNEY (grounded cleanly on TRACK_TOP = 35.2)
     ===================================================================== */

  // Pick whichever product currently owns each reusable station (disjoint windows!)
  const activeCartRun =
    ms >= RUNS[1].cart.enter - 60 ? RUNS[1] : RUNS[0];
  const activeWorkRun =
    ms >= RUNS[1].work.appear - 60 ? RUNS[1] : RUNS[0];
  const activeCarryRun =
    ms >= RUNS[1].carry.appear - 60 ? RUNS[1] : RUNS[0];
  const activeRocketRun =
    ms >= RUNS[1].rocket.appear - 40 ? RUNS[1] : RUNS[0];

  // 1. SUPPLIER CART (orderCartPurple: 2-bone IK striding pusher + spinning wheels + photo-box on top!)
  const CP = cartPusherPose(ms, activeCartRun.cart);
  const cPitch = springBody(
    CP.ca,
    activeCartRun.cart.enter - 40,
    Math.min(ms, activeCartRun.cart.gone + 80),
    2.5,
    0.45,
    1.3,
    5.5,
  );
  const cartBoxSwing = springBody(
    CP.ca,
    activeCartRun.cart.enter - 40,
    Math.min(ms, activeCartRun.cart.gone + 80),
    3.4,
    0.34,
    2.5,
    11,
  );
  const cartRoadBump =
    Math.abs(CP.v) > 2
      ? Math.sin(CP.cx * 1.1) * 0.2 * clamp(Math.abs(CP.v) / 40)
      : 0;
  {
    const c = activeCartRun.cart;
    const cIn = tw(ms, c.enter, 200, EASE.std);
    const cOut = 1 - tw(ms, c.leave + 200, 320, EASE.exit);
    const cOp = ms >= c.enter && ms <= c.gone ? cIn * cOut : 0;

    A(S.cart, "opacity", cOp);
    const legPath = (k: ReturnType<typeof ik>) =>
      `M${P(CP.hip.x, CP.hip.y)} L${P(k.jx, k.jy)} L${P(k.ex, k.ey)}`;
    A(S.cartLegN, "d", legPath(CP.knees[0]));
    A(S.cartLegF, "d", legPath(CP.knees[1]));
    A(
      S.cartTorso,
      "d",
      `M${P(CP.hip.x, CP.hip.y - 0.7)} L${P(CP.sh.x, CP.sh.y + 0.5)}`,
    );
    A(S.cartHead, "cx", CP.head.x);
    A(S.cartHead, "cy", CP.head.y);
    A(
      S.cartArm,
      "d",
      `M${P(CP.sh.x, CP.sh.y)} L${P(CP.arm.jx, CP.arm.jy)} L${P(CP.arm.ex, CP.arm.ey)}`,
    );

    A(S.cartRig, "transform", `translate(${CP.cx} ${TRACK_TOP})`);
    A(
      S.cartDeck,
      "transform",
      `translate(0 ${cartRoadBump}) rotate(${cPitch * 0.5} 4.5 -1.5)`,
    );
    A(S.cartBox1, "transform", `rotate(${cartBoxSwing * 0.7} 4.8 -1.8)`);

    const cwang = (CP.cx - CART_GEO.x0) / CART_WHEEL_R / D2R;
    S.cartWheels?.forEach((w: Element) => A(w, "transform", `rotate(${cwang})`));
    A(S.shCart, "cx", CP.cx);
    A(S.shCart, "opacity", 0.12 * cOp);
  }

  // 2. PACKING STATION (orderWorkTrack: articulated ponytail, dual arms, garment fold, desk kick)
  const workFoldWave = Math.sin(
    Math.max(0, ms - activeWorkRun.work.appear) / 155,
  );
  {
    const w = activeWorkRun.work;
    const wIn = sp(ms, w.appear);
    let wOp = ms >= w.appear ? tw(ms, w.appear, 200, EASE.std) : 0;
    if (ms >= w.fade) wOp *= 1 - tw(ms, w.fade, 260, EASE.exit);
    const wS = lerp(0.84, 1, wIn);
    const wDy = (1 - wIn) * 4;
    const deskKick = 0.85 * kick(ms, w.impact) + 0.55 * kick(ms, w.seal);

    A(S.work, "opacity", wOp);
    A(
      S.work,
      "transform",
      `translate(${WORK_GEO.x + 10} ${WORK_GEO.yLive + 19.2 + wDy}) scale(${wS}) translate(-10 -19.2)`,
    );
    A(S.workDesk, "transform", `translate(0 ${deskKick * 0.45})`);
    A(S.workTopBox, "transform", `translate(0 ${-Math.abs(kick(ms, w.seal)) * 1.4})`);

    const tPack = Math.max(0, ms - w.appear);
    const foldLag = Math.sin((tPack - 90) / 155);
    A(S.workTorso, "transform", `rotate(${workFoldWave * 2.2} 3.5 18.0)`);
    A(S.workHair, "transform", `rotate(${foldLag * 9} 2.3 2.1)`);
    A(S.workHead, "transform", `rotate(${workFoldWave * 4.5} 3.6 3.5)`);
    A(S.workArm, "transform", `rotate(${workFoldWave * 9.5} 3.2 5.6)`);
    A(S.workFarArm, "transform", `rotate(${-workFoldWave * 5.5} 6.5 4.8)`);
    A(
      S.workGarment,
      "transform",
      `translate(9.5 10.5) scale(${1 + workFoldWave * 0.055} ${1 - workFoldWave * 0.065}) translate(-9.5 -10.5)`,
    );
  }

  // 3. BOX CARRIER (orderCarryPurple: holds ONE product photo-box with 2-bone IK stride!)
  const M = carryPose(ms, activeCarryRun.carry);
  {
    const cy = activeCarryRun.carry;
    const mIn = sp(ms, cy.appear);
    let mOp = ms >= cy.appear ? tw(ms, cy.appear, 180, EASE.std) : 0;
    if (ms >= cy.fade) mOp *= 1 - tw(ms, cy.fade, 260, EASE.exit);
    const mS = lerp(0.86, 1, mIn);
    const mDy = (1 - mIn) * 4;
    const mT = `translate(${M.x} ${TRACK_TOP + mDy}) scale(${mS}) translate(${-M.x} ${-TRACK_TOP})`;
    A(S.carry, "transform", mT);
    A(S.carryFront, "transform", mT);
    A(S.carry, "opacity", mOp);
    A(S.carryFront, "opacity", mOp);

    const legPath = (k: ReturnType<typeof ik>) =>
      `M${P(M.hip.x, M.hip.y)} L${P(k.jx, k.jy)} L${P(k.ex, k.ey)}`;
    A(S.carryLegN, "d", legPath(M.knees[0]));
    A(S.carryLegF, "d", legPath(M.knees[1]));
    A(
      S.carryTorso,
      "d",
      `M${P(M.hip.x, M.hip.y - 0.8)} L${P(M.sh.x, M.sh.y + 0.6)}`,
    );
    A(S.carryHead, "cx", M.head.x);
    A(S.carryHead, "cy", M.head.y);
    A(
      S.carryArmN,
      "d",
      `M${P(M.sh.x, M.sh.y)} L${P(M.armN.jx, M.armN.jy)} L${P(M.armN.ex, M.armN.ey)}`,
    );
    A(
      S.carryArmF,
      "d",
      `M${P(M.shF.x, M.shF.y)} L${P(M.armF.jx, M.armF.jy)} L${P(M.armF.ex, M.armF.ey)}`,
    );
    A(S.shCarry, "cx", M.x);
    A(S.shCarry, "opacity", 0.12 * mOp);
  }

  // 4. XD PURPLE ROCKET (208 -> 248 gravity turn + product photo peeking inside porthole!)
  const R = rocketStateFor(ms, activeRocketRun.rocket);
  {
    const rk = activeRocketRun.rocket;
    const flick =
      R.th * (0.86 + 0.22 * Math.sin(ms / 31) + 0.08 * Math.sin(ms / 13));
    const tiltRate =
      R.p >= 0
        ? (rocketStateFor(ms + 16, rk).tilt - rocketStateFor(ms - 16, rk).tilt) / 32
        : 0;
    const gimbal = clamp(-tiltRate * 240, -14, 14);

    A(
      S.rocket,
      "transform",
      `translate(${R.x} ${R.y}) scale(${1 / Math.sqrt(R.sq)} ${R.sq})`,
    );
    A(S.rframe, "transform", `rotate(${R.tilt})`);
    A(S.rocketInner, "transform", `rotate(-45) scale(${R.s}) translate(-9.85 -10.0)`);
    A(S.rocket, "opacity", R.op);
    A(S.flame, "opacity", R.th > 0.02 ? 1 : 0);
    A(
      S.flame,
      "transform",
      `translate(5.26 12.84) rotate(${135 + gimbal}) scale(${Math.max(
        flick,
        0.001,
      )} ${0.55 + 0.45 * clamp(R.th)})`,
    );
    A(S.glow, "opacity", clamp(R.th) * 0.72);
    A(S.glow, "r", 3.0 + flick * 3.2);
    const speedLinesOp = R.p >= 0 ? clamp(Math.sin(Math.PI * R.p) * 1.5) : 0.25;
    A(S.rlines, "opacity", speedLinesOp);

    // Show the currently boarded product photo inside the XD rocket's circular porthole!
    const aboard = ms >= rk.loaded - 60 && ms < rk.handOff + 80;
    const portOp = aboard
      ? tw(ms, rk.loaded - 60, 140, EASE.std) *
        (1 - tw(ms, rk.handOff, 100, EASE.std))
      : 0;
    A(S.rocketPort, "opacity", portOp);
    A(S.rPhoto0, "opacity", activeRocketRun.id === 0 ? 1 : 0);
    A(S.rPhoto1, "opacity", activeRocketRun.id === 1 ? 1 : 0);

    A(S.rlegs, "opacity", R.legs > 0.02 ? 1 : 0);
    const legGeo = (side: number) => {
      const k = R.legs;
      const s = R.s;
      const hx = side * 1.6 * s;
      const hy = 3.0 * s;
      const fx = lerp(side * 2.2, side * 5.8, k) * s;
      const fy = (lerp(6.4, 10.6, k) - R.comp) * s;
      return `M${P(hx, hy)} L${P(fx, fy)} M${P(fx - 1.1 * s, fy)} L${P(
        fx + 1.1 * s,
        fy,
      )}`;
    };
    A(S.legL, "d", legGeo(-1));
    A(S.legR, "d", legGeo(1));

    const rh = clamp((ROCKET_PAD.y - R.y) / 60);
    A(S.shRock, "cx", R.x);
    A(S.shRock, "rx", 7.2 * R.s * (1 - rh * 0.65));
    A(S.shRock, "opacity", 0.13 * R.op * (1 - rh));

    const near = clamp(1 - (ROCKET_PAD.y - R.y) / 28);
    A(S.heat, "cx", R.x);
    A(S.heat, "opacity", clamp(R.th) * near * 0.55 * R.op);

    // 28-particle cooling smoke trail for the active rocket run
    S.trail?.forEach((c: Element, i: number) => {
      const t0 =
        rk.flightStart - 100 + i * ((rk.flightMs + 200) / S.trail.length);
      const life = 1050;
      if (ms < t0 || ms > t0 + life) return A(c, "opacity", 0);
      const st = rocketStateFor(t0, rk);
      const nz = nozzle(st);
      const k = (ms - t0) / life;
      const g = EASE.std(k);
      const push = 3.6 + st.th * 4.2;
      A(c, "cx", nz.x + nz.ex * push * g + (i % 2 ? 1 : -1) * g * 1.6);
      A(c, "cy", nz.y + nz.ey * push * g + g * 2.6 - k * k * 4.2);
      A(c, "r", 1.0 + g * (2.4 + st.th * 2.1));
      A(c, "opacity", 0.68 * (1 - k) * clamp(st.th * 1.4));
    });

    const events: [number, number][] = [
      [RUNS[0].rocket.ignite + 20, ROCKET_PAD.x],
      [RUNS[0].rocket.touchdown - 200, ROCKET_LAND.x],
      [RUNS[0].rocket.relight + 10, ROCKET_LAND.x],
      [RUNS[1].rocket.ignite + 20, ROCKET_PAD.x],
      [RUNS[1].rocket.touchdown - 200, ROCKET_LAND.x],
      [RUNS[1].rocket.relight + 10, ROCKET_LAND.x],
    ];
    let ev: [number, number] | null = null;
    for (const e of events) if (ms >= e[0] && ms < e[0] + 900) ev = e;
    S.ground?.forEach((c: Element, i: number) => {
      if (!ev) return A(c, "opacity", 0);
      const k = (ms - ev[0]) / 900;
      const g = EASE.flight(k);
      const dir = i % 2 ? 1 : -1;
      const lane = Math.floor(i / 2);
      A(c, "cx", ev[1] + dir * (2 + g * (5.5 + lane * 4.2)));
      A(c, "cy", TRACK_TOP - 1.0 - g * (0.8 + lane * 0.85));
      A(c, "r", 1.0 + g * (1.7 + lane * 0.65));
      A(c, "opacity", 0.78 * (1 - k));
    });
    S.live?.forEach((c: Element) => A(c, "opacity", 0));
  }

  // 5. XD PERIWINKLE TRUCK (stops AFTER landed rocket: 268.55 > 248!)
  const tx = truckX(ms);
  const tv = deriv(truckX, ms);
  const ta = truckA(ms);
  const pitch = truckPitch(ms);
  let tb = 0;
  {
    const K = TRUCK;
    if (Math.abs(tv) > 2) {
      tb = Math.sin(tx * 1.1) * 0.22 * clamp(Math.abs(tv) / 80);
    }
    if (ms >= K.show && Math.abs(tv) < 2) {
      tb += 0.1 * Math.sin(ms / 22);
    }
    // Suspension compresses on BOTH Product 0 and Product 1 roof landings!
    tb += 0.75 * kick(ms, RUNS[0].truckTakes) + 0.85 * kick(ms, RUNS[1].truckTakes);

    let tOp = tw(ms, K.show, 260, EASE.std);
    if (ms >= K.finishStart + 100) {
      tOp *= 1 - tw(ms, K.finishStart + 100, 280, EASE.exit);
    }
    A(S.truck, "transform", `translate(${tx} ${TRACK_TOP})`);
    A(S.truck, "opacity", tOp);
    A(S.tbody, "transform", `translate(0 ${tb}) rotate(${pitch} 0 -2)`);

    const wang = (tx - K.xMeet) / WHEEL_R / D2R;
    S.wheels?.forEach((w: Element) => A(w, "transform", `rotate(${wang})`));
    S.wheelHubs?.forEach((h: Element) => A(h, "opacity", tOp > 0.05 ? 1 : 0));

    const fwd = tv > 2;
    A(S.tlines, "opacity", tv < -2 ? 0 : 1);
    A(
      S.tlines,
      "transform",
      fwd ? `translate(${-0.8 - 0.9 * Math.sin(ms / 34)} 0)` : "translate(0 0)",
    );
    A(S.rev, "opacity", tv < -2 ? 0.95 : 0);
    const braking =
      (Math.abs(tv) > 3 && ta * tv < 0) ||
      (ms > K.backStart + K.backMs && ms < K.backStart + K.backMs + 280) ||
      (ms > K.goStart + K.goMs && ms < K.goStart + K.goMs + 320);
    A(S.brake, "opacity", braking ? 0.95 : 0);
    A(S.shTruck, "cx", tx + 1);
    A(S.shTruck, "opacity", 0.13 * tOp);

    S.exh?.forEach((c: Element, i: number) => {
      const t0 = (i < 3 ? K.backStart : K.goStart) + (i % 3) * 85;
      const k = (ms - t0) / 620;
      if (k < 0 || k > 1) return A(c, "opacity", 0);
      const g = EASE.std(k);
      A(c, "cx", tx - 10 - g * 4.5);
      A(c, "cy", TRACK_TOP - 2.0 - g * 3.2);
      A(c, "r", 0.8 + g * 2.1);
      A(c, "opacity", 0.65 * (1 - k));
    });

    const DUST: [number, number, number][] = [
      [RUNS[0].cart.arrive - 140, CART_GEO.xStop + 6, -1],
      [K.backStart + K.backMs * 0.72, truckX(K.backStart + K.backMs * 0.72) - 4, 1],
      [K.goStart + K.goMs * 0.72, truckX(K.goStart + K.goMs * 0.72) + 6, -1],
    ];
    S.dust?.forEach((c: Element, i: number) => {
      const [t0b, wx, away] = DUST[Math.floor(i / 3)];
      const j = i % 3;
      const t0 = t0b + j * 65;
      const k = (ms - t0) / 560;
      if (k < 0 || k > 1) return A(c, "opacity", 0);
      const g = EASE.flight(k);
      A(c, "cx", wx + away * g * (4 + j * 2));
      A(c, "cy", TRACK_TOP - 1.0 - g * (1.4 + j * 0.7));
      A(c, "r", 0.8 + g * 1.6);
      A(c, "opacity", 0.68 * (1 - k));
    });
    S.roadDust?.forEach((c: Element) => A(c, "opacity", 0));
  }

  // 6. PER-PRODUCT PHOTO-PARCELS (Product 0 = Blue Pajama, Product 1 = Pink Shirt)
  //    Each product photo IS the delivered box moving along its own independent journey!
  for (const run of RUNS) {
    const pEl = run.id === 0 ? S.parcel0 : S.parcel1;
    const pIn = run.id === 0 ? S.parcel0Inner : S.parcel1Inner;
    const pFrame = run.id === 0 ? S.parcel0Frame : S.parcel1Frame;
    const pTape = run.id === 0 ? S.parcel0Tape : S.parcel1Tape;
    const shEl = run.id === 0 ? S.shP0 : S.shP1;

    let bx = CART_GEO.x0 + 4.4;
    let by = TRACK_TOP - 10.2;
    let bs = 0.78;
    let br = 0;
    let bOp = 0;
    let sqX = 1;
    let sqY = 1;
    let frameOp = 1;
    let tapeOp = 0;
    let free = false;

    const squash = (t0: number, amt = 1) => {
      const k = kick(ms, t0) * amt;
      sqY -= 0.14 * k;
      sqX += 0.1 * k;
    };

    const { cart, work, carry, rocket } = run;

    if (ms < cart.enter) {
      bOp = 0;
    } else if (ms < cart.unload) {
      // Riding on top of Supplier Cart crate with spring-damper inertia!
      const cPose = run.id === activeCartRun.id ? CP : cartPusherPose(ms, cart);
      const bSw =
        run.id === activeCartRun.id
          ? cartBoxSwing
          : springBody(cPose.ca, cart.enter - 40, ms, 3.4, 0.34, 2.5, 11);
      bx = cPose.cx + 4.6;
      by = TRACK_TOP - 9.8 + cartRoadBump;
      bs = 0.76;
      br = bSw * 0.9;
      bOp = tw(ms, cart.enter, 200, EASE.std);
      tapeOp = 0;
    } else if (ms < work.impact) {
      // Popping off Supplier Cart onto Packing Desk!
      const p = clamp((ms - cart.unload) / (work.impact - cart.unload));
      const q = arc(
        p,
        CART_GEO.xStop + 4.6,
        TRACK_TOP - 9.8,
        WORK_GEO.x + 12.2,
        WORK_GEO.yLive + 7.2,
        10,
      );
      bx = q.x;
      by = q.y;
      bs = lerp(0.76, 0.82, p);
      br = 14 * Math.sin(p * Math.PI);
      bOp = 1;
      free = true;
    } else if (ms < carry.grab) {
      // Seated on Packing Desk while worker folds & seals it!
      bx = WORK_GEO.x + 12.2;
      by =
        WORK_GEO.yLive +
        7.2 +
        (run.id === activeWorkRun.id ? workFoldWave * 0.45 : 0);
      bs = 0.82;
      br = run.id === activeWorkRun.id ? workFoldWave * 2.5 : 0;
      bOp = 1;
      tapeOp = tw(ms, work.seal, 180, EASE.std);
      squash(work.impact, 0.9);
      squash(work.seal, 0.65);
    } else if (ms < carry.toss) {
      // Held individually in the arms of orderCarryPurple!
      const mPose = run.id === activeCarryRun.id ? M : carryPose(ms, carry);
      bx = mPose.boxAnchor.x;
      by = mPose.boxAnchor.y;
      bs = 0.85;
      br = mPose.lean * 0.45 + mPose.carrySwing;
      bOp = 1;
      tapeOp = 1;
      squash(carry.grab, 0.75);
    } else if (ms < rocket.loaded) {
      // Parabolic throw RIGHTWARD from carrier into XD Rocket at x = 208!
      const a0 = carryPose(carry.toss, carry).boxAnchor;
      const p = clamp((ms - carry.toss) / carry.tossMs);
      const q = arc(p, a0.x, a0.y, ROCKET_PAD.x, ROCKET_PAD.y - 2, 13);
      bx = q.x;
      by = q.y;
      bs = lerp(0.85, 0.34, EASE.std(p));
      br = -14 * Math.sin(p * Math.PI);
      bOp = 1 - clamp((p - 0.74) / 0.26);
      tapeOp = 1;
      free = true;
    } else if (ms < rocket.handOff) {
      // Safely aboard the XD Rocket (visible inside the rocket's circular porthole!)
      bOp = 0;
    } else if (ms < run.truckTakes) {
      // Parabolic handoff RIGHTWARD from landed rocket (248) onto truck roof AFTER rocket (268.55)!
      const p = clamp((ms - rocket.handOff) / (run.truckTakes - rocket.handOff));
      const rSlot = roofSlot(TRUCK.xMeet, pitch, tb, TRACK_TOP, run.roofDx);
      const q = arc(p, ROCKET_LAND.x, ROCKET_LAND.y - 1, rSlot.x, rSlot.y, 9.5);
      bx = q.x;
      by = q.y;
      bs = lerp(0.34, 0.74, EASE.std(clamp(p * 1.25)));
      br = 14 * Math.sin(p * Math.PI);
      bOp = clamp(p / 0.14);
      tapeOp = 1;
      free = true;
    } else if (ms < run.delivHopStart) {
      // Riding securely on the Periwinkle Truck cargo roof with suspension bounce & tilt!
      const rSlot = roofSlot(tx, pitch, tb, TRACK_TOP, run.roofDx);
      bx = rSlot.x;
      by = rSlot.y;
      bs = 0.74;
      br = pitch * 0.9;
      bOp = 1;
      tapeOp = 1;
      squash(run.truckTakes, 0.85);
    } else if (ms < run.delivHopStart + run.delivHopMs) {
      // Parabolic hop off truck onto exact XD Home Page – 66 Delivered resting slot!
      const p = clamp((ms - run.delivHopStart) / run.delivHopMs);
      const r0 = roofSlot(
        truckX(run.delivHopStart),
        0,
        0,
        TRACK_TOP,
        run.roofDx,
      );
      const q = arc(p, r0.x, r0.y, run.delivX, 15, 10);
      bx = q.x;
      by = q.y;
      bs = lerp(0.74, 1.0, EASE.std(p));
      br = 10 * Math.sin(p * Math.PI);
      bOp = 1;
      frameOp = 1 - EASE.std(p);
      tapeOp = 1 - EASE.std(p);
      free = true;
    } else {
      // Settled at exact XD Delivered position (344 Shirt, 355 Pajama, y = 15)!
      bx = run.delivX;
      by = 15;
      bs = 1.0;
      br = 0;
      bOp = 1;
      frameOp = 0;
      tapeOp = 0;
      squash(run.delivHopStart + run.delivHopMs, 0.65);
    }

    A(pEl, "transform", `translate(${bx} ${by}) rotate(${br}) scale(${bs})`);
    A(pIn, "transform", `scale(${sqX} ${sqY})`);
    A(pEl, "opacity", bOp);
    A(pFrame, "opacity", frameOp);
    A(pTape, "opacity", tapeOp);

    const bh = clamp((TRACK_TOP - (by + 6 * bs)) / 42);
    A(shEl, "cx", bx);
    A(shEl, "rx", 4.2 * bs * (1 - bh * 0.6));
    A(shEl, "opacity", free ? 0.13 * bOp * (1 - bh) : 0);
  }

  // 7. LIVE PROGRESS TRACK BARS & MILESTONE DOTS (follows lead product cleanly!)
  {
    const delivered = ms >= DELIVER_DONE;
    const r0 = RUNS[0];
    let endX = 57;
    if (ms < r0.cart.arrive) {
      endX = clamp(cartXFor(ms, r0.cart) + 8, 22, 82);
    } else if (ms < r0.carry.walkStart) {
      endX = lerp(82, 96, tw(ms, r0.cart.arrive, 480, EASE.std));
    } else if (ms < r0.carry.toss) {
      endX = clamp(carryPose(ms, r0.carry).boxAnchor.x + 6, 96, 204);
    } else if (ms < r0.rocket.flightStart) {
      endX = lerp(204, 212, tw(ms, r0.carry.toss, r0.carry.tossMs, EASE.std));
    } else if (ms < r0.rocket.touchdown) {
      const rp = rocketStateFor(ms, r0.rocket).p;
      endX = lerp(212, 252, rp >= 0 ? rp : 1);
    } else if (ms < TRUCK.goStart) {
      endX = lerp(252, 266, tw(ms, r0.rocket.handOff, 420, EASE.std));
    } else if (ms < DELIVER_DONE) {
      endX = clamp(tx + 6, 266, 336);
    } else {
      endX = 394;
    }

    A(S.rail, "fill", delivered ? INK : LINE_GREY);

    const purpleW = clamp(endX - 12, 0, 240);
    A(S.fillMain, "width", delivered ? 240 : purpleW);
    A(S.fillMain, "fill", delivered ? INK : PURPLE);
    A(S.fillMainStroke, "opacity", delivered ? 1 : 0);

    if (!delivered && endX > 252) {
      const subW = clamp(endX - 247, 0, 89);
      const isCyan = ms >= TRUCK.goStart + TRUCK.goMs * 0.45;
      A(S.fillSub, "width", subW);
      A(S.fillSub, "fill", isCyan ? CYAN_BAR : GREEN_BAR);
      A(S.fillSub, "opacity", 1);
      A(S.fillSubStroke, "width", Math.max(0, subW - 0.5));
      A(S.fillSubStroke, "opacity", 1);
    } else {
      A(S.fillSub, "opacity", 0);
      A(S.fillSubStroke, "opacity", 0);
    }
    A(S.cyanShimmer, "opacity", 0);

    const reached1 = ms >= r0.carry.walkEnd - 100;
    const reached2 = delivered;
    A(S.dots[0], "fill", delivered ? INK : PURPLE);
    A(S.dots[1], "fill", delivered ? INK : reached1 ? PURPLE : DOT_HINT);
    A(S.dots[2], "fill", reached2 ? PURPLE : LINE_GREY);

    const dot2Scale = delivered ? 1 + 0.16 * kick(ms, DELIVER_DONE) : 1;
    A(S.dots[0], "r", 7);
    A(S.dots[1], "r", 7);
    A(S.dots[2], "r", 7 * dot2Scale);

    const pulses: [number, number][] = [
      [RUNS[0].work.impact, DOTS[0]],
      [RUNS[1].work.impact, DOTS[0]],
      [RUNS[0].rocket.loaded, DOTS[1]],
      [RUNS[1].rocket.loaded, DOTS[1]],
      [DELIVER_DONE, DOTS[2]],
    ];
    let activePulse: [number, number] | null = null;
    for (const pl of pulses) {
      if (ms >= pl[0] && ms < pl[0] + 640) activePulse = pl;
    }
    if (activePulse) {
      const k = clamp((ms - activePulse[0]) / 640);
      A(S.ring, "cx", activePulse[1]);
      A(S.ring, "r", 7 + EASE.std(k) * 10);
      A(S.ring, "stroke", PURPLE);
      A(S.ring, "opacity", 0.5 * (1 - k));
    } else {
      A(S.ring, "opacity", 0);
    }
    A(S.ring2, "opacity", 0);
  }

  // 8. COMPUTE NON-OVERLAPPING TOP LABEL POSITIONS (strictly y = 3..17, above all parcels!)
  //    Left label (`Packing`, w 45): tracks active Preparing actor cleanly within x = 18..148
  //    Right label (`Shipping Operations` 91 / `Remaining 1 Day` 75 / `Waiting Pickup 30 m` 89):
  //    always stays in x >= 258 while rocket flies (x <= 254), gliding smoothly with Truck!
  let leftX = 69;
  if (ms < RUNS[0].cart.arrive) {
    leftX = clamp(CP.cx - 18, 16, 69);
  } else if (ms < RUNS[0].carry.walkStart) {
    leftX = 69;
  } else if (ms < RUNS[0].rocket.loaded) {
    leftX = clamp(M.x - 22, 69, 148);
  } else if (ms < RUNS[1].carry.walkStart) {
    leftX = 69; // Centered cleanly above Packing Station during the split stage!
  } else {
    leftX = clamp(M.x - 22, 69, 148);
  }

  let rightX = 270;
  if (ms >= TRUCK.goStart + TRUCK.goMs * 0.45) {
    rightX = 305; // Exact XD Home Page – 64 Waiting Pickup 30 m x!
  } else if (ms >= TRUCK.goStart) {
    const p = clamp((ms - TRUCK.goStart) / (TRUCK.goMs * 0.45));
    rightX = lerp(272, 298, EASE.inout(p));
  } else if (
    (ms >= RUNS[0].rocket.loaded && ms < RUNS[0].rocket.handOff + 220) ||
    (ms >= RUNS[1].rocket.loaded && ms < RUNS[1].rocket.handOff + 220)
  ) {
    rightX = 270; // Cleanly to the right of both Rocket (208..248) AND handoff arc!
  } else {
    rightX = 272; // Cleanly above/right of waiting Truck at 268.55!
  }

  return hudAt(ms, null, leftX, rightX);
}

/* ---------- Exact Resting Stage Renderer + Living Idle Loops ---------- */

function hideAllActors(S: TimelineParts) {
  [
    "cart",
    "work",
    "carry",
    "carryFront",
    "truck",
    "rocket",
    "rocketPort",
    "parcel0",
    "parcel1",
    "shCart",
    "shP0",
    "shP1",
    "shCarry",
    "shRock",
    "shTruck",
    "heat",
  ].forEach((k) => A(S[k], "opacity", 0));
  ["trail", "ground", "live", "exh", "dust", "roadDust"].forEach((k) =>
    S[k]?.forEach((c: Element) => A(c, "opacity", 0)),
  );
}

function renderRestingStage(
  S: TimelineParts,
  stage: Exclude<OrderStage, "showcase">,
  clk: number,
  loop: OrderStage | null,
): LiveTimelineHud {
  S.dots?.forEach((d: Element) => A(d, "r", 7));
  A(S.ring, "opacity", 0);
  A(S.ring2, "opacity", 0);
  A(S.cyanShimmer, "opacity", 0);

  if (stage === "preparing") {
    A(S.rail, "fill", LINE_GREY);
    A(S.fillMain, "width", 84);
    A(S.fillMain, "fill", PURPLE);
    A(S.fillMainStroke, "opacity", 0);
    A(S.fillSub, "opacity", 0);
    A(S.fillSubStroke, "opacity", 0);
    A(S.dots[0], "fill", PURPLE);
    A(S.dots[1], "fill", DOT_HINT);
    A(S.dots[2], "fill", LINE_GREY);

    A(S.work, "opacity", 1);
    const breath = loop ? Math.sin(clk / 420) : 0;
    const fold = loop ? Math.sin(clk / 310) : 0;
    A(
      S.work,
      "transform",
      `translate(${WORK_GEO.x} ${WORK_GEO.yRest + breath * 0.22})`,
    );
    A(S.workDesk, "transform", "translate(0 0)");
    A(S.workTopBox, "transform", "translate(0 0)");
    A(S.workTorso, "transform", `rotate(${breath * 1.4} 3.5 18.0)`);
    A(S.workHair, "transform", `rotate(${breath * 5.0} 2.3 2.1)`);
    A(S.workHead, "transform", `rotate(${fold * 2.8} 3.6 3.5)`);
    A(S.workArm, "transform", `rotate(${fold * 6.0} 3.2 5.6)`);
    A(S.workFarArm, "transform", `rotate(${-fold * 3.5} 6.5 4.8)`);
    A(
      S.workGarment,
      "transform",
      `translate(9.5 10.5) scale(${1 + fold * 0.03} ${1 - fold * 0.035}) translate(-9.5 -10.5)`,
    );

    if (loop) {
      const rk = (clk % 2200) / 2200;
      A(S.ring, "cx", DOTS[0]);
      A(S.ring, "r", 7 + EASE.std(rk) * 8);
      A(S.ring, "stroke", PURPLE);
      A(S.ring, "opacity", 0.26 * (1 - rk));
    }
  } else if (stage === "split") {
    A(S.rail, "fill", LINE_GREY);
    A(S.fillMain, "width", 224);
    A(S.fillMain, "fill", PURPLE);
    A(S.fillMainStroke, "opacity", 0);
    A(S.fillSub, "opacity", 0);
    A(S.fillSubStroke, "opacity", 0);
    A(S.dots[0], "fill", PURPLE);
    A(S.dots[1], "fill", PURPLE);
    A(S.dots[2], "fill", LINE_GREY);

    A(S.work, "opacity", 1);
    const breath = loop ? Math.sin(clk / 420) : 0;
    const fold = loop ? Math.sin(clk / 310) : 0;
    A(
      S.work,
      "transform",
      `translate(${WORK_GEO.x} ${WORK_GEO.yRest + breath * 0.22})`,
    );
    A(S.workDesk, "transform", "translate(0 0)");
    A(S.workTopBox, "transform", "translate(0 0)");
    A(S.workTorso, "transform", `rotate(${breath * 1.4} 3.5 18.0)`);
    A(S.workHair, "transform", `rotate(${breath * 5.0} 2.3 2.1)`);
    A(S.workHead, "transform", `rotate(${fold * 2.8} 3.6 3.5)`);
    A(S.workArm, "transform", `rotate(${fold * 6.0} 3.2 5.6)`);
    A(S.workFarArm, "transform", `rotate(${-fold * 3.5} 6.5 4.8)`);
    A(
      S.workGarment,
      "transform",
      `translate(9.5 10.5) scale(${1 + fold * 0.03} ${1 - fold * 0.035}) translate(-9.5 -10.5)`,
    );

    // Exact XD HP 62 rocket position & angle (236.01, 34.44, tilt 45 deg)
    A(S.rocket, "opacity", 1);
    const hover = loop ? Math.sin(clk / 360) * 1.15 : 0;
    const tiltWobble = loop ? Math.sin(clk / 540) * 1.6 : 0;
    const flick = loop ? 0.52 + 0.18 * Math.sin(clk / 37) : 0;
    A(
      S.rocket,
      "transform",
      `translate(${ROCKET_XD_REST.x} ${ROCKET_XD_REST.y + hover})`,
    );
    A(S.rframe, "transform", `rotate(${45 + tiltWobble})`);
    A(S.rocketInner, "transform", `rotate(-45) translate(-9.85 -10.0)`);
    A(S.rlegs, "opacity", 0);
    A(S.rlines, "opacity", loop ? 0.65 + 0.35 * Math.sin(clk / 160) : 1);
    A(S.flame, "opacity", loop ? 0.85 : 0);
    A(
      S.flame,
      "transform",
      `translate(5.26 12.84) rotate(135) scale(${Math.max(flick, 0.001)} 0.62)`,
    );
    A(S.glow, "opacity", loop ? 0.38 : 0);
    A(S.glow, "r", 3.6 + flick * 2);

    if (loop) {
      S.live?.forEach((c: Element, i: number) => {
        const k = (clk / 1100 + i / S.live.length) % 1;
        const g = EASE.std(k);
        const nx = ROCKET_XD_REST.x - 5.0;
        const ny = ROCKET_XD_REST.y + hover + 3.6;
        A(c, "cx", nx - g * 6.5 + (i % 2 ? 1 : -1) * g * 1.1);
        A(c, "cy", ny + g * 5.2);
        A(c, "r", 0.75 + g * 2.1);
        A(c, "opacity", 0.45 * (1 - k));
      });
      const rk = (clk % 2200) / 2200;
      A(S.ring2, "cx", DOTS[1]);
      A(S.ring2, "r", 7 + EASE.std(rk) * 8);
      A(S.ring2, "stroke", PURPLE);
      A(S.ring2, "opacity", 0.25 * (1 - rk));
    }
  } else if (stage === "shipped") {
    A(S.rail, "fill", LINE_GREY);
    A(S.fillMain, "width", 240);
    A(S.fillMain, "fill", PURPLE);
    A(S.fillMainStroke, "opacity", 0);
    A(S.fillSub, "width", 19);
    A(S.fillSub, "fill", GREEN_BAR);
    A(S.fillSub, "opacity", 1);
    A(S.fillSubStroke, "width", 18.5);
    A(S.fillSubStroke, "opacity", 1);
    A(S.dots[0], "fill", PURPLE);
    A(S.dots[1], "fill", PURPLE);
    A(S.dots[2], "fill", LINE_GREY);

    A(S.truck, "opacity", 1);
    const tb = loop ? Math.sin(clk / 48) * 0.26 : 0;
    const pitch = loop ? Math.sin(clk / 190) * 0.85 : 0;
    A(S.truck, "transform", `translate(${TRUCK.xMeet} ${XD_TRUCK_Y})`);
    A(S.tbody, "transform", `translate(0 ${tb}) rotate(${pitch} 0 -2)`);
    const wang = loop ? clk * 0.45 : 0;
    S.wheels?.forEach((w: Element) => A(w, "transform", `rotate(${wang})`));
    S.wheelHubs?.forEach((h: Element) => A(h, "opacity", loop ? 0.85 : 0));
    A(S.tlines, "opacity", 1);
    A(
      S.tlines,
      "transform",
      loop
        ? `translate(${-0.55 - 0.55 * Math.sin(clk / 42)} 0)`
        : "translate(0 0)",
    );
    A(S.brake, "opacity", 0);
    A(S.rev, "opacity", 0);

    if (loop) {
      S.roadDust?.forEach((c: Element, i: number) => {
        const k = (clk / 850 + i / S.roadDust.length) % 1;
        const g = EASE.std(k);
        A(c, "cx", TRUCK.xMeet - 7.5 - g * 9);
        A(c, "cy", XD_TRUCK_Y - 1.0 - g * 2.2);
        A(c, "r", 0.65 + g * 1.6);
        A(c, "opacity", 0.42 * (1 - k));
      });
      const rk = (clk % 2400) / 2400;
      A(S.ring2, "cx", DOTS[1]);
      A(S.ring2, "r", 7 + EASE.std(rk) * 8);
      A(S.ring2, "stroke", PURPLE);
      A(S.ring2, "opacity", 0.22 * (1 - rk));
    }
  } else if (stage === "pickup") {
    A(S.rail, "fill", LINE_GREY);
    A(S.fillMain, "width", 240);
    A(S.fillMain, "fill", PURPLE);
    A(S.fillMainStroke, "opacity", 0);
    A(S.fillSub, "width", 89);
    A(S.fillSub, "fill", CYAN_BAR);
    A(S.fillSub, "opacity", 1);
    A(S.fillSubStroke, "width", 88.5);
    A(S.fillSubStroke, "opacity", 1);
    A(S.dots[0], "fill", PURPLE);
    A(S.dots[1], "fill", PURPLE);
    A(S.dots[2], "fill", LINE_GREY);

    if (loop) {
      const sk = (clk % 1800) / 1800;
      A(S.cyanShimmer, "x", lerp(247, 312, EASE.inout(sk)));
      A(S.cyanShimmer, "opacity", Math.sin(sk * Math.PI) * 0.75);
      const rk = (clk % 2000) / 2000;
      A(S.ring, "cx", DOTS[2]);
      A(S.ring, "r", 7 + EASE.std(rk) * 9);
      A(S.ring, "stroke", "#38E0FF");
      A(S.ring, "opacity", 0.45 * (1 - rk));
    }
  } else {
    A(S.rail, "fill", INK);
    A(S.fillMain, "width", 240);
    A(S.fillMain, "fill", INK);
    A(S.fillMainStroke, "opacity", 1);
    A(S.fillSub, "opacity", 0);
    A(S.fillSubStroke, "opacity", 0);
    A(S.dots[0], "fill", INK);
    A(S.dots[1], "fill", INK);
    A(S.dots[2], "fill", PURPLE);
  }

  return hudAt(REST_MS[stage], stage);
}
