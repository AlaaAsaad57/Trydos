import type { LogoAnimationType } from './LogoAnimationContext';

/**
 * One logo, on one screen, and what it plays there.
 *
 * Before this file the whole flow shared a single pattern and a single loop
 * length, so a client could only ever look at one choice at a time. The picks
 * below are what came out of that comparison: the Quick Preview wordmark builds
 * itself once and stops, Get Started builds and then hands off for good, and
 * every other screen hands off on a loop.
 *
 * A slot is a place a mark rests, not a screen. The Quick Preview has three of
 * them — the centre wordmark, the badge peeking at the bottom edge, and the
 * same badge after the column has lifted — because the design gives each one a
 * different job.
 */

/** One animation, and how long a single loop of it takes. */
export interface LogoStep {
    animation: LogoAnimationType;
    seconds: number;
}

export interface LogoSlotConfig {
    /** Played in order. One entry is the normal case. */
    steps: LogoStep[];
    /** Start the list again after the last step, instead of stopping. */
    loop: boolean;
    /**
     * Let the pattern touch the word.
     *
     * `false` takes the wordmark clip and the per-letter groups away from
     * whatever pattern is playing, so the ring and the dots still move and the
     * word simply stands there. The Quick Preview wordmark is the one place the
     * design asks for it: a cinematic build whose glyphs do not wipe in.
     */
    animateWord?: boolean;
}

/**
 * Every slot in the flow.
 *
 * Both success steps share one id, because they are one screen (see
 * `NewSuccessScreen`) and already share one colour.
 */
export type LogoSlotId =
    | 'quick-preview-wordmark'
    | 'quick-preview-badge'
    | 'quick-preview-badge-expanded'
    | 'get-started'
    | 'terms'
    | 'enter-phone'
    | 'select-method'
    | 'enter-pin'
    | 'not-registered'
    | 'already-registered'
    | 'input-name'
    | 'success';

/** The order the modal lists them in, and the name it shows for each. */
export const LOGO_SLOTS: { id: LogoSlotId; label: string; note?: string }[] = [
    { id: 'quick-preview-wordmark', label: 'Quick Preview - centre wordmark', note: 'the first 8 seconds' },
    { id: 'quick-preview-badge', label: 'Quick Preview - bottom round badge', note: 'while the column is down' },
    { id: 'quick-preview-badge-expanded', label: 'Quick Preview - badge, expanded', note: 'after the 8 seconds' },
    { id: 'get-started', label: 'Get Started' },
    { id: 'terms', label: 'Terms' },
    { id: 'enter-phone', label: 'Phone number' },
    { id: 'select-method', label: 'SMS or WhatsApp' },
    { id: 'enter-pin', label: 'Code entry' },
    { id: 'not-registered', label: 'Number not registered' },
    { id: 'already-registered', label: 'Number already registered' },
    { id: 'input-name', label: 'Name entry' },
    { id: 'success', label: 'Success' },
];

/**
 * One length for the whole flow.
 *
 * The client watched the patterns side by side and picked 3 seconds for every
 * step, so nothing in the flow runs at a different speed to anything else.
 */
const STEP_SECONDS = 3;

/** What every screen after the Quick Preview plays: Hand-Off, on a loop. */
const RELAY_DEFAULT: LogoSlotConfig = {
    steps: [{ animation: 'relay', seconds: STEP_SECONDS }],
    loop: true,
};

/**
 * The picks the client signed off on, so the flow reads correctly before
 * anybody opens the modal. The client changes any of it from there.
 */
export const DEFAULT_LOGO_CONFIG: Record<LogoSlotId, LogoSlotConfig> = {
    // Cinematic Assembly, but the glyphs hold still while the ring and the dots
    // build around them. Loop is off, so it builds the mark once and holds it
    // for the rest of the eight seconds.
    'quick-preview-wordmark': {
        steps: [{ animation: 'reveal', seconds: STEP_SECONDS }],
        loop: false,
        animateWord: false,
    },
    'quick-preview-badge': RELAY_DEFAULT,
    'quick-preview-badge-expanded': RELAY_DEFAULT,
    /**
     * The one chain in the set, and the only place the two patterns meet.
     *
     * It builds once with Cinematic Assembly, and then Hand-Off carries on for
     * as long as the screen is shown. That is what `loop` means here: the list
     * plays once and the last step is the one that keeps going, so the build
     * never replays. See `useLogoSequence`.
     */
    'get-started': {
        steps: [
            { animation: 'reveal', seconds: STEP_SECONDS },
            { animation: 'relay', seconds: STEP_SECONDS },
        ],
        loop: true,
    },
    terms: RELAY_DEFAULT,
    'enter-phone': RELAY_DEFAULT,
    'select-method': RELAY_DEFAULT,
    'enter-pin': RELAY_DEFAULT,
    'not-registered': RELAY_DEFAULT,
    'already-registered': RELAY_DEFAULT,
    'input-name': RELAY_DEFAULT,
    success: RELAY_DEFAULT,
};

export type LogoConfig = Record<LogoSlotId, LogoSlotConfig>;

/** A copy nothing else holds a reference into, so a draft cannot leak edits. */
export const cloneLogoConfig = (config: LogoConfig): LogoConfig =>
    Object.fromEntries(
        Object.entries(config).map(([id, slot]) => [
            id,
            { ...slot, steps: slot.steps.map((step) => ({ ...step })) },
        ]),
    ) as LogoConfig;
