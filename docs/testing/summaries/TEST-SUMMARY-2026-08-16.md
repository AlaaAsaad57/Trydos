# Test summary — 16 August 2026

**We checked the shared helpers the whole storefront runs on — product pictures, prices, filter
links, search order, dates and error reports — and what the app remembers about your account.
Everything passes. Seven faults were found along the way; they are recorded here, not yet fixed.**

| | |
|---|---|
| **New checks added this time** | 320 |
| **Checks in the app in total** | 969 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 8.5% of the code |
| **Date** | 2026-08-16 |

---

## What we checked this time

### Product pictures on a card

- When a picture already has a full web address, then it is used exactly as it is.
- When a picture is stored as a bare file name, then the media address is put in front of it.
- When that file name already starts with a slash, then no second slash is added.
- When there is no picture at all, then nothing is returned rather than a broken address.
- When a picture is stored as something other than text, then it is handed back untouched.
- When an upload record points at the media server, then its own address is used as final.
- When an upload record's path has no slash, then the missing slash is added.
- When a slot needs a set height, then the media server is asked for the picture at that height.
- When a slot also has a width, then the width is asked for alongside the height.
- When a slot asks for padding, then the picture is padded to a fixed width.
- ⚠️ When an upload record is resized, then the slash before the version is lost and the address
  breaks — recorded as it is today, not as we want it.
- When an upload record is not on the media server, then it is left exactly as it is.
- When there is no picture to resize, then an empty address is returned.
- When a picture has a full address, then resizing leaves that address alone.
- When a picture is a bare file name, then the media address is put in front of it.
- When that name already starts with a slash, then no second slash is added.
- When there is no picture, then nothing is returned.
- When an upload record names the media server, then its own address is used as final.
- ⚠️ When an upload record's path has no slash, then it is glued onto the media address and
  breaks — recorded as it is today, not as we want it.

### Banners, brand logos and sharing pictures

- When a boutique banner is shown, then it is asked for at the wide size the banner slot needs.
- When a boutique has no banner picture, then an empty address is returned.
- When a page is shared, then the picture is sized to what the social sites expect.
- When a sharing picture sits on the internal host, then it is moved onto the public one.
- When a sharing picture is not on the media server, then it is left exactly as it is.
- When there is no sharing picture, then nothing is returned.
- When a brand logo is shown, then it is fitted into the small logo box.
- When a caller asks for a different logo size, then that size is used instead.
- When a brand logo is hosted somewhere else, then it is left exactly as it is.
- When a brand has no logo, then an empty address is returned.

### Showing a price

- When a price is shown, then it is converted into the shopper's own currency.
- When a price is converted, then it multiplies exactly and never drifts by a penny.
- When a converted price falls between two pennies, then it is always rounded up, never down.
- When no exchange rate is given, then the price is shown as it is.
- When a price is an ordinary one, then it is written out in full.
- When an item is free, then the price shows as zero.
- When a price runs into the hundreds of thousands, then it is shortened to thousands.
- When a price runs into the millions, then it is shortened to millions.
- When the site is in Arabic, then the Arabic short forms are used instead of K and M.
- ⚠️ When the currency has not loaded yet, then the price shows as "NaNM" — recorded as it is
  today, not as we want it.
- When a discount is a percentage, then that share is taken off the price.
- When a discount is a fixed amount, then that amount is taken off the price.
- When a discount is larger than the price, then the price stops at zero and never goes below.

### The price a shopper in one country pays

- When a product has no country prices, then the ordinary price is shown.
- When a product has no offer price, then the full price is shown instead.
- When a product has a price for the shopper's country, then that price is shown.
- When the country prices arrive as text rather than a list, then they are still read.
- When a product has prices for other countries only, then the ordinary price is shown.
- When a country is written with odd spacing or capitals, then it is still matched.
- When only the older extra-charge shape is stored, then that charge is added to the price.
- When no country is known, then the ordinary price is shown.
- When a country price entry names no country, then it is ignored.
- When a country price is not a number, then it is ignored.
- When the country prices cannot be read at all, then the ordinary price is shown.
- When a country is listed twice, then the last entry is the one used.
- When a product has no country prices, then the ordinary full price is struck through.
- When a country carries an extra charge, then it is added to the struck-through price.
- ⚠️ When a country price is stored with no extra charge, then the struck-through price stays at
  the ordinary one and can read lower than the price paid — recorded as it is today.
- When a country's charge would push the full price below zero, then it stops at zero.
- When only the older extra-charge shape is stored, then the struck-through price uses it.
- When no country is known, then the ordinary full price is struck through.

### Which products fall inside a chosen price band

- When no country is known, then the band is matched against the ordinary price.
- When a band has only a lower end, then it is treated as that one price.
- When a country is known, then its own price is looked at first and the ordinary one otherwise.
- When a product has no country prices at all, then the search still runs rather than failing.
- When a listing is shown, then the cheapest and dearest products on it are reported.
- When a listing has a price spread, then it is split into four bands a shopper can pick from.
- When a listing has no products, then the price band reads as zero rather than as missing.
- When every product on a listing costs the same, then no bands are offered.
- When a product has no price at all, then it is left out of the band.
- When a country is known, then the band is worked out from that country's prices.

### The price slider and the price cards

- When the slider is drawn, then the whole price span is split into a fixed number of steps.
- When every product costs the same, then the step falls back to one rather than to nothing.
- When both ordinary and country prices exist, then they are merged into one price span.
- When only one of the two has products in it, then that one is used on its own.
- When nothing matched the search, then the span reads as zero.
- When the two price sets line up on a step, then their counts are added together.
- When the steps are drawn, then they run cheapest first.
- When nothing matched the search, then an empty distribution is returned.
- When price cards are offered, then each holds roughly the same number of products.
- When price cards are offered, then they run from the cheapest product to the dearest.
- When nearly every product sits in one wide band, then the cards still come out balanced.
- When there is only one product, then a single card is offered.
- When there is nothing to show, then no cards are offered.
- When no card count is asked for, then five cards are offered.

### The order a listing comes in

- When the website asks for products, then the heavy fields are left out of the reply.
- When the phone app asks for products, then those heavy fields are added back.
- When products are asked for, then both price shapes come back so a country price can be read.
- When no order is asked for, then the best matches come first.
- When an order we do not know is asked for, then the best matches come first.
- When a shopper asks for best selling, then the most sold products come first.
- When a shopper asks by date, then the newest or the oldest products come first.
- When a shopper asks by price, then the cheapest or the dearest products come first.
- When a shopper asks by name, then the name in their own language is the one sorted on.
- When a product has no name in that language, then it goes to the end whichever way is chosen.
- When a listing is paged through, then the same tie-breaker always ends the order, so no product
  is ever repeated or skipped.
- When a field is missing from the search server, then the listing degrades rather than failing.

### The filter lists in the side panel

- When a brand's details came back, then its name and logo are shown.
- When a brand's details are missing, then it is still listed, with its count.
- When a boutique has banners, then the first one that has not been deleted is shown.
- When a banner is shown, then the page is never told that other banners were deleted.
- When a boutique has no banner, then none is shown.
- When a boutique's details are missing, then it is still listed, with its count.
- When a filter list is long, then ten filters are shown per page.
- When the page number is out of range, then the first page is shown rather than nothing.
- When a category has children, then they are listed alongside the category itself.
- When there are no related categories, then the category list is left exactly as it is.
- When there are related categories, then they are added at the end and marked as related.
- When a category appears on both lists, then it is kept rather than one copy being hidden.

### Clicking a filter

- When a shopper clicks a filter that was not chosen, then it is added to the address.
- When a filter is already in the address, then it shows as chosen.
- When a shopper clicks a filter that was chosen, then it is taken back out.
- When one filter of a kind is added, then the others of that kind are kept.
- When one filter of a kind is removed, then the others of that kind are kept.
- When a filter is clicked, then the choices of every other kind are left untouched.
- When a colour is chosen, then it is stored with its hash and written into the address without.
- When a colour is stored either way, then it still shows as chosen.
- When a chosen colour is clicked, then it is taken back out in either form.
- When one colour is added, then the colours already chosen are kept.
- When a new price band is clicked, then it replaces the one chosen before.
- When the chosen price band is clicked again, then the price filter is cleared.
- When a child category is chosen, then its parent is dropped from the address.
- When a filter is clicked during a search, then the search and the sort order are carried across.
- When no language is set, then the address is built without one.
- When an older filter link is clicked, then the choice is added to the query instead of the path.
- When an older filter link is clicked twice, then the choice is taken back out of the query.
- When an older price band is clicked, then it replaces the one chosen before.
- When an older query cannot be read, then the fault is reported and the filter starts fresh.
- ⚠️ When older filters do not arrive as a real query, then they are ignored and the choice is
  added a second time — recorded as it is today, not as we want it.

### Building a filter link

- When nothing is chosen, then no filter link is built.
- When several kinds are chosen, then the link always uses the same order, whatever order they
  were clicked in.
- When several choices of one kind are made, then they are joined with commas.
- When colours are chosen, then the hash is dropped so the address stays readable.
- When nothing is chosen, then no filter link is built.
- When several kinds are chosen, then the link always uses the same fixed order.
- When several choices of one kind are made, then they are joined with commas.
- When colours are chosen, then the hash is dropped from the address.
- When a filter is drawn, then it shows as chosen only if it is in the current list.

### Reading the filters out of a web address

- When an address carries no filters, then nothing is read from it.
- When an address lists several choices, then they are split on the commas.
- When an address carries colours, then the hash is put back so they can be matched.
- When a colour in the address already has a hash, then a second one is not added.
- When an address carries a search phrase, then it is kept whole rather than split.
- When an address holds a part we do not recognise, then it is skipped.
- When a filter name has no choices after it, then it is ignored.
- When an address carries related categories, then they are folded into the ordinary ones.
- When an address carries a list of numbers, then they are read as numbers.
- When something in that list is not a number, then it is dropped.
- When there is nothing to read, then an empty list is returned.

### Turning a search address into a search request

- When an address carries nothing, then nothing extra is asked of the search server.
- When categories are in the address, then they are asked for.
- When related categories are in the address, then they are added without repeats.
- When boutiques, brands, colours or tags are in the address, then each is asked for.
- When a price band is written as one number to another, then both ends are read.
- When the address asks for flash deals, then only flash deals are asked for.
- When the page itself is the flash deals page, then only flash deals are asked for.
- When a search phrase is wrapped in quotes, then the quotes are stripped off.
- When sizes are chosen, then they are read out of the attributes in the address.
- When the page is the featured page, then only featured products are asked for.

### Building a product card from a search result

- When a card is built, then both the price paid and the price struck through are shown.
- When a country is known, then that country's prices are the ones shown.
- When a product has stock, then it shows as in stock, and as out of stock when it has none.
- When today falls inside a flash deal's dates, then the deal shows as running.
- When a flash deal's end date has passed, then it shows as finished.
- When a flash deal was switched off, then it is ignored.
- When a product has a reward price, then it is shown, and it is left off when there is none.
- When a brand has wording in the shopper's language, then that wording is the one used.
- When a brand record does not say it is verified, then it is shown as unverified.
- When a listing is built, then only the wording in the shopper's language is kept.
- When a product has nothing written in that language, then it is left off the listing.
- When a product has no wording at all, then it is left off the listing.
- When a listing is built, then the price band across everything on it is reported.
- When a product no longer has a colour, then that colour's picture set is dropped.
- When a picture is named on a card, then it is turned into an address the page can load.
- When the picture sets arrive as text rather than a list, then they are still read.
- When a colour is a trending one, then the card says so plainly.
- When there are no products to tidy, then nothing is changed.

### Putting the chosen colour first

- When a shopper filters by colour, then that colour moves to the front of the product's colours.
- When no colour is chosen, then the colours are left in the order they came in.
- When a shopper filters by colour, then that colour's pictures move to the front.
- When a product has none of the chosen colours, then its pictures are left alone.
- When no colour is chosen, then the pictures are left in the order they came in.
- When the pictures are re-ordered, then the list the page was given is not changed underneath it.

### Product page addresses and product videos

- When a product is linked to, then the address points at the right country and language site.
- When a colour is chosen, then it is carried in the address so the page opens on that colour.
- When a video is shown, then the media address, the folder and the file type are added.
- When a video name already ends in the file type, then it is not added twice.
- When a video name starts with a slash, then no second slash appears in the address.
- When a preview is wanted, then the short preview is asked for instead of the full video.
- When there is no video, then an empty address is returned.
- ⚠️ When a video already has a full address, then an extra slash is put into it — recorded as it
  is today, not as we want it.
- ⚠️ When a caller gives no options at all, then building the video address fails — recorded as it
  is today; no caller does this yet.
- When a video is shown, then the media address, the folder and the file type are added.
- When a video name already ends in the file type, then it is not added twice.
- When a video name starts with a slash, then no second slash appears in the address.
- When a video already has a full address, then it is left exactly as it is.

### Whether search engines may list the site

- When indexing is not turned on, then search engines are told to stay out of the whole site.
- When indexing is turned on, then the site's own search-engine settings are used.

### Writing a delivery address out

- When an address has all its parts, then they are joined with bars.
- When a part was never filled in, then it is left out.
- When a part holds the word "null", then it is treated as empty, not as a place name.
- When a part in the middle is missing, then no gap is left where it was.
- When the first parts are missing, then the line does not start with a bar.
- When there is no address at all, then an empty line is returned.

### Guest names, phone numbers and typed input

- When an account carries one of the three guest names, then it is spotted as a guest.
- When a guest name has odd capitals or spacing, then it is still spotted.
- When an account has a real name, then it is not mistaken for a guest.
- When a phone number is typed with spacing, then the spacing is removed.
- When a phone number starts with a plus, then that one plus is kept and no other.
- When a phone number has no plus, then one is not invented.
- When text holds no digits at all, then an empty phone number is returned.
- When a shopper types characters that could carry a command, then those characters are removed.
- When a shopper types more than ninety characters, then the rest is cut off.
- When a shopper types ordinary words, then they are left alone.
- When something that is not text arrives, then an empty result is returned.
- When a shopper types characters that could carry a command, then those characters are removed.
- When a shopper types more than ninety characters, then the rest is cut off.
- When something that is not text arrives, then an empty result is returned.

### Tidying text for display

- When a description carries formatting tags, then they are removed before it is shown.
- When there is no description, then an empty one is returned.
- When a thumbnail is needed, then the media server is asked for the small version.
- When there is no picture to shrink, then nothing is returned.
- When a name must be hidden, then only its first letters are shown and the rest become crosses.
- When there is no name to hide, then an empty result is returned.

### Which way the text runs

- When text starts with an Arabic or Kurdish letter, then it is laid out right to left.
- When text starts with a Latin letter, then it is laid out left to right.
- When text starts with spaces, then they are skipped before the direction is decided.
- When there is no text at all, then it is laid out left to right.

### Where a visitor came from and which screen they are on

- When there is no previous page, then the visit is recorded as direct.
- When a visitor comes from a social site we know, then that site is named.
- When a visitor comes from X, then X is named.
- When a visitor comes from an ordinary address, then it is not mistaken for X.
- When a visitor comes from a site we do not know, then it is recorded as other.
- When a shopper is on the settings screen, then that is the screen reported for analytics.
- When the basket is open, then the basket is reported whatever page is behind it.
- When a shopper is on a product screen, then the product screen is reported.
- When a shopper is on a boutique screen, then the boutique screen is reported, not the filters.
- When a shopper is on the filters screen, then the filters screen is reported.
- When a shopper is anywhere else, then the home screen is reported.

### Matching colours and product options

- When two colour names differ only in capitals or spacing, then they are treated as the same.
- When a plain colour name is checked against a full colour record, then they still match.
- When either side is missing, then they are not treated as the same.
- When two different colours are compared, then they are not treated as the same.
- When a shopper picks a colour and a size, then the option matching both is found.
- When only a colour is picked, then the option is found by colour alone.
- When only a size is picked, then the option is found by size alone.
- When nothing is picked, then no option is chosen.
- When a picked combination has no matching option, then no option is chosen.

### Locking the page behind an overlay

- When an overlay opens, then the page stops moving and jumps to the top.
- When an overlay opens in place, then the page stops moving without jumping to the top.
- When an overlay closes, then the page can be moved again.

### Dates and times a shopper reads

- When a time is from today, then it reads as "Today".
- When a time is from the day before, then it reads as "Yesterday".
- When a time is older than that, then the full date is written out.
- When a time carries no zone marker, then it is read as universal time.
- When "Today" is shown, then it comes from the translator rather than being written in English.
- When "Yesterday" is shown, then it comes from the translator too.
- When a time is shown on the address screens, then the same words are used, in the language the
  screen was handed.
- When a bare timestamp reaches the address screens, then it is read as local time — a deliberate
  difference from the rest of the app, confirmed as intended.
- When a day number arrives from the backend, then it is counted from Sunday, the way the backend
  counts it.
- When a day number does not exist, then no day name is returned.

### Signing out and failed attempts

- When a session expires, then the shopper's records are kept and marked as unverified.
- When a shopper cancels for any other reason, then every record is cleared.
- When a shopper cancels either way, then the attempt counter and the message are reset.
- When a session was already empty, then it stays empty rather than records being invented.
- When a code is entered wrongly, then the failure is flagged and one attempt is spent.
- When no attempts are left, then the counter stops at zero rather than going below.

### What the app stores when you sign in

- When a service record already exists, then the new details are merged into it.
- When a service record is missing, then it is created from what arrived.
- When a shopper signs in, then the account and the profile are merged and the failure flag clears.
- When a profile is edited, then both the profile and the signed-in account are updated.
- When a profile is replaced, then the profile is overwritten and the account is merged.
- When a verification arrives, then only the profile is updated.
- When there is no profile yet, then the details are stored without the app failing.
- When a chat record arrives first, then it is stored rather than dropped.
- When a stories record already exists, then the new details are merged into it.
- When a wallet record already exists, then the new details are merged into it.
- When nobody was signed in, then the sign-in reply becomes the signed-in account.
- When there was no profile, then it is started from the sign-in reply.
- When a fresh profile arrives first, then the signed-in account is built from it.
- When a verification arrives and no profile was stored, then a profile is started.

### Notification topics and renaming

- When a topic is switched on, then it is added and the other topics are left alone.
- When a topic is switched off, then only that topic is removed.
- When topics change, then the other notification settings stay untouched.
- When a shopper is renamed, then both the signed-in account and the profile are updated.
- When there is no profile to rename, then the rename still runs without the app failing.

### The re-verify prompt and the values screens start from

- When the app starts, then the re-verify prompt is off, and it can be turned on and cleared again.
- When re-verifying finishes, then the outcome is recorded so a waiting request can read it.
- When a session expires, then the phone number it belonged to is remembered.
- When no orders have been counted, then the count reads as "not counted yet", not as zero.
- When notification settings arrive, then they replace what was there rather than merging into it.
- When the kinds of notification on offer arrive, then they are stored, starting from none.
- When a code is wrong, then the message is kept, and it can be cleared again.
- When a code is being checked, then the reference for that check is held.
- When a temporary user is held, then the signed-in account is not touched.
- When an address is in use, then it is marked as such, starting from not in use.

### Staying signed in when a request is refused

- When a guest reply carries only part of what was expected, then only that part is stored.
- When there is no token to write back, then a throwaway one is used to check cookies can be
  written at all.
- When the recovery itself breaks, then the fault is reported and the original refusal is returned.

### Preparing a fault for the error log

- When a fault is reported, then its name, message and where it happened are all kept.
- When a fault is written to the log, then it is marked as a fault, not as an ordinary record.
- When a fault was caused by another, then the one that caused it is kept too.
- When several faults happened at once, then every one of them is kept.
- When a fault is buried inside an ordinary record, then it is still found and written out.
- When a fault is inside a list, then it is still found and written out.
- When a date is reported, then it is written in a form the log can read.
- When ordinary values are reported, then they pass through untouched.
- When a value the log cannot hold is reported, then it is written out as text instead.
- When part of a record was never filled in, then it is left out of the log.
- When a record points back at itself, then the log is written without the app hanging.
- When a list points back at itself, then the log is written without the app hanging.
- When a record is buried very deep, then the log stops going deeper rather than growing forever.

### Choosing the line the error log files a fault under

- When a fault carries a message, then that message is the line it is filed under.
- When the message sits one level in, then it is still found.
- When there is no message but the fault itself has one, then that one is used.
- When a fault carries no message at all, then the whole fault is written out instead.
- When the fault is plain text, then that text is the line.
- When the fault is not text, then it is written out as text.
- When there is nothing to go on, then it is filed as an unknown fault.
- When a message is empty, then it is filed as an unknown fault rather than under an empty line.
- When a fault points back at itself, then it is still filed rather than the report failing.

Another 53 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 2367 | 27895 | 8.5% |
| Decision points | 1762 | 25120 | 7.0% |
| Functions | 381 | 7126 | 5.3% |

Of the 726 files the app ships, 17 have a test of their own. Another 57 were run only because a
tested file uses them, and 652 have nothing at all.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Every request that reaches the site | 100.0% |
| Staying signed in when a request is refused | 100.0% |
| Fetching from the backends | 100.0% |
| Not asking twice for the same thing | 100.0% |
| What the app remembers about your account | 100.0% |
| The shared helpers | 100.0% |
| Locking a one-time code | 100.0% |
| Renewing an expired session | 100.0% |
| Recording one-time-code trouble | 100.0% |
| Which services may be proxied | 98.9% |
| Talking to the backends from the browser | 98.7% |
| Who a one-time code belongs to | 98.4% |
| Preparing a fault for the error log | 97.4% |
| Clicking a filter | 96.9% |
| Pictures, prices and filter links | 95.6% |
| The small shared helpers | 59.2% |
| The search helpers — prices, sorting, filters | 51.3% |

### Reading these numbers

- **What is checked well:** the helpers under prices, pictures, filters and search order, the
  sign-in and session handling, and what the app remembers about an account.
- **What has nothing yet:** every screen a shopper sees, every page and every backend route.
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
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) RECORDED FINDING: leaves the full price alone when no extra charge is stored
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) adds the country's extra charge to the full price
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) falls back to the older extra-charge shape
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) never lets a country's charge push the full price below zero
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) uses the ordinary full price when no country was asked for
tests/services/elastic/helpers.test.ts :: the price a product is struck through at (resolveUnitPriceForCountry) uses the ordinary full price when there are no country prices
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
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path RECORDED FINDING: ignores the current filters unless they arrive as a real query
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path adds the choice to the query
tests/utils/listing/filterItemState.test.ts :: the older filter links, which use a query instead of a path allows only one price band at a time here too
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
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) RECORDED FINDING: an upload record's path loses its slash and the address breaks
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) does not double the slash when the path already has one
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) hands back nothing when it was given nothing
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) leaves a full address alone
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) puts the media address in front of a bare path
tests/utils/server/helpers.test.ts :: building a picture address (GetImageUrl) takes an upload record's own path as final when it names the media server
tests/utils/server/helpers.test.ts :: building a product page address (getUrlofProduct) carries the chosen colour so the page opens on it
tests/utils/server/helpers.test.ts :: building a product page address (getUrlofProduct) points at the product on the right country and language site
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) RECORDED FINDING: an already-hosted video gains an extra slash
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) RECORDED FINDING: breaks when the caller gives no options at all
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) adds the media address, the folder and the file type
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) asks for the short preview when the caller wants one
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) does not add the file type twice
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) does not double the slash when the name has one
tests/utils/server/helpers.test.ts :: building a video address (getVideoUrl) gives an empty address back when there is no video
tests/utils/server/helpers.test.ts :: cleaning typed input (pollinateInput) cuts anything longer than ninety characters
tests/utils/server/helpers.test.ts :: cleaning typed input (pollinateInput) gives an empty result for anything that is not text
tests/utils/server/helpers.test.ts :: cleaning typed input (pollinateInput) removes the characters that could carry a command
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) RECORDED FINDING: an upload record loses the slash before the version
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) asks for a width as well when the slot has one
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) asks the media server for the height the slot needs
tests/utils/server/helpers.test.ts :: preparing a picture for a slot (getConfiguredImage) gives an empty picture back when it was given nothing
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
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) RECORDED FINDING: shows 'NaNM' when the currency has not loaded yet
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) always rounds a fraction of a penny up, never down
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) converts into the shopper's currency
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) leaves the rate out when none was given
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) multiplies without the usual decimal drift
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) shortens a price in the hundreds of thousands to thousands
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) shortens a price in the millions to millions
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
