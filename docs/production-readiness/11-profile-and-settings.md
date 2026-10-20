# Profile and settings — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Profile editing, photo, size, addresses, country, language and the become-seller request all work, but dead legal links and an empty "Bank Cards" page are visible to every shopper. The developer "Notification Test" panel was removed on 2026-10-20.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
The shopper opens `/[lang]/settings` from "Settings" in the avatar menu (`components/Home/Menu.tsx`).
The hub shows the profile card, the become-seller or "Sales" card, the orders and wallet cards, an option list, and the country and language buttons.
From the profile card the shopper reaches `/settings/profile` and its sub-pages: Personal Info, Size, Address and Picture.
Orders (`/settings/orders`), wallet and "My Checklist" belong to other files; this file only checks that the hub links to them.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Avatar menu → "Settings" → the settings hub opens | none | `components/Home/Menu.tsx` → `app/(client)/[lang]/settings/page.tsx` | `tests/components/Home/Menu.test.tsx`, `tests/app/settings/pages.test.tsx`; e2e PROF-01 |
| W-2 | Signed-in shopper sees name, phone (international format), photo and a "Verified" badge on the profile card; tap → `/settings/profile` | none (cookie + store) | `components/setting/profile/index.tsx`, `VerifyUser.tsx` | `tests/components/setting/profile/index.test.tsx`, `VerifyUser.test.tsx`; e2e PROF-01, PROF-06 |
| W-3 | A guest sees "Login" on the profile card; tap → the sign-in overlay | none | `components/setting/profile/index.tsx` `handleCardClick` | `index.test.tsx` |
| W-4 | "Verify Now" on the card: a stored phone → verify widget; no phone → sign-in overlay | core (OTP) | `components/setting/profile/VerifyUser.tsx` | `VerifyUser.test.tsx` |
| W-5 | Signed-in shopper with no shop → "Become A Seller At Trydos" → the modal reads the shopper's request and shows the form, "pending", "rejected" (with the reason) or "approved" | core `GET /shop/vendor-requests` | `components/settings/GoToSellerDashBoard.tsx`, `BecomeSellerModal.tsx` `fetchVendorRequest` | `tests/components/settings/GoToSellerDashBoard.test.tsx`, `BecomeSellerModal.test.tsx` |
| W-6 | Become-seller form → every field is checked inline → at least 1 document (image or PDF) is uploaded → submit → "Request submitted successfully" → the status is read again | core `POST /shop/uploads/presigned-url`, PUT to the storage address, core `POST /shop/vendor-requests` | `BecomeSellerModal.tsx` `uploadDocument`, `performSubmit`, `submit` | `BecomeSellerModal.test.tsx`, `tests/components/settings/becomeSellerLimits.test.ts` |
| W-7 | Submit says "phone is not verified" → the verify widget opens → after the code the request is sent once more; "already exists" → the status screen | core | `BecomeSellerModal.tsx` `openPhoneVerifyAndWait`, `isUserAlreadyExistsError` | `BecomeSellerModal.test.tsx` |
| W-8 | Shopper who owns a shop → black "Sales" card → `/sellerProfile` | core `/shop/auth/permissions` | `GoToSellerDashBoard.tsx` `getPermission` | `GoToSellerDashBoard.test.tsx`; e2e SD-01 |
| W-9 | The shop lookup fails → "Failed to load permissions" with a "Retry" button | core `/shop/auth/permissions` | `GoToSellerDashBoard.tsx` lines 109–153 | `GoToSellerDashBoard.test.tsx` |
| W-10 | Orders card and wallet card open their own pages; a guest gets the sign-in overlay (pages covered in other files) | see other files | `components/setting/orders/index.tsx`, `components/setting/WalletLinkCard.tsx` | `tests/components/setting/orders/index.test.tsx`, `tests/components/setting/WalletLinkCard.test.tsx` |
| W-11 | Option list: "Settings" → `/settings/prefferences`, "My Checklist" → `/settings/checklist`, "Terms & Conditions" → `/terms-of-service` | none | `settings/page.tsx` lines 53–68 | `pages.test.tsx`; e2e `staticPages.live.spec.ts` "the terms of service page renders" |
| W-12 | Country button → country list (cached per session) → pick → confirm modal ("Current" / "New") → locale cookie written, starter settings fetched → reload to `/{new country}-{lang}/settings` | core `GetCountries`, starter settings | `components/settings/PersonalInfoCountries.tsx` | `tests/components/settings/PersonalInfoCountries.test.tsx`; e2e GUEST-51 |
| W-13 | Language button → list from the core backend → pick → "Save" → cookie written → reload under the new language | core `/languages` | `settings/languages/page.tsx`, `components/settings/LanguageSetting.tsx` | `tests/components/settings/LanguageSetting.test.tsx`, `pages.test.tsx`; e2e GUEST-50 |
| W-14 | Profile page shows the photo ("Change Photo" / "Add Photo") and links to Personal Info, Size and Address | none (cookie) | `settings/profile/page.tsx` | `pages.test.tsx`; e2e PROF-06 |
| W-15 | Personal Info: edit name, e-mail, gender, alternative phone → checks run → only changed fields are sent → stories, then chat, then core → cookies and store updated → back to the profile page | stories `/api/v1/users/update`, chat `PUT /api/v1/users/{id}`, core `/customer/update-profile` | `components/setting/profile/PersonalInfoForm.tsx` → `services/auth.ts` `UpdateProfile` | `tests/components/setting/profile/PersonalInfoForm.test.tsx`, `tests/services/auth.profile.test.ts`; e2e PROF-02, PROF-03, PROF-08 |
| W-16 | A save that one backend refuses → earlier backends are rolled back → the backend's field error appears under the right input, and the shopper is told only once | same as W-15 | `services/auth.ts` `UpdateProfile` catch block, `utils/fieldErrors.ts` | `auth.profile.test.ts`, `PersonalInfoForm.test.tsx`; e2e SCRIPT-07, SCRIPT-08 |
| W-17 | Change phone: new number → confirmation → code sent to the new number → code checked → profile saved with the returned `id_token` | core `/auth/phone/send_otp` (server action), market `/auth/phone/verify_otp`, core `/customer/update-profile` | `PersonalInfoForm.tsx` (`VerifyPhoneFlow`, `authType="changePhone"`), `services/auth.ts` `VerifyOtpForUpdatePhone` | `PersonalInfoForm.test.tsx`, `tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx`; e2e SCRIPT-12 |
| W-18 | Size: height 110–250 cm and weight 40–180 kg (Arabic digits accepted) → save → back to the profile page | core `/customer/update-profile` (+ stories, chat) | `components/settings/ProfileSizeInfo.tsx` | `tests/components/settings/ProfileSizeInfo.test.tsx`; e2e PROF-04 |
| W-19 | Picture: choose from the library or take a photo → crop → upload → saved on the account → back to the profile page | media `/gated/upload` with an upload ticket, then core `/customer/update-profile` | `components/settings/UploadProfilePhoto.tsx` → `services/auth.ts` `UpdateProfileImage`, `UpdateProfile` | `tests/components/settings/UploadProfilePhoto.test.tsx`; e2e PROF-05 (skipped when media is not set up) |
| W-20 | "Remove Photo" → `image: null` is saved, and the app stops showing the old photo | core | `UploadProfilePhoto.tsx`, `services/auth.ts` (null is kept, not replaced) | `auth.profile.test.ts`; e2e PROF-05 |
| W-21 | A refused photo upload → "File upload failed." and nothing is saved | media | `UploadProfilePhoto.tsx` lines 151–165 | `UploadProfilePhoto.test.tsx`; e2e SCRIPT-09 |
| W-22 | Address list loads; add (region picker + map) → saved; edit → saved; delete with a confirm dialog → removed | core `/customer/address/list`, `/add`, `/update`, `/delete` | `components/settings/PersonalInfoAddress.tsx`, `PersonalInfoAddressModal.tsx` → `services/order.ts` | `tests/components/settings/PersonalInfoAddress.test.tsx`, `PersonalInfoAddressModal.test.tsx`; e2e PROF-07 |
| W-23 | Preferences: subscribed and unsubscribed topics load; "Subscribe" / "Unsubscribe" move a topic | core `/firebase_device_tokens/...` settings, `subscribe_topic`, `unsubscribe_topic` | `components/Home/SettingsModal.tsx` `InitTopics`, `handleSubscribe`, `handleUnsubscribe` | `tests/components/Home/SettingsModal.test.tsx` |
| W-24 | E-mail / push / WhatsApp switches and the daily / weekly / monthly select save at once; a refused save puts the old value back | core `/firebase_device_tokens/update_*`, `update_notification_frequency` | `SettingsModal.tsx` `togglePreference`, `changeFrequency` → `services/home.ts` `EditNotificationSettings` | `SettingsModal.test.tsx` |
| W-25 | Avatar menu: "Notifications" opens the panel, "Compare" opens `/compare`, "Logout" for signed-in shoppers (sign-out is in file 10) | none | `components/Home/Menu.tsx` | `Menu.test.tsx` |
| W-26 | A guest who taps anything on Personal Info or Picture gets the sign-in overlay instead | none | `PersonalInfoForm.tsx` `handleFormClick`, `UploadProfilePhoto.tsx` `handleFormClick` | `PersonalInfoForm.test.tsx`, `UploadProfilePhoto.test.tsx` |

## ⚠️ Works, with limits
- **L-1 Name rule does not match sign-up.** The profile form needs a name of at least 8 characters (`PersonalInfoForm.tsx` lines 207–212). Sign-up accepts 1 character. A shopper called "Ali" cannot save any profile change (even e-mail) until the name is 8+ characters.
- **L-2 Size and Address have no guest check.** A guest can open them by URL. The save then goes to the backend with a guest token.
- **L-3 No "set as default" in the settings address list.** The call is commented out (`PersonalInfoAddress.tsx` line 172). The default address can only be picked at checkout.
- **L-4 Every profile save waits a fixed 1.5 s** before it returns (`services/auth.ts` line 887).
- **L-5 The wallet and comments copies of the profile are never updated.** The wallet `PATCH /users/me` is commented out (`services/auth.ts` line 703). Comments gets no call.
- **L-6 Topic names are raw backend ids.** "product_availability_123" shows as "product availability 123", not translated (`SettingsModal.tsx` `formatTopicName`).
- **L-7 Subscribe / unsubscribe can fail with no word.** Without a push token (`FB-DEVICE-TOKEN`), or when the backend refuses, nothing happens on screen; the error only goes to the log (`noMessage: true`).
- **L-8** Fixed 2026-10-20: the push switch now says "Enable Push Notifications" and no longer names the technology.
- **L-9 Country change can stop half way.** The cookie is written first. If the starter-settings call fails, the page stays, and no message is shown (`PersonalInfoCountries.tsx` lines 69–104).
- **L-10 Language list comes from the backend as it is.** A code other than en / ar / tr / ku shows an empty label. "Turkish" is shown in English, while Arabic and Kurdish show in their own script.
- **L-11 Camera refused → the camera layer closes with no message** (log only, `UploadProfilePhoto.tsx` lines 119–122).
- **L-12 Become-seller sends fixed or empty values.** The location check is commented out (`BecomeSellerModal.tsx` lines 759–762), so a seller who skips the map sends latitude 0 and longitude 0. Currency is always "USD" and language always "en" (lines 397–399). The stored document path is guessed from 6 possible reply fields, then from the upload address (lines 581–588).
- **L-13 Become-seller "approved" with no shop yet** still shows the "Become A Seller" button on the hub; the modal then shows "approved".
- **L-14 The route name is misspelled:** `/settings/prefferences`.
- **L-15 Stale comment:** `UploadProfilePhoto.tsx` line 149 says "TODO: Upload file to server", but the next line uploads.
- **L-16 Untranslated alt / aria text:** `aria-label="View Profile"`, `alt="login"`, `alt="qr"` (`components/setting/profile/index.tsx`), `alt="country"` on the language button (`settings/page.tsx` line 204).
- **L-17 "Contact Us" and "Compare" are commented out** of the settings list (`settings/page.tsx` lines 74–78, 84–88). The `/contact` page exists.
- **L-18 W-16 is not proven today.** Its e2e test SCRIPT-07 ("one backend refuses a save, and the shopper is told once") failed in the last scheduled E2E run on `main` (2026-10-16). Nobody has checked the cause yet. It can be the app or the test. Until a new run passes, treat W-16 as not confirmed.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | **Fixed 2026-10-20.** Preferences had a developer tab, "Notification Test", with 8 "Test" buttons that called `/firebase_device_tokens/send_*`. The tab, `NotificationsTest` and the 8 `TestNotification*` service functions are removed. | — | `components/Home/SettingsModal.tsx` | Frontend | No — closed |
| M-2 | **Fixed 2026-10-20.** "Legal Information" now opens `/[lang]/privacy-policy` and "About Us" opens `/[lang]/about`. | — | `app/(client)/[lang]/settings/page.tsx` | Frontend | No — Product still replaces the page text (file 18 M-1) |
| M-3 | "Share App" links to `#`. | Tap does nothing | `settings/page.tsx:92` | Product + Frontend | No — hide it or build sharing |
| M-4 | "Bank Cards" in the profile menu opens a page with only a back bar. | An empty page | `settings/profile/page.tsx:38-43`; `settings/profile/Bank-Cards/page.tsx:18-30` | Product + Frontend | Yes — hide the entry (1 line) or build it |
| M-5 | The "Sales" card shows "0 Action" for every seller. The number is hardcoded. | A wrong count | `components/settings/GoToSellerDashBoard.tsx:188` | Frontend + Backend (a count to show) | No |
| M-6 | The languages page crashes when the core `/languages` call fails or returns no list. The page has no error handling, and `LanguageSetting` calls `languages.map` on `undefined`. The unit test passes only because it mocks the child component. | Error page instead of the language list | `settings/languages/page.tsx:32-41`; `components/settings/LanguageSetting.tsx:249` | Frontend | No — but cheap to fix |
| M-7 | The QR icon on the profile card opens a scanner for the QR login mock. Covered in file 10, M-2. | "Approve" does nothing real | `components/setting/profile/index.tsx:73-86` | Frontend | Yes — same item as file 10 M-2 |

## 🔒 Must do before launch
- [x] "Notification Test" tab and `NotificationsTest` removed (M-1, done 2026-10-20). Proof: `SettingsModal.test.tsx` "never shows the developer Notification Test tab…", seen red first.
- [x] Point "Legal Information" to `/[lang]/privacy-policy` and "About Us" to `/[lang]/about`, after Product approves the page text (M-2). (done 2026-10-20)
- [ ] Hide "Bank Cards" from the profile menu, or build the page (M-4).
- [ ] Hide the QR scan icon on the profile card (M-7, file 10 M-2).

## ❓ Needs confirmation from the backend team
- Core: can any signed-in shopper call `/firebase_device_tokens/send_*` in production? Do these calls broadcast to every subscriber of the topic?
- Core `/shop/vendor-requests`: are latitude 0 / longitude 0 accepted? Must currency and language be chosen by the seller, or are "USD" and "en" correct?
- Core `/shop/uploads/presigned-url`: which reply field holds the stored path the request must carry?
- Core `/customer/update-profile`: what is the backend's real minimum name length? The form asks for 8.
- Comments and wallet: how do they learn a new name, photo or phone? The app does not send it to them today.
- Core `/languages`: will production return only en / ar / tr / ku?

## 🧪 Tests that cover this section
- **Unit — pages:** `tests/app/settings/pages.test.tsx` (hub, profile, bank cards, address, languages, template). The "copes with no language list" case mocks `LanguageSetting`, so it does not cover M-6.
- **Unit — components:** `tests/components/setting/profile/index.test.tsx`, `PersonalInfoForm.test.tsx`, `VerifyUser.test.tsx`; `tests/components/setting/BackBar.test.tsx`, `WalletLinkCard.test.tsx`, `orders/index.test.tsx`; `tests/components/settings/GoToSellerDashBoard.test.tsx`, `BecomeSellerModal.test.tsx`, `becomeSellerLimits.test.ts`, `ProfileSizeInfo.test.tsx`, `UploadProfilePhoto.test.tsx`, `PersonalInfoAddress.test.tsx`, `PersonalInfoAddressModal.test.tsx`, `PersonalInfoCountries.test.tsx`, `LanguageSetting.test.tsx`, `TopBar.test.tsx`; `tests/components/Home/SettingsModal.test.tsx` (also proves the test tab is gone), `Menu.test.tsx`.
- **Unit — services:** `tests/services/auth.profile.test.ts`, `tests/services/orderClass.test.ts` (address calls), `tests/services/home.test.ts` (notification settings).
- **E2E:** `tests/e2e/profile.live.spec.ts` PROF-01 to PROF-08; `profile.scripted.spec.ts` SCRIPT-07 to SCRIPT-12; `locale.live.spec.ts` GUEST-50, GUEST-51; `staticPages.live.spec.ts`; `sellerDashboard.live.spec.ts` SD-01.
- **Expected failures:** no `it.fails` / `test.fail` / `BUG-n` markers in this section. PROF-05 skips when the media store is not configured, so the photo flow can go unchecked in a run.
- **No test today:** the become-seller form submitted through the UI (e2e seeds the seller through `tests/e2e/harness/qaSeed.ts` instead); the notification settings tab against a real backend; the languages page with the real `LanguageSetting` and an empty list; the "Share App", "Legal Information", "About Us" and "Bank Cards" entries; the country change when starter settings fail.
