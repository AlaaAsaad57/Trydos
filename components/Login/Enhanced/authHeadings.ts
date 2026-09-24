/**
 * The heading each phone/method/OTP screen shows, keyed by the flow that opened
 * it. The three screens share one map so a new flow cannot pick up the wrong
 * title on one step and the right one on the next.
 *
 * Returns the English key; the screen resolves it through `translateFunction`.
 */
export type AuthFlowType = 'signIn' | 'signUp' | 'verify' | 'changePhone';

const HEADING_KEYS: Record<AuthFlowType, string> = {
    signIn: 'login !',
    signUp: 'Sign up !',
    // Confirming a number the account already owns: the cart's pre-order gate,
    // the re-auth widget, and settings "Verify Now". Not a login — the shopper
    // is already signed in.
    verify: 'Verify Your Number !',
    // Settings: the shopper typed a NEW number and is confirming ownership of it.
    changePhone: 'Change Your Number !',
};

export const authHeadingKey = (authType?: string): string =>
    HEADING_KEYS[authType as AuthFlowType] ?? HEADING_KEYS.signIn;
