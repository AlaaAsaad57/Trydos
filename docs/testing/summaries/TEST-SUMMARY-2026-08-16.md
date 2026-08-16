# Test summary — 16 August 2026

**No new checks were added since yesterday. The whole set was run again and everything passes.**

| | |
|---|---|
| **New checks added this time** | 0 |
| **Checks in the app in total** | 525 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 4.7% of the code |
| **Date** | 2026-08-16 |

---

## What we checked this time

Nothing new was added. The 525 checks listed in the earlier summaries were all run
again and all of them passed. The share of the app that is checked has not moved.

Another 71 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 1300 | 27908 | 4.7% |
| Decision points | 867 | 25135 | 3.4% |
| Functions | 186 | 7126 | 2.6% |

The app has 721 files. 11 of them have a test written for them. 58 more are touched
only because a tested file uses them, so they are not really checked. 652 have nothing.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Landing on the right language and country | 100.0% |
| Asking a backend for page data | 100.0% |
| Avoiding repeat work in one page load | 100.0% |
| Shared helpers, such as prices and dates | 100.0% |
| The wait between sign-in code requests | 100.0% |
| Renewing a session that has expired | 100.0% |
| Recording what happens with sign-in codes | 100.0% |
| Choosing which backend a request goes to | 98.9% |
| Sending requests from the browser | 98.7% |
| Knowing who asked for a sign-in code | 98.4% |
| Signing a shopper back in mid-request | 92.3% |

### Reading these numbers

- **What is checked well:** sign-in codes, session renewal, language and country, and backend calls.
- **What has nothing yet:** every screen people see, the shopping rules, and all pages and routes.
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
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) creates one guest identity, clears the old one, and retries once
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) leaves every existing cookie alone when creating a guest fails (AC-10)
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) leaves every existing cookie alone when creating a guest returns no credential (AC-10)
tests/serverRequests/HandleAuthedFetch.test.ts :: a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10) stops after one retry when the retry is rejected too (AC-9)
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
tests/services/authRefreshSession.test.ts :: RefreshSession dedup does NOT share a chat refresh with a stories refresh
tests/services/authRefreshSession.test.ts :: RefreshSession dedup does NOT share a market refresh with a chat refresh
tests/services/authRefreshSession.test.ts :: RefreshSession dedup does NOT share a market refresh with a stories refresh
tests/services/authRefreshSession.test.ts :: RefreshSession dedup market and market-dashboard share one exchange (same token pair)
tests/services/authRefreshSession.test.ts :: RefreshSession dedup never refreshes while logging out
tests/services/authRefreshSession.test.ts :: RefreshSession dedup releases the key so a later 401 on the same service can refresh again
tests/services/authRefreshSession.test.ts :: RefreshSession dedup shares one round trip for concurrent 401s on the SAME service
tests/setup.test.tsx :: the render setup adds the page checks to expect
tests/setup.test.tsx :: the render setup drives a click through user-event
tests/setup.test.tsx :: the render setup takes the last test's markup off the page first
tests/setup.test.tsx :: the server boundary hands back a cache that is always empty
tests/setup.test.tsx :: the server boundary never loads the real cache layer
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
