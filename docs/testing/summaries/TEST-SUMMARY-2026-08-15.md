# Test summary — 15 August 2026

**This round checked how the app talks to our backends: sending requests, retrying when the network drops, and signing the shopper back in when a session expires. Everything passes.**

| | |
|---|---|
| **New checks added this time** | 100 |
| **Checks in the app in total** | 432 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 3.6% of the code |
| **Date** | 2026-08-15 |

---

## What we checked this time

### Staying signed in while pages load

- When a signed-in shopper opens a page, then the request carries their sign-in and the answer is unchanged.
- When nobody is signed in, then the page still loads and no sign-in is sent with it.
- When a request is refused while the shopper is signing out, then no new sign-in is created.
- When a request is refused and the page cannot save cookies, then no one-time credential is used up.
- When a session expires and a renewal is possible, then it renews once and retries the request once.
- When the renewal fails, then the refusal is passed back and the shopper is not turned into a guest.
- When a signed-in shopper's session expires with no way to renew, then they are not replaced by a guest.
- When a guest's session expires, then one new guest is made, the old one cleared, and it retries once.
- When a new guest is created, then both details are stored hidden from scripts and one lasts longer.
- When the retry is refused as well, then the app stops instead of trying again and again.
- When creating a guest fails, then nothing already saved on the visitor's device is changed.
- When creating a guest returns nothing usable, then nothing already saved is changed.

### Getting pages from the backend, even when it is slow

- When the backend answers first time, then the page gets the answer and status and nothing is repeated.
- When a page asks for data, then the visitor's country and language go with the request.
- When a file is being uploaded, then the request lets the upload describe itself.
- When the backend refuses in a way that will not change, then the app gives up at once.
- When a backend call fails, then the failure is reported with its code and the address that was called.
- When the backend returns a very long error, then only a short part of it is reported.
- When the backend is broken, then the call is retried a few times and then reported as failed.
- When the backend is unavailable, then the call is retried a few times and then reported as failed.
- When the backend takes too long, then the call is retried a few times and then reported as failed.
- When the backend says there are too many requests, then the call is retried a few times, then reported.
- When a repeat attempt works, then the app stops trying and uses that answer.
- When attempts keep failing, then each wait gets longer, but never longer than one second.
- When the connection itself drops, then the call is retried and the failure is reported without a code.

### Sending requests from the shopper's browser

- When the shopper is signing out, then no more requests are sent.
- When a simple request is made, then the answer comes back marked as successful.
- When a visitor identity is still being set up, then requests wait for it before they are sent.
- When the same request is asked for twice at once, then it is only sent once.
- When a second part of the page asks for data already on its way, then both get the same answer.
- When a caller has already given up before joining a shared request, then it gets nothing back.
- When a caller gives up while waiting on a shared request, then only that caller stops waiting.
- When a request is allowed to reuse a recent answer, then the saved answer is used instead.
- When sign-out begins, then requests still in the air are stopped.
- When the page asks for data but has already moved on, then the request is not made.
- When the address names a country and language, then the request uses them.
- When the address names neither, then the visitor's saved country and language are used.
- When a guest identity is being created, then the app marks itself as not ready until it finishes.

### Sending each request to the right place

- When a story is uploaded, then the request goes straight to the media address.
- When a story upload only reads data, then nothing extra is sent with it.
- When the request is handled by our own site, then it stays on the site and carries plain data.
- When our own site receives a file, then the request lets the file describe itself.
- When our own site is only being read from, then no data is attached.
- When a seller's request goes through the gateway, then the seller is named and the data passed on.
- When a gateway request carries structured data, then it is sent in the agreed format.
- When a file goes through the gateway, then it is passed on as a file.
- When a gateway request only reads, then it carries no data.
- When a target address has special characters, then it is written safely into the request.
- When the answer cannot be read, then the app handles it instead of breaking.

### The messages people see after an action

- When a seller's page fails to load, then they are sent back to the home page.
- When a sign-in is already being renewed, then the shopper is not sent away mid-way.
- When the backend refuses a request, then the problem is raised and reported to us.
- When a coupon is accepted, then the shopper sees a success message.
- When a coupon is rejected, then the shopper sees the reason.
- When an item is removed from the basket, then the shopper sees it confirmed.
- When a basket action succeeds, then the shopper sees a success message.
- When a basket action fails, then the shopper sees an error message.
- When updating the basket is refused, then the shopper is told it did not work.
- When updating the basket works, then the shopper sees it confirmed.
- When a basket update comes back with a known problem, then it is not reported to us as a fault.
- When a basket update fails unexpectedly, then it is reported to us.
- When any request succeeds with a message, then that message is shown to the shopper.
- When a request asks to stay quiet, then no success message is shown.
- When the backend sends a message we choose to hide, then the shopper sees nothing.

### Trying again when the network drops

- When the network drops while reading data, then the app tries again and gets the answer.
- When reading data keeps failing, then the app stops after a set number of tries.
- When the backend answers with a passing problem, then the read is tried again and works.
- When the network drops while saving, then it is not sent again, to avoid doing it twice.
- When a request does not say what it does, then it is treated as a read and may be tried again.
- When adding to the basket fails, then the shopper sees a basket error message.
- When an error message is one we choose to hide, then the shopper sees nothing.
- When a request is stopped on purpose, then it is not reported to us as a fault.
- When a request asks to stay quiet, then no error message is shown either.
- When a request is retried after a fresh sign-in, then the original action runs again.

### Signing in again on shop and seller pages

- When a search is refused, then it is always tried again.
- When a shop request is refused and the session can be renewed, then it is renewed and retried.
- When a seller dashboard request is refused, then the session is renewed and the request retried.
- When a sign-in is already being renewed, then the request waits rather than starting another.
- When the shopper cancels the sign-in prompt, then the request stops and does not go through.
- When a visitor identity is still being created, then the refused request waits for it.
- When a seller's session expires, then they are asked to sign in again and the request waits.
- When a verified shopper's session expires, then the request waits until they sign in again.
- When a guest's session expires, then a new guest is started and shopping continues.
- When nobody signs in again within five minutes, then the waiting request gives up.
- When our own sign-in address is refused, then the session is renewed and the request retried.
- When one of our own addresses with a query is refused, then it is renewed and tried again.
- When an address that never needs sign-in is refused, then the app says sign-in is required.
- When the shopper signs out while a renewal is waiting, then the renewal stops.
- When a refusal comes from a place with no renewal rule, then the app says sign-in is required.
- When an address belongs to the seller area, then it is handled with the seller rules.

### Signing in again in chat, stories and other areas

- When a chat request is refused, then the session is renewed and the message goes through.
- When chat cannot be renewed quietly, then the shopper is asked to sign in again.
- When chat is refused a second time, then it stops renewing and asks the shopper to sign in.
- When a stories request is refused, then the session is renewed and it loads.
- When stories cannot be renewed quietly, then the shopper is asked to sign in again.
- When a sign-in prompt is already open, then a refused stories request joins it instead of a new one.
- When the shopper closes the sign-in prompt, then the stories request ends quietly.
- When the sign-in prompt is left open too long, then the stories request gives up.
- When a comment is refused, then the shopper signs in again and the comment goes through.
- When a wallet request is refused, then the shopper signs in again and it goes through.

Another 67 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 994 | 27801 | 3.6% |
| Decision points | 654 | 25031 | 2.6% |
| Functions | 133 | 7110 | 1.9% |

Of 718 app files, 5 have a test of their own. 59 more are only touched because a tested file
uses them, and 654 have nothing at all.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Landing on the right language and country — proxy.ts | 100.0% |
| Server-side calls to the backends — serverRequests/ServerFetch.tsx | 100.0% |
| Shared helpers — utils/functions.tsx | 100.0% |
| Requests from the browser — utils/fetchData.ts | 98.7% |
| Staying signed in on server pages — serverRequests/HandleAuthedFetch.ts | 92.3% |

### Reading these numbers

- **What is checked well:** the five files above are checked almost line by line, and
  together they carry every request the app makes.
- **What has nothing yet:** the screens people see, the business rules behind them, and
  the pages and addresses that serve them.
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
tests/utils/tokenManager.test.ts :: backend routing (AC-18) does not match a sibling that merely starts the same way
tests/utils/tokenManager.test.ts :: backend routing (AC-18) ignores a query string when matching the allow-list
tests/utils/tokenManager.test.ts :: backend routing (AC-18) leaves an address that is not allow-listed to the core backend
tests/utils/tokenManager.test.ts :: backend routing (AC-18) matches an address that ends in a changing segment
tests/utils/tokenManager.test.ts :: backend routing (AC-18) recognises an allow-listed address
tests/utils/tokenManager.test.ts :: backend routing (AC-18) sends a guest to the gateway
tests/utils/tokenManager.test.ts :: backend routing (AC-18) sends a verified shopper to the core backend
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) gives a token cookie 48 hours by default, not a year
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) keeps profile cookies for a year, and encodes what it stores
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) keeps the refresh cookie alive for 30 days, far longer than the token
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) lets the deployment override the token lifetime
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) marks cookies secure in production and not outside it
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) records every option when a cookie is actually written
tests/utils/tokenManager.test.ts :: cookie shape (AC-15) writes token cookies hidden from the browser, same-site strict, site-wide
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives an unknown service an empty credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives chat its own credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives comments its own credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives market its own credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives market-dashboard its own credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives search no credential rather than someone else's
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives stories its own credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) gives wallet its own credential
tests/utils/tokenManager.test.ts :: credential lookup (AC-16) never hands out the legacy device cookie
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) counts a real phone as verified
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count an empty string as a verified phone
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count null as a verified phone
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count only spaces as a verified phone
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count the number zero as a verified phone
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count the text "0" as a verified phone
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) does not count undefined as a verified phone
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) falls back to guest when the profile cannot be read at all
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) reads the profile cookie to decide
tests/utils/tokenManager.test.ts :: verified-shopper detection (AC-17) treats a missing profile as not verified
tests/utils/tokenManager.test.ts :: what leaves the server (AC-19) hides a short credential completely rather than mostly
tests/utils/tokenManager.test.ts :: what leaves the server (AC-19) reduces a credential in a log to an unusable hint
tests/utils/tokenManager.test.ts :: what leaves the server (AC-19) removes the private wallet fields and keeps the useful ones
tests/utils/tokenManager.test.ts :: what leaves the server (AC-19) returns nothing for an absent profile rather than an empty shell
tests/utils/tokenManager.test.ts :: what leaves the server (AC-19) strips tokens from a profile before the browser sees it
tests/utils/tokenManager.test.ts :: what leaves the server (AC-19) strips tokens, including the refresh token, from a service profile
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
