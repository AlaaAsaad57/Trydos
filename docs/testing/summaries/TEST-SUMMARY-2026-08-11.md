# Test summary — 11 August 2026

**194 automatic checks now run over the app and every one of them passes. They cover the part of
the site that decides which language and country a visitor lands on, and the shared helpers behind
translations, prices, pictures, the basket and product comparison.**

| | |
|---|---|
| **New checks added this time** | 194 |
| **Checks in the app in total** | 194 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 2.4% of the code |
| **Date** | 2026-08-11 |

---

## What we checked this time

### Landing on the right language

- When the address already says English, then the visitor stays on English.
- When the address already says Arabic, then the visitor stays on Arabic.
- When the address already says Turkish, then the visitor stays on Turkish.
- When the address already says Kurdish, then the visitor stays on Kurdish.
- When the address names a language we do not offer, then the visitor gets English instead.
- When the address names no language, then the visitor gets the one their browser asks for.
- When the browser asks for no language at all, then the visitor gets English.
- When the browser asks only for languages we do not offer, then the visitor gets English.

### Landing on the right country

- When a saved country was stored in capital letters, then it is still accepted.
- When the country a visit comes from arrives in capital letters, then it is still accepted.
- When a visitor chose a country before, then that beats the country their connection suggests.
- When a visitor never chose one, then the country of their connection beats our default.
- When a saved country is one we do not serve, then the visitor gets the United Kingdom instead.
- When a saved pair names a language we do not offer, then the whole saved pair is ignored.
- When the language was saved under the older name, then it is still found.
- When a visitor arrives from Syria, then Syria is treated as a country we serve.
- When a visitor arrives from Lebanon, then Lebanon is treated as a country we serve.
- When a visitor arrives from Turkey, then Turkey is treated as a country we serve.
- When a visitor arrives from Iraq, then Iraq is treated as a country we serve.

### Getting sent to the right address

- When the address already names a country and language we serve, then the visit is left alone.
- When the address names neither, then both are put at the front and the rest is kept exactly.
- When the visitor asks for the home page, then only the country and language are added.
- When the address starts with a country we do not serve, then it is replaced, not doubled.
- When the address starts with a language we do not offer, then it is replaced, not doubled.
- When an unsupported prefix has nothing after it, then it is still replaced on its own.
- When an unsupported prefix is written in capital letters, then it is still replaced correctly.
- When the redirect limit is reached, then the prefix is still replaced and never doubled.
- When a returning visitor asks for the home page, then they go to the country and language they saved.
- When any visit is handled, then it is let through or redirected, and never quietly swapped.

### When the saved country and the address disagree

- When the saved country differs from the address, then both are flagged instead of switching silently.
- When the address says United Kingdom but another was saved, then the visitor moves to the saved one.
- When such an address ends with a slash, then it is still handled correctly.
- When that flag is already on the address, then the visit is let through and not redirected again.
- When a visitor has been redirected too many times, then they land on a working default address.
- When the limit is reached on the home page, then they land on a plain default address.
- When the redirect count is still under the limit, then redirecting carries on as normal.

### Search engines and link previews

- When Google's crawler arrives at a proper address, then it is let straight through.
- When Bing's crawler arrives at a proper address, then it is let straight through.
- When Facebook's link preview arrives at a proper address, then it is let straight through.
- When X's link preview arrives at a proper address, then it is let straight through.
- When LinkedIn's link preview arrives at a proper address, then it is let straight through.
- When a crawler arrives without a country and language, then it gets a permanent redirect to one.
- When a crawler is handled, then no country-question flags are ever added to its address.
- When a crawler is handled, then nothing is stored on it about language or country.
- When a crawler asks for the home page, then it is sent to a full country and language address.
- When a crawler lands on a prefix we do not serve, then it is sent to one we do.
- When an ordinary browser arrives, then it is treated as a person and not as a crawler.

### What the site remembers about a visit

- When a visitor is served a page, then the country and language are stored for the page to read.
- When a visitor is served a page, then their network address is stored where page scripts cannot read it.
- When a visit passes through, then the network address it really came from is the one stored.
- When the network address has not changed, then it is not written again.
- When the stored country and language already match the address, then they are not written again.
- When only the language differs from what was stored, then the one in the address is stored.
- When a visitor arrives from another website, then that website is stored as where they came from.
- When a visitor arrives from a page on this same site, then no referring website is stored.
- When a visitor arrives with a campaign tag, then the referring website is stored anyway.
- When a real page is served, then any leftover sign-out marker is cleared.
- When the visit is only a redirect step, then the sign-out marker is kept for the next step.
- When a lifetime is configured for stored values, then that lifetime is used.

### The country question popup

- When the address carries the no-country flag, then the popup is shown instead of a redirect.
- When a redirect happens, then the timing flag is dropped from the address on the way.
- When the visitor answers the popup, then their choice is taken and they are not asked again.
- When the answer arrives on an address with no country and language, then a proper one is built.
- When the answer arrives on an address that already has them, then the choice is honoured as it is.
- When other values are left in the address, then the visitor is sent to the cleaned-up address.

### Search-engine files and tidy addresses

- When a crawler asks for the site map, then it gets the raw file untouched.
- When a crawler asks for the product site map, then it gets the raw file untouched.
- When a site map is asked for under a country and language, then it is still served untouched.
- When a product site map is asked for that way, then it is still served untouched.
- When the saved country disagrees with a site map address, then the site map is still served.
- When a page name merely contains the word robots, then it is left alone as a normal page.
- When the crawler rules file itself is asked for, then it is served.
- When that file is asked for without the file ending, then it is still served.
- When the address is typed in capitals, then the visitor is permanently redirected to small letters.
- When that capitals redirect happens, then the speed-up hints are left off it.
- When a real page is served, then the speed-up hints are included.

### Which requests are handled at all

- When the home page is asked for, then the language and country check runs.
- When a shop page is asked for, then the check runs.
- When a product page is asked for, then the check runs.
- When the checkout is asked for, then the check runs.
- When the sign-in service is called, then the check is skipped.
- When a code file for the site is fetched, then the check is skipped.
- When a picture is resized by the site, then the check is skipped.
- When the site map is fetched, then the check is skipped.
- When the crawler rules file is fetched, then the check is skipped.
- When the little tab icon is fetched, then the check is skipped.
- When a stored image is fetched, then the check is skipped.
- When a translation file is fetched, then the check is skipped.
- When the site quietly pre-loads the next page, then the check is skipped.

### Keeping the list of countries we serve up to date

- When a visit is handled, then the country list is refreshed in the background and nothing else is.
- When the list is refreshed, then the country the visit came from is sent with the request.
- When the refresh fails, then the site keeps working from its built-in list of countries.
- When the refresh answers with an error, then the built-in list is kept.
- When the refresh answers without a country list, then the built-in list is kept.
- When several visits arrive together, then the answer is remembered and asked for only once.
- When the site starts fresh, then nothing is carried over from before.

### Showing the site in the visitor's language

- When the language is English, then the wording is shown exactly as written.
- When the address carries no language, then the wording is shown in English.
- When a translation is still loading, then English shows first, and unknown wording stays English.
- When Turkish or Kurdish is chosen, then those translations load in the same way.
- When a language has no translations at all, then the English wording is shown.
- When wording is prepared before the page reaches the browser, then the app's language is used.
- When that is done and the app language is English, then the English wording is used.
- When a language is given before the page reaches the browser, then that language is used.
- When a language is given inside the browser, then the visitor's own language is used instead.
- When the code runs inside a visitor's browser, then it correctly knows a browser is there.
- When the code runs before the page reaches the browser, then it correctly knows there is none.

### Showing the right price

- When a price is zero, then it is shown as zero.
- When a price is under a thousand, then it is shown as a plain number.
- When a price reaches a thousand, then it is shortened to the K form.
- ⚠️ When a price is just under a million, then it still reads as 1000K — recorded, not approved.
- When a price reaches a million, then it is shortened to the M form.
- When the visitor reads Arabic, then the Arabic short forms are used.
- When no language is given, then the one the app is using is taken.
- When nobody has set a language at all, then English is used.
- When a language is given, then it wins over the one the app is using.
- When a plain number is asked for, then the converted price is given without any shortening.
- When no rate is given, then the rate and decimal places come from the chosen currency.
- When a rate is given, then it wins over the visitor's chosen currency.
- When a price is converted, then it multiplies exactly and never drifts by a penny.
- When a converted price has extra decimals, then it is rounded up, never to the nearest.
- When a price is missing or unreadable, then it is treated as nothing rather than shown wrong.
- When a price arrives written as text, then it is still converted correctly.

### Showing product pictures

- When a picture address is given as text, then the full address is built from it.
- When a width is given, then it is included in the picture address.
- When a padded picture is asked for, then the padded form is used.
- When a picture is given as a set of details, then the same address is built as from plain text.
- When a picture is given as details with a width and padding, then both are included.
- When a picture is not on our media host, then its address is passed through unchanged.
- When there is no picture at all, then an empty address is given rather than a broken one.
- When the details carry no path, then an empty address is given rather than a broken one.

### The basket

- When the basket is loaded, then its contents are put where the whole app can see them.
- When loading the basket fails, then the reason is recorded and an empty basket is shown.
- When that failure is not a normal error, then the reason is still recorded.
- When loading fails and nothing was waiting on it, then an empty basket is still shown.
- When no visitor is ever identified, then loading gives up with an empty basket.
- When a visitor is identified while loading waits, then loading picks up and carries on.
- When a saved basket is loaded, then its items are shown newest first.
- When the reply is wrapped in an outer layer, then the saved basket is still read from it.
- When the reply carries no saved basket, then nothing breaks.
- When loading a saved basket fails, then the reason is recorded instead of the page breaking.
- When that failure is not a normal error, then the reason is still recorded.
- When a visitor is identified while it waits, then the saved basket is loaded.
- When no visitor is ever identified, then it gives up without asking the server.
- When the basket summary is loaded, then it is put where the whole app can see it.
- When loading the summary fails, then the reason is recorded instead of the page breaking.
- When that summary failure is not a normal error, then the reason is still recorded.

### Comparing products

- When the comparison changes, then the rest of the page is told using one agreed signal.
- When nothing is being compared, then the first product fills the first slot.
- When one product is being compared, then the next one fills the second slot.
- When both slots are full, then a new product replaces the first one.
- When there is no browser to tell, then the slot is still filled correctly.
- When a product is added, then the page is told the comparison changed.
- When the first of two products is removed, then the second moves up into its place.
- When the only product being compared is removed, then the comparison is emptied.
- When the second of two products is removed, then the first stays where it is.
- When the second slot held the only product, then removing it empties the comparison.
- When a product that is not being compared is removed, then nothing happens.
- When nothing actually changed, then the page is not told about a change.
- When a product really was removed, then the page is told the comparison changed.
- When either product is missing, then the two are not treated as the same.
- When two entries are the same product with the same choices, then they are treated as the same.
- When two entries are different products, then they are not treated as the same.
- When any one choice differs, then the two entries are not treated as the same.
- When one entry has no choice and the other an empty one, then they are treated as the same.

### Recent searches

- When nothing has been searched before, then the first search starts a new list.
- When a new word is searched, then it goes to the front of the recent list.
- When a word already in the list is searched again, then the list is left as it is.
- When the stored list is damaged, then it is thrown away and a fresh one is started.
- When the stored list is not a list at all, then it is thrown away and a fresh one is started.

### Knowing who the visitor is

- When a visitor is signed in, then the chat side of the app knows who they are.
- When nobody is signed in, then the chat side gets nothing rather than a wrong person.
- When a visitor is signed in, then the stories side of the app knows who they are.
- When the app has forgotten, then the visitor is identified from what the browser stored.
- When there is nothing stored either, then no visitor is identified.
- When the visitor is looked up, then nothing is printed into the browser console.

### When something goes wrong

- When a configuration switch is left empty, then it counts as off.
- When that switch has any value at all, then it counts as on.
- When something the app waits for is ready already, then it carries on immediately.
- When it becomes ready while the app waits, then the app carries on at that moment.
- When it never becomes ready, then the app gives up after ten seconds instead of hanging.
- When an error happens, then it is sent to our internal error record.
- When there is no browser, then no error record is sent.
- When sending the error fails, then the failure is swallowed and the page keeps working.
- When nothing at all is handed over, then recording still copes without breaking.
- When an error is reported, then everything known about the session goes with it.
- When the visitor is signing out, then errors are not reported.
- When a real error is reported, then its message, type and trail are recorded.
- When only a piece of text is reported, then it is still recorded.
- When nothing is handed over to the reporter, then it still copes without breaking.
- When reporting itself goes wrong, then the page never breaks because of it.
- When sending the report fails, then the page never breaks because of it.
- When there is no browser, then the error is still reported.
- When there is no browser, then the browser name is left out of the report.

Another 71 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 670 | 27764 | 2.4% |
| Decision points | 347 | 24997 | 1.4% |
| Functions | 80 | 7100 | 1.1% |

Of the 716 files in the app, 2 have a test of their own. Another 60 are touched only because a
tested file uses them, and 654 have nothing at all.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Deciding a visitor's language and country — proxy.ts | 100.0% |
| Shared helpers for prices, pictures, basket and comparison — utils/functions.tsx | 100.0% |

### Reading these numbers

- **What is checked well:** the two parts we chose are fully checked, and both run on every page.
- **What has nothing yet:** the screens people see, the business rules, the pages and the
  connections to our backends have no checks of their own.
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
