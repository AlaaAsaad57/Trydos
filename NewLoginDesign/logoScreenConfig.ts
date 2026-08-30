import type { LogoAnimationType } from './LogoAnimationContext';

/**
 * One logo, on one screen, and what it plays there.
 *
 * Before this file the whole flow shared a single pattern and a single loop
 * length, so a client could only ever look at one choice at a time. The design
 * calls for something else: the Quick Preview builds itself, Get Started builds
 * and then hands off once, Terms hands off, and everything after that winks.
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

/** What the rest of the flow plays when nothing else is asked for. */
const WINK_DEFAULT: LogoSlotConfig = { steps: [{ animation: 'wink', seconds: 5 }], loop: true };

/**
 * The picks the design starts from, so the flow reads correctly before anybody
 * opens the modal. The client changes any of it from there.
 */
export const DEFAULT_LOGO_CONFIG: Record<LogoSlotId, LogoSlotConfig> = {
    // Cinematic Assembly, but the glyphs hold still while the ring and the dots
    // build around them.
    'quick-preview-wordmark': {
        steps: [{ animation: 'reveal', seconds: 5 }],
        loop: true,
        animateWord: false,
    },
    // Slow, because the badge is only peeking over the bottom edge here.
    'quick-preview-badge': { steps: [{ animation: 'wink', seconds: 10 }], loop: true },
    'quick-preview-badge-expanded': { steps: [{ animation: 'relay', seconds: 5 }], loop: true },
    // The one chain in the set: it builds, hands off once, and then stops.
    'get-started': {
        steps: [
            { animation: 'reveal', seconds: 5 },
            { animation: 'relay', seconds: 5 },
        ],
        loop: false,
    },
    terms: { steps: [{ animation: 'relay', seconds: 5 }], loop: true },
    'enter-phone': WINK_DEFAULT,
    'select-method': WINK_DEFAULT,
    'enter-pin': WINK_DEFAULT,
    'not-registered': WINK_DEFAULT,
    'already-registered': WINK_DEFAULT,
    'input-name': WINK_DEFAULT,
    success: WINK_DEFAULT,
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
