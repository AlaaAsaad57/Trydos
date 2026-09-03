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
    /**
     * Keep the last step going for ever, instead of stopping on the plain mark.
     *
     * The list is played once either way. A chain is an introduction followed
     * by an idle: Get Started builds once and then hands off. Playing the build
     * again every few seconds would read as a loading state, so the loop holds
     * the last step and never returns to the top.
     */
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

/** What every screen from Terms onwards plays: Hand-Off, 3 seconds a pass. */
const HAND_OFF: LogoSlotConfig = { steps: [{ animation: 'relay', seconds: 3 }], loop: true };

/**
 * The picks the client applied in the modal on 3 September 2026.
 *
 * The modal saves to the one browser it was used in, so the file has to carry
 * the same picks or a fresh browser, and localhost, play something else. The
 * screenshots the picks were read from are in the design folder next to the
 * XD file. `tests/components/logoSequence.test.tsx` holds them.
 */
export const DEFAULT_LOGO_CONFIG: Record<LogoSlotId, LogoSlotConfig> = {
    // Cinematic Assembly once, and the glyphs hold still while the eyes drop in
    // around them. No loop: the built mark simply stays for the 8 seconds.
    'quick-preview-wordmark': {
        steps: [{ animation: 'reveal', seconds: 3 }],
        loop: false,
        animateWord: false,
    },
    'quick-preview-badge': HAND_OFF,
    'quick-preview-badge-expanded': HAND_OFF,
    // The one chain in the set: it builds once, then hands off for ever. The
    // loop holds the last step, so the build does not come round again.
    'get-started': {
        steps: [
            { animation: 'reveal', seconds: 3 },
            { animation: 'relay', seconds: 3 },
        ],
        loop: true,
    },
    terms: HAND_OFF,
    'enter-phone': HAND_OFF,
    'select-method': HAND_OFF,
    'enter-pin': HAND_OFF,
    'not-registered': HAND_OFF,
    'already-registered': HAND_OFF,
    'input-name': HAND_OFF,
    // Not in the screenshots (the list was cut off above it). Set to match the
    // other inner screens.
    success: HAND_OFF,
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
