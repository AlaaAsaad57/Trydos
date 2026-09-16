// Temporary kill-switch: when a wallet request fails with 401 we currently do
// NOT prompt the user to re-verify their phone number. Flip this back to `true`
// to re-enable the phone re-verification flow on wallet 401s.
//
// Guards the `setShouldAuthinticated(true)` calls in:
//   - services/order.ts        (GetWalletBalanceToShow → WalletLinkCard)
//   - components/Cart/CheckoutButton.tsx
//
// `RdbPaymentModal.tsx` does NOT use this flag: it only talks to the Trydos
// core backend (never RDB directly), and the core backend's RDB endpoints
// have no 401 branch that calls `setShouldAuthinticated`.
export const WALLET_REAUTH_ON_401 = false;
