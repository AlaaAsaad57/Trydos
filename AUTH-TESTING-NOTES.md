# Session renewal & backend routing — behaviour and how to check it

What the app does when a session expires, how requests are split between the two
backends, and how each of those behaviours can be observed from the outside.

> The two market backends are referred to by role: the **gateway** serves guests,
> the **core** backend serves verified (phone-confirmed) shoppers.

---

## 1. How the session works

Two cookies, both HttpOnly — page JavaScript can never read them:

- **`MARKET-TOKEN`** — the short-lived access token. The single auth cookie for guests *and* logged-in users.
- **`MARKET-REFRESH-TOKEN`** — long-lived (30 days) and **single-use**. Every renewal consumes it and issues a new one.

The two are always rotated **as a pair**, and renewal is delivered only as
cookies — no token value ever appears in a response body.

**Renewal is reactive.** Nothing is renewed on a timer or at app load, and token
expiry is never inspected locally. A renewal happens only after a request has
actually come back `401`:

1. A request gets a `401` → the refresh cookie is silently exchanged for a new pair → the request is retried. Nothing is visible to the user.
2. If the exchange fails, the request is retried once anyway — a parallel tab may already have renewed the session.
3. If that also fails, the session is torn down: one **last-chance** renewal attempt first, and if it succeeds the session simply survives. Only a genuinely dead session is cleared and replaced by a fresh guest session.

After a real teardown:

- **A verified shopper** sees the "Your session has expired" prompt, offering **Login** or **Continue as Guest**. Login opens the OTP widget with their **phone already filled in**; once the OTP succeeds they are back in their real account and cart, and the request that originally failed completes on its own — no page reload.
- **A guest** sees nothing at all. A new guest session is issued and browsing continues.

Rules that hold throughout:

- A verified shopper is **never** silently turned into an anonymous guest. If recovery needs them, they are asked.
- Chat, stories, comments and wallet sessions are **not** renewable this way — they have their own phone-verification widget.
- Logout wins over everything: for about 30 seconds after a logout, nothing may create or renew a session, so a late reply cannot resurrect it.
- Logout returns immediately; detaching the device from push notifications happens in the background afterwards.
- Only one renewal runs at a time. Ten simultaneous `401`s share a single renewal, because the refresh token can only be used once.

---

## 2. How requests are split between the backends

Decided fresh on every request — there is no stickiness:

| Request | Served by |
|---|---|
| Storefront request, user **verified** | **core** — everything, always |
| Storefront request, **guest**, endpoint on the allow-list | **gateway** |
| Storefront request, guest, endpoint not allow-listed | core |
| Seller-dashboard request | core |
| Guest registration | always gateway |
| Verify OTP/login | always core |
| Search, chat, stories, comments, wallet | their own dedicated services |

"Verified" means the stored profile carries a real phone number — a placeholder
(`0`, empty) does **not** count. Both backends share one database, so a session
issued by either is valid on both; the split only decides which one answers.

### `x-market-backend` — which backend served a request

Every proxied storefront request comes back with a response header naming the
backend that answered:

```
x-market-backend: core        # served by the core backend
x-market-backend: gateway     # served by the gateway
```

- Visible in the network tab on the `/api/proxy` request, in every environment.
- It reflects the **real** decision taken for that request, so it is the authoritative answer whenever there is any doubt: a guest should get `gateway` on allow-listed endpoints and `core` everywhere else, a verified user `core` for everything.
- Storefront traffic only. Seller-dashboard requests don't carry it (they route by endpoint alone, with no user-type branch to observe), and chat, stories, comments, wallet and search go to their own services.
- Requests made while a page is rendered on the server never reach the browser as their own request, so they carry no header. For those, non-production builds log the same decision for every market request (`[MarketRouting]`: the URL, whether the user is verified, and the chosen backend).

### The guest allow-list

Endpoints a **guest** is served by the gateway. A verified user gets **core** for
every one of them — the list is bypassed entirely once a phone is confirmed.

**Session / setup**

- `/auth/register-guest`
- `/mobile/home/currency`
- `/web/home/startingSettings`
- `/checklist` *(and anything beneath it)*
- `/web/get-colors-and-sizes`

**Cart**

- `/cart/add`
- `/cart/update`
- `/cart/remove`
- `/cart/cart_shipping`
- `/cart/cart_overview`
- `/cart/convert_to_old`
- `/old-cart/get_old_cart`
- `/old-cart/hide`

**Customer profile**

- `/customer/info`
- `/customer/update-profile`
- `/customer/update-name`
- `/customer/approve-policies`

**Notifications / device**

- `/firebase_device_tokens`
- `/firebase_device_tokens/validate_token`
- `/firebase_device_tokens/subscribe_topic`
- `/firebase_device_tokens/unsubscribe_topic`
- `/firebase_device_tokens/my_firebase_settings`
- `/firebase_device_tokens/change_country_language`
- `/firebase_device_tokens/update_whatsapp`
- `/firebase_device_tokens/update_email`
- `/firebase_device_tokens/update_firebase`
- `/firebase_device_tokens/update_notification_frequency`
- `/web/notification_types`
- `/web/notification_types/customer-notification-to-choose`

**Product detail** — matched by prefix, because the URL ends with a product slug

- `/web/product/globalDetails/<slug>`
- `/web/product/qtyPriceDetails/<slug>`
- `/web/product/product-meta/<slug>`

Matching is exact on the path (query strings ignored), so a merely similar path is
not on the list. Anything unlisted goes to **core**, for guests and verified users
alike. The list changes as endpoints migrate between backends — where it and the
`x-market-backend` header disagree, the header is right and the list is out of date.

### Response-shape differences between the two backends

The same endpoint can answer with slightly different field names depending on
which backend served it. So a value that is correct for a guest but wrong, zero or
missing for a verified user (or the reverse) is a **backend-shape** problem, not a
session problem. One known case is the platform shipping duration used in delivery
estimates, which the app normalises across both spellings. Anything that breaks
*only* after phone verification belongs to this category.

---

## 3. Checking the behaviour

Each path can be reached deliberately by editing cookies (DevTools → Application →
Cookies; HttpOnly cookies can be edited and deleted there), then triggering an
authenticated action — opening the cart, adding to cart, opening the profile.

| Situation | Setup | Expected result |
|---|---|---|
| **Silent renewal** | Corrupt or delete `MARKET-TOKEN`, keep the refresh cookie | One `401`, then the renewal succeeds, **both** cookie values change, the action completes. No prompt, no reload, nothing visible |
| **Dead session, verified shopper** | Corrupt **both** cookies | Renewal fails → teardown → "Your session has expired" prompt → Login → OTP widget with the phone pre-filled → after the OTP the original action completes and the real cart is back |
| **Dead session, guest** | Corrupt both cookies while browsing as a guest | Completely silent: new guest session, page keeps working, no prompt |
| **No refresh cookie at all** | Delete only `MARKET-REFRESH-TOKEN` | Straight to teardown. A verified user is still prompted, never silently downgraded |
| **Seller dashboard** | Corrupt both cookies on a seller page | The prompt appears (no bounce to the storefront). Login → OTP; dismissing the OTP → storefront home; "Continue as Guest" → storefront home |
| **Concurrent failures** | Corrupt the token on a page that loads storefront and chat/stories data together | Exactly one renewal and one teardown call. Whichever prompt appears first stays on screen — it is never swapped for the other while it is being answered |
| **Logout wins** | Log out, and let an authenticated request fail immediately after | No renewal, no new guest session, no cookie written |
| **Fast logout** | Log out with the chat service blocked or slow | Logout completes immediately — it must not wait |
| **Quiet start** | Just load the app | No renewal request at all. Renewal only ever follows a real `401` |
| **Backend split** | Do the same allow-listed action as a guest, then as a verified user | `x-market-backend: gateway` for the guest, `core` for the verified user — and the resulting screen is equivalent either way |
| **Allow-list accuracy** | Walk the allow-list as a guest | Every listed endpoint answers `gateway`; anything unlisted answers `core` |

Worth confirming in any of these:

1. After a successful renewal **both** cookie values are new — never just one.
2. No response body ever carries a token or refresh token; only booleans.
3. A failed renewal must **not** delete the refresh cookie — only the final teardown does.
4. Many parallel failures produce one renewal, not many.
5. A verified shopper always ends up either renewed or prompted — never quietly browsing as an anonymous guest.

---

## 4. Things that surprise people

- **Waiting is polled.** A request parked behind a prompt resumes within about half a second of the OTP succeeding, and gives up after five minutes. It is not instant.
- **Reloading during an expiry destroys the scenario.** The preserved phone number is held in memory only, and the prompt itself disappears on reload — by then the server session is already the fresh guest.
- **The phone is pre-filled only after pressing Login** on the prompt. The prompt itself shows no phone.
- **Identical in-flight requests are shared, and some reads are cached**, so an apparent "second call" may never reach the network.
- **Reads retry, writes never do.** A GET retries a few times with backoff on temporary failures (502/503/504/429); POST/PUT never retry, so a write is never duplicated.
- **Logout cancels in-flight requests** — aborted requests around a logout are expected, not failures.
- **A seller page that sits still during re-authentication is intended.** Unrelated errors no longer bounce the user to the storefront while a prompt is on screen, so the prompt survives long enough to be answered.
- **The session-expired prompt is rendered at the end of `<body>`**, outside the page's own DOM tree, and is identified by its dialog role and its label ("Your session has expired") — it has no dedicated test attribute yet.

---

## 5. When something looks broken

If **verified** users keep landing on the expired prompt while guests are fine,
the suspect is the core backend's renewal endpoint on that environment rather than
the app; the reverse pattern points at the gateway. Every renewal and teardown
failure is reported to Sentry, so a failing environment shows up there first.
