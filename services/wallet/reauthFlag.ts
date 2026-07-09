// Temporary kill-switch: when a wallet request fails with 401 we currently do
// NOT prompt the user to re-verify their phone number. Flip this back to `true`
// to re-enable the phone re-verification flow on wallet 401s.
//
// Guards the `setShouldAuthinticated(true)` calls in:
//   - services/order.ts        (GetWalletBalanceToShow → WalletLinkCard)
//   - components/Cart/WalletPaymentModal.tsx
//   - components/Cart/CheckoutButton.tsx
export const WALLET_REAUTH_ON_401 = false;
