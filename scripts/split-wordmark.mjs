/**
 * split-wordmark.mjs — cut the one-path wordmark into one path per letter.
 *
 * Why this exists
 * ---------------
 * The design files draw "trydos" and "try" as a single <path>. One path takes
 * one transform, so no animation can move the "t" without dragging "rydos"
 * with it. This script splits that string into one path per letter, so a
 * pattern can stagger the letters.
 *
 * It never edits an outline. Every subpath comes out byte-for-byte the same
 * shape it went in as; the only change is that a relative "m" that started a
 * subpath is rewritten as the absolute "M" it already resolved to, because a
 * subpath that is moved into its own <path> has no previous point to be
 * relative to.
 *
 * How letters are found
 * ---------------------
 * A letter is a group of subpaths. The outline of an "o" is one subpath and
 * the hole inside it is another, and the hole has to stay in the same <path>
 * as its outline: the fill rule that turns the second one into a hole only
 * works between subpaths of one path. So the rule is containment — a subpath
 * whose box sits inside another subpath's box is part of that letter. What is
 * left is sorted left to right.
 *
 * Run:  node scripts/split-wordmark.mjs
 * It prints the TypeScript to paste into NewLoginDesign/logoPaths.ts.
 */

import { readFileSync } from 'node:fs';

const SRC = 'NewLoginDesign/logoPaths.ts';

/* ------------------------------------------------------------------ parsing */

/** How many numbers each command takes. */
const ARITY = {
    M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0,
};

/**
 * Read a path string into commands.
 *
 * Arc flags are the awkward part: `a1,1,0,0,1,2,3` may legally be written
 * `a1,1,0,011,2,3`, because the two flags are single digits and need no
 * separator. A plain number scan reads `011` as one number and everything
 * after it lands in the wrong parameter. So flags are read one character at a
 * time, by position.
 */
function parsePath(d) {
    const out = [];
    let i = 0;

    const skipSep = () => {
        while (i < d.length && (d[i] === ',' || d[i] === ' ' || d[i] === '\n' || d[i] === '\t' || d[i] === '\r')) i += 1;
    };

    const readNumber = () => {
        skipSep();
        const start = i;
        if (d[i] === '+' || d[i] === '-') i += 1;
        while (i < d.length && d[i] >= '0' && d[i] <= '9') i += 1;
        if (d[i] === '.') {
            i += 1;
            while (i < d.length && d[i] >= '0' && d[i] <= '9') i += 1;
        }
        if (d[i] === 'e' || d[i] === 'E') {
            i += 1;
            if (d[i] === '+' || d[i] === '-') i += 1;
            while (i < d.length && d[i] >= '0' && d[i] <= '9') i += 1;
        }
        if (i === start) throw new Error(`expected a number at ${start}: ${d.slice(start, start + 20)}`);
        return parseFloat(d.slice(start, i));
    };

    const readFlag = () => {
        skipSep();
        const c = d[i];
        if (c !== '0' && c !== '1') throw new Error(`expected an arc flag at ${i}, got ${c}`);
        i += 1;
        return c === '1' ? 1 : 0;
    };

    let command = null;
    while (i < d.length) {
        skipSep();
        if (i >= d.length) break;
        const c = d[i];
        if (/[a-zA-Z]/.test(c)) {
            command = c;
            i += 1;
        } else if (command === null) {
            throw new Error(`path does not start with a command: ${d.slice(0, 20)}`);
        } else if (command === 'M') {
            // A repeated pair after M is an implicit L, per the spec.
            command = 'L';
        } else if (command === 'm') {
            command = 'l';
        }

        const upper = command.toUpperCase();
        const n = ARITY[upper];
        if (n === undefined) throw new Error(`unknown command ${command}`);
        if (n === 0) {
            out.push({ command, args: [] });
            continue;
        }
        const args = [];
        if (upper === 'A') {
            args.push(readNumber(), readNumber(), readNumber(), readFlag(), readFlag(), readNumber(), readNumber());
        } else {
            for (let k = 0; k < n; k += 1) args.push(readNumber());
        }
        out.push({ command, args });
    }
    return out;
}

/** Print a number the way the source file does: no trailing zeros. */
const num = (v) => {
    const r = Math.round(v * 1e6) / 1e6;
    return String(r);
};

function serialise(commands) {
    let out = '';
    for (const { command, args } of commands) {
        out += command;
        args.forEach((a, k) => {
            const s = num(a);
            // A leading "-" already separates two numbers. Anything else needs
            // a comma, or "1" and "2" would be read back as the single "12".
            if (k > 0 && !s.startsWith('-')) out += ',';
            out += s;
        });
    }
    return out;
}

/* ---------------------------------------------------------------- geometry */

/** Sample a cubic at t. */
const cubicAt = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

/** Arc to centre form, then sampled. Follows the SVG spec's own conversion. */
function arcPoints(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2) {
    if (rx === 0 || ry === 0) return [{ x: x2, y: y2 }];
    const phi = (phiDeg * Math.PI) / 180;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1p = cosP * dx + sinP * dy;
    const y1p = -sinP * dx + cosP * dy;
    let rxA = Math.abs(rx);
    let ryA = Math.abs(ry);
    const lambda = (x1p * x1p) / (rxA * rxA) + (y1p * y1p) / (ryA * ryA);
    if (lambda > 1) {
        const s = Math.sqrt(lambda);
        rxA *= s;
        ryA *= s;
    }
    const sign = largeArc === sweep ? -1 : 1;
    const numer = rxA * rxA * ryA * ryA - rxA * rxA * y1p * y1p - ryA * ryA * x1p * x1p;
    const denom = rxA * rxA * y1p * y1p + ryA * ryA * x1p * x1p;
    const co = sign * Math.sqrt(Math.max(0, numer / denom));
    const cxp = (co * rxA * y1p) / ryA;
    const cyp = (-co * ryA * x1p) / rxA;
    const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
    const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;

    const angle = (ux, uy, vx, vy) => {
        const dot = ux * vx + uy * vy;
        const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
        let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
        if (ux * vy - uy * vx < 0) a = -a;
        return a;
    };
    const theta1 = angle(1, 0, (x1p - cxp) / rxA, (y1p - cyp) / ryA);
    let dTheta = angle((x1p - cxp) / rxA, (y1p - cyp) / ryA, (-x1p - cxp) / rxA, (-y1p - cyp) / ryA);
    if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
    if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

    const steps = Math.max(12, Math.ceil(Math.abs(dTheta) / 0.04));
    const pts = [];
    for (let k = 1; k <= steps; k += 1) {
        const t = theta1 + (dTheta * k) / steps;
        pts.push({
            x: cosP * rxA * Math.cos(t) - sinP * ryA * Math.sin(t) + cx,
            y: sinP * rxA * Math.cos(t) + cosP * ryA * Math.sin(t) + cy,
        });
    }
    return pts;
}

/**
 * Walk a subpath and return every point on it, curves sampled rather than
 * approximated by their control points. A control-point box is a superset, and
 * a box that is too big is exactly what would make one letter look like it
 * contains its neighbour.
 */
function subpathPoints(commands) {
    const pts = [];
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let lastC = null;
    let lastQ = null;

    const push = (px, py) => pts.push({ x: px, y: py });

    for (const { command, args } of commands) {
        const rel = command === command.toLowerCase();
        const up = command.toUpperCase();
        const ax = (v) => (rel ? x + v : v);
        const ay = (v) => (rel ? y + v : v);

        if (up === 'M') {
            x = ax(args[0]); y = ay(args[1]);
            startX = x; startY = y;
            push(x, y);
            lastC = null; lastQ = null;
        } else if (up === 'L') {
            x = ax(args[0]); y = ay(args[1]); push(x, y); lastC = null; lastQ = null;
        } else if (up === 'H') {
            x = ax(args[0]); push(x, y); lastC = null; lastQ = null;
        } else if (up === 'V') {
            y = ay(args[0]); push(x, y); lastC = null; lastQ = null;
        } else if (up === 'C' || up === 'S') {
            let c1x; let c1y;
            let c2x; let c2y;
            let ex; let ey;
            if (up === 'C') {
                c1x = ax(args[0]); c1y = ay(args[1]);
                c2x = ax(args[2]); c2y = ay(args[3]);
                ex = ax(args[4]); ey = ay(args[5]);
            } else {
                c1x = lastC ? 2 * x - lastC.x : x;
                c1y = lastC ? 2 * y - lastC.y : y;
                c2x = ax(args[0]); c2y = ay(args[1]);
                ex = ax(args[2]); ey = ay(args[3]);
            }
            for (let k = 1; k <= 64; k += 1) {
                const t = k / 64;
                push(cubicAt(x, c1x, c2x, ex, t), cubicAt(y, c1y, c2y, ey, t));
            }
            lastC = { x: c2x, y: c2y };
            lastQ = null;
            x = ex; y = ey;
        } else if (up === 'Q' || up === 'T') {
            let cx; let cy; let ex; let ey;
            if (up === 'Q') {
                cx = ax(args[0]); cy = ay(args[1]);
                ex = ax(args[2]); ey = ay(args[3]);
            } else {
                cx = lastQ ? 2 * x - lastQ.x : x;
                cy = lastQ ? 2 * y - lastQ.y : y;
                ex = ax(args[0]); ey = ay(args[1]);
            }
            // A quadratic raised to a cubic, so one sampler covers both.
            const c1x = x + (2 / 3) * (cx - x);
            const c1y = y + (2 / 3) * (cy - y);
            const c2x = ex + (2 / 3) * (cx - ex);
            const c2y = ey + (2 / 3) * (cy - ey);
            for (let k = 1; k <= 64; k += 1) {
                const t = k / 64;
                push(cubicAt(x, c1x, c2x, ex, t), cubicAt(y, c1y, c2y, ey, t));
            }
            lastQ = { x: cx, y: cy };
            lastC = null;
            x = ex; y = ey;
        } else if (up === 'A') {
            const ex = ax(args[5]); const ey = ay(args[6]);
            for (const p of arcPoints(x, y, args[0], args[1], args[2], args[3], args[4], ex, ey)) push(p.x, p.y);
            x = ex; y = ey;
            lastC = null; lastQ = null;
        } else if (up === 'Z') {
            x = startX; y = startY;
            push(x, y);
            lastC = null; lastQ = null;
        }
    }
    return pts;
}

function boxOf(points) {
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
}

/* ----------------------------------------------------------------- splitting */

/**
 * Split into subpaths, each rewritten to start with an absolute M.
 *
 * The rewrite is the whole reason this is not a string split. A subpath that
 * began with a relative `m` was measured from wherever the previous subpath
 * ended. Lift it into its own <path> and that previous point is gone, so the
 * letter lands somewhere else. Resolving the start point first removes it.
 */
function toSubpaths(d) {
    const commands = parsePath(d);
    const subpaths = [];
    let current = null;
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;

    for (const cmd of commands) {
        const { command, args } = cmd;
        const rel = command === command.toLowerCase();
        const up = command.toUpperCase();

        if (up === 'M') {
            x = rel ? x + args[0] : args[0];
            y = rel ? y + args[1] : args[1];
            startX = x;
            startY = y;
            current = [{ command: 'M', args: [x, y] }];
            subpaths.push(current);
            continue;
        }
        if (current === null) throw new Error('a command appeared before any M');
        current.push(cmd);

        // Track the point so the next subpath's relative m resolves correctly.
        if (up === 'L' || up === 'T') { x = rel ? x + args[0] : args[0]; y = rel ? y + args[1] : args[1]; }
        else if (up === 'H') { x = rel ? x + args[0] : args[0]; }
        else if (up === 'V') { y = rel ? y + args[0] : args[0]; }
        else if (up === 'C') { x = rel ? x + args[4] : args[4]; y = rel ? y + args[5] : args[5]; }
        else if (up === 'S' || up === 'Q') { x = rel ? x + args[2] : args[2]; y = rel ? y + args[3] : args[3]; }
        else if (up === 'A') { x = rel ? x + args[5] : args[5]; y = rel ? y + args[6] : args[6]; }
        else if (up === 'Z') { x = startX; y = startY; }
    }
    return subpaths;
}

/** Group subpaths into letters: a box inside another box is a counter. */
function groupIntoLetters(subpaths) {
    const parts = subpaths.map((commands) => {
        const box = boxOf(subpathPoints(commands));
        return { commands, box };
    });

    const inside = (a, b) =>
        a.box.minX >= b.box.minX - 0.01 &&
        a.box.maxX <= b.box.maxX + 0.01 &&
        a.box.minY >= b.box.minY - 0.01 &&
        a.box.maxY <= b.box.maxY + 0.01;

    const owner = parts.map(() => -1);
    parts.forEach((part, k) => {
        parts.forEach((other, j) => {
            if (k === j || owner[k] !== -1) return;
            if (inside(part, other) && !inside(other, part)) owner[k] = j;
        });
    });

    const letters = [];
    parts.forEach((part, k) => {
        if (owner[k] !== -1) return;
        const members = [k, ...parts.map((_, j) => j).filter((j) => owner[j] === k)];
        const commands = members.flatMap((j) => parts[j].commands);
        const box = boxOf(members.flatMap((j) => subpathPoints(parts[j].commands)));
        letters.push({ commands, box });
    });

    letters.sort((a, b) => a.box.minX - b.box.minX);
    return letters;
}

/* --------------------------------------------------------------------- main */

const source = readFileSync(SRC, 'utf8');

function extract(name) {
    const m = source.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`));
    if (!m) throw new Error(`${name} not found in ${SRC}`);
    return m[1];
}

const JOBS = [
    { name: 'HEADER_WORDMARK_PATH', out: 'HEADER_LETTERS', word: 'trydos' },
    { name: 'BADGE_WORDMARK_PATH', out: 'BADGE_LETTERS', word: 'try' },
];

/**
 * Prove the split changed no outline.
 *
 * Walk the original path and every generated letter, sample both, and compare
 * point by point. A split that silently moved a letter is the one fault that
 * would not be obvious on screen — a glyph 2px out of place reads as bad
 * kerning, not as a bug — so it is checked rather than eyeballed.
 */
function verify(originalPath, letters) {
    const before = subpathPoints(parsePath(originalPath));
    const after = letters.flatMap((letter) => subpathPoints(parsePath(serialise(letter.commands))));

    if (before.length !== after.length) {
        return `point count changed: ${before.length} before, ${after.length} after`;
    }

    // The letters come out sorted left to right, so the order can differ from
    // the source. Every point in the new set therefore has to be *found* in the
    // old one, not compared by position.
    //
    // Two simpler ideas both give false failures, and both were tried:
    // comparing rounded keys fails because a coordinate reached by adding up
    // relative moves lands ~1e-14 from the same coordinate written absolutely,
    // and two values that close can still round to different keys. Sorting both
    // lists fails for the same reason — a 1e-10 wobble in x reorders two points
    // that share an x, and the comparison then reports the gap between their
    // two very different y values.
    //
    // So: drop the points into coarse cells, and look for each new point in its
    // own cell and the eight around it. Every match is a real match, and no
    // rounding boundary can hide one.
    const TOLERANCE = 1e-6;
    const CELL = 1e-3;
    const cellKey = (x, y) => `${Math.floor(x / CELL)}:${Math.floor(y / CELL)}`;

    const grid = new Map();
    for (const p of before) {
        const k = cellKey(p.x, p.y);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push({ p, used: false });
    }

    for (const q of after) {
        let best = null;
        let bestGap = Infinity;
        const cx = Math.floor(q.x / CELL);
        const cy = Math.floor(q.y / CELL);
        for (let dx = -1; dx <= 1; dx += 1) {
            for (let dy = -1; dy <= 1; dy += 1) {
                for (const entry of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
                    if (entry.used) continue;
                    const gap = Math.hypot(entry.p.x - q.x, entry.p.y - q.y);
                    if (gap < bestGap) {
                        bestGap = gap;
                        best = entry;
                    }
                }
            }
        }
        if (!best || bestGap > TOLERANCE) {
            return `the point ${num(q.x)},${num(q.y)} is not on the original outline (nearest was ${bestGap.toFixed(9)} away)`;
        }
        best.used = true;
    }
    return null;
}

let failed = false;

for (const job of JOBS) {
    const d = extract(job.name);
    const subpaths = toSubpaths(d);
    const letters = groupIntoLetters(subpaths);

    const problem = verify(d, letters);
    if (problem) {
        failed = true;
        console.error(`FAIL ${job.name}: ${problem}`);
    } else {
        console.error(`ok   ${job.name}: ${letters.length} letters, every point matches the source outline`);
    }

    console.log(`\n/* ${job.name} -> ${letters.length} letters (word "${job.word}", ${subpaths.length} subpaths) */`);
    if (letters.length !== job.word.length) {
        console.log(`/* WARNING: expected ${job.word.length} letters, found ${letters.length} */`);
    }
    console.log(`export const ${job.out}: WordmarkLetter[] = [`);
    letters.forEach((letter, k) => {
        const id = job.word[k] ?? `x${k}`;
        const b = letter.box;
        console.log(`    {`);
        console.log(`        id: '${id}${k}',`);
        console.log(`        box: { x: ${num(b.minX)}, y: ${num(b.minY)}, width: ${num(b.maxX - b.minX)}, height: ${num(b.maxY - b.minY)} },`);
        console.log(`        d: "${serialise(letter.commands)}",`);
        console.log(`    },`);
    });
    console.log('];');
}

if (failed) process.exit(1);
