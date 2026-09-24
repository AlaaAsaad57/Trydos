# Test summary — Seller dashboard — 22 September 2026

What the tests cover for the seller dashboard: orders, locations, the gallery,
bulk upload, the product editor, the boutique editor, shop info, permissions and
the shared screen parts.

The Stories section and the Comments section are covered in their own files
(`TEST-SUMMARY-STORIES-2026-09-22.md`, `TEST-SUMMARY-COMMENTS-2026-09-22.md`) and
are not counted here.

| | |
|---|---|
| Unit checks | 380 |
| Browser cases | 12 |
| Unit result | ✅ all 380 passing (run 22 Sep 2026) |
| Browser result | not run in this session — this file says what the suite covers |

---

## Browser cases (real staging)

| ID | Case | Spec |
|----|------|------|
| SD-01 | A seller reaches their own dashboard from the settings screen | `sellerDashboard.live.spec.ts:205` |
| SD-02 | Every section tile opens its own section | `sellerDashboard.live.spec.ts:246` |
| SD-03 | The slide-out menu opens a section, and back walks out again | `sellerDashboard.live.spec.ts:292` |
| SD-04 | The locations list shows the rows the backend holds | `sellerDashboard.live.spec.ts:323` |
| SD-05 | The status filter narrows the list to what the backend returns | `sellerDashboard.live.spec.ts:384` |
| SD-06 | A location created through the form exists on the backend | `sellerDashboard.live.spec.ts:456` |
| SD-07 | An edit made through the form reaches the backend | `sellerDashboard.live.spec.ts:526` |
| SD-08 | Deactivate then Activate, and the backend holds each status | `sellerDashboard.live.spec.ts:583` |
| SD-09 | The location form refuses a bad value without asking any backend | `sellerDashboard.live.spec.ts:656` |
| SD-10 | The shop-info form is filled from the shop's own record | `sellerDashboard.live.spec.ts:731` |
| SD-11 | Shop info refuses an empty and a non-numeric contact | `sellerDashboard.live.spec.ts:772` |
| SD-12 | A contact and address change reaches the backend, and is put back | `sellerDashboard.live.spec.ts:824` |

SD-12 is red on purpose. The core backend drops the shop's picture on a shop-info
save, so the case names that backend and stays red.

---

## Unit checks

A check that is repeated over several values (every unit, every field, every
way a number can be written) is listed once here, but counted once per value in
the number above.

### Orders

- The shop backend is never asked without the order permission.
- The missing permission is named.
- Page 1 is asked for with no status filter to begin with.
- The backend is re-asked with the status of the tab that was picked.
- The In Progress tab asks for in-progress orders.
- Says when the shop has no orders in this tab.
- Shows the shop backend's own reason for refusing.
- Loads the list again on Retry.
- Opens the detail of the order that was clicked.
- Shows the item with its quantity and variant.
- Counts an order by the quantity ordered, not the number of rows.
- Goes back to the list.
- Offers Confirm and Cancel on an item nobody has touched.
- Confirms the item the seller clicked.
- Moves the item on to packing once it is confirmed.
- Packs an item that is already confirmed.
- Cancels the item's whole quantity.
- Takes a fully cancelled item off the order.
- Says why the shop backend refused to confirm.
- Offers no actions on an order the shop already cancelled.
- Reads product details that arrived as text rather than as data.
- Falls back to the product id when nothing names the item.
- Shows where the item has got to.

### Locations

- Shows each location's name and address.
- Shows the location's country.
- Marks an inactive location as inactive.
- Asks for every status when no filter is picked.
- Re-asks the backend with the status the seller picked.
- Says the shop has no locations yet.
- Offers to add the first one when the seller may create.
- Offers no add action when the seller may not create.
- Shows the backend's own message rather than a generic one.
- Lets the seller try the same page again.
- Sends the opposite of the status the row is on.
- Takes the new status from the backend's answer, not from the guess.
- Confirms the change to the seller.
- Shows why a change was refused and leaves the row as it was.
- Never asks the backend without the read permission.
- Hides Add Location without the create permission.
- Hides Edit without the update permission.
- Hides Deactivate without the change-status permission.
- Opens the form empty from Add Location.
- Opens the form on the row that was clicked.
- Keeps the form closed until it is asked for.
- Shows no page controls for a single page.
- Asks for the next page when the seller clicks Next.
- Asks the backend as soon as the read permission arrives late.
- Draws the list it was waiting for, instead of the loading placeholder.

### Gallery

- Asks the shop backend for the first page at the size it draws.
- Shows each image with its filename.
- Says when the shop has no images yet.
- Shows the backend's own reason when the page did not load.
- Lets the seller dismiss the error banner.
- Asks for the next page when the seller clicks Next.
- Shows the chosen files before anything is sent.
- Ignores a chosen file that is not an image.
- Sends the chosen files to the shop backend.
- Goes back to the first page so the new images are on screen.
- Keeps the panel open and says why an upload was refused.
- Drops the selection when the seller cancels.
- Asks before deleting an image.
- Deletes the image the seller picked.
- Says why a delete was refused.
- Steps back a page when the last image on it is deleted.
- Counts what is selected.
- Will not delete when nothing is selected.
- Sends every selected id in one request.
- Leaves select mode after a finished bulk delete.
- Shows no drop zone without the upload permission.
- Shows no select toolbar or bin without the delete permission.
- Still lets a seller with neither permission look at the gallery.

### Bulk upload by spreadsheet

- Lists the categories the shop backend offers.
- Falls back to the id when a category has no name.
- Shows why the category list did not load, and offers to try again.
- The template cannot be downloaded before a category is picked.
- Asks the backend for the template of the picked category.
- Says why the template could not be prepared.
- Accepts a spreadsheet and shows its name.
- Refuses a dropped file that is not a spreadsheet.
- Keeps Upload blocked until a file is chosen.
- Lets the seller drop the chosen file again.
- Sends the file to the media server, then its key to the shop backend.
- Confirms a finished upload and clears the chosen file.
- Reloads the uploaded-files table after a finished upload.
- Names the media server when it is the one that refused.
- Names the shop backend when the sheet was stored but not processed.
- Says when nothing has been uploaded yet.
- Reads the rows out of the paged answer's inner list.
- Shows each sheet's processing status.
- Offers Notes only for a sheet that has notes.
- Shows the backend's notes for the sheet that was clicked.
- Shows why the table did not load without hiding the upload form.
- Loads the table again on Refresh.

### The product editor — what a seller may type

- A weight is required for every unit.
- A zero weight is refused for every unit.
- A negative weight is refused for every unit.
- A weight that is not a number is refused.
- A valid weight is accepted for every unit.
- A luck price above the unit price is refused when there is no discount price.
- A luck price above the discount price is refused when a discount price is set.
- A luck price equal to the unit price is accepted.
- A luck price equal to the discount price is accepted.
- A luck price below both prices is accepted.
- An empty luck price is left alone.
- The luck price is not checked for a seller whose prices are locked.
- A variant luck price above the variant unit price is refused.
- A variant luck price above the variant discount price is refused.
- An empty variant price is compared with the product unit price.
- A variant luck price equal to the variant price is accepted.
- A variant luck price below the variant discount price is accepted.
- The variant luck price is not checked when prices are locked.
- Quotes, backticks and curly quotes are stripped from the seller product id.
- All three quote types are stripped at once.
- Letters, digits, hyphens and underscores are kept.
- Arabic, Turkish and Kurdish letters are kept.
- Spaces, slashes, dots, commas, brackets and percent signs are stripped.
- A value that is empty, missing or null becomes an empty id, not an error.

### The product editor — when the backend refuses a save

- A barcode already in use marks the barcode field.
- The field carries the backend's own sentence, word for word.
- A field name the code has never seen still reaches the seller.
- A problem naming an item inside a list marks that list's own field.
- A colour/size row and a translation row are shown as text.
- A code cannot become a key on its own.
- A field problem and a non-field problem in one refusal both survive.
- A refusal that is not a validation refusal marks nothing and says nothing.
- Every coded entry lands in exactly one place, and a codeless one is counted.
- The four image failures with no code still mark their own inputs.
- An entry matching none of the four phrases marks no field at all.
- The same refusal behaves the same for an add and for an edit.
- Two problems naming one field leave one readable message.
- An entry naming a field with an empty message marks nothing.
- A validation refusal with no detail yields empty results to fall back on.
- A failure carrying no refusal body behaves as it does today.
- With prices locked, a refusal naming a hidden price input is shown as text.
- Every input on the form binds a refusal that names it.
- The similar-words field, which has no message slot, is not bound.
- The summary line claims highlighted fields only when a field was marked.
- It says what happened instead when nothing could be put on a field.
- It falls back to the caller's wording when the refusal named nothing usable.
- Fixing a field clears only that field's message.
- The form's own validation messages are never touched.
- The same record is returned when nothing was cleared.
- The seller is moved to the field highest in the page, not the first key.
- An anchor whose field is not failing is ignored.
- The failing field is scrolled into view.
- Nothing is scrolled when nothing is failing.

### The product editor — other parts

- A location is shown as its name and address.
- A colour is found in the lookups whatever the letter case.
- An unknown colour code is shown as it was typed.
- Descriptor options stored as text are read back as a list.
- A list of options is returned unchanged.
- Bad option input gives an empty list.
- A descriptor with no icon gives an empty address.
- A full web address for an icon is kept as it is.
- Numeric descriptors take an input.
- String-choice descriptors with real options take an input.
- Descriptor values are flattened and turned into a save payload.
- A blank value and a missing value count as the same.
- Seller product ids are de-duplicated and cleaned.
- A new product form starts clean, with the unit set to pieces.
- Colour and size names are cleaned into safe keys.
- A filename is taken from the end of an image address.
- Every colour-and-size pair is generated.
- Variant rows are seeded with the default price, discount and luck price.
- A read-only seller still sees the saved sub-category and attribute value.
- The category-lookups endpoint is not called at all while the form is read-only.
- The branch lookups load when a seller with the update permission clicks Edit.

### The boutique editor

- The plain language-list shape is read.
- The other key names the backends use for a code are accepted.
- A language is marked right-to-left from the API flag.
- A known right-to-left code is marked even when the API says nothing.
- A left-to-right language is left alone.
- Entries with no code are dropped, and the rest de-duplicated in order.
- The built-in list is used when the answer is not a list.
- The built-in list is used when every entry is unusable.
- A file path keeps only the file itself, never the folder.
- A query string is dropped from a filename.
- A bare filename is left untouched.
- Empty input gives an empty filename.
- The media server's own answer shape is read.
- Objects carrying the path under url, path or file name are read.
- A single-address answer is read.
- An answer carrying no files gives an empty list.
- A new boutique form gets one blank translation per language.
- A new boutique starts inactive, so a half-written one is not live.
- A new boutique starts on the default availability.
- A translation is matched whatever case the backend used for the code.
- The translation id is kept, so saving updates instead of duplicating.
- The icon is split into a name to save and an address to show.
- Banners are ordered by the stored sequence, not by list position.
- A language with no stored translation gets a blank one.
- The restricted countries are read into the country picker.
- The availability the boutique was saved with is kept.
- An unknown stored availability falls back to the default.
- An empty answer does not throw.
- Per-language content is sent under the update key on update.
- Per-language content is sent under the create key on create.
- The update key is used when no mode is given.
- The global data is taken from the English translation.
- The picked availability is carried into the global data.
- Banners are numbered from 1, in the order they are shown.
- A language never filled in and never stored is dropped.
- A stored language whose name was cleared is kept, so the backend updates it.
- Dangerous HTML is stripped out of both descriptions.
- A form where every language is complete passes.
- A missing name, description, bio or icon is reported on its own language.
- A language with no banner is reported.
- Every missing language is reported, not just the first.
- An ordinary image is accepted as an icon.
- A file that is not an image is blocked as an icon.
- An icon over the size limit is blocked, and one exactly at it is accepted.
- The recommended 1280 x 750 banner is accepted with no warning.
- A banner file that is not an image is blocked.
- A banner over the size limit is blocked.
- A banner that is too narrow, too square or too wide warns but is not blocked.
- A picture whose size cannot be read is allowed.

### Shop info

- The shop backend is asked for the shop it was given.
- The shop's currency is stored for the rest of the dashboard.
- The shop id it resolved is recorded, so another shop is fetched fresh.
- The answer is marked as available.
- New products are restricted when the shop needs approval.
- Nothing is restricted when the backend says nothing about approval.
- The approval flag is read even when the backend sends it as text.
- The currency is left empty when the answer carries none.
- A refusal still records a settled outcome, so the editor does not wait forever.
- A thrown request still records a settled outcome.
- A failed call does not restrict new products.
- A failure is reported as not a permission problem.
- The shop-info endpoint is never called without the read permission.
- It is recorded that the permission, not the backend, is missing.
- The backend is still called when the permission list itself did not load.
- The shop is not fetched again when a record for it already exists.
- A failed record is not retried on its own.
- A shop is fetched when the stored record belongs to a different shop.
- A picture the shop does not have is left out of the save, not sent as empty.
- A picture the shop does have is sent, so the save does not wipe it.

### Lists, permissions and arrivals

- A product created while the list already had products is shown.
- An edited product's new values are shown after returning.
- The core backend is asked once per arrival, not once per tab switch.
- The shop is never said to have no products before the request comes back.
- The empty message is shown once the request has answered.
- A boutique created while the list already had boutiques is shown.
- An edited boutique's new values are shown after returning.
- A deleted boutique is dropped after returning.
- The dashboard waits rather than refusing while permissions are on the way.
- A section the seller really may not see is refused.
- A failed permission fetch is read as an error, not as a refusal.
- An error is shown, and a retry replaces it with the list.
- A failed arrival fetch is retried on the next arrival.
- One list finishing does not make another say it is empty.
- The shop list paints its placeholder, not an empty state, on first paint.
- The placeholder is replaced with the shops once they arrive.
- The core backend is asked for the seller's shops exactly once on mount.
- A permission group is named in words, not by its raw key.
- The group heading is translated into Arabic.
- The role the permissions call named is shown.
- The role is named in the page header instead of falling back to "Member".
- The Super Admin banner is shown without waiting for a role name.

### Moving around the dashboard, and the shared screen parts

- The forward loader is cleared as soon as the editor is on screen.
- Back is handled here when the seller came from this dashboard.
- The dashboard-shaped loader is asked for, with no scroll to the top.
- Back is left to the back bar on a direct landing.
- Back is left to the back bar when the seller came from somewhere else.
- A different seller's dashboard is not rewound.
- Every placeholder shape draws blocks and no spinner.
- Every placeholder is hidden from screen readers, inside a region marked busy.
- Every placeholder is built from the one shared block.
- The whole-dashboard placeholder keeps the page tall.
- The shop badge shows the first letter of each of the first two words.
- The initials are uppercased whatever the seller typed.
- The logo is shown instead of initials when the shop has one.
- An icon is shown when there is neither a name nor a logo.
- A dashboard button runs its action on a click.
- A dashboard button cannot be clicked while it is loading.
- A dashboard button hides its label while it is loading.
- Only the current option of a segmented control is marked as selected.
- A segmented control reports the value that was picked.
- Paging shows which page of how many the seller is on.
- Paging offers no Previous on the first page.
- Paging offers no Next on the last page.
- Paging offers neither direction while a page is still loading.
- Paging asks for the page in the direction that was clicked.
- A field shows its hint when there is no error.
- A field replaces the hint with the error, so only one line is read.
- The empty block shows its title, its note and its action.
- The error block shows the backend's own message.
- The error block offers Retry only when there is something to retry.
- The access-denied block names the missing permission instead of a retry.
- A status pill shows the word it was given.
- An inline alert shows the message for every tone.
- A section header shows the title and the count of rows.
- A section header shows no count when there is none to show.
- A section header shows a zero count rather than hiding it.
- A dashboard card renders what is put inside it.

### Becoming a seller

- Every field the backend caps at 10 characters is capped inline too.
- The shop address, which the backend does not cap, is not capped.
