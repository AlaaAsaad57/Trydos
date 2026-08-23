# Test summary — 17 August 2026

**This round checked how we send the login code by text message, how we stop someone asking for it
too often, how the delivery time and currency are read from our two services — and everything passes.**

| | |
|---|---|
| **New checks added this time** | 95 |
| **Checks in the app in total** | 1055 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 8.8% of the code |
| **Date** | 2026-08-17 |

---

## What we checked this time

### Sending the login code — checking the phone number first

- When these checks run, then they use the real send step, not a stand-in.
- When a number is too short, then it is refused at once and no send is counted.
- When no number is given at all, then it is refused at once and no send is counted.
- When a number is only punctuation, then it is refused at once and no send is counted.
- When a number is one digit too long, then it is refused at once and no send is counted.
- When a number is absurdly long, then it is refused at once and no send is counted.
- When a number is the shortest we allow, then it is accepted and the send is counted.
- When a number is the longest we allow, then it is accepted and the send is counted.
- When a good number is typed with many spaces and dashes, then only the digits are counted.
- When a number is passed on, then spaces and symbols are removed and one plus sign is added.
- When a number passes the checks, then the request goes to the code-sending service.

### Sending the login code — what the person is told

- When the send limit is checked, then it is checked against the person the app worked out.
- When the limit says no, then the person is told and no message is sent.
- When the limit is a short wait rather than a daily cap, then the wording is different.
- When the limit gives no waiting time, then the person is still told to wait.
- When the reply carries the check id inside a wrapper, then it is found.
- When the reply carries the check id at the top, then it is found.
- When the reply has no check id, then the service's own message is shown.
- When the failure is buried in the network error, then that message is shown.
- When the service says nothing at all, then the app shows its own message.
- When something unexpected breaks, then the app returns a failure instead of crashing.
- When something unexpected breaks, then the failure is reported to us.
- When a code is sent, then that is recorded.
- When a send is refused, then it is recorded together with the reason.
- When the service rejects the send, then a failure is recorded.
- When the reply comes back with no check id, then a failure is recorded.
- When these checks run, then the real counter store is never touched.

### Stopping too many requests for a login code

- When these checks run, then they use the real limit rule, not a stand-in.
- When the counter store is not set up, then the send is allowed.
- When the counter store fails, then the send is still allowed.
- When the counter store fails, then the fault is reported instead of being hidden.
- When the store allows a send, then the waiting time it gives is passed on.
- When the store answers with a short wait, then the app calls it a cooldown.
- When the store says this visit asked too often, then the app calls it a per-visit cap.
- When the store says this connection asked too often, then the app calls it a per-address cap.
- When the store gives no waiting time, then the configured wait is used.
- When the limit is worked out, then it counts by connection address and by visit separately.
- When no limits are configured, then the documented default limits apply.
- When limits are configured, then those values are used.
- When the caller asks for its own limits, then those win.
- When these checks run, then no real counter-store client is ever created.
- When these checks run, then no connection to the counter store is ever opened.
- When these checks run, then nothing that could erase stored data is ever reached.
- When these checks run, then no real counter-store passwords are present.

### Reading the delivery settings from either of our services

- When the app looks up the platform settings, then it uses the one spelling the screens read.
- When the settings arrive from the core service, then they are found.
- When the settings arrive from the gateway service, then they are found.
- When a reply somehow carries both spellings, then the core one is used.
- When the core entry is empty, then the gateway one is used instead.
- When the settings are read, then every other setting comes back too, not only the days.
- When the settings are read, then the number of decimal places is kept as well.
- When the settings are read, then the original reply is left unchanged.
- When a reply has neither spelling, then nothing is returned.
- When there is no reply at all, then nothing is returned and nothing crashes.
- When the core entry is empty and there is no gateway one, then nothing is returned.
- When the settings entry is not a real record, then it is treated as missing.
- When the settings record is empty, then it still answers, with zero days.

### Making sense of the delivery days

- When the days arrive as a number, then they are kept as they are.
- When the days arrive as text, then they are read as a number.
- When the days are missing, then they count as zero rather than as unknown.
- When the days are empty, then they count as zero.
- When the days are text that is not a number, then they count as zero.
- When the days are an endless value, then they count as zero.
- When the days are a fraction, then they are rounded up to a whole day.
- When the days are a negative value, then they count as zero.

### What the screens end up showing

- When a core reply is stored, then the settings are saved under the name the screens read.
- When a gateway reply is stored, then its settings are saved the same way.
- When a reply is stored, then everything else in it is kept.
- When a reply is stored, then the settings never replace the rest of the reply.
- When a reply is stored, then the settings appear once, under one name.
- When a reply has no settings, then it is stored exactly as it came.
- When there is nothing to store, then nothing is stored and nothing crashes.
- When a reply is stored, then the original reply is left unchanged.
- When a signed-in shopper views delivery time, then they see the platform's days, not none.
- When a guest views delivery time, then they see the same days as before.
- When a product has its own delivery days, then the total adds up instead of showing nonsense.
- When the payment screen shows an amount, then it has a usable number of decimal places.
- When the reply carried no settings, then the screens fall back to their own default.

### Knowing which currency to show

- When the app needs a currency, then it asks the shop service for it by name.
- When the reply wraps the currency inside, then it is still read.
- When the reply uses the older flat shape, then it is still read.
- When the wrapped currency is empty, then the flat one is used instead.
- When the service refuses, then nothing comes back and the problem is reported.
- When the request itself fails, then the app carries on instead of crashing.
- When the reply succeeds but carries no currency, then it is treated as a failure.

### Faults the earlier checks recorded, now fixed

- When a country price has no saved full price, then the crossed-out price is worked out from it.
- When the saved extra charge is zero, then it counts as no charge at all.
- When an older filter link passes filters as a plain record, then they are read, not ignored.
- When a picture comes from an upload record, then it keeps the slash it needs and loads.
- When a picture address is built from an upload record, then the missing slash is added.
- When the currency has not loaded yet, then a price still shows instead of "NaNM".
- When a video is already hosted elsewhere, then its address is left alone and works.
- When a video address is built with no options at all, then it works instead of failing.

### Which services the app may call through itself

- When a service name is empty, then it is refused.
- When a service name has a stray space at the end, then it is refused.

Another 1 check keeps the testing setup itself honest — it protects the tests, not the app,
so it is counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 2456 | 27904 | 8.8% |
| Decision points | 1847 | 25133 | 7.3% |
| Functions | 392 | 7128 | 5.5% |

Of 726 files in the app, 20 have a test of their own, 56 are only touched because a tested file
uses them, and 650 have nothing at all.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Landing on the right language and country — proxy.ts | 100.0% |
| Signed-in requests to the services — HandleAuthedFetch.ts | 100.0% |
| Fetching data on the server — ServerFetch.tsx | 100.0% |
| Not asking the same thing twice — requestDedup.ts | 100.0% |
| What the app remembers about the signed-in person — auth reducer | 100.0% |
| Shared helpers: prices, dates, translations — functions.tsx | 100.0% |
| Login-code waiting times — otpLocks.ts | 100.0% |
| Delivery time and decimal places — startingSettings.ts | 100.0% |
| Keeping a session alive — authRefresh.ts | 100.0% |
| Recording every login-code attempt — otpTelemetry.ts | 100.0% |
| Which services may be called — tokenManager.ts | 98.9% |
| Fetching data in the browser — fetchData.ts | 98.7% |
| Who a login-code attempt belongs to — otpIdentity.ts | 98.4% |
| Reporting errors safely — errorSerialization.ts | 97.4% |
| Sending the login code — sendOtp.ts | 97.3% |
| Filters on a product list — filterItemState.ts | 97.0% |
| Pictures, videos and prices on the server — server helpers | 95.6% |
| Small shared helpers — tinyUtils.tsx | 63.8% |
| Search prices and sorting — elastic helpers | 51.8% |
| Stopping too many login-code requests — the limiter | 19.3% |

### Reading these numbers

- **What is checked well:** the login-code flow end to end, the way we talk to both services, and
  the shared helpers for prices, dates and delivery time.
- **What has nothing yet:** the screens people see, and the pages and API routes behind them — 0.1%
  and 0.0% checked.
- **What "checked" does not mean:** a checked line is one a test ran. It does not prove the
  behaviour is what the business wants, and it says nothing about how the app looks or feels.
<!-- test-index v1 — written by the test-summary skill. Do not edit by hand.
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'address': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'address': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'cart item': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'cart item': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'cart': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'cart': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'chat message': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'chat message': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'chat user': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'chat user': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'listing product': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'listing product': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order line': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order line': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'search-engine hit': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'search-engine hit': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'search-engine product': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'search-engine product': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'search-engine response': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'search-engine response': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'story item': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'story item': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'story': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'story': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'user': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'user': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — overrides applies an override that is an empty value, null, or zero
tests/fixtures/fixtures.test.ts :: test fixtures — overrides builds an order whose address and lines are real fixtures
tests/fixtures/fixtures.test.ts :: test fixtures — overrides changes only the fields it is given
tests/fixtures/fixtures.test.ts :: test fixtures — overrides does not change the object a later call returns
tests/fixtures/fixtures.test.ts :: test fixtures — overrides keeps a nested override whole rather than merging it
tests/fixtures/fixtures.test.ts :: test fixtures — overrides keeps the search-engine response's total in step with its hits
tests/fixtures/fixtures.test.ts :: test fixtures — overrides lets a caller replace the product inside a search-engine hit
tests/mocks/mocks.test.ts :: cookie stand-in — the copied names reads and writes its own jar instead of a real cookie store
tests/mocks/mocks.test.ts :: cookie stand-in — the copied names still matches every name in the real cookie manager
tests/mocks/mocks.test.ts :: fake network hands back a failure as well as a success
tests/mocks/mocks.test.ts :: fake network hands back queued replies in order
tests/mocks/mocks.test.ts :: fake network lets a test add a reply while it is running
tests/mocks/mocks.test.ts :: fake network raises a clear error naming the address when the queue runs out
tests/mocks/mocks.test.ts :: fake network records the count, address, method and body of every call
tests/mocks/mocks.test.ts :: store stand-in — a module that loads the store late gives each call its own state, so nothing leaks between tests
tests/mocks/mocks.test.ts :: store stand-in — a module that loads the store late holds no state the real store does not have
tests/mocks/mocks.test.ts :: store stand-in — a module that loads the store late reaches utils/fetchData.ts, which imports the store inside the call
tests/msw/msw.test.ts :: the fake network answers a backend path by reading the x-proxy-url header
tests/msw/msw.test.ts :: the fake network answers a relative address, the way the app asks for one
tests/msw/msw.test.ts :: the fake network answers a same-origin route the app asks for directly
tests/msw/msw.test.ts :: the fake network hands the reply the decoded service name, not the wire token
tests/msw/msw.test.ts :: the fake network has forgotten the override by the next test
tests/msw/msw.test.ts :: the fake network ignores the query string when matching a backend path
tests/msw/msw.test.ts :: the fake network lets one test override a reply without touching the others
tests/msw/msw.test.ts :: the fake network refuses a backend path nobody wrote a reply for
tests/proxy.test.ts :: choosing the country (AC-3) accepts a supported country whatever letter case the request's own country arrives in
tests/proxy.test.ts :: choosing the country (AC-3) accepts a supported country whatever letter case the saved values arrive in
tests/proxy.test.ts :: choosing the country (AC-3) ignores the saved pair when the saved language is not supported
tests/proxy.test.ts :: choosing the country (AC-3) prefers the country the request comes from over the default
tests/proxy.test.ts :: choosing the country (AC-3) prefers the saved country over the one the request appears to come from
tests/proxy.test.ts :: choosing the country (AC-3) reads the language from the `language` cookie when `lang` is missing
tests/proxy.test.ts :: choosing the country (AC-3) refuses a saved country it does not support and uses the default gb
tests/proxy.test.ts :: choosing the country (AC-3) treats iq from the built-in fallback list as supported
tests/proxy.test.ts :: choosing the country (AC-3) treats lb from the built-in fallback list as supported
tests/proxy.test.ts :: choosing the country (AC-3) treats sy from the built-in fallback list as supported
tests/proxy.test.ts :: choosing the country (AC-3) treats tr from the built-in fallback list as supported
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) falls back to English when no preference is sent at all
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) falls back to English when the preference names only unsupported languages
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) keeps ar when the address already names it
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) keeps en when the address already names it
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) keeps ku when the address already names it
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) keeps tr when the address already names it
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) refuses a language it does not support and falls back to English
tests/proxy.test.ts :: choosing the language (AC-1, AC-2) uses the browser's stated preference when the address has no language
tests/proxy.test.ts :: crawlers (AC-7) gives a crawler without a pair a permanent redirect to one
tests/proxy.test.ts :: crawlers (AC-7) lets Googlebot/2.1 (+http://www.google.com/bot.html) through when the address already has a valid pair
tests/proxy.test.ts :: crawlers (AC-7) lets LinkedInBot/1.0 through when the address already has a valid pair
tests/proxy.test.ts :: crawlers (AC-7) lets Mozilla/5.0 (compatible; bingbot/2.0) through when the address already has a valid pair
tests/proxy.test.ts :: crawlers (AC-7) lets Twitterbot/1.0 through when the address already has a valid pair
tests/proxy.test.ts :: crawlers (AC-7) lets facebookexternalhit/1.1 through when the address already has a valid pair
tests/proxy.test.ts :: crawlers (AC-7) never adds a country-change or no-country marker for a crawler
tests/proxy.test.ts :: crawlers (AC-7) sends a crawler asking for the site root to a locale address
tests/proxy.test.ts :: crawlers (AC-7) sends a crawler on an unsupported prefix to a supported address
tests/proxy.test.ts :: crawlers (AC-7) treats an ordinary browser as a person, not a crawler
tests/proxy.test.ts :: crawlers (AC-7) writes no locale cookies for a crawler
tests/proxy.test.ts :: passing through or redirecting (AC-4) does not double the prefix when the bounce limit is reached either
tests/proxy.test.ts :: passing through or redirecting (AC-4) handles the site root, where there is no path to keep
tests/proxy.test.ts :: passing through or redirecting (AC-4) lets a request with a valid pair through untouched
tests/proxy.test.ts :: passing through or redirecting (AC-4) never rewrites — every answer is a pass-through or a redirect
tests/proxy.test.ts :: passing through or redirecting (AC-4) puts the pair in front of the path and keeps the rest of the address
tests/proxy.test.ts :: passing through or redirecting (AC-4) sends a returning visitor from the site root to their saved locale
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps a locale-shaped prefix it does not support for the default, without doubling it (/gb-fr/shop)
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps a locale-shaped prefix it does not support for the default, without doubling it (/xx-en/shop)
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps an unsupported prefix that has nothing after it
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps an unsupported prefix written in capitals
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /gb-en/sitemap-products.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /lb-en/sitemap.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /sitemap-products.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /sitemap.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) still lets a sitemap through when the saved country disagrees with the address
tests/proxy.test.ts :: the bounce limit (AC-6) lands on a bare default address when the bounce limit is reached at the site root
tests/proxy.test.ts :: the bounce limit (AC-6) still bounces while the count is within the limit
tests/proxy.test.ts :: the bounce limit (AC-6) stops bouncing after the allowed number and lands on a default address
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) clears the logout marker on a real page render
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) does not save the referring site when the visit came from this same site
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) does not write the IP again when it has not changed
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) does not write the locale cookies again when they already match the address
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) keeps the logout marker on a redirect hop
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) saves the IP the request really came from
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) saves the language from the address when only the language differs from the saved one
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) saves the referring site anyway when the visit carries a campaign marker
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) saves the referring site when the visit really came from somewhere else
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) takes the cookie lifetime from the setting when one is given
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) writes the three locale cookies so the browser can read them
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) writes the visitor's IP address so page scripts cannot read it
tests/proxy.test.ts :: the country popup markers drops the timestamp marker on its way to a redirect
tests/proxy.test.ts :: the country popup markers honours the choice on the next hop, once the address has a pair
tests/proxy.test.ts :: the country popup markers puts the visitor on a proper address when the choice arrives with no pair
tests/proxy.test.ts :: the country popup markers redirects to the cleaned address when other query values are left
tests/proxy.test.ts :: the country popup markers shows the popup instead of redirecting when the no-country marker is on the address
tests/proxy.test.ts :: the country popup markers takes the visitor's choice and stops asking
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) runs on /
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) runs on /checkout
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) runs on /gb-en/product/123
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) runs on /gb-en/shop
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) skips a request the router made in the background
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /_next/image
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /_next/static/chunk.js
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /api/auth/login
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /favicon.ico
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /images/logo.png
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /robots.txt
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /sitemap.xml
tests/proxy.test.ts :: the paths the proxy runs on (AC-11) stays out of /translations/translations.ar.js
tests/proxy.test.ts :: the robots address and the lower-case redirect (AC-10) does not hijack a page whose name merely contains the word robots
tests/proxy.test.ts :: the robots address and the lower-case redirect (AC-10) does not put the connection-warming headers on that redirect
tests/proxy.test.ts :: the robots address and the lower-case redirect (AC-10) permanently redirects a pair with a capital letter to the lower-case form
tests/proxy.test.ts :: the robots address and the lower-case redirect (AC-10) still puts the connection-warming headers on a real page
tests/proxy.test.ts :: the robots address and the lower-case redirect (AC-10) still sends /robots itself to the robots file
tests/proxy.test.ts :: the robots address and the lower-case redirect (AC-10) still sends /robots.txt itself to the robots file
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) forgets everything between tests, so the test before this one changed nothing
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) keeps the built-in list when the lookup answers with an error
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) keeps the built-in list when the lookup answers without a countries list
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) keeps working when the lookup fails, using the built-in fallback list
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) remembers the answer within one loaded copy and asks only once
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) sends the country the request came from with the lookup
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) starts the country lookup in the background and nothing else
tests/proxy.test.ts :: when the saved country differs from the address (AC-5) handles the locale root with a trailing slash
tests/proxy.test.ts :: when the saved country differs from the address (AC-5) lets the request through once the country-change marker is already on the address
tests/proxy.test.ts :: when the saved country differs from the address (AC-5) raises the country-change marker naming both countries instead of switching silently
tests/proxy.test.ts :: when the saved country differs from the address (AC-5) sends the visitor to the saved country when the address says gb
tests/render.test.tsx :: a real component through the helper renders EmptyCart in Arabic
tests/render.test.tsx :: a real component through the helper renders EmptyCart in English
tests/render.test.tsx :: renderWithProviders answers the route hooks with the locale it was given
tests/render.test.tsx :: renderWithProviders gives components the real store, not a flat copy of its state
tests/render.test.tsx :: renderWithProviders goes back to the default route between tests
tests/render.test.tsx :: renderWithProviders leaves English copy alone
tests/render.test.tsx :: renderWithProviders makes no network call of its own
tests/render.test.tsx :: renderWithProviders puts seeded store state on the page
tests/render.test.tsx :: renderWithProviders puts the browser on the same address the hooks report
tests/render.test.tsx :: renderWithProviders re-renders a component when the store changes under it
tests/render.test.tsx :: renderWithProviders records where a component sent the user
tests/render.test.tsx :: renderWithProviders renders translated copy for the chosen language
tests/render.test.tsx :: renderWithProviders starts from a clean store, so the last test does not leak in
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number accepts the longest allowed number and consults the limiter
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number accepts the shortest allowed number and consults the limiter
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number counts digits, so heavy punctuation does not push a valid number over
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number refuses an absurdly long run of digits without consulting the limiter
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number refuses nothing at all without consulting the limiter
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number refuses one digit too many without consulting the limiter
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number refuses only punctuation without consulting the limiter
tests/serverActions/sendOtp.test.ts :: a number that cannot be a number refuses too few digits without consulting the limiter
tests/serverActions/sendOtp.test.ts :: nothing real was touched still has the suite-wide stand-in for the cache layer
tests/serverActions/sendOtp.test.ts :: the identity the limiter is asked about is the identity the action resolved
tests/serverActions/sendOtp.test.ts :: the number it passes on sends it to the send-OTP endpoint on the core backend
tests/serverActions/sendOtp.test.ts :: the number it passes on strips everything that is not a digit and adds a single plus
tests/serverActions/sendOtp.test.ts :: the real action is what is under test loaded the real action, not the run-wide stand-in
tests/serverActions/sendOtp.test.ts :: what is recorded about every attempt records a failure when the backend rejected it
tests/serverActions/sendOtp.test.ts :: what is recorded about every attempt records a failure when there was no id at all
tests/serverActions/sendOtp.test.ts :: what is recorded about every attempt records a refusal, with the reason it was refused for
tests/serverActions/sendOtp.test.ts :: what is recorded about every attempt records a send that went out
tests/serverActions/sendOtp.test.ts :: when something unexpected breaks reports the failure
tests/serverActions/sendOtp.test.ts :: when something unexpected breaks returns a failed result instead of throwing
tests/serverActions/sendOtp.test.ts :: when the backend answers digs the message out of the transport's error text
tests/serverActions/sendOtp.test.ts :: when the backend answers falls back to its own words when the backend gives none
tests/serverActions/sendOtp.test.ts :: when the backend answers finds the verification id at the top level
tests/serverActions/sendOtp.test.ts :: when the backend answers finds the verification id nested under data
tests/serverActions/sendOtp.test.ts :: when the backend answers passes the backend's message through when there is no verification id
tests/serverActions/sendOtp.test.ts :: when the limiter refuses reports the refusal and never calls the backend
tests/serverActions/sendOtp.test.ts :: when the limiter refuses says something different for a cooldown than for a cap
tests/serverActions/sendOtp.test.ts :: when the limiter refuses still reports a wait when the limiter gives no lock time
tests/serverRequests/HandleAuthedFetch.test.ts :: a recovery that breaks unexpectedly reports the fault and hands back the original rejection
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) creates one guest identity, clears the old one, and retries once
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) leaves every existing cookie alone when creating a guest fails (AC-10)
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) leaves every existing cookie alone when creating a guest returns no credential (AC-10)
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) probes with a throwaway cookie when there is no token to re-write
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) stops after one retry when the retry is rejected too (AC-9)
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) stores only what a sparse guest reply actually carries
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) stores the new pair hidden from the browser, with the refresh cookie living longer
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a verified shopper with no refresh credential (AC-7) gives the rejection back rather than replacing the account with a guest
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection where cookies cannot be written (AC-4) hands the rejection back and spends nothing single-use
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection while signing out (AC-3) hands the rejection back and mints nothing at all
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection with a refresh credential (AC-5, AC-6) exchanges it exactly once and retries exactly once
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection with a refresh credential (AC-5, AC-6) gives the rejection back when the exchange does not succeed, and does not fall through to a guest
tests/serverRequests/HandleAuthedFetch.test.ts :: a request that works (AC-1, AC-2) carries the shopper's token and hands the answer back untouched
tests/serverRequests/HandleAuthedFetch.test.ts :: a request that works (AC-1, AC-2) still sends the request when there is no token, without an identity header
tests/serverRequests/ServerFetch.test.ts :: a call that fails for good (AC-11) gives up at once on a status that will not improve
tests/serverRequests/ServerFetch.test.ts :: a call that fails for good (AC-11) keeps the reported body short even when the server is talkative
tests/serverRequests/ServerFetch.test.ts :: a call that fails for good (AC-11) reports the failure with its status and address
tests/serverRequests/ServerFetch.test.ts :: a call that works (AC-11) drops the content type when the body is a file upload
tests/serverRequests/ServerFetch.test.ts :: a call that works (AC-11) passes the country and the language on, taken apart from one setting
tests/serverRequests/ServerFetch.test.ts :: a call that works (AC-11) returns the body and the status, and never retries
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) backs off further each time, and never past one second
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) retries a 429 up to the limit, then reports it
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) retries a 502 up to the limit, then reports it
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) retries a 503 up to the limit, then reports it
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) retries a 504 up to the limit, then reports it
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) retries when the connection itself fails, then gives a zero status
tests/serverRequests/ServerFetch.test.ts :: a call worth trying again (AC-11) stops retrying as soon as one attempt works
tests/serverRequests/radis/index.test.ts :: nothing real was touched has no cache credentials in the environment
tests/serverRequests/radis/index.test.ts :: nothing real was touched never asked to open a connection
tests/serverRequests/radis/index.test.ts :: nothing real was touched never built a cache client
tests/serverRequests/radis/index.test.ts :: nothing real was touched never reached a destructive operation
tests/serverRequests/radis/index.test.ts :: the identity it asks about keys the cooldown and the counter on the address, and the set on the session
tests/serverRequests/radis/index.test.ts :: the limits it applies lets the caller override them
tests/serverRequests/radis/index.test.ts :: the limits it applies uses the configured values when they are set
tests/serverRequests/radis/index.test.ts :: the limits it applies uses the documented defaults when nothing is configured
tests/serverRequests/radis/index.test.ts :: the real module is what is under test loaded the real limiter, not the run-wide stand-in
tests/serverRequests/radis/index.test.ts :: what the store's answer is turned into falls back to the configured cooldown when no lock time comes back
tests/serverRequests/radis/index.test.ts :: what the store's answer is turned into passes an allowed send through with the lock time it was given
tests/serverRequests/radis/index.test.ts :: what the store's answer is turned into turns status 1 into cooldown
tests/serverRequests/radis/index.test.ts :: what the store's answer is turned into turns status 2 into session_cap
tests/serverRequests/radis/index.test.ts :: what the store's answer is turned into turns status 3 into ip_cap
tests/serverRequests/radis/index.test.ts :: when the counter store fails allows the send
tests/serverRequests/radis/index.test.ts :: when the counter store fails reports the failure instead of swallowing it
tests/serverRequests/radis/index.test.ts :: when there is no counter store allows the send and says so
tests/serverRequests/requestDedup.test.ts :: the same work asked for twice (AC-29) hands the second caller the very same work, not a copy of the answer
tests/serverRequests/requestDedup.test.ts :: the same work asked for twice (AC-29) keeps different work apart
tests/serverRequests/requestDedup.test.ts :: the same work asked for twice (AC-29) runs it once and gives both callers the same answer
tests/serverRequests/requestDedup.test.ts :: the same work asked for twice (AC-29) starts again on the next request
tests/serverRequests/requestDedup.test.ts :: the same work asked for twice (AC-29) still shares when the second caller arrives after the work has finished
tests/serverRequests/requestDedup.test.ts :: the same work asked for twice (AC-29) tells apart two keys that only differ at the end
tests/serverRequests/requestDedup.test.ts :: when the shared work fails (AC-30) fails every caller that joined it
tests/serverRequests/requestDedup.test.ts :: when the shared work fails (AC-30) lets the next caller try again instead of handing on the failure
tests/serverRequests/requestDedup.test.ts :: when the shared work fails (AC-30) lets the next request try again after a failure
tests/serverRequests/requestDedup.test.ts :: when the shared work fails (AC-30) stops holding a key open once its work has failed
tests/services/auth.otp.test.ts :: sending a code falls back to the documented default cooldown when the server names none (AC-2)
tests/services/auth.otp.test.ts :: sending a code records the verification id, starts the cooldown the server asked for, and counts the number (AC-1)
tests/services/auth.otp.test.ts :: sending a code reports, calls the caller's error hook and raises when the send never reaches the server — and starts no cooldown (AC-4)
tests/services/auth.otp.test.ts :: sending a code still starts the cooldown when the send is refused with one, and reports the refusal (AC-3)
tests/services/auth.otp.test.ts :: verifying a changed number carries the code and the verification id to the call (AC-12)
tests/services/auth.otp.test.ts :: verifying a changed number encodes the code and the verification id into the query (AC-12)
tests/services/auth.otp.test.ts :: verifying a changed number fails WITHOUT marking the phone verified when the reply carries no token (AC-12)
tests/services/auth.otp.test.ts :: verifying a changed number marks the phone verified, mirrors it to the profile copy, and returns the one-time token (AC-12)
tests/services/auth.otp.test.ts :: verifying a changed number shows its own wording, never a raw internal error (AC-12)
tests/services/auth.otp.test.ts :: verifying a code does not report a mapping when the shopper was already this user (AC-7)
tests/services/auth.otp.test.ts :: verifying a code leaves a message and spends NO attempt when the user is unknown (AC-9)
tests/services/auth.otp.test.ts :: verifying a code releases the re-verification wait and clears the prompt marker (AC-6)
tests/services/auth.otp.test.ts :: verifying a code reports a failed verification with the flow it was opened from (AC-11)
tests/services/auth.otp.test.ts :: verifying a code reports back whether the account already existed, and under what name (AC-8)
tests/services/auth.otp.test.ts :: verifying a code reports the guest-to-user mapping only when the id actually changed (AC-7)
tests/services/auth.otp.test.ts :: verifying a code shows the refusal and raises when the server rejects the code outright (AC-10)
tests/services/auth.otp.test.ts :: verifying a code spends an attempt and flags the failure on a wrong code (AC-10)
tests/services/auth.otp.test.ts :: verifying a code writes all four service records, each marked verified (AC-5)
tests/services/auth.profile.test.ts :: picture paths (AC-27) adds the folder for the stored copy, and leaves an empty value as it is
tests/services/auth.profile.test.ts :: picture paths (AC-27) leaves a value that is already in the target form alone
tests/services/auth.profile.test.ts :: picture paths (AC-27) reports nothing for an empty value on the service side
tests/services/auth.profile.test.ts :: picture paths (AC-27) strips the folder for the market and adds it for the other services
tests/services/auth.profile.test.ts :: renaming (AC-23) puts the old name back and says so when a service refuses it
tests/services/auth.profile.test.ts :: renaming (AC-23) writes the new name to the state and to all three profile copies before any request
tests/services/auth.profile.test.ts :: updating the profile does not roll back a leg that never ran (AC-25)
tests/services/auth.profile.test.ts :: updating the profile looks up the missing service records before running the legs (AC-26)
tests/services/auth.profile.test.ts :: updating the profile puts every completed leg back when a later one fails, and tells the shopper once (AC-25)
tests/services/auth.profile.test.ts :: updating the profile sends the picture path in the form each service expects (AC-24)
tests/services/auth.profile.test.ts :: updating the profile skips a leg the shopper has no record for (AC-24)
tests/services/auth.profile.test.ts :: updating the profile writes both the shared state and that service's own copy, for each leg (AC-24)
tests/services/auth.profile.test.ts :: uploading a picture refuses to run when the upload is not configured (AC-28)
tests/services/auth.profile.test.ts :: uploading a picture reports a failure rather than a picture when the upload is refused (AC-28)
tests/services/auth.profile.test.ts :: uploading a picture reports the failure rather than raising when a refused upload's reply cannot be read (AC-29)
tests/services/auth.profile.test.ts :: uploading a picture reports where the picture was stored (AC-28)
tests/services/auth.session.test.ts :: concurrent expiry (AC-22) attempts nothing while a logout is running (AC-13)
tests/services/auth.session.test.ts :: concurrent expiry (AC-22) releases the cycle so a later expiry can run again
tests/services/auth.session.test.ts :: concurrent expiry (AC-22) restores the registering flag whichever way the cycle ends
tests/services/auth.session.test.ts :: concurrent expiry (AC-22) shares one cycle and hands both callers the same outcome
tests/services/auth.session.test.ts :: exchanging a dying session asks for a plain exchange when it is given no request to name (AC-16)
tests/services/auth.session.test.ts :: exchanging a dying session attempts nothing at all while a logout is running (AC-13)
tests/services/auth.session.test.ts :: exchanging a dying session does not report a refresh when the server answers successfully but says nothing (AC-14)
tests/services/auth.session.test.ts :: exchanging a dying session names the request when it is given one (AC-16)
tests/services/auth.session.test.ts :: exchanging a dying session passes on the server's own "not eligible" (AC-14)
tests/services/auth.session.test.ts :: exchanging a dying session reports a refresh only when the server answers successfully AND says it refreshed (AC-14)
tests/services/auth.session.test.ts :: exchanging a dying session treats a network failure as eligible-but-not-refreshed, so the caller falls through to the expiry flow (AC-15)
tests/services/auth.session.test.ts :: the expiry cycle, when the session is gone arms the log-in-again prompt and keeps the phone for it (AC-19)
tests/services/auth.session.test.ts :: the expiry cycle, when the session is gone cancels a guest session silently, with no prompt (AC-20)
tests/services/auth.session.test.ts :: the expiry cycle, when the session is gone does not keep a placeholder phone (AC-19)
tests/services/auth.session.test.ts :: the expiry cycle, when the session is gone never replaces a re-verification that is already armed (AC-21)
tests/services/auth.session.test.ts :: the expiry cycle, when the session is gone skips the request entirely when asked to (AC-20)
tests/services/auth.session.test.ts :: the expiry cycle, when the session survives does NOT release a re-verification that is already on screen (AC-18)
tests/services/auth.session.test.ts :: the expiry cycle, when the session survives ends the cycle without cancelling what the renewal just saved, and releases waiters (AC-17)
tests/services/auth.session.test.ts :: the expiry cycle, when the session survives sends the shopper's country and language with the request (AC-17)
tests/services/authRefreshSession.test.ts :: RefreshSession dedup does NOT share a chat refresh with a stories refresh
tests/services/authRefreshSession.test.ts :: RefreshSession dedup does NOT share a market refresh with a chat refresh
tests/services/authRefreshSession.test.ts :: RefreshSession dedup does NOT share a market refresh with a stories refresh
tests/services/authRefreshSession.test.ts :: RefreshSession dedup market and market-dashboard share one exchange (same token pair)
tests/services/authRefreshSession.test.ts :: RefreshSession dedup never refreshes while logging out
tests/services/authRefreshSession.test.ts :: RefreshSession dedup releases the key so a later 401 on the same service can refresh again
tests/services/authRefreshSession.test.ts :: RefreshSession dedup shares one round trip for concurrent 401s on the SAME service
tests/services/elastic/helpers.test.ts :: asking the search server for the right fields (getSourceFields) adds the heavy fields back for the phone app
tests/services/elastic/helpers.test.ts :: asking the search server for the right fields (getSourceFields) asks for both price shapes, so a country price can be read
tests/services/elastic/helpers.test.ts :: asking the search server for the right fields (getSourceFields) leaves the heavy fields out for the website
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) keeps only the wording in the shopper's language
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) reports the price band across everything it collected
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) skips a product with no wording at all
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) skips a product with nothing written in the shopper's language
tests/services/elastic/helpers.test.ts :: finding the products inside a chosen price band (buildCountryAwarePriceRangeCondition) does not fall over when the product has no country prices at all
tests/services/elastic/helpers.test.ts :: finding the products inside a chosen price band (buildCountryAwarePriceRangeCondition) looks at the country's own price first and the ordinary one otherwise
tests/services/elastic/helpers.test.ts :: finding the products inside a chosen price band (buildCountryAwarePriceRangeCondition) matches on the ordinary price when no country was asked for
tests/services/elastic/helpers.test.ts :: finding the products inside a chosen price band (buildCountryAwarePriceRangeCondition) treats a band with only a lower end as that one price
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) always ends on the same tie-breaker, so paging never repeats a product
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) falls back to best match for an order it does not know
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) falls back to best match when no order was asked for
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) keeps a product with no name in the shopper's language at the end, either way
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) orders by date, newest or oldest first
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) orders by how much has sold when the shopper asks for best selling
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) orders by price, cheapest or dearest first
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) orders by the name in the shopper's own language
tests/services/elastic/helpers.test.ts :: putting a listing in order (buildSortClause) survives a field the search server has never been told about
tests/services/elastic/helpers.test.ts :: putting the chosen colour first does not change the list it was given
tests/services/elastic/helpers.test.ts :: putting the chosen colour first leaves a product's pictures alone when it has none of the chosen colours
tests/services/elastic/helpers.test.ts :: putting the chosen colour first leaves the colours alone when none was chosen
tests/services/elastic/helpers.test.ts :: putting the chosen colour first leaves the pictures alone when no colour was chosen
tests/services/elastic/helpers.test.ts :: putting the chosen colour first moves the chosen colour to the front of the product's colours
tests/services/elastic/helpers.test.ts :: putting the chosen colour first moves the chosen colour's pictures to the front
tests/services/elastic/helpers.test.ts :: taking money off a price (calculateDiscountedPrice) never lets a discount take a price below zero
tests/services/elastic/helpers.test.ts :: taking money off a price (calculateDiscountedPrice) takes a fixed amount off for a flat discount
tests/services/elastic/helpers.test.ts :: taking money off a price (calculateDiscountedPrice) takes a share off for a percentage discount
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel does not tell the page when a banner was deleted
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel lists a category's children alongside the category itself
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel shows no banner when the boutique has none
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel shows ten filters per page
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel shows the boutique's first banner that has not been deleted
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel shows the brand's name and logo when the details came back
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel shows the first page rather than nothing when the page number is wrong
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel still lists a boutique whose details are missing, with its count
tests/services/elastic/helpers.test.ts :: the filter lists in the side panel still lists a brand whose details are missing, with its count
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) adds the country's extra charge to the full price
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) falls back to the older extra-charge shape
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) never lets a country's charge push the full price below zero
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) still treats a stored charge of zero as no charge at all
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) uses the ordinary full price when no country was asked for
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) uses the ordinary full price when there are no country prices
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) works the charge out from the country price when none is stored
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) adds the country's extra charge when only the older shape is stored
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) falls back to the full price when there is no offer price
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) ignores a country price entry with no country on it
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) ignores a country price that is not a number
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) ignores country prices stored as text that cannot be read
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) ignores the country prices of every other country
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) keeps the last entry when a country is listed twice
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) matches the country however it is written
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) reads the country prices when they arrive as text rather than a list
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) uses the country's own price when there is one
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) uses the ordinary price when no country was asked for
tests/services/elastic/helpers.test.ts :: the price a shopper in one country pays (resolveOfferPriceForCountry) uses the ordinary price when the product has no country prices
tests/services/elastic/helpers.test.ts :: the price band shown on a listing (calculatePriceRange) ignores a product with no price at all
tests/services/elastic/helpers.test.ts :: the price band shown on a listing (calculatePriceRange) offers no bands when every product costs the same
tests/services/elastic/helpers.test.ts :: the price band shown on a listing (calculatePriceRange) reports the cheapest and dearest products on the page
tests/services/elastic/helpers.test.ts :: the price band shown on a listing (calculatePriceRange) reports zero when there are no products
tests/services/elastic/helpers.test.ts :: the price band shown on a listing (calculatePriceRange) splits the band into four bands the shopper can pick from
tests/services/elastic/helpers.test.ts :: the price band shown on a listing (calculatePriceRange) uses the country's prices when a country was asked for
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) adds the two counts together where the price steps line up
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) falls back to a step of one when every product costs the same
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) gives an empty distribution back when nothing matched
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) gives every price card roughly the same number of products
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) merges the ordinary prices and the country prices into one span
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) offers a single card when there is only one product
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) offers five cards unless told otherwise
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) offers no cards when there is nothing to show
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) puts the price steps in order, cheapest first
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) reports zero when nothing matched at all
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) runs the cards from the cheapest product to the dearest
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) splits the whole price span into a fixed number of steps
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) stays balanced when nearly every product sits in one wide band
tests/services/elastic/helpers.test.ts :: the price slider and the price cards (the whole-catalog figures) uses whichever of the two has products in it
tests/services/elastic/helpers.test.ts :: tidying the pictures on a card (normalizeCustomProducts) does nothing when there are no products to tidy
tests/services/elastic/helpers.test.ts :: tidying the pictures on a card (normalizeCustomProducts) drops the picture sets for colours the product no longer has
tests/services/elastic/helpers.test.ts :: tidying the pictures on a card (normalizeCustomProducts) reads the picture sets when they arrive as text rather than a list
tests/services/elastic/helpers.test.ts :: tidying the pictures on a card (normalizeCustomProducts) says plainly whether a colour is a trending one
tests/services/elastic/helpers.test.ts :: tidying the pictures on a card (normalizeCustomProducts) turns a picture name into an address the page can load
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) ignores a flash deal that was switched off
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) marks a flash deal as finished once its end date has passed
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) marks a flash deal as running when today falls inside its dates
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) marks the product as in stock only when there is stock
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) shows both the price paid and the price struck through
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) shows the reward price only when the product has one
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) takes the brand written in the shopper's language
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) treats a brand as unverified unless the record says otherwise
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) uses the country's prices when a country was asked for
tests/setup.test.tsx :: the render setup adds the page checks to expect
tests/setup.test.tsx :: the render setup drives a click through user-event
tests/setup.test.tsx :: the render setup takes the last test's markup off the page first
tests/setup.test.tsx :: the server boundary hands back a limiter that allows the send
tests/setup.test.tsx :: the server boundary never loads the real cache layer
tests/store/auth/reducer.test.ts :: cancelAuth (AC-30) clears every record when the cancellation is not an expiry
tests/store/auth/reducer.test.ts :: cancelAuth (AC-30) keeps the shopper's records and marks them unverified when the session expired
tests/store/auth/reducer.test.ts :: cancelAuth (AC-30) leaves an already-empty session empty rather than inventing records
tests/store/auth/reducer.test.ts :: cancelAuth (AC-30) resets the attempt counter and the message on both routes
tests/store/auth/reducer.test.ts :: failed attempts (AC-32) flags the failure and spends one attempt
tests/store/auth/reducer.test.ts :: failed attempts (AC-32) stops at zero rather than going negative
tests/store/auth/reducer.test.ts :: notification topics (AC-33) adds one topic and leaves the rest alone
tests/store/auth/reducer.test.ts :: notification topics (AC-33) keeps the other notification settings untouched
tests/store/auth/reducer.test.ts :: notification topics (AC-33) removes only the topic it is given
tests/store/auth/reducer.test.ts :: renaming (AC-34) renames onto an absent profile without throwing
tests/store/auth/reducer.test.ts :: renaming (AC-34) updates the signed-in user AND the profile record
tests/store/auth/reducer.test.ts :: sign-in writes (AC-31) merges into an existing service record
tests/store/auth/reducer.test.ts :: sign-in writes (AC-31) merges the signed-in user and the profile, and clears the failure flag
tests/store/auth/reducer.test.ts :: sign-in writes (AC-31) replaces an absent service record with what it is given
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) builds the signed-in user from a fresh profile when there was none
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) merges into an existing stories record
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) merges into an existing wallet record
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) starts a profile when a verification arrives and none was stored
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) starts the profile from the sign-in reply when there was none
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) stores a chat record when there was none
tests/store/auth/reducer.test.ts :: the first write, when nothing was stored yet (AC-31) takes the sign-in reply as the user when nobody was signed in
tests/store/auth/reducer.test.ts :: the other merge shapes (AC-31) editUserInfo merges into both the profile and the signed-in user
tests/store/auth/reducer.test.ts :: the other merge shapes (AC-31) merges onto an absent profile without throwing
tests/store/auth/reducer.test.ts :: the other merge shapes (AC-31) updateUserInfo replaces the profile and merges the signed-in user
tests/store/auth/reducer.test.ts :: the other merge shapes (AC-31) updateUserIsVerified merges into the profile only
tests/store/auth/reducer.test.ts :: the plain values screens read holds a temporary user without touching the signed-in one
tests/store/auth/reducer.test.ts :: the plain values screens read holds the verification reference for the code being checked
tests/store/auth/reducer.test.ts :: the plain values screens read keeps the wrong-code message and can clear it
tests/store/auth/reducer.test.ts :: the plain values screens read marks whether an address is in use, starting from not in use
tests/store/auth/reducer.test.ts :: the plain values screens read replaces the notification settings rather than merging them
tests/store/auth/reducer.test.ts :: the plain values screens read starts the order count at 'not counted yet', not at zero
tests/store/auth/reducer.test.ts :: the plain values screens read stores the kinds of notification on offer, starting from none
tests/store/auth/reducer.test.ts :: the re-verify switches records the outcome so a waiting request can read it
tests/store/auth/reducer.test.ts :: the re-verify switches remembers the phone of the session that expired
tests/store/auth/reducer.test.ts :: the re-verify switches starts disarmed, arms the prompt, and can be cleared again
tests/utils/cookieManager.test.ts :: cookie names (AC-13) holds the auth token in one cookie, for guest and signed-in alike
tests/utils/cookieManager.test.ts :: cookie names (AC-13) is named nowhere outside the cleanup lists it exists for
tests/utils/cookieManager.test.ts :: cookie names (AC-13) keeps the refresh token in its own cookie
tests/utils/cookieManager.test.ts :: cookie names (AC-13) keeps the visit id and the logout guard separate from the auth cookies
tests/utils/cookieManager.test.ts :: cookie names (AC-13) still defines the legacy device cookie, for cleanup only
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) clears the chat refresh token on sign-out, like every other token
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) does not hide the localisation cookies, which the client does read
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) is the same list the token module purges on sign-out
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps CHAT-REFRESH-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps CHAT-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps DEVICE-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps MARKET-REFRESH-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps MARKET-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps STORIES-REFRESH-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps STORIES-TOKEN out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps USER-CHAT out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps USER-STORIES out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps User-Data out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps WALLET_USER out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps rdb_at out of the browser's reach
tests/utils/cookieManager.test.ts :: cookies the browser must not read (AC-14) keeps x7k9m2p4q8r1s5t3u6v2w9y4z7a1b5c8d2e6f9g3h7j1k4l8m2n5p9q3r6s1t4u7v2w5x8y1z4a7b2c5d8e1f4g7h2j5k8l1m4n7o2p5q8r1s4t7u2v5w8x1y4z7 out of the browser's reach
tests/utils/cookieManager.test.ts :: reading a cookie on the server gives back a profile as an object, not the text it was stored as
tests/utils/cookieManager.test.ts :: reading a cookie on the server hands back text it cannot parse rather than throwing
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns a plain string as it was stored
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns nothing for a cookie that is not there
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns nothing for a cookie that is present but empty
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns nothing when there is no request to read from
tests/utils/cookieManager.test.ts :: reading a cookie on the server undoes the encoding a stored value was written with
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) falls back to the message on the fault itself
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) says the fault is unknown rather than filing everything under an empty line
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) says the fault is unknown when there is nothing to go on
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) still files a fault that points back at itself
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) takes plain text as the line itself
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) uses a message written one level in
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) uses the message when there is one
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) writes a value that is not text out as text
tests/utils/errorSerialization.test.ts :: choosing the line the error log is filed under (extractPrimaryErrorMessage) writes the whole fault out when it carries no message
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) does not hang on a list that points back at itself
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) does not hang on a record that points back at itself
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) finds a fault buried inside an ordinary record
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) finds a fault inside a list
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) keeps every fault when several happened at once
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) keeps the fault that caused it
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) keeps the name, the message and where it happened
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) leaves out the parts of a record that were never filled in
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) marks it so the log knows it was a fault and not an ordinary record
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) passes ordinary values through untouched
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) stops going deeper once a record is buried too far down
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) writes a date out in a form the log can read
tests/utils/errorSerialization.test.ts :: preparing a fault for the error log (serializeUnknownForErrorLog) writes out the values a log cannot hold as text instead
tests/utils/fetchData.test.ts :: 401 recovery 'chat' 401 clear-tokens scope clears only the chat credentials
tests/utils/fetchData.test.ts :: 401 recovery 'comments' 401 clear-tokens scope clears only the comments credentials
tests/utils/fetchData.test.ts :: 401 recovery 'stories' 401 clear-tokens scope clears only the stories credentials
tests/utils/fetchData.test.ts :: 401 recovery 'wallet' 401 clear-tokens scope clears only the wallet credentials
tests/utils/fetchData.test.ts :: 401 recovery 401 handling bails out when LoggingOut becomes true
tests/utils/fetchData.test.ts :: 401 recovery 401 on an unhandled server throws Authentication required
tests/utils/fetchData.test.ts :: 401 recovery chat 401 on retry skips refresh and uses need_auth
tests/utils/fetchData.test.ts :: 401 recovery chat 401 refresh ineligible falls through to need_auth
tests/utils/fetchData.test.ts :: 401 recovery chat 401 refresh succeeds
tests/utils/fetchData.test.ts :: 401 recovery comments 401 need_auth succeeds
tests/utils/fetchData.test.ts :: 401 recovery elastic 401 always retries
tests/utils/fetchData.test.ts :: 401 recovery local /api/auth/login 401 renews and retries
tests/utils/fetchData.test.ts :: 401 recovery local /api/ticket with query 401 renews and retries
tests/utils/fetchData.test.ts :: 401 recovery local route outside authed list 401 throws Authentication required
tests/utils/fetchData.test.ts :: 401 recovery market 401 guest continues as a fresh guest
tests/utils/fetchData.test.ts :: 401 recovery market 401 refresh succeeds
tests/utils/fetchData.test.ts :: 401 recovery market 401 returns false when re-auth is cancelled
tests/utils/fetchData.test.ts :: 401 recovery market 401 seller shows expired widget and waits for re-auth
tests/utils/fetchData.test.ts :: 401 recovery market 401 verified shopper waits for re-auth
tests/utils/fetchData.test.ts :: 401 recovery market 401 waits for an existing re-auth to succeed
tests/utils/fetchData.test.ts :: 401 recovery market 401 waits for registration to be ready
tests/utils/fetchData.test.ts :: 401 recovery market-dashboard 401 refresh succeeds
tests/utils/fetchData.test.ts :: 401 recovery stories 401 need_auth cancelled resolves false
tests/utils/fetchData.test.ts :: 401 recovery stories 401 need_auth times out
tests/utils/fetchData.test.ts :: 401 recovery stories 401 refresh ineligible falls through to need_auth
tests/utils/fetchData.test.ts :: 401 recovery stories 401 refresh succeeds
tests/utils/fetchData.test.ts :: 401 recovery stories 401 reuses an existing armed flow
tests/utils/fetchData.test.ts :: 401 recovery treats /seller paths as seller requests
tests/utils/fetchData.test.ts :: 401 recovery waitForReAuthSuccess times out after 5 minutes
tests/utils/fetchData.test.ts :: 401 recovery wallet 401 need_auth succeeds
tests/utils/fetchData.test.ts :: error handling and retries Add to cart widget errors show the cart error toast
tests/utils/fetchData.test.ts :: error handling and retries GET gives up after exhausting retries
tests/utils/fetchData.test.ts :: error handling and retries GET retries on network failures then succeeds
tests/utils/fetchData.test.ts :: error handling and retries GET retries on retryable status codes then succeeds
tests/utils/fetchData.test.ts :: error handling and retries POST network failures are not retried
tests/utils/fetchData.test.ts :: error handling and retries aborted errors are not logged
tests/utils/fetchData.test.ts :: error handling and retries calls retryActionIfUnAuth on a 401 retry
tests/utils/fetchData.test.ts :: error handling and retries ignored error messages do not show notifications
tests/utils/fetchData.test.ts :: error handling and retries noMessage suppresses the error notification
tests/utils/fetchData.test.ts :: error handling and retries treats a missing method as non-mutating and retryable
tests/utils/fetchData.test.ts :: fetchData module basics aborts new requests after abortInFlightForLogout is called
tests/utils/fetchData.test.ts :: fetchData module basics deduplicates identical concurrent requests
tests/utils/fetchData.test.ts :: fetchData module basics rejects a deduped caller when its own signal is already aborted
tests/utils/fetchData.test.ts :: fetchData module basics rejects a deduped caller when its signal aborts mid-flight
tests/utils/fetchData.test.ts :: fetchData module basics rejects when the caller signal is already aborted
tests/utils/fetchData.test.ts :: fetchData module basics returns an empty object and does not fetch while logging out
tests/utils/fetchData.test.ts :: fetchData module basics returns cached result when useCached is true
tests/utils/fetchData.test.ts :: fetchData module basics returns success for a basic GET
tests/utils/fetchData.test.ts :: fetchData module basics shares an in-flight request with a second caller signal
tests/utils/fetchData.test.ts :: fetchData module basics waits for registration to be ready before fetching
tests/utils/fetchData.test.ts :: locale detection falls back to cookies when the path has no locale
tests/utils/fetchData.test.ts :: locale detection uses the country and language from the URL path
tests/utils/fetchData.test.ts :: register-guest flag sets isRegisteringReady false for /auth/register-guest
tests/utils/fetchData.test.ts :: request routing handles a response whose JSON cannot be parsed
tests/utils/fetchData.test.ts :: request routing local server GET omits the body
tests/utils/fetchData.test.ts :: request routing local server sends a same-origin request with a JSON body
tests/utils/fetchData.test.ts :: request routing local server with FormData omits Content-Type
tests/utils/fetchData.test.ts :: request routing proxy server GET sends no body
tests/utils/fetchData.test.ts :: request routing proxy server encodes the target URL
tests/utils/fetchData.test.ts :: request routing proxy server passes sellerId and a string body
tests/utils/fetchData.test.ts :: request routing proxy server serializes an object body as JSON
tests/utils/fetchData.test.ts :: request routing proxy server with FormData body
tests/utils/fetchData.test.ts :: request routing upload story GET omits the body
tests/utils/fetchData.test.ts :: request routing upload story server fetches the URL directly
tests/utils/fetchData.test.ts :: response status and message handling apply coupon failure shows an error toast
tests/utils/fetchData.test.ts :: response status and message handling apply coupon success shows a success toast
tests/utils/fetchData.test.ts :: response status and message handling cart widget /cart/remove success shows a success toast
tests/utils/fetchData.test.ts :: response status and message handling cart widget error shows an error toast
tests/utils/fetchData.test.ts :: response status and message handling cart widget status 1 shows a success toast
tests/utils/fetchData.test.ts :: response status and message handling cart/update 200 error returns success false without logging
tests/utils/fetchData.test.ts :: response status and message handling cart/update non-200 error is logged
tests/utils/fetchData.test.ts :: response status and message handling cart/update status 0 shows an error toast
tests/utils/fetchData.test.ts :: response status and message handling cart/update status 1 shows a success notification
tests/utils/fetchData.test.ts :: response status and message handling does not redirect when a re-auth is already in progress
tests/utils/fetchData.test.ts :: response status and message handling generic success response shows a success notification
tests/utils/fetchData.test.ts :: response status and message handling ignored messages do not trigger a notification
tests/utils/fetchData.test.ts :: response status and message handling noMessage suppresses the success notification
tests/utils/fetchData.test.ts :: response status and message handling redirects a seller to home on a non-200 market GET
tests/utils/fetchData.test.ts :: response status and message handling throws and reports a non-OK response
tests/utils/listing/filterItemState.test.ts :: clicking a colour keeps the other colours when one is added
tests/utils/listing/filterItemState.test.ts :: clicking a colour knows a colour is chosen whether or not the hash is written
tests/utils/listing/filterItemState.test.ts :: clicking a colour stores a colour with its hash but writes it into the address without one
tests/utils/listing/filterItemState.test.ts :: clicking a colour takes a chosen colour back out in either form
tests/utils/listing/filterItemState.test.ts :: clicking a filter on and off adds the choice to the address when it was not chosen
tests/utils/listing/filterItemState.test.ts :: clicking a filter on and off keeps the choices of every other kind untouched
tests/utils/listing/filterItemState.test.ts :: clicking a filter on and off keeps the other choices of the same kind when one is added
tests/utils/listing/filterItemState.test.ts :: clicking a filter on and off keeps the other choices of the same kind when one is removed
tests/utils/listing/filterItemState.test.ts :: clicking a filter on and off marks a choice already in the address as chosen
tests/utils/listing/filterItemState.test.ts :: clicking a filter on and off takes the choice back out when it was already chosen
tests/utils/listing/filterItemState.test.ts :: clicking a price band allows only one price band at a time
tests/utils/listing/filterItemState.test.ts :: clicking a price band clears the price band when the chosen one is clicked again
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path adds the choice to the query
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path allows only one price band at a time here too
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path reads the current filters when they arrive as a plain object
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path reports the fault and starts fresh when the query cannot be read
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path takes the choice back out of the query when it was already chosen
tests/utils/listing/filterItemState.test.ts :: the rest of the address carries the search and the sort order across the click
tests/utils/listing/filterItemState.test.ts :: the rest of the address drops the parent category when a child of it is chosen
tests/utils/listing/filterItemState.test.ts :: the rest of the address leaves the language out of the address when there is none
tests/utils/otpLocks.test.ts :: counting distinct numbers in a session (AC-3, AC-4) blocks a new number once the session limit is reached
tests/utils/otpLocks.test.ts :: counting distinct numbers in a session (AC-3, AC-4) does not spend a second slot on a number already counted
tests/utils/otpLocks.test.ts :: counting distinct numbers in a session (AC-3, AC-4) ignores a value with no digits when counting
tests/utils/otpLocks.test.ts :: counting distinct numbers in a session (AC-3, AC-4) never blocks a number the visitor has already used
tests/utils/otpLocks.test.ts :: locking a number (AC-2) stores nothing for a value with no digits in it
tests/utils/otpLocks.test.ts :: locking a number (AC-2) stores nothing when asked for a lock of zero seconds
tests/utils/otpLocks.test.ts :: reading a number back (AC-1) counts a lock down in whole seconds and stops at zero when it runs out
tests/utils/otpLocks.test.ts :: reading a number back (AC-1) reports a number nobody has locked as free
tests/utils/otpLocks.test.ts :: reading a number back (AC-1) treats the same number written differently as the same number
tests/utils/otpLocks.test.ts :: the window moving on (AC-5) drops a number that has fallen out of the window from storage too
tests/utils/otpLocks.test.ts :: the window moving on (AC-5) forgets an expired lock and clears it out of storage at once
tests/utils/otpLocks.test.ts :: the window moving on (AC-5) keeps counting a number until its hour is actually up
tests/utils/otpLocks.test.ts :: the window moving on (AC-5) stops counting a number once its hour is up
tests/utils/otpLocks.test.ts :: when storage misbehaves (AC-6) keeps working when storage refuses to accept a write
tests/utils/otpLocks.test.ts :: when storage misbehaves (AC-6) starts over rather than throwing when the stored state is unreadable
tests/utils/otpLocks.test.ts :: when storage misbehaves (AC-6) survives a stored state that is valid but the wrong shape
tests/utils/otpLocks.test.ts :: with no browser present (AC-7) accepts a lock and a recorded number without throwing
tests/utils/otpLocks.test.ts :: with no browser present (AC-7) reports nothing locked and nothing capped
tests/utils/otpLocks.test.ts :: with no browser present (AC-7) still normalizes a number, because that needs no storage
tests/utils/server/authRefresh.test.ts :: a successful exchange (AC-21, AC-22, AC-23) leaves the stored profile alone when the reply carries none
tests/utils/server/authRefresh.test.ts :: a successful exchange (AC-21, AC-22, AC-23) says so loudly when the rotated pair could not be stored
tests/utils/server/authRefresh.test.ts :: a successful exchange (AC-21, AC-22, AC-23) stores both halves together, each with its own lifetime
tests/utils/server/authRefresh.test.ts :: a successful exchange (AC-21, AC-22, AC-23) updates the stored profile when the reply carries one
tests/utils/server/authRefresh.test.ts :: asking the backend that serves this visitor (AC-24, AC-25) carries the visitor's own language and country
tests/utils/server/authRefresh.test.ts :: asking the backend that serves this visitor (AC-24, AC-25) falls back to the default locale when none is stored
tests/utils/server/authRefresh.test.ts :: asking the backend that serves this visitor (AC-24, AC-25) sends a guest with no phone number to the gateway
tests/utils/server/authRefresh.test.ts :: asking the backend that serves this visitor (AC-24, AC-25) sends a verified shopper to the core backend
tests/utils/server/authRefresh.test.ts :: asking the backend that serves this visitor (AC-24, AC-25) sends a visitor with no stored profile at all to the gateway
tests/utils/server/authRefresh.test.ts :: refusing to exchange at all (AC-18) does nothing when there is no stored refresh credential
tests/utils/server/authRefresh.test.ts :: refusing to exchange at all (AC-18) does nothing while the visitor is signing out
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) carries the visitor's own language and country
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) does nothing when there is no stored credential for it
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) refuses to store a reply carrying half a pair
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) reports a dropped connection as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) reports a reply it cannot read as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) reports a server error as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'chat' session, the rest of the ladder (AC-18 to AC-23) says so loudly when the rotated pair could not be stored
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) carries the visitor's own language and country
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) does nothing when there is no stored credential for it
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) refuses to store a reply carrying half a pair
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) reports a dropped connection as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) reports a reply it cannot read as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) reports a server error as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) says so loudly when the rotated pair could not be stored
tests/utils/server/authRefresh.test.ts :: the chat and stories sessions (AC-18 to AC-22) does not exchange a chat credential while signing out
tests/utils/server/authRefresh.test.ts :: the chat and stories sessions (AC-18 to AC-22) does not exchange a stories credential while signing out
tests/utils/server/authRefresh.test.ts :: the chat and stories sessions (AC-18 to AC-22) exchanges a chat credential and rotates the chat pair only
tests/utils/server/authRefresh.test.ts :: the chat and stories sessions (AC-18 to AC-22) exchanges a stories credential and rotates the stories pair only
tests/utils/server/authRefresh.test.ts :: the chat and stories sessions (AC-18 to AC-22) keeps a rejected chat credential in the jar
tests/utils/server/authRefresh.test.ts :: the chat and stories sessions (AC-18 to AC-22) keeps a rejected stories credential in the jar
tests/utils/server/authRefresh.test.ts :: the stories reply arriving in either shape (AC-28) prefers the top-level pair when a reply somehow carries both
tests/utils/server/authRefresh.test.ts :: the stories reply arriving in either shape (AC-28) reads a pair returned at the top level
tests/utils/server/authRefresh.test.ts :: the stories reply arriving in either shape (AC-28) reads a pair returned inside a wrapper
tests/utils/server/authRefresh.test.ts :: two callers at once (AC-26, AC-27) lets a later caller exchange again once the first is done
tests/utils/server/authRefresh.test.ts :: two callers at once (AC-26, AC-27) never lets one service's exchange stand in for another's
tests/utils/server/authRefresh.test.ts :: two callers at once (AC-26, AC-27) never shares an exchange with a DIFFERENT visitor served at the same time
tests/utils/server/authRefresh.test.ts :: two callers at once (AC-26, AC-27) spends one credential, not one per caller
tests/utils/server/authRefresh.test.ts :: two callers at once (AC-26, AC-27) still shares when the same visitor asks twice at once
tests/utils/server/authRefresh.test.ts :: when the exchange cannot be completed (AC-20) refuses to store a reply carrying neither
tests/utils/server/authRefresh.test.ts :: when the exchange cannot be completed (AC-20) refuses to store a reply carrying only a refresh credential
tests/utils/server/authRefresh.test.ts :: when the exchange cannot be completed (AC-20) refuses to store a reply carrying only a session credential
tests/utils/server/authRefresh.test.ts :: when the exchange cannot be completed (AC-20) reports a dropped connection as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: when the exchange cannot be completed (AC-20) reports a reply it cannot read as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: when the exchange cannot be completed (AC-20) reports a server error as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: when the exchange is refused (AC-19) reports it as invalid and leaves the stored credential alone
tests/utils/server/authRefresh.test.ts :: when there is no request to read at all reports the chat session as unavailable rather than throwing
tests/utils/server/authRefresh.test.ts :: when there is no request to read at all reports the shopper session as unavailable rather than throwing
tests/utils/server/authRefresh.test.ts :: when there is no request to read at all reports the stories session as unavailable rather than throwing
tests/utils/server/helpers.test.ts :: building a brand logo address (getBrandIconImageUrl) fits the logo into the small default box
tests/utils/server/helpers.test.ts :: building a brand logo address (getBrandIconImageUrl) gives an empty address back when there is no logo
tests/utils/server/helpers.test.ts :: building a brand logo address (getBrandIconImageUrl) leaves a logo hosted anywhere else exactly as it is
tests/utils/server/helpers.test.ts :: building a brand logo address (getBrandIconImageUrl) uses the box the caller asks for instead
tests/utils/server/helpers.test.ts :: building a filter link (buildParamsFromFilters, HandleIsActive) always uses the same order, whatever order the choices came in
tests/utils/server/helpers.test.ts :: building a filter link (buildParamsFromFilters, HandleIsActive) drops the hash from colours so the address stays readable
tests/utils/server/helpers.test.ts :: building a filter link (buildParamsFromFilters, HandleIsActive) gives nothing back when nothing is chosen
tests/utils/server/helpers.test.ts :: building a filter link (buildParamsFromFilters, HandleIsActive) joins several choices of the same kind with commas
tests/utils/server/helpers.test.ts :: building a filter link (buildParamsFromFilters, HandleIsActive) marks a filter as chosen only when it is in the list
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) adds the missing slash to an upload record's path as well
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) does not double the slash when the path already has one
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) hands back nothing when it was given nothing
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) leaves a full address alone
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) puts the media address in front of a bare path
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) takes an upload record's own path as final when it names the media server
tests/utils/server/helpers.test.ts :: building a product page address (getUrlofProduct) carries the chosen colour so the page opens on it
tests/utils/server/helpers.test.ts :: building a product page address (getUrlofProduct) points at the product on the right country and language site
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) adds the media address, the folder and the file type
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) asks for the short preview when the caller wants one
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) does not add the file type twice
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) does not double the slash when the name has one
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) gives an empty address back when there is no video
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) leaves an already-hosted video exactly as it is
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) works when the caller gives no options at all
tests/utils/server/helpers.test.ts :: cleaning typed input (pollinateInput) cuts anything longer than ninety characters
tests/utils/server/helpers.test.ts :: cleaning typed input (pollinateInput) gives an empty result for anything that is not text
tests/utils/server/helpers.test.ts :: cleaning typed input (pollinateInput) removes the characters that could carry a command
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) asks for a width as well when the slot has one
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) asks the media server for the height the slot needs
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) gives an empty picture back when it was given nothing
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) keeps the slash before the version for an upload record too
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) leaves an upload record from anywhere else alone
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) pads to a fixed width when the slot asks to be padded
tests/utils/server/helpers.test.ts :: preparing the wide pictures (configureImageForBoutique, buildOgImageUrl) asks for the boutique banner at its own width
tests/utils/server/helpers.test.ts :: preparing the wide pictures (configureImageForBoutique, buildOgImageUrl) gives an empty banner back when there is no picture
tests/utils/server/helpers.test.ts :: preparing the wide pictures (configureImageForBoutique, buildOgImageUrl) gives nothing back when there is no sharing picture
tests/utils/server/helpers.test.ts :: preparing the wide pictures (configureImageForBoutique, buildOgImageUrl) leaves a sharing picture alone when it is not on the media server
tests/utils/server/helpers.test.ts :: preparing the wide pictures (configureImageForBoutique, buildOgImageUrl) moves a sharing picture off the internal host onto the public one
tests/utils/server/helpers.test.ts :: preparing the wide pictures (configureImageForBoutique, buildOgImageUrl) sizes the sharing picture to what the social sites expect
tests/utils/server/helpers.test.ts :: reading numbers out of an address (parseNumberArray) drops anything in the list that is not a number
tests/utils/server/helpers.test.ts :: reading numbers out of an address (parseNumberArray) gives an empty list back when there is nothing to read
tests/utils/server/helpers.test.ts :: reading numbers out of an address (parseNumberArray) reads a plain list of numbers
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) does not add a second hash to a colour that already has one
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) folds the related categories into the ordinary ones, without repeats
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) gives nothing back when the address carries no filters
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) ignores a filter name with no choices after it
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) keeps a search phrase whole rather than splitting it
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) puts the hash back on colours so they can be matched
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) skips a part of the address it does not recognise
tests/utils/server/helpers.test.ts :: reading the filters out of an address (parseFiltersFromParams) splits a list of choices on the commas
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) always rounds a fraction of a penny up, never down
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) converts into the shopper's currency
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) leaves the rate out when none was given
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) multiplies without the usual decimal drift
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) shortens a price in the hundreds of thousands to thousands
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) shortens a price in the millions to millions
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) still shows a price when the currency has not loaded yet
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) uses the Arabic short forms on the Arabic site
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) writes a free item as zero
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) writes an ordinary price out in full
tests/utils/server/helpers.test.ts :: showing the related categories alongside the ordinary ones adds the related ones at the end and marks them as related
tests/utils/server/helpers.test.ts :: showing the related categories alongside the ordinary ones changes nothing when there are no related categories
tests/utils/server/helpers.test.ts :: showing the related categories alongside the ordinary ones keeps a category that appears on both lists rather than hiding one
tests/utils/server/helpers.test.ts :: tidying text for display (stripHtml, getThumb, convertTextToXFormat) asks the media server for a small thumbnail
tests/utils/server/helpers.test.ts :: tidying text for display (stripHtml, getThumb, convertTextToXFormat) gives an empty description back when there is none
tests/utils/server/helpers.test.ts :: tidying text for display (stripHtml, getThumb, convertTextToXFormat) gives an empty result when there is no name to hide
tests/utils/server/helpers.test.ts :: tidying text for display (stripHtml, getThumb, convertTextToXFormat) gives nothing back when there is no picture to shrink
tests/utils/server/helpers.test.ts :: tidying text for display (stripHtml, getThumb, convertTextToXFormat) hides a name behind crosses but keeps its shape
tests/utils/server/helpers.test.ts :: tidying text for display (stripHtml, getThumb, convertTextToXFormat) removes the formatting tags from a description
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) adds the related categories to the chosen ones, without repeats
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) asks for nothing extra when the address carries nothing
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) asks only for the featured products on the featured page
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) reads a price band written as one number to another
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) reads the chosen boutiques, brands, colours and tags
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) reads the chosen categories
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) reads the chosen sizes out of the attributes
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) strips the quotes off a search phrase
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) turns on the flash deals when the address asks for them
tests/utils/server/helpers.test.ts :: turning a search address into a search request (NormalizeSearchParamsForSearchRequest) turns on the flash deals when the page itself is the flash deals page
tests/utils/server/helpers.test.ts :: whether search engines may list the site (isIndexingAllowed, getRobotsConfig) keeps the site out of search results unless it is turned on
tests/utils/server/helpers.test.ts :: whether search engines may list the site (isIndexingAllowed, getRobotsConfig) lets search engines in once it is turned on
tests/utils/server/otpIdentity.test.ts :: a visitor arriving for the first time (AC-10, AC-11) mints a visit id and keeps it for a year, far longer than a token
tests/utils/server/otpIdentity.test.ts :: a visitor arriving for the first time (AC-10, AC-11) says the visit id was not minted when the visitor already had one
tests/utils/server/otpIdentity.test.ts :: a visitor arriving for the first time (AC-10, AC-11) still returns usable keys when the request cannot store cookies
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) gives two sessions on one home connection the same address key
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reads the address the edge forwarded, in the documented order
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces a bracketed address
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces a missing value
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces a plain v4 address
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces a shortened v6 address
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces a v4 address inside a v6 one
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces a v6 address
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces an address with a zone
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces leading zeros
tests/utils/server/otpIdentity.test.ts :: reducing an address to something stable (AC-9) reduces nothing at all
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) does not register when the caller did not ask for an id
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) does not register when the visitor already has an account id
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) falls back to the default locale when none is stored
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) registers once, stores what came back, and reports the id
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) reports no id and says so when the connection drops
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) reports no id and says so when the registration is refused
tests/utils/server/otpIdentity.test.ts :: registering a guest to get an account id (AC-12, AC-13, AC-14) reports whether a sign-in credential is present, without exposing it
tests/utils/server/otpIdentity.test.ts :: the same visitor gets the same keys (AC-8) gives a different visitor different keys
tests/utils/server/otpIdentity.test.ts :: the same visitor gets the same keys (AC-8) gives two requests from one visitor identical session and address keys
tests/utils/server/otpIdentity.test.ts :: the same visitor gets the same keys (AC-8) keeps the session key even when the sign-in token is replaced
tests/utils/server/otpIdentity.test.ts :: the same visitor gets the same keys (AC-8) mixes in the server's secret, so a key cannot be worked out from outside
tests/utils/server/otpIdentity.test.ts :: the same visitor gets the same keys (AC-8) never puts the raw visit id or address into a key
tests/utils/server/otpIdentity.test.ts :: the same visitor gets the same keys (AC-8) still gives one visitor one key while the secret stays put
tests/utils/server/otpTelemetry.test.ts :: recording an attempt (AC-16) does not create a person, and does not look up the server's location
tests/utils/server/otpTelemetry.test.ts :: recording an attempt (AC-16) reads the delivery channel as a plain yes or no
tests/utils/server/otpTelemetry.test.ts :: recording an attempt (AC-16) records a code that was sent
tests/utils/server/otpTelemetry.test.ts :: recording an attempt (AC-16) records a send the backend refused
tests/utils/server/otpTelemetry.test.ts :: recording an attempt (AC-16) records a send the limiter blocked
tests/utils/server/otpTelemetry.test.ts :: recording an attempt (AC-16) sends the outcome, the reason, both addresses and the session key
tests/utils/server/otpTelemetry.test.ts :: staying out of the way (AC-17) returns before the record is sent, so the code is not held up
tests/utils/server/otpTelemetry.test.ts :: staying out of the way (AC-17) swallows a failure from the analytics service
tests/utils/server/otpTelemetry.test.ts :: staying out of the way (AC-17) swallows being called where there is nothing to defer against
tests/utils/server/otpTelemetry.test.ts :: staying silent where it should (AC-15) does nothing outside production
tests/utils/server/otpTelemetry.test.ts :: staying silent where it should (AC-15) does nothing when no analytics key is configured
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) does not match a sibling that merely starts the same way
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) ignores a query string when matching the allow-list
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) leaves an address that is not allow-listed to the core backend
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) matches an address that ends in a changing segment
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) recognises an allow-listed address
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) sends a guest to the gateway
tests/utils/server/tokenManager.test.ts :: backend routing (AC-18) sends a verified shopper to the core backend
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) gives a token cookie 48 hours by default, not a year
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) keeps profile cookies for a year, and encodes what it stores
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) keeps the refresh cookie alive for 30 days, far longer than the token
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) lets the deployment override the token lifetime
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) marks cookies secure in production and not outside it
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) records every option when a cookie is actually written
tests/utils/server/tokenManager.test.ts :: cookie shape (AC-15) writes token cookies hidden from the browser, same-site strict, site-wide
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives an unknown service an empty credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives chat its own credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives comments its own credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives market its own credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives market-dashboard its own credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives search no credential rather than someone else's
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives stories its own credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) gives wallet its own credential
tests/utils/server/tokenManager.test.ts :: credential lookup (AC-16) never hands out the legacy device cookie
tests/utils/server/tokenManager.test.ts :: the headers a proxied request carries carries the caller's role when their chat profile names one
tests/utils/server/tokenManager.test.ts :: the headers a proxied request carries carries the language, the country and the caller's credential
tests/utils/server/tokenManager.test.ts :: the headers a proxied request carries falls back to no role rather than leaving it blank
tests/utils/server/tokenManager.test.ts :: the headers a proxied request carries says which shop the request is for, only when there is one
tests/utils/server/tokenManager.test.ts :: the headers a proxied request carries sends no sign-in header at all when there is no credential
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) counts a real phone as verified
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count an empty string as a verified phone
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count null as a verified phone
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count only spaces as a verified phone
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count the number zero as a verified phone
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count the text "0" as a verified phone
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count undefined as a verified phone
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) falls back to guest when the profile cannot be read at all
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) reads the profile cookie to decide
tests/utils/server/tokenManager.test.ts :: verified-shopper detection (AC-17) treats a missing profile as not verified
tests/utils/server/tokenManager.test.ts :: what a request log is allowed to say records the request without ever writing the credential down
tests/utils/server/tokenManager.test.ts :: what a request log is allowed to say says a credential was missing rather than inventing a hint
tests/utils/server/tokenManager.test.ts :: what a request log is allowed to say stays quiet when the request did not fail
tests/utils/server/tokenManager.test.ts :: what leaves the server (AC-19) hides a short credential completely rather than mostly
tests/utils/server/tokenManager.test.ts :: what leaves the server (AC-19) reduces a credential in a log to an unusable hint
tests/utils/server/tokenManager.test.ts :: what leaves the server (AC-19) removes the private wallet fields and keeps the useful ones
tests/utils/server/tokenManager.test.ts :: what leaves the server (AC-19) returns nothing for an absent profile rather than an empty shell
tests/utils/server/tokenManager.test.ts :: what leaves the server (AC-19) strips tokens from a profile before the browser sees it
tests/utils/server/tokenManager.test.ts :: what leaves the server (AC-19) strips tokens, including the refresh token, from a service profile
tests/utils/server/tokenManager.test.ts :: what the current visitor looks like to the app gathers every profile and reports the visitor as signed in
tests/utils/server/tokenManager.test.ts :: what the current visitor looks like to the app hands back a stored value it cannot read as data, rather than nothing
tests/utils/server/tokenManager.test.ts :: what the current visitor looks like to the app hands back nothing for a cookie that is not there
tests/utils/server/tokenManager.test.ts :: what the current visitor looks like to the app removes a cookie when asked to
tests/utils/server/tokenManager.test.ts :: what the current visitor looks like to the app reports a visitor with no profile as not signed in
tests/utils/server/tokenManager.test.ts :: which backend each service talks to refuses to guess a host for a service it does not know
tests/utils/server/tokenManager.test.ts :: which backend each service talks to routes the seller dashboard by address alone — an allow-listed address
tests/utils/server/tokenManager.test.ts :: which backend each service talks to routes the seller dashboard by address alone — anything else
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends a guest to the core backend for everything else
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends a guest to the gateway for an allow-listed address
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends a verified shopper to the core backend even for an allow-listed address
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends chat to its own host
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends comments to its own host
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends search to its own host
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends stories to its own host
tests/utils/server/tokenManager.test.ts :: which backend each service talks to sends the wallet to its own host
tests/utils/server/tokenManager.test.ts :: which backend each service talks to treats the checklist address as gateway work
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows chat
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows comments
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows elastic
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows market
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows market-dashboard
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows stories
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all allows wallet
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all refuses 
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all refuses MARKET
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all refuses admin
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all refuses internal
tests/utils/server/tokenManager.test.ts :: which services may be proxied at all refuses market 
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) carries the settings once, under the key the readers index
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) hands a payload with no settings back exactly as it came
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) hands nothing back for nothing, rather than throwing
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) keeps the rest of the envelope, which the same response carries
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) leaves the response it was given untouched
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) never hands the store the settings object on its own
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) puts the core backend's settings under the key the readers index
tests/utils/startingSettings.test.ts :: handing the envelope on to the store (normaliseStartingSettings) repairs the gateway's own payload in place too
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) falls through to the gateway spelling when the core one is empty
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) finds the settings under the core backend's hyphen spelling
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) finds the settings under the gateway's underscore spelling
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) hands back every other field, not just the days
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) keeps the decimal-place count, the other half of the same fault
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) leaves the payload it was given untouched
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) prefers the core spelling when a payload somehow carries both
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) when there is nothing to read gives nothing back for a payload with neither spelling
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) when there is nothing to read gives nothing back rather than throwing when there is no payload
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) when there is nothing to read gives nothing back when the core entry is empty and there is no gateway one
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) when there is nothing to read still answers for an empty settings object, with the days at zero
tests/utils/startingSettings.test.ts :: reading the settings out of either envelope (resolveStartingSetting) when there is nothing to read treats a settings entry that is not an object as no entry at all
tests/utils/startingSettings.test.ts :: the key every reader indexes (STARTING_SETTING_KEY) is the underscore spelling, which is what the components read
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in counts a missing value as zero, not as nothing
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in counts a negative value as zero
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in counts an empty value as zero
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in counts an endless value as zero
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in counts text that is not a number as zero rather than letting NaN through
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in keeps a plain number as it is
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in reads a number sent as text
tests/utils/startingSettings.test.ts :: the platform's delivery days, whatever shape they arrive in rounds a fraction up to a whole day
tests/utils/startingSettings.test.ts :: what the screens actually read off the result adds up with a product's own shipping days instead of producing NaN
tests/utils/startingSettings.test.ts :: what the screens actually read off the result gives a guest the same days it always did
tests/utils/startingSettings.test.ts :: what the screens actually read off the result gives a verified shopper the platform's days, where the raw response gives none
tests/utils/startingSettings.test.ts :: what the screens actually read off the result gives the payment screen a decimal-place count it can use
tests/utils/startingSettings.test.ts :: what the screens actually read off the result leaves the screens on their own fallback when the response carried nothing
tests/utils/tinyUtils.test.ts :: building a filter link (buildParamsFromFilters) always uses the same order, whatever order the choices came in
tests/utils/tinyUtils.test.ts :: building a filter link (buildParamsFromFilters) drops the hash from colours so the address stays readable
tests/utils/tinyUtils.test.ts :: building a filter link (buildParamsFromFilters) gives nothing back when nothing is chosen
tests/utils/tinyUtils.test.ts :: building a filter link (buildParamsFromFilters) joins several choices of the same kind with commas
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) adds the missing slash to an upload record's path as well
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) does not double the slash when the path already has one
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) hands back anything that is not text unchanged
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) hands back nothing when it was given nothing
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) leaves a full address alone
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) puts the media address in front of a bare path
tests/utils/tinyUtils.test.ts :: building a picture address (GetImageUrl) takes an upload record's own path as final when it names the media server
tests/utils/tinyUtils.test.ts :: building a video address (getVideoUrl) adds the media address, the folder and the file type
tests/utils/tinyUtils.test.ts :: building a video address (getVideoUrl) does not add the file type twice
tests/utils/tinyUtils.test.ts :: building a video address (getVideoUrl) does not double the slash when the name has one
tests/utils/tinyUtils.test.ts :: building a video address (getVideoUrl) leaves an already-hosted address exactly as it is
tests/utils/tinyUtils.test.ts :: choosing which way text runs (getFirstLetterLang) falls back to left to right when there is no text
tests/utils/tinyUtils.test.ts :: choosing which way text runs (getFirstLetterLang) ignores spaces before the first letter
tests/utils/tinyUtils.test.ts :: choosing which way text runs (getFirstLetterLang) reads Arabic and Kurdish text right to left
tests/utils/tinyUtils.test.ts :: choosing which way text runs (getFirstLetterLang) reads Latin text left to right
tests/utils/tinyUtils.test.ts :: cleaning typed input (pollinateInput) cuts anything longer than ninety characters
tests/utils/tinyUtils.test.ts :: cleaning typed input (pollinateInput) gives an empty result for anything that is not text
tests/utils/tinyUtils.test.ts :: cleaning typed input (pollinateInput) leaves ordinary words alone
tests/utils/tinyUtils.test.ts :: cleaning typed input (pollinateInput) removes the characters that could carry a command
tests/utils/tinyUtils.test.ts :: finding the chosen product option (findVariation) finds it by colour alone when no size was chosen
tests/utils/tinyUtils.test.ts :: finding the chosen product option (findVariation) finds it by size alone when no colour was chosen
tests/utils/tinyUtils.test.ts :: finding the chosen product option (findVariation) finds the one matching both a colour and a size
tests/utils/tinyUtils.test.ts :: finding the chosen product option (findVariation) gives nothing back when nothing was chosen
tests/utils/tinyUtils.test.ts :: finding the chosen product option (findVariation) gives nothing back when the choice has no matching option
tests/utils/tinyUtils.test.ts :: locking the page behind an overlay (DisableScroll, EnableScroll) can stop the page moving without sending it to the top
tests/utils/tinyUtils.test.ts :: locking the page behind an overlay (DisableScroll, EnableScroll) lets the page move again
tests/utils/tinyUtils.test.ts :: locking the page behind an overlay (DisableScroll, EnableScroll) stops the page moving and sends it to the top
tests/utils/tinyUtils.test.ts :: matching a colour (isSameColor) matches a plain name against a full colour record
tests/utils/tinyUtils.test.ts :: matching a colour (isSameColor) matches two names ignoring capitals and spaces
tests/utils/tinyUtils.test.ts :: matching a colour (isSameColor) says no for two different colours
tests/utils/tinyUtils.test.ts :: matching a colour (isSameColor) says no when either side is missing
tests/utils/tinyUtils.test.ts :: naming a day of the week (ShowDayStr) counts from Sunday, the way the backend does
tests/utils/tinyUtils.test.ts :: naming a day of the week (ShowDayStr) gives nothing back for a day number that does not exist
tests/utils/tinyUtils.test.ts :: naming the screen for analytics (DetectScreen) falls back to the home screen for anything else
tests/utils/tinyUtils.test.ts :: naming the screen for analytics (DetectScreen) names the basket whenever it is open, whatever page is behind it
tests/utils/tinyUtils.test.ts :: naming the screen for analytics (DetectScreen) names the boutique screen rather than the general filters one
tests/utils/tinyUtils.test.ts :: naming the screen for analytics (DetectScreen) names the filters screen
tests/utils/tinyUtils.test.ts :: naming the screen for analytics (DetectScreen) names the product screen
tests/utils/tinyUtils.test.ts :: naming the screen for analytics (DetectScreen) names the settings screen
tests/utils/tinyUtils.test.ts :: naming where a visitor came from (getReferralSource) does not mistake an ordinary address for X
tests/utils/tinyUtils.test.ts :: naming where a visitor came from (getReferralSource) names X only for X itself
tests/utils/tinyUtils.test.ts :: naming where a visitor came from (getReferralSource) names the social sites it knows
tests/utils/tinyUtils.test.ts :: naming where a visitor came from (getReferralSource) says 'direct' when there is no previous page
tests/utils/tinyUtils.test.ts :: naming where a visitor came from (getReferralSource) says 'other' for a site it does not know
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) asks the market backend for the currency, by name
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) does not throw when the request itself fails
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) falls back to the flat shape when the nested one is empty
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) hands back nothing, and reports, when the backend refuses
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) still reads the older flat reply, where the fields sit at the top
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) treats a reply that succeeded but carried no currency as a failure
tests/utils/tinyUtils.test.ts :: reading the currency back (getCurrency) unwraps the currency from inside the reply
tests/utils/tinyUtils.test.ts :: spotting a guest account (isGuestName) does not mistake a real name for a guest
tests/utils/tinyUtils.test.ts :: spotting a guest account (isGuestName) ignores capitals and spaces around the name
tests/utils/tinyUtils.test.ts :: spotting a guest account (isGuestName) knows the three names a guest can carry
tests/utils/tinyUtils.test.ts :: tidying a typed phone number (sanitizePhone) does not invent a plus that was not typed
tests/utils/tinyUtils.test.ts :: tidying a typed phone number (sanitizePhone) gives an empty result for text with no digits
tests/utils/tinyUtils.test.ts :: tidying a typed phone number (sanitizePhone) keeps a leading plus and only that one
tests/utils/tinyUtils.test.ts :: tidying a typed phone number (sanitizePhone) removes the spacing people type
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) does the same on the address screens, in the language it is handed
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) reads a bare timestamp as universal time, unlike the address version
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) reads a time with no zone marker as universal time
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) says today for a time from today
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) says yesterday for a time from the day before
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) takes Today from the translator rather than writing it in English
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) takes Yesterday from the translator too
tests/utils/tinyUtils.test.ts :: writing a time a shopper can read (formatTime) writes the full date for anything older
tests/utils/tinyUtils.test.ts :: writing an address out (GetAddressString) does not start the line with a bar when the first parts are missing
tests/utils/tinyUtils.test.ts :: writing an address out (GetAddressString) gives an empty line back when there is no address at all
tests/utils/tinyUtils.test.ts :: writing an address out (GetAddressString) joins the parts it was given with bars
tests/utils/tinyUtils.test.ts :: writing an address out (GetAddressString) leaves no gap when a part in the middle is missing
tests/utils/tinyUtils.test.ts :: writing an address out (GetAddressString) skips the parts that were never filled in
tests/utils/tinyUtils.test.ts :: writing an address out (GetAddressString) treats the word 'null' as an empty part, not as a place name
utils/functions.test.ts :: COMPARE_CHANGED_EVENT is the name the compare helpers announce
utils/functions.test.ts :: GetCartOreview puts the overview into the shared state
utils/functions.test.ts :: GetCartOreview records the failure instead of throwing
utils/functions.test.ts :: GetCartOreview records the reason when the failure is not a real Error
utils/functions.test.ts :: LogError copes with a bare piece of text
utils/functions.test.ts :: LogError copes with being handed nothing
utils/functions.test.ts :: LogError flattens a real Error into its message, name and stack
utils/functions.test.ts :: LogError hands on the error with everything it knows about the session
utils/functions.test.ts :: LogError leaves out the browser name when there is no browser
utils/functions.test.ts :: LogError never throws when the send fails
utils/functions.test.ts :: LogError never throws, even when reporting itself fails
utils/functions.test.ts :: LogError still reports when there is no browser
utils/functions.test.ts :: LogError stops without reporting while the user is logging out
utils/functions.test.ts :: RoundPrice accepts a price given as text
utils/functions.test.ts :: RoundPrice falls back to English when nobody has a language at all
utils/functions.test.ts :: RoundPrice falls back to the shared state's language when the caller passes none
utils/functions.test.ts :: RoundPrice lets an explicit rate win over the currency in the shared state
utils/functions.test.ts :: RoundPrice lets the language passed in win over the shared state's
utils/functions.test.ts :: RoundPrice multiplies without the usual decimal drift
utils/functions.test.ts :: RoundPrice pins today's behaviour: just under a million still reads as 1000K
utils/functions.test.ts :: RoundPrice returns a plain number below the thousands boundary
utils/functions.test.ts :: RoundPrice returns the converted number untouched when asked for a number
utils/functions.test.ts :: RoundPrice returns the string zero for a price of zero
utils/functions.test.ts :: RoundPrice rounds a price up, never to the nearest
utils/functions.test.ts :: RoundPrice takes the rate and the decimal places from the currency in the shared state
utils/functions.test.ts :: RoundPrice treats a missing or unreadable price as nothing
utils/functions.test.ts :: RoundPrice uses the Arabic short forms when Arabic is passed in
utils/functions.test.ts :: RoundPrice uses the short millions form at a million and above
utils/functions.test.ts :: RoundPrice uses the short thousands form from the boundary up
utils/functions.test.ts :: SSRDetect reports false when there is no browser
utils/functions.test.ts :: SSRDetect reports true when a browser is present
utils/functions.test.ts :: WaitForCondition finishes straight away when the flag is already set
utils/functions.test.ts :: WaitForCondition finishes when the flag is set while it waits
utils/functions.test.ts :: WaitForCondition gives up after ten seconds instead of waiting for ever
utils/functions.test.ts :: _isStoreLastJson is false when the setting is empty
utils/functions.test.ts :: _isStoreLastJson is true when the setting has any value
utils/functions.test.ts :: addToCompare fills the first slot when nothing is being compared
utils/functions.test.ts :: addToCompare fills the second slot when the first is taken
utils/functions.test.ts :: addToCompare replaces the first slot when both are taken
utils/functions.test.ts :: addToCompare still fills the slot when there is no browser to tell
utils/functions.test.ts :: addToCompare tells the browser the comparison changed
utils/functions.test.ts :: areProductsEqual says no for a different product id
utils/functions.test.ts :: areProductsEqual says no when any one choice differs
utils/functions.test.ts :: areProductsEqual says no when either product is missing
utils/functions.test.ts :: areProductsEqual says yes for the same product with the same choices
utils/functions.test.ts :: areProductsEqual treats a missing choice and an empty one as the same
utils/functions.test.ts :: getCart gives up with an empty cart when no user ever arrives
utils/functions.test.ts :: getCart loads the cart and puts it into the shared state
utils/functions.test.ts :: getCart picks the user up when one arrives while it is waiting
utils/functions.test.ts :: getCart records the reason and returns an empty cart when the request fails
utils/functions.test.ts :: getCart records the reason when the failure is not a real Error
utils/functions.test.ts :: getCart returns an empty cart when the request fails and nobody passed a callback
utils/functions.test.ts :: getConfiguredImage builds the address from a plain text source
utils/functions.test.ts :: getConfiguredImage builds the same address from an object source as from text
utils/functions.test.ts :: getConfiguredImage includes the width and the padded form for an object source too
utils/functions.test.ts :: getConfiguredImage includes the width when one is given
utils/functions.test.ts :: getConfiguredImage returns an empty string for an object with no path
utils/functions.test.ts :: getConfiguredImage returns an empty string when there is no source at all
utils/functions.test.ts :: getConfiguredImage returns the path unchanged for an object that is not on the media host
utils/functions.test.ts :: getConfiguredImage switches to the padded form when asked
utils/functions.test.ts :: getOldCart copes with a reply that carries no saved cart
utils/functions.test.ts :: getOldCart gives up without asking when no user ever arrives
utils/functions.test.ts :: getOldCart loads the saved cart and sorts it newest first
utils/functions.test.ts :: getOldCart picks the user up when one arrives while it is waiting
utils/functions.test.ts :: getOldCart reads the reply through the wrapper shape when there is one
utils/functions.test.ts :: getOldCart records the failure instead of throwing
utils/functions.test.ts :: getOldCart records the reason when the failure is not a real Error
utils/functions.test.ts :: getUserChat returns an empty object when there is no chat user
utils/functions.test.ts :: getUserChat returns the chat user from the shared state
utils/functions.test.ts :: getUserStories falls back to the id held in the profile cookie
utils/functions.test.ts :: getUserStories returns an undefined id when there is no state and no cookie
utils/functions.test.ts :: getUserStories returns the story user from the shared state
utils/functions.test.ts :: getUserStories writes nothing to the console
utils/functions.test.ts :: onClickSearchHistory hands back the stored list unchanged on a repeat
utils/functions.test.ts :: onClickSearchHistory puts a new word at the front of the list
utils/functions.test.ts :: onClickSearchHistory starts a new list when nothing is stored
utils/functions.test.ts :: onClickSearchHistory starts again when the stored history is not a list
utils/functions.test.ts :: onClickSearchHistory starts again when the stored history is not valid data
utils/functions.test.ts :: removeFromCompare announces nothing when nothing changed
utils/functions.test.ts :: removeFromCompare empties the comparison when the only entry is removed
utils/functions.test.ts :: removeFromCompare empties the comparison when the second slot was the only one filled
utils/functions.test.ts :: removeFromCompare keeps the first slot when the second is removed
utils/functions.test.ts :: removeFromCompare moves the second slot up when the first is removed
utils/functions.test.ts :: removeFromCompare returns nothing at all for a slug that is in neither slot
utils/functions.test.ts :: removeFromCompare still announces a change when a slug was removed
utils/functions.test.ts :: storeError copes with being handed nothing
utils/functions.test.ts :: storeError does nothing at all when there is no browser
utils/functions.test.ts :: storeError posts the error to the internal log endpoint
utils/functions.test.ts :: storeError swallows a failed send rather than throwing
utils/functions.test.ts :: translateFunction asks the app for the language when there is no browser
utils/functions.test.ts :: translateFunction gives the key back at first, then the translation, and keeps giving unknown keys back
utils/functions.test.ts :: translateFunction gives the key back for English
utils/functions.test.ts :: translateFunction gives the key back for a language nobody has translations for
utils/functions.test.ts :: translateFunction gives the key back for an address with no language part
utils/functions.test.ts :: translateFunction gives the key back when the app language is English and there is no browser
utils/functions.test.ts :: translateFunction ignores the language passed in when a browser is present
utils/functions.test.ts :: translateFunction loads Turkish and Kurdish the same way
utils/functions.test.ts :: translateFunction prefers the language passed in over the app's, when there is no browser
-->
