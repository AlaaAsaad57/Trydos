/**
 * Which keyboard types the numbers on the demo's wallet sheets on a phone
 * (the cash-out amount and phone, the cash-in amounts, the request code).
 *
 * true: the phone's own number pad (`inputMode="decimal"` / `"tel"`), which
 * the client asked to test on the iPhone. Safari then hides its bottom bar,
 * but it shows its own form bar (∧ ∨ ✓) and the site's name over the page.
 * false: the app's keypad (`NumericKeypad`), the same one the login uses.
 *
 * To go back to the app's keypad, set this to false. Nothing else changes.
 */
export const NATIVE_WALLET_KEYBOARD = true;

/**
 * The demo's own keyboard (`DemoApp1/keyboard/DemoKeyboard`), drawn like the
 * iOS 26 one, types into every field of the demo on a phone or a tablet.
 *
 * true: the page's keyboard. Every field gets `inputmode="none"`, so the
 * device's keyboard stays away. This needs NATIVE_WALLET_KEYBOARD to be true:
 * the wallet's fields must be plain inputs for the keyboard to type into.
 * false: the device's own keyboard. Nothing else changes.
 */
export const DEMO_KEYBOARD = true;
