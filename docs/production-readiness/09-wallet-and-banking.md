# Wallet and banking — Production readiness

**Status:** 🔴 Not ready
**In one line:** The app signs the shopper in to the wallet and shows a balance, but the wallet itself is not built: its sheet says "Under Development", the bank-cards page is empty, and the RDB widget is switched off.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
- The shopper sees an **"RDB Wallet"** card with a balance on the Settings page (`components/setting/WalletLinkCard.tsx`). A tap on the card opens a bottom sheet.
- `/[lang]/settings/wallet` (`components/settings/WalletTransactions.tsx`) is a list of wallet transactions. No button in the real app opens it; only the demo code links to it.
- **Settings → Profile → Bank Cards** opens `/[lang]/settings/profile/Bank-Cards`.
- At sign-in, the server also signs the shopper in to the **wallet** backend (`app/api/auth/login/route.ts`). Paying an order with RDB happens at checkout — see file `07` for that step. This file covers the wallet itself.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Shopper signs in with a one-time code → the server also signs in to the wallet with the code's id token and the merchant API key → the wallet token goes into an HttpOnly cookie, and the wallet user into the `WALLET_USER` cookie. | wallet `POST /auth/phone/login-with-id-token` | `app/api/auth/login/route.ts:278-290`, `:357-358`, `:425-469`; `utils/fetch/Endpoints.ts:21` | `tests/app/api/auth/login/route.test.ts`; e2e `AUTH-01` (red, see below) |
| W-2 | The wallet backend refuses or times out (10 s) at sign-in → the shopper is still signed in to the shop. The route names the failure `endpoint: "WALLET"` in `is_failed` and sends it to Sentry. | wallet | `app/api/auth/login/route.ts:332-350` | `tests/app/api/auth/login/route.test.ts` |
| W-3 | Right after sign-in, the app checks the shopper's wallet accounts. If the check fails, the app creates a `MAIN` wallet. A 401 creates nothing. | wallet `GET /wallets/myAcounts`, `POST /wallets?subtype=MAIN` | `services/auth.ts:240`, `services/wallet/index.ts` `checkWallet`, `createWallet` | `tests/services/wallet/index.test.ts` |
| W-4 | Signed-in shopper opens Settings → the wallet card shows the balance in the country's currency, with its symbol and decimals. | core (shop currency for the country) + wallet `GET /currencies`, `GET /wallets/my/balances/{currencyId}` | `WalletLinkCard.tsx` `GetWalletForUser` → `services/order.ts` `GetWalletBalanceToShow` → `services/wallet/index.ts` `GetWalletBalanceForCountryCurrency` (Server Action, reads the HttpOnly token on the server) | `tests/components/setting/WalletLinkCard.test.tsx`, `tests/services/wallet/index.test.ts`, `tests/services/orderClass.test.ts` |
| W-5 | The balance call throws (for example, the country's currency is not in the wallet) → the card shows `--` and a "Retry" button. Click, Enter or Space loads it again. | wallet | `WalletLinkCard.tsx:33-62`, `:145-190` | `WalletLinkCard.test.tsx` |
| W-6 | A guest taps the wallet card → the sign-in sheet opens. | none | `WalletLinkCard.tsx:77-81` | `WalletLinkCard.test.tsx` |
| W-7 | Sign-out, an expired session, or a new guest device → the app deletes the wallet token and the `WALLET_USER` cookie. | none | `app/api/auth/expire/route.ts:92,99`, `app/api/auth/clear-tokens/route.ts:16`, `app/api/auth/register-device/route.ts:25,30` | `tests/app/api/auth/expire/route.test.ts`, `tests/app/api/auth/logout/route.test.ts` |

## ⚠️ Works, with limits
- **L-1 — The transactions page is reachable only by typing the URL.** No real link points to `/settings/wallet` (only `components/DemoApp*`). The wallet card opens a sheet instead.
- **L-2 — The transactions page mixes two wallets.** The list comes from the **core** backend (`GET /customer/wallet/list`, `services/order.ts:176-198`). That is the old shop wallet, not the RDB wallet. The page asks for the RDB balance through `order.GetWallet()`, but `GetWallet` returns `response.data`, and the RDB balance object has no `data` field (`services/order.ts:150`). So the page always shows the `wallet_balance` from the core list, while the Settings card shows the RDB balance. The two numbers can differ.
- **L-3 — The transactions page uses the shop currency without a rate.** Amounts show with today's shop symbol and decimals (`WalletTransactions.tsx:172`, `:245`), and the app applies no exchange rate. If the core list is in USD, the numbers are wrong for non-USD shops.
- **L-4 — The transactions page says "No more orders"** at the end of the list (`WalletTransactions.tsx:269`). It should talk about transactions.
- **L-5 — An expired wallet token shows an empty balance, not an error.** The wallet has no refresh token. On a 401, `GetWalletBalanceToShow` returns `{ ...walletBalance, success: walletBalance ? true : false }` (`services/order.ts:174`). The 401 object is not empty, so `success` becomes `true`. The card then shows no number, no symbol and no Retry button. Found by reading the code; no test covers it yet.
- **L-6 — No re-verify prompt on a wallet 401.** `WALLET_REAUTH_ON_401 = false` (`services/wallet/reauthFlag.ts:12`). So after the wallet token expires, the balance stays broken until the next full sign-in.
- **L-7 — The wallet is created on any failed check.** `checkWallet` calls `createWallet` when `myAcounts` fails for any reason (`services/wallet/index.ts:167-168`), not only when the shopper has no wallet. A 500 from the wallet backend can lead to a second create call.
- **L-8 — Sign-in sends weak profile data to the wallet.** `email: String(InventoryUser.email) ?? ""` sends the text `"undefined"` or `"null"` when the shopper has no e-mail. `lastName` takes only the second word of the name (`app/api/auth/login/route.ts:283-285`).
- **L-9 — Wallet profile updates are off.** When the shopper edits the name or photo, the wallet copy is not updated. The `PATCH /users/me` call is commented out (`services/auth.ts:703-757`). The rollback block for it (`services/auth.ts:917-965`) can never run.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | The wallet sheet is a placeholder. A tap on the card opens a sheet with only "Under Development". The RDB widget is commented out. | No deposit, withdraw, transfer, history or card management. | `components/setting/WalletLinkCard.tsx:100`, `:102-121` | Frontend + Product | Yes — the core of the wallet is not built. Build it, or hide the card for launch. |
| M-2 | The `rdb` package is gone. It is not in `package.json`. `services/RDB/index.ts` and `services/RDB/serverActions.ts` are fully commented out. | — | `services/RDB/index.ts`, `services/RDB/serverActions.ts`, `package.json` | Frontend | Yes — the widget in M-1 has nothing to run on. |
| M-3 | The Bank Cards page is empty. The Profile page links to it, but the page renders only a back bar. | A blank page. | `app/(client)/[lang]/settings/profile/Bank-Cards/page.tsx`, link in `app/(client)/[lang]/settings/profile/page.tsx:42` | Frontend + Product | Yes — a visible menu item that leads nowhere. Build it or remove the link. |
| M-4 | `/api/auth/wallet-token` hands the raw wallet token to browser JavaScript. `WalletLinkCard` calls it on every sheet open (`WalletLinkCard.tsx:69-74`) and stores the token in state, but nothing uses it while the widget is off. This breaks the repo rule "tokens only in HttpOnly cookies", and a script injected into the page could read the token. | Nothing visible. | `app/api/auth/wallet-token/route.ts`, `WalletLinkCard.tsx:69-74` | Frontend (security) | Yes — remove the call while the widget is off; when the widget returns, review whether the route is still needed. |
| M-5 | The wallet backend answers `502` on sign-in on staging. The e2e test `AUTH-01` stays red on purpose for this reason. | Signed-in shoppers have no wallet token, so the balance cannot load. | wallet backend `POST /auth/phone/login-with-id-token` | Backend | Yes — no wallet works without sign-in. |
| M-6 | Wallet functions with no caller: `GetBanks`, `UploadMedia`, `CreateBankDeposit`, `CalculateFees`, `GetBankDepostits`. Bank deposit, fees and bank lists are written but not wired to any screen. (`createWallet` and `getCurrencies` **are** used, by `checkWallet` and the balance call.) | — | `services/wallet/index.ts:229-376` | Frontend + Product | No — the code has no effect. Wire it when the wallet is built, or remove it. |
| M-7 | No payment from the wallet balance. `pay_by_wallet` is gone from checkout (`services/order.ts:74-75`). The old core wallet list call is commented out (`services/order.ts:130-135`). | The shopper cannot spend the balance shown on the card. | `services/order.ts:74-75`, `:130-135` | Product + Backend | No — if launch does not promise wallet spending. RDB checkout payment is covered in file 07. |
| M-8 | Refunds say "Back to your wallet" (see file 08, M-5), but this wallet is not usable. | A promise the shopper cannot check. | `components/setting/orders/OrderDetailsWrapper.tsx:1374`, `components/Orders/OrderRetailsReturnInfo.tsx:71` | Product + Backend | Yes — tracked in file 08. |

## 🔒 Must do before launch
- [ ] Decide the launch scope: build the wallet sheet (M-1, M-2), or hide the wallet card and the transactions route.
- [ ] Build the Bank Cards page, or remove its link from the Profile page (M-3).
- [ ] Stop sending the raw wallet token to the browser while the widget is off (M-4).
- [ ] Get the wallet sign-in working on the backend; `AUTH-01` must turn green (M-5).
- [ ] Show an error or a re-verify prompt when the wallet token expires, not an empty balance (L-5, L-6).
- [ ] If the transactions page stays, link it from the UI and make it read one wallet, in the paid currency (L-1, L-2, L-3).

## ❓ Needs confirmation from the backend team
- Why does `POST /auth/phone/login-with-id-token` answer `502` on staging? When will it be fixed? (M-5)
- How long does a wallet access token live? Is a refresh token planned? Today the app has no way to renew it. (L-5, L-6)
- Which wallet is the real one at launch: the core wallet behind `/customer/wallet/list`, or the RDB wallet? Where do refunds go? (L-2, M-8)
- In which currency does `/customer/wallet/list` return `credit`, `debit` and `wallet_balance`? (L-3)
- Does `GET /wallets/myAcounts` return a clear "no wallet" answer, so the app creates a wallet only then? Is `POST /wallets?subtype=MAIN` safe to call twice? (L-7)
- What should the wallet receive for a shopper with no e-mail? (L-8)

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/components/setting/WalletLinkCard.test.tsx` — balance, Retry, no load during re-auth, sheet opens and fetches the token.
- `tests/components/settings/WalletTransactions.test.tsx` — balance, paging, opening an order. It includes the guard **BUG-settings-2** (passes today).
- `tests/services/wallet/index.test.ts` — `fetchServerData`, `checkWallet`, `createWallet`, `GetWalletBalanceForCountryCurrency`.
- `tests/services/walletReauthFlag.test.ts` — the kill-switch value only.
- `tests/services/orderClass.test.ts` — `GetWallet`, `GetWalletBalanceToShow`, `GetWalletTransactions`.
- `tests/app/api/auth/wallet-token/route.test.ts` — the token route.
- `tests/app/api/auth/login/route.test.ts` — the wallet leg of sign-in.
- `tests/app/api/auth/expire/route.test.ts`, `tests/app/api/auth/logout/route.test.ts` — wallet cookies removed.

**Expected-failure markers:** none in the wallet unit tests.

**Browser (Playwright, staging):**
- `AUTH-01` (`tests/e2e/auth.live.spec.ts:95`) checks that the wallet cookies land at sign-in. It is **red on purpose**: the wallet backend answers `502`. It names the wallet as the failing backend.
- `profile.live.spec.ts` leaves the wallet out of the profile-update legs, because that leg is commented out (L-9).

**Important cases with NO test:**
- No test for the 401 case of the Settings balance, which shows an empty amount (L-5).
- No test shows that the transactions page ignores the RDB balance (L-2). `WalletTransactions.test.tsx:53` mocks `GetWallet` to return `{ wallet_balance, currency_symbol }`, and `orderClass.test.ts:333-336` mocks the balance call with a `data` field. The real calls return neither shape.
- No browser test opens the wallet card, the transactions page or the Bank Cards page.
