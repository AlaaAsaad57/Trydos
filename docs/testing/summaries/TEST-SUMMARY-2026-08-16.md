# Test summary — 16 August 2026

**We checked the small helpers the whole app leans on — product pictures, addresses, filter links, dates — and what the app remembers about your account. The checks found five faults, all five are now fixed, and everything passes.**

| | |
|---|---|
| **New checks added this time** | 107 |
| **Checks in the app in total** | 756 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 6.1% of the code |
| **Date** | 2026-08-16 |

---

## What we checked this time

### Showing product pictures and videos

- When a picture already has a full web address, then it is used exactly as it is.
- When a picture path arrives on its own, then the media address is put in front of it.
- When a picture path already starts with a slash, then the address is not given two.
- When an uploaded file's path has no opening slash, then the missing slash is added.
- When there is no picture at all, then nothing is returned, not a broken address.
- When a picture field holds something that is not text, then it is handed back untouched.
- When an uploaded file names the media server itself, then its own address is used as final.
- When a video is named on its own, then the media address, folder and file type are added.
- When a video name already ends in .mp4, then the file type is not added twice.
- When a video name starts with a slash, then the address is not given two.
- When a video already has a full address, then it is left exactly as it is.

### Building a filter link

- When no filters are chosen, then the link carries none.
- When the same filters are chosen in a different order, then both people land on one address.
- When several choices of one kind are made, then they are joined with commas.
- When a colour is chosen, then the hash is dropped so the address still reaches the server.

### Writing out an address

- When every part of an address is filled in, then they are shown joined by bars.
- When parts of an address were never filled in, then they are left out.
- When the backend sends the word 'null' for a part, then it is treated as empty, not printed.
- When a part in the middle is missing, then no empty gap is left between the bars.
- When the first parts are missing, then the line does not start with a bar.
- When there is no address at all, then an empty line is shown.

### Guest accounts and phone numbers

- When an account carries one of the three guest names, then it is recognised as a guest.
- When a guest name has capitals or spaces around it, then it is still recognised.
- When a real shopper's name is checked, then it is not mistaken for a guest.
- When a phone number is typed with spaces, dashes or brackets, then those are removed.
- When a phone number starts with a plus, then that one plus is kept.
- When a plus is typed mid-number, then it is removed, not treated as a country code.
- When text with no digits is entered as a phone number, then nothing is left.

### Which way text runs on the page

- When text starts with an Arabic or Kurdish letter, then it is laid out right to left.
- When text starts with a Latin letter, then it is laid out left to right.
- When text starts with spaces, then the first real letter decides the direction.
- When there is no text at all, then it is laid out left to right.

### Where a visitor came from

- When there is no previous page, then the visit is recorded as direct.
- When a visitor arrives from Facebook or Instagram, then that site is named.
- When a visitor arrives from X or Twitter, then it is recorded as X.
- When an ordinary site merely contains the letter x, then it is not mistaken for X.
- When a visitor arrives from a site we do not list, then it is recorded as other.

### Choosing a colour and size on a product

- When two colour names differ only by capitals or spaces, then they count as the same.
- When a colour name is compared with a full colour record, then a match on either counts.
- When one side of a colour comparison is missing, then the two do not match.
- When two different colours are compared, then they do not match.
- When a colour and a size are both chosen, then the matching product option is found.
- When only a colour is chosen, then the option for that colour is found.
- When only a size is chosen, then the option for that size is found.
- When nothing is chosen, then no product option is returned.
- When the chosen pair does not exist, then no product option is returned.

### Cleaning up what people type

- When typed text holds characters that could carry a command, then they are removed.
- When typed text is longer than ninety characters, then it is cut to ninety.
- When ordinary words are typed, then they are left alone.
- When something that is not text is passed in, then an empty result comes back.

### Opening a panel over the page

- When a panel opens, then the page behind it stops moving and returns to the top.
- When the basket opens, then the page stops moving but keeps the shopper's place.
- When the panel closes, then the page can be moved again.

### Recording which screen a shopper is on

- When a shopper is in the settings pages, then the settings screen is recorded.
- When the basket is open, then the basket is recorded, whatever page sits behind it.
- When a shopper is on a product page, then the product screen is recorded.
- When a shopper is in a boutique, then the boutique screen is recorded, not the filters one.
- When a shopper is filtering, then the filters screen is recorded.
- When the page is none of these, then the home screen is recorded.

### Showing dates and times

- When something happened today, then the time is shown with the word Today.
- When something happened the day before, then the time is shown with the word Yesterday.
- When something happened longer ago, then the full date is shown.
- When the page is in another language, then Today is taken from the translations.
- When the page is in another language, then Yesterday is taken from the translations.
- When a date is shown on an address screen, then it is translated in the language given.
- When a time arrives with no zone marker, then it is read as universal time.
- When an address time arrives the same way, then it is read as local time, by design.
- When a day number arrives from the backend, then zero means Sunday and six means Saturday.
- When a day number does not exist, then no day name is returned.

### Ending a session

- When a signed-in session expires, then the account details stay but are marked as not verified.
- When someone signs out on purpose, then every stored account detail is cleared.
- When a session ends either way, then the old error message and the remaining-tries count reset.
- When a session ends and nothing was stored, then nothing is invented and it stays empty.

### Signing in and remembering the account

- When someone signs in, then their account and profile are saved and the failure mark is cleared.
- When sign-in details arrive and some are already stored, then the new ones are added to the old.
- When sign-in details arrive and nothing was stored yet, then the new ones are saved as they are.
- When account details are edited, then the change reaches both the profile and the signed-in copy.
- When a fresh profile arrives, then it replaces the stored profile and updates the signed-in copy.
- When a phone or email is verified, then only the profile record is updated.
- When account details are updated and no profile is stored, then it still works without an error.
- When someone changes their name, then it changes in both the signed-in details and the profile.
- When someone changes their name and no profile is stored, then it still works without an error.

### The very first time something is stored

- When someone signs in on a fresh tab, then the reply becomes both the account and its copy.
- When someone signs in and no profile was stored, then the profile is started from that reply.
- When a profile arrives and nobody was signed in, then the signed-in details are built from it.
- When a phone or email is verified and no profile was stored, then a profile is started for it.
- When chat details arrive and nothing was stored, then they are saved as the new record.
- When stories details arrive and a record already exists, then the new ones are added to it.
- When wallet details arrive and a record already exists, then the new ones are added to it.

### Being asked to verify again

- When nothing is wrong, then the verify-again prompt stays off, and it can be turned on and off.
- When a verify-again finishes, then the outcome is recorded so a waiting request can carry on.
- When a session expires, then that phone number is kept so the shopper does not type it again.

### What a screen sees before anything has loaded

- When the orders have not been counted yet, then that shows as unknown, not as zero orders.
- When notification settings arrive, then they replace the old ones, so a turned-off one stays off.
- When the list of notification kinds arrives, then it is stored, starting from an empty list.
- When a wrong code is entered, then the message is kept, and it can be cleared again.
- When a code is being checked, then the reference for that check is held.
- When a temporary user is held during sign-up, then the signed-in account is left alone.
- When no address is in use, then that is the starting state, and it can be switched on.

### Getting the sign-in wrong

- When a sign-in attempt fails, then it is marked as failed and one try is used up.
- When no tries are left and another one fails, then the count stops at zero and goes no lower.

### Notification choices

- When a notification subject is turned on, then only that one changes.
- When a notification subject is turned off, then only that one is removed.
- When a notification subject changes, then the other notification settings stay as they were.

### When the backend refuses a shopper's pass

- When a request is refused and there is no pass to test with, then a throwaway one is used.
- When a new guest pass arrives on its own, then nothing empty is stored for the missing parts.
- When the recovery itself breaks, then the fault is reported and the shopper gets the refusal.

Another 53 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 1692 | 27895 | 6.1% |
| Decision points | 1196 | 25120 | 4.8% |
| Functions | 265 | 7126 | 3.7% |

Out of 726 files in the app, 13 have a test written for them. Another 56 are only touched
because a tested file uses them, and 657 have nothing at all.

### The parts we set out to test

Nine of the thirteen are now checked completely.

| Part of the app | Share checked |
|---|---|
| Landing on the right language and country — proxy.ts | 100.0% |
| Sending a signed-in request — serverRequests/HandleAuthedFetch.ts | 100.0% |
| Asking the backends for data — serverRequests/ServerFetch.tsx | 100.0% |
| Not asking twice for the same thing — serverRequests/requestDedup.ts | 100.0% |
| What the app remembers about your account — store/auth/reducer.tsx | 100.0% |
| Shared helpers, including prices — utils/functions.tsx | 100.0% |
| Holding the one-time-code limit — utils/otpLocks.ts | 100.0% |
| Renewing an expired session — utils/server/authRefresh.ts | 100.0% |
| Recording one-time-code events — utils/server/otpTelemetry.ts | 100.0% |
| Which service may be reached — utils/server/tokenManager.ts | 98.9% |
| Sending requests from the browser — utils/fetchData.ts | 98.7% |
| Who a one-time code belongs to — utils/server/otpIdentity.ts | 98.4% |
| The small shared helpers — utils/tinyUtils.tsx | 59.2% |

The last one was picked because 115 other files use it, and one function inside it —
the one that builds every picture address — is called from 219 places. What is still
unchecked there is the part that talks to the network or asks the browser for permission.

### Reading these numbers

- **What is checked well:** language routing, the backends, sign-in, and the shared helpers.
- **What has nothing yet:** the screens people see, the pages, and the rules behind them.
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
tests/setup.test.tsx :: the render setup adds the page checks to expect
tests/setup.test.tsx :: the render setup drives a click through user-event
tests/setup.test.tsx :: the render setup takes the last test's markup off the page first
tests/setup.test.tsx :: the server boundary hands back a cache that is always empty
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
