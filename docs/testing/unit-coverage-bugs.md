# Bugs found while raising unit-test line coverage

Every bug below was confirmed by reading the application code. Each one has a
unit test that expects the **correct** behaviour. The test carries the strict
expected-failure marker `it.fails("BUG-<group>-<n>: ...")`, so the suite stays
green while the bug is still there. A bug marked **fixed** in the index
is fixed in the app code, and its test is now a normal passing test.

When you fix a bug, remove `.fails` from its test. Vitest then fails the
`it.fails` test the moment the bug is gone, so a fix cannot land without
turning the test into a normal passing test.

Each group section also lists:

- **Dead code — not tested**: code with no caller in the repo (grep proof given).
  It is not tested on purpose, so it stays uncovered until it is deleted.
- **Cannot cover**: lines no input can reach, with the reason.

## Unreachable lines removed

These lines were deleted from the application code. For each one, the code
itself proves that no input reaches it, so the behaviour does not change.
`tsc` is clean, and the 38 test files that import these modules pass.

- `app/api/home/boutiques/route.ts`: the 400 "Missing required headers" answer.
  `country` and `language` always get a default value with `||`.
- `components/Cart/AddToCart/ExtraInfoArea.tsx`: the final `return <></>`.
  Every branch before it returns.
- `components/Cart/PlaceOrderButtons.tsx`: the `if (orderData.success)` reset
  in the Place Order click. The button renders only while `success` is false.
- `components/products/ShareOptions.tsx`: the second `!response.success` throw.
  The same check already threw a few lines earlier.
- `components/Chat/components/NewChatsSide.tsx`: the `username` fallback in
  `getTwoLetters(name || username)`. The branch runs only when `name` is set.
- `components/Chat/pages/ConversationContainer.tsx`: the `try/catch` in
  `handleImagePreviewSend`. Nothing inside the `try` can throw.
- `components/Home/Stories/StoryViewer.tsx`: the "open pause" block in the
  `[index]` effect. The effect cleanup already closed the pause.
- `components/setting/orders/OrderDetailsWrapper.tsx`: the "Failed To Load
  Return Details Try again" branch. `already_return` is true only when
  `returnDetails` is loaded.
- `components/setting/orders/OrderItemOptions.tsx`: the
  `selectedScreen === "cancel"` branch. Nothing sets that screen.
- `services/elastic/helpers.ts`: the dead `return` after `return 1` in
  `calculateFuzziness`, and both `return null` lines in `buildAtLeastTwoClause`.
  The only caller passes 3 or more non-blank words.
- `services/elastic/sitemap.service.ts`: the blank-slug `continue` and the
  unsupported-country reset. The data source already does both checks.
- `store/chat/reducer.ts`: the `watchForSender && type === "receive"` branch.
  No caller passes that pair.
- `utils/fieldErrors.ts`: the non-object `return null`. Text that starts with
  `{` and parses is always an object.

Lines still listed under "Cannot cover" were kept on purpose:

- **Guards that only the UI protects** (a disabled button, a hidden button, a
  conditional render). The handler must not trust the UI. Many guards also
  narrow a type for TypeScript.
- **Lines that are tied to an open bug** (BUG-chat-5, BUG-seller-100,
  BUG-settings-3). Fixing the bug makes the line reachable again.
- **Lines behind a switched-off feature or a placeholder** (the wallet
  rollback, `canDelete = false`, the recommended products, `getVideoUrl`).
- **Lines that only the test runner cannot reach** (bare `require`, React
  StrictMode, timer ordering).
- `utils/errorSerialization.ts:95` (`return String(v)`) **is reachable**, so it
  was kept. The note below is wrong: `document.all` has `typeof` "undefined"
  but is not `=== undefined`, so it reaches this line in a browser.

## Index

| Bug | Source | Summary |
|---|---|---|
| BUG-app-1 (**fixed**) | app | a malformed escape switches off the proxy's decoded host guard |
| BUG-app-2 (**fixed**) | app | the media ticket route reports a failure as a failed topic subscription |
| BUG-app-3 (**fixed**) | app | a product metadata failure is reported against the /featured page |
| BUG-app-4 (**fixed**) | app | the 404 page shows English text to Arabic shoppers in the served regions |
| BUG-cart-101 (**fixed**) | cart | single-colour product crashes the add-to-cart sheet when the loaded answer has no colours |
| BUG-cart-201 (**fixed**) | cart | add-to-cart bag summary counts the whole bag, not this product |
| BUG-cart-401 (**fixed**) | cart | OrderSuccess scroll timer throws after the screen is gone |
| BUG-cart-501 (**fixed**) | cart | an empty payment method list prints a stray "0" |
| BUG-cart-402 (**fixed**) | cart | the place-order screen hides a size stored as variations.size_options |
| BUG-chat-1 (**fixed**) | chat | the call log load uses the wrong loading flag |
| BUG-chat-2 (**fixed**) | chat | a one-letter name shows "Aundefined" in the avatar |
| BUG-chat-3 (**fixed**) | chat | an old chat date is never written in Arabic for an Arabic reader |
| BUG-chat-4 (**fixed**) | chat | a run of messages at the very top of a chat has no first bubble |
| BUG-chat-5 (**fixed**) | chat | an unanswered voice or video call never ends by itself |
| BUG-chat-6 (**fixed**) | chat | a contact the chat backend refused is shown as saved |
| BUG-chat-7 (**fixed**) | chat | a failed contact save or sync error is never shown |
| BUG-chat-8 | chat | the chat invite links to a placeholder Play Store id — **blocked**: needs the real Play Store app id |
| BUG-chat-9 | chat | the "Edit message" save button does nothing — **blocked**: the repo has no edit-message endpoint, service or store action; the backend must provide one |
| BUG-chat-10 (**fixed**) | chat | clearing the text closes the edit box |
| BUG-chat-11 (**fixed**) | chat | tapping a shared product never opens its menu |
| BUG-chat-12 (**fixed**) | chat | a quoted file shows no avatar for its author |
| BUG-chat-13 (**fixed**) | chat | a quoted photo loses its bubble classes |
| BUG-chat-14 (**fixed**) | chat | a deleted message from the other person shows my avatar |
| BUG-data-1 (**fixed**) | data | the search log never finds a duplicate when only one identity is known |
| BUG-data-2 (**fixed**) | data | the default of 5 for MIN_CATEGORIES_UNDER_BOUTIQUE never applies |
| BUG-data-3 (**fixed**) | data | the 120-second default in RedisSet never applies |
| BUG-data-4 (**fixed**) | data | a thrown currency read loses its own error report |
| BUG-global-100 (**fixed**) | global | compare page drops a product whose `sync_color_images` is an empty list |
| BUG-global-1 (**fixed**) | global | SlideWidget drops a step change that arrives during a slide |
| BUG-global-2 (**fixed**) | global | SlideWidget slides in the OLD step, the new step pops in after |
| BUG-global-4 (**fixed**) | global | a notification with JSON details but no `type` opens the cart |
| BUG-global-3 (**fixed**) | global | closing the notifications panel does not put the page back where it was |
| BUG-home-1 (**fixed**) | home | a failed PostHog start is never logged |
| BUG-home-2 (**fixed**) | home | a nameless category chip shows the wrong sub-category name |
| BUG-home-3 (**fixed**) | home | removing a word in the open search-history list leaves it on screen |
| BUG-home-4 (**fixed**) | home | "Clear All" in search history leaves every word on screen |
| BUG-home-5 (**fixed**) | home | stopping a story video recording calls `window.stop()` |
| BUG-home-6 (**fixed**) | home | after a pause, a story waits its full time again |
| BUG-home-7 (**fixed**) | home | "Load More" in search sends filter objects instead of slugs |
| BUG-home-8 (**fixed**) | home | a related category that is already applied is still offered |
| BUG-products-1 (**fixed**) | products | camera refusal asks for notification permission |
| BUG-products-2 (**fixed**) | products | Escape closes the try-on modal while it is processing |
| BUG-products-3 | products | the delivery note on "change address" is never sent — **blocked**: the change-address request has no note field; the backend key is unknown |
| BUG-products-4 (**fixed**) | products | Enter in an empty comment box posts an empty question |
| BUG-products-5 (**fixed**) | products | a pasted question over 200 characters is posted in full |
| BUG-products-6 (**fixed**) | products | closing the full-size product video leaves the page unscrollable |
| BUG-seller-400 (**fixed**) | seller | wrong fallback error message in six seller-dashboard service methods |
| BUG-seller-100 | seller | a filled purchase price is never validated — **blocked**: needs a product decision: is the purchase price required? |
| BUG-server-1 (**fixed**) | server | recommendations "Show More" spins forever after one failed load |
| BUG-server-2 (**fixed**) | server | the listing grid keeps retrying a failed load after it has left the page |
| BUG-server-3 (**fixed**) | server | the filter window drops the re-ask for a chip tapped while a re-ask is running |
| BUG-server-30 (**fixed**) | server | a comment heart crashes when the comment has no like count |
| BUG-server-50 (**fixed**) | server | the product footer price row never shows the currency symbol |
| BUG-server-31 (**fixed**) | server | the related-products row keeps retrying a failed load after it has left the page |
| BUG-settings-1 (**fixed**) | settings | delivery chat for a second pack's return does not open from the link |
| BUG-settings-2 (**fixed**) | settings | the wallet balance is reset to 0 when the transactions page arrives |
| BUG-settings-3 (**fixed**) | settings | the size change never refuses a size that is out of stock |
| BUG-settings-4 (**fixed**) | settings | the close (X) of the settings re-verify flow does not close it |
| BUG-utils-1 (**fixed**) | utils | total_rating is NaN for a product with no final_rating |
| BUG-utils-2 (**fixed**) | utils | formatTime prints "NaN/NaN/NaN" for a timestamp with a +hh:mm offset |
| BUG-utils-3 (**fixed**) | utils | UpdateProfile market rollback writes the NEW name into the app state |
| BUG-utils-4 (**fixed**) | utils | GA reports every user without a "Man" gender as female |
| BUG-utils-5 (**fixed**) | utils | any new non-chat toast removes every other non-chat toast |

---

## Group: app

### Coverage bugs — group app

### Bugs

### BUG-app-1 — a malformed escape switches off the proxy's decoded host guard
- **Where:** `app/api/proxy/route.ts` lines 31-45 (`fullyDecode`) and 236-242 (the `escapesHost(decodedTarget)` check).
- **Scenario:** `POST /api/proxy` with `x-proxy-url: /%2F%2Fevil.tld/%E0%A4%A` (market service).
- **What the code does wrong:** `fullyDecode()` returns the raw string as soon as `decodeURIComponent` throws. One malformed escape anywhere in the target (`%E0%A4%A`) makes the whole decode fail, so `decodedTarget` still reads `/%2F%2F...` and `escapesHost()` does not see the `//`. The comment says this "keeps the guards failing closed", but it opens them: the same target without the bad escape (`/%2F%2Fevil.tld/x`) is refused with 400 (existing AC-32 test "escaped once").
- **Expected:** 400 "Invalid target URL", no backend call.
- **Actual:** the call is forwarded to the market backend with the shopper's Bearer token (200).
- **Confirming test:** `tests/app/api/proxy/route.test.ts` > "targets that are hard to decode" > `BUG-app-1: a malformed escape switches off the decoded host guard` (`it.fails`, seen as an expected failure).

### BUG-app-2 — the media ticket route reports a failure as a failed topic subscription
- **Where:** `app/api/ticket/route.ts` line 37 (the catch block).
- **Scenario:** `POST /api/ticket` with a credential, and the call to the media server throws an error with no message.
- **What the code does wrong:** the fallback text was copied from `app/api/subscribe/route.ts`. It says "Failed to subscribe to topic", but this route asks for a media ticket. The other two failure answers in the same file say "Failed to get ticket".
- **Expected:** `{ success: false, message: "Failed to get ticket" }`.
- **Actual:** `{ success: false, message: "Failed to subscribe to topic" }`.
- **Confirming test:** `tests/app/api/ticket/route.test.ts` > `BUG-app-2: a failure with no message names the ticket, not a topic subscription` (`it.fails`, seen as an expected failure).

### BUG-app-3 — a product metadata failure is reported against the /featured page
- **Where:** `app/(client)/[lang]/products/[productId]/page.tsx` line 54 (the second argument of `LogServerError` in `generateMetadata`).
- **Scenario:** open a product page while the product metadata read answers `{ error: ... }` or nothing.
- **What the code does wrong:** the report is filed under `/${country}-${language}/featured`, copied from the listing pages. Sentry and the error log then show a product failure as a failure of the featured listing, so the report points to the wrong page.
- **Expected:** the page argument names the product route, e.g. `/sy-en/products/shoe`.
- **Actual:** `/sy-en/featured`.
- **Confirming test:** `tests/app/products/page.test.tsx` > `BUG-app-3: a product metadata failure is reported against the product route` (`it.fails`, seen as an expected failure).

### BUG-app-4 — the 404 page shows English text to Arabic shoppers in the served regions
- **Where:** `app/(client)/[lang]/not-found.tsx` lines 26-59 (the `content` table) and line 61 (`content[lang] || content["gb-en"]`).
- **Scenario:** an Arabic shopper in Syria opens a missing page, `/sy-ar/does-not-exist`.
- **What the code does wrong:** the Arabic copy is keyed only on `sa-ar` and `ae-ar`. The regions the app serves are `sy`, `iq`, `lb`, `tr`, `gb` (the sitemap list in `app/(client)/[lang]/sitemap.xml/route.ts` line 28; Syria is the only cash-on-delivery country). So `sy-ar` falls back to the English title, text and button, while `isArabic` (line 12) is true and the "popular links" below are Arabic. The page mixes two languages. The English strings are also not passed through `translateFunction`.
- **Expected:** the 404 title for `sy-ar` is "عذراً! الصفحة غير موجودة".
- **Actual:** "Oops! Page Not Found", next to Arabic links.
- **Confirming test:** `tests/app/not-found.test.tsx` > `BUG-app-4: an Arabic shopper in a served region gets the Arabic 404 title` (`it.fails`, seen as an expected failure).

### Dead code — not tested

### Cannot cover

- `app/api/related-products/[id]/route.ts` lines 33 and 43: `decodeValue` / `parseNumberArray` return early for an empty value, but the only caller (line 71-72) calls them only when `?offset=` is non-empty, and decoding a non-empty string never gives an empty one. The same unreachable early returns exist in the copied helpers of `app/api/products/featured/route.ts` (lines 101, 111, 121, 131, 141), `app/api/products/recomended/route.tsx` (105, 115, 125, 135, 145) and `app/api/products/searchInCatalog/route.ts` (140, 150, 160, 170, 180): every helper is called only when the query value is non-empty. Each `return` sits on the same line as its `if`, so the line percentage shows 100%, but the returns never run.

- `app/api/home/boutiques/route.ts` lines 20-26 (the 400 "Missing required headers" answer): `country` falls back to `"sy"` and `language` to `"en"` with `||` on lines 8-9, so `!country || !language` is never true. No request can reach the line.
- `app/simulateUser/page.tsx` line 27 (`value === undefined`) and line 34 (the `JSON.stringify` catch): the values come from `JSON.parse`, which never gives `undefined`, a circular object or a BigInt, so neither line can run.
- `app/simulateUser/page.tsx` lines 65-66 ("Paste error JSON first."): the only caller is the button, and the button is `disabled` whenever `raw.trim()` is empty (line 130). React does not fire a click on a disabled button, so the empty case never reaches `handleParse`.

---

## Group: cart


### BUG-cart-101 — single-colour product crashes the add-to-cart sheet when the loaded answer has no colours
- Source: components/Cart/AddToCart/AddToCartComponent.tsx:333-346 (crash surfaces at :750-755)
- Scenario: a product with `singleColor: true` and its own `sync_color_images` opens the sheet; `getProductDataForAddToCart` answers without `sync_color_images`.
- Expected: the sheet shows the product's own colours.
- Actual: the code searches the fallback list for `data.sync_color_images[0].color_name` (undefined), finds nothing, and puts `undefined` first in the list. The colour filter then reads `undefined.color_option` and the sheet throws `TypeError: Cannot read properties of undefined (reading 'color_option')`.
- Confirming test: tests/components/Cart/AddToCart/AddToCartComponent.test.tsx > "BUG-cart-101: a single-colour product whose loaded answer has no colours crashes the sheet instead of showing its own colours" (it.fails, recorded as expected failure).

### Dead code — not tested (AddToCart/Button.tsx)
- components/Cart/AddToCart/Button.tsx:153-164 `getLocalCartItem` — defined inside `AddToCartButton` and never called. Proof: `grep -rn "getLocalCartItem" --include=*.ts --include=*.tsx . | grep -v node_modules` finds only its definition in Button.tsx:153 and a separate, own copy in NotifyButton.tsx:32/36. Lines 154-163 stay uncovered.

### BUG-cart-201 — add-to-cart bag summary counts the whole bag, not this product
- Source: components/Cart/AddToCart/CartContentOfProduct.tsx lines 58 and 103 (`localCart.filter((s) => s.id === product?.product_id || product?.id)`).
- What is wrong: operator precedence. The filter reads `(s.id === product.product_id) || product.id`, and `product.id` is truthy, so EVERY bag row passes. The row list (line 79) uses the correct `(product?.product_id ?? product?.id)`.
- Scenario: the bag holds 1 row of product 1 (2 × 10) and 1 row of product 2 (5 × 100). Open the add-to-cart sheet of product 1.
- Expected: header "Added 1 Item 20 $ To Your Bag".
- Actual: header "Added 2 Item 520 $ To Your Bag".
- Confirming test: tests/components/Cart/AddToCart/CartContentOfProduct.test.tsx > "BUG-cart-201: the header counts and prices only this product's rows, not the whole bag" (it.fails; seen failing with "Added2Item 520 $To Your Bag").

### Cannot cover (fork B)
- components/Cart/AddToCart/ExtraInfoArea.tsx:201 — `return <></>;` after an if / else-if / else chain where every branch returns. The line can never run.

### BUG-cart-401 — OrderSuccess scroll timer throws after the screen is gone
- Source: components/Cart/OrderSuccess.tsx:24-26
- Scenario: the order succeeds, OrderSuccess mounts, and it unmounts within 200 ms (the cart closes or the page moves on).
- Expected: nothing happens; the timer is cleared on unmount or the missing element is skipped.
- Actual: the setTimeout is never cleared and `document.querySelector(".order-sucess")` returns null, so `.scrollIntoView()` throws `TypeError: Cannot read properties of null (reading 'scrollIntoView')` as an uncaught error.
- Confirming test: tests/components/Cart/OrderSuccess.test.tsx > "BUG-cart-401: closing the success screen within 200 ms makes its scroll timer throw" (it.fails; seen red for this TypeError without the marker).

### Cannot cover — components/Cart/RdbPaymentModal.tsx
- Line 129 (`if (stoppedRef.current) return;` at the start of the poll timer callback): only one poll timer exists at a time, and every path that sets `stoppedRef` (settle, cancel ok, unmount cleanup) also clears that timer. A timer that already fired is caught by line 131 instead. So the callback never starts while stopped.
- Line 171 (`if (startedRef.current) return;`): needs the start effect to run twice on one instance. That only happens under React StrictMode's double effect, and next.config.ts sets `reactStrictMode: false`. A test that wraps the modal in <React.StrictMode> under Vitest still ran the effect once, so the line stays unreached.


### BUG-cart-501 - an empty payment method list prints a stray "0"
- Source: components/Cart/PaymentMethod.tsx:268-270
- Scenario: the core backend sends `available_payment_method: []` (no method offered).
- Code: `available_payment_method && available_payment_method.length && available_payment_method.map(...)`. With an empty list, `.length` is 0, so the expression gives the number 0, and React prints it.
- Expected: the payment box shows no method rows and no stray text.
- Actual: the payment box shows a bare "0" under the title.
- Confirming test: tests/components/Cart/PaymentMethod.test.tsx > "BUG-cart-501: an empty payment method list prints a stray 0 in the payment box" (it.fails; seen red as a plain `it` with the AssertionError, recorded as expected failure).

### Cannot cover (PlaceOrderButtons)
- components/Cart/PlaceOrderButtons.tsx:238-250 - the `if (orderData.success) { reset; close(); return; }` branch inside the Place Order button's onClick. The button renders only inside `{!orderData.success && (...)}` (line 234), so when the click runs, `orderData.success` is always false. The branch can never run. It is unreachable code, not a jsdom limit.

### BUG-cart-402 — the place-order screen hides a size stored as variations.size_options
- Source: components/Cart/PlaceOrderWidget.tsx:97
- Scenario: a bag or order item has `variations: { size_options: "XL" }` and no `variations.Size`.
- Expected: the size "XL" shows under the item image, as it does for `variations.Size` (and as the colour line does for `variations.color_options`).
- Actual: the condition reads `s?.variation?.size_options` (singular `variation`, a typo), so it is false and an empty placeholder is drawn instead of the size. The line inside (99) and the colour check (104) both read `variations`.
- Confirming test: tests/components/Cart/PlaceOrderWidget.test.tsx > "BUG-cart-402: an item whose size is stored as variations.size_options shows no size" (it.fails; seen red without the marker: expected null not to be null).

---

## Group: chat

### Coverage bugs — GROUP=chat

### Bugs

### BUG-chat-1 — the call log load uses the wrong loading flag
- Source: `services/chat.ts:264-284` (`getCalls`).
- What the code does wrong: `getCalls` calls `setCallLoading(true/false)`. In `store/chat/reducer.ts:304` that action writes `callLoading`, which is the "placing a call" flag (`makeVideoCall` sets it to `"video"`, `makeVoiceCall` to `"voice"`; `ChatHeader`, `ChatInfo` and `ConversationContainer` read it to block the call buttons). The call-log flag that `components/Chat/pages/CallList.jsx:89,94,114` reads is `call_loading`, set by `setCallLoadingState` — and nothing in the app ever calls `setCallLoadingState`.
- Scenario: open the Calls tab (or scroll it) while a video call is being placed.
- Expected: `call_loading` is `true` while the page loads (CallList shows its loader and its in-view guard stops a second page request); `callLoading` keeps `"video"`.
- Actual: `call_loading` stays `false` for the whole load, and when the page arrives `callLoading` is reset to `false`, which re-enables the call buttons during a call that is still being placed.
- Confirming test: `tests/services/chat.test.ts` → "BUG-chat-1: loading the call log raises the call-log flag, not the 'placing a call' flag" (`it.fails`; seen failing with "CallList's loading flag (call_loading) was not raised while the call log loaded: expected false to be true").

### BUG-chat-2 — a one-letter name shows "Aundefined" in the avatar
- Source: `components/Chat/chatsFunctions.tsx:188` (`getTwoLetters`).
- What the code does wrong: for a name with no space it returns `name[0] + name[1]`. When the name has one character, `name[1]` is `undefined`, and the string join gives `"Aundefined"`.
- Scenario: a chat contact whose name is one letter, for example "A". Ten components use `getTwoLetters` for the text avatar (ChatItem, ChatInfo, ChatPhoto, NewChatsSide, SearchResult, the call screens, NotificationsContainer).
- Expected: `"A"`.
- Actual: `"Aundefined"`.
- Confirming test: `tests/components/Chat/chatUploadSizeCap.test.ts` → "BUG-chat-2: a one-letter name gives one initial, not 'Aundefined'" (`it.fails`; seen failing with "expected 'Aundefined' to be 'A'").

### BUG-chat-3 — an old chat date is never written in Arabic for an Arabic reader
- Source: `components/Chat/chatsFunctions.tsx:703` (`showDate`).
- What the code does wrong: the last branch returns `language === "ar" ? d.toLocaleString("ar-EG") : d`. At that point `d` is already a `"YYYY-MM-DD"` **string** (line 681). `String.prototype.toLocaleString` ignores the locale argument and returns the same string, so the Arabic branch does nothing.
- Scenario: language `ar`, a chat or call whose last date is more than 6 days ago.
- Expected: the date formatted for `ar-EG` (Arabic digits), as the branch intends.
- Actual: `"2029-12-01"`, the same as English.
- Confirming test: `tests/components/Chat/chatUploadSizeCap.test.ts` → "BUG-chat-3: an old date is written with Arabic digits for an Arabic reader" (`it.fails`; seen failing with "expected '2029-12-01' not to be '2029-12-01'").

### BUG-chat-4 — a run of messages at the very top of a chat has no first bubble
- Source: `components/Chat/pages/ConversationContainer.tsx:604-609` (`showRoute`).
- What the code does wrong: the `!prev && mes.sender_user_id === next.sender_user_id` branch exists for the first message in the list. Inside it, the code sets `"first-chat"` only when `showDate(mes.created_at) === showDate(prev?.created_at)`. `prev` is `undefined` in this branch, so `showDate(undefined)` is an invalid-date string and the two never match. The first message always stays `"lonely"`.
- Scenario: a chat whose oldest loaded messages are two or more from the same sender on the same day.
- Expected: bubble types `first-chat`, `middle-chat`, `last-chat`.
- Actual: `lonely`, `middle-chat`, `last-chat` — the group starts with a middle bubble.
- Confirming test: `tests/components/Chat/pages/ConversationContainer.test.tsx` → "BUG-chat-4: a run at the very top of the chat starts with a first bubble" (`it.fails`; seen failing with "the top run started with a middle bubble and no first bubble").

### BUG-chat-5 — an unanswered voice or video call never ends by itself
- Source: `components/Chat/components/ChatVideoCall.tsx:278-280` and `components/Chat/components/ChatVoiceCall.tsx:240-242`.
- What the code does wrong: the "no answer" rule is `if (seconds === 60 && users.length === 0) userEndCall(true)`. Two things stop it from ever running:
  1. `seconds` comes from `useStopwatch` (react-timer-hook). It counts 0 to 59 and then rolls into `minutes`, so it is never `60`.
  2. The stopwatch is created with `autoStart: false` and only starts on `user-joined` / `user-published`. While nobody has answered (`users.length === 0`) the clock does not move at all.
- Scenario: start a video or voice call; the other person never answers.
- Expected: the call ends by itself after 60 seconds, as the code intends.
- Actual: the call keeps ringing. Only the 10-minute rule (`minutes === CALL_END_DURATION_MINUTES`) could end it, and that clock is not running either, so it rings until the caller presses End.
- Confirming tests (`it.fails`, real stopwatch, 65 s of fake time):
  - `tests/components/Chat/components/ChatVideoCall.test.tsx` → "BUG-chat-5: a video call nobody answers ends by itself after 60 seconds" (seen failing: "an unanswered call was still ringing after 65 seconds").
  - `tests/components/Chat/components/ChatVoiceCall.test.tsx` → "BUG-chat-5: a voice call nobody answers ends by itself after 60 seconds".

### BUG-chat-6 — a contact the chat backend refused is shown as saved
- Source: `components/Chat/components/ChatContactsUpload.tsx:88-103` (`handleAddContact`).
- What the code does wrong: the answer of `fetchData` for `/api/v1/users/save_contact_v2` is never read. `fetchData` returns `{ success: false, message }` on a refusal (it does not throw), so the code goes on to `getContacts()`, clears the form and closes it — the same as a real save. (The sync path in the same file, `uploadToServer`, does check `res.success`.)
- Scenario: add a contact by hand; the chat backend refuses it.
- Expected: the form stays open (and the shopper is told).
- Actual: the form closes and resets as if the contact was saved; nothing is shown.
- Confirming test: `tests/components/Chat/components/ChatContactsUpload.test.tsx` → "BUG-chat-6: a contact the chat backend refused is not treated as saved" (`it.fails`; seen failing: "the form closed as if the refused contact was saved").

### BUG-chat-7 — a failed contact save or sync error is never shown
- Source: `components/Chat/components/ChatContactsUpload.tsx:59, 111, 168`.
- What the code does wrong: the `catch` blocks write `setError("Failed to add contact")` / `setError(...)`, but the `error` state is never rendered anywhere in the JSX. The add-contact path calls no toast either (only `LogError`). The text is also a hard-coded English string, not a translation key.
- Scenario: add a contact by hand; the request throws (network down).
- Expected: the shopper sees that the contact was not added.
- Actual: nothing is shown; the form just stops loading.
- Confirming test: `tests/components/Chat/components/ChatContactsUpload.test.tsx` → "BUG-chat-7: a failed contact save tells the shopper" (`it.fails`; seen failing: "a failed save showed nothing to the shopper").

### BUG-chat-8 — the chat invite links to a placeholder Play Store id
- Source: `components/Chat/components/SearchResult.tsx:60, 79, 91, 101` (`handleInviteClick`, `handleCopy`, `handleWhatsApp`, `handleTelegram`).
- What the code does wrong: every invite text ends with `https://play.google.com/store/apps/details?id=your.app.id`. `your.app.id` is a template placeholder, not the app's package id. (The invite sentence is also a hard-coded English string, not a translation key.)
- Scenario: search a contact who is not on the app, press Invite, and send it by share sheet, WhatsApp, Telegram or Copy.
- Expected: the link opens the real app page.
- Actual: the link opens a Play Store page for an app that does not exist.
- Confirming test: `tests/components/Chat/components/SearchResult.test.tsx` → "BUG-chat-8: the invite links to the real app, not a placeholder store id" (`it.fails`; seen failing: "the invite still points at the Play Store placeholder id 'your.app.id'").

### BUG-chat-9 — the "Edit message" save button does nothing
- Source: `components/Chat/components/OptionsMenu.tsx:181-201`.
- What the code does wrong: the save button in the edit box has `onClick={() => {}}`. No request is sent, no callback is called, and the box stays open. The button label is also the typo key `"Edt"`.
- Scenario: open the menu on my own text message, press Edit, change the text, press the save button.
- Expected: the edit is saved (or at least the box closes and something happens).
- Actual: nothing happens; the box stays open and the change is lost when it is cancelled.
- Confirming test: `tests/components/Chat/components/OptionsMenu.test.tsx` → "BUG-chat-9: saving an edited message does something" (`it.fails`; seen failing: "the edit box's save button did nothing").

### BUG-chat-10 — clearing the text closes the edit box
- Source: `components/Chat/components/OptionsMenu.tsx:121` (`if (isSender && edit)`).
- What the code does wrong: `edit` holds the text being edited. When the shopper deletes all the text, `edit` becomes `""`, which is falsy, so the component falls through to the normal menu and the edit box disappears. The disabled-save check for an empty text (`edit?.length === 0`, line 186/192) can never be seen for the same reason.
- Scenario: press Edit on my own text message and delete all the text to type a new one.
- Expected: the box stays open and empty, with save disabled.
- Actual: the box closes as soon as the last character is deleted.
- Confirming test: `tests/components/Chat/components/OptionsMenu.test.tsx` → "BUG-chat-10: clearing the text keeps the edit box open" (`it.fails`; seen failing: "deleting all the text closed the edit box instead of leaving it empty").

### BUG-chat-11 — tapping a shared product never opens its menu
- Source: `components/Chat/components/messages/Types/ProductMessage.tsx:63` (`onClick={() => setOpen(true)}`), read by `components/Chat/components/ChatMessage.tsx:311` (`openMenu={opens === id}`).
- What the code does wrong: ChatMessage treats the menu as open only when `opens === id`. Every other bubble type calls `setOpen(id)`; ProductMessage calls `setOpen(true)`. `true === 5` is false, so `openMenu` stays false and the bubble never gets the `ac` (menu open) class.
- Scenario: on a touch screen, tap a product shared in the chat to reply, forward, copy or delete it.
- Expected: the menu opens (`.message-hold` gets `ac`), like on every other bubble.
- Actual: nothing opens; on a touch device the product's options cannot be reached.
- Confirming test: `tests/components/Chat/components/messages/Types/ProductMessage.test.tsx` → "BUG-chat-11: tapping a shared product opens its menu" (`it.fails`; seen failing: "expected 'message-hold false' to contain 'ac'").

### BUG-chat-12 — a quoted file shows no avatar for its author
- Source: `components/Chat/components/messages/RepliedMessage/index.tsx:88` (`channel_member={channel_member}` for `RepliedFileMessage`).
- What the code does wrong: every other quoted body gets `channel_member?.user` (the user record with `name` / `photo_path`). The file body gets the whole member record (`{ user_id, user }`). `ChatPhoto` reads `user.photo_path` and `user.name`, which a member record does not have, so the avatar is blank.
- Scenario: reply to a file message; look at the quote above the reply.
- Expected: the quote avatar shows the file sender's photo or initials.
- Actual: the avatar gets `{ user_id, user }` and shows nothing useful.
- Confirming test: `tests/components/Chat/components/messages/RepliedMessage/index.test.tsx` → "BUG-chat-12: a quoted file shows its author's avatar" (`it.fails`; seen failing: "the quoted file's avatar was given the member record instead of the user").

### BUG-chat-13 — a quoted photo loses its bubble classes
- Source: `components/Chat/components/messages/RepliedMessage/RepliedImageMessage.tsx:21` (`"message-body text-body" + "first-chat"`).
- What the code does wrong: the space between the two class names is missing, so the element gets one class `text-bodyfirst-chat` instead of `text-body` and `first-chat`. The video and voice bodies next to it have the space.
- Scenario: reply to a photo message; look at the quote.
- Expected: the quote bubble has `text-body` and `first-chat` like the other quoted types.
- Actual: `className` is `"message-body text-bodyfirst-chat"`, so both styles are lost.
- Confirming test: `tests/components/Chat/components/messages/RepliedMessage/index.test.tsx` → "BUG-chat-13: a quoted photo keeps its bubble classes" (`it.fails`; seen failing with `"message-body text-bodyfirst-chat"`).

### BUG-chat-14 — a deleted message from the other person shows my avatar
- Source: `components/Chat/components/messages/DeletedMessage.tsx:21-23`.
- What the code does wrong: the avatar user is picked with `String(user.user_id) === String(getUserChat()?.id)` — always the signed-in user. `ChatMessage` passes DeletedMessage only `type` and `activeChat`, not the sender, so it cannot tell whose message it was. Every other bubble picks "me" for my messages and "the other member" for theirs.
- Scenario: the other person deletes a message they sent; it is the first bubble of their run.
- Expected: the deleted bubble shows the other person's avatar.
- Actual: it shows my own avatar on their side of the chat.
- Confirming test: `tests/components/Chat/components/messages/DeletedMessage.test.tsx` → "BUG-chat-14: a deleted message from the other person shows their avatar" (`it.fails`; seen failing: "expected 'Me' to be 'Them'").

### Dead code — not tested

- `components/Chat/components/ChatMessage.tsx:16-23` `getSafeId` — declared but never called, in this file or anywhere else. Proof: `grep -rn "getSafeId" --include=*.ts --include=*.tsx --include=*.js --include=*.jsx --exclude-dir=node_modules --exclude-dir=.next . | grep -v "^./tests"` → only `components/Chat/components/ChatMessage.tsx:16:const getSafeId = (id) => {`.

### Cannot cover

- `store/chat/reducer.ts:217-218` — the `watchForSender === true && type === "receive"` branch of `processMessageStatuses`. Only two callers pass `watchForSender = true`/`false`: `watchChannel` (line 695) always passes `"watch", true`, and `receiveChannelEvent` (line 724) always passes `"receive", false`. No call site passes `"receive", true`, so these two lines can never run. Proof: `grep -n "processMessageStatuses(" store/chat/reducer.ts` → lines 663 (watch,false), 695 (watch,true), 724 (receive,false).
- `components/Chat/pages/ConversationContainer.tsx:674-686` — the `catch` in `handleImagePreviewSend`. The `try` only calls `handleMediaMessage(...)` without `await`, and three state setters. `handleMediaMessage` is `async` and catches all its own errors, so it returns a promise and never throws synchronously; the setters do not throw. Nothing in the `try` can throw, so the `catch` never runs.
- `components/Chat/components/ChatVideoCall.tsx:279` and `components/Chat/components/ChatVoiceCall.tsx:241` — `userEndCall(true)` inside `if (seconds === 60 && users.length === 0)`. `useStopwatch` never reports `seconds === 60` (it rolls over at 59), and the clock does not run while `users` is empty. The line cannot run. This is BUG-chat-5.
- `components/Chat/components/ChatHeader.tsx:98-101` — the order-chat payload inside `videoCallFunction`. It needs `isPrivate` to be set, but the video-call button is rendered only when `!isPrivate` (line 204), so `videoCallFunction` never runs in an order chat.
- `components/Chat/components/NewChatsSide.tsx:79` — the `username` fallback inside `getTwoLetters(name || username)`. That branch is entered only when `name` is truthy (line 68-70), so `name || username` always takes `name`.

---

## Group: data

### Coverage findings — group `data`

(services/elastic/, serverRequests/, services/home.ts)

### Bugs

### BUG-data-1 — the search log never finds a duplicate when only one identity is known
- **Where:** `services/elastic/helpers.ts:2943-2946` (`logSearchTerm`).
- **Scenario:** a shopper searches. The request has only one identity: an address (`x-real-ip`) and no user id and no user agent. `should` then holds 1 clause.
- **What the code does wrong:** it always sets `minimum_should_match: 2`. With only 1 `should` clause, Elasticsearch can never match 2, so the duplicate check finds nothing. Every search from that shopper is written to the log again.
- **Expected:** `minimum_should_match` is never more than the number of `should` clauses (for example `Math.min(2, should.length)`).
- **Actual:** `minimum_should_match` is 2 with 1 clause.
- **Confirming test:** `tests/services/elastic/helpers.test.ts` > "writing a search to the search log (logSearchTerm)" > `BUG-data-1: a search with only one identity (just the address) is never found as a duplicate` (`it.fails`).

### BUG-data-2 — the default of 5 for MIN_CATEGORIES_UNDER_BOUTIQUE never applies
- **Where:** `services/elastic/elasticsearch-reader.service.ts:560` and `:584` (`getBoutiques`).
- **Scenario:** `MIN_CATEGORIES_UNDER_BOUTIQUE` is not set (`.env.example` lists it as `[optional]`). A shop in the home boutique row has fewer than 5 main categories.
- **What the code does wrong:** it writes `parseInt(process.env.MIN_CATEGORIES_UNDER_BOUTIQUE) ?? 5`. `parseInt(undefined)` is `NaN`, not `null` or `undefined`, so `?? 5` never gives 5. `categoriesLength < NaN` is always false, so no shop is ever filled with its most viewed products.
- **Expected:** with the setting unset, the limit is 5, and a shop with 0 categories is filled with its products.
- **Actual:** the limit is `NaN`, and the shop stays empty. (Today every `.env*` file sets the value to "5", so this only shows on an environment that leaves it out.)
- **Confirming test:** `tests/services/elastic/elasticsearchReader.test.ts` > "the boutique row (getBoutiques)" > `BUG-data-2: without MIN_CATEGORIES_UNDER_BOUTIQUE set, a shop with no categories is still filled with products` (`it.fails`).

### BUG-data-3 — the 120-second default in RedisSet never applies
- **Where:** `serverRequests/radis/index.ts:71-72` (`RedisSet`). The same problem is in `StoreCurrency` (line 50-54), which has no default at all.
- **Scenario:** `PRODUCT_REDIS_TTL_SECONDS` is not set (`.env.example` lists it as `[optional]`), and a caller stores a value without its own time (for example `serverRequests/meta/home.ts:123`, `serverRequests/product.tsx:138`).
- **What the code does wrong:** it writes `ttl ?? Number(process.env.PRODUCT_REDIS_TTL_SECONDS) ?? 120`. `Number(undefined)` is `NaN`, not `null` or `undefined`, so `?? 120` never gives 120. Redis is asked for `SET key value EX NaN`, refuses it, and the `catch` only logs it. Nothing is cached.
- **Expected:** with the setting unset, the value is stored for 120 seconds.
- **Actual:** the time sent is `NaN`. (Today every `.env*` file sets the value to "120", so this only shows on an environment that leaves it out.)
- **Confirming test:** `tests/serverRequests/radis/index.test.ts` > "the general cache helpers" > `BUG-data-3: a value stored with no time and no configured time lives for the 120-second default` (`it.fails`).

### BUG-data-4 — a thrown currency read loses its own error report
- **Where:** `serverRequests/currency.ts:110-120` (`fetchCurrencyFrom`, the `catch`).
- **Scenario:** `fetchServerData` throws (for example a network failure) instead of answering `{ isError }`.
- **What the code does wrong:** the `catch` builds its report with `` `Currency Error: ${response.status}` ``. `response` is still `undefined` there, so the `catch` itself throws a `TypeError` ("Cannot read properties of undefined"). The currency report (`source: "currency"`, the country, the language) is never sent, and the original error is replaced by the `TypeError`.
- **Expected:** the failure is reported with `source: "currency"`, and the original error is passed on.
- **Actual:** no currency report; the outer `catch` in `currencyFromBase` logs a `TypeError` as "get currency error".
- **Confirming test:** `tests/serverRequests/currency.test.ts` > "the cache, the refusals and the direct reader" > `BUG-data-4: a currency read that throws is reported as the currency failure it is` (`it.fails`).

### Dead code — not tested

- `services/elastic/qaFilter.ts:72-74` — `isQaShopSlug`. Its comment says the e2e seed and tests use it, but nothing does. Proof: `grep -rln "isQaShopSlug" --include=*.ts --include=*.tsx . --exclude-dir=node_modules --exclude-dir=.next` finds only `services/elastic/qaFilter.ts` itself (no caller under `tests/e2e`, `scripts/` or the app). This is the 1 uncovered line of `qaFilter.ts`.

### Cannot cover

- `services/elastic/sitemap.service.ts:263` — `generateProductSitemapUrls` skips a product with a blank slug. Products only come from `transformHitsToProducts`, which already drops blank and whitespace-only slugs (line 734). So the `continue` can never run.
- `services/elastic/sitemap.service.ts:581` — `generateSearchTermsSitemapUrls` resets an unsupported country to `tr`. Every term comes from `resolveTermLocale`, which already resets an unsupported country to `tr` (line 548). So the branch can never run.
- `services/elastic/sitemap.service.ts:934` — the `catch` around `getTopSearchTerms` in `generateLocaleSpecificSitemapUrls`. `getTopSearchTerms` catches every error itself and returns `[]`, and `LogServerError` never throws (it wraps its own body in `try`). So nothing can reach this `catch`.
- `services/elastic/helpers.ts:1951` and `:2081` — `buildAtLeastTwoClause` returns `null` for fewer than 2 words, or when every word is blank. Its only caller (line 1791) calls it only when there are 3 or more words, and the words were already split on spaces with blanks removed (line 1337-1342). So both `return null` lines can never run.
- `services/elastic/helpers.ts:2100` — `calculateFuzziness` has `return 1;` on line 2099, so the `return` on line 2100 can never run.
- `services/elastic/elasticSearch.ts:529` — the callback that reads recommended product ids. `recommendedProducts` is always `[]`, because the code that filled it (`enrichWithRecommended`, lines 500-515) is commented out. So the callback never runs.

---

## Group: global

### Coverage findings — GROUP=global

### Dead code — not tested

- `components/global/WebviewCall.tsx` — no importer anywhere. Proof:
  `grep -rniE "WebviewCall" --include=*.ts --include=*.tsx --include=*.js --include=*.mjs . | grep -v node_modules | grep -v ^./tests/`
  finds only the file itself and a lint-ignore line in `eslint.config.mjs:76`.
- `components/global/WebViewVideoCall.tsx`, `components/global/WebViewVoiceCall.tsx`,
  `components/global/CallComponentWidget.tsx`, `components/global/WebViewActions.tsx` —
  their only importer is `components/global/WebviewCall.tsx` (lines 5, 33, 61, 69), which is dead. Same grep proof.


### BUG-global-100 — compare page drops a product whose `sync_color_images` is an empty list

- Source: `components/global/compare.tsx:212` — `product?.sync_color_images?.[0].images[0]`. The `?.` stops at the list, not at its first item. When the list is `[]`, `[0]` is `undefined` and `.images` throws a TypeError.
- Scenario: open `/compare?f_p=<slug>` for a product whose `sync_color_images` is `[]`.
- Expected: the product loads into slot 1 like any other product.
- Actual: the TypeError lands in the `catch` at line 230. The page clears slot 1, deletes the `f_p` cookie, removes `f_p` from the address and shows "One of the products was not found...". (The search path at line 300 already uses `?.[0]?.images?.[0]` correctly.)
- Confirming test: `tests/components/global/compare.test.tsx` > "BUG-global-100: a product whose sync_color_images list is empty is reported as not found" (`it.fails`).

### Cannot cover — components/global/compare.tsx

- Line 119 (`return []` inside `searchFunction`): the only caller is `debouncedChangeHandler`, which already returns at line 287 for an empty or spaces-only value. So `searchFunction` never gets an empty value.
- Lines 266-268 (`loadOptions`): the function is declared inside `ComparePage` and never called or passed anywhere (`grep -n loadOptions components/global/compare.tsx` finds only its declaration). Dead code inside a live file.

### Bugs

### BUG-global-1 — SlideWidget drops a step change that arrives during a slide
- Source: `components/global/SlideNavigation.tsx:26` (with the timer at lines 45-50).
- Scenario: the caller moves `step` 0 -> 1, and then 1 -> 2 before the 400 ms slide ends (a fast double tap in the cart or orders flow).
- Code: the effect returns early when `isTransitioning` is true (line 26). Its only dependency is `[step]`, so it never runs again after the slide ends. The timer sets `current` to the old `step` (1) from its closure.
- Expected: step 2 is on screen once the slides end. Actual: step 1 stays on screen while the caller's `step` is 2.
- Test: `tests/components/global/SlideNavigation.test.tsx` > "BUG-global-1: a step change that arrives during a slide is dropped, so the widget stays on the wrong step" (`it.fails`, seen as expected fail).

### BUG-global-2 — SlideWidget slides in the OLD step, the new step pops in after
- Source: `components/global/SlideNavigation.tsx:84` (`const Current = children[currentStep]`).
- Scenario: `step` changes 0 -> 1.
- Code: `currentStep` is the `current` state, which only changes when the timer ends (line 46). During the slide both layers (leaving z-10 and entering z-20) render `children[0]`. The new step appears only after the slide, with no animation.
- Expected: the entering layer holds step 1 during the slide. Actual: it holds step 0.
- Test: `tests/components/global/SlideNavigation.test.tsx` > "BUG-global-2: during a slide the entering layer shows the old step, so the new step only appears after the slide" (`it.fails`, seen as expected fail).

### Cannot cover

- `components/global/SlideNavigation.tsx` lines 37, 95-97, 103-105. The hook `useSlideTransition` is not exported. Its only caller, `SlideWidget` (line 79), passes a number `step` and no `directionOverride`. So the direction is always "left" or "right": the non-number fallback (37) and the "up" / "down" / default branches (95-97, 103-105) can never run.

### BUG-global-4 — a notification with JSON details but no `type` opens the cart
- Source: `components/Notifications/NotificationItem.tsx:114-115`.
- Scenario: the backend sends a notification whose `description` is JSON with no `type`, for example `{"description":"System message"}`.
- Code: `switch (parsedDescription.type)` switches on `undefined`. The case expression `parsedDescription.type?.startsWith("product hurry up") && parsedDescription.type` is also `undefined`, so `undefined === undefined` matches the "product hurry up" case. A click calls `enableCart(true)` and `disableAddToCartOption()`.
- Expected: a notice with no type is shown as plain content (the `default` case) and a click does not open the cart. Actual: the click opens the cart.
- Test: `tests/components/Notifications/NotificationItem.test.tsx` > "BUG-global-4: a JSON notice with no type is treated as 'product hurry up' and opens the cart" (`it.fails`, seen as expected fail).

### Cannot cover — components/global/CameraWidget.tsx

- Line 99 (the "This device has only one camera" message in `handleSwitchCamera`). The switch button that calls `handleSwitchCamera` is drawn only when `hasMultipleCameras` is true (line 266), and nothing else calls the handler. So the `else` branch can never run.

### BUG-global-3 — closing the notifications panel does not put the page back where it was
- Source: `components/Notifications/NotificationsPanel.tsx:25` and `:43`.
- Scenario: the shopper scrolls the page to 300px and opens the notifications panel, then closes it.
- Code: on open the lock sets `document.body.style.top = -${window.scrollY}px` (line 29). On close it calls `window.scrollTo(0, parseInt(originalTop || "0") * -1)` (line 43), but `originalTop` is the body's `top` read BEFORE the lock (line 25, usually "auto"), not the saved scroll. `parseInt("auto")` is `NaN`.
- Expected: `window.scrollTo(0, 300)`. Actual: `window.scrollTo(0, NaN)`, so the page is left at the top.
- Test: `tests/components/Notifications/NotificationsPanel.test.tsx` > "BUG-global-3: closing the panel sends the page to the top instead of where the shopper was" (`it.fails`, seen as expected fail; unmarked, it fails with "called with 0, NaN").

---

## Group: home

### Coverage bugs — group home

### Cannot cover

- `components/Home/Stories/ReportStoryModal.tsx:264-270` — the `if (!canSubmit)` branch in `handleSubmit`. No user path reaches it: the only caller is the Submit button, and that button has `disabled={submitting || !canSubmit}` (line 415). React never fires `onClick` on a disabled button, in jsdom or in a browser. So the branch is unreachable code, not a jsdom gap.

### BUG-home-1 — a failed PostHog start is never logged

- **Where:** `components/Home/Init.tsx:124-154` (the effect keyed on `userId`).
- **Scenario:** `posthogInit` (or anything after it in the async block, such as `posthogIdentify`) rejects.
- **What the code does wrong:** the code starts `void (async () => { await posthogInit(...) ... })()` inside `try { ... } catch { LogError(...) }`. The `try` does not await the promise, so the `catch` never sees the rejection. The error becomes an unhandled promise rejection.
- **Expected:** `LogError` is called with scenario `"Init PostHog in Init"`.
- **Actual:** `LogError` is never called; the catch block (line 150-153) is unreachable.
- **Confirming test:** `tests/components/Home/Init.test.tsx` > `BUG-home-1: a failed PostHog start is never logged` (`it.fails`; seen failing with "expected [] to include 'Init PostHog in Init'").
- **Coverage note:** `Init.tsx` line 150 stays uncovered until this is fixed.

### BUG-home-2 — a nameless category chip shows the wrong sub-category name

- **Where:** `components/Home/Search/ActiveSearchFilterBar.tsx:15-27` (`getCategory`).
- **Scenario:** the applied search filter holds a category chip with no `name` (only a slug), and some category in the filter has `childes`.
- **What the code does wrong:** `getCategory(slug)` loops over every child of every category with `.map` and assigns each child to `variable`. The `return sub` returns from the `.map` callback, not from `getCategory`. So the function always returns the LAST child it saw, whatever the slug.
- **Expected:** the chip for slug `boots` is named "Boots" (the child whose slug matches).
- **Actual:** the chip is named "Sandals" (the last child in the list). The same wrong child also feeds the chip picture (line 98-103).
- **Confirming test:** `tests/components/Home/Search/ActiveSearchFilterBar.test.tsx` > `BUG-home-2: a nameless category chip shows the name of the wrong sub-category` (`it.fails`; seen failing with "expected [ 'Shoes', 'Sandals' ] to deeply equal [ 'Shoes', 'Boots' ]").

### BUG-home-3 — removing a word in the open search-history list leaves it on screen

- **Where:** `components/Home/Search/SearchHistory.tsx:137-149` (close icon inside `.search-filter-menu`).
- **Scenario:** the shopper opens the full search-history list and taps the X next to a word.
- **What the code does wrong:** the handler removes the word from `localStorage`, then calls `setOpen(false); setOpen(true)` in the same batch (no net change). It never calls `deleteOption(s)`, unlike the X in the closed row (line 93). `options` is a prop owned by `SearchIcon`, so the word stays on screen.
- **Expected:** the word disappears from the list (the parent is told through `deleteOption`).
- **Actual:** the word is still shown until the search overlay is opened again.
- **Confirming test:** `tests/components/Home/Search/SearchHistory.test.tsx` > `BUG-home-3: removing a word in the open history list leaves it on screen` (`it.fails`; seen failing: the word's element is still in the document).

### BUG-home-4 — "Clear All" in search history leaves every word on screen

- **Where:** `components/Home/Search/SearchHistory.tsx:104-114`.
- **Scenario:** the shopper opens the full search-history list and taps "Clear All".
- **What the code does wrong:** the handler only writes `[]` to `localStorage["search-history"]`. Nothing tells the parent (`SearchIcon` keeps the list in `searchHistory` state), so the list on screen does not change.
- **Expected:** no history words are shown after "Clear All".
- **Actual:** every word is still shown.
- **Confirming test:** `tests/components/Home/Search/SearchHistory.test.tsx` > `BUG-home-4: Clear All leaves every word on screen` (`it.fails`; seen failing: "shoes" is still in the document).

### BUG-home-5 — stopping a story video recording calls `window.stop()`

- **Where:** `components/Home/Stories/CameraStory.tsx:108-114` (`handleStopCapture`), with line 33.
- **Scenario:** the shopper records a video story and taps the record button again to stop (or the one-minute cap stops it).
- **What the code does wrong:** `handleStopCapture` calls `stop()`. Line 33 takes only `seconds, minutes, start, pause, reset` from `useStopwatch`, so `stop` is not the stopwatch. The name resolves to the browser's global `window.stop()`, which cancels every download the page still has in flight (pictures, video chunks). The stopwatch is never paused.
- **Expected:** stopping a recording pauses the stopwatch (`pause()`) and does not call `window.stop()`.
- **Actual:** `window.stop()` is called and `pause()` is never called.
- **Confirming test:** `tests/components/Home/Stories/CameraStory.test.tsx` > `BUG-home-5: stopping a video recording calls window.stop() instead of pausing the stopwatch` (`it.fails`; seen failing with "stopping a recording must not stop the whole page from loading").
- `components/Home/Stories/AddStoryWidget.tsx:145-151` — the `catch` in `validateLink`. `validateLink` first calls `isValidUrl`, which builds the same `https://…` string and runs `new URL()` on it; only a string that passed that check reaches the second `new URL(url)` on line 142, so it cannot throw. Unreachable in any environment.
- `components/Home/Stories/AddStoryWidget.tsx:517-519` — the `!valid` branch of `handleShareStory`. The only caller is the Share button, which is `disabled` whenever `linkError` is set or `isValidUrl(link)` fails (line 682). `linkError` is recomputed from `validateLink` on every change of the link, so an invalid link always disables the button, and React does not fire `onClick` on a disabled button. Unreachable in any environment.

### BUG-home-6 — after a pause, a story waits its full time again

- **Where:** `components/Home/Stories/StoryViewer.tsx:142-161` (`beginProgress`), called from line 246 with `pausedProgressRef.current`.
- **Scenario:** a picture story of 1 s is paused at 0.5 s (for example the report sheet opens) and then resumed.
- **What the code does wrong:** `beginProgress(duration, initialProgress)` moves the progress start back by the part already watched (line 144), so the bar resumes at 50 %. But the timer that moves to the next story is still `setTimeout(..., duration)` with the FULL duration (line 156-160). So the bar reaches 100 % after 0.5 s and the story then stays on screen for another 0.5 s.
- **Expected:** the story moves on `duration * (1 - initialProgress)` after resuming (0.5 s here).
- **Actual:** it moves on after the full `duration` (1 s).
- **Confirming test:** `tests/components/Home/Stories/StoryViewer.test.tsx` > `BUG-home-6: after a pause the story waits its full time again instead of the time that was left` (`it.fails`; seen failing with "a 1 s story paused at 0.5 s must move on 0.5 s after resuming").

### Cannot cover (continued)

- `components/Home/Stories/StoryViewer.tsx:197-201` — the "account for an open pause" block inside the `[index]` effect. When `index` changes, React first runs the cleanup of the previous `[index]` effect (lines 213-224). That cleanup already adds the open pause and sets `pauseStartTimeRef.current = null`. So when the new effect body reaches line 197, the ref is always null. Unreachable in any environment.

### BUG-home-7 — "Load More" in search sends filter objects instead of slugs

- **Where:** `components/Home/Search/SearchIcon.tsx:323-331` (`handleLoadMore`).
- **Scenario:** the shopper has at least one brand, category or boutique filter active in the search overlay and taps "Load More" in any result row.
- **What the code does wrong:** the first page (`performSearch`, line 176) sends `filters: { ...normalizeFilters(appliedFilters), search_text }`, which turns each filter into its slug. `handleLoadMore` sends `filters: { ...appliedFilters, search_text }`, the raw filter objects. So the next page is asked from the market backend with a different, wrong filter shape.
- **Expected:** `filters.brands` is `["nike"]`, the same shape as the first page.
- **Actual:** `filters.brands` is `[{ slug: "nike" }]`.
- **Confirming test:** `tests/components/Home/Search/SearchIcon.test.tsx` > `BUG-home-7: Load More sends filter objects instead of slugs` (`it.fails`; seen failing with "expected [ { slug: 'nike' } ] to deeply equal [ 'nike' ]").

### BUG-home-8 — a related category that is already applied is still offered

- **Where:** `components/Home/Search/SearchIcon.tsx:822-823` (related-categories row).
- **Scenario:** a category filter is active, the search returns a related category, and the shopper taps that related category.
- **What the code does wrong:** the row hides applied categories with `!applied_filter.categories.includes(s.slug)`. `applied_filter.categories` holds category objects (`toggleFilter` pushes the item), not slugs, so `includes(slug)` is always false. The applied related category is still shown, and a second tap removes it again.
- **Expected:** after it is added, the related category is no longer offered in that row.
- **Actual:** it stays in the row.
- **Confirming test:** `tests/components/Home/Search/SearchIcon.test.tsx` > `BUG-home-8: a related category already in the filter is still offered` (`it.fails`; seen failing: "Boots" is still in the document).

---

## Group: products

### Coverage bugs — GROUP=products

Append-only.

### BUG-products-1 — camera refusal asks for notification permission
- Source: components/products/TryOnModal.tsx:96-100
- Scenario: shopper opens the try-on modal, presses "Take Photo", and the browser refuses the camera.
- Expected: the alert asks the shopper to allow the camera.
- Actual: the alert says "Please enable notification permissions to use camera features" — it sends the shopper to the notification setting.
- Test: tests/components/products/TryOnModal.test.tsx > "BUG-products-1: a refused camera must ask for camera permission, not notification permission" (it.fails)

### BUG-products-2 — Escape closes the try-on modal while it is processing
- Source: components/products/TryOnModal.tsx:31-56 (listener) and :22 (guard)
- Scenario: shopper adds a photo, presses "Try On", then presses Escape during the 3 s processing.
- Expected: the modal stays open (handleClose returns early while isProcessing).
- Actual: the keydown listener is added once per `isOpen` and keeps the first `handleClose`, which saw isProcessing=false, so onClose runs.
- Test: tests/components/products/TryOnModal.test.tsx > "BUG-products-2: Escape must not close the modal while the try-on is processing" (it.fails)

### Cannot cover — components/Login/Enhanced/FullEnhancedLoginWidget.tsx (96.98% lines)
Unreachable branches inside a live file (no code path can run them; not deleted because deleting is an app change):
- Line 558 (`SplashScreen onFinish`): `step` starts at 'get-started' (line 98) and no `goTo('splash')` exists anywhere (`grep -n "'splash'"` finds only the type at line 43 and the check at line 556).
- Line 181 (`handleBack` from 'terms'): `TermsScreen` gets no `onClose` (lines 608-613), and `handleBack` is only passed to the six screens at lines 626/641/671/685/699/727 — never while `step === 'terms'`.
- Lines 154-155, 163, 197 (`handleClose` and the `else` in `handleBack`): `handleBack` is only called from those six screens, and each of their steps has its own `if` branch (lines 182-195), so the final `else` and `handleClose` never run. CANCEL_LOGIN / CANCEL_SIGNUP are therefore never sent from this widget.

### BUG-products-3 — the delivery note on "change address" is never sent
- Source: components/Orders/ChangeAddressWidget.tsx:60-75 (ChangeAddress) and services/order.ts:581-592 (changeOrderAddress has no note field)
- Scenario: on an order, shopper opens "Change Delivery Address & Note", writes a note on the "Delivery Note" tab, presses Change Request, agrees, presses "Agree & Change".
- Expected: the note reaches the market backend with the change.
- Actual: the request body is only { order_group_id, new_shipping_address_id } (here: {"order_id":700,"address_id":1}); the note is dropped, and the sheet closes as if it worked.
- Test: tests/components/Orders/ChangeAddressWidget.test.tsx > "BUG-products-3: a delivery note the shopper confirms must be sent with the change" (it.fails)

### BUG-products-4 — Enter in an empty comment box posts an empty question
- Source: components/products/CommentBar.tsx:128-133 (onKeyDown) and :23-59 (addComment has no empty-text check)
- Scenario: signed-in shopper opens a product's questions, focuses the empty "type a comment" box and presses Enter.
- Expected: nothing is posted.
- Actual: addComment runs and POSTs { text: "" } to the comments backend (CREATE_COMMENT_URL).
- Test: tests/components/products/CommentBar.test.tsx > "BUG-products-4: Enter in an empty comment box must not post an empty question" (it.fails)

### BUG-products-5 — a pasted question over 200 characters is posted in full
- Source: components/products/CommentBar.tsx:146-149
- Scenario: shopper pastes 300 characters into the comment box and presses Enter.
- Expected: the posted text is what the box shows (200 characters).
- Actual: the box shows `val.slice(0, 200)`, but `val` keeps all 300 characters and addComment posts all 300.
- Test: tests/components/products/CommentBar.test.tsx > "BUG-products-5: a pasted question longer than 200 characters must be posted as shown (200 characters)" (it.fails)

### BUG-products-6 — closing the full-size product video leaves the page unscrollable
- Source: components/products/ProductVideo.tsx:50-55
- Scenario: on a product page, shopper taps the "Quick Video" player (it opens full size), then closes it (X or backdrop).
- Expected: the page scrolls again.
- Actual: opening calls DisableScroll() (html overflow: hidden, and scrollTop = 0); nothing calls EnableScroll() on close, so overflow stays "hidden".
- Test: tests/components/products/ProductVideo.test.tsx > "BUG-products-6: closing the full-size video must let the page scroll again" (it.fails)

### Cannot cover — components/products/ShareOptions.tsx line 104 (99.x% lines)
- Line 104 (`throw new Error(response.message)` after GAevent) can never run: the same `!response.success` check already threw at line 79-81, so by line 103 `response.success` is always true. Duplicate check, unreachable.

### Dead code — not tested
- components/Login/Enhanced/screens/SplashScreen.tsx (0% lines). Only caller: components/Login/Enhanced/FullEnhancedLoginWidget.tsx:556-562, inside `step === 'splash'`, and `step` can never be 'splash' — it starts at 'get-started' (line 98) and no `goTo('splash')` exists. Proof: `grep -rn "SplashScreen" app components hooks` → only the import at FullEnhancedLoginWidget.tsx:40 and the JSX at :557; `grep -n "'splash'" components/Login/Enhanced/FullEnhancedLoginWidget.tsx` → only the type (43) and the check (556).

### Cannot cover — components/products/ProductCard/index.tsx line 114 (97%+ lines)
- `rearrangedImages()` returns `[]` (line 114) only when `sync_color_images` is empty, but it is only called inside `{color && ...}` (line 149), and `color` is `sync_color_images?.[0]?.color_name` (derivedProps.ts:25). So `color` is truthy only when the list is not empty — line 114 cannot run.


---

## Group: seller


### Cannot cover (main agent)
- components/SellerDashboard/locations/LocationMapPicker.tsx:60 — `if (disabled) return;` in handleUseMyLocation. The only caller is the "Use my current location" button, and that button renders only when `isLoaded && !disabled` (line 137). So the handler never runs while `disabled` is true; no user action can reach the line.

### BUG-seller-400 — wrong fallback error message in six seller-dashboard service methods

- Source: services/sellerDashboard/index.ts lines 147 (packOrderDetailStatus), 168 (cancelOrderDetail), 191 (getRoles), 213 (addUserToShop), 248 (deleteUser), 270 (updateUserRole).
- Scenario: the backend answers `success: false` with no `message`.
- Expected: an error that names the action that failed (pack, cancel, load roles, add user, delete user, change role).
- Actual: every one throws "Failed to confirm order detail status" (copied from confirmOrderDetailStatus). The callers (orders.tsx handlePackItem / handleCancelItem, sellerDashboard page handleDeleteUser / handleUpdateUserRole / addUserToShop / getRoles) show `error.message` before their own translated text, so the seller sees an untranslated message about confirming an order item.
- Confirming tests: tests/services/sellerDashboard/updateShopInfoBody.test.ts, `it.fails.each` "BUG-seller-400: <method> blames 'confirm order detail status' when it fails with no backend message" (6 expected failures).

### Dead code — not tested (fork: ProductEditor)

- `components/SellerDashboard/productEdit/ProductEditor.tsx` lines 686-752
  (`handleSaveDraft`, `handleLoadDraft`). Their only callers are inside JSX
  comments (`{/* <DashButton ... onClick={handleSaveDraft}> */}`) at lines
  933-948, 983-998 and 1124-1139. Proof:
  `grep -rn "handleSaveDraft\|handleLoadDraft" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v ^./tests/`
  returns only the two definitions and those six commented-out lines.
  Uncovered lines left: 687-696, 701-750.

### BUG-seller-100 — a filled purchase price is never validated
- Source: components/SellerDashboard/productEdit/helpers.ts:936 (`validate`)
- Scenario: prices unlocked, unit price 100, purchase price 150 (or -5).
- Expected: `purchase_price` error "Unit price must be greater than purchase price" (or "Enter a valid purchase price" for a negative value); also "Discount price must be greater than purchase price" when the discount is not above it.
- Actual: no error. The block runs only when `purchase_price` is EMPTY (`=== "" || !form.purchase_price`). In that case `pp` is always NaN, so only "Enter a valid purchase price" can fire, and lines 939-943 can never run. A filled purchase price is never checked. The condition looks inverted (compare the locked branch at line 966).
- Confirming test: tests/components/SellerDashboard/productEdit/helpers.test.ts > "validate — every rule" > "BUG-seller-100: refuses a purchase price above the unit price" (it.fails, seen as expected failure).

### Cannot cover
- components/SellerDashboard/productEdit/helpers.ts:939-942 — unreachable because of BUG-seller-100: inside `if (purchase_price === "")`, `pp` is always NaN, so the `else if` branches never run.

### Cannot cover (ShopInfo/Stories/Gallery/Excel fork)
- components/SellerDashboard/ExcelUploadTab.tsx:171 — `if (!selectedCategory) return;` The only caller is the "Download Template" button, and that button has `disabled={!selectedCategory}` (line 362). A disabled button fires no click, so the handler never runs without a category.
- components/SellerDashboard/ExcelUploadTab.tsx:253-257 — the "No file selected" branch of handleUpload. The only caller is the "Upload Excel" button, which has `disabled={!file}` (line 448). The handler never runs without a file.

### Cannot cover — components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx (fork: boutique)

Final line coverage: 92.74% (243/262). Test: tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx.

- Lines 502-523 (`onDelete`), 634 (Delete button click), 704 and 723 (delete confirm modal handlers):
  `const canDelete = false;` at line 111 is a hard-coded constant. The Delete button (line 630) only renders
  when `canDelete` is true, and `confirmDelete` is only set to true by that button. So `onDelete` and the
  confirm modal can never run. Proof: `grep -n "setConfirmDelete(true)" components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx`
  -> only line 634, inside `{canDelete && ...}`. The code comment says it waits for a product decision.
- Line 233 (`onCopyField` with `prev === null`), 375 (`onMoveBanner` with `prev === null`), 392 (`onSave` with
  no form): the sections and save buttons render only after `form` and `initial` are set, and nothing sets
  them back to null (`cancelEdit` sets `initial`, which is non-null once loaded). So these guards never fire.
- Line 351 (`resolveWarn` with no `warn`): `resolveWarn` is only wired to the warning modal, which renders
  only while `warn` is set, and `current` is read from that same render. Never null when called.
- Line 532 (`return null` when `!form || !lookups`): after `loading` becomes false, either `form` and
  `lookups` are both set (success) or `denied`/`loadError` is set (catch; `loadError` always gets a
  non-empty fallback). No path reaches this line.

### Cannot cover — sellerProfile pages (fork BUG-seller-600..)
No bugs found in these five files. The lines below are defensive guards that no caller can reach; each reason names the guard that blocks it.

- `app/(client)/[lang]/sellerProfile/page.tsx:48` — `if (!leaveConfirmShopId) return;` in `confirmLeaveShop`. The only caller is the confirm button, which renders only inside `{leaveConfirmShopId && (...)}` (line 243). So the id is never empty when it runs.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx:487-488` — `getSellerProducts` "not permitted" branch. Every caller is already gated on `canViewProducts`: the effect (949), `initializeData` (1031), the Retry (1105) and Pagination (1302-1303) render only after `if (!canViewProducts) return <AccessDenied/>` (1092).
- same file `:522-523` — `getSellerBoutiques` "not permitted" branch. Same reason: effect (996), `initializeData` (1034), Retry (1329) are all behind `canViewBoutiques`.
- same file `:627` — `if (!canViewUsersList) return;` in `getUsers`. Callers need `canManageUsers` (effect 867, add-user form inside `renderUsers` after 1544) or sit inside `{canViewUsersList && ...}` (Load more, 1960). `canManageUsers` (USER_MANAGEMENT_ACCESS or SUPER_ADMIN) implies `canViewUsersList`.
- same file `:796-798` — `getSellerPermissions` early branch for a `currentShop` that has permissions. The mount effect calls it only when `currentShop` has none (860). The Retry buttons render only while `sellerPermissions` is empty, and the sync effect (847-851) fills `sellerPermissions` as soon as `currentShop` has permissions. The permissions-tab effect (1001-1009) is unreachable too (next line).
- same file `:1007` — the permissions-tab effect needs `canViewPermissions && sellerPermissions.length === 0`. `canViewPermissions` is computed from `sellerPermissions`, so it is false whenever the list is empty.
- same file `:922` — `if (!menuRef.current) return;` in the menu outside-click handler. `menuRef` is on a `<div>` that is always rendered (2151), so it is never null while the handler is attached.
- components/SellerDashboard/GalleryTab.tsx:143 — `if (selectedFiles.length === 0) return;` in handleSubmitUpload. The Upload button lives inside the confirm panel, and the panel closes when the last file is removed (line 563) and is opened only with at least one image (line 130). So the button is never on screen with an empty selection.
- components/SellerDashboard/GalleryTab.tsx:178 — `if (!deleteTarget) return;` in handleDelete. Its only button is inside the delete window, which renders only when `deleteTarget` is set (line 606).
- components/SellerDashboard/GalleryTab.tsx:235 — `if (ids.length === 0) return;` in handleBulkDelete. The bulk window opens only from the toolbar Delete button, which has `disabled={selectedIds.size === 0}` (line 390), and the selection cannot change while the window is open.

### Dead code — not tested (main agent: orders.tsx)
- components/SellerDashboard/orders.tsx:1951-1983 `handleChangeOrderStatus` (uncovered lines 1952-1980). It is passed as `onChangeOrderStatus` to `OrderDetailScreen` (line 2255), but the only place that calls `onChangeOrderStatus` is line 1675, inside the JSX comment block `{/* {orderStatusOptions.length > 0 && ( ... )} */}` (lines 1648-1686). Proof: `grep -rn "onChangeOrderStatus\|handleChangeOrderStatus" components app --include=*.tsx` gives only lines 1491, 1503, 1675 (commented), 1951, 1973, 2255.
- components/SellerDashboard/orders.tsx:771-772 `Icons.ProductImage`. Proof: `grep -rn "ProductImage" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v ^./tests/` finds only the definition at orders.tsx:771; nothing renders `Icons.ProductImage`.

### Cannot cover (main agent: orders.tsx)
- components/SellerDashboard/orders.tsx:2138 `if (ordersLoading) return;` in the `lastElementRef` callback. The ref sits on a div that renders only when `!ordersLoading` (line 2243). React calls a ref callback only for a mounted node, so the callback built while `ordersLoading` is true is never attached and never runs.
- components/SellerDashboard/StoriesTab.tsx:471 — `if (!selectedFile) return;` in handleShareStory. The Share button has `disabled={!preview || !!linkError}` (line 733), and `preview` is only set after `selectedFile` is set (lines 439-442, 448-451) and both are cleared together (clearPreview). So Share is never clickable without a file.
- components/SellerDashboard/StoriesTab.tsx:474-475 — the invalid-link branch at share time. handleLinkChange (line 467) sets `linkError` from the same `validateLink` on every change, and a non-empty `linkError` disables Share. So the link is always valid when Share runs.
- components/SellerDashboard/StoriesTab.tsx:640 — `setLink(sanitized)` in the link field's onBlur. onChange (line 465-466) already stores `pollinateInput(value)`, and pollinateInput gives the same text when run twice, so `link !== sanitized` is never true.
- components/SellerDashboard/StoriesTab.tsx:951 — `if (!deletingStory) return;` in handleDelete. Its only button is in DeleteConfirmModal, which renders only when `deletingStory` is set (line 1100).
- components/SellerDashboard/ShopInfo.tsx:119 — `if (!croppingType) return;` in handleImageCropSave. Its only caller is the crop widget's onSave, and the widget renders only when `pendingImageFile && croppingType` (line 249).

---

## Group: server

### Coverage findings — group server


### Cannot cover

- `components/skeleton/loaders/ProductLoader.tsx` lines 17-20 — the body of the local helper `safePriceCheck`. The component defines it but never calls it (`grep -n safePriceCheck` finds only the definition, line 16). No render can run those lines.

### BUG-server-1 — recommendations "Show More" spins forever after one failed load

- Source: `components/Server/RecomendedProducts.tsx` lines 19-44 (`loadMore`).
- Scenario: the shopper taps "Show More" at the end of the home recommendations row, and `GetNextRecommendations` throws.
- Expected: the button becomes usable again (the toast even says "Retrying in 3 seconds").
- Actual: the `catch` block shows the toast and logs, but never calls `setLoadingMore(false)` and schedules no retry. `loadingMore` stays `true`, so the button shows a spinner forever and the click handler (line 72) ignores every later tap.
- Confirming test: `tests/components/Server/RecomendedProducts.test.tsx` > "BUG-server-1: after a failed load the Show More button comes back instead of spinning forever" (`it.fails`).
- `components/Server/FilterList.tsx` lines 171-176 — the "old searchParams format" branch of `ActiveFiltersBar`. It runs only when `parsedFilters` is falsy. Then `filterParams` is falsy too, and `Object.keys(null/undefined)` throws before the reduce; a falsy value never has keys, so the reduce body (172-176) can never run. Every caller passes an object: `FilterListReactive.tsx` gets `parsedFilters` from `FilterListContainer.tsx` (always an object), and `components/Listing/FiltersPageContent.tsx:274`, `app/(client)/[lang]/featured/[[...filters]]/page.tsx:190`, `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx:196` render the container, not FilterList directly.
- `components/Server/FilterList.tsx` line 214 — the `else` of `getItemData` (lookup with no `key`). Every call to `getItemData` in the file passes `key: "slug"` (`grep -n "getItemData({" -A4` shows it on each call), so the no-key branch never runs.
- `components/ListingPage/FilterItem.tsx` line 53 — the `getFilterStateForItemLegacy` branch runs only when `isUsingParsedFilters` is false. Proof (`grep -rn "isUsingParsedFilters=" components app`): `InfiniteScrollFilters.tsx:86` passes `true`; `FilterList.tsx:764` passes `Boolean(parsedFilters)`, and `FilterList` only renders chip rows with a truthy `parsedFilters` (a falsy one throws first in `ActiveFiltersBar`, see above). So no real caller reaches the legacy branch.

### BUG-server-2 — the listing grid keeps retrying a failed load after it has left the page

- Source: `components/ListingPage/ProductInfiniteScroll.tsx` lines 165-172 (the `!response` branch of `getProductsReq`) and the mount effect (~line 300), which returns no cleanup.
- Scenario: the listing backend answers a page request with nothing (`GetProducts` resolves `undefined`), and the shopper then leaves the listing (the grid unmounts).
- Expected: the pending retry is cancelled when the grid unmounts.
- Actual: the `setTimeout(getProductsReq, 3000)` is never cleared. The unmounted grid calls `GetProducts` again 3 seconds later, and while the backend keeps failing it re-schedules itself every 3 seconds for as long as the tab is open, with no UI to show the result. Seen in the unit run too: stray retries from an earlier test kept calling the mock in later tests.
- Confirming test: `tests/components/ListingPage/ProductInfiniteScroll.test.tsx` > "a grid that has left the page" > "BUG-server-2: stops retrying a failed load once the grid is unmounted" (`it.fails`).

### BUG-server-3 — the filter window drops the re-ask for a chip tapped while a re-ask is running

- Source: `components/ListingPage/filterComponents/FiltersWindow/index.tsx` lines 182-208 (`UpdateFilters`, a `useCallback` whose deps are `[selectedChips, priceRange, country, language]` — `loading` is missing) and the debounce effect at lines 213-227.
- Scenario: the shopper taps chip A; 400 ms later the window re-asks the backend. While that request runs, the shopper taps chip B (chips stay tappable during loading — `FiltersRowContainer` only dims them).
- Expected: after the first answer, the window asks again for the set that now includes B, so the rows and the total match the staged choice.
- Actual: tapping B recreates `UpdateFilters` with `loading === true` captured in its closure. The debounce effect calls that closure 400 ms later and it returns at line 183 (`if (loading) return;`). When `loading` later turns false, `UpdateFilters` is not recreated (`loading` is not a dependency), so nothing re-runs. The window keeps showing the filters and total for A only.
- Confirming test: `tests/components/ListingPage/filterComponents/FiltersWindow/index.test.tsx` > "a chip tapped while a re-ask is still running" > "BUG-server-3: still gets its own re-ask once the running one finishes" (`it.fails`; fails with "expected to be called 2 times, but got 1 times").

### Cannot cover (continued)

- `components/ListingPage/filterComponents/FiltersWindow/index.tsx` lines 176 and 236-237 — the `!filterEnabled` branches inside `FiltersWindowUI`. The outer `FiltersWindow` (line 16) mounts `FiltersWindowUI` only while `filterEnabled` is true. When the store flips it to false, React renders the parent first in the same pass and unmounts the child, so the child never renders or runs its effect with `filterEnabled === false`.
- `components/Server/RecomendedProducts.tsx` line 54 (the `FeaturedProductsSkeleton` return) is reported as a branch only: `loading` is created with `useState(false)` and `setLoading` is never called, so the skeleton can never be shown. The line itself is counted as run.

### BUG-server-30 — a comment heart crashes when the comment has no like count

- Source: `components/Server/product/LikeButtton.tsx` lines 96-99 (with 18 and 161).
- Scenario: a buyer comment or question reaches `LikeButton` without `total_likes` (for example a new comment from the Elasticsearch copy before the count field exists).
- Expected: the heart shows 0 (line 18 already defaults the state with `total_likes || 0`).
- Actual: the mount effect at line 98 runs `setLikes(total_likes)` with no default, so `likes` becomes `undefined` and line 161 `likes.toLocaleString()` throws "Cannot read properties of undefined (reading 'toLocaleString')". The whole comment widget fails to render.
- Confirming test: `tests/components/Server/product/LikeButtton.test.tsx` > "BUG-server-30: draws a comment that has no like count yet as 0" (`it.fails`).

### BUG-server-50 — the product footer price row never shows the currency symbol

- Source: `components/Server/product/ProductPrices/ProductPricesWrapper.tsx` line 17: `currencySymbol: currencyPromise?.sumbol`.
- Scenario: any product page; the footer price row renders `{currencySymbol}` after the price (`PricesRowClientLogic.tsx` lines 28 and 42).
- Expected: the currency symbol from the currency object (`symbol`, the field every other price component reads, e.g. `ProductColorsCards.tsx` `currency?.symbol`).
- Actual: the key is misspelled `sumbol`, so `currencySymbol` is always `undefined` and the footer price shows no currency.
- Confirming test: `tests/components/Server/product/ProductPrices/ProductPricesWrapper.test.tsx` > "BUG-server-50: hands the currency symbol to the price row" (`it.fails`; fails with "expected undefined to be '$'").

### BUG-server-31 — the related-products row keeps retrying a failed load after it has left the page

- Source: `components/Product/RelatedProductsInfiniteScroll.tsx` lines 83-87 (the `!response` branch of `getProductsReq`); the component has no effect cleanup for the timer.
- Scenario: the shopper taps "Show More" under related products, `GetRelatedProducts` answers with nothing, and the shopper leaves the product page.
- Expected: the pending retry is cancelled when the row unmounts.
- Actual: `setTimeout(getProductsReq, 3000)` is never cleared. The unmounted row calls `GetRelatedProducts` again 3 seconds later, and while the backend keeps answering with nothing it re-schedules itself every 3 seconds with no UI. Same fault as BUG-server-2 in `ProductInfiniteScroll.tsx`, in a separate file.
- Confirming test: `tests/components/Product/RelatedProductsInfiniteScroll.test.tsx` > "BUG-server-31: stops retrying once the row has left the page" (`it.fails`; fails with "expected to be called 1 times, but got 2 times").

### Cannot cover (product comments / FAQ)

- `components/Server/product/ProductBuyersComment/ProductBuyersCommentList.tsx` line 31 and `components/Server/product/ProductFAQSection/FaqQuestionsList.tsx` line 31 — `if (filter) params.set("filter", …)` in the local `fetchBuyersComments` / `fetchFaqComments`. Both helpers are called only inside their own file (`GetNextComments` and the refresh effect), and neither call passes `filter`, so it is always the default `null`.
- `ProductBuyersCommentList.tsx` line 67 and `FaqQuestionsList.tsx` line 83 — the early `return` in `GetNextComments` (`if (!offsetValue || loading) return;`). Its only caller is the Load More `onClick`, which already checks `!loading`, and the Load More tile renders only when `offsetValue` is truthy (`!hasEnd && offsetValue`). So neither condition can be true when the function runs.

---

## Group: settings

### Coverage bugs — group settings

### BUG-settings-1 — delivery chat for a second pack's return does not open from the link
- Source: components/setting/orders/OrderDetailsWrapper.tsx:403-408 (`openShippingChatForChatId`)
- Scenario: an order group has two packs, each with a return request. The address names the return of pack 2 (`order_chat_id` = its `return_request_id`), and that return is `out_for_return`. The return of pack 1 is `pending` and is listed first.
- What the code does wrong: the `find` over `return_requests_data` uses `String(order_item?.return_request_id) === String(chatId)`, a test that does not look at `return_item` at all. It is true for every entry, so `find` returns the FIRST return (pack 1's), and its status decides. The other half compares with the page prop `order_id`, not with `order_item.id`.
- Expected: the chat for pack 2's return opens. Actual: no chat request is sent.
- Confirming test: tests/components/setting/orders/OrderDetailsWrapper.test.tsx > "the delivery chat" > "BUG-settings-1: the address chat id for a second pack's return opens that return's chat, not the first return's status" (it.fails, seen as expected failure).

### BUG-settings-2 — the wallet balance is reset to 0 when the transactions page arrives
- Source: components/settings/WalletTransactions.tsx:130 (`setWalletBalance(response.wallet_balance || walletBalance)` inside `loadMore`)
- Scenario: the page mounts and calls `getWallet()` and `loadMore()` together. `GetWallet` answers first with `wallet_balance: 12.5`. Then the transactions page answers without a `wallet_balance` field.
- What the code does wrong: `loadMore` is the function from the first render, so its `walletBalance` is the first-render value, 0. The fallback `|| walletBalance` writes 0 over the balance that `getWallet` has just set. It should use the current value (a functional update) or leave the balance alone.
- Expected: the balance stays "12.50 SYP". Actual: it shows "0.00 SYP".
- Confirming test: tests/components/settings/WalletTransactions.test.tsx > "the balance" > "BUG-settings-2: a transactions page with no balance does not wipe the balance the wallet call loaded" (it.fails, seen as expected failure).

### BUG-settings-3 — the size change never refuses a size that is out of stock
- Source: components/setting/orders/confirmations/ChangeOrderItemConfirmWindow.tsx:340-352 (`SizeList`)
- Scenario: a red item in size M; the shopper opens "change size". The product has variation `red-L` with qty 0. The shopper taps size "L".
- What the code does wrong: `sizes` is a list of strings (`ModifyOrderItemModal` filters it with `s !== currentSize`, renders `{s}`, and `findVariation` in utils/tinyUtils.tsx:520-525 compares sizes as strings). `SizeList` passes `s?.option` as the selected size and compares `s?.name`; both are `undefined` for a string. So `findVariation` looks up the colour-only type `"red"`, finds nothing, `variation?.qty < item.qty` is `false`, and no size is ever disabled.
- Expected: "this option dosent have enough quantity" is shown and the size is not stored. Actual: L is stored as the new size (the change can be sent for a size with no stock).
- Confirming test: tests/components/setting/orders/confirmations/ChangeOrderItemConfirmWindow.test.tsx > "changing the size" > "BUG-settings-3: a size with no stock in the current colour is refused" (it.fails, seen as expected failure).
- Coverage note: line 366 (the refuse branch of `SizeList`) cannot run until this bug is fixed.

### BUG-settings-4 — the close (X) of the settings re-verify flow does not close it
- Source: components/setting/profile/VerifyUser.tsx:53-56 and 86-98
- Scenario: an account with a phone that is not usable taps "Verify Now" on the profile card, then taps the X of the verify flow.
- What the code does wrong: the `AuthOverlay` (a portal) is rendered inside the `div` whose `onClick={handleOpenModal}`. React click events bubble through portals to their React parents. The X (`SelectMethodScreen` / `EnterPinScreen`, `onClick={onClose}`, no `stopPropagation`) first runs `onClose` → `setIsModalOpen(false)`, then the same click reaches `handleOpenModal` → `setIsModalOpen(true)`. The overlay stays open. Any other click inside the flow also runs `handleOpenModal`.
- Expected: the overlay closes. Actual: it stays open.
- Confirming test: tests/components/setting/profile/VerifyUser.test.tsx > "inside the re-verify flow" > "BUG-settings-4: the close button of the re-verify flow closes the overlay" (it.fails, seen as expected failure).

### Dead code — not tested
- components/setting/orders/OrderDetailsWrapper.tsx:455-481 — the inner helpers `IsThereADescriptionMessage` and `isNotDraft` are declared and never called. Proof: `grep -rn "IsThereADescriptionMessage\|isNotDraft" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v ^./tests` returns only their two declaration lines (455, 473).

### Cannot cover
- components/setting/orders/OrderDetailsWrapper.tsx:1384-1391 (line 1387) — the "Failed To Load Return Details Try again" branch needs `already_return` true while `returnDetails` is null. `getProductWithReturn` (line 1135-1139) sets `already_return: false` and only a return entry from `returnDetails` can set it true, so with no `returnDetails` the flag is always false. The branch cannot run.
- components/settings/BecomeSellerModal.tsx:56 — `isAllowedDocFile` returns false for no file, but both callers only call it with a file (line 504 checks `file &&` first; line 531 runs in the `else` of `!newDocFile`).
- components/settings/BecomeSellerModal.tsx:454 — `fieldError` default `return ""` for an unknown field name. Every caller (the `FormInput` blur handlers and `submit`'s list) passes a known name, so no call reaches it.
- components/settings/BecomeSellerModal.tsx:530, 532 — "Please select a file" / "Only image or PDF files are allowed" inside `uploadDocument`. The Upload button is `disabled={uploadingDoc || !newDocFile}` (line 1195), and `newDocFile` is only ever set to an allowed file (line 504-514), so these branches cannot run.
- components/settings/BecomeSellerModal.tsx:751 — "Please upload at least one document" in `submit`. The Submit button is `disabled` while `form.documents.length === 0` (line 1215), so `submit` never runs with no documents.
- components/setting/orders/OrderItemOptions.tsx:528-529 — `selectedScreen === "cancel" && canceled && ShouldConfirmCancel`. Nothing sets `selectedScreen` to "cancel" (only "options", "changeOrder", "return", "cancelProduct", "report"), and `setCanceled` / `setShouldConfirmCancel` are never called with true. The branch cannot run.
- components/settings/WalletTransactions.tsx:99 — the early `return` in `loadMore` when a page is already loading or there is no more. `loadMore` is called once on mount (not loading, has more) and from the Load More button, which is `disabled={isFetching}` and is not rendered when `hasMore` is false. So no call reaches the `return`.
- components/settings/UploadProfilePhoto.tsx:136-137 — the guest branch at the start of `UploadFile`. The root `div` has `onClickCapture={handleFormClick}`, which calls `e.stopPropagation()` for a guest in the capture phase, so the Save click never reaches `UploadFile` for a guest. (The guest case is tested through `handleFormClick`.)
- components/settings/UploadProfilePhoto.tsx:181 — the body of `return () => URL.revokeObjectURL(file)`. `UploadFile` is called from a click handler that drops its return value, so the returned cleanup function is never called by anything.
- components/settings/PersonalInfoAddress.tsx:67 — the body of the `swipeToScreen` callback passed to `PersonalInfoAddressModal`. That component takes only `goBack` (`function PersonalInfoAddressModal({ goBack }: any)`) and never calls `swipeToScreen`, so the callback cannot run.
- components/settings/cards/RatingStars.tsx:4 — the default `fill = () => "#402CDD"` of `StarIcon`. The only caller (line 53-55) always passes `fill`, so the default is never used.
- components/setting/orders/OrdersListWrapper.tsx:29 — `if (loading) return;` in the `lastElementRef` callback ref. The ref element is only rendered when `!loading` (line 199), and React calls a ref callback from the render that mounted it, so the callback always runs with `loading === false`.
- components/setting/checklist/ChecklistView.tsx:59 — the early `return` in `loadMore`. The only caller is the Load more button, which is not rendered when `hasNext` is false and is `disabled={loadingMore}` while a page loads, so no click reaches the `return`.
- components/setting/profile/PersonalInfoForm.tsx:19 — `if (!email) return true` in `isValidEmail`. The only caller (line ~231) runs it as `userProfileData.email && !isValidEmail(...)`, so it is never called with an empty e-mail.
- components/setting/profile/PersonalInfoForm.tsx:243-244 — the guest branch at the start of `handleSave`. The root `div` has `onClickCapture={handleFormClick}`, which stops a guest's click in the capture phase, so Save never reaches `handleSave` for a guest (the guest case is tested through `handleFormClick`).
- components/setting/orders/confirmations/ChangeOrderItemConfirmWindow.tsx:366 — the "not enough quantity" branch of `SizeList`. It cannot run while BUG-settings-3 stands (the size stock check never disables a size).

---

## Group: utils

### Coverage bugs — group utils

### BUG-utils-1 — total_rating is NaN for a product with no final_rating
- Source: utils/pagesDataRequests/ProductPageData.ts:90 — `total_rating: Number(likeDetails?.final_rating) ?? 0`
- Scenario: the product_interactions document exists but has no `final_rating` (a product nobody rated yet).
- Expected: `total_rating` is 0.
- Actual: `Number(undefined)` is `NaN`, and `NaN ?? 0` stays `NaN` (the `??` only falls back on null/undefined). The mobile product details route sends it as `null` in JSON.
- Confirming test: tests/utils/pagesDataRequests/ProductPageData.test.ts > "BUG-utils-1: total_rating is 0, not NaN, when the product has no final_rating yet" (it.fails)

### BUG-utils-2 — formatTime prints "NaN/NaN/NaN" for a timestamp with a +hh:mm offset
- Source: utils/tinyUtils.tsx:213-218 (`formatTime`)
- Scenario: `formatTime("2020-03-04T09:30:00+03:00")` — a valid ISO/RFC3339 timestamp with an offset instead of `Z`.
- Expected: the date is read (it is valid) and printed as `dd/mm/yyyy | hh:mm:ss`.
- Actual: the string has no `Z`, so the code builds `new Date(ts + "Z")` → `"...+03:00Z"`, which is invalid. The "retry" on line 217 builds the very same invalid string again, so the result is `NaN/NaN/NaN | NaN:NaN:NaN`. The retry can never repair anything.
- Confirming test: tests/utils/tinyUtils.test.ts > "BUG-utils-2: formatTime reads a timestamp that carries a +hh:mm offset" (it.fails)

### BUG-utils-3 — UpdateProfile market rollback writes the NEW name into the app state
- Source: services/auth.ts:846-853 (`UpdateProfile`, catch block, `if (market_done)`)
- Scenario: the core-backend (market) leg of a profile save succeeds, then a later step throws. The catch re-POSTs the old `userProfile` to the core backend (correct), then builds `revertMarket` from `userObj?.name ?? userProfile?.name` — the NEW values — and writes that into the store (`editUserInfo`) and the User-Data cookie.
- Expected: the state and stored copy get the OLD name/phone, as the chat and stories rollbacks already do (see the comment above `revertChat`).
- Actual: the shopper is told the save failed, the backend holds the old name, but the app still shows the new name.
- Confirming test: tests/services/auth.profile.test.ts > "BUG-utils-3: the core-backend rollback writes the OLD name into the state, not the new one" (it.fails)

### BUG-utils-4 — GA reports every user without a "Man" gender as female
- Source: utils/gtag.ts:144 and :156 (`SetGAUser`) — `gender: user?.gender?.name === "Man" ? "male" : "female"`
- Scenario: `SetGAUser` for a user with no gender (every guest, and anyone who never filled it in).
- Expected: the gender is left out or sent as unknown.
- Actual: it is sent to Google Analytics as "female", so GA gender reports are wrong for all users who never gave a gender.
- Confirming test: tests/utils/gtag.test.ts > "BUG-utils-4: a user with no gender is not reported to GA as female" (it.fails)

### BUG-utils-5 — any new non-chat toast removes every other non-chat toast
- Source: store/notifications/reducer.ts:42-46 (`addNotification`)
- Scenario: `showSuccessNotification("Saved")`, then `showErrorNotification("Payment failed")` (or any two success/error toasts in a row).
- Expected: both toasts are on screen. The filter is there to keep one toast per chat (`chatData.channelId`).
- Actual: the filter keeps only toasts whose `chatData?.channelId !== notification.chatData?.channelId`. For two toasts without a chat both sides are `undefined`, so they are equal and the older toast is dropped. Only the newest success/error toast ever survives.
- Confirming test: tests/store/notificationsReducer.test.ts > "BUG-utils-5: a new error toast does not remove the success toast already on screen" (it.fails)

### Dead code — not tested

- services/wallet/index.ts lines 229-376 — `GetBanks`, `UploadMedia`, `CreateBankDeposit`, `CalculateFees`, `GetBankDepostits`. Proof: `rg -w "GetBanks|UploadMedia|CreateBankDeposit|CalculateFees|GetBankDepostits" --glob "!{.next,node_modules,tests}/**"` finds only their definitions in services/wallet/index.ts and docs/features/C-payments-wallet-banking/PW-02-add-funds-bank-deposit.md, which itself says "nothing calls them".
- services/story.ts lines 305-326 — `StoryService.getStoriesForProducts`. Proof: `rg getStoriesForProducts --glob "!{.next,node_modules,tests}/**"` finds only the definition, one docs page and old `_specs/` notes; no code calls it.
- store/Details/reducer.ts lines 176-501 (except `setActiveColorDetails`, which has a caller in components/Cart/index.tsx) — `storeProduct` (its only mention is a commented-out import in serverRequests/products.ts:18), `storeProductBoutique`, `setSharesCount`, `resetSelected`, `resetSelectedBack`, `applySelected`, `initFilter`, `setFilterLoading`, `filterCategory`, `filterBrand`, `filterSize`, `filterColor`, `filterPrice`, `filterPriceText`, `resetFilter`, `resetFilters`, `setActiveCameraGallery`, `showInfoMessage`, `closeInfoMessage`, `resetPrice`, `editFilter`, `filterStart`, `setActiveFilter`, `enableHandlingFilter`, `setFilterSearch`, `searchFilter`. Proof: for each name, `grep -rlw <name> app components services utils serverRequests hooks store scaling` (excluding the reducer) finds no file (the one `filterSize` hit is a local loop variable in AddToCartComponent.tsx). No other slice defines these keys. Lines 182/192 (the `colorFrom` branch of `storeProduct`) are part of this. Note: tests/store/detailsReducer.test.ts already tested `storeProduct` and `setSharesCount` before this ticket.
- store/homepage/reducer.ts line 105 (`setGAEvent`) and lines 206-236 (`addStory`). Proof: `grep -rlw "setGAEvent\|addStory" app components services utils serverRequests hooks store scaling` (excluding the reducer) finds no file; no other slice defines them. (`setActiveRoute` also has no caller, but tests/store/homepageReducer.test.ts already covered it before this ticket.)
- store/search/reducer.ts — every action except `setSearchPartialLoading`, `setSearchLoading` and `setEnableSearch`: `setResettingLoadMore`, `setTrendingSearch`, `setSearchCategory`, `setSearchBrand`, `setSearchBoutique`, `setSearchColor`, `setSearchSize`, `setSearchPrice`, `setSearchResults` (the only other hits are local `useState` setters with the same name in SelectRegion.tsx), `findProducts`, `setSearchWord`, `setFilteredColorsAndSizes`, `resetSearchFilter`, `setSearchFilters`, `setTotalSizeOfProducts`. Proof: `grep -rlw <name> app components services utils serverRequests hooks store scaling` finds no store use. (Some were already tested before this ticket.)
- store/index.ts:88 (`setCameraPermissions`) and :111 (`setHasHydrated`). Proof: `grep -rlw "setCameraPermissions\|setHasHydrated" app components hooks utils services` finds no file.
- services/localization.ts:9-10 (`GetAppCountry`). Proof: `grep -rnw GetAppCountry app components services utils hooks store` finds only the definition.
- store/listing/reducer.ts:46 (`setSkeleton`) and :65 (`resetEnd`); also `setShowedFilter`, `setLoadingProducts`, `resetListingFilter` (these three were already tested before this ticket). Proof: `grep -rlw <name> app components services utils hooks` finds no file.
- scaling/Page.tsx:44 — the `variant="full"` branch. Proof: `grep -rn 'variant="full"' app components` finds no use (only unrelated `variant="fullscreen"` props on other components); every `<Page>` uses the default "scaled".

### Cannot cover

- utils/tinyUtils.tsx:371 (`getVideoUrl`) — `transformations` is always an empty array (lines 362-365 build nothing), so `transformStr` is always "" and the `return input.replace(...)` line can never run. It is an unreachable branch inside a live function.
- services/auth.ts:855-936 (`UpdateProfile` wallet rollback) — `wallet_done` is only set by the wallet leg, which is commented out (lines 647-701). It is always false, so the block cannot run.
- services/auth.ts:1034 (`UpdateProfileImage`) — `uploadToMediaServer` always returns `{ url, durationSeconds }`, never `success`/`error`, so `!response.success && response.error` is always false.
- utils/posthog.ts:43 — `ready()` only calls `load()` after `posthogInit` has set `_inited`, and init itself stored the SDK in `_posthog`, so `load()` returns the cached value and can never throw there.
- utils/server/helpers.ts:551-558 (`removeDuplicatedCategoryTree`) — `combineCategoriesWithRelated` sets `const allowDuplicatedCategories = true`, so the call to this function is never taken and nothing else calls it.
- utils/cookies/server-scope.ts:69 — the `catch` runs only when the bare `require` of Next's work-unit storage fails. In the runner that `require` resolves (the real module loads), and a bare `require` cannot be replaced by `vi.mock`.
- utils/cookies/server-cookie-fallback.ts:49 — the success line needs a real Next request scope for `cookies()` from a bare `require("next/headers")`; outside a request `cookies()` throws, and `vi.mock` does not reach a bare `require`.
- utils/errorSerialization.ts:95 (`return String(v)`) — every `typeof` result is handled above it (undefined, null, string, number, boolean, bigint, function, symbol, object), so no value reaches this line.
- utils/fieldErrors.ts:54 — the text must start with "{" (line 45) and parse as JSON (line 49), so the result is always a non-null, non-array object; `return null` here never runs.

