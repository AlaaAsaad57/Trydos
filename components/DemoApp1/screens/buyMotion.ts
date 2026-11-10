import { spring, type Transition } from "framer-motion";

/**
 * The timing of the product page's buy sheet and of the flight to the bag.
 *
 * The client picked these numbers on their own phone, with a debug menu that is
 * now gone. The menu gave them as this text:
 *
 *   {"kind":"spring","duration":0.4,"ease":[0.32,0.72,0,1],"bounce":0.3,
 *    "blockDuration":0.4,"gap":0.055,"flight":0.69,"flightEase":[0.16,1,0.3,1],"hit":0.6}
 *
 * The sheet, the card, the button and the bag move on a spring. `visualDuration`
 * is the time the eye sees, and the bounce is how far the spring passes its end.
 */

/** The sheet, the card, the button and the bag, in seconds. */
const DURATION = 0.4;
/** 0 is no bounce. */
const BOUNCE = 0.3;
/** One block inside the sheet, in seconds. */
const BLOCK_DURATION = 0.4;

/** How the sheet, the card, the button and the bag move. */
export const SHEET_TRANSITION: Transition = { type: "spring", visualDuration: DURATION, bounce: BOUNCE };
/** How one block inside the sheet moves. */
export const BLOCK_TRANSITION: Transition = { type: "spring", visualDuration: BLOCK_DURATION, bounce: BOUNCE };
/** The same as CSS, for a CSS transition. CSS has no spring here, so it uses this curve. */
export const SHEET_CSS = `${DURATION}s cubic-bezier(0.32, 0.72, 0, 1)`;

/** The wait between two blocks of the sheet, in seconds. */
export const BLOCK_GAP = 0.055;

/** The flight to the bag, in ms, and its curve: a fast start. */
export const FLIGHT_MS = 690;
export const FLIGHT_EASE = [0.16, 1, 0.3, 1] as const;

/** How strong the card's hit on the glass is: 0 is no hit, 1 is full power. */
export const HIT = 0.6;

/**
 * When the sheet has gone 90 % of its way, in ms. The eye takes the sheet as
 * landed there: the rest of the way is the slow end of the spring.
 */
function arrival() {
  const path = spring(DURATION, BOUNCE);
  for (let ms = 0; ms <= 4000; ms += 4) if (path.next(ms).value >= 0.9) return ms;
  return DURATION * 1000;
}
export const ARRIVAL_MS = arrival();
