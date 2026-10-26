/**
 * The emoji that has just been picked in the bar, on its way to the message.
 *
 * The bar and the chip that lands on the message are two separate things: the
 * menu closes and the chip appears on the same frame. The menu leaves the
 * picked emoji's place here (the middle of its cell, and its size, on the
 * screen), and the chip - when it is the one for that message and emoji - reads
 * it on mount and flies in from there, as WhatsApp does on the iPhone.
 */
export type ReactionFly = {
  id: string;
  emoji: string;
  /** The middle of the picked emoji in the bar, in window px. */
  x: number;
  y: number;
  /** The emoji's size in the bar, in px. */
  size: number;
};

let pending: (ReactionFly & { at: number }) | null = null;

/** How long a flight waits for its chip, in ms; a flight that was never used is not kept. */
const FLY_WAIT = 1500;

/** The menu's side: this emoji is about to land on message `id`. */
export function launchReaction(fly: ReactionFly) {
  pending = { ...fly, at: Date.now() };
}

/**
 * The chip's side: the flight that is meant for it, or null. It only reads:
 * React may draw a component twice in development, and the second draw must
 * find the same flight. The chip calls `dropReactionFly` once it has it.
 */
export function peekReactionFly(id: string, emoji: string): ReactionFly | null {
  const fly = pending;
  if (!fly || fly.id !== id || fly.emoji !== emoji) return null;
  if (Date.now() - fly.at > FLY_WAIT) return null;
  return fly;
}

/** The chip has taken its flight. */
export function dropReactionFly() {
  pending = null;
}