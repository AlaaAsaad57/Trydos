# Test summary — 3 September 2026

**368 new checks were added across the shopping bag, sign-in, the product page, delivery addresses, the home page and search-engine titles — and every check in the app passes.**

| | |
|---|---|
| **New checks added this time** | 368 |
| **Checks in the app in total** | 2350 |
| **Result** | ✅ All passing — 2343 passed, 0 failed, 7 skipped |
| **How much of the app is checked** | 22.9% of the code |
| **Date** | 2026-09-03 |

---

## What we checked this time

### The product page's information — the work of this ticket

- When a country list is already saved, then it is shown without asking a backend.
- When no country list is saved, then it is fetched and kept for the next visitor.
- When the reply carries no countries, then an empty list is used and the backend was still asked.
- When a product is already saved, then it is shown and marked as coming from storage.
- When nothing is saved, then the product is fetched fresh and marked as new.
- When a product is fetched fresh, then both its lookup key and its record are saved.
- When a caller asks to skip storage, then the read is skipped but the result is still saved.
- When a guest opens a product, then the request goes to the gateway.
- When a signed-in shopper opens a product, then the request goes to the core backend.
- When storage itself fails, then the product read reports the fault and passes it on.
- ⚠️ When a backend refuses, then the product returns with no id and no sign it failed — recorded as today.
- When a price and stock payload is saved, then it is shown and marked as coming from storage.
- When price and stock are fetched, then price, offer price, variants and quantity all arrive unchanged.
- When storage fails during a price read, then the fault is reported and nothing comes back.
- ⚠️ When a price read is refused, then a hollow payload returns with no sign it failed — recorded as today.
- When a product does not exist, then the page reports it as missing.
- When a backend refuses, then the page does not call the product missing.
- When a shopper picks a colour and a size, then both appear in the page title.
- When a product has a brand and a category, then both are added to the title.
- When a description is too short to be useful, then a written sentence replaces it.
- When a description is a real one, then it is kept exactly as it is.
- When a product has no picture, then the site's own image is used for previews.
- When page details are already saved, then they are shown without asking the backend.
- When there is no product id, then an empty result comes back and nothing is asked.
- When star ratings arrive, then they are turned into groups with their counts.
- When a product has never been viewed, then it counts as zero views and no fault is reported.
- ⚠️ When the ratings search fails, then the stand-in figures never reach the page — recorded as it is today.
- When buyers have recommended a product, then the shares are worked out from the two totals.
- When nobody has rated a product, then the shares show zero instead of failing.
- When social counts are asked for, then likes, comments and shares come from their three sources.
- When a shopper has liked a product before, then only their most recent action decides.
- When comments are counted, then deleted ones and order ratings are left out.
- When a signed-in shopper opens product stories, then their credential is sent.
- When a guest opens product stories, then no credential is sent.
- When the stories request is refused, then empty lists come back instead of an error.
- When any story in a group is unseen, then the group is marked as new.
- When every story in a group is seen, then the group is not marked as new.

### What the shopping bag remembers

- When an item is added, then it is sent to the backend and the bag on screen is updated.
- When the add request fails, then nothing is added and the fault is recorded.
- When a quantity is changed, then it is sent to the backend and the bag is updated.
- When an item is removed, then it is sent to the backend and taken out of the bag.
- When an item is moved out of the bag, then it is sent with the right item reference.
- When the backend confirms an add, then the bag row it gave is stored, not the product number.
- When the backend answers with no bag row, then nothing is added.
- When the backend answers that it did not succeed, then nothing is added.
- When an item is added, then only the picture's file name is sent, not the whole address.
- When an item is added, then the full picture address is kept on screen, because the bag draws it.
- When the add-to-bag widget asks, then the request is labelled as coming from that widget.
- When the backend confirms a different quantity, then the confirmed one is stored, not the one asked for.
- When the backend answers that it did not succeed, then the quantity is left alone.
- When the backend refuses the change, then the quantity is left alone.
- When the backend refuses a removal, then the shopper is told instead of the app failing.
- When the backend refuses a removal, then the item is put back in the bag.
- When the backend refuses a removal, then the item is put back on the page the shopper is looking at.
- When the screen never removed the item, then it is not listed twice.
- When the widget never touched the bag page, then no extra row is added there.
- When the widget asks to remove, then the request is labelled as coming from that widget.
- When an item is moved to Out-Of-Bag, then the screen is told it moved.
- When the backend refuses that move, then the screen is told it did not move.

### Taking the last item out of the bag

- When the backend refuses a removal, then no removal is reported to analytics.
- When the backend refuses a removal, then no removal is reported to the order tracking.
- When the item has really gone, then the removal is reported once.
- When the out-of-stock widget's removal is refused, then nothing is reported.
- When the out-of-stock widget's removal succeeds, then the removal is reported.

### Saving and choosing a delivery address

- When a new address is saved, then it is listed once, with the reference the backend gave it.
- When the backend refuses the save, then nothing is added to the list.
- When the address sheet opens, then the addresses appear in the order the backend returned.
- When a shopper taps an address, then the order on screen stays the same.
- When a shopper taps an address, then the order ships to that one and not another.

### Signing in with a code

- When three wrong codes are entered, then the code boxes lock.
- When a wrong code is entered, then the shopper is told how many tries are left, then that they ran out.
- When the number has no account, then no try is spent.
- When tries are counted, then the number reported to analytics stays separate from the limit.
- When a code is refused while the resend timer runs, then the shopper is still told why.
- When three wrong codes are entered on the inline panel, then the code boxes lock.
- When the tries have run out, then the boxes take nothing more.
- When the tries run out, then the keypad closes.
- When a code is both used up and locked, then the shopper is told the code has expired.
- When the first code is wrong, then the shopper is told two tries are left.
- When the second code is wrong, then the shopper is told one try is left.
- When the third code is wrong, then the shopper is told to ask for a new code.
- When the boxes report a finished code twice at once, then only one try is spent.
- When a new code arrives, then three fresh tries are given.
- When the request for a new code fails, then the boxes stay locked.
- When a check never reaches a verdict, then a try is still spent.
- When tries are counted on this screen, then the analytics count stays separate from the limit.
- When three wrong codes are entered on the full screen, then the boxes lock.
- When the boxes are locked, then the countdown to a new code keeps running.

### Staying signed in across chat, stories and comments

- When a chat credential is exchanged, then only the chat pair is replaced.
- When a stories credential is exchanged, then only the stories pair is replaced.
- When a comments credential is exchanged, then only the comments pair is replaced.
- When a shopper is signing out, then the chat credential is not exchanged.
- When a shopper is signing out, then the stories credential is not exchanged.
- When a shopper is signing out, then the comments credential is not exchanged.
- When a chat credential is rejected, then it is kept rather than thrown away.
- When a stories credential is rejected, then it is kept rather than thrown away.
- When a comments credential is rejected, then it is kept rather than thrown away.
- When there is no stored comments credential, then nothing is exchanged.
- When the connection drops, then the comments service is reported as unavailable.
- When the server errors, then the comments service is reported as unavailable.
- When the reply cannot be read, then the comments service is reported as unavailable.
- When a reply carries only half a pair, then it is refused rather than stored.
- When a comments credential is exchanged, then the visitor's own language and country are sent.
- When a renewed pair cannot be stored, then that is reported loudly.
- When there is no request to read at all, then the comments service is reported as unavailable.

### Which services may be renewed or passed through

- When a service name is empty, then it is refused.
- When a service name is the market itself, then it is refused.
- When comments reports it did not succeed, then no credential is stored for it.
- When comments refuses, then it is named in the failure report.
- When a comments call fails, then it is renewed with the comments exchange.
- When the comments session is renewed, then another service's exchange is never used.

### When a backend refuses a form

- When a refusal carries a field-by-field answer, then that answer is unpacked from the message.
- When several fields are refused, then every one is kept, not only the first.
- When one field carries several sentences, then every sentence is kept.
- When a field's answer is a plain sentence, then it is accepted as well as a list.
- When an ordinary error message arrives, then it is left alone.
- When text only looks like a field answer, then it is left alone.
- When the answer is a plain list with no field names, then it is ignored.
- When the answer holds no text, then it is ignored.
- When the answer is not text at all, then it is ignored.
- When a field is refused, then its label is put in front of the backend's own sentence.
- When a profile field is refused, then it is shown with its own known label.
- When several fields are refused, then one line is written for each.
- When the field is not one the app knows, then the sentence is shown with no label.
- When the error is an ordinary one, then nothing is written and the caller keeps its own message.
- When a field is refused, then the reason is shown in words, not as raw data.
- When a credential is refused mid-request, then it is renewed and the request continues.

### The profile form

- When a save is refused, then what the shopper typed is kept instead of the old value returning.
- When a save is refused, then the reason is shown under the field the backend named.
- When several fields are refused, then every one is marked, not only the first.
- When the shopper edits a marked field, then the message on it is taken away.
- When a refusal names no field, then the form is left alone.

### The home page's saved sections

- When the category bar is drawn, then only the six pieces it needs are returned.
- When categories are read, then only the language asked for is kept.
- When a language is written in capitals, then it still matches.
- When many products share a category, then that category is returned once.
- When the search engine answers nothing, then an empty list comes back instead of an error.
- When a category is chosen, then featured products are asked for that one category.
- When no category is chosen, then featured products are asked for without one.
- When featured products are read, then the country and language asked for are passed on.
- When featured products are returned, then they can be drawn without reading any cookie.
- When the search engine answers nothing for featured products, then an empty list comes back.
- When a category is chosen, then flash deals are asked for that one category.
- When no category is chosen, then flash deals are asked for without one.
- When flash deals are read, then the country and language asked for are passed on.
- When flash deals are returned, then they can be drawn without reading any cookie.
- When the search engine answers nothing for flash deals, then an empty list comes back.
- When boutiques are read, then the list and the position for endless scrolling both come back.
- When a category is chosen, then boutiques are asked for that one category.
- When the search engine answers nothing for boutiques, then an empty section comes back.

### The currency a shopper sees

- When a currency is read, then the country and language are passed straight through.
- When a currency is returned, then timing figures that differ every call are dropped.
- When there is no currency to give, then an empty answer is kept rather than a rate invented.
- When an ordinary currency read happens, then it goes to whichever backend the shopper's cookie chose.
- When a gateway currency read happens, then the cookie is not consulted at all.
- When a gateway currency read happens, then it goes to the gateway address.
- When a gateway currency read happens, then it asks for the country and language it was given.
- When either currency reader answers, then both return the same shape.

### Category page titles and previews

- When a real category is opened, then its title and preview are built as before.
- When a category name is not a real one, then no saved entry is opened for it.
- When a category name carries a stranger's text, then it never reaches the page title.
- When a category name carries a stranger's text, then it never reaches the sharing preview.
- When a category name is repeated in the address, then the repeated form is refused.
- When a saved title is stored, then the country, language and category are all part of its key.
- When the plain home page is stored, then it gets its own key rather than an empty one.
- When a saved title is read, then the home page's own storage window is used, not the default.
- When a category name is not a real one, then it is kept out of the storage key.
- When a category name is a real one, then it still reaches the storage key.

### Category names the app will accept

- When the name is "shoes", then it is accepted.
- When the name is "blue-shirt", then it is accepted.
- When the name is "men_bags", then it is accepted.
- When the name is written in Arabic, then it is accepted.
- When the name is written in Turkish, then it is accepted.
- When the name is written in Kurdish with a digit, then it is accepted.
- When the name is an advertisement for another site, then it is refused.
- When the name carries a query string, then it is refused.
- When the name tries to climb out to system files, then it is refused.
- When the name carries a script, then it is refused.
- When the name starts with a hyphen, then it is refused.
- When the name is empty, then it is refused.
- When the name is longer than a real one ever is, then it is refused.
- When the value is empty rather than text, then it is refused.
- When the value is missing rather than text, then it is refused.
- When the value is two names joined by a comma, then it is refused.
- When the value is a bundle rather than text, then it is refused.
- When the value is a number rather than text, then it is refused.

### Web addresses the app will accept

- When the address is Syria in English, then it is accepted.
- When the address is Britain in English, then it is accepted.
- When the address is Turkey in Arabic, then it is accepted.
- When the address is Iraq in Kurdish, then it is accepted.
- When the address is Lebanon in Turkish, then it is accepted.
- When the address names a country the backend could add tomorrow, then it is accepted.
- When the address names a language the app has no words for, then it is refused.
- When an unknown pairing slips past the routing, then it is refused.
- When the country is spelled out in full, then it is refused.
- When the country is a single letter, then it is refused.
- When the address is written in capitals, then it is refused.
- When the two parts are joined by an underscore, then it is refused.
- When the address carries an extra part, then it is refused.
- When the language part is missing, then it is refused.
- When the address carries a stranger's text, then it is refused.
- When the address is empty, then it is refused.
- When the value is empty rather than text, then it is refused.
- When the value is missing rather than text, then it is refused.

### Pictures that fail to load

- When a remote picture fails, then the placeholder image is put in its place.
- When the placeholder is put in, then nothing else on the picture is changed.
- When a picture is added to the page later, then it is covered too.
- When a picture loads properly, then it is left untouched.
- When one of the app's own files fails, then it is left alone.
- When a picture has no address at all, then it is left alone.
- When a script or a video fails, then it is left alone.
- When the placeholder itself loads, then it stays marked as the placeholder.
- When a working picture loads on the same spot, then the mark is removed.
- When the placeholder is already showing, then it never triggers again.
- When the failing picture comes back, then it is swapped again.
- When the page finishes loading in the browser, then the placeholder survives.
- When a picture fails, then no network request is made and the swap itself cannot fail.
- When many pictures fail at once, then no request is made and no report is sent.
- When the small script is put into the page, then it can never close its own script block.
- When values are put into that script, then only the dangerous character is escaped.
- When that script runs, then a working listener is installed.
- When a chat search result's picture fails, then the page-wide swap handles it, not the component.
- When a shared avatar's picture fails, then the page-wide swap handles it, not the component.
- When an order return picture fails, then the page-wide swap handles it, not the component.

### The lucky-price badge

- When this browser has already claimed a product, then its badge is hidden.
- When a badge is hidden, then it is taken out of the layout, not only out of screen readers.
- When a product has not been claimed, then its badge is left alone.
- When the stored number is text and the product's is a number, then they still match.
- When there is no record of claims, then nothing is hidden.
- When the record cannot be read, then nothing is hidden.
- When the record holds something other than a list, then nothing breaks.
- When badges are hidden, then how many were hidden is reported.
- When the small script is written into the page, then it can never close its own script block.
- When the small script is written, then it is valid code.
- When the small script runs, then it names the record it reads.
- When the small script runs as the browser runs it, then a claimed badge is hidden.
- When the small script looks for badges, then it uses the same marker the page carries.

### Flash deals in search results

- When a search result is turned into a card, then the deal window and price pass through untouched.
- When a deal has finished, then its window is still passed on for the caller to judge.
- When the moment is inside the deal window, then the deal counts as running.
- When the moment is before the window opens, then the deal does not count as running.
- When the moment is after the window closes, then the deal does not count as running.
- When the dates cannot be read, then the deal does not count as running.
- When a deal is judged, then the moment is given to it and never read from the clock.
- When a deal search is built, then the search engine's own date maths bounds the window.
- When the same deal search is built twice, then nothing about it depends on when it ran.

### Moving between pages and overlays

- When a shopper returns from an overlay, then the page goes back to where it was.
- When the page is restored, then the browser is not allowed to overwrite that position.
- When the restoring is done, then position handling is given back to the browser.
- When a move shows no overlay, then position handling is never taken away.
- When an overlay opens, then it starts at the top.
- When a different page opens, then it starts at its own top, not the old page's position.
- When a loader showed but no overlay ever did, then nothing is restored.
- When a remembered position belongs to another page, then it is ignored.
- When a seller returns to the dashboard, then the dashboard's own loading shape is shown.
- When a seller clicks forward into an editor, then the dashboard shape is not shown.
- When any other move happens, then the loader it already had is kept.
- When no move is happening, then no loader is drawn.
- When a move says it is not an overlay, then the page position is left alone.
- When a move says nothing either way, then the overlay position handling still runs.
- When the loader is up, then the real page is hidden and brought back afterwards.

### Browsing categories

- When a category tile is drawn, then it links to the category page, not the old query address.
- When a category tile is drawn, then it keeps the language and country it was given.
- When a shopper taps the category already open, then they are sent back to the home page.
- When the whole app is searched, then nothing links to the old query address any more.

### Product stories on a product page

- When a product page opens, then it takes over the shared story list.
- When the product overlay closes, then the home page stories are put back.

### Orders, returns and tracking

- When orders are listed, then the page and size asked for are sent and the total is stored.
- When listing orders fails, then it is handled quietly and the fault is recorded.
- When the order count is asked for, then a single-row request is made and the total returned.
- When hidden orders are asked for, then the hidden-orders address is used.
- When a shopper starts from a story, then the sign-in is recorded as coming from a story.
- When a shopper starts from a chat, then the sign-in is recorded as coming from chat.
- When a shopper starts from a seller page, then the sign-in is recorded as coming from the seller.
- When a custom starting point is given, then it is recorded exactly as given.
- When no starting point is given, then it is recorded as checkout.
- When an order attempt begins, then it is given its own reference.
- When an order attempt ends, then it closes without failing.
- When an order event happens, then it is sent to analytics with its details.
- When an order is managed, then that event is sent to analytics too.
- When report reasons are listed, then all four categories are there.
- When a report reason is offered, then it always has at least one choice.

### The wish list

- When a product is added, then its number is sent to the wish list.
- When the wish list refuses an add, then the failure is raised.
- When a product is removed, then a delete request is sent for that product.
- When the wish list is opened, then items are asked for a page at a time.
- When a product is already in the wish list, then it is reported as in it.
- When a product is not in the wish list, then it is reported as not in it.

### Small helpers shared across the app

- When the code runs on the server, then it correctly reports that there is no browser.
- When the language is English, then a phrase is shown exactly as written.
- When chat details are read, then the stored details come back, or an empty set.
- When story details are read, then the stored details come back, or the saved cookie.
- When the storage setting is checked, then a plain yes or no is returned.
- When a picture address is prepared, then quality and format settings are added to it.
- When a picture is given as a record rather than an address, then its file path is used.
- When a picture address is not usable, then an empty one is returned.
- When a price is shown, then it is rounded with the right rate and decimal places.
- When a price is very large, then it is shortened with a K or an M.
- When a search word is saved to history, then it is stored once, without duplicates.
- When a country code is missing, then an empty name is returned.
- When a country code is valid, then its name is shown in English.
- When a country code is valid, then its name is shown in the chosen language.
- When a country code is not real, then it is handled without failing.
- When text is empty or missing, then an empty result is returned.
- When text carries ordinary formatting, then bold, italics, paragraphs and lists are kept.
- When text carries a script or an event handler, then it is stripped out.
- When a link carries a script address, then it is stripped out.
- When notification topics change, then they are added, removed and read back correctly.
- When a pop-up opens, then whether it closes itself is tracked correctly.
- When a pop-up is closed by the back button, then that is tracked correctly.
- When an upload is prepared, then the folder, story and count are sent and a ticket returned.
- When an upload ticket is refused, then the failure is raised.
- When delivery times are asked for, then the delivered-order figures come back.
- When delivery times cannot be read, then an empty list comes back instead of an error.
- When popular searches are asked for, then they are fetched from the search address.
- When popular searches cannot be read, then nothing comes back and the fault is recorded.
- When notification settings are read, then they are stored.
- When notification settings cannot be read, then they are cleared rather than left stale.

### How the app reads the shopper's device and page

- When the screen is wide and there is no touch, then the app treats it as a desktop.
- When the screen is small, then the app treats it as a phone.
- When the pointer is a finger, then the app treats it as a touch device.
- When a colour is chosen in the address, then that colour is read from it.
- When no colour is in the address, then the value the server gave is used.
- When a live colour is asked for, then the one in the address is returned.
- When a product is not a lucky one, then no lucky countdown runs.
- When a product is a lucky one, then the countdown starts as the page opens.
- When the page is hidden or moving, then the countdown pauses.
- When the countdown is marked as finished, then it expires.
- When the shopper's details are stored, then they are used.
- When the shopper's details are missing, then the details the server sent are used.
- When no details exist at all, then they are fetched and stored.

### The seller's product editor

- When a location is shown, then its name and address are put together cleanly.
- When a colour code is looked up, then it matches whether or not it is capitalised.
- When a colour code is unknown, then the raw code is shown instead.
- When product options arrive as packed text, then they are unpacked into a list.
- When product options arrive as a list already, then they are used as they are.
- When product options cannot be read, then an empty list is used.
- When a product feature has no icon, then an empty address is used.
- When a product feature has a full web icon address, then it is kept as it is.
- When a feature takes a number, then it is treated as needing an entry.
- When a feature takes a choice with options, then it is treated as needing an entry.
- When feature entries are saved, then they are flattened into one set to send.
- When a feature entry is blank and another is absent, then the two count as the same.
- When seller product numbers are read, then duplicates and empty ones are dropped.
- When a new product form opens, then it starts clean with "pc" as the unit.
- When a colour or size name is used as a key, then it is cleaned first.
- When a picture address is shown, then only its last part is used as the file name.
- When colours and sizes are combined, then every pairing is produced.
- When variant rows are created, then default price, discount and lucky price are filled in.

### Loading placeholders on the seller dashboard

- When the products grid is loading, then placeholder blocks are drawn and no spinner.
- When the products grid is loading, then it is hidden from screen readers and reported as busy.
- When the products grid is loading, then it is built from the one shared placeholder block.
- When the boutiques grid is loading, then placeholder blocks are drawn and no spinner.
- When the boutiques grid is loading, then it is hidden from screen readers and reported as busy.
- When the boutiques grid is loading, then it is built from the one shared placeholder block.
- When a list of rows is loading, then placeholder blocks are drawn and no spinner.
- When a list of rows is loading, then it is hidden from screen readers and reported as busy.
- When a list of rows is loading, then it is built from the one shared placeholder block.
- When a grid of tiles is loading, then placeholder blocks are drawn and no spinner.
- When a grid of tiles is loading, then it is hidden from screen readers and reported as busy.
- When a grid of tiles is loading, then it is built from the one shared placeholder block.
- When a details panel is loading, then placeholder blocks are drawn and no spinner.
- When a details panel is loading, then it is hidden from screen readers and reported as busy.
- When a details panel is loading, then it is built from the one shared placeholder block.
- When a form is loading, then placeholder blocks are drawn and no spinner.
- When a form is loading, then it is hidden from screen readers and reported as busy.
- When a form is loading, then it is built from the one shared placeholder block.
- When any placeholder is drawn, then it uses the shared shape rather than its own.

Another 462 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 6384 | 27915 | 22.9% |
| Decision points | 5128 | 25247 | 20.3% |
| Functions | 1311 | 7106 | 18.4% |

There are 725 files in the report. 90 have a test of their own. 132 are only touched
because a tested file uses them, so they are not deliberately checked. 503 have nothing at all.

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| Landing on the right language and country — proxy.ts | 100.0% |
| Shared helpers | 67.1% |
| Talking to the backends | 47.4% |
| Pages and API routes | 27.3% |
| The business rules | 26.8% |
| What the app remembers | 19.8% |
| The screens people see | 11.7% |

### Reading these numbers

- **What is checked well:** routing, shared helpers, sign-in and its code limit, the bag, the product page.
- **What has nothing yet:** 503 of 725 files have no check; the screens people see are weakest at 11.7%.
- **What "checked" does not mean:** a checked line is one a test ran. It does not prove the behaviour
  is what the business wants, and it says nothing about how the app looks or feels.
<!-- test-index v1 — written by the test-summary skill. Do not edit by hand.
tests/app/api/auth/clear-tokens/route.test.ts :: clearing only what may be cleared (AC-21) clears a credential that is on the allowed list
tests/app/api/auth/clear-tokens/route.test.ts :: clearing only what may be cleared (AC-21) copes with a call that names nothing
tests/app/api/auth/clear-tokens/route.test.ts :: clearing only what may be cleared (AC-21) ignores a name it does not know at all
tests/app/api/auth/clear-tokens/route.test.ts :: clearing only what may be cleared (AC-21) refuses the main credential, which is not on the list
tests/app/api/auth/clear-tokens/route.test.ts :: marking only the service that failed (AC-22) downgrades the main profile only when the comments credential was cleared
tests/app/api/auth/clear-tokens/route.test.ts :: marking only the service that failed (AC-22) leaves the main profile alone when an unrelated service failed
tests/app/api/auth/clear-tokens/route.test.ts :: marking only the service that failed (AC-22) marks the chat profile when the chat credential was cleared
tests/app/api/auth/clear-tokens/route.test.ts :: marking only the service that failed (AC-22) marks the stories profile as needing re-authentication
tests/app/api/auth/clear-tokens/route.test.ts :: marking only the service that failed (AC-22) writes no profile back when there was none stored
tests/app/api/auth/clear-tokens/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/auth/expire/route.test.ts :: clearing the dead session (AC-15) clears the main pair and every sub-service credential and profile
tests/app/api/auth/expire/route.test.ts :: clearing the dead session (AC-15) clears the old session before registering the new guest
tests/app/api/auth/expire/route.test.ts :: clearing the dead session (AC-15) gives the fresh guest credentials their own lifetimes
tests/app/api/auth/expire/route.test.ts :: clearing the dead session (AC-15) keeps no credential in the answer
tests/app/api/auth/expire/route.test.ts :: reporting who was signed out (AC-16) says it did not when the session was already a guest
tests/app/api/auth/expire/route.test.ts :: reporting who was signed out (AC-16) says the cleared session belonged to a verified shopper
tests/app/api/auth/expire/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/auth/expire/route.test.ts :: the last-chance renewal (AC-14) does not attempt a renewal when there is no renewal credential
tests/app/api/auth/expire/route.test.ts :: the last-chance renewal (AC-14) renews and clears nothing when a renewal credential still works
tests/app/api/auth/expire/route.test.ts :: the last-chance renewal (AC-14) tears the session down when the renewal fails
tests/app/api/auth/expire/route.test.ts :: when registering the new guest fails (AC-17) answers with a failure that names no backend technology
tests/app/api/auth/expire/route.test.ts :: when registering the new guest fails (AC-17) leaves the stored profile marked unverified
tests/app/api/auth/expire/route.test.ts :: when registering the new guest fails (AC-17) writes no fresh credential and passes the failure through
tests/app/api/auth/expire/route.test.ts :: while a logout is in progress (AC-13) registers no guest and writes no identity
tests/app/api/auth/login/route.test.ts :: a call that cannot be a verification (AC-8) refuses with neither, before any backend is called
tests/app/api/auth/login/route.test.ts :: a call that cannot be a verification (AC-8) refuses with no code, before any backend is called
tests/app/api/auth/login/route.test.ts :: a call that cannot be a verification (AC-8) refuses with no identifier, before any backend is called
tests/app/api/auth/login/route.test.ts :: a placeholder name from the backend (AC-6) applies the guard to the name the backend sent
tests/app/api/auth/login/route.test.ts :: a placeholder name from the backend (AC-6) is not passed on as the shopper's name
tests/app/api/auth/login/route.test.ts :: a placeholder name from the backend (AC-6) leaves a real name alone
tests/app/api/auth/login/route.test.ts :: a verification that carries no credential pair (AC-4) does the same when a credential arrives without a shopper
tests/app/api/auth/login/route.test.ts :: a verification that carries no credential pair (AC-4) stores nothing at all and passes the answer through untouched
tests/app/api/auth/login/route.test.ts :: a verification the backend refuses (AC-7) answers a breakage without naming a backend technology (AC-36)
tests/app/api/auth/login/route.test.ts :: a verification the backend refuses (AC-7) names no backend technology in its refusal text either (AC-36)
tests/app/api/auth/login/route.test.ts :: a verification the backend refuses (AC-7) passes the refusal's status and body through and stores nothing
tests/app/api/auth/login/route.test.ts :: how long each credential lives (AC-3) gives the access credentials the short life
tests/app/api/auth/login/route.test.ts :: how long each credential lives (AC-3) gives the renewal credentials the long rotating life, not the short one
tests/app/api/auth/login/route.test.ts :: how long each credential lives (AC-3) hides every credential from the browser and keeps it same-site
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) names comments in the failure report when comments refuses
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) signs the shopper in even when more than one sub-service is down
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) stores every credential when all four answered
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) stores nothing for chat when chat failed, and still signs the shopper in
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) stores nothing for comments when comments failed
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) stores nothing for comments when comments reports it did not succeed
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) stores nothing for stories when stories reports it did not succeed
tests/app/api/auth/login/route.test.ts :: one credential per sub-service that answered (AC-2) stores nothing for the wallet when the wallet failed
tests/app/api/auth/login/route.test.ts :: storing what the verification returned (AC-1) asks the core backend to verify, carrying the guest credential
tests/app/api/auth/login/route.test.ts :: storing what the verification returned (AC-1) keeps neither half of the pair in the answer
tests/app/api/auth/login/route.test.ts :: storing what the verification returned (AC-1) keeps no sub-service credential in the answer either
tests/app/api/auth/login/route.test.ts :: storing what the verification returned (AC-1) stores the main credential pair
tests/app/api/auth/login/route.test.ts :: telling the caller a sub-service failed (AC-5) keeps no credential material in what it records
tests/app/api/auth/login/route.test.ts :: telling the caller a sub-service failed (AC-5) reports the failure in the answer and records it for support
tests/app/api/auth/login/route.test.ts :: telling the caller a sub-service failed (AC-5) says nothing failed when nothing did
tests/app/api/auth/login/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/auth/login/route.test.ts :: the profiles it stores marks the shopper verified and keeps the stories identity
tests/app/api/auth/login/route.test.ts :: the profiles it stores strips the sensitive wallet fields before storing the wallet profile
tests/app/api/auth/logout/route.test.ts :: arming the logout guard (AC-19) arms the guard after the deletions, so it is not wiped by them
tests/app/api/auth/logout/route.test.ts :: arming the logout guard (AC-19) hides the guard from the browser and gives it a short life of its own
tests/app/api/auth/logout/route.test.ts :: arming the logout guard (AC-19) keeps the secure flag off outside production, and present
tests/app/api/auth/logout/route.test.ts :: arming the logout guard (AC-19) turns the secure flag on in production
tests/app/api/auth/logout/route.test.ts :: clearing every credential (AC-18) deletes all thirteen stored credentials and profiles
tests/app/api/auth/logout/route.test.ts :: clearing every credential (AC-18) deletes nothing outside the expected list
tests/app/api/auth/logout/route.test.ts :: clearing every credential (AC-18) leaves the two cookies a logout must never clear
tests/app/api/auth/logout/route.test.ts :: clearing every credential (AC-18) matches the shared list exactly — a new credential fails here first
tests/app/api/auth/logout/route.test.ts :: clearing every credential (AC-18) still deletes the legacy credential nothing writes any more
tests/app/api/auth/logout/route.test.ts :: detaching this device from push (AC-20) does not reach for a detach when the caller sends no push token
tests/app/api/auth/logout/route.test.ts :: detaching this device from push (AC-20) does not reach for a detach when there is no chat session to detach
tests/app/api/auth/logout/route.test.ts :: detaching this device from push (AC-20) prepares the detach only when a chat session is there to detach
tests/app/api/auth/logout/route.test.ts :: detaching this device from push (AC-20) still logs out when preparing the detach fails
tests/app/api/auth/logout/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/auth/logout/route.test.ts :: when something goes wrong answers with a failure that names no backend technology
tests/app/api/auth/me/route.test.ts :: reading the current identity (AC-27) answers a breakage with text that names no backend technology
tests/app/api/auth/me/route.test.ts :: reading the current identity (AC-27) is never cached
tests/app/api/auth/me/route.test.ts :: reading the current identity (AC-27) reports whether a credential is present without revealing it
tests/app/api/auth/me/route.test.ts :: reading the current identity (AC-27) returns the stored profile and says the visitor is signed in
tests/app/api/auth/me/route.test.ts :: reading the current identity (AC-27) says nothing is signed in when no profile is stored
tests/app/api/auth/refresh/route.test.ts :: a call with no body (AC-11) performs no exchange when the body carries neither address nor service
tests/app/api/auth/refresh/route.test.ts :: a call with no body (AC-11) performs no exchange — renewal only ever answers a real failure
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) falls through rather than throwing when the exchange itself breaks
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) falls through to the expiry flow on invalid
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) falls through to the expiry flow on no-token
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) falls through to the expiry flow on unavailable
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) never writes a credential into the answer, whatever the outcome
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) reports success without any credential material
tests/app/api/auth/refresh/route.test.ts :: every outcome maps to its own answer (AC-12) treats an ineligible outcome as a logout in progress
tests/app/api/auth/refresh/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) answers elastic as not eligible, without an exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) answers made-up as not eligible, without an exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) answers wallet as not eligible, without an exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) renews a failed chat call with its own exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) renews a failed comments call with its own exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) renews a failed market call with its own exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) renews a failed market-dashboard call with its own exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) renews a failed stories call with its own exchange
tests/app/api/auth/refresh/route.test.ts :: which services may be renewed here (AC-10) renews the comments session with the comments exchange, not another service's
tests/app/api/auth/refresh/route.test.ts :: while a logout is in progress (AC-9) renews nothing and says a logout is happening
tests/app/api/auth/register-device/route.test.ts :: a registration that brings back no credential (AC-25) clears nothing, so a working session is not stripped
tests/app/api/auth/register-device/route.test.ts :: replacing the previous identity (AC-24) carries the stories identity across to the fresh profile
tests/app/api/auth/register-device/route.test.ts :: replacing the previous identity (AC-24) clears every sub-service credential and profile in the same answer
tests/app/api/auth/register-device/route.test.ts :: replacing the previous identity (AC-24) installs the fresh credentials with their own lifetimes
tests/app/api/auth/register-device/route.test.ts :: replacing the previous identity (AC-24) sends the previous credential so the backend knows who is asking
tests/app/api/auth/register-device/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/auth/register-device/route.test.ts :: what leaves the server (AC-26) answers a breakage with text that names no backend technology
tests/app/api/auth/register-device/route.test.ts :: what leaves the server (AC-26) passes a refusal through without inventing a session
tests/app/api/auth/register-device/route.test.ts :: what leaves the server (AC-26) strips both halves of the credential pair from the answer
tests/app/api/auth/register-device/route.test.ts :: while a logout is in progress (AC-23) registers no guest at all
tests/app/api/auth/update-user/route.test.ts :: keeping a rotated credential pair intact (AC-30) answers a breakage with text that names no backend technology
tests/app/api/auth/update-user/route.test.ts :: keeping a rotated credential pair intact (AC-30) does not push a stale stored pair back over a freshly rotated one
tests/app/api/auth/update-user/route.test.ts :: keeping a rotated credential pair intact (AC-30) gives the renewal half its own long lifetime, not the short one
tests/app/api/auth/update-user/route.test.ts :: keeping a rotated credential pair intact (AC-30) stores both halves of a fresh pair from the incoming payload
tests/app/api/auth/update-user/route.test.ts :: keeping a rotated credential pair intact (AC-30) touches no credential cookie for a profile that has none
tests/app/api/auth/update-user/route.test.ts :: updating only what may be updated (AC-29) gives a profile its long lifetime, not the short credential one
tests/app/api/auth/update-user/route.test.ts :: updating only what may be updated (AC-29) ignores a name that is not on the allowed list
tests/app/api/auth/update-user/route.test.ts :: updating only what may be updated (AC-29) merges an update into the stored profile
tests/app/api/auth/update-user/route.test.ts :: updating only what may be updated (AC-29) skips an update carrying nothing
tests/app/api/auth/update-user/route.test.ts :: updating only what may be updated (AC-29) stores the update as-is when there was no profile to merge into
tests/app/api/auth/wallet-token/route.test.ts :: reading the wallet credential (AC-28) hands the widget its credential when one is stored
tests/app/api/auth/wallet-token/route.test.ts :: reading the wallet credential (AC-28) reads only the wallet credential, never another service's
tests/app/api/auth/wallet-token/route.test.ts :: reading the wallet credential (AC-28) refuses as unauthorised when nothing is stored
tests/app/api/proxy/route.test.ts :: an unrecognised service name (AC-34) cannot be told apart from an ordinary failure, down to the headers
tests/app/api/proxy/route.test.ts :: an unrecognised service name (AC-34) is refused without a call and without a report
tests/app/api/proxy/route.test.ts :: an unrecognised service name (AC-34) keeps the whole credential out of everything it reports
tests/app/api/proxy/route.test.ts :: an unrecognised service name (AC-34) reports an ordinary failure twice — the log entry and the error
tests/app/api/proxy/route.test.ts :: passing a real answer back carries the credential to the backend, and no cookies
tests/app/api/proxy/route.test.ts :: passing a real answer back forwards an empty answer without a body
tests/app/api/proxy/route.test.ts :: passing a real answer back forwards the body and the status
tests/app/api/proxy/route.test.ts :: passing a real answer back never lets an answer be cached
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) is not cached, so a refusal cannot be replayed from a cache
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) refuses a path escaped three times
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) refuses a path escaped twice
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) refuses a path escaped twice, through the decoding header
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) refuses it outright, and never troubles the backend
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) refuses it when it arrives through the decoding header
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) refuses it when the path is disguised by escaping
tests/app/api/proxy/route.test.ts :: refusing a direct attempt at the code-sending path (AC-31) still forwards an ordinary path that merely carries an escape
tests/app/api/proxy/route.test.ts :: refusing a target that climbs out of the path (AC-33) allows an ordinary path under the base
tests/app/api/proxy/route.test.ts :: refusing a target that climbs out of the path (AC-33) refuses a call that names no target
tests/app/api/proxy/route.test.ts :: refusing a target that climbs out of the path (AC-33) refuses climbing above the base path before anything is sent
tests/app/api/proxy/route.test.ts :: refusing a target that climbs out of the path (AC-33) refuses climbing once before anything is sent
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses a full address before anything is sent
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses a host-escape hidden by escaping (an escaped backslash), with or without the decoding header
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses a host-escape hidden by escaping (escaped once), with or without the decoding header
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses a host-escape hidden by escaping (escaped twice), with or without the decoding header
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses a protocol-relative address before anything is sent
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses a slash and a backslash before anything is sent
tests/app/api/proxy/route.test.ts :: refusing a target that could leave the host (AC-32) refuses no leading slash at all before anything is sent
tests/app/api/proxy/route.test.ts :: saying which backend served the call (AC-35) answers core for a guest asking for a path that is not allow-listed
tests/app/api/proxy/route.test.ts :: saying which backend served the call (AC-35) answers core for a verified shopper asking for the same path
tests/app/api/proxy/route.test.ts :: saying which backend served the call (AC-35) answers gateway for a guest asking for an allow-listed path
tests/app/api/proxy/route.test.ts :: saying which backend served the call (AC-35) names a role, never a host or an address
tests/app/api/proxy/route.test.ts :: saying which backend served the call (AC-35) says nothing about backends for another service
tests/app/api/proxy/route.test.ts :: the addresses these tests use are all different, so no two services can be confused
tests/app/api/proxy/route.test.ts :: the addresses these tests use give the two storefront addresses a path, so the path guard is real
tests/app/api/proxy/route.test.ts :: what the proxy says about the stack (AC-36) keeps the routing label to role words only
tests/app/api/proxy/route.test.ts :: what the proxy says about the stack (AC-36) names no backend technology in any refusal it composes
tests/app/api/proxy/route.test.ts :: what the proxy says about the stack (AC-36) names no backend technology in its headers
tests/app/api/proxy/route.test.ts :: what the proxy says about the stack (AC-36) prints no credential in the line it logs
tests/app/categoryRoute.test.ts :: the category route's slug gate accepts a slug that is not in the cached category list
tests/app/categoryRoute.test.ts :: the category route's slug gate accepts a slug the backend could really return
tests/app/categoryRoute.test.ts :: the category route's slug gate accepts a slug written in Arabic
tests/app/categoryRoute.test.ts :: the category route's slug gate refuses a slug carrying a path
tests/app/categoryRoute.test.ts :: the category route's slug gate refuses a slug longer than the cache key should ever carry
tests/app/robots.test.ts :: robots.txt on a host that is not indexable does not publish a sitemap, so no crawler is handed the full page list
tests/app/robots.test.ts :: robots.txt on a host that is not indexable lets Discordbot fetch the page, so its link preview can be built
tests/app/robots.test.ts :: robots.txt on a host that is not indexable lets LinkedInBot fetch the page, so its link preview can be built
tests/app/robots.test.ts :: robots.txt on a host that is not indexable lets TelegramBot fetch the page, so its link preview can be built
tests/app/robots.test.ts :: robots.txt on a host that is not indexable lets Twitterbot fetch the page, so its link preview can be built
tests/app/robots.test.ts :: robots.txt on a host that is not indexable lets facebookexternalhit fetch the page, so its link preview can be built
tests/app/robots.test.ts :: robots.txt on a host that is not indexable opens the whole site to everyone once indexing is switched on
tests/app/robots.test.ts :: robots.txt on a host that is not indexable still shuts every other crawler out, so a pre-launch host stays unindexed
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard boutique list, across an arrival drops a deleted boutique after returning (AC-5)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard boutique list, across an arrival shows a boutique created while the list already had boutiques (AC-3)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard boutique list, across an arrival shows an edited boutique's new values after returning (AC-4)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard product list, across an arrival asks the core backend once per arrival, not once per tab switch (AC-6)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard product list, across an arrival never says the shop has no products before the request comes back (AC-7)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard product list, across an arrival shows a product created while the list already had products (AC-1)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard product list, across an arrival shows an edited product's new values after returning (AC-2)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard product list, across an arrival shows the empty message once the request has answered (AC-15)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard when a request fails retries a failed arrival fetch on the next arrival (AC-14)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard when a request fails shows the error and lets a retry replace it with the list (AC-14)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard when permissions are involved reads a failed permission fetch as an error, not as a refusal (AC-13)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard when permissions are involved refuses a section the seller really may not see (AC-13)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: the seller dashboard when permissions are involved waits rather than refusing while permissions are still on the way (AC-13)
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx :: two sections of the dashboard loading at the same time does not let the roles list finishing make the change-role list say it is empty (AC-16)
tests/app/sellerProfile/shopListFirstPaint.test.tsx :: the seller shop list on first paint asks the core backend for the seller's shops exactly once on mount
tests/app/sellerProfile/shopListFirstPaint.test.tsx :: the seller shop list on first paint paints its placeholder, not an empty state, before any effect runs (AC-9)
tests/app/sellerProfile/shopListFirstPaint.test.tsx :: the seller shop list on first paint replaces the placeholder with the shops once they arrive (AC-9)
tests/app/sitemapPagination.test.ts :: the boutiques sitemap ?page= answers 404 for a negative page
tests/app/sitemapPagination.test.ts :: the boutiques sitemap ?page= answers 404 for a page past the last one
tests/app/sitemapPagination.test.ts :: the boutiques sitemap ?page= answers 404 for a page that is not a number
tests/app/sitemapPagination.test.ts :: the boutiques sitemap ?page= does not build a single url for a page past the last one
tests/app/sitemapPagination.test.ts :: the boutiques sitemap ?page= still serves the first page when no ?page= is given
tests/app/sitemapPagination.test.ts :: the boutiques sitemap ?page= still serves the last page that exists
tests/app/sitemapPagination.test.ts :: the products sitemap ?page= answers 404 for a negative page
tests/app/sitemapPagination.test.ts :: the products sitemap ?page= answers 404 for a page past the last one
tests/app/sitemapPagination.test.ts :: the products sitemap ?page= answers 404 for a page that is not a number
tests/app/sitemapPagination.test.ts :: the products sitemap ?page= does not build a single url for a page past the last one
tests/app/sitemapPagination.test.ts :: the products sitemap ?page= still serves the first page when no ?page= is given
tests/app/sitemapPagination.test.ts :: the products sitemap ?page= still serves the last page that exists
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home document the server sends can tell a filled product row from an empty one
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home document the server sends carries the product cards as HTML, not only as streaming payload
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home document the server sends fills every product-row skeleton it puts above the boutiques
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home document the server sends is the home page, with a featured row on it
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home document the server sends resolved the featured row on the server
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home view's product rows are rendered on the server asks for the request in every row that can render a product card
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home view's product rows are rendered on the server does not accept a request-time call that is only written in a comment
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home view's product rows are rendered on the server does not report the skeleton as a row that renders product cards
tests/cache/homeRowsRenderOnTheServer.test.ts :: the home view's product rows are rendered on the server finds at least one row that renders product cards
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached module serverRequests/cached/currency.ts reaches no cookie, header or clock read that has not been reviewed
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached module serverRequests/cached/currency.ts resolves every repo import it meets
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached module serverRequests/cached/home.ts reaches no cookie, header or clock read that has not been reviewed
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached module serverRequests/cached/home.ts resolves every repo import it meets
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached module serverRequests/meta/home.ts reaches no cookie, header or clock read that has not been reviewed
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached module serverRequests/meta/home.ts resolves every repo import it meets
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/Server/MainCategories/index.tsx holds no cookie, header or clock read of its own
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/Server/MainCategories/index.tsx is not itself a cached scope
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/ServerWrapper/BoutiquesListWrapper.tsx holds no cookie, header or clock read of its own
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/ServerWrapper/BoutiquesListWrapper.tsx is not itself a cached scope
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/ServerWrapper/FeaturedProduct.tsx holds no cookie, header or clock read of its own
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/ServerWrapper/FeaturedProduct.tsx is not itself a cached scope
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/ServerWrapper/FlashDealsProduct.tsx holds no cookie, header or clock read of its own
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the cached-reader caller components/ServerWrapper/FlashDealsProduct.tsx is not itself a cached scope
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the reviewed list and the entry list describe the real tree has no reviewed entry that nothing reaches any more
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the reviewed list and the entry list describe the real tree knows about every `use cache` scope in the repository
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the scan can see what it claims to see does not read a comment back as evidence
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the scan can see what it claims to see finds a forbidden read when one is really there
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the scan can see what it claims to see reaches past the entry file instead of stopping at it
tests/cache/noRuntimeReadsInCachedTree.test.ts :: the scan can see what it claims to see resolves a bare repo-root import to a real file
tests/cache/serverCookieScope.test.ts :: readServerCookies — does it ask before it reads? asks which scope it is in before touching a cookie
tests/cache/serverCookieScope.test.ts :: readServerCookies — does it ask before it reads? gives back a null per name when the scope refuses
tests/cache/serverCookieScope.test.ts :: which server scopes may read a request cookie allows a private cache, which keeps its answer in one browser
tests/cache/serverCookieScope.test.ts :: which server scopes may read a request cookie allows an ordinary request
tests/cache/serverCookieScope.test.ts :: which server scopes may read a request cookie allows the read when the scope cannot be determined
tests/cache/serverCookieScope.test.ts :: which server scopes may read a request cookie refuses a prerender scope
tests/cache/serverCookieScope.test.ts :: which server scopes may read a request cookie refuses a shared cache scope
tests/cache/serverCookieScope.test.ts :: which server scopes may read a request cookie refuses an unstable-cache scope
tests/cache/sharedEntryIsNotPersonal.test.ts :: a shared cache entry never carries one shopper's data does not put a signed-in shopper's profile into the guest document
tests/cache/sharedEntryIsNotPersonal.test.ts :: a shared cache entry never carries one shopper's data never marks a document that streams a signed-in navigation as public
tests/cache/sharedEntryIsNotPersonal.test.ts :: a shared cache entry never carries one shopper's data renders the shopper's own marker when it is given the profile
tests/cache/sharedEntryIsNotPersonal.test.ts :: a shared cache entry never carries one shopper's data sends the cookie names the app actually reads
tests/components/Cart/AddAddressForm.test.tsx :: saving a new shipping address adds nothing to the list when the core backend refuses the save
tests/components/Cart/AddAddressForm.test.tsx :: saving a new shipping address lists the saved address once, with the id the core backend gave it
tests/components/Cart/AddToCart/Button.test.tsx :: taking the last one out of the bag from the add-to-cart button does not tell analytics about a removal the core backend refused
tests/components/Cart/AddToCart/Button.test.tsx :: taking the last one out of the bag from the add-to-cart button does not tell the order funnel about a removal the core backend refused
tests/components/Cart/AddToCart/Button.test.tsx :: taking the last one out of the bag from the add-to-cart button tells analytics and the order funnel once the item has really gone
tests/components/Cart/AddToCart/NotifyButton.test.tsx :: taking the last one out of the bag from the out-of-stock widget does not report a removal the core backend refused
tests/components/Cart/AddToCart/NotifyButton.test.tsx :: taking the last one out of the bag from the out-of-stock widget reports the removal once the core backend has removed the item
tests/components/Cart/AddressListContainer.test.tsx :: the checkout address sheet draws the saved addresses in the order the core backend returned them
tests/components/Cart/AddressListContainer.test.tsx :: the checkout address sheet keeps the order on screen after the shopper taps an address
tests/components/Cart/AddressListContainer.test.tsx :: the checkout address sheet ships to the address the shopper tapped, not to another one
tests/components/Cart/QuantutyInput.test.tsx :: moving a cart row to Out-Of-Bag does not report a move the core backend refused
tests/components/Cart/QuantutyInput.test.tsx :: moving a cart row to Out-Of-Bag keeps the row in the cart when the core backend refuses the move
tests/components/Cart/QuantutyInput.test.tsx :: moving a cart row to Out-Of-Bag reports the move to the order funnel only once the item has moved
tests/components/Cart/QuantutyInput.test.tsx :: moving a cart row to Out-Of-Bag takes the row out of the cart when the core backend moved it
tests/components/CartErrorComponent.test.tsx :: CartErrorComponent component renders error message and triggers onRetry when button is clicked
tests/components/EmptyCart.test.tsx :: EmptyCart component renders empty cart illustration and text
tests/components/Home/CategoryNavMobile.test.tsx :: a tile in the categories bar keeps the locale it was given
tests/components/Home/CategoryNavMobile.test.tsx :: a tile in the categories bar links to the category route, not the old query address
tests/components/Home/CategoryNavMobile.test.tsx :: a tile in the categories bar sends the shopper back to the home page when its own category is already open
tests/components/Home/CategoryNavMobile.test.tsx :: nothing in the app builds the old category address has no component left that links to ?mainCategory=
tests/components/Home/storiesBarClient.test.tsx :: StoriesBarClient names the stories service, so the proxy attaches the token on the server
tests/components/Home/storiesBarClient.test.tsx :: StoriesBarClient never carries a token of its own
tests/components/Home/storiesBarClient.test.tsx :: StoriesBarClient says nothing to the shopper when the stories service is down
tests/components/Home/storiesBarClient.test.tsx :: StoriesBarClient shows the skeleton, not an error, when the stories backend refuses
tests/components/Home/storiesBarClient.test.tsx :: StoriesBarClient shows the stories the storefront returned
tests/components/Home/storiesWrapper.test.tsx :: StoriesWrapper — the home stories bar across a route change asks the stories service for page 2 first, and stops paging when it sends no next page
tests/components/Home/storiesWrapper.test.tsx :: StoriesWrapper — the home stories bar across a route change does not ask the stories service for page 3 while page 2 is missing from the bar
tests/components/Home/storiesWrapper.test.tsx :: StoriesWrapper — the home stories bar across a route change does not overwrite a watched ring when the route changes
tests/components/Home/storiesWrapper.test.tsx :: StoriesWrapper — the home stories bar across a route change keeps the pages it already loaded when the route changes and comes back
tests/components/Home/storiesWrapper.test.tsx :: StoriesWrapper — the home stories bar across a route change still clears the add-story refreshing flag on a route change
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: what the funnel is told calls an unmarked open a checkout, because that is what raises it
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: what the funnel is told records that the flow opened, and where from
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: what the funnel is told stops the page behind the overlay scrolling
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper finishes verifying forgets the number of the session that expired
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper finishes verifying opens chat for a shopper who came to send a message
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper finishes verifying opens the story composer for a shopper who came to post one
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper finishes verifying reports a checkout shopper as returned to checkout
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper finishes verifying takes the overlay down
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper walks away without verifying clears the sub-service tokens it left behind
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper walks away without verifying does not clear them again after a session that expired
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper walks away without verifying reloads, so the page matches whatever token is now stored
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper walks away without verifying sends a shopper off the seller dashboard rather than reloading it
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper walks away without verifying settles the requests that were waiting on them
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: when the shopper walks away without verifying still leaves, even if the clean-up call throws
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: which number the shopper is asked to confirm asks for a number when the account has none
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: which number the shopper is asked to confirm does not hand that number to any other flow
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: which number the shopper is asked to confirm reuses the number of a session that expired
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: which number the shopper is asked to confirm treats 0 (a numeric zero) as no number at all
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: which number the shopper is asked to confirm treats 0 (the string zero) as no number at all
tests/components/Login/ConfirmMobilePhoneWidget.test.tsx :: which number the shopper is asked to confirm uses the number on the account, and does not let it be changed
tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx :: the three-try cap on the login and signup screen does not spend a try when the number has no account
tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx :: the three-try cap on the login and signup screen keeps the analytics attempt count separate from the cap
tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx :: the three-try cap on the login and signup screen locks the boxes after three wrong codes
tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx :: the three-try cap on the login and signup screen says how many tries are left, then says the tries ran out
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper whose account already owns a number lets a shopper who typed their own number go back and fix it
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper whose account already owns a number offers no way to swap that number
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper whose account already owns a number skips the intro and opens on the method step
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper with no number on file asks first whether they already have an account
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper with no number on file puts the terms in front of a new customer first
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper with no number on file records the terms the same way the fullscreen signup does
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: a shopper with no number on file takes an existing account straight to the number
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: closing the panel hands the close back to the cart
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: entering the code checks the code against the id the send returned
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: entering the code holds the resend closed while the cooldown runs
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: entering the code says why a code was refused
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: entering the code sends nothing when the resend is tapped inside the cooldown
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: entering the code still says why a code was refused once the resend cooldown is running
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: entering the code tells the cart once the shopper is verified
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: on a phone uses the device's own keyboard, never the in-app keypad
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: sending the code says when the session has used its allowance of numbers
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: sending the code sends on the method that was tapped
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: sending the code shows the code boxes once a code is on its way
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: sending the code stops both methods while the number is on cooldown
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: the three-try cap on this surface locks the boxes after three wrong codes
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: what a running cooldown is telling the shopper does not carry one number's refusal over to another
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: what a running cooldown is telling the shopper reads as 'we would not send it' after a send that was refused
tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx :: what a running cooldown is telling the shopper reads as 'your code is coming' after a send that worked
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number the account already owns offers no way to swap the number
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number the account already owns offers no way to swap the number from the code step either
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number the account already owns opens straight on the method step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number they typed carries the number it was given on to the method step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number they typed lets the shopper go back and correct the number
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number they typed offers no way to send until the number is whole
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number they typed opens on the number step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper confirming a number they typed takes a whole number to the method step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: a shopper whose send left no cooldown behind can type the code and get through
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: choosing how the code arrives says the session ran out of numbers once the allowance is used
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: choosing how the code arrives says why nothing happened when the send is refused
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: choosing how the code arrives sends by SMS and says so
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: choosing how the code arrives sends on WhatsApp and shows the code step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: choosing how the code arrives shows a countdown and stops both methods while the number is on cooldown
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: closing the flow can be closed from the code step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: closing the flow can be closed from the method step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: closing the flow can be closed from the number step
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code checks the code as soon as the last digit lands
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code counts down to the resend rather than offering it at once
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code draws one box per digit of the code
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code goes back to the method step to change how the code arrives
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code offers the resend once the cooldown runs out
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code says a wrong code was wrong
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: entering the code tells the host once the shopper is through
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: in a right-to-left language shows the number step in Arabic
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: the three-try cap on this surface locks the boxes after three wrong codes
tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx :: the three-try cap on this surface still counts down to a new code while the boxes are locked
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: a code sent to a number that armed no cooldown does not claim the code expired the moment it arrives
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: a code sent to a number that armed no cooldown lets the shopper type the code they were just sent
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: a code sent to a number that armed no cooldown still offers another code, because nothing is holding the send back
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: asking for another code clears the old code out of the boxes when a new one is asked for
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: asking for another code does not resend while the cooldown is still running
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: asking for another code reports the cooldown running out, once
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: the two clocks counts down to the resend while the cooldown runs
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: the two clocks declares the code expired once its own life runs out
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: the two clocks gives a resent code a life of its own
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: the two clocks keeps the code typeable after the send cooldown runs out
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: what the screen says about the code holds the boxes closed while the code is being checked
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: what the screen says about the code holds them closed once the code has been accepted
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: what the screen says about the code names the way the code was sent
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: what the screen says about the code shows the number the code went to
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: what the screen says about the code shows the reason a code was refused
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: when the tries have run out closes the keypad when the tries run out
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: when the tries have run out says the code ran out of life when it is both spent and locked
tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx :: when the tries have run out takes nothing more once the tries have run out
tests/components/Login/Enhanced/screens/SelectMethodScreen.test.tsx :: the number the method screen is about to send to carries its own marker when the number can be changed
tests/components/Login/Enhanced/screens/SelectMethodScreen.test.tsx :: the number the method screen is about to send to carries the same marker when the number is locked and Edit is gone
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: on a phone adds a digit per key
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: on a phone still offers the send when the number is whole
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: on a phone takes the device keyboard instead where the keypad would not fit
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: on a phone uses the app's own keypad
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type copes with nothing at all
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type keeps a number that is already bare digits
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type reads (963) 99-123-4567 (brackets and dashes from a contact card) as the same number
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type reads +963991234567 (the plus most people write) as the same number
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type reads 00963991234567 (the double zero used across much of the region) as the same number
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type reads 0963991234567 (the national leading zero) as the same number
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: the prefix people actually type reads 963 99 123 45 67 (spaces from a copied number) as the same number
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: what the shopper sees says what to type while the field is empty
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: what the shopper sees shows the country the dial code names
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send does not send on Enter before the number is whole
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send holds the send closed while one is already going out
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send offers no send for a part of a number
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send offers the send once the country's digits are all there
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send sends on Enter, for somebody typing rather than tapping
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send sends on the arrow
tests/components/Login/Enhanced/ui/RdbPhoneInput.test.tsx :: when the number is whole enough to send takes no more digits than the country has
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: at a desk ignores anything that is not a digit
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: at a desk offers the code the browser saw arrive
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: at a desk shows what was typed in the boxes
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: at a desk submits as soon as six digits are in
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: at a desk takes nothing while the code is being checked
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: at a desk uses the device's own keyboard
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone does not submit early
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone fills the boxes in order as keys are pressed
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone puts its own keypad up, and no field
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone submits the code once the sixth digit lands
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone takes no more keys while the code is being checked
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone takes the keypad away once the code is accepted
tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx :: on a phone takes the last digit back
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: resending the code clears a code left in the boxes when a new one is sent
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: resending the code does nothing before a method has been chosen
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: resending the code does nothing while the number is on cooldown
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: resending the code reports the resend with the attempts made since the last send
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: resending the code resends on the method already chosen, without asking again
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: resending the code starts the attempt count again after a code is resent
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code drops the backend's static wait message when a countdown is already running
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code falls back to a translated line when the failure carries nothing to show
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code refuses to send once the session has used its allowance of numbers
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code refuses to send while a cooldown is running on that number
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code reports the send to analytics, naming the host that asked for it
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code sends on SMS with the SMS flag, not the WhatsApp one
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code sends on the chosen method and moves to the code step
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code shows the host's own blocked message when the host asked for one
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code stays silent when the host already shows its own countdown
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code surfaces the reason when the send is refused after the request
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: sending the code tells the host to run its own transition once the step moved
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap counts the second wrong code down to one try left
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap drops the count and says to ask for a new code on the third
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap gives three fresh tries once a new code arrives
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap keeps the analytics attempt count separate from the cap
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap says two tries are left after the first wrong code
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap spends a try on a check that never reached a verdict
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap spends one try when the boxes report a finished code twice at once
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: the three-try cap stays locked when the request for a new code fails
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: verifying the code checks a code once, however many times the boxes fire
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: verifying the code clears the wrong code so the shopper can type the next one
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: verifying the code lets the shopper try again after a wrong code
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: verifying the code marks the code good and hands the result to the host
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: verifying the code says the code was wrong, and reports it
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: verifying the code verifies the typed code against the id the send returned
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts normalises +963991234567 (a stored profile number carrying a plus) to bare digits
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts normalises 00963991234567 (an international number typed with a double zero) to bare digits
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts normalises 0963991234567 (a number typed with a national leading zero) to bare digits
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts normalises 963 99 123 4567 (a number typed with spaces) to bare digits
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts skips the phone step when the account already owns the number
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts starts on the phone step when the shopper has no number yet
tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx :: where the flow starts still asks for a number when it is locked but none was supplied
tests/components/Login/SessionExpiredWidget.test.tsx :: choosing to carry on as a guest reloads, so the page stops showing the account that is gone
tests/components/Login/SessionExpiredWidget.test.tsx :: choosing to carry on as a guest sends a guest off the seller dashboard instead of reloading it
tests/components/Login/SessionExpiredWidget.test.tsx :: choosing to carry on as a guest settles the waiting requests as cancelled
tests/components/Login/SessionExpiredWidget.test.tsx :: choosing to sign in again leaves the parked requests waiting rather than failing them
tests/components/Login/SessionExpiredWidget.test.tsx :: choosing to sign in again marks a shopper on the seller dashboard as a seller instead
tests/components/Login/SessionExpiredWidget.test.tsx :: choosing to sign in again opens the phone-verify flow, marked as a session that expired
tests/components/Login/SessionExpiredWidget.test.tsx :: what the prompt says speaks the language the shopper is browsing in
tests/components/Login/SessionExpiredWidget.test.tsx :: what the prompt says tells the shopper why they are being asked
tests/components/Login/SessionTimer.test.tsx :: a stored expiry the app will not trust clears that expiry out of storage
tests/components/Login/SessionTimer.test.tsx :: a stored expiry the app will not trust shows nothing once the expiry is in the past
tests/components/Login/SessionTimer.test.tsx :: a stored expiry the app will not trust signs the borrowed account out
tests/components/Login/SessionTimer.test.tsx :: a stored expiry the app will not trust will not trust an expiry more than half an hour away either
tests/components/Login/SessionTimer.test.tsx :: a tester borrowing a session counts the real time left, not a fixed two minutes
tests/components/Login/SessionTimer.test.tsx :: a tester borrowing a session shows how long is left
tests/components/Login/SessionTimer.test.tsx :: an ordinary shopper is not woken by an unrelated value in storage
tests/components/Login/SessionTimer.test.tsx :: an ordinary shopper never sees it
tests/components/Login/SessionTimer.test.tsx :: when the session runs out while the tester is watching says so, and reloads onto whatever session is left
tests/components/Login/Timer.test.tsx :: the redeem countdown holds while the product being added is not finished
tests/components/Login/Timer.test.tsx :: the redeem countdown runs on once that product is finished
tests/components/Login/Timer.test.tsx :: what the countdown shows counts hours as their own part, not as extra minutes
tests/components/Login/Timer.test.tsx :: what the countdown shows pads every part to two digits
tests/components/Login/Timer.test.tsx :: what the countdown shows shows only the seconds when that is all the caller wants
tests/components/Login/Timer.test.tsx :: when it reaches zero tells the caller, once
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay does not let the browser overwrite the restored position with its own
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay gives history scroll restoration back to the browser once it is done
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay ignores a remembered position that belongs to a different page
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay lands the overlay itself at the top
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay leaves a different page at its top rather than at the old page's position
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay never takes scroll restoration away for a navigation that shows no overlay
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay puts the page back where it was, though the body was hidden before the overlay was entered
tests/components/ModalRoute/overlayScroll.test.ts :: coming back from an intercepted overlay restores nothing when the loader showed but no overlay ever did
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the mark lands where the design file puts it badge ring: the flattened transforms add up to the same place as NewLoginDesign/QuickPreviewBottomLogo.svg
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the mark lands where the design file puts it header lockup: the flattened transforms add up to the same place as NewLoginDesign/logo.svg
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark badge ring: keeps the same viewBox whichever pattern is running
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark header lockup: keeps the same viewBox whichever pattern is running
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "canon" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "escape" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "firefly" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "gust" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "none" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "relay" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "reveal" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "spark" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "sway" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "tempo" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the badge ring: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the badge ring: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the badge ring: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the badge ring: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the header lockup: gives every svg attribute a real starting value
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the header lockup: keeps its decoration under the mark, or masked to the ring
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the header lockup: leaves the dots and the ring exactly as the design file drew them
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — the ten patterns never change the mark pattern "wink" on the header lockup: leaves the wordmark exactly as the design file drew it
tests/components/NewLoginLogo.test.tsx :: NewLoginLogo — two logos on one screen do not collide gives every pattern its own svg ids, so a second logo cannot capture the first one's mask
tests/components/NewLoginLogo.test.tsx :: the loop length reaches every pattern falls back to the cycle each pattern was designed on
tests/components/NewLoginLogo.test.tsx :: the loop length reaches every pattern plays every pattern over 1 seconds when asked to
tests/components/NewLoginLogo.test.tsx :: the loop length reaches every pattern plays every pattern over 20 seconds when asked to
tests/components/NewLoginLogo.test.tsx :: the loop length reaches every pattern plays every pattern over 9 seconds when asked to
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "canon" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "escape" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "firefly" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "gust" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "relay" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "reveal" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "spark" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "sway" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "tempo" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo badge-ring: pattern "wink" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "canon" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "escape" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "firefly" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "gust" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "relay" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "reveal" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "spark" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "sway" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "tempo" renders the static logo when reduced motion is on
tests/components/NewLoginLogoReducedMotion.test.tsx :: NewLoginLogo — reduced motion turns every pattern back into the static logo header: pattern "wink" renders the static logo when reduced motion is on
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — a spin is written as keyframes, never as a bare target every rotation in every pattern names its own starting angle
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — an animated svg attribute also has a static starting value every decoration says where each animated value starts
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — an animated svg attribute also has a static starting value every decoration that animates r, width or height also renders one
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — an animated svg attribute also has a static starting value the dots and the ring say where each animated value starts
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the reveal wipe uncovers the whole wordmark the clip rectangle ends up larger than the glyphs on every side
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "canon" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "escape" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "firefly" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "gust" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "relay" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "reveal" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "spark" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "sway" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "tempo" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser badge-ring: pattern "wink" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "canon" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "escape" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "firefly" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "gust" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "relay" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "reveal" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "spark" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "sway" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "tempo" is server rendered as the plain static mark
tests/components/NewLoginLogoServerRender.test.tsx :: NewLoginLogo — the server sends the static mark, and motion starts in the browser header: pattern "wink" is server rendered as the plain static mark
tests/components/SellerDashboard/productEdit/ProductEditor.readOnlyCategoryLookups.test.tsx :: ProductEditor — read-only seller, category lookups refused does not call the category-lookups endpoint at all while the form is read-only
tests/components/SellerDashboard/productEdit/ProductEditor.readOnlyCategoryLookups.test.tsx :: ProductEditor — read-only seller, category lookups refused still loads the branch lookups when a seller with UPDATE_PRODUCT clicks Edit
tests/components/SellerDashboard/productEdit/ProductEditor.readOnlyCategoryLookups.test.tsx :: ProductEditor — read-only seller, category lookups refused still shows the product's saved sub-category, sub-sub-category and attribute value
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers descriptorHasInput returns true for numeric descriptors
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers descriptorHasInput returns true for string_choice descriptors with valid options
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers descriptorIconUrl preserves absolute http/https URLs
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers descriptorIconUrl returns empty string when icon is absent
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers emptyProductForm, variantKey, fileName, combos, seedVariantDefaults cleanKey and variantKey sanitize color and size names
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers emptyProductForm, variantKey, fileName, combos, seedVariantDefaults combos generates Cartesian product of colors and sizes
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers emptyProductForm, variantKey, fileName, combos, seedVariantDefaults emptyProductForm initializes clean product form with default unit pc
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers emptyProductForm, variantKey, fileName, combos, seedVariantDefaults fileName extracts last path segment of image URL
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers emptyProductForm, variantKey, fileName, combos, seedVariantDefaults seedVariantDefaults populates default price/discount/luck on variant rows
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers flattenDescriptorValues & buildDescriptorSyncPayload flattens edit rows into key-value map and builds sync payload
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers flattenDescriptorValues & buildDescriptorSyncPayload sameDescriptorValues evaluates equality between blank and absent entries
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers getColorFromLookup falls back to raw code when not in lookups
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers getColorFromLookup finds color in lookups by code case-insensitively
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers locationLabel formats location name and address cleanly
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers normalizeSellerProductIds dedupes and filters raw seller product ID array
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers parseDescriptorOptions parses JSON-encoded descriptor option arrays
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers parseDescriptorOptions returns array unchanged if already array
tests/components/SellerDashboard/productEdit/helpers.test.ts :: SellerDashboard ProductEdit helpers parseDescriptorOptions returns empty array for invalid input
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a backslash
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a comma
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a dot
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a percent sign
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a semicolon
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a slash
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes a space
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: everything else the field must not carry removes an angle bracket
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: the characters this ticket is about removes a backtick
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: the characters this ticket is about removes a double quote
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: the characters this ticket is about removes a single quote
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: the characters this ticket is about removes all three at once
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: the characters this ticket is about removes the curly quotes a phone keyboard produces
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: values that are not text turns a value the backend sent as null into an empty id rather than throwing
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: values that are not text turns a value the field never received into an empty id rather than throwing
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: values that are not text turns nothing typed yet into an empty id rather than throwing
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: what a seller may still type keeps Arabic letters and Arabic-Indic digits
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: what a seller may still type keeps Turkish and Kurdish letters
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: what a seller may still type keeps a hyphen and an underscore
tests/components/SellerDashboard/productEdit/sellerProductId.test.ts :: what a seller may still type keeps plain letters and digits
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: clearing a backend failure as the seller fixes it (AC-13, AC-29) AC-13: never touches the record the form's own validation writes
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: clearing a backend failure as the seller fixes it (AC-13, AC-29) AC-13: removes only the changed field and leaves the others in place
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: clearing a backend failure as the seller fixes it (AC-13, AC-29) AC-29: returns the very same object when nothing was cleared
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-1 / AC-3: a barcode already in use marks the barcode field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-11: a refusal that is not a validation refusal marks nothing and says nothing
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-12: every coded entry lands in exactly one output, and a codeless entry is counted rather than lost
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-14: a codeless entry matching none of the four phrases marks no field at all
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-14: the four codeless image failures still mark their own inputs, with our wording
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-16: the same refusal produces the same outputs for an add and for an edit
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-17: two problems naming the same field leave one readable message
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-22: an entry naming a field with an empty message marks nothing
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-23: a validation refusal carrying no detail at all yields empty outputs to fall back on
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-27: a failure carrying no refusal body at all behaves as it does today
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-2: the field carries the backend's own sentence, character for character
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-30: with prices locked, a refusal naming a hidden price input is shown as text, not marked
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-4: a field name nothing in the code has ever mentioned still reaches the seller
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-5: a code naming an item inside a list marks that list's own field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-6: a colour/size row and a translation row are shown as text, and a variant key never reaches the flat field it starts with
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-7: a code cannot become a key on its own, and the field record has no prototype
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30) AC-8: a field problem and a non-field problem in one refusal both survive
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: moving the seller to the problem (AC-9, AC-26) AC-26: ignores an anchor whose field is not failing
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: moving the seller to the problem (AC-9, AC-26) AC-26: picks the field highest in the document, not the first key in the record
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: moving the seller to the problem (AC-9, AC-26) AC-9: does not scroll when nothing is failing
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: moving the seller to the problem (AC-9, AC-26) AC-9: scrolls the failing field into view
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming barcode to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming boutique_id to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming brand_id to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming category_id to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming colorImages to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming count_of_pieces to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming current_stock to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming description to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming discount_price to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming images to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming labels to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming location_id to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming luck_price to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming max_allowed_qty to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming meta_description to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming meta_title to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming model_number to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming name to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming origin_country_iso to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming purchase_price to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming report_ref_number to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming seller_product_id to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming shipping_cost to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming shipping_days to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming tax to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming tax_type to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming translations to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming unit to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming unit_price to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming variations to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) binds a refusal naming weight to that field
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the set of fields that can show a message (AC-10) does not bind similar_words, which carries an anchor but has no message slot
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the summary line shown alongside a refusal (AC-25) claims highlighted fields only when a field was actually marked
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the summary line shown alongside a refusal (AC-25) falls back to the caller's own wording when the refusal named nothing usable
tests/components/SellerDashboard/productEdit/serverErrors.test.ts :: the summary line shown alongside a refusal (AC-25) says what happened instead when nothing could be put on a field
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation accepts a luck price below both prices
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation accepts a luck price equal to the discount price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation accepts a luck price equal to the unit price when there is no discount price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation does not check the luck price for a seller whose prices are locked
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation leaves an empty luck price alone
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation refuses a luck price above the discount price when a discount price is set
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor luck price validation refuses a luck price above the unit price when there is no discount price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor variant luck price validation accepts a variant luck price below the variant discount price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor variant luck price validation accepts a variant luck price equal to the variant price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor variant luck price validation compares an empty variant price with the product unit price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor variant luck price validation does not check the variant luck price for a seller whose prices are locked
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor variant luck price validation refuses a variant luck price above the variant discount price
tests/components/SellerDashboard/productEdit/validate.luckPrice.test.ts :: product editor variant luck price validation refuses a variant luck price above the variant unit price
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation accepts a positive weight when the unit is gms
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation accepts a positive weight when the unit is kg
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation accepts a positive weight when the unit is l
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation accepts a positive weight when the unit is pc
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a negative weight when the unit is gms
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a negative weight when the unit is kg
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a negative weight when the unit is l
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a negative weight when the unit is pc
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a weight that is not a number
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a zero weight when the unit is gms
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a zero weight when the unit is kg
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a zero weight when the unit is l
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation rejects a zero weight when the unit is pc
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation requires a weight when the unit is gms
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation requires a weight when the unit is kg
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation requires a weight when the unit is l
tests/components/SellerDashboard/productEdit/validate.weight.test.ts :: product editor weight validation requires a weight when the unit is pc
tests/components/global/InFlowPageLoader.test.tsx :: the in-flow navigation loader does not show the dashboard shape for the forward click into an editor (AC-10)
tests/components/global/InFlowPageLoader.test.tsx :: the in-flow navigation loader leaves every other navigation on the loader it already had
tests/components/global/InFlowPageLoader.test.tsx :: the in-flow navigation loader renders nothing when no navigation is in flight
tests/components/global/InFlowPageLoader.test.tsx :: the in-flow navigation loader shows the dashboard shape for a seller-dashboard back navigation (AC-10)
tests/components/global/NavigationLoaderGate.test.tsx :: the navigation loader gate and the window scroll hides the real page while the loader is up, and brings it back after
tests/components/global/NavigationLoaderGate.test.tsx :: the navigation loader gate and the window scroll leaves the scroll alone when the navigation says it is not an overlay (AC-11)
tests/components/global/NavigationLoaderGate.test.tsx :: the navigation loader gate and the window scroll still runs the overlay scroll handling when the navigation says nothing (AC-11)
tests/components/logoSequence.test.tsx :: NewLoginLogo — animateWord=false holds the glyphs still leaves the wordmark clipped when the word may move
tests/components/logoSequence.test.tsx :: NewLoginLogo — animateWord=false holds the glyphs still takes the clip away when the word must hold still
tests/components/logoSequence.test.tsx :: the design defaults are the ones the flow was signed off on builds Get Started once and then hands off for good
tests/components/logoSequence.test.tsx :: the design defaults are the ones the flow was signed off on builds the Quick Preview wordmark once, with its glyphs held still
tests/components/logoSequence.test.tsx :: the design defaults are the ones the flow was signed off on plays Hand-Off on a loop on every screen the client did not single out
tests/components/logoSequence.test.tsx :: the design defaults are the ones the flow was signed off on runs every step of every screen for 3 seconds
tests/components/logoSequence.test.tsx :: useLogoSequence — a screen plays its steps in order ends on the plain static mark when the slot does not loop
tests/components/logoSequence.test.tsx :: useLogoSequence — a screen plays its steps in order holds one looping step for ever without a timer
tests/components/logoSequence.test.tsx :: useLogoSequence — a screen plays its steps in order holds the last step for ever when the slot does loop, instead of replaying the build
tests/components/logoSequence.test.tsx :: useLogoSequence — a screen plays its steps in order moves to the second step only after the first step has had its seconds
tests/components/products/ProductCard/flashPrice.test.ts :: a product with no deal at all (AC-4) ignores a deal price that arrives with no deal date
tests/components/products/ProductCard/flashPrice.test.ts :: a product with no deal at all (AC-4) uses the offer price and reports no deal
tests/components/products/ProductCard/flashPrice.test.ts :: how much time the deal has left (AC-5) hands back the four keys the countdown banner seeds itself from
tests/components/products/ProductCard/flashPrice.test.ts :: how much time the deal has left (AC-5) reports nothing at all once the deal has ended
tests/components/products/ProductCard/flashPrice.test.ts :: how much time the deal has left (AC-5) reports the days, hours, minutes and seconds still to run
tests/components/products/ProductCard/flashPrice.test.ts :: the same question always gets the same answer (AC-6) does not depend on the day the check runs
tests/components/products/ProductCard/flashPrice.test.ts :: the same question always gets the same answer (AC-6) reads the moment it is handed, and never the clock
tests/components/products/ProductCard/flashPrice.test.ts :: when a deal counts as running (AC-3) has ended once its last day is over
tests/components/products/ProductCard/flashPrice.test.ts :: when a deal counts as running (AC-3) is still running in the last moment of its last day
tests/components/products/ProductCard/flashPrice.test.ts :: which price the card shows (AC-1, AC-2) falls back to the offer price when a running deal carries no deal price
tests/components/products/ProductCard/flashPrice.test.ts :: which price the card shows (AC-1, AC-2) falls back to the plain price when there is no offer price either
tests/components/products/ProductCard/flashPrice.test.ts :: which price the card shows (AC-1, AC-2) shows the deal price while the deal is running
tests/components/products/ProductCard/flashPrice.test.ts :: which price the card shows (AC-1, AC-2) treats an offer price of zero as a real price, not as a missing one
tests/components/products/ProductCard/hydrationStability.test.tsx :: a product card rendered at two different moments produces the same markup a minute later
tests/components/products/ProductCard/hydrationStability.test.tsx :: a product card rendered at two different moments produces the same markup one second later
tests/components/products/ProductCard/hydrationStability.test.tsx :: a product card rendered at two different moments still renders the card, so the comparison is not between two empty strings
tests/components/products/ProductCard/hydrationStability.test.tsx :: hydrating the server markup of a product card does not report a mismatch
tests/components/products/ProductCard/index.test.tsx :: the product card once the deal has ended (AC-9) falls back to the ordinary price, and drops the countdown and the border
tests/components/products/ProductCard/index.test.tsx :: the product card while a flash deal is running (AC-9) shows the deal price, the countdown and the deal border
tests/components/products/ProductCard/index.test.tsx :: the product card with no deal at all (AC-9) shows the offer price and nothing about a deal
tests/components/products/ProductStories.test.tsx :: ProductStories — borrowing the shared story list puts the home stories back when the product modal closes
tests/components/products/ProductStories.test.tsx :: ProductStories — borrowing the shared story list takes the shared story list over while the product page is open
tests/components/setting/orders/returnedQty.test.ts :: shouldShowReturnedQty hides the returned quantity when the item was never returned
tests/components/setting/orders/returnedQty.test.ts :: shouldShowReturnedQty hides the returned quantity when the return request is cancelled
tests/components/setting/orders/returnedQty.test.ts :: shouldShowReturnedQty hides the returned quantity when the returned amount is zero
tests/components/setting/orders/returnedQty.test.ts :: shouldShowReturnedQty hides the returned quantity while the return request is still a draft
tests/components/setting/orders/returnedQty.test.ts :: shouldShowReturnedQty shows the returned quantity for an accepted return request
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a changed phone number (AC-9) opens the re-verify step instead of saving
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a changed phone number (AC-9) saves directly when the number was not touched
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a save the backend refused keeps what the shopper typed instead of putting the old value back
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a save the backend refused leaves the form alone when the refusal names no field
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a save the backend refused marks every field the backend named, not only the first
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a save the backend refused shows the backend's reason under the field the backend named
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a save the backend refused takes the backend's message away once the shopper edits that field
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a visitor who is not signed in (AC-8) gets the sign-in surface instead of a save
tests/components/setting/profile/PersonalInfoForm.test.tsx :: a visitor who is not signed in (AC-8) is stopped before validation, so no validation messages appear
tests/components/setting/profile/PersonalInfoForm.test.tsx :: correcting a field (AC-7) takes the message away once the field it belongs to is fixed
tests/components/setting/profile/PersonalInfoForm.test.tsx :: what the form refuses to save (AC-6) refuses a name below the minimum length
tests/components/setting/profile/PersonalInfoForm.test.tsx :: what the form refuses to save (AC-6) refuses a phone number the shopper has cleared
tests/components/setting/profile/PersonalInfoForm.test.tsx :: what the form refuses to save (AC-6) refuses a profile with no gender chosen
tests/components/setting/profile/PersonalInfoForm.test.tsx :: what the form refuses to save (AC-6) refuses an e-mail that is not an e-mail, while it is optional when empty
tests/components/setting/profile/PersonalInfoForm.test.tsx :: what the form refuses to save (AC-6) refuses an empty name, with the message the screen really shows
tests/components/setting/profile/VerifyUser.test.tsx :: an account that already has a usable phone opens nothing when it is tapped
tests/components/setting/profile/VerifyUser.test.tsx :: an account that already has a usable phone reads Verified
tests/components/setting/profile/VerifyUser.test.tsx :: an account with no usable phone opens the re-verify overlay when it has a number to work with
tests/components/setting/profile/VerifyUser.test.tsx :: an account with no usable phone reads Verify Now
tests/components/setting/profile/VerifyUser.test.tsx :: an account with no usable phone sends a shopper with no number at all to the sign-in surface instead
tests/components/setting/profile/VerifyUser.test.tsx :: standing down for a global auth surface closes its overlay when a global surface opens, and does not reopen when that surface clears
tests/components/setting/profile/VerifyUser.test.tsx :: standing down for a global auth surface stands down for a re-authentication demand too, not only the sign-in surface
tests/components/setting/profile/index.test.tsx :: a signed-in shopper gets a link to the picture page and a link to their profile
tests/components/setting/profile/index.test.tsx :: a signed-in shopper sees their own name on the card
tests/components/setting/profile/index.test.tsx :: a signed-in shopper shows the verify control
tests/components/setting/profile/index.test.tsx :: a visitor who is not signed in has no profile link to follow
tests/components/setting/profile/index.test.tsx :: a visitor who is not signed in is invited to log in instead of shown a card
tests/components/setting/profile/index.test.tsx :: a visitor who is not signed in opens the sign-in surface when the card is tapped, instead of navigating
tests/components/setting/profile/index.test.tsx :: the placeholder names the app stores instead of a picture still shows a real picture when there is one
tests/components/setting/profile/index.test.tsx :: the placeholder names the app stores instead of a picture treats "guest" as no picture
tests/components/setting/profile/index.test.tsx :: the placeholder names the app stores instead of a picture treats "null" as no picture
tests/components/setting/profile/index.test.tsx :: the placeholder names the app stores instead of a picture treats "verfied_guest" as no picture
tests/components/setting/profile/index.test.tsx :: the placeholder names the app stores instead of a picture treats "verified_guest" as no picture
tests/components/setting/profile/index.test.tsx :: the placeholder names the app stores instead of a picture treats an empty value as no picture
tests/components/settings/UploadProfilePhoto.test.tsx :: an upload the media backend refuses attempts the upload, then saves nothing and leaves the shopper where they were
tests/components/settings/UploadProfilePhoto.test.tsx :: an upload the media backend refuses tells the shopper the upload failed
tests/components/settings/UploadProfilePhoto.test.tsx :: choosing a picture puts the screen into a state where the shopper can save it
tests/components/settings/UploadProfilePhoto.test.tsx :: choosing a picture uploads it and sends the stored path on to the profile
tests/components/settings/UploadProfilePhoto.test.tsx :: removing a picture clears it and saves the profile with no picture
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a form draws placeholder blocks and no spinner (AC-8)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a form is built from the one shared placeholder block (AC-18)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a form is hidden from assistive technology, inside a region that reports busy (AC-17)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a grid of tiles draws placeholder blocks and no spinner (AC-8)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a grid of tiles is built from the one shared placeholder block (AC-18)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a grid of tiles is hidden from assistive technology, inside a region that reports busy (AC-17)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a list of rows draws placeholder blocks and no spinner (AC-8)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a list of rows is built from the one shared placeholder block (AC-18)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes a list of rows is hidden from assistive technology, inside a region that reports busy (AC-17)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the boutiques grid draws placeholder blocks and no spinner (AC-8)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the boutiques grid is built from the one shared placeholder block (AC-18)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the boutiques grid is hidden from assistive technology, inside a region that reports busy (AC-17)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the inline wait draws placeholder blocks and no spinner (AC-8)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the inline wait is built from the one shared placeholder block (AC-18)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the inline wait is hidden from assistive technology, inside a region that reports busy (AC-17)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the products grid draws placeholder blocks and no spinner (AC-8)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the products grid is built from the one shared placeholder block (AC-18)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the products grid is hidden from assistive technology, inside a region that reports busy (AC-17)
tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx :: the seller-dashboard placeholder shapes the whole-dashboard shape keeps the page tall (AC-8)
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
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'global product': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'global product': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'listing product': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'listing product': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order line': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order line': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'order': two calls return independent objects
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'qty/price product': returns a complete object when called with nothing
tests/fixtures/fixtures.test.ts :: test fixtures — every builder 'qty/price product': two calls return independent objects
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
tests/hooks/useIsTouchDevice.test.ts :: useIsTouchDevice hook returns false on standard desktop non-touch screens with window width > 768
tests/hooks/useIsTouchDevice.test.ts :: useIsTouchDevice hook returns true on small screens (width <= 768)
tests/hooks/useIsTouchDevice.test.ts :: useIsTouchDevice hook returns true when pointer is coarse (touch device)
tests/hooks/useLiveColor.test.ts :: useLiveColor & useLiveParam hooks extracts query search param from URL when present
tests/hooks/useLiveColor.test.ts :: useLiveColor & useLiveParam hooks falls back to server value when query param is absent
tests/hooks/useLiveColor.test.ts :: useLiveColor & useLiveParam hooks useLiveColor returns live color query param
tests/hooks/useLuckTimer.test.ts :: useLuckTimer hook expires timer when expired flag is set in store
tests/hooks/useLuckTimer.test.ts :: useLuckTimer hook initializes luck timer on mount when isLuck is true
tests/hooks/useLuckTimer.test.ts :: useLuckTimer hook pauses timer when visible is false or isNavigating is true in store
tests/hooks/useLuckTimer.test.ts :: useLuckTimer hook returns luckActive false when isLuck parameter is false
tests/hooks/useUserData.test.ts :: useUserData hook falls back to serverData/initialUserData when store data is null
tests/hooks/useUserData.test.ts :: useUserData hook fetches /api/auth/me when store profile is null and updates serverData
tests/hooks/useUserData.test.ts :: useUserData hook returns store userProfile when all store data is available
tests/mocks/mocks.test.ts :: cookie stand-in — the copied names reads and writes its own jar instead of a real cookie store
tests/mocks/mocks.test.ts :: cookie stand-in — the copied names still matches every name in the real cookie manager
tests/mocks/mocks.test.ts :: cookie stand-in — the copied names still matches the real names in the sign-in graph's own copy
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
tests/next-config.test.ts :: next.config.ts response headers leaves the sitemap Cache-Control to the route that owns it
tests/next-config.test.ts :: next.config.ts response headers never gives a catch-all source a public Cache-Control
tests/next-config.test.ts :: next.config.ts response headers still caches static assets immutably
tests/next-config.test.ts :: next.config.ts response headers still sends no-store for every API route
tests/next-config.test.ts :: the homepage cache profile defines a profile named homepage
tests/next-config.test.ts :: the homepage cache profile expires no sooner than five minutes, so the segment is prerendered
tests/next-config.test.ts :: the homepage cache profile reads the window from HOMEPAGE_CACHE_SECONDS
tests/next-config.test.ts :: the homepage cache profile revalidates once a minute by default
tests/proxy.test.ts :: choosing the country (AC-3) accepts a supported country whatever letter case the request's own country arrives in
tests/proxy.test.ts :: choosing the country (AC-3) accepts a supported country whatever letter case the saved values arrive in
tests/proxy.test.ts :: choosing the country (AC-3) falls back to the country Vercel infers when Cloudflare is not in front
tests/proxy.test.ts :: choosing the country (AC-3) ignores the saved pair when the saved language is not supported
tests/proxy.test.ts :: choosing the country (AC-3) prefers the country Cloudflare reports over the one Vercel infers
tests/proxy.test.ts :: choosing the country (AC-3) prefers the country the request comes from over the default
tests/proxy.test.ts :: choosing the country (AC-3) prefers the saved country over the one the request appears to come from
tests/proxy.test.ts :: choosing the country (AC-3) reads the language from the `language` cookie when `lang` is missing
tests/proxy.test.ts :: choosing the country (AC-3) refuses a saved country it does not support and uses the default gb
tests/proxy.test.ts :: choosing the country (AC-3) treats a country Cloudflare could not determine as no country at all
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
tests/proxy.test.ts :: passing through or redirecting (AC-4) keeps a hyphenated path that only looks like a pair (/gift-cards/buy)
tests/proxy.test.ts :: passing through or redirecting (AC-4) keeps a hyphenated path that only looks like a pair (/privacy-policy)
tests/proxy.test.ts :: passing through or redirecting (AC-4) keeps a hyphenated path that only looks like a pair (/terms-of-service)
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
tests/proxy.test.ts :: the staging gate answers before the locale rules, so a path with no locale is not sent to one
tests/proxy.test.ts :: the staging gate contacts nothing while it is on
tests/proxy.test.ts :: the staging gate redirects temporarily, so no browser remembers the landing page after launch
tests/proxy.test.ts :: the staging gate sends every other path back to the landing page when it is on
tests/proxy.test.ts :: the staging gate serves the landing page at the root when it is on
tests/proxy.test.ts :: the staging gate stays off when nothing is set, and the storefront answers
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
tests/scripts/unitReportTreeSize.test.ts :: a suite small enough to send whole is not cut at all
tests/scripts/unitReportTreeSize.test.ts :: the attached test list can always be passed to the notifier says it was cut rather than ending mid-line
tests/scripts/unitReportTreeSize.test.ts :: the attached test list can always be passed to the notifier stays under the environment-variable limit for a suite far larger than this one
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist does not exempt a number that is not on the list
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist does not exempt no list configured at all
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist gets no lock when the backend itself refuses the send
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist is matched on digits alone — a leading plus
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist is matched on digits alone — several numbers, one of them this one
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist is matched on digits alone — spaces and brackets
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist is matched on digits alone — untidy separators
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist is not sent to the limiter, and its send still goes out for real
tests/serverActions/sendOtp.test.ts :: a number on the test-number allowlist is still recorded, named as a test number
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
tests/serverRequests/buildAlternates.test.ts :: buildAlternates utility appends path suffix across all language alternate URLs
tests/serverRequests/buildAlternates.test.ts :: buildAlternates utility builds canonical and language hreflang cluster for home path
tests/serverRequests/cached/currency.test.ts :: getCachedCurrency drops the timing fields, which differ on every call
tests/serverRequests/cached/currency.test.ts :: getCachedCurrency keeps the empty answer empty rather than inventing a rate
tests/serverRequests/cached/currency.test.ts :: getCachedCurrency passes the country and language straight through
tests/serverRequests/cached/home.test.ts :: getCachedBoutiques asks for one category when a slug is given
tests/serverRequests/cached/home.test.ts :: getCachedBoutiques returns an empty section rather than throwing when the search engine answers nothing
tests/serverRequests/cached/home.test.ts :: getCachedBoutiques returns the boutiques and the offset the infinite scroll needs
tests/serverRequests/cached/home.test.ts :: getCachedCategories keeps only the requested language
tests/serverRequests/cached/home.test.ts :: getCachedCategories matches the language case-insensitively
tests/serverRequests/cached/home.test.ts :: getCachedCategories returns an empty list rather than throwing when the search engine answers nothing
tests/serverRequests/cached/home.test.ts :: getCachedCategories returns each category once even when many products share it
tests/serverRequests/cached/home.test.ts :: getCachedCategories returns only the six fields the navbar renders
tests/serverRequests/cached/home.test.ts :: getCachedFeatured asks for no category when the slug is null
tests/serverRequests/cached/home.test.ts :: getCachedFeatured asks for one category when a slug is given
tests/serverRequests/cached/home.test.ts :: getCachedFeatured passes the country and language the shopper asked for
tests/serverRequests/cached/home.test.ts :: getCachedFeatured returns an empty list rather than throwing when the search engine answers nothing
tests/serverRequests/cached/home.test.ts :: getCachedFeatured returns products the caller can render without a cookie
tests/serverRequests/cached/home.test.ts :: getCachedFlashDeals asks for no category when the slug is null
tests/serverRequests/cached/home.test.ts :: getCachedFlashDeals asks for one category when a slug is given
tests/serverRequests/cached/home.test.ts :: getCachedFlashDeals passes the country and language the shopper asked for
tests/serverRequests/cached/home.test.ts :: getCachedFlashDeals returns an empty list rather than throwing when the search engine answers nothing
tests/serverRequests/cached/home.test.ts :: getCachedFlashDeals returns products the caller can render without a cookie
tests/serverRequests/constantsMeta.test.ts :: trydosTranslations metadata constants contains translations for en, ar, tr, and ku languages
tests/serverRequests/constantsMeta.test.ts :: trydosTranslations metadata constants formats listing descriptions dynamically
tests/serverRequests/currency.test.ts :: the currency readers and the backend they ask asks the gateway for the country and language it was given
tests/serverRequests/currency.test.ts :: the currency readers and the backend they ask keeps the gateway reader away from the cookie
tests/serverRequests/currency.test.ts :: the currency readers and the backend they ask returns the same shape from both readers
tests/serverRequests/currency.test.ts :: the currency readers and the backend they ask sends the gateway reader to the gateway base
tests/serverRequests/currency.test.ts :: the currency readers and the backend they ask sends the ordinary reader to whichever backend the shopper's cookie chose
tests/serverRequests/meta/home.test.ts :: GetHomeMetaData category slug does not accept a repeated ?mainCategory=, which arrives as an array
tests/serverRequests/meta/home.test.ts :: GetHomeMetaData category slug does not open a Redis key for a slug that is not a slug
tests/serverRequests/meta/home.test.ts :: GetHomeMetaData category slug does not put a stranger's text in the OpenGraph url
tests/serverRequests/meta/home.test.ts :: GetHomeMetaData category slug does not put a stranger's text in the page title
tests/serverRequests/meta/home.test.ts :: GetHomeMetaData category slug keeps building category metadata for a real slug
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug accepts blue-shirt, which is the shape a real category slug has
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug accepts kürt2, which is the shape a real category slug has
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug accepts men_bags, which is the shape a real category slug has
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug accepts shoes, which is the shape a real category slug has
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug accepts çocuk, which is the shape a real category slug has
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug accepts أحذية, which is the shape a real category slug has
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses 
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses -leading-hyphen
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses ../../etc/passwd
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses <script>alert(1)</script>
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses Buy cheap pills at evil.example
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses a value longer than a slug ever is
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses shoes?x=1
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses the non-string value 7
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses the non-string value null
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses the non-string value shoes,boots
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses the non-string value undefined
tests/serverRequests/meta/home.test.ts :: isValidCategorySlug refuses the non-string value {}
tests/serverRequests/meta/home.test.ts :: the cached metadata reader's key asks for the homepage cache window, not the framework default
tests/serverRequests/meta/home.test.ts :: the cached metadata reader's key gives the plain homepage its own tag instead of an empty one
tests/serverRequests/meta/home.test.ts :: the cached metadata reader's key keeps a slug a stranger chose out of the cache tag
tests/serverRequests/meta/home.test.ts :: the cached metadata reader's key puts the country, the language and the slug in the tag
tests/serverRequests/meta/home.test.ts :: the cached metadata reader's key still lets a real slug through to the tag
tests/serverRequests/product.test.ts :: GetCountries AC-1 serves a cached list without asking a backend
tests/serverRequests/product.test.ts :: GetCountries AC-2 asks the backend on a miss and keeps the answer for the next reader
tests/serverRequests/product.test.ts :: GetCountries AC-3 gives an empty list when the reply carries none, and the backend was asked
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-37 BUG-2: a refused request returns a record with no id and no signal the caller can read
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-4 serves a cached record and says it came from the cache
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-5 reads fresh when nothing is cached and says so
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-6 writes both the slug key and the record key after a fresh read
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-7 skips the cache read when asked, and still writes the result back
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-8 sends a guest to the gateway
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-8 sends a verified shopper to the core backend
tests/serverRequests/product.test.ts :: GetGlobalProduct AC-9 reports a raising cache and re-raises it
tests/serverRequests/product.test.ts :: GetProductCommentsCount AC-28 leaves out deleted comments and order ratings, shown by the query sent
tests/serverRequests/product.test.ts :: GetProductGeneralData AC-20 returns the empty shape without asking anything when there is no product id
tests/serverRequests/product.test.ts :: GetProductGeneralData AC-21 turns the star spread into rating groups with their counts
tests/serverRequests/product.test.ts :: GetProductGeneralData AC-22 counts a product with no view record as zero views, and does not report it
tests/serverRequests/product.test.ts :: GetProductGeneralData AC-23 BUG-1: a failed ratings query leaves the fallback figures unreachable
tests/serverRequests/product.test.ts :: GetProductMeta AC-13 reports a product the backend does not have as not found
tests/serverRequests/product.test.ts :: GetProductMeta AC-14 does not report a refused request as not found
tests/serverRequests/product.test.ts :: GetProductMeta AC-15 puts a chosen colour and size in the title
tests/serverRequests/product.test.ts :: GetProductMeta AC-16 appends brand and category to the title when the product has them
tests/serverRequests/product.test.ts :: GetProductMeta AC-17 keeps a real description as it is
tests/serverRequests/product.test.ts :: GetProductMeta AC-17 replaces a description too short to be useful
tests/serverRequests/product.test.ts :: GetProductMeta AC-18 falls back to the site image when the product has no picture
tests/serverRequests/product.test.ts :: GetProductMeta AC-19 serves cached metadata without asking the backend
tests/serverRequests/product.test.ts :: GetProductPriceQtyDetails AC-10 serves a cached payload and says it came from the cache
tests/serverRequests/product.test.ts :: GetProductPriceQtyDetails AC-11 keeps price, offer price, variants and available quantity on a fresh read
tests/serverRequests/product.test.ts :: GetProductPriceQtyDetails AC-12 reports a raising cache and returns nothing, unlike the main record read
tests/serverRequests/product.test.ts :: GetProductPriceQtyDetails AC-38 BUG-2: a refused request returns the price payload hollow, with no signal
tests/serverRequests/product.test.ts :: GetProductStoriesData AC-29 sends no credential for a guest
tests/serverRequests/product.test.ts :: GetProductStoriesData AC-29 sends the stories credential when the shopper has one
tests/serverRequests/product.test.ts :: GetProductStoriesData AC-30 gives empty lists when the stories request is refused
tests/serverRequests/product.test.ts :: GetProductStoriesData AC-31 leaves a group unmarked when every story in it is seen
tests/serverRequests/product.test.ts :: GetProductStoriesData AC-31 marks a group as new when any story in it is unseen
tests/serverRequests/product.test.ts :: GetRecommendationCountForProduct AC-24 works the percentages out from the two totals
tests/serverRequests/product.test.ts :: GetRecommendationCountForProduct AC-25 gives zero rather than dividing by zero when nobody has rated
tests/serverRequests/product.test.ts :: GetSocialInfoForProduct AC-26 gathers likes, comments and shares from their three sources
tests/serverRequests/product.test.ts :: GetSocialInfoForProduct AC-27 reads this shopper's like from their most recent interaction
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
tests/serverRequests/structuredDataUtils.test.ts :: StructuredData utils buildParamsFromFilters builds parameter array from category, boutique, and brand filter selections
tests/serverRequests/structuredDataUtils.test.ts :: StructuredData utils mapCurrencyToSymbol defaults to USD for unknown country ISO codes
tests/serverRequests/structuredDataUtils.test.ts :: StructuredData utils mapCurrencyToSymbol maps country ISO codes to ISO 4217 currency codes
tests/serverRequests/structuredDataUtils.test.ts :: StructuredData utils mapLocaleToBCP47 defaults to en-US for unmapped locales
tests/serverRequests/structuredDataUtils.test.ts :: StructuredData utils mapLocaleToBCP47 maps locale pairs to BCP47 tags
tests/services/auth.otp.test.ts :: sending a code falls back to the documented default cooldown when the server names none (AC-2)
tests/services/auth.otp.test.ts :: sending a code mirrors no lock and counts nothing when the server says the number is allowlisted
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
tests/services/auth.profile.test.ts :: mirroring every saved field into the stored copy (AC-15) never writes the one-time token into the stored profile
tests/services/auth.profile.test.ts :: mirroring every saved field into the stored copy (AC-15) writes every field that was sent, taking none of them from the old copy
tests/services/auth.profile.test.ts :: picture paths (AC-27) adds the folder for the stored copy, and leaves an empty value as it is
tests/services/auth.profile.test.ts :: picture paths (AC-27) leaves a value that is already in the target form alone
tests/services/auth.profile.test.ts :: picture paths (AC-27) reports nothing for an empty value on the service side
tests/services/auth.profile.test.ts :: picture paths (AC-27) strips the folder for the market and adds it for the other services
tests/services/auth.profile.test.ts :: renaming (AC-23) puts the old name back and says so when a service refuses it
tests/services/auth.profile.test.ts :: renaming (AC-23) writes the new name to the state and to all three profile copies before any request
tests/services/auth.profile.test.ts :: updating the profile carries a cleared e-mail and alternative phone through to the stored copy (AC-24)
tests/services/auth.profile.test.ts :: updating the profile clears the picture in the shopper's own copy when the picture is removed (AC-24)
tests/services/auth.profile.test.ts :: updating the profile does not cover the refused field with a general failure line
tests/services/auth.profile.test.ts :: updating the profile does not roll back a leg that never ran (AC-25)
tests/services/auth.profile.test.ts :: updating the profile keeps a field the save never mentioned (AC-24)
tests/services/auth.profile.test.ts :: updating the profile looks up the missing service records before running the legs (AC-26)
tests/services/auth.profile.test.ts :: updating the profile puts every completed leg back when a later one fails, and tells the shopper once (AC-25)
tests/services/auth.profile.test.ts :: updating the profile puts the OLD value into the shopper's own copies when a leg is rolled back (AC-25)
tests/services/auth.profile.test.ts :: updating the profile sends the picture path in the form each service expects (AC-24)
tests/services/auth.profile.test.ts :: updating the profile skips a leg the shopper has no record for (AC-24)
tests/services/auth.profile.test.ts :: updating the profile still says something general when the refusal names no field
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
tests/services/cart.test.ts :: CartService AddToCart posts payload to /cart/add and updates store localCart on success
tests/services/cart.test.ts :: CartService AddToCart returns false and logs error on API failure
tests/services/cart.test.ts :: CartService AddToCart — what the core backend's answer decides adds nothing when the core backend answers status 0
tests/services/cart.test.ts :: CartService AddToCart — what the core backend's answer decides adds nothing when the core backend answers without a cart row id
tests/services/cart.test.ts :: CartService AddToCart — what the core backend's answer decides keeps the full image URL in the store, because the cart draws it
tests/services/cart.test.ts :: CartService AddToCart — what the core backend's answer decides labels the request as the add-to-cart widget when the widget asked
tests/services/cart.test.ts :: CartService AddToCart — what the core backend's answer decides sends the image file name to the core backend, not the whole URL
tests/services/cart.test.ts :: CartService AddToCart — what the core backend's answer decides stores the cart row id the core backend gave, not the product id
tests/services/cart.test.ts :: CartService ConvertToOldCart — moving an item to Out-Of-Bag tells the screen the core backend moved the item
tests/services/cart.test.ts :: CartService ConvertToOldCart — moving an item to Out-Of-Bag tells the screen the core backend refused to move the item
tests/services/cart.test.ts :: CartService RemoveFromCart & ConvertToOldCart ConvertToOldCart calls /cart/convert_to_old with cart_item key
tests/services/cart.test.ts :: CartService RemoveFromCart & ConvertToOldCart RemoveFromCart calls /cart/remove and removes item from localCart
tests/services/cart.test.ts :: CartService RemoveFromCart — when the core backend refuses to remove the item does not list the item twice when the screen never took it away
tests/services/cart.test.ts :: CartService RemoveFromCart — when the core backend refuses to remove the item does not put a widget row on the cart page the widget never touched
tests/services/cart.test.ts :: CartService RemoveFromCart — when the core backend refuses to remove the item labels the request as the add-to-cart widget when the widget asked
tests/services/cart.test.ts :: CartService RemoveFromCart — when the core backend refuses to remove the item puts the item back in the cart the core backend refused to change
tests/services/cart.test.ts :: CartService RemoveFromCart — when the core backend refuses to remove the item puts the item back on the cart page the shopper is looking at
tests/services/cart.test.ts :: CartService RemoveFromCart — when the core backend refuses to remove the item reports the refusal to the screen instead of throwing
tests/services/cart.test.ts :: CartService UpdateCart posts payload to /cart/update and updates item quantity in store
tests/services/cart.test.ts :: CartService UpdateCart — when the core backend confirms a different number leaves the quantity alone when the core backend answers status 0
tests/services/cart.test.ts :: CartService UpdateCart — when the core backend confirms a different number leaves the quantity alone when the core backend refuses the change
tests/services/cart.test.ts :: CartService UpdateCart — when the core backend confirms a different number writes the quantity the core backend confirmed, not the one asked for
tests/services/elastic/helpers.test.ts :: asking the search server for the right fields (getSourceFields) adds the heavy fields back for the phone app
tests/services/elastic/helpers.test.ts :: asking the search server for the right fields (getSourceFields) asks for both price shapes, so a country price can be read
tests/services/elastic/helpers.test.ts :: asking the search server for the right fields (getSourceFields) leaves the heavy fields out for the website
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) keeps only the wording in the shopper's language
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) reports the price band across everything it collected
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) skips a product with no wording at all
tests/services/elastic/helpers.test.ts :: collecting the cards for a listing (extractFilters) skips a product with nothing written in the shopper's language
tests/services/elastic/helpers.test.ts :: computeFlashActive is false after the window closes
tests/services/elastic/helpers.test.ts :: computeFlashActive is false before the window opens
tests/services/elastic/helpers.test.ts :: computeFlashActive is false when the dates cannot be read
tests/services/elastic/helpers.test.ts :: computeFlashActive is true for a moment inside the window
tests/services/elastic/helpers.test.ts :: computeFlashActive takes the moment as an argument and never reads the clock itself
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
tests/services/elastic/helpers.test.ts :: the flash-deal range bound in buildBaseConditions bounds the window with the search engine's own date math, not a JavaScript clock
tests/services/elastic/helpers.test.ts :: the flash-deal range bound in buildBaseConditions builds the same query twice, so nothing about it depends on when it ran
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
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) carries the flash-deal window and price through without deciding if it is running
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) ignores a flash deal that was switched off
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) leaves a finished deal's window intact for the caller to judge
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) marks the product as in stock only when there is stock
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) shows both the price paid and the price struck through
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) shows the reward price only when the product has one
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) takes the brand written in the shopper's language
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) treats a brand as unverified unless the record says otherwise
tests/services/elastic/helpers.test.ts :: turning a search result into a product card (processCustomProduct) uses the country's prices when a country was asked for
tests/services/elastic/sitemapService.test.ts :: generateSearchTermsSitemapUrls asks Elasticsearch once, not once per search term
tests/services/elastic/sitemapService.test.ts :: generateSearchTermsSitemapUrls falls back to tr when the search log reports a country the app does not serve
tests/services/elastic/sitemapService.test.ts :: generateSearchTermsSitemapUrls falls back to tr/en when the search log reports neither
tests/services/elastic/sitemapService.test.ts :: generateSearchTermsSitemapUrls still uses the country and language most used with each term
tests/services/elastic/sitemapService.test.ts :: generateSearchTermsSitemapUrls still writes one url per search term
tests/services/elasticHelpers.test.ts :: elastic helpers pure functions buildSortClause builds correct ES sort clauses for all listing sort keys
tests/services/elasticHelpers.test.ts :: elastic helpers pure functions buildSortClause falls back to relevance sort for unknown or empty sort keys
tests/services/elasticHelpers.test.ts :: elastic helpers pure functions getSourceFields includes mobile-only source fields when full is true
tests/services/elasticHelpers.test.ts :: elastic helpers pure functions getSourceFields returns base fields when full is false
tests/services/elasticSortKeys.test.ts :: LISTING_SORT_KEYS vocabulary contains all canonical listing sort keys
tests/services/home.checkLogin.test.ts :: CheckLogin — the app-load auth bootstrap registers exactly one guest for a visitor arriving with no credential
tests/services/home.checkLogin.test.ts :: CheckLogin — the app-load auth bootstrap registers no guest at all when the visitor already holds a credential
tests/services/home.test.ts :: Home Service GetFireBaseSettings fetches firebase settings and updates store state
tests/services/home.test.ts :: Home Service GetFireBaseSettings resets firebase settings to null when response is unsuccessful
tests/services/orderClass.test.ts :: OrderService (services/order.ts) AddAddressList refreshes the address list from the core backend before it returns
tests/services/orderClass.test.ts :: OrderService (services/order.ts) AddAddressList swallows a refusal from the core backend and leaves the list alone
tests/services/orderClass.test.ts :: OrderService (services/order.ts) PlaceOrder posts checkout payload to /customer/order/checkout and sets order data on success
tests/services/orderClass.test.ts :: OrderService (services/order.ts) getUploadSubPath extracts last path segment from media URL
tests/services/orders.test.ts :: Orders Service fetchHiddenOrders calls /customer/order/getHiddenOrders endpoint
tests/services/orders.test.ts :: Orders Service fetchOrders fetches orders list with pagination parameters and updates totalOrders store
tests/services/orders.test.ts :: Orders Service fetchOrders handles failure gracefully and logs server error
tests/services/orders.test.ts :: Orders Service fetchOrdersCount requests offset=1&limit=1 and returns total_order_group count
tests/services/products.test.ts :: Products Service GetProductDeliveryTimes fetches product delivery distribution from endpoint and returns delivered_orders array
tests/services/products.test.ts :: Products Service GetProductDeliveryTimes returns empty array fallback when response success is false
tests/services/search.test.ts :: Search Service getTrendingSearch fetches popular search terms from /api/products/popular-search
tests/services/search.test.ts :: Search Service getTrendingSearch returns null and logs error when request fails
tests/services/sellerDashboardComments.test.ts :: SellerCommentsService DeleteReplyForFqaComment delegates to deleteReply
tests/services/sellerDashboardComments.test.ts :: SellerCommentsService GetFQAComments delegates to getSellerComments with isReview: false
tests/services/sellerDashboardComments.test.ts :: SellerCommentsService GetReviewComments delegates to getSellerComments with isReview: true
tests/services/sellerDashboardComments.test.ts :: SellerCommentsService ReplyToFQAComment delegates to replyToComment
tests/services/walletReauthFlag.test.ts :: WALLET_REAUTH_ON_401 reauth flag exports boolean kill-switch flag value
tests/services/wishlist.test.ts :: Wishlist Service addToWishlist posts product_id payload to /checklist endpoint
tests/services/wishlist.test.ts :: Wishlist Service addToWishlist throws error when API returns success: false
tests/services/wishlist.test.ts :: Wishlist Service getWishlist requests paginated wishlist items
tests/services/wishlist.test.ts :: Wishlist Service isInWishlist returns false when is_exist field is false
tests/services/wishlist.test.ts :: Wishlist Service isInWishlist returns true when is_exist field is true
tests/services/wishlist.test.ts :: Wishlist Service removeFromWishlist sends DELETE request to /checklist/:productId endpoint
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
tests/store/cartReducer.test.ts :: Cart store reducer actions addProductToCart appends new item to localCart state
tests/store/cartReducer.test.ts :: Cart store reducer actions deleteAddress removes target address by id
tests/store/cartReducer.test.ts :: Cart store reducer actions setAddressList updates addressLists and sets orderLoading false
tests/store/cartReducer.test.ts :: Cart store reducer actions setDefaultAddress updates is_default flag correctly across address list
tests/store/cartReducer.test.ts :: Cart store reducer actions updateProductQuantityInCart updates the target item quantity
tests/store/cartReducer.test.ts :: coupon and discount applying a coupon keeps the payment method the shopper already chose
tests/store/cartReducer.test.ts :: coupon and discount the order-done reset clears the coupon, the payment and the discount together
tests/store/cartReducer.test.ts :: initAddressForm — the blank address form clears every region field
tests/store/cartReducer.test.ts :: initAddressForm — the blank address form drops the id of the address that was being edited
tests/store/cartReducer.test.ts :: initAddressForm — the blank address form keeps the contact fields present and empty
tests/store/cartReducer.test.ts :: initAddressForm — the blank address form takes the country from the URL the shopper is on
tests/store/cartReducer.test.ts :: setDefaultAddress — an id that is not in the list clears every default when the id belongs to no address in the list
tests/store/cartReducer.test.ts :: startUpdateAddress — opening a saved address in the form builds the region line the form shows from the saved parts
tests/store/cartReducer.test.ts :: startUpdateAddress — opening a saved address in the form copies the saved contact name out of contact_info.name
tests/store/cartReducer.test.ts :: startUpdateAddress — opening a saved address in the form keeps the id, so saving updates instead of creating a second address
tests/store/cartReducer.test.ts :: startUpdateAddress — opening a saved address in the form loses the contact name when the saved address carries contact_person_name and no name
tests/store/cartReducer.test.ts :: startUpdateAddress — opening a saved address in the form overwrites the saved country with the country of the URL
tests/store/cartReducer.test.ts :: the money the payment screen writes setCodUser overwrites the wallet balance, because both write the same field
tests/store/cartReducer.test.ts :: the money the payment screen writes setCodUser puts the cash total on the balance, and 0 when there is no total
tests/store/cartReducer.test.ts :: the money the payment screen writes setCreditUser puts the cash total on the credit field, and 0 when there is no total
tests/store/cartReducer.test.ts :: the money the payment screen writes setCryptoUser puts the cash total on the crypto field, and 0 when there is no total
tests/store/cartReducer.test.ts :: the money the payment screen writes setWalletBalance copies the wallet balance across, and falls back to 0 with no wallet
tests/store/cartReducer.test.ts :: the money the payment screen writes setWalletUser falls back to a zero balance when the wallet backend sends none
tests/store/cartReducer.test.ts :: the money the payment screen writes setWalletUser keeps the other fields the wallet backend sent
tests/store/cartReducer.test.ts :: updateAddress — saving an edit back into the list does not change which address is the default one
tests/store/cartReducer.test.ts :: updateAddress — saving an edit back into the list keeps the order of the address list
tests/store/cartReducer.test.ts :: updateAddress — saving an edit back into the list replaces only the edited address
tests/store/commentsReducer.test.ts :: Comments store reducer actions appendFaqComment prepends new FAQ question ID to appendedFaqIds map
tests/store/commentsReducer.test.ts :: Comments store reducer actions patchCommentEntity updates specific fields of a comment entity
tests/store/commentsReducer.test.ts :: Comments store reducer actions removeCommentEntity marks comment ID as deleted in deletedCommentIds map
tests/store/commentsReducer.test.ts :: Comments store reducer actions upsertComments merges new comment list into commentEntities map
tests/store/detailsReducer.test.ts :: Details store reducer actions setActiveColorDetails updates activeColor in product state
tests/store/detailsReducer.test.ts :: Details store reducer actions setShareLoading updates shareLoading flag
tests/store/detailsReducer.test.ts :: Details store reducer actions setSharesCount updates total shares count
tests/store/detailsReducer.test.ts :: Details store reducer actions storeProduct stores product and initializes activeColor from sync_color_images
tests/store/homepageReducer.test.ts :: Homepage store reducer actions setActiveRoute updates current active route string
tests/store/homepageReducer.test.ts :: Homepage store reducer actions setAppCountry updates application active country
tests/store/homepageReducer.test.ts :: Homepage store reducer actions setAppLanguage updates application active language
tests/store/homepageReducer.test.ts :: Homepage store reducer actions setCountries populates country selection list
tests/store/homepageReducer.test.ts :: Homepage store reducer actions setCurrency sets active display currency
tests/store/listingReducer.test.ts :: Listing store reducer actions resetListingFilter resets pagination offset to 1 and isReachEnd to false
tests/store/listingReducer.test.ts :: Listing store reducer actions setListingSearchLoading & setSearchExpanded update search UI state
tests/store/listingReducer.test.ts :: Listing store reducer actions setLoadingProducts updates listing_loading flag
tests/store/listingReducer.test.ts :: Listing store reducer actions setShowedFilter updates active filter tab name
tests/store/luckReducer.test.ts :: Luck store reducer actions expireLuck marks timer expired and records redemption
tests/store/luckReducer.test.ts :: Luck store reducer actions pauseLuck pauses running countdown
tests/store/luckReducer.test.ts :: Luck store reducer actions resumeLuck resumes paused countdown with fresh deadline
tests/store/luckReducer.test.ts :: Luck store reducer actions startLuck initializes timer for product
tests/store/searchReducer.test.ts :: Search store reducer actions setSearchBrand toggles brand selection correctly
tests/store/searchReducer.test.ts :: Search store reducer actions setSearchCategory toggles category selection (adds when missing, removes when present)
tests/store/searchReducer.test.ts :: Search store reducer actions setSearchPrice sets min_price and max_price
tests/store/searchReducer.test.ts :: Search store reducer actions setSearchResults replaces searchResults when replace parameter is true
tests/utils/UploadUtils.test.ts :: UploadUtils GetTicket function calls /api/ticket with folder, story, and count payload and returns ticket string
tests/utils/UploadUtils.test.ts :: UploadUtils GetTicket function throws error when API returns success: false
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
tests/utils/cookieManager.test.ts :: reading a cookie on the server re-throws the framework's prerender bail-out instead of swallowing it
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns a plain string as it was stored
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns nothing for a cookie that is not there
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns nothing for a cookie that is present but empty
tests/utils/cookieManager.test.ts :: reading a cookie on the server returns nothing when there is no request to read from
tests/utils/cookieManager.test.ts :: reading a cookie on the server undoes the encoding a stored value was written with
tests/utils/countryData.test.ts :: countryData utility falls back gracefully when given invalid country code
tests/utils/countryData.test.ts :: countryData utility returns empty string when iso2 code is undefined or empty
tests/utils/countryData.test.ts :: countryData utility returns localized country name for valid ISO2 codes in English
tests/utils/countryData.test.ts :: countryData utility returns localized country name in target language
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
tests/utils/fcmTopicTracker.test.ts :: fcmTopicTracker utility tracks, deletes, and retrieves FCM subscribed topics
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
tests/utils/fetchData.test.ts :: 401 recovery comments 401 refresh succeeds
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
tests/utils/fetchData.test.ts :: error handling and retries never sends a credential from the request body to the error reporter
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
tests/utils/fetchData.test.ts :: response status and message handling shows the refused field in words, not the raw JSON the backend sent
tests/utils/fetchData.test.ts :: response status and message handling throws and reports a non-OK response
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal accepts a plain string value as well as a list
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal ignores a JSON array, which carries no field names
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal ignores a value that is not a string at all
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal ignores an object whose values hold no text
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal keeps every refused field, not only the first
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal keeps every sentence a single field carries
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal leaves an ordinary error message alone
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal leaves text that only looks like JSON alone
tests/utils/fieldErrors.test.ts :: reading a field-by-field refusal unpacks the JSON object the backend puts inside `message`
tests/utils/fieldErrors.test.ts :: writing the line the shopper reads answers null for an ordinary error, so the caller keeps its own message
tests/utils/fieldErrors.test.ts :: writing the line the shopper reads gives every profile field its own known label
tests/utils/fieldErrors.test.ts :: writing the line the shopper reads puts the field label in front of the backend's own sentence
tests/utils/fieldErrors.test.ts :: writing the line the shopper reads shows the sentence with no label when the field is not one it knows
tests/utils/fieldErrors.test.ts :: writing the line the shopper reads writes one line per refused field
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) accepts a number given as a numeric value
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) adds the international prefix when the number is given without one
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) falls back to +<digits> when the dial code is not recognised
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) formats a Lebanese number in E.123 groups
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) formats a Syrian number in E.123 groups
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) formats a Turkish number in E.123 groups
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) formats an Emirati number in E.123 groups
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) formats an Iraqi number in E.123 groups
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) formats four digits, so short junk comes back looking like a number
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) groups a known country that has no grouping of its own in threes
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) keeps only the leading plus and drops one typed in the middle
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) leaves a leading national zero in place, matching the current behaviour
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) returns an empty string for an empty value
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) returns an empty string for fewer than four digits
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) returns the dial code alone when there is nothing after it
tests/utils/formatPhone.test.ts :: formatting a phone number for display (formatPhoneInternational) strips formatting characters and re-groups the digits
tests/utils/functions.test.ts :: utils/functions.tsx module RoundPrice formats large numbers with K or M suffix
tests/utils/functions.test.ts :: utils/functions.tsx module RoundPrice rounds price with rate and decimal points
tests/utils/functions.test.ts :: utils/functions.tsx module SSRDetect returns true in jsdom environment
tests/utils/functions.test.ts :: utils/functions.tsx module _isStoreLastJson returns boolean according to env variable
tests/utils/functions.test.ts :: utils/functions.tsx module getConfiguredImage handles image object with file_path
tests/utils/functions.test.ts :: utils/functions.tsx module getConfiguredImage replaces /upload with Cloudinary quality/format parameters on string URL
tests/utils/functions.test.ts :: utils/functions.tsx module getConfiguredImage returns empty string for invalid image src
tests/utils/functions.test.ts :: utils/functions.tsx module getUserChat & getUserStories getUserChat returns state userChat or empty object
tests/utils/functions.test.ts :: utils/functions.tsx module getUserChat & getUserStories getUserStories returns store state or cookie fallback
tests/utils/functions.test.ts :: utils/functions.tsx module onClickSearchHistory stores new search value into localStorage search-history without duplicates
tests/utils/functions.test.ts :: utils/functions.tsx module translateFunction returns key directly when language is English or undefined
tests/utils/imageFallback.test.ts :: the cost of a failure makes no request and sends no report when many images fail at once (AC-13)
tests/utils/imageFallback.test.ts :: the cost of a failure needs no network request and cannot itself fail (AC-6)
tests/utils/imageFallback.test.ts :: the fallback leaves everything else alone leaves a failing script or media source alone (F-4)
tests/utils/imageFallback.test.ts :: the fallback leaves everything else alone leaves a local app file alone when it fails (AC-4)
tests/utils/imageFallback.test.ts :: the fallback leaves everything else alone leaves a working image untouched (AC-3)
tests/utils/imageFallback.test.ts :: the fallback leaves everything else alone leaves an image with no source alone when it fails (AC-5)
tests/utils/imageFallback.test.ts :: the fallback replaces a failed remote image covers an image added to the page after the listener was installed (AC-8)
tests/utils/imageFallback.test.ts :: the fallback replaces a failed remote image swaps a failed remote image to the placeholder (AC-1)
tests/utils/imageFallback.test.ts :: the fallback replaces a failed remote image writes nothing on the element but src and the marker (AC-2)
tests/utils/imageFallback.test.ts :: the per-image handlers that were removed keeps the handler on the local country flag, which the fallback cannot cover (AC-4)
tests/utils/imageFallback.test.ts :: the per-image handlers that were removed no longer handles its own image failure: components/Chat/components/SearchResult.tsx (AC-10)
tests/utils/imageFallback.test.ts :: the per-image handlers that were removed no longer handles its own image failure: components/products/ShareAvatar.tsx (AC-10)
tests/utils/imageFallback.test.ts :: the per-image handlers that were removed no longer handles its own image failure: components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx (AC-10)
tests/utils/imageFallback.test.ts :: the placeholder cannot loop, and recovers keeps the marker when the placeholder itself loads (F-1)
tests/utils/imageFallback.test.ts :: the placeholder cannot loop, and recovers never re-triggers on the placeholder, and swaps again if the failing source returns (AC-11)
tests/utils/imageFallback.test.ts :: the placeholder cannot loop, and recovers removes the marker when a working source loads on the same element (AC-3)
tests/utils/imageFallback.test.ts :: the placeholder survives the framework taking over keeps the placeholder through hydration (AC-11, F-3)
tests/utils/imageFallback.test.ts :: the script that is inlined into the page cannot close its own script element (F-8)
tests/utils/imageFallback.test.ts :: the script that is inlined into the page escapes < inside the values it interpolates, and only there (F-8)
tests/utils/imageFallback.test.ts :: the script that is inlined into the page installs a working listener when it is evaluated (F-2)
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
tests/utils/locale.test.ts :: isSupportedLocaleSegment accepts a country the backend could add tomorrow
tests/utils/locale.test.ts :: isSupportedLocaleSegment accepts gb-en, a locale the app serves today
tests/utils/locale.test.ts :: isSupportedLocaleSegment accepts iq-ku, a locale the app serves today
tests/utils/locale.test.ts :: isSupportedLocaleSegment accepts lb-tr, a locale the app serves today
tests/utils/locale.test.ts :: isSupportedLocaleSegment accepts sy-en, a locale the app serves today
tests/utils/locale.test.ts :: isSupportedLocaleSegment accepts tr-ar, a locale the app serves today
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses  (an empty string)
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses a language the app has no translations for
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses a segment carrying attacker text
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses null (null)
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the malformed segment SY-EN
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the malformed segment s-en
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the malformed segment sy-
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the malformed segment sy-en-extra
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the malformed segment sy_en
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the malformed segment syria-en
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses the unknown locale that reaches the segment past the proxy
tests/utils/locale.test.ts :: isSupportedLocaleSegment refuses undefined (undefined)
tests/utils/luck/redeemedScript.test.ts :: REDEEMED_LUCK_SCRIPT can never close the <script> element that carries it
tests/utils/luck/redeemedScript.test.ts :: REDEEMED_LUCK_SCRIPT hides a redeemed badge when it is run as the browser runs it
tests/utils/luck/redeemedScript.test.ts :: REDEEMED_LUCK_SCRIPT names the cookie it reads
tests/utils/luck/redeemedScript.test.ts :: REDEEMED_LUCK_SCRIPT parses as JavaScript
tests/utils/luck/redeemedScript.test.ts :: REDEEMED_LUCK_SCRIPT selects the same attribute the markup carries
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck hides nothing when the cookie is not readable
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck hides nothing when there is no cookie
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck hides the badge of a product this browser already redeemed
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck leaves a badge the shopper has not redeemed alone
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck matches a numeric id against a string id
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck reports how many badges it hid
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck survives a cookie that holds something other than a list
tests/utils/luck/redeemedScript.test.ts :: hideRedeemedLuck takes the badge out of the layout, not only out of the accessibility tree
tests/utils/luckIndex.test.ts :: luck utility functions computeSecondsLeft computes active countdown remaining seconds against now
tests/utils/luckIndex.test.ts :: luck utility functions computeSecondsLeft returns 0 for expired timers
tests/utils/luckIndex.test.ts :: luck utility functions computeSecondsLeft returns DEFAULT_LUCK_SECONDS for null or undefined timers
tests/utils/luckIndex.test.ts :: luck utility functions computeSecondsLeft returns pausedRemaining when timer is paused
tests/utils/luckIndex.test.ts :: luck utility functions isLuckActive is active for a luck product the shopper has not redeemed
tests/utils/luckIndex.test.ts :: luck utility functions isLuckActive is never active for a product that carries no luck offer
tests/utils/luckIndex.test.ts :: luck utility functions isLuckActive is not active once that product has been redeemed
tests/utils/luckIndex.test.ts :: luck utility functions isLuckActive matches a redeemed id written as a number against a string id
tests/utils/luckIndex.test.ts :: luck utility functions isLuckActive stays active when a different product was the one redeemed
tests/utils/luckIndex.test.ts :: luck utility functions readTimer & writeTimer persists and reads product luck timer state in localStorage
tests/utils/normalizeListingProduct.test.ts :: normalizeListingProduct utility does not mark a luck product with no luck price
tests/utils/normalizeListingProduct.test.ts :: normalizeListingProduct utility handles empty or null inputs gracefully without crashing
tests/utils/normalizeListingProduct.test.ts :: normalizeListingProduct utility marks a luck product as luck, whoever is looking
tests/utils/normalizeListingProduct.test.ts :: normalizeListingProduct utility normalizes a basic product with standard images when sync_color_images is absent
tests/utils/normalizeListingProduct.test.ts :: normalizeListingProduct utility omits standard images property when sync_color_images exists and is non-empty
tests/utils/orderFunnel.test.ts :: orderFunnel utilities resolveVerifyFlowSource defaults to 'checkout' for boolean true, null, or undefined
tests/utils/orderFunnel.test.ts :: orderFunnel utilities resolveVerifyFlowSource maps 'open Story' to 'story'
tests/utils/orderFunnel.test.ts :: orderFunnel utilities resolveVerifyFlowSource maps 'open chat' to 'chat'
tests/utils/orderFunnel.test.ts :: orderFunnel utilities resolveVerifyFlowSource maps 'seller' to 'seller'
tests/utils/orderFunnel.test.ts :: orderFunnel utilities resolveVerifyFlowSource maps custom string markers directly
tests/utils/orderFunnel.test.ts :: orderFunnel utilities startOrderAttempt & endOrderAttempt ends order attempt safely without throwing
tests/utils/orderFunnel.test.ts :: orderFunnel utilities startOrderAttempt & endOrderAttempt mints an order attempt ID string starting with oa_ or UUID format
tests/utils/orderFunnel.test.ts :: orderFunnel utilities trackOrder & trackOrderMgmt calls posthogCapture for order management events
tests/utils/orderFunnel.test.ts :: orderFunnel utilities trackOrder & trackOrderMgmt calls posthogCapture with event name and merged properties
tests/utils/orderReportOptions.test.ts :: ORDER_REPORT_POINTS metadata array contains all 4 canonical report categories
tests/utils/orderReportOptions.test.ts :: ORDER_REPORT_POINTS metadata array every report point has valid non-empty options array
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
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) accepts a normal international number
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) accepts a number given as a numeric value
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) accepts a number with spaces, dashes and a plus
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) holds the 10-to-15-digit range at both ends
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) rejects a number made only of formatting characters
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) rejects a number that is too long
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) rejects a number that is too short
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) rejects a string with no digits
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) rejects an empty value
tests/utils/phone.test.ts :: deciding whether a phone number looks verified (isValidPhone) rejects the sentinel values people type before a country code
tests/utils/popupHistory.test.ts :: popupHistory utility manages backClosing flag state
tests/utils/popupHistory.test.ts :: popupHistory utility manages selfConsuming flag state and consumption
tests/utils/sanitizeHtml.test.ts :: sanitizeHtml security utility preserves safe HTML markup such as bold, italics, paragraphs, and lists
tests/utils/sanitizeHtml.test.ts :: sanitizeHtml security utility returns empty string for null, undefined, or empty input
tests/utils/sanitizeHtml.test.ts :: sanitizeHtml security utility strips javascript: pseudo-protocol URLs in href attributes
tests/utils/sanitizeHtml.test.ts :: sanitizeHtml security utility strips script tags and inline event handlers like onerror and onload
tests/utils/searchPathRedirect.test.ts :: buildSearchRedirectTarget utility handles URL encoded search values
tests/utils/searchPathRedirect.test.ts :: buildSearchRedirectTarget utility migrates legacy search path pair to ?search= query parameter
tests/utils/searchPathRedirect.test.ts :: buildSearchRedirectTarget utility overwrites existing search query param with the path search value
tests/utils/searchPathRedirect.test.ts :: buildSearchRedirectTarget utility returns null when 'search' segment is the last segment without a value
tests/utils/searchPathRedirect.test.ts :: buildSearchRedirectTarget utility returns null when no search segment is in path parameters
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
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) carries the visitor's own language and country
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) does nothing when there is no stored credential for it
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) refuses to store a reply carrying half a pair
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) reports a dropped connection as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) reports a reply it cannot read as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) reports a server error as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'comments' session, the rest of the ladder (AC-18 to AC-23) says so loudly when the rotated pair could not be stored
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) carries the visitor's own language and country
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) does nothing when there is no stored credential for it
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) refuses to store a reply carrying half a pair
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) reports a dropped connection as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) reports a reply it cannot read as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) reports a server error as unavailable, and says so
tests/utils/server/authRefresh.test.ts :: the 'stories' session, the rest of the ladder (AC-18 to AC-23) says so loudly when the rotated pair could not be stored
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) does not exchange a chat credential while signing out
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) does not exchange a comments credential while signing out
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) does not exchange a stories credential while signing out
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) exchanges a chat credential and rotates the chat pair only
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) exchanges a comments credential and rotates the comments pair only
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) exchanges a stories credential and rotates the stories pair only
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) keeps a rejected chat credential in the jar
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) keeps a rejected comments credential in the jar
tests/utils/server/authRefresh.test.ts :: the chat, stories and comments sessions (AC-18 to AC-22) keeps a rejected stories credential in the jar
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
tests/utils/server/authRefresh.test.ts :: when there is no request to read at all reports the comments session as unavailable rather than throwing
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
tests/utils/server/helpers.test.ts :: showing a price (RoundPrice) shows nothing rather than "NaNM" when the price cannot be read
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
tests/utils/server/otpAllowlist.test.ts :: when the list changes follows the new value rather than the first one it read
tests/utils/server/otpAllowlist.test.ts :: when the list does not name a number does not recognise a longer number containing it
tests/utils/server/otpAllowlist.test.ts :: when the list does not name a number does not recognise a number that is simply not in it
tests/utils/server/otpAllowlist.test.ts :: when the list does not name a number does not recognise a prefix of it
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it exactly as configured
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it one entry among several
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it punctuated in the list
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it punctuated in the number
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it with a leading plus in the list
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it with a leading plus in the number
tests/utils/server/otpAllowlist.test.ts :: when the list names a number recognises it with untidy separators
tests/utils/server/otpAllowlist.test.ts :: when there is no list exempts nobody — empty
tests/utils/server/otpAllowlist.test.ts :: when there is no list exempts nobody — only punctuation
tests/utils/server/otpAllowlist.test.ts :: when there is no list exempts nobody — only separators
tests/utils/server/otpAllowlist.test.ts :: when there is no list exempts nobody — unset
tests/utils/server/otpAllowlist.test.ts :: when there is no list says no to an empty number, whatever the list holds
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
