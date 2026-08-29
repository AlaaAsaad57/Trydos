import { letterCentre } from '../geometry';
import type { LogoGeometry } from '../geometry';
import type { ElementMotion, LogoMotion, PatternContext } from '../types';

/**
 * 10 — Sway. Motion language: one solid object.
 *
 * The mark hangs from a point above itself and swings, like a shop sign on its
 * bracket. It is the calmest pattern in the set and the only one where the
 * whole logo moves as a single thing.
 *
 * The idea
 * --------
 * Every other pattern moves parts of the mark against each other: the dots
 * dart, a letter falls, wind crosses. This one moves nothing against anything.
 * There is one number in the whole file — the swing angle — and every element
 * is placed by asking where a rigid body at that angle would put it.
 *
 * That is the reason it reads as expensive. A logo whose parts move separately
 * looks animated. A logo that moves as one object looks like it is *somewhere*,
 * hanging in a real place with weight. Nothing here is decoration; it is the
 * mark obeying one simple physical rule.
 *
 * It also could not be built before the wordmark was split. A rigid body needs
 * every part of itself to move, and the word was one path that could not move
 * at all. It is the plainest demonstration of why that change was worth making.
 *
 * The one thing that is not rigid
 * -------------------------------
 * The two dots run the same swing 100ms late.
 *
 * That lag is the whole life of it. A perfectly rigid sway is correct and dead
 * — it reads as a picture being slid about. Letting the lighter parts arrive
 * late is the animation principle usually called drag, or overlapping action,
 * and it is what separates a swinging object from a moving image. 100ms is
 * enough to feel and too short to look broken.
 *
 * How the maths works
 * -------------------
 * For a pivot P and a point p, turning the body by an angle gives
 *
 *   v          = p - P
 *   moved      = ( vx·cos - vy·sin ,  vx·sin + vy·cos )
 *   what to do = moved - v,  plus a rotation of the element by the same angle
 *
 * It is computed exactly rather than with the small-angle shortcut, so the
 * vertical part is real: letters on one side of the pivot rise while letters on
 * the other side fall, and the word tips like a beam. Nobody wrote that in. It
 * falls out of the rotation, the same way `firefly`'s eyes converge because two
 * things are aimed at one point.
 *
 * The swing is a sine, so it eases at both ends for free and needs no easing
 * curve: a pendulum is slowest where it turns round. It starts and finishes at
 * zero, so the loop is seamless by construction.
 */

/** Every looping pattern in this set runs on the same 4 second cycle. */
const CYCLE = 4;
/** Samples per cycle. 24 is smooth at this speed and keeps the lists short. */
const SAMPLES = 24;

/**
 * Peak swing, in degrees.
 *
 * Measured against the artwork rather than chosen by eye. At 1.6 degrees the
 * peak travel comes out as:
 *
 *   lockup   letters 3.0-3.3 sideways and up to 2.2 up or down; dots 1.8
 *   badge    letters up to 5.3 sideways; ring 4.6; dots 3.7
 *
 * The two clearances that matter both hold. On the lockup the word rises 2.2
 * while the dots fall 1.8, and they still pass with 5.8 between them. On the
 * badge the "y" reaches 119.9 and the inside of the ring at that height is at
 * 145, so nothing touches the ring.
 *
 * Much past 2.5 degrees and the badge starts to read as sliding across the
 * screen rather than swinging on a pivot.
 */
const SWING = 1.6;

/**
 * How far behind the dots run, as a fraction of the cycle. 0.025 of 4s = 100ms.
 */
const LAG = 0.025;

/** 95ms, as a fraction of the 4s cycle — the same lid speed as every pattern. */
const LID = 0.02375;

/**
 * Where the mark hangs from.
 *
 * On the vertical centre line, and above the artwork by six tenths of its own
 * height. That distance sets the character of the swing: a near pivot makes the
 * mark rock like a seesaw, a far one makes it drift sideways like a sign in the
 * wind. Six tenths sits between the two, so the tip is visible and the sideways
 * travel stays small.
 */
function pivotOf(geo: LogoGeometry) {
    return { x: geo.width / 2, y: -geo.height * 0.6 };
}

interface Offset {
    x: number;
    y: number;
}

/** Where one point ends up when the whole body is turned by `degrees`. */
function displace(point: Offset, pivot: Offset, degrees: number): Offset {
    const a = (degrees * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const vx = point.x - pivot.x;
    const vy = point.y - pivot.y;
    return {
        x: vx * cos - vy * sin - vx,
        y: vx * sin + vy * cos - vy,
    };
}

export function swayPattern({ geo, variant, cycle = CYCLE }: PatternContext): LogoMotion {
    const pivot = pivotOf(geo);

    const times: number[] = [];
    for (let i = 0; i <= SAMPLES; i += 1) times.push(i / SAMPLES);

    /** The swing angle at each sample, optionally running late. */
    const angles = (lag: number) =>
        times.map((t) => SWING * Math.sin(2 * Math.PI * (t - lag)));

    /**
     * Build one element's whole track from the angle track.
     *
     * The rotation and the two offsets all come from the same angle, so an
     * element can never end up turned one way and moved the other — which is
     * what would happen the moment somebody wrote a second copy of one of these
     * numbers by hand.
     */
    const rigid = (point: Offset, lag = 0): ElementMotion => {
        const track = angles(lag);
        const moved = track.map((angle) => displace(point, pivot, angle));
        return {
            animate: {
                x: moved.map((m) => m.x),
                y: moved.map((m) => m.y),
                rotate: track,
            },
            transition: {
                duration: cycle,
                times,
                // No easing curve. A sine is already slowest at the ends, which
                // is exactly where a pendulum is slowest. Easing it as well
                // would slow the turn twice and read as syrup.
                ease: 'linear' as const,
                repeat: Infinity,
            },
        };
    };

    /**
     * A dot: the swing, 100ms late, plus one slow blink.
     *
     * The blink is on its own clock because it is measured in milliseconds, not
     * in fractions of the swing. It lands at 0.55 of the cycle, while the mark
     * is passing through the middle and there is nothing else to look at.
     */
    const eye = (point: Offset): ElementMotion => {
        const base = rigid(point, LAG);
        return {
            animate: { ...base.animate, scaleY: [1, 1, 0.08, 1, 1] },
            transition: {
                x: { duration: cycle, times, ease: 'linear' as const, repeat: Infinity },
                y: { duration: cycle, times, ease: 'linear' as const, repeat: Infinity },
                rotate: { duration: cycle, times, ease: 'linear' as const, repeat: Infinity },
                scaleY: {
                    duration: cycle,
                    times: [0, 0.55, 0.55 + LID, 0.55 + 2 * LID, 1],
                    ease: 'easeOut' as const,
                    repeat: Infinity,
                },
            },
        };
    };

    return {
        // Everything moves sideways, so both ends of the lockup and the whole
        // badge cross their own box edge. The layout box does not change, so
        // nothing on the screen shifts.
        overflowVisible: true,
        leftDot: eye(geo.leftDot),
        rightDot: eye(geo.rightDot),
        letters: geo.letters.map((_, index) => rigid(letterCentre(geo, index))),
        // The ring hangs on the same bracket. Its own turn is only 1.6 degrees,
        // which on a ring of evenly-spaced dots would be invisible — these are
        // not quite evenly spaced, so it reads as a very slight roll, which is
        // right for something swinging.
        ring: variant === 'badge-ring' ? rigid({ x: geo.ring!.cx, y: geo.ring!.cy }) : undefined,
    };
}
