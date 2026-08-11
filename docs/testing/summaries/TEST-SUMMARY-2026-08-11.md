# Test summary — 11 August 2026

**177 automatic checks now run over the app, and all of them pass. This first round covers the
part of the site that decides which language and country a visitor lands on, and the shared
helpers behind prices, the basket and product comparison.**

| | |
|---|---|
| **New checks on the app this time** | 177 |
| **Checks on the app in total** | 177 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 2.4% of the code |
| **Date** | 2026-08-11 |

---

## What we checked this time

### Choosing the visitor's language

- When the address already says English, then the visitor stays on English.
- When the address already says Arabic, then the visitor stays on Arabic.
- When the address already says Turkish, then the visitor stays on Turkish.
- When the address already says Kurdish, then the visitor stays on Kurdish.
- When the address names a language we do not offer, then the visitor gets English.
- When the address has no language, then the visitor gets the one their browser asks for.
- When the browser sends no language preference, then the visitor gets English.
- When the browser asks only for languages we do not offer, then the visitor gets English.

### Choosing the visitor's country

- When a saved country was stored in capitals, then it is still accepted.
- When the country of a visit arrives in capitals, then it is still accepted.
- When a visitor chose a country before, then that beats the country their connection suggests.
- When a visitor chose nothing, then their connection's country beats our default.
- When a saved country is one we do not serve, then the visitor gets the United Kingdom.
- When a saved country and language pair has a language we do not offer, then the pair is ignored.
- When the language was stored under the older cookie name, then it is still found.
- When a visitor arrives from Syria, then Syria is treated as a country we serve.
- When a visitor arrives from Lebanon, then Lebanon is treated as a country we serve.
- When a visitor arrives from Turkey, then Turkey is treated as a country we serve.
- When a visitor arrives from Iraq, then Iraq is treated as a country we serve.

### Sending the visitor to the right address

- When the address already names a country and language we serve, then the visit is left alone.
- When the address has neither, then both are added to the front and the rest is kept exactly.
- When the visitor asks for the home page, then the country and language are added on their own.
- When the address starts with a country we do not serve, then it is replaced, not added to.
- When the address starts with a language we do not offer, then it is replaced, not added to.
- When an unsupported prefix has nothing after it, then it is still replaced and never doubled.
- When an unsupported prefix is written in capitals, then it is still replaced and never doubled.
- When the redirect limit is reached, then the prefix is still replaced and never doubled.
- When any visit is handled, then it is let through or redirected, never quietly swapped.
- When a saved country differs from the address, then both are flagged instead of switching silently.
- When the address says United Kingdom and another was saved, then the visitor moves to the saved one.
- When that flag is already on the address, then the visit is let through and not redirected again.
- When a visitor has been redirected too many times, then they land on a working default address.
- When the redirect count is still under the limit, then redirecting carries on as normal.

### Search engines and sitemaps

- When Google's crawler arrives with a valid country and language, then it is let through.
- When Bing's crawler arrives the same way, then it is let through.
- When Facebook's link preview crawler arrives the same way, then it is let through.
- When X/Twitter's crawler arrives the same way, then it is let through.
- When LinkedIn's crawler arrives the same way, then it is let through.
- When a crawler arrives with no country and language, then it gets a permanent redirect to one.
- When a crawler is handled, then it never sees the country-change flags meant for real visitors.
- When a crawler is handled, then it is given no language cookies.
- When an ordinary browser arrives, then it is treated as a person, not as a crawler.
- When the sitemap is requested, then it is handed over untouched.
- When the product sitemap is requested, then it is handed over untouched.
- When a sitemap is requested under a country and language prefix, then it is handed over untouched.
- When a product sitemap is requested under a prefix, then it is handed over untouched.
- When a sitemap is requested and the saved country disagrees, then it is still handed over untouched.

### The robots file and capitalised addresses

- When a page's name merely contains the word "robots", then it is shown normally, not hijacked.
- When the robots file itself is requested, then it is served.
- When "/robots" is requested, then it goes to the robots file.
- When an address is typed in capitals, then it is permanently redirected to the small-letter form.
- When that redirect is sent, then it carries no connection-warming hints, as it renders nothing.
- When a real page is served, then it does carry the connection-warming hints.

### What the site remembers in the browser

- When a visitor is served, then the three language and country cookies are written for pages to read.
- When a visitor is served, then their IP address is stored where page scripts cannot read it.
- When a visitor genuinely arrives from another site, then that site is saved.
- When a visitor simply moves around inside our own site, then no referring site is saved.
- When a visit carries a marketing campaign tag, then the referring site is saved anyway.
- When a real page loads, then the "just logged out" marker is cleared.
- When the visit is only a redirect on the way, then that marker is kept.
- When a cookie lifetime is configured, then the cookies use it.

### Where this runs, and where it stays out

- When someone opens the home page, then this runs.
- When someone opens a shop page, then this runs.
- When someone opens a product page, then this runs.
- When someone opens the checkout page, then this runs.
- When the sign-in service is called, then this stays out of the way.
- When the site's own script files are fetched, then this stays out of the way.
- When the image service is called, then this stays out of the way.
- When the sitemap is fetched, then this stays out of the way.
- When the robots file is fetched, then this stays out of the way.
- When the site icon is fetched, then this stays out of the way.
- When an ordinary image file is fetched, then this stays out of the way.
- When a translation file is fetched, then this stays out of the way.
- When the site loads a page quietly in the background, then that request is skipped.

### Keeping the site up when the country service fails

- When a visit is handled, then the country lookup is the only outside call, made in the background.
- When that lookup is made, then the country the visit came from is sent with it.
- When that lookup fails, then the site keeps working from a built-in list of countries.
- When the lookup has already answered, then the answer is reused instead of asking again.
- When one check finishes, then nothing is remembered into the next one.

### Showing the right price

- When a price is zero, then it shows as zero.
- When a price is below one thousand, then it shows as a plain number.
- When a price is one thousand or more, then it shows in the short "K" form.
- When a price is one million or more, then it shows in the short "M" form.
- When the shopper is on Arabic, then the Arabic short forms are used.
- When no language is given, then the shopper's current language is used.
- When no language is set anywhere, then English is used.
- When a language is passed in directly, then it beats the shopper's current one.
- When a page needs to do its own maths, then the price can come back as a raw number.
- When a price is converted, then the rate and decimals come from the shopper's chosen currency.
- When a rate is passed in directly, then it beats the chosen currency's rate.
- When a price is converted, then it multiplies exactly and never drifts by a penny.
- When a price is rounded, then it always rounds up, so we never show less than the real price.
- When a price is missing or unreadable, then it counts as nothing rather than showing wrong.
- When a price arrives as text rather than a number, then it still works.

### Showing text in the right language

- When the site runs inside a real browser, then it correctly spots that.
- When the site runs on the server with no browser, then it correctly spots that.
- When the text is English, then it is shown as written with no lookup.
- When the address has no language part, then English is used.
- When a translation is still loading, then English shows first and is replaced when it arrives.
- When the language is Turkish or Kurdish, then translations load the same way as Arabic.
- When a language has no translation file, then English is shown rather than blanks.
- When the site runs on the server, then the language comes from the app's own setting.
- When the server language is English, then the text is used as written.
- When a language is passed in on the server, then it beats the app setting.
- When a real browser is present, then the browser's own language wins instead.

### The basket

- When a shopper's basket loads, then it is stored so every page shows the same contents.
- When loading the basket fails, then the reason is recorded and the shopper sees an empty basket.
- When that failure is not a normal error, then it is still recorded properly.
- When loading fails and no follow-up handler was given, then the basket still comes back empty.
- When no shopper is ever identified, then it gives up with an empty basket instead of waiting for ever.
- When the shopper is identified while it waits, then it carries on and loads their basket.
- When a previously saved basket loads, then the newest items come first.
- When the saved basket arrives wrapped in an extra layer, then it is still read correctly.
- When the reply carries no saved basket, then it is handled without failing.
- When loading the saved basket fails, then the reason is recorded, not thrown at the shopper.
- When that failure is not a normal error, then it is still recorded properly.
- When the shopper is identified while it waits, then it goes on to load the saved basket.
- When no shopper ever arrives, then it gives up quietly without asking.
- When the basket summary loads, then it is stored for the pages that show it.
- When loading the summary fails, then the reason is recorded, not thrown at the shopper.
- When that failure is not a normal error, then it is still recorded properly.

### Comparing products

- When the site announces a comparison change, then it uses one fixed name the pages listen for.
- When nothing is being compared and a product is added, then it goes into the first slot.
- When one product is being compared and another is added, then it goes into the second slot.
- When two are being compared and a third is added, then it replaces the first.
- When a product is added with no browser present, then it still fills its slot.
- When the comparison changes, then the page is told so it can update.
- When the first product is removed, then the second moves into its place.
- When the only product is removed, then the comparison is emptied.
- When the second product is removed, then the first stays where it is.
- When the second was the only one filled and is removed, then the comparison is emptied.
- When a product that was never compared is removed, then nothing changes.
- When nothing actually changed, then nothing is announced.
- When a product really was removed, then the change is announced.
- When either product is missing, then the two do not count as the same.
- When the product and every chosen option match, then the two count as the same.
- When the product itself differs, then the two do not count as the same.
- When any one chosen option differs, then the two do not count as the same.
- When one option is blank and the other was never chosen, then they count as the same.

### Product images

- When an image source is plain text, then the image address is built from it.
- When a width is asked for, then it is included in the address.
- When the padded version is asked for, then the address switches to it.
- When an image source is an object, then it builds the same address as plain text.
- When a width and padding are asked for on an object source, then both are included.
- When an image is already hosted elsewhere, then its address is left exactly as it is.
- When there is no image source at all, then an empty result comes back, not a broken image.
- When an object has no image path, then an empty result comes back.

### Recent searches

- When nothing has been searched before, then the first search starts a new list.
- When a new word is searched, then it goes to the front of the list.
- When the same word is searched twice, then the list comes back unchanged.
- When the saved history is damaged, then it is thrown away and the list starts again.
- When the saved history is the wrong shape, then it is thrown away and the list starts again.

### Knowing who the visitor is

- When a chat identity is in the app's memory, then it is used.
- When there is no chat identity, then an empty result comes back rather than an error.
- When a stories identity is in the app's memory, then it is used.
- When it is missing there, then the saved profile is used instead.
- When neither is available, then nothing comes back and nothing breaks.
- When the identity is looked up, then nothing is printed into the browser console.
- When the configuration setting is empty, then it reads as off.
- When the setting has any value, then it reads as on.

### Recording problems

- When an error happens, then it is sent to our internal log.
- When there is no browser involved, then nothing is sent.
- When the send itself fails, then it is swallowed rather than causing a second error.
- When nothing at all is handed in, then it is handled safely.
- When an error is reported, then it carries everything known about the session.
- When a real error is reported, then it is flattened into a message, a type and a trace.
- When the error is plain text, then it is still reported.
- When nothing is handed in, then it is still handled safely.
- When the shopper is in the middle of logging out, then reporting is skipped.
- When the reporting itself fails, then it never throws.
- When the send fails, then it never throws.
- When the error came from the server, then it is still reported.
- When there is no browser, then the browser name is left out.
- When the thing being waited for is already ready, then waiting finishes immediately.
- When it becomes ready while waiting, then waiting finishes there and then.
- When it never becomes ready, then waiting gives up after ten seconds.

Another 71 checks keep the testing setup itself honest — they protect the tests, not the app, so
they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 662 | 27,771 | 2.4% |
| Decision points | 333 | 25,009 | 1.3% |
| Functions | 80 | 7,100 | 1.1% |

Of **716** files: **2** have tests of their own, **60** are partly run only because a tested file
uses them, and **654** have nothing.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Shared helpers — prices, translation, basket, comparison | 100.0% |
| Language and country routing | 92.5% |

### Reading these numbers

- **What is checked well:** the routing every visit passes through (92.5%) and the shared helpers
  behind prices and the basket (100%) — the two pieces that break everything else when they break.
- **What has nothing yet:** all 478 screen files, every page and service call, and every business
  rule. That is why the whole-app figure is 2.4%; we have deliberately gone deep on two files first.
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
tests/proxy.test.ts :: crawlers (AC-7) treats an ordinary browser as a person, not a crawler
tests/proxy.test.ts :: crawlers (AC-7) writes no locale cookies for a crawler
tests/proxy.test.ts :: passing through or redirecting (AC-4) does not double the prefix when the bounce limit is reached either
tests/proxy.test.ts :: passing through or redirecting (AC-4) handles the site root, where there is no path to keep
tests/proxy.test.ts :: passing through or redirecting (AC-4) lets a request with a valid pair through untouched
tests/proxy.test.ts :: passing through or redirecting (AC-4) never rewrites — every answer is a pass-through or a redirect
tests/proxy.test.ts :: passing through or redirecting (AC-4) puts the pair in front of the path and keeps the rest of the address
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps a locale-shaped prefix it does not support for the default, without doubling it (/gb-fr/shop)
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps a locale-shaped prefix it does not support for the default, without doubling it (/xx-en/shop)
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps an unsupported prefix that has nothing after it
tests/proxy.test.ts :: passing through or redirecting (AC-4) swaps an unsupported prefix written in capitals
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /gb-en/sitemap-products.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /lb-en/sitemap.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /sitemap-products.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) lets /sitemap.xml through untouched so a crawler gets the raw file
tests/proxy.test.ts :: sitemap addresses (AC-9) still lets a sitemap through when the saved country disagrees with the address
tests/proxy.test.ts :: the bounce limit (AC-6) still bounces while the count is within the limit
tests/proxy.test.ts :: the bounce limit (AC-6) stops bouncing after the allowed number and lands on a default address
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) clears the logout marker on a real page render
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) does not save the referring site when the visit came from this same site
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) keeps the logout marker on a redirect hop
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) saves the referring site anyway when the visit carries a campaign marker
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) saves the referring site when the visit really came from somewhere else
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) takes the cookie lifetime from the setting when one is given
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) writes the three locale cookies so the browser can read them
tests/proxy.test.ts :: the cookies the proxy leaves behind (AC-8) writes the visitor's IP address so page scripts cannot read it
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
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) keeps working when the lookup fails, using the built-in fallback list
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) remembers the answer within one loaded copy and asks only once
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) sends the country the request came from with the lookup
tests/proxy.test.ts :: what leaves the process, and what is remembered (AC-12, AC-13) starts the country lookup in the background and nothing else
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
tests/setup.test.tsx :: the render setup adds the page checks to expect
tests/setup.test.tsx :: the render setup drives a click through user-event
tests/setup.test.tsx :: the render setup takes the last test's markup off the page first
tests/setup.test.tsx :: the server boundary hands back a cache that is always empty
tests/setup.test.tsx :: the server boundary never loads the real cache layer
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
