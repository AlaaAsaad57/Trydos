/*
  Deterministic Multi-Actor Physics & Choreography Engine for OrderParcelJourney.

  Features real pre-simulated 4ms-step RK2 ODE solvers + spring-steel structural rail:
    - Line colors smoothly from the very start (LINE_START = 8) all the way to LINE_END = 872,
      turning full emerald green (#26C13F) upon Delivery arrival
    - Stiff tensioned rail with tight, fast-damped structural compression (zero watery waves)
    - 4 collaborative 2-bone IK human workers moving at calm, natural human walking speed:
        1. Female Warehouse Handler (#402CDD) walks to Buy (100), carries product cleanly to
           Packing Bench (300)
        2. Master Packer (#2E1FA8) collaborates on wrap/seal at Bench (300), then carries the
           sealed carton cleanly onto Shipped Rocket (500)
        3. Rocket Recovery Specialist (#2B2D42 + #FF7A1A cap) walks up to landed Rocket (640),
           unloads carton by hand, walks across & passes it to Express Courier
        4. Express Courier (#26C13F) receives carton directly & walks final mile to Doorstep (840)
    - RK2 2D Thrust-Vectored Rocket Flight: climbs from x=500, arches cleanly, extends landing
      struts, fires retro-propulsive landing burn & touches down softly at x=640
    - Animated stroke-dashoffset checkmarks on ALL 4 stage milestones + one-shot Delivery Map
      happy/love emoji sprinkle
*/

export const G = 112;
export const STATIONS: readonly number[] = [100, 300, 500, 700];
export const LINE_START = 8;
export const LINE_END = 872;
export const MAP_X = 848;
export const END_MS = 15400;

export type ParcelStatus = "buy" | "preparing" | "shipped" | "out" | "delivered";

export const REACHED_AT = [1060, 4880, 6900, 13800] as const;

export const REST_MS: Record<ParcelStatus, number> = {
  buy: 2400,
  preparing: 5050,
  shipped: 8450,
  out: 11000,
  delivered: END_MS,
};

/* ---------- Curves, springs, color blending & vector utilities ---------- */

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
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
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 28; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
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

const quintic = (p: number) => {
  const u = clamp(p);
  return u * u * u * (10 + u * (-15 + 6 * u));
};

const SPZ = 0.7;
const SPW = (2 * Math.PI) / 0.4;
const SPWD = SPW * Math.sqrt(1 - SPZ * SPZ);

export function spring(ms: number) {
  if (ms <= 0) return 0;
  const s = ms / 1000;
  return (
    1 -
    Math.exp(-SPZ * SPW * s) *
      (Math.cos(SPWD * s) + ((SPZ * SPW) / SPWD) * Math.sin(SPWD * s))
  );
}

export const kick = (ms: number, start: number) =>
  ms < start
    ? 0
    : Math.exp((-SPZ * SPW * (ms - start)) / 1000) *
      Math.sin((SPWD * (ms - start)) / 1000);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const tw = (ms: number, s: number, d: number, ease: (x: number) => number) =>
  ease(clamp((ms - s) / d));
const sp = (ms: number, s: number) => spring(ms - s);
const D2R = Math.PI / 180;
const deriv = (f: (t: number) => number, t: number, h = 10) =>
  ((f(t + h) - f(t - h)) / (2 * h)) * 1000;
const deriv2 = (f: (t: number) => number, t: number, h = 12) =>
  ((f(t + h) - 2 * f(t) + f(t - h)) / (h * h)) * 1e6;
const pt = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
const smoothstep = (p: number) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};

function mixHex(
  c0: readonly [number, number, number],
  c1: readonly [number, number, number],
  u: number,
  hex0: string,
  hex1: string,
) {
  if (u <= 0.001) return hex0;
  if (u >= 0.999) return hex1;
  const r = Math.round(lerp(c0[0], c1[0], u));
  const g = Math.round(lerp(c0[1], c1[1], u));
  const b = Math.round(lerp(c0[2], c1[2], u));
  return `rgb(${r} ${g} ${b})`;
}

function solveIK(
  hx: number,
  hy: number,
  tx: number,
  ty: number,
  a: number,
  b: number,
  bend: 1 | -1,
) {
  let dx = tx - hx;
  let dy = ty - hy;
  let d = Math.hypot(dx, dy);
  const maxReach = a + b - 0.02;
  if (d > maxReach) {
    dx *= maxReach / d;
    dy *= maxReach / d;
    d = maxReach;
  }
  d = Math.max(d, Math.abs(a - b) + 0.05);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const ang = th - bend * al;
  return {
    jx: hx + a * Math.cos(ang),
    jy: hy + a * Math.sin(ang),
    ex: hx + dx,
    ey: hy + dy,
  };
}

function springBody(
  accelAt: (t: number) => number,
  t0: number,
  ms: number,
  hz: number,
  zeta: number,
  gain: number,
  cap: number,
) {
  if (ms <= t0) return 0;
  const w = 2 * Math.PI * hz;
  const dt = 0.004;
  let th = 0;
  let om = 0;
  for (let t = t0; t < ms; t += 4) {
    const k1v = -w * w * th - 2 * zeta * w * om - gain * accelAt(t);
    const thM = th + 0.5 * dt * om;
    const omM = om + 0.5 * dt * k1v;
    const k2v = -w * w * thM - 2 * zeta * w * omM - gain * accelAt(t + 2);
    th += omM * dt;
    om += k2v * dt;
  }
  return clamp(th, -cap, cap);
}

/* ---------- Scrubber mapping (station-aligned) ---------- */

const SCRUB_KNOTS: readonly [number, number][] = [
  [LINE_START, 0],
  [STATIONS[0], REACHED_AT[0]],
  [STATIONS[1], REACHED_AT[1]],
  [STATIONS[2], REACHED_AT[2]],
  [STATIONS[3], REACHED_AT[3]],
  [LINE_END, END_MS],
];

export function msFromSvgX(svgX: number) {
  const x = clamp(svgX, LINE_START, LINE_END);
  for (let i = 0; i < SCRUB_KNOTS.length - 1; i++) {
    const [x0, t0] = SCRUB_KNOTS[i];
    const [x1, t1] = SCRUB_KNOTS[i + 1];
    if (x <= x1) return lerp(t0, t1, (x - x0) / (x1 - x0));
  }
  return END_MS;
}

export const statusAt = (ms: number): ParcelStatus | null =>
  ms >= REACHED_AT[3]
    ? "delivered"
    : ms >= 10100
      ? "out"
      : ms >= REACHED_AT[2]
        ? "shipped"
        : ms >= REACHED_AT[1]
          ? "preparing"
          : ms >= REACHED_AT[0]
            ? "buy"
            : null;

/* ---------- Story Act Clock & Pad Coordinates ---------- */

export const T = {
  prodIn: 140,
  pressStart: 880,
  buyClick: REACHED_AT[0], // 1060
  pickBuy: 1480,
  placeBench: 3820,
  ribVStart: 3960,
  ribHStart: 4240,
  bowPop: 4520,
  stampHit: REACHED_AT[1], // 4880
  liftBench: 5240,
  rocketAppear: 4650,
  rocketPadReady: 5450,
  loadRocket: REACHED_AT[2], // 6900
  igniteAt: 7120,
  launchAt: 7520,
  rocketTouchdown: 9460,
  unloadRocket: 10060,
  courierHandoff: 11780,
  handoffAt: REACHED_AT[3], // 13800
};

export const PAD_LAUNCH = { x: STATIONS[2], y: G - 21 }; // 500
export const PAD_LAND = { x: 640, y: G - 21 };

/* ---------- Pre-Integrated RK2 Simulation (Bench & Rocket Flight/Landing) ---------- */

const DT_MS = 4;
const SIM_DT = DT_MS / 1000;
const SIM_LEN = Math.ceil(END_MS / DT_MS) + 2;

type BenchSample = {
  deskY: number;
  shelfL: number;
  shelfR: number;
};

type RocketSample = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tilt: number;
  omega: number;
  gimbal: number;
  thrust: number;
  legs: number;
  comp: number;
  op: number;
  flying: number;
};

function rocketWaypoint(ms: number) {
  if (ms <= T.launchAt) return { x: PAD_LAUNCH.x, y: PAD_LAUNCH.y };
  if (ms >= T.rocketTouchdown) return { x: PAD_LAND.x, y: PAD_LAND.y };
  const u = (ms - T.launchAt) / (T.rocketTouchdown - T.launchAt);
  const x = lerp(PAD_LAUNCH.x, PAD_LAND.x, quintic(u));
  if (u < 0.4) {
    return { x, y: lerp(PAD_LAUNCH.y, -18, quintic(u / 0.4)) };
  }
  return { x, y: lerp(-18, PAD_LAND.y, quintic((u - 0.4) / 0.6)) };
}

function buildSimulation() {
  const bench: BenchSample[] = new Array(SIM_LEN);
  const rocket: RocketSample[] = new Array(SIM_LEN);

  // 1. Bench & Unilateral Bouncing Shelf Props
  let bY = 0;
  let bVy = 0;
  let sL = 0;
  let sLV = 0;
  let sR = 0;
  let sRV = 0;
  const benchHits: [number, number][] = [
    [T.placeBench, 44],
    [T.ribVStart + 180, 32],
    [T.bowPop + 40, 40],
    [T.stampHit, 80],
    [T.liftBench, -44],
  ];

  // 2. Rocket 2D Thrust-Vectored Dynamics & Landing Struts
  let rx = PAD_LAUNCH.x;
  let ry = -46;
  let rvx = 0;
  let rvy = 0;
  let rTilt = 0;
  let rOmega = 0;
  let rGimbal = 0;
  let rComp = 0;
  let rCompV = 0;
  const gGravity = 780;

  for (let i = 0; i < SIM_LEN; i++) {
    const ms = i * DT_MS;

    // --- Step 1: Bench RK2 ---
    for (const [ht, imp] of benchHits) {
      if (ms >= ht && ms < ht + DT_MS) {
        bVy += imp;
        if (imp > 0) {
          sLV -= imp * 0.4;
          sRV -= imp * 0.34;
        }
      }
    }
    const bK1y = bVy;
    const bK1v = -280 * bY - 15 * bVy;
    const bYMid = bY + 0.5 * SIM_DT * bK1y;
    const bVyMid = bVy + 0.5 * SIM_DT * bK1v;
    const bAy = -280 * bYMid - 15 * bVyMid;
    bY += bVyMid * SIM_DT;
    bVy += bAy * SIM_DT;

    sLV += (430 - bAy * 0.42) * SIM_DT;
    sL += sLV * SIM_DT;
    if (sL > 0) {
      sL = 0;
      sLV = Math.abs(sLV) > 8 ? -0.36 * sLV : 0;
    }
    sRV += (450 - bAy * 0.38) * SIM_DT;
    sR += sRV * SIM_DT;
    if (sR > 0) {
      sR = 0;
      sRV = Math.abs(sRV) > 8 ? -0.32 * sRV : 0;
    }
    bench[i] = {
      deskY: clamp(bY, -4, 4),
      shelfL: clamp(sL, -6.5, 0),
      shelfR: clamp(sR, -6.5, 0),
    };

    // --- Step 2: Rocket Arrival -> Ascent -> Powered Retro-Landing onto x=640 ---
    let rThrust = 0;
    let rLegs = 1;
    let rOp = 0;
    let rFlying = 0;

    if (ms >= T.rocketAppear) {
      rOp = tw(ms, T.rocketAppear, 220, EASE.std);
    }

    if (ms >= T.rocketAppear && ms < T.rocketPadReady) {
      const p = tw(ms, T.rocketAppear, T.rocketPadReady - T.rocketAppear, EASE.std);
      rx = PAD_LAUNCH.x;
      ry = lerp(-46, PAD_LAUNCH.y, p);
      rvy = ms < T.rocketPadReady - 90 ? 64 : 0;
      rThrust = p < 0.9 ? 0.58 * (1 - p * 0.65) : 0;
      rLegs = 0.28 + 0.72 * p;
      rTilt = Math.sin(ms / 180) * 2.2 * (1 - p);
    } else if (ms >= T.rocketPadReady && ms < T.launchAt) {
      rx = PAD_LAUNCH.x;
      ry = PAD_LAUNCH.y;
      rvx = 0;
      rvy = 0;
      if (ms >= T.rocketPadReady && ms < T.rocketPadReady + DT_MS) rCompV += 34;
      if (ms >= T.loadRocket && ms < T.loadRocket + DT_MS) rCompV += 56;
      if (ms >= T.igniteAt) {
        const k = tw(ms, T.igniteAt, T.launchAt - T.igniteAt, EASE.inout);
        rThrust = 1.18 * k;
        rGimbal = 13 * Math.sin(((ms - T.igniteAt) / 260) * Math.PI) * (1 - k * 0.35);
        rTilt = -rGimbal * 0.14 * k;
        rCompV += 18 * k * SIM_DT;
      } else {
        rGimbal *= 0.86;
        rTilt *= 0.88;
      }
      rOmega = 0;
    } else if (ms >= T.launchAt && ms < T.rocketTouchdown) {
      rFlying = 1;
      const wp = rocketWaypoint(ms);
      const wpNext = rocketWaypoint(Math.min(T.rocketTouchdown, ms + 32));
      const dtLook = Math.max(0.008, (Math.min(T.rocketTouchdown, ms + 32) - ms) / 1000);
      const wpVx = (wpNext.x - wp.x) / dtLook;
      const wpVy = (wpNext.y - wp.y) / dtLook;

      const landPhase = tw(ms, T.rocketTouchdown - 520, 520, EASE.inout);
      const kp = lerp(38, 108, landPhase);
      const kd = lerp(10.5, 22, landPhase);

      const axCmd = kp * 0.72 * (wp.x - rx) + kd * 0.82 * (wpVx - rvx);
      const ayCmd = kp * (wp.y - ry) + kd * (wpVy - rvy);

      const fxReq = axCmd;
      const upReq = Math.max(0, gGravity - ayCmd);
      const desiredTilt = clamp(Math.atan2(fxReq, Math.max(220, upReq)) / D2R, -34, 34);
      const targetTilt =
        desiredTilt * (1 - 0.85 * tw(ms, T.rocketTouchdown - 420, 320, EASE.std));
      // Project desired thrust force along actual body thrust axis: u = max(0, F_req . b_up)
      const bodyRad = rTilt * D2R;
      const axialReq = Math.max(0, upReq * Math.cos(bodyRad) + fxReq * Math.sin(bodyRad));
      const thMag = clamp(axialReq / gGravity, 0.04, 2.2);
      rThrust = thMag;
      const angErr = targetTilt - rTilt;
      const torqueCmd = 54 * angErr - 10.5 * rOmega;
      rGimbal = clamp(-torqueCmd * 0.042, -18, 18);

      const accelRocket = (tiltDeg: number, vx: number, vy: number) => {
        const rad = tiltDeg * D2R;
        const thrustAcc = thMag * gGravity;
        return {
          ax: thrustAcc * Math.sin(rad) - 0.22 * vx,
          ay: gGravity - thrustAcc * Math.cos(rad) - 0.22 * vy,
        };
      };

      const a1 = accelRocket(rTilt, rvx, rvy);
      const tiltMid = rTilt + 0.5 * SIM_DT * rOmega;
      const vxMid = rvx + 0.5 * SIM_DT * a1.ax;
      const vyMid = rvy + 0.5 * SIM_DT * a1.ay;
      const a2 = accelRocket(tiltMid, vxMid, vyMid);

      const omegaMid = rOmega + 0.5 * SIM_DT * torqueCmd;
      const angErrMid = targetTilt - tiltMid;
      const torqueMid = 54 * angErrMid - 10.5 * omegaMid;

      rx += vxMid * SIM_DT;
      ry += vyMid * SIM_DT;
      rvx += a2.ax * SIM_DT;
      rvy += a2.ay * SIM_DT;
      rTilt += omegaMid * SIM_DT;
      rOmega += torqueMid * SIM_DT;

      const retract = tw(ms, T.launchAt + 60, 240, EASE.std);
      const deploy = tw(ms, T.rocketTouchdown - 640, 420, EASE.std);
      rLegs = clamp(1 - retract + deploy, 0, 1);

      if (ry > PAD_LAND.y) ry = PAD_LAND.y;
    } else if (ms >= T.rocketTouchdown) {
      if (ms >= T.rocketTouchdown && ms < T.rocketTouchdown + DT_MS) {
        rCompV += 58 + clamp(rvy * 0.22, 0, 24);
      }
      if (ms >= T.unloadRocket && ms < T.unloadRocket + DT_MS) {
        rCompV -= 38;
      }
      rx = lerp(rx, PAD_LAND.x, 1 - Math.exp(-16 * SIM_DT));
      ry = lerp(ry, PAD_LAND.y, 1 - Math.exp(-18 * SIM_DT));
      rvx *= 0.72;
      rvy = 0;
      rTilt *= Math.exp(-14 * SIM_DT);
      rOmega = 0;
      rGimbal *= Math.exp(-16 * SIM_DT);
      rLegs = 1;
      const cutOff = 1 - tw(ms, T.rocketTouchdown, 190, EASE.exit);
      rThrust = 0.85 * cutOff;
      rFlying = ms < T.rocketTouchdown + 120 ? 1 - cutOff : 0;
    }

    const rcK1y = rCompV;
    const rcK1v = -340 * rComp - 17 * rCompV;
    const rcMid = rComp + 0.5 * SIM_DT * rcK1y;
    const rcvMid = rCompV + 0.5 * SIM_DT * rcK1v;
    const rcK2v = -340 * rcMid - 17 * rcvMid;
    rComp += rcvMid * SIM_DT;
    rCompV += rcK2v * SIM_DT;

    rocket[i] = {
      x: rx,
      y: ry,
      vx: rvx,
      vy: rvy,
      tilt: rTilt,
      omega: rOmega,
      gimbal: rGimbal,
      thrust: rThrust,
      legs: clamp(rLegs, 0, 1),
      comp: clamp(rComp, -3.2, 6),
      op: clamp(rOp),
      flying: rFlying,
    };
  }

  return { bench, rocket };
}

const SIM = buildSimulation();

function sampleArr<T extends Record<string, number>>(arr: T[], ms: number): T {
  const f = clamp(ms, 0, END_MS) / DT_MS;
  const i0 = Math.min(arr.length - 1, Math.floor(f));
  const i1 = Math.min(arr.length - 1, i0 + 1);
  const u = f - i0;
  const a = arr[i0];
  const b = arr[i1];
  const out: Record<string, number> = {};
  for (const k in a) {
    out[k] = lerp(a[k], b[k], u);
  }
  return out as T;
}

/* ---------- Stiff Structural Track Deflection (Low Water-Shake) ---------- */

type WaveEvent = {
  t0: number;
  x0: number;
  amp: number;
  freq: number;
  decay: number;
  speed: number;
  spread: number;
};

const WAVE_EVENTS: readonly WaveEvent[] = [
  { t0: T.buyClick, x0: 100, amp: 0.7, freq: 3.4, decay: 11.0, speed: 900, spread: 75 },
  { t0: T.stampHit, x0: 300, amp: 0.55, freq: 3.8, decay: 12.0, speed: 950, spread: 70 },
  { t0: T.loadRocket, x0: 500, amp: 0.5, freq: 3.5, decay: 12.0, speed: 900, spread: 75 },
  { t0: T.launchAt, x0: 500, amp: 0.85, freq: 3.2, decay: 10.5, speed: 950, spread: 85 },
  { t0: T.rocketTouchdown, x0: PAD_LAND.x, amp: 0.9, freq: 3.4, decay: 10.5, speed: 950, spread: 85 },
  { t0: T.courierHandoff, x0: 758, amp: 0.45, freq: 3.6, decay: 12.0, speed: 900, spread: 70 },
  { t0: T.handoffAt, x0: 840, amp: -0.65, freq: 3.5, decay: 11.5, speed: 980, spread: 90 },
];

const bellWeight = (x: number, xc: number, radius: number) => {
  const u = Math.abs(x - xc) / radius;
  if (u >= 1) return 0;
  const s = 1 - u * u;
  return s * s;
};

export function railY(x: number, ms: number) {
  let y = G;

  if (ms >= T.pressStart && ms < T.buyClick + 220) {
    const press =
      ms < T.buyClick
        ? tw(ms, T.pressStart, T.buyClick - T.pressStart, EASE.std)
        : 1 - tw(ms, T.buyClick, 220, EASE.std);
    y += 0.9 * press * bellWeight(x, STATIONS[0], 34);
  }

  const bState = sampleArr(SIM.bench, ms);
  const benchOp = tw(ms, 80, 320, EASE.std) * (1 - tw(ms, 7600, 340, EASE.exit));
  y += (0.55 + Math.max(0, bState.deskY) * 0.25) * benchOp * bellWeight(x, 300, 38);

  const rState = sampleArr(SIM.rocket, ms);
  if (ms >= T.rocketAppear) {
    const preLaunchPad =
      tw(ms, T.rocketPadReady - 40, 110, EASE.std) *
      (1 - tw(ms, T.launchAt - 20, 120, EASE.std));
    const landedPad = tw(ms, T.rocketTouchdown - 40, 120, EASE.std);
    const padX = ms < T.launchAt + 140 ? PAD_LAUNCH.x : PAD_LAND.x;
    const rLoad =
      preLaunchPad * 0.65 + landedPad * 0.72 + Math.max(0, rState.comp) * 0.14;
    y += rLoad * rState.op * bellWeight(x, padX, 40);
  }

  for (const w of WAVE_EVENTS) {
    const dt = (ms - w.t0) / 1000;
    if (dt <= 0 || dt > 0.42) continue;
    const dist = Math.abs(x - w.x0);
    const tau = dt - dist / w.speed;
    if (tau <= 0) continue;
    const env =
      Math.exp(-w.decay * tau) *
      Math.exp(-dist / w.spread) *
      smoothstep(tau / 0.02);
    y += w.amp * env * Math.cos(2 * Math.PI * w.freq * tau);
  }

  return y;
}

function buildRailPath(xStart: number, xEnd: number, ms: number) {
  if (xEnd <= xStart) return `M ${xStart.toFixed(1)} ${railY(xStart, ms).toFixed(2)}`;
  const step = 14;
  let d = `M ${xStart.toFixed(1)} ${railY(xStart, ms).toFixed(2)}`;
  for (let x = xStart + step; x < xEnd; x += step) {
    d += ` L ${x.toFixed(1)} ${railY(x, ms).toFixed(2)}`;
  }
  d += ` L ${xEnd.toFixed(1)} ${railY(xEnd, ms).toFixed(2)}`;
  return d;
}

/* ---------- Calm Foot-Locked 2-Bone IK Human Actor Engine ---------- */

type WalkSeg = { t0: number; t1: number; x0: number; x1: number; dir: number };

const ACTOR_DIM = { stride: 26, thigh: 9.8, shin: 9.8, upper: 7.8, fore: 7.8, foot: 3.7 };
const stanceRx = (c: number, L: number) => lerp(0.3 * L, -0.3 * L, c / 0.6);
const legC = (phase: number, leg: number) => (((phase + leg * 0.5 + 0.2) % 1) + 1) % 1;

function evalWalkX(walks: readonly WalkSeg[], xInit: number, ms: number) {
  let x = xInit;
  for (const w of walks) {
    if (ms >= w.t1) x = w.x1;
    else if (ms > w.t0) {
      return lerp(w.x0, w.x1, quintic((ms - w.t0) / (w.t1 - w.t0)));
    }
  }
  return x;
}

function evalWalkGait(
  walks: readonly WalkSeg[],
  xInit: number,
  ms: number,
  loadedAt: (t: number) => boolean,
) {
  const xFn = (t: number) => evalWalkX(walks, xInit, t);
  const vNow = Math.abs(deriv(xFn, ms));
  const amount = clamp(vNow / 68);
  // Scale stride proportionally with brisk walk speed so cadence never windmills rapidly
  const strideFor = (spd: number, loaded: boolean) =>
    ACTOR_DIM.stride * clamp(0.45 + 0.62 * (spd / 68), 0.45, 1.75) * (loaded ? 0.92 : 1);

  let phase = 0;
  let dist = 0;
  let L = strideFor(0, false);
  const legs = [0, 1].map((leg) => {
    const c = legC(0, leg);
    return c < 0.6
      ? { plant: stanceRx(c, L), from: 0 }
      : { plant: 0, from: -0.3 * L };
  });

  for (const w of walks) {
    const end = Math.min(ms, w.t1);
    for (let t = w.t0; t < end; t += 4) {
      const t1 = Math.min(t + 4, end);
      const ds = w.dir * Math.abs(xFn(t1) - xFn(t));
      const tMid = (t + t1) / 2;
      const vMid = Math.abs(deriv(xFn, tMid));
      L = strideFor(vMid, loadedAt(t));
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

  const dirSign = walks.some((w) => w.dir < 0 && ms > w.t0 && ms < w.t1) ? -1 : 1;
  const wPos = smoothstep(clamp(amount / 0.14));
  const wLift = clamp(amount * 3.2);
  const legPoses = [0, 1].map((leg) => {
    const c = legC(phase, leg);
    let rx: number;
    let lift: number;
    let angle: number;
    if (c < 0.6) {
      rx = legs[leg].plant - dist;
      lift = 0;
      const strike = clamp(1 - c / 0.1);
      const toeOff = clamp((c - 0.46) / 0.14);
      angle = -11 * strike + 22 * EASE.std(toeOff);
    } else {
      const s = (c - 0.6) / 0.4;
      const p = dirSign > 0 ? s : 1 - s;
      rx = lerp(legs[leg].from, dirSign > 0 ? 0.3 * L : -0.3 * L, EASE.inout(p));
      lift = (loadedAt(ms) ? 3.2 : 4.1) * Math.sin(Math.PI * s);
      angle = lerp(22, -11, EASE.inout(s));
    }
    // Settle feet gently into natural neutral stance whenever paused or turning
    const restRx = leg === 0 ? 1.8 : -1.8;
    const clampedRx = clamp(rx, -9.5, 9.5);
    return {
      c,
      rx: lerp(restRx, clampedRx, wPos),
      lift: lift * wLift,
      angle: angle * wLift,
      stance: c < 0.6,
    };
  });

  return {
    x: xFn(ms),
    vFn: (t: number) => deriv(xFn, t),
    aFn: (t: number) => deriv2(xFn, t),
    amount,
    legPoses,
  };
}

type ActorPoseSpec = {
  walks: readonly WalkSeg[];
  xInit: number;
  faceAt: (t: number) => number;
  loadedAt: (t: number) => boolean;
  squatAt: (t: number) => number;
  extraLean: (t: number) => number;
  hipDrop: (t: number) => number;
  handTarget: (
    t: number,
    ctx: { sh: { x: number; y: number }; x: number; face: number; swing: number },
  ) => { hx: number; hy: number; fx?: number; fy?: number };
  springT0: number;
  springT1: number;
};

function solveActorPose(spec: ActorPoseSpec, ms: number) {
  const W = ACTOR_DIM;
  const gait = evalWalkGait(spec.walks, spec.xInit, ms, spec.loadedAt);
  const x = gait.x;
  const face = spec.faceAt(ms);
  const fs = face < 0 ? -1 : 1;
  const v = gait.vFn(ms) * fs;
  const loaded = spec.loadedAt(ms);

  const ground = railY(x, ms);
  const LEN = W.thigh + W.shin - 0.8;
  let hh = Infinity;
  gait.legPoses.forEach((l) => {
    if (l.lift < 0.6) {
      hh = Math.min(hh, Math.sqrt(Math.max(1, LEN * LEN - l.rx * l.rx)));
    }
  });
  if (!isFinite(hh)) {
    hh = Math.sqrt(Math.max(1, LEN * LEN - gait.legPoses[0].rx * gait.legPoses[0].rx));
  }
  const restH = Math.sqrt(LEN * LEN - 1.8 * 1.8);
  const sq = spec.squatAt(ms);
  hh -= 8.4 * sq + spec.hipDrop(ms);
  if (loaded) hh -= 0.7;
  const hip = { x, y: ground - 1 - hh };

  const accel = (t: number) =>
    spec.walks.length ? gait.aFn(t) * (spec.faceAt(t) < 0 ? -1 : 1) : 0;
  let lean =
    v * 0.016 +
    springBody(accel, spec.springT0, Math.min(ms, spec.springT1), 1.65, 0.54, 0.01, 6.5) +
    spec.extraLean(ms) -
    (loaded ? 1.8 : 0);
  lean += 24 * sq;
  const la = lean * D2R;
  const sh = { x: hip.x + Math.sin(la) * 13.2, y: hip.y - Math.cos(la) * 13.2 };
  const headSteady = (restH - hh) * 0.42 * (1 - sq);
  const nod = la + 8 * sq * D2R;
  const head = {
    x: sh.x + Math.sin(nod) * 6.0 + 1.0,
    y: sh.y - Math.cos(nod) * 6.0 - headSteady,
  };

  const feet = gait.legPoses.map((l) => {
    const a = l.angle * D2R;
    const worldFootX = x + fs * l.rx;
    const groundY = railY(worldFootX, ms) - 2.4 - l.lift;
    let ax = hip.x + l.rx;
    let ay = groundY;
    if (l.angle > 0) {
      const toeX = ax + W.foot;
      ax = toeX - W.foot * Math.cos(a);
      ay = groundY - W.foot * Math.sin(a);
    }
    return { ax, ay, a, lift: l.lift };
  });
  const knees = feet.map((f) => solveIK(hip.x, hip.y, f.ax, f.ay, W.thigh, W.shin, 1));

  const swing = loaded ? 0 : -(gait.legPoses[0].rx - gait.legPoses[1].rx) * 0.45;
  const ht = spec.handTarget(ms, { sh, x, face, swing });
  const armN = solveIK(sh.x, sh.y, ht.hx, ht.hy, W.upper, W.fore, -1);
  const shF = { x: sh.x - 1.1, y: sh.y + 0.5 };
  const armF = solveIK(
    shF.x,
    shF.y,
    ht.fx ?? ht.hx - 1.4 - (loaded ? 0 : swing * 1.5),
    ht.fy ?? ht.hy + 0.7,
    W.upper,
    W.fore,
    -1,
  );
  const anchorLocal = { x: armN.ex + 3.2, y: armN.ey - 2.6 };
  const anchorWorld = { x: x + face * (anchorLocal.x - x), y: anchorLocal.y };
  return {
    x,
    ground,
    v,
    face,
    hip,
    sh,
    shF,
    head,
    feet,
    knees,
    armN,
    armF,
    anchorWorld,
    sq,
    aFn: gait.aFn,
  };
}

/* ---------- The 4 Calm, Smooth Walking Crew Actors ---------- */

function toLocalHand(
  sh: { x: number; y: number },
  x: number,
  face: number,
  wx: number,
  wy: number,
) {
  const safeF = Math.abs(face) < 0.08 ? (face < 0 ? -0.08 : 0.08) : face;
  return {
    x: x + (wx - x) / safeF - 2.4,
    y: Math.min(sh.y + 13.2, wy + 2.2),
  };
}

// Actor 1: Female Warehouse Handler (#402CDD Indigo + ponytail)
// Walks calmly to Buy (117), picks product off Buy (100), walks steadily to Bench (281) & helps pack!
const CATCHER_WALKS: readonly WalkSeg[] = [
  { t0: 540, t1: 1240, x0: 152, x1: 117, dir: 1 }, // unhurried walk left to Buy (50 px/s)
  { t0: 1880, t1: 3680, x0: 117, x1: 281, dir: 1 }, // calm steady walk carrying product to Bench (91 px/s)
];

const CATCHER_SPEC: ActorPoseSpec = {
  walks: CATCHER_WALKS,
  xInit: 152,
  faceAt: (t) => lerp(-1, 1, tw(t, 1540, 320, EASE.inout)),
  loadedAt: (t) => t >= T.pickBuy && t < T.placeBench,
  squatAt: (t) => {
    const pickSq = Math.sin(Math.PI * clamp((t - 1280) / 360)) * 0.36;
    const placeSq = Math.sin(Math.PI * clamp((t - 3640) / 340)) * 0.22;
    return clamp(pickSq + placeSq, 0, 0.5);
  },
  extraLean: (t) => {
    const pickRec = 3.5 * kick(t, T.pickBuy);
    const workLean = Math.sin(Math.PI * clamp((t - T.ribVStart) / 420)) * 7.5;
    return pickRec + workLean;
  },
  hipDrop: (t) => 1.3 * kick(t, T.pickBuy) + 0.9 * kick(t, T.stampHit),
  handTarget: (t, { sh, x, face, swing }) => {
    let hx = sh.x + 1.4 + swing;
    let hy = sh.y + 13.2;

    const reachBuy = tw(t, 1200, 260, EASE.inout) * (1 - tw(t, T.pickBuy, 180, EASE.std));
    if (reachBuy > 0.001) {
      const target = toLocalHand(sh, x, face, STATIONS[0], railY(STATIONS[0], t) - 14.5);
      hx = lerp(hx, target.x, reachBuy);
      hy = lerp(hy, target.y, reachBuy);
    }

    const carry1 = tw(t, T.pickBuy - 40, 160, EASE.std) * (1 - tw(t, T.placeBench, 200, EASE.std));
    if (carry1 > 0.001) {
      const placeP = tw(t, 3600, T.placeBench - 3600, EASE.inout);
      const benchL = toLocalHand(sh, x, face, 300, railY(300, t) - 20.8);
      hx = lerp(hx, lerp(sh.x + 9.4, benchL.x, placeP), carry1);
      hy = lerp(hy, lerp(sh.y + 4.0, benchL.y, placeP), carry1);
    }

    const tap1 = Math.sin(Math.PI * clamp((t - T.ribVStart) / 420));
    const tapStamp = Math.sin(Math.PI * clamp((t - (T.stampHit - 160)) / 320));
    const workBlend = clamp(tap1 + tapStamp);
    if (workBlend > 0.001) {
      hx = lerp(hx, sh.x + 12.2, workBlend);
      hy = lerp(hy, sh.y + 6.6 + tapStamp * 3.0, workBlend);
    }

    const cheer = tw(t, 5280, 260, EASE.pop) * (1 - tw(t, 7250, 240, EASE.exit));
    if (cheer > 0.001) {
      const wave = Math.sin(((t - 5280) / 320) * Math.PI);
      hx = lerp(hx, sh.x + 8.0, cheer);
      hy = lerp(hy, sh.y - 7.8 - 2.0 * wave, cheer);
    }
    const fx = t >= 5280 && t < 7400 ? sh.x - 1.2 : undefined;
    const fy = t >= 5280 && t < 7400 ? sh.y + 11.8 : undefined;
    return { hx, hy, fx, fy };
  },
  springT0: 500,
  springT1: 7500,
};

// Actor 2: Master Packer (#2E1FA8 Deep Violet + Ink cap)
// Packs & Verified-stamps carton on Bench (318), then walks steadily (318 -> 482) to load Rocket!
const PACKER_WALKS: readonly WalkSeg[] = [
  { t0: 250, t1: 1150, x0: 334, x1: 318, dir: 1 }, // steps calmly up to bench facing left (-1)
  { t0: 5300, t1: 6820, x0: 318, x1: 482, dir: 1 }, // carries sealed carton to Shipped Rocket (108 px/s)
  { t0: 6980, t1: 7420, x0: 482, x1: 454, dir: -1 }, // steps calmly clear before ignition
];

const PACKER_SPEC: ActorPoseSpec = {
  walks: PACKER_WALKS,
  xInit: 334,
  faceAt: (t) => lerp(-1, 1, tw(t, 4920, 260, EASE.inout)),
  loadedAt: (t) => t >= T.liftBench && t < T.loadRocket,
  squatAt: (t) => {
    const prep = Math.sin(Math.PI * clamp((t - 3680) / 360)) * 0.22;
    const stamp = Math.sin(Math.PI * clamp((t - (T.stampHit - 140)) / 300)) * 0.34;
    const liftSq = Math.sin(Math.PI * clamp((t - 5120) / 300)) * 0.22;
    const loadSq = Math.sin(Math.PI * clamp((t - 6740) / 320)) * 0.24;
    return clamp(prep + stamp + liftSq + loadSq, 0, 0.55);
  },
  extraLean: (t) => {
    const workLean = Math.sin(Math.PI * clamp((t - T.ribHStart) / 420)) * 9;
    const stampFwd = Math.sin(Math.PI * clamp((t - (T.stampHit - 140)) / 280)) * 8;
    const loadReach = Math.sin(Math.PI * clamp((t - 6720) / 360)) * 7;
    return workLean + stampFwd + loadReach;
  },
  hipDrop: (t) => 1.5 * kick(t, T.stampHit),
  handTarget: (t, { sh, x, face, swing }) => {
    let hx = sh.x + 1.2 + swing;
    let hy = sh.y + 13.0;

    const holdBox = tw(t, 1200, 350, EASE.std) * (1 - tw(t, 3820, 260, EASE.std));
    if (holdBox > 0.001) {
      hx = lerp(hx, sh.x + 11.8, holdBox);
      hy = lerp(hy, sh.y + 8.5, holdBox);
    }

    const tapH = Math.sin(Math.PI * clamp((t - T.ribHStart) / 420));
    const bowTap = Math.sin(Math.PI * clamp((t - T.bowPop) / 320));
    const stampTap = Math.sin(Math.PI * clamp((t - (T.stampHit - 140)) / 280));
    const workAmt = clamp(tapH + bowTap + stampTap);
    if (workAmt > 0.001) {
      hx = lerp(hx, sh.x + 12.6, workAmt);
      hy = lerp(hy, sh.y + 5.0 + stampTap * 6.0, workAmt);
    }

    // Carrying sealed carton off bench (300) into landed Rocket bay (500)
    const carryRocket = tw(t, 5100, 160, EASE.inout) * (1 - tw(t, T.loadRocket + 40, 200, EASE.exit));
    if (carryRocket > 0.001) {
      const reachLift = 1 - tw(t, T.liftBench, 160, EASE.std);
      const loadReach = tw(t, 6720, T.loadRocket - 6720, EASE.inout);
      const bxBench = toLocalHand(sh, x, face, 300, railY(300, t) - 20.8);
      const rTarget = toLocalHand(sh, x, face, PAD_LAUNCH.x, railY(PAD_LAUNCH.x, t) - 25.5);
      let cx = sh.x + 9.6;
      let cy = sh.y + 4.2;
      if (reachLift > 0.001) {
        cx = lerp(cx, bxBench.x, reachLift);
        cy = lerp(cy, bxBench.y, reachLift);
      }
      if (loadReach > 0.001) {
        cx = lerp(cx, rTarget.x, loadReach);
        cy = lerp(cy, rTarget.y, loadReach);
      }
      hx = lerp(hx, cx, carryRocket);
      hy = lerp(hy, cy, carryRocket);
    }

    const cheer = tw(t, 7180, 240, EASE.pop) * (1 - tw(t, 7860, 220, EASE.exit));
    if (cheer > 0.001) {
      const pump = Math.cos(((t - 7180) / 260) * Math.PI);
      hx = lerp(hx, sh.x + 8.8, cheer);
      hy = lerp(hy, sh.y - 7.8 - 2.4 * pump, cheer);
    }
    const fx = t >= 7180 && t < 7920 ? sh.x - 1.0 : undefined;
    const fy = t >= 7180 && t < 7920 ? sh.y + 12.0 : undefined;
    return { hx, hy, fx, fy };
  },
  springT0: 200,
  springT1: 8100,
};

// Actor 3: Rocket Recovery & Unload Specialist (#2B2D42 Slate + #FF7A1A Safety Cap)
// Walks to landed Rocket (640), gets box out by hand, walks across & hands to Express Courier (758)
const UNLOADER_WALKS: readonly WalkSeg[] = [
  { t0: 8780, t1: 9280, x0: 678, x1: 668, dir: 1 }, // steps calmly into perimeter facing left
  { t0: 9540, t1: 9940, x0: 668, x1: 657, dir: 1 }, // walks beside landed Rocket (640)
  { t0: 10340, t1: 11540, x0: 657, x1: 742, dir: 1 }, // walks calmly carrying box to Express Courier (71 px/s)
  { t0: 11840, t1: 12200, x0: 742, x1: 726, dir: -1 }, // steps back slightly after handoff
];

const UNLOADER_SPEC: ActorPoseSpec = {
  walks: UNLOADER_WALKS,
  xInit: 678,
  faceAt: (t) => lerp(-1, 1, tw(t, 10100, 240, EASE.inout)),
  loadedAt: (t) => t >= T.unloadRocket && t < T.courierHandoff,
  squatAt: (t) => {
    const brace = Math.sin(Math.PI * clamp((t - 9320) / 360)) * 0.22;
    const pickSq = Math.sin(Math.PI * clamp((t - 9900) / 340)) * 0.3;
    const giveSq = Math.sin(Math.PI * clamp((t - 11560) / 360)) * 0.18;
    return clamp(brace + pickSq + giveSq, 0, 0.48);
  },
  extraLean: (t) => {
    const pickRec = 4.5 * kick(t, T.unloadRocket);
    const giveFwd = Math.sin(Math.PI * clamp((t - 11560) / 380)) * 7;
    return pickRec + giveFwd;
  },
  hipDrop: (t) => 1.4 * kick(t, T.unloadRocket),
  handTarget: (t, { sh, x, face, swing }) => {
    let hx = sh.x + 1.4 + swing;
    let hy = sh.y + 13.0;

    // 1. Guiding Rocket descent from safe perimeter
    const signal = tw(t, 9160, 200, EASE.std) * (1 - tw(t, 9540, 180, EASE.std));
    if (signal > 0.001) {
      hx = lerp(hx, sh.x + 9.2, signal);
      hy = lerp(hy, sh.y - 4.5, signal);
    }

    // 2. Reaching cleanly into landed Rocket cargo bay (9860..10100)
    const reachRock = tw(t, 9860, 200, EASE.inout) * (1 - tw(t, T.unloadRocket, 160, EASE.std));
    if (reachRock > 0.001) {
      const bay = toLocalHand(sh, x, face, PAD_LAND.x, railY(PAD_LAND.x, t) - 25.5);
      hx = lerp(hx, bay.x, reachRock);
      hy = lerp(hy, bay.y, reachRock);
    }

    // 3. Carrying carton to Express Courier & extending forward for clean relay (10060..11860)
    const carry =
      tw(t, T.unloadRocket - 40, 160, EASE.std) *
      (1 - tw(t, T.courierHandoff + 40, 180, EASE.exit));
    if (carry > 0.001) {
      const extP = tw(t, 11540, T.courierHandoff - 11540, EASE.inout);
      const meetTarget = toLocalHand(sh, x, face, 758, railY(758, t) - 21);
      hx = lerp(hx, lerp(sh.x + 9.4, meetTarget.x, extP), carry);
      hy = lerp(hy, lerp(sh.y + 4.2, meetTarget.y, extP), carry);
    }

    // 4. Crisp friendly wave after handoff
    const waveOn = tw(t, 11960, 220, EASE.pop) * (1 - tw(t, 13000, 240, EASE.exit));
    if (waveOn > 0.001) {
      const pump = Math.sin(((t - 11960) / 280) * Math.PI);
      hx = lerp(hx, sh.x + 7.6, waveOn);
      hy = lerp(hy, sh.y - 7.8 + 1.8 * pump, waveOn);
    }
    const fx = t >= 11960 && t < 13100 ? sh.x - 1.0 : undefined;
    const fy = t >= 11960 && t < 13100 ? sh.y + 12.0 : undefined;
    return { hx, hy, fx, fy };
  },
  springT0: 8740,
  springT1: 12800,
};

// Actor 4: Express Final-Mile Courier (#26C13F Emerald + Ink cap)
// Receives carton directly from Unloader at 758, turns & walks calmly to Doorstep Customer (840)
const COURIER_WALKS: readonly WalkSeg[] = [
  { t0: 11050, t1: 11540, x0: 796, x1: 774, dir: 1 }, // steps left calmly to meet Unloader (45 px/s)
  { t0: 12060, t1: 13160, x0: 774, x1: 825, dir: 1 }, // walks calmly carrying final-mile parcel (46 px/s)
];

const COURIER_SPEC: ActorPoseSpec = {
  walks: COURIER_WALKS,
  xInit: 796,
  faceAt: (t) => lerp(-1, 1, tw(t, 11820, 240, EASE.inout)),
  loadedAt: (t) => t >= T.courierHandoff && t < T.handoffAt,
  squatAt: (t) => {
    const catchSq = Math.sin(Math.PI * clamp((t - 11600) / 360)) * 0.24;
    const handoffSq = Math.sin(Math.PI * clamp((t - 13200) / 480)) * 0.22;
    return clamp(catchSq + handoffSq, 0, 0.45);
  },
  extraLean: (t) => {
    const grabRec = 4 * kick(t, T.courierHandoff);
    const lunge = Math.sin(Math.PI * clamp((t - 13200) / 560)) * 9;
    return grabRec + lunge;
  },
  hipDrop: (t) => 1.5 * kick(t, T.courierHandoff),
  handTarget: (t, { sh, x, face, swing }) => {
    let hx = sh.x + 1.2 + swing;
    let hy = sh.y + 13.0;

    // 1. Extending hands left to receive carton from Unloader (11540..11800)
    const reachPass = tw(t, 11540, 220, EASE.inout) * (1 - tw(t, T.courierHandoff, 160, EASE.std));
    if (reachPass > 0.001) {
      const meet = toLocalHand(sh, x, face, 758, railY(758, t) - 21);
      hx = lerp(hx, meet.x, reachPass);
      hy = lerp(hy, meet.y, reachPass);
    }

    // 2. Carrying final-mile parcel -> gently extending to Doorstep Customer (11780..13800)
    const carry =
      tw(t, T.courierHandoff - 40, 160, EASE.std) *
      (1 - tw(t, T.handoffAt + 80, 200, EASE.exit));
    if (carry > 0.001) {
      const extend = tw(t, 13200, T.handoffAt - 13200, EASE.inout);
      const doorT = toLocalHand(sh, x, face, 840, railY(840, t) - 14.5);
      hx = lerp(hx, lerp(sh.x + 9.0, doorT.x, extend), carry);
      hy = lerp(hy, lerp(sh.y + 4.4, doorT.y, extend), carry);
    }

    // 3. Cheerful post-delivery wave
    const greet = tw(t, T.handoffAt + 120, 260, EASE.pop);
    if (greet > 0.001) {
      const wave = Math.sin(((t - T.handoffAt) / 280) * Math.PI);
      hx = lerp(hx, sh.x + 7.2, greet);
      hy = lerp(hy, sh.y - 7.8 + 2.2 * wave, greet);
    }

    const fx = t >= T.handoffAt + 120 ? sh.x - 0.8 : undefined;
    const fy = t >= T.handoffAt + 120 ? sh.y + 12.2 : undefined;
    return { hx, hy, fx, fy };
  },
  springT0: 11020,
  springT1: 13900,
};

/* ---------- Shared Hero Endpoints ---------- */

const actorBoxAnchor = (spec: ActorPoseSpec, ms: number) =>
  solveActorPose(spec, ms).anchorWorld;

function benchBoxRestPos(ms: number) {
  const bs = sampleArr(SIM.bench, ms);
  return {
    x: 300,
    y: railY(300, ms) - 20.85 + bs.deskY,
    deskY: bs.deskY,
    shelfL: bs.shelfL,
    shelfR: bs.shelfR,
  };
}

/* ---------- Nozzle Vector, Confetti & Map Love/Happy Emoji Seeds ---------- */

function rocketNozzle(rk: RocketSample) {
  const a = (rk.tilt - 45) * D2R;
  const sc = 1.9;
  const vx = -2.9 * sc;
  const vy = 2.7 * sc;
  const steer = (rk.tilt + rk.gimbal) * D2R;
  return {
    x: rk.x + vx * Math.cos(a) - vy * Math.sin(a),
    y: rk.y + vx * Math.sin(a) + vy * Math.cos(a),
    ex: -Math.sin(steer),
    ey: Math.cos(steer),
  };
}

const CONFETTI_SEEDS = Array.from({ length: 16 }, (_, i) => {
  const ang = -Math.PI * 0.86 + (i / 15) * Math.PI * 0.72;
  const spd = 68 + ((i * 37) % 58);
  const colors = ["#6FE86A", "#402CDD", "#FFF5AA", "#FFDBAA", "#AADEFF"] as const;
  return {
    vx0: Math.cos(ang) * spd,
    vy0: Math.sin(ang) * spd - 44,
    spin: (i % 2 ? 1 : -1) * (150 + (i % 5) * 60),
    phase: i * 1.17,
    fill: colors[i % colors.length],
  };
});

const MAP_EMOJIS = [
  "❤️", "😊", "🥰", "💚", "✨", "🥳", "💖",
  "😍", "💚", "❤️", "😊", "✨", "🥰", "💖",
] as const;

const EMOJI_SEEDS = MAP_EMOJIS.map((char, i) => {
  const ang = -Math.PI * 0.92 + (i / (MAP_EMOJIS.length - 1)) * Math.PI * 0.76;
  const spd = 56 + ((i * 29) % 44);
  return {
    char,
    delay: (i % 5) * 36,
    vx0: Math.cos(ang) * spd - 10,
    vy0: Math.sin(ang) * spd - 22,
    buoyancy: -20 - (i % 4) * 5,
    swayAmp: 3.2 + (i % 3) * 1.1,
    swayFreq: 4.5 + (i % 4) * 0.8,
    phase: i * 1.37,
    rotAmp: (i % 2 ? 1 : -1) * (10 + (i % 4) * 3),
    baseScale: 0.92 + (i % 3) * 0.14,
  };
});

/* ---------- DOM Collection & Scene Renderer ---------- */

export type ParcelParts = Record<string, any>;
const NS = "http://www.w3.org/2000/svg";

export function collectParcelParts(root: Element): ParcelParts {
  const q = (c: string) => root.querySelector(".p-" + c);
  const P: ParcelParts = {};
  [
    "railBg",
    "railFill",
    "ring",
    "thumb",
    "bench",
    "benchDesk",
    "benchShelves",
    "benchBoxL",
    "benchBoxR",
    "drop",
    "radar1",
    "radar2",
    "pinWrap",
    "pinGreen",
    "doorstep",
    "shProd",
    "shCatcher",
    "shPacker",
    "shUnloader",
    "shCourier",
    "shRock",
    "heat",
    "rocket",
    "rframe",
    "rocketInner",
    "flame",
    "glow",
    "rlines",
    "legL",
    "legR",
    "cBack",
    "cFront",
    "cArmF",
    "cLegF",
    "cShoeF",
    "cTorso",
    "cLegN",
    "cShoeN",
    "cHair",
    "cHead",
    "cArmN",
    "pBack",
    "pFront",
    "pArmF",
    "pLegF",
    "pShoeF",
    "pTorso",
    "pLegN",
    "pShoeN",
    "pHead",
    "pCap",
    "pArmN",
    "uBack",
    "uFront",
    "uArmF",
    "uLegF",
    "uShoeF",
    "uTorso",
    "uLegN",
    "uShoeN",
    "uHead",
    "uCap",
    "uArmN",
    "eBack",
    "eFront",
    "eArmF",
    "eLegF",
    "eShoeF",
    "eTorso",
    "eLegN",
    "eShoeN",
    "eHead",
    "eCap",
    "eArmN",
    "prod",
    "prodInner",
    "boxTint",
    "boxGlyph",
    "ribV",
    "ribH",
    "bow",
    "badge",
    "deliveredBag",
    "cursor",
    "tap",
  ].forEach((k) => (P[k] = q(k)));

  P.dots = Array.from(root.querySelectorAll(".p-dot"));
  P.checks = Array.from(root.querySelectorAll(".p-check"));
  P.checkBgs = Array.from(root.querySelectorAll(".p-checkBg"));
  P.checkPaths = Array.from(root.querySelectorAll(".p-checkPath"));

  const pg = q("particles");
  pg.replaceChildren();

  const makeCircles = (n: number, fill: string) => {
    const arr: Element[] = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("fill", fill);
      c.setAttribute("opacity", "0");
      pg.appendChild(c);
      arr.push(c);
    }
    return arr;
  };

  P.trail = makeCircles(34, "#E7E7EB");
  P.live = makeCircles(6, "#E7E7EB");
  P.groundDust = makeCircles(14, "#EAE4D8");

  P.confetti = CONFETTI_SEEDS.map((s) => {
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("width", "3.4");
    r.setAttribute("height", "2.1");
    r.setAttribute("rx", "0.7");
    r.setAttribute("fill", s.fill);
    r.setAttribute("opacity", "0");
    pg.appendChild(r);
    return r;
  });

  const eg = q("emojis");
  eg.replaceChildren();
  P.emojis = EMOJI_SEEDS.map((s) => {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("font-size", "12.5");
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "central");
    t.setAttribute("opacity", "0");
    t.textContent = s.char;
    eg.appendChild(t);
    return t;
  });

  return P;
}

const A = (el: Element, k: string, v: number | string) =>
  el.setAttribute(k, typeof v === "number" ? String(+v.toFixed(3)) : v);

function drawHumanActor(
  backGroup: Element,
  frontGroup: Element,
  nodes: {
    armF: Element;
    legF: Element;
    shoeF: Element;
    torso: Element;
    legN: Element;
    shoeN: Element;
    head: Element;
    armN: Element;
    hairOrCap: Element;
    isHair?: boolean;
  },
  shadowEl: Element,
  pose: ReturnType<typeof solveActorPose>,
  opacity: number,
  wScale: number,
  wDy: number,
  clk: number,
) {
  const safeFace = Math.abs(pose.face) < 0.04 ? (pose.face < 0 ? -0.04 : 0.04) : pose.face;
  const fx = safeFace * wScale;
  const tr = `translate(${pose.x} ${pose.ground - 1 + wDy}) scale(${fx} ${wScale}) translate(${-pose.x} ${-(pose.ground - 1)})`;
  A(backGroup, "transform", tr);
  A(frontGroup, "transform", tr);
  A(backGroup, "opacity", opacity);
  A(frontGroup, "opacity", opacity);

  const legPath = (k: ReturnType<typeof solveIK>) =>
    `M${pt(pose.hip.x, pose.hip.y)} L${pt(k.jx, k.jy)} L${pt(k.ex, k.ey)}`;
  const shoePath = (k: ReturnType<typeof solveIK>, f: { a: number }) =>
    `M${pt(k.ex - 0.55 * Math.cos(f.a), k.ey - 0.55 * Math.sin(f.a))} L${pt(
      k.ex + ACTOR_DIM.foot * Math.cos(f.a),
      k.ey + ACTOR_DIM.foot * Math.sin(f.a),
    )}`;

  A(nodes.legN, "d", legPath(pose.knees[0]));
  A(nodes.shoeN, "d", shoePath(pose.knees[0], pose.feet[0]));
  A(nodes.legF, "d", legPath(pose.knees[1]));
  A(nodes.shoeF, "d", shoePath(pose.knees[1], pose.feet[1]));
  A(
    nodes.torso,
    "d",
    `M${pt(pose.hip.x, pose.hip.y - 1.4)} L${pt(pose.sh.x, pose.sh.y + 1.1)}`,
  );
  A(nodes.head, "cx", pose.head.x);
  A(nodes.head, "cy", pose.head.y);
  A(nodes.armN, "d", `M${pt(pose.sh.x, pose.sh.y)} L${pt(pose.armN.jx, pose.armN.jy)} L${pt(pose.armN.ex, pose.armN.ey)}`);
  A(nodes.armF, "d", `M${pt(pose.shF.x, pose.shF.y)} L${pt(pose.armF.jx, pose.armF.jy)} L${pt(pose.armF.ex, pose.armF.ey)}`);

  if (nodes.isHair) {
    const flow = Math.sin(clk / 300) * 0.25 - pose.v * 0.004;
    A(
      nodes.hairOrCap,
      "d",
      `M${pt(pose.head.x - 3.3, pose.head.y - 2.5)} q${pt(-4.5 + flow * 4, 0.5)} ${pt(-5.2 + flow * 6, 6.2)} q${pt(2.3, -2.1)} ${pt(5.6, -3.5)} z`,
    );
  } else {
    A(
      nodes.hairOrCap,
      "d",
      `M${pt(pose.head.x - 4.2, pose.head.y - 1.6)} a 4.3 3.8 0 0 1 8.4 -0.4 L${pt(pose.head.x + 6.4, pose.head.y - 1.5)} L${pt(pose.head.x - 4.2, pose.head.y - 1.6)} z`,
    );
  }

  A(shadowEl, "cx", pose.x);
  A(shadowEl, "cy", pose.ground - 0.6);
  A(shadowEl, "rx", 9.5 + 2.8 * pose.sq);
  A(shadowEl, "opacity", 0.12 * opacity);
}

const GREEN = "#26C13F";
const INK = "#1D1D1D";
const INDIGO = "#402CDD";
const INK_RGB: readonly [number, number, number] = [29, 29, 29];
const GREEN_RGB: readonly [number, number, number] = [38, 193, 63];

export function renderParcelScene(
  P: ParcelParts,
  ms: number,
  clk: number,
  idle: ParcelStatus | null,
  reduce = false,
  scrubbing = false,
) {
  const loop = idle && !reduce ? idle : null;

  /* ===== 1. Packing Station Bench & Secondary Rattle Boxes ===== */
  const bPos = benchBoxRestPos(ms);
  const benchIn = tw(ms, 80, 320, EASE.std);
  const benchOut = tw(ms, 7600, 340, EASE.exit);
  const benchOp = benchIn * (1 - benchOut);
  const deskYAtRail = railY(300, ms) - 29.0 + bPos.deskY;
  A(P.bench, "transform", `translate(280.8 ${deskYAtRail})`);
  A(P.bench, "opacity", benchOp);
  A(P.benchShelves, "transform", `translate(0 ${(bPos.shelfL * 0.55).toFixed(2)}) scale(2.06)`);
  A(P.benchDesk, "transform", `scale(2.06)`);
  A(P.benchBoxL, "transform", `translate(0 ${bPos.shelfL.toFixed(2)}) scale(2.06)`);
  A(P.benchBoxR, "transform", `translate(0 ${bPos.shelfR.toFixed(2)}) scale(2.06)`);

  /* ===== 2. Actor 1 (Female Handler), Actor 2 (Master Packer) & Actor 3 (Rocket Unloader) ===== */
  const poseC = solveActorPose(CATCHER_SPEC, ms);
  const cIn = sp(ms, 40);
  const cOp = tw(ms, 40, 200, EASE.std) * (1 - tw(ms, 7400, 360, EASE.exit));
  drawHumanActor(
    P.cBack,
    P.cFront,
    {
      armF: P.cArmF,
      legF: P.cLegF,
      shoeF: P.cShoeF,
      torso: P.cTorso,
      legN: P.cLegN,
      shoeN: P.cShoeN,
      head: P.cHead,
      armN: P.cArmN,
      hairOrCap: P.cHair,
      isHair: true,
    },
    P.shCatcher,
    poseC,
    cOp,
    lerp(0.88, 1, cIn),
    (1 - cIn) * 6,
    clk,
  );

  const poseP = solveActorPose(PACKER_SPEC, ms);
  const packerOp = tw(ms, 60, 220, EASE.std) * (1 - tw(ms, 7880, 340, EASE.exit));
  drawHumanActor(
    P.pBack,
    P.pFront,
    {
      armF: P.pArmF,
      legF: P.pLegF,
      shoeF: P.pShoeF,
      torso: P.pTorso,
      legN: P.pLegN,
      shoeN: P.pShoeN,
      head: P.pHead,
      armN: P.pArmN,
      hairOrCap: P.pCap,
    },
    P.shPacker,
    poseP,
    packerOp,
    1,
    0,
    clk,
  );

  const poseU = solveActorPose(UNLOADER_SPEC, ms);
  const uOp = tw(ms, 8550, 260, EASE.std);
  drawHumanActor(
    P.uBack,
    P.uFront,
    {
      armF: P.uArmF,
      legF: P.uLegF,
      shoeF: P.uShoeF,
      torso: P.uTorso,
      legN: P.uLegN,
      shoeN: P.uShoeN,
      head: P.uHead,
      armN: P.uArmN,
      hairOrCap: P.uCap,
    },
    P.shUnloader,
    poseU,
    uOp,
    1,
    0,
    clk,
  );

  /* ===== 3. Actor 4 (Express Courier) & Doorstep Customer ===== */
  const poseE = solveActorPose(COURIER_SPEC, ms);
  const eOp = tw(ms, 10850, 260, EASE.std);
  drawHumanActor(
    P.eBack,
    P.eFront,
    {
      armF: P.eArmF,
      legF: P.eLegF,
      shoeF: P.eShoeF,
      torso: P.eTorso,
      legN: P.eLegN,
      shoeN: P.eShoeN,
      head: P.eHead,
      armN: P.eArmN,
      hairOrCap: P.eCap,
    },
    P.shCourier,
    poseE,
    eOp,
    1,
    0,
    clk,
  );

  const doorOpen = sp(ms, 11850);
  const doorPop = 1 + 0.16 * kick(ms, T.handoffAt);
  const doorOp = tw(ms, 11850, 260, EASE.std);
  const doorRailY = railY(MAP_X, ms);
  A(
    P.doorstep,
    "transform",
    `translate(840 ${doorRailY - 22.8}) scale(${(1.75 * lerp(0.7, 1, doorOpen) * doorPop).toFixed(3)})`,
  );
  A(P.doorstep, "opacity", doorOp);

  /* ===== 4. Actor 5: Thrust-Vectored Rocket (Launch -> Powered Landing at x=640) ===== */
  const rk = sampleArr(SIM.rocket, ms);
  const rRail = railY(rk.x, ms);
  const prePadBlend =
    tw(ms, T.rocketPadReady - 80, 120, EASE.std) *
    (1 - tw(ms, T.launchAt, 180, EASE.std));
  const postLandBlend = tw(ms, T.rocketTouchdown - 70, 120, EASE.std);
  const padContactBlend = clamp(prePadBlend + postLandBlend);
  let ry = rk.y + (rRail - G) * padContactBlend;
  if (loop === "shipped") ry += 2.2 * Math.sin(clk / 400);
  const tt = loop === "shipped" ? clk : ms;
  const flick = rk.thrust * (0.85 + 0.22 * Math.sin(tt / 29) + 0.08 * Math.sin(tt / 13));
  const sqY = clamp(1 - rk.comp * 0.045, 0.84, 1.08);
  const sqX = 1 / Math.sqrt(sqY);

  A(P.rocket, "transform", `translate(${rk.x} ${ry}) scale(${sqX} ${sqY})`);
  A(P.rframe, "transform", `rotate(${rk.tilt})`);
  A(P.rocketInner, "transform", `rotate(-45) scale(1.9) translate(-7.5 -7.5)`);
  A(P.rocket, "opacity", rk.op);
  A(
    P.flame,
    "transform",
    `translate(4.9 9.9) rotate(${135 + rk.gimbal}) scale(${Math.max(flick, 0.001)} ${0.55 + 0.45 * clamp(rk.thrust)})`,
  );
  A(P.glow, "opacity", clamp(rk.thrust) * 0.72 * rk.op);
  A(P.glow, "r", 6 + flick * 5);
  A(P.rlines, "opacity", rk.flying * clamp(tw(ms, T.launchAt + 60, 260, EASE.std)));

  const legGeo = (side: number) => {
    const k = rk.legs;
    const hx = side * 2.2;
    const hy = 4;
    const fx = lerp(side * 3.2, side * 9.2, k);
    const fy = lerp(11, 19.6, k) - rk.comp;
    return `M${pt(hx, hy)} L${pt(fx, fy)} M${pt(fx - 1.8, fy)} L${pt(fx + 1.8, fy)}`;
  };
  A(P.legL, "d", legGeo(-1));
  A(P.legR, "d", legGeo(1));

  const rAlt = clamp((rRail - 21 - ry) / 90);
  A(P.shRock, "cx", rk.x);
  A(P.shRock, "cy", rRail - 0.5);
  A(P.shRock, "rx", 11 * (1 - rAlt * 0.7));
  A(P.shRock, "opacity", 0.12 * rk.op * (1 - rAlt));
  const nearGround = clamp(1 - (rRail - 21 - ry) / 42);
  A(P.heat, "cx", rk.x);
  A(P.heat, "cy", rRail - 0.2);
  A(P.heat, "opacity", clamp(rk.thrust) * nearGround * 0.55 * rk.op);

  P.trail.forEach((c: Element, i: number) => {
    const t0 = T.launchAt - 100 + i * 64;
    const life = 900;
    if (ms < t0 || ms > t0 + life || t0 > T.rocketTouchdown + 40) return A(c, "opacity", 0);
    const st = sampleArr(SIM.rocket, t0);
    const nz = rocketNozzle(st);
    const k = (ms - t0) / life;
    const g = EASE.std(k);
    const push = 6 + st.thrust * 6;
    A(c, "cx", nz.x + nz.ex * push * g + (i % 2 ? 1 : -1) * g * 2.5);
    A(c, "cy", nz.y + nz.ey * push * g + g * 4 - k * k * 5);
    A(c, "r", 1.5 + g * (3.6 + st.thrust * 3.5));
    A(c, "opacity", 0.7 * (1 - k) * clamp(st.thrust * 1.3));
  });

  P.live.forEach((c: Element, i: number) => {
    if (loop !== "shipped") return A(c, "opacity", 0);
    const k = (clk / 1000 + i / P.live.length) % 1;
    const nz = rocketNozzle({ ...rk, y: ry });
    const g = EASE.std(k);
    A(c, "cx", nz.x + nz.ex * (4 + g * 14));
    A(c, "cy", nz.y + nz.ey * (4 + g * 14));
    A(c, "r", 1.4 + g * 4.5);
    A(c, "opacity", 0.65 * (1 - k));
  });

  const dustEvents: [number, number][] = [
    [T.rocketPadReady - 80, PAD_LAUNCH.x],
    [T.igniteAt + 80, PAD_LAUNCH.x],
    [T.rocketTouchdown - 240, PAD_LAND.x],
  ];
  let activeDust: [number, number] | null = null;
  for (const ev of dustEvents) {
    if (ms >= ev[0] && ms < ev[0] + 1020) activeDust = ev;
  }
  P.groundDust.forEach((c: Element, i: number) => {
    if (!activeDust) return A(c, "opacity", 0);
    const k = (ms - activeDust[0]) / 1020;
    const g = EASE.flight(k);
    const dir = i % 2 ? 1 : -1;
    const lane = Math.floor(i / 2);
    A(c, "cx", activeDust[1] + dir * (4 + g * (11 + lane * 6)));
    A(c, "cy", railY(activeDust[1], ms) - 2 - g * (1.2 + lane * 1.4));
    A(c, "r", 1.5 + g * (2.2 + lane * 1.0));
    A(c, "opacity", 0.8 * (1 - k));
  });

  /* ===== 5. Hero Product -> Sealed Carton (Pure Walking Handoffs) ===== */
  const press =
    ms < T.pressStart
      ? 0
      : ms < T.buyClick
        ? tw(ms, T.pressStart, T.buyClick - T.pressStart, EASE.std)
        : 1 - tw(ms, T.buyClick, 220, EASE.std);

  const buyRestY = railY(STATIONS[0], ms) - 14.5;
  let px = STATIONS[0];
  let py = buyRestY;
  let ps = 0.86;
  let pOp = 0;
  let pr = 0;
  let pFree = true;
  let pSqX = 1;
  let pSqY = 1;

  if (ms < T.pickBuy) {
    const dropP = tw(ms, T.prodIn, 480, EASE.flight);
    const bounce =
      Math.abs(Math.sin(Math.PI * clamp((ms - (T.prodIn + 380)) / 240))) *
      -3.5 *
      (1 - clamp((ms - (T.prodIn + 380)) / 240));
    pOp = tw(ms, T.prodIn, 160, EASE.std);
    ps = lerp(0.55, 0.86, dropP);
    py = lerp(railY(STATIONS[0], ms) - 36, buyRestY, dropP) + bounce + press * 1.6;
    pSqY = 1 - 0.1 * press;
    pSqX = 1 + 0.06 * press;
  } else if (ms < T.placeBench) {
    // 1. Carried calmly by Female Handler from Buy (100) to Bench (300)
    const cAnc = actorBoxAnchor(CATCHER_SPEC, ms);
    const cSwing = springBody(poseC.aFn, T.pickBuy, ms, 2.6, 0.5, 3.0, 12);
    const pickBlend = tw(ms, T.pickBuy, 160, EASE.std);
    const placeBlend = tw(ms, 3640, T.placeBench - 3640, EASE.inout);
    const restB = benchBoxRestPos(ms);
    px = lerp(lerp(STATIONS[0], cAnc.x, pickBlend), restB.x, placeBlend);
    py = lerp(lerp(buyRestY, cAnc.y, pickBlend), restB.y, placeBlend);
    ps = lerp(0.86, 0.76, tw(ms, T.pickBuy, 360, EASE.std));
    pr = (lerp(0, cSwing, pickBlend) - poseC.v * 0.025) * (1 - placeBlend);
    pFree = false;
    pOp = 1;
    const kPick = kick(ms, T.pickBuy);
    pSqY = 1 + 0.08 * kPick;
    pSqX = 1 - 0.05 * kPick;
  } else if (ms < T.liftBench) {
    // 2. Resting on Packing Bench during wrap, ribbons, bow & Verified seal
    const rest = benchBoxRestPos(ms);
    px = rest.x;
    py = rest.y;
    ps = 0.76;
    const kStamp = kick(ms, T.stampHit);
    pSqY = 1 - 0.12 * kStamp;
    pSqX = 1 + 0.08 * kStamp;
    pFree = false;
    pOp = 1;
  } else if (ms < T.loadRocket) {
    // 3. Carried steadily by Master Packer from Bench (300) into landed Rocket (500)
    const pAnc = actorBoxAnchor(PACKER_SPEC, ms);
    const liftBlend = tw(ms, T.liftBench, 160, EASE.std);
    const bayBlend = tw(ms, 6740, T.loadRocket - 6740, EASE.inout);
    const restB = benchBoxRestPos(ms);
    const rocketBayX = PAD_LAUNCH.x;
    const rocketBayY = railY(PAD_LAUNCH.x, ms) - 24;
    px = lerp(lerp(restB.x, pAnc.x, liftBlend), rocketBayX, bayBlend);
    py = lerp(lerp(restB.y, pAnc.y, liftBlend), rocketBayY, bayBlend);
    ps = lerp(0.76, 0.42, bayBlend);
    pr = (springBody(poseP.aFn, T.liftBench, ms, 2.6, 0.5, 2.8, 10) - poseP.v * 0.022) * (1 - bayBlend);
    pOp = 1 - tw(ms, T.loadRocket - 110, 110, EASE.std);
    pFree = false;
  } else if (ms < T.unloadRocket) {
    // 4. Stowed safely inside Rocket during climb & retro-propulsive landing at x=640
    px = rk.x;
    py = ry - 4;
    ps = 0.42;
    pOp = 0;
    pFree = false;
  } else if (ms < T.courierHandoff) {
    // 5. Retrieved by Unloader from landed Rocket (640) -> carried across to Express Courier (758)
    const uAnc = actorBoxAnchor(UNLOADER_SPEC, ms);
    const eAnc = actorBoxAnchor(COURIER_SPEC, ms);
    const pullOut = tw(ms, T.unloadRocket, 180, EASE.std);
    const passBlend = tw(ms, T.courierHandoff - 100, 100, EASE.inout);
    const bayX = PAD_LAND.x;
    const bayY = railY(PAD_LAND.x, ms) - 24;
    px = lerp(lerp(bayX, uAnc.x, pullOut), eAnc.x, passBlend);
    py = lerp(lerp(bayY, uAnc.y, pullOut), eAnc.y, passBlend);
    ps = lerp(0.42, 0.76, pullOut);
    pr = (springBody(poseU.aFn, T.unloadRocket, ms, 2.6, 0.48, 2.8, 10) - poseU.v * 0.022) * (1 - passBlend);
    pOp = tw(ms, T.unloadRocket, 130, EASE.std);
    pFree = false;
  } else if (ms < T.handoffAt) {
    // 6. Carried final mile by Express Courier to Doorstep Customer (840)
    const eAnc = actorBoxAnchor(COURIER_SPEC, ms);
    const reachDoor = tw(ms, 13200, T.handoffAt - 13200, EASE.inout);
    px = lerp(eAnc.x, 842, reachDoor);
    py = lerp(eAnc.y, doorRailY - 14.5, reachDoor);
    ps = lerp(0.76, 0.44, reachDoor);
    pr = reachDoor * 6;
    pOp = 1 - clamp((reachDoor - 0.72) / 0.28);
    pFree = false;
  } else {
    px = 842;
    py = doorRailY - 14.5;
    pOp = 0;
  }

  if (loop === "buy" || loop === "preparing") {
    py += 1.0 * Math.sin(clk / 460);
  }
  A(P.prod, "transform", `translate(${px} ${py}) rotate(${pr}) scale(${ps})`);
  A(P.prodInner, "transform", `translate(0 13.5) scale(${pSqX} ${pSqY}) translate(0 -13.5)`);
  A(P.prod, "opacity", pOp);

  const pGround = railY(clamp(px, LINE_START, LINE_END), ms);
  const pAlt = clamp((pGround - (py + 13.5 * ps)) / 90);
  A(P.shProd, "cx", px);
  A(P.shProd, "cy", pGround - 0.4);
  A(P.shProd, "rx", 8.5 * ps * (1 - pAlt * 0.65) * pSqX);
  A(P.shProd, "opacity", pFree ? 0.14 * pOp * (1 - pAlt) : 0);

  const boxWrapP = tw(ms, T.placeBench - 40, 260, EASE.std);
  A(P.boxTint, "opacity", boxWrapP * 0.85);
  A(P.boxGlyph, "opacity", boxWrapP * 0.92);
  const rv = tw(ms, T.ribVStart, 300, EASE.std);
  const rhz = tw(ms, T.ribHStart, 300, EASE.std);
  A(P.ribV, "transform", `translate(0 -13.5) scale(1 ${rv}) translate(0 13.5)`);
  A(P.ribV, "opacity", rv > 0 ? 0.9 : 0);
  A(P.ribH, "transform", `scale(${rhz} 1)`);
  A(P.ribH, "opacity", rhz > 0 ? 0.9 : 0);
  A(P.bow, "transform", `translate(0 4) scale(${EASE.pop(clamp((ms - T.bowPop) / 280))})`);
  A(
    P.badge,
    "transform",
    `translate(9.5 -11.5) scale(${EASE.pop(clamp((ms - T.stampHit) / 280))})`,
  );

  /* ===== 6. Buy Cursor & Click Ripple ===== */
  {
    const flyIn = tw(ms, 220, 660, EASE.flight);
    const out = tw(ms, T.buyClick + 100, 260, EASE.exit);
    const cx = lerp(168, 112, flyIn) + out * 10;
    const cy = lerp(22, railY(STATIONS[0], ms) - 22 + press * 8, flyIn) - out * 12;
    A(
      P.cursor,
      "transform",
      `translate(${cx} ${cy}) scale(${1.8 * (1 - 0.14 * press) * (1 - 0.25 * out)}) translate(-7.5 -7.5)`,
    );
    A(P.cursor, "opacity", tw(ms, 220, 160, EASE.std) * (1 - out));
    const tk = clamp((ms - T.buyClick) / 420);
    A(P.tap, "cx", STATIONS[0]);
    A(P.tap, "cy", railY(STATIONS[0], ms));
    A(P.tap, "r", 2 + EASE.std(tk) * 14);
    A(P.tap, "opacity", tk > 0 && tk < 1 ? 0.52 * (1 - tk) : 0);
  }

  /* ===== 7. Elastic Track Colored From Begin (x = 8) & Full Green at Delivery ===== */
  let fx = LINE_START;
  if (ms < T.buyClick) {
    fx = lerp(LINE_START, STATIONS[0], tw(ms, 0, T.buyClick, EASE.inout));
  } else if (ms < T.pickBuy) {
    fx = STATIONS[0];
  } else if (ms < T.placeBench) {
    fx = clamp(Math.max(STATIONS[0], px), STATIONS[0], STATIONS[1]);
  } else if (ms < T.liftBench) {
    fx = STATIONS[1];
  } else if (ms < T.loadRocket) {
    fx = clamp(Math.max(STATIONS[1], px), STATIONS[1], PAD_LAUNCH.x);
  } else if (ms < T.launchAt) {
    fx = PAD_LAUNCH.x;
  } else if (ms < T.rocketTouchdown) {
    fx = clamp(Math.max(PAD_LAUNCH.x, rk.x), PAD_LAUNCH.x, PAD_LAND.x);
  } else if (ms < T.unloadRocket) {
    fx = PAD_LAND.x;
  } else if (ms < T.handoffAt) {
    fx = clamp(Math.max(PAD_LAND.x, px), PAD_LAND.x, 842);
  } else {
    fx = lerp(842, LINE_END, tw(ms, T.handoffAt, 260, EASE.std));
  }

  const done = REACHED_AT[3];
  const greenMix = tw(ms, done, 260, EASE.std);
  const railColor = mixHex(INK_RGB, GREEN_RGB, greenMix, INK, GREEN);

  A(P.railBg, "d", buildRailPath(LINE_START, LINE_END, ms));
  A(P.railFill, "d", buildRailPath(LINE_START, fx, ms));
  A(P.railFill, "stroke", railColor);
  A(P.railFill, "opacity", fx <= LINE_START + 0.05 ? 0 : 1);

  /* ===== 8. All 4 Stage Dots, Animated Checkmarks & One-Shot Emoji Sprinkle ===== */
  const reached = REACHED_AT.map((t) => ms >= t);
  const cur = reached.lastIndexOf(true);

  P.dots.forEach((d: Element, i: number) => {
    A(d, "cx", STATIONS[i]);
    A(d, "cy", railY(STATIONS[i], ms));
    A(d, "r", reached[i] ? 6 : 5.5);
    A(d, "fill", greenMix > 0.001 ? railColor : INK);
  });

  let rkU = -1;
  let rop = 0.48;
  if (cur >= 0) {
    rkU = clamp((ms - REACHED_AT[cur]) / 650);
    if (rkU >= 1) {
      if (loop && cur < 3) {
        rkU = (clk % 1800) / 1800;
        rop = 0.25;
      } else {
        rkU = -1;
      }
    }
  }
  if (rkU > 0 && rkU < 1) {
    const rX = STATIONS[cur];
    A(P.ring, "cx", rX);
    A(P.ring, "cy", railY(rX, ms));
    A(P.ring, "r", 6 + EASE.std(rkU) * 14);
    A(P.ring, "opacity", rop * (1 - rkU));
    A(P.ring, "stroke", cur === 3 ? GREEN : INDIGO);
  } else {
    A(P.ring, "opacity", 0);
  }

  P.checks.forEach((chk: Element, i: number) => {
    const tAt = REACHED_AT[i];
    const cy = railY(STATIONS[i], ms);
    const sc = EASE.pop(clamp((ms - tAt) / 280));
    A(chk, "transform", `translate(${STATIONS[i]} ${cy}) scale(${sc})`);
    A(P.checkPaths[i], "stroke-dashoffset", 1 - tw(ms, tAt + 70, 260, EASE.std));
    A(P.checkBgs[i], "fill", i === 3 ? GREEN : railColor);
  });

  if (scrubbing) {
    A(P.thumb, "transform", `translate(${fx} ${railY(fx, ms)})`);
    A(P.thumb, "opacity", 0.9);
  } else {
    A(P.thumb, "opacity", 0);
  }

  const gp = tw(ms, done, 300, EASE.std);
  A(P.pinGreen, "opacity", gp);
  A(P.drop, "stroke", gp > 0.5 ? GREEN : "#CFCFCF");
  A(P.drop, "y2", Math.max(82, doorRailY - 12));
  const pinBounce = 1 + 0.22 * kick(ms, done + 30);
  A(P.pinWrap, "transform", `translate(848 36) scale(${pinBounce}) translate(-848 -36)`);

  const bagPop = EASE.pop(clamp((ms - done) / 360));
  const bagHover = loop === "delivered" ? 1.4 * Math.sin(clk / 420) : 0;
  A(
    P.deliveredBag,
    "transform",
    `translate(852 ${(doorRailY - 2 + bagHover).toFixed(2)}) scale(${(bagPop * 0.96).toFixed(3)})`,
  );
  A(P.deliveredBag, "opacity", tw(ms, done, 200, EASE.std));

  [P.radar1, P.radar2].forEach((rad: Element, i: number) => {
    const start = done + 40 + i * 180;
    const u = clamp((ms - start) / 760);
    const op = ms >= start && u < 1 ? 0.6 * (1 - u) : 0;
    A(rad, "r", 8 + EASE.std(u) * 26);
    A(rad, "opacity", op);
  });

  // One-shot celebration confetti burst
  P.confetti.forEach((c: Element, i: number) => {
    const s = CONFETTI_SEEDS[i];
    const dtS = (ms - (done + 20)) / 1000;
    if (dtS <= 0 || dtS > 1.35) return A(c, "opacity", 0);
    const drag = 2.0;
    const eDrag = (1 - Math.exp(-drag * dtS)) / drag;
    const cx = 846 + s.vx0 * eDrag + 3.0 * Math.sin(s.phase + dtS * 7.5);
    const cyRaw = 78 + s.vy0 * eDrag + 0.5 * 340 * dtS * dtS * (1 - 0.2 * dtS);
    const floor = railY(clamp(cx, LINE_START, LINE_END), ms) - 2;
    const cy = cyRaw > floor ? floor - Math.abs(cyRaw - floor) * 0.35 : cyRaw;
    const rot = s.spin * dtS;
    A(c, "x", cx);
    A(c, "y", cy);
    A(c, "transform", `rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
    A(c, "opacity", clamp(1 - dtS / 1.3) * 0.9);
  });

  // One-shot Happy & Love Emoji Sprinkle directly out of Map Icon (848, 34) — fires once & stops!
  P.emojis.forEach((el: Element, i: number) => {
    const s = EMOJI_SEEDS[i];
    const dtS = (ms - (done + s.delay)) / 1000;
    const life = 1.35;
    if (dtS <= 0 || dtS > life) {
      return A(el, "opacity", 0);
    }
    const drag = 2.5;
    const eDrag = (1 - Math.exp(-drag * dtS)) / drag;
    const ex = clamp(
      848 + s.vx0 * eDrag + s.swayAmp * Math.sin(s.phase + dtS * s.swayFreq),
      740,
      872,
    );
    const ey = clamp(
      34 + s.vy0 * eDrag + 0.5 * s.buoyancy * dtS * dtS,
      -70,
      78,
    );
    const pop = EASE.pop(clamp(dtS / 0.16));
    const fade = 1 - tw(dtS * 1000, 860, 490, EASE.exit);
    const rot = s.rotAmp * Math.sin(s.phase + dtS * 4.2);
    const sc = s.baseScale * pop * lerp(1, 0.78, clamp(dtS / life));
    A(el, "x", ex);
    A(el, "y", ey);
    A(el, "transform", `translate(${ex} ${ey}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)}) translate(${-ex} ${-ey})`);
    A(el, "opacity", clamp(fade * 0.98));
  });

  return {
    reached,
    cur,
    delivered: ms >= done + 40,
  };
}
