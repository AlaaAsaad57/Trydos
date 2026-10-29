# Seller Shop — Tester Guide: Boutiques, Locations, Shop Info

For the person who writes the **automated browser tests** (Playwright,
`tests/e2e/`) for three sections of the seller dashboard:

1. **Boutiques** — the list, the "new boutique" page, and the boutique editor.
2. **Locations** — the shop's warehouses and pickup points.
3. **Shop Info** — the shop's name, contact, address, logo and banner.

**The code is the source of truth.** Every rule below comes from the code
files named in each section. Where the code leaves a decision to the backend,
this guide says "the backend decides" and does not guess the answer. If the
app and this guide disagree, the app wins — tell the team, and fix this file.

Read `CLAUDE.md` → "Testing — MANDATORY" before you write a case. Every
assertion needs a message, one check per step, and the message names the
backend when a step crosses one.

---

## 0. Before you start

### 0.1 Rules for every case

- **Open the app as `/sy-en/...`**, never `/gb-en/...`. `gb` opens the region
  modal over the page. The QA shop is seeded in `sy` too.
- **The QA seller holds every permission.** The live suite only sees "yes".
  To test a smaller role, fake the permissions answer
  (`/shop/auth/permissions`) the way `sellerDashboard.scripted.spec.ts`
  (SCRIPT-26) does, with `mockBackend` and `sellerWithPermissions`.
  - A faked role proves **the dashboard's own gating only**. The session behind
    it still holds every permission, so the backend will still accept the
    calls.
  - The server side does **not** see the fake. The layout
    (`[sellerId]/layout.tsx`) reads the real permission list on the server. So
    with a faked role, `ShopInfoLoader` may still call `GET /shop/info`.
- **Do not navigate during a token renewal.** Call `waitForRenewalSettled(page)`
  (`tests/e2e/harness/renewalGate.ts`) before any `goto` or reload on a
  signed-in page.
- **Judge the first answer that is not a 401.** The access token lives 60
  seconds, so a 401 followed by a good retry is normal.
- **Labels are English keys.** In `sy-en` you see the English text below. In
  `ar`, `tr` and `ku` the same keys are translated. Prefer `data-pw`
  selectors. Use text only where no `data-pw` exists.

### 0.2 How the calls look in the browser

Every call in these three sections goes through `utils/fetchData.ts` to the
same route, `POST/GET /api/proxy`. The real backend path is in request
headers:

| Header | Value |
|---|---|
| `x-proxy-url` | the backend path, for example `/shop/locations?status=1` |
| `x-proxy-method` | `GET`, `POST`, `PUT` or `DELETE` |
| `x-proxy-server` | the service token for `market-dashboard` |
| `x-seller-id` | the shop id from the URL |

- The response header `x-market-backend: gateway|core` names the backend that
  answered. Read it; do not guess. The `/shop/*` calls go to the **core**
  backend (service comment in `services/sellerDashboard/index.ts`).
- `fetchData` does **not** throw on a refused call. It returns
  `{ success: false, message, detailed_error, ... }`. The app checks
  `success`. So an HTTP 200 with `success: false` is still a failure.
- `fetchData` **retries a GET** up to 2 more times (after 1 s, then 2 s) on a
  network error or on status 429, 502, 503, 504. A mocked 502 on a GET shows
  the error state only after about 3 seconds. POST/PUT/DELETE are never
  retried.
- Calls **without** `noMessage: true` may also show a notification with the
  backend's own message (success or error). Do not assert on that
  notification. The calls that set `noMessage: true` are listed per endpoint
  below.
- To mock a call, match `x-proxy-url` by substring:
  `mockBackend(page, { "/shop/locations": {...} })` in
  `tests/e2e/actions/mock.ts`. Note: `"/shop/locations"` also matches
  `/shop/locations/lookups` and `/shop/locations/5/edit`. Use the longest
  path that is unique.

### 0.3 Media uploads (logo, banner, boutique icon)

Uploads do **not** go through `/api/proxy`. They go to the media server:

1. The app gets an upload ticket first (`GetTicket` in `utils/UploadUtils.ts`).
2. Then it posts the file to `${NEXT_PUBLIC_MEDIA_SERVER_BASE_URL}`:
   - one file → `POST /gated/upload` (fields `file`, `folder`), header
     `X-Upload-Ticket`. Success needs JSON with a `url`.
   - many files → `POST /gated/upload/bulk` (fields `folder`, `files`).

A media upload **cannot be undone**. On staging, upload only to rows the test
owns, or put the old value back at the end.

### 0.4 Helpers that already exist — reuse them

| File | What it gives you |
|---|---|
| `tests/e2e/actions/sellerDashboard.ts` | `gotoSellerDashboard`, `openTab`, `openTabFromMenu`, `offeredTabs`, `currentTab`, `pressDashboardBack`, `refuseIfSectionDenied` |
| `tests/e2e/actions/shopLocations.ts` | `openLocations`, `readLocations` / `readLocation` (direct backend reads), `openCreateLocationForm`, `openEditLocationForm`, `fillLocationForm`, `attemptLocationSave`, `saveLocationForm`, `toggleLocationStatus`, `deactivateLocationQuietly`, `newQaLocationName` (prefix `trydos-qa-`) |
| `tests/e2e/actions/shopInfo.ts` | `readShopInfo` (direct backend read), `openShopInfo`, `readShopInfoForm`, `fillShopInfo`, `attemptShopInfoSave`, `saveShopInfo`, `restoreShopInfoQuietly`, `bareMediaName` |
| `tests/e2e/actions/mock.ts` | `mockBackend`, `mockBackendSequence` |

There is **no helper for boutiques yet**. Add `tests/e2e/actions/boutiques.ts`
when you write the first boutique case, in the same style.

### 0.5 What is already covered

Browser cases in `tests/e2e/sellerDashboard.live.spec.ts`:

| Case | Covers |
|---|---|
| SD-02 / SD-03 | every tile and menu item opens its section |
| SD-04 | locations list = backend rows |
| SD-05 | status filter |
| SD-06 / SD-07 / SD-08 | create, edit, deactivate + activate a location |
| SD-09 | location form refuses bad values with no request |
| SD-10 | shop info form is filled from the backend record |
| SD-11 | shop info refuses an empty and a non-numeric contact |
| SD-12 | a contact + address change reaches the backend, then is put back |

`sellerDashboard.scripted.spec.ts` SCRIPT-26 covers a small role (no
boutiques, no locations, read-only shop info).

Unit tests already exist (Vitest) in:
`tests/components/SellerDashboard/locations/*`,
`tests/components/SellerDashboard/boutiqueEdit/*`,
`tests/components/SellerDashboard/ShopInfo.test.tsx`,
`tests/components/SellerDashboard/ShopInfoLoader.test.tsx`,
`tests/app/sellerProfile/sellerDashboard/boutiquePages.test.tsx`,
`tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx`.

**Boutiques have no browser case at all.** That is the biggest gap.

---

## 1. Permissions for these three sections

`SUPER_ADMIN` passes every check below. The dashboard checks are UX only —
the backend makes the real decision.

| Section | The tile / menu item shows when the user has… | Action rules |
|---|---|---|
| Boutiques | any of `READ_BUTIKS`, `CREATE_BUTIKS`, `UPDATE_BUTIKS`, `DELETE_BUTIKS`, `CHANGE_BOUTIQUE_STATUS` | "Add Boutique" link: `CREATE_BUTIKS`. Editor "Edit" button: `UPDATE_BUTIKS`. "Set active / Set inactive": `CHANGE_BOUTIQUE_STATUS`. Delete: **hidden for everyone** (see 2.6). |
| Locations | any of `READ_LOCATIONS`, `CREATE_LOCATION`, `UPDATE_LOCATION`, `CHANGE_LOCATION_STATUS` | List needs `READ_LOCATIONS`. "Add Location": `CREATE_LOCATION`. "Edit": `UPDATE_LOCATION`. "Activate / Deactivate": `CHANGE_LOCATION_STATUS`. |
| Shop Info | `READ_SHOP_INFO` | Without `UPDATE_SHOP_INFO` the form is read-only. |

Backend permission per endpoint, as written in the service comments
(`services/sellerDashboard/index.ts`):

| Endpoint | Permission (service comment) | `noMessage` |
|---|---|---|
| `GET /shop/boutiques` | — (no comment) | no |
| `GET /shop/boutiques/lookups` | `CREATE_BUTIKS` | no |
| `POST /shop/boutiques` | `CREATE_BUTIKS` | yes |
| `GET /shop/boutiques/{id}/edit` | `UPDATE_BUTIKS` | no |
| `POST /shop/boutiques/{id}/update` | `UPDATE_BUTIKS` | yes |
| `POST /shop/boutiques/{id}/change-status` | `CHANGE_BOUTIQUE_STATUS` | yes |
| `DELETE /shop/boutiques/{id}/delete` | `DELETE_BUTIKS` (not used by the UI now) | yes |
| `GET /languages` (server `market`, cached) | public | no |
| `GET /shop/locations` | `READ_LOCATIONS` | no |
| `GET /shop/locations/lookups` | `CREATE_LOCATION` | yes |
| `POST /shop/locations` | `CREATE_LOCATION` | yes |
| `GET /shop/locations/{id}/edit` | `READ_LOCATIONS` or `UPDATE_LOCATION` | yes |
| `POST /shop/locations/{id}/update` | `UPDATE_LOCATION` | yes |
| `POST /shop/locations/{id}/change-status` | `CHANGE_LOCATION_STATUS` | yes |
| `GET /shop/info` | `READ_SHOP_INFO` | no |
| `PUT /shop/info` | `UPDATE_SHOP_INFO` | no |

### 1.1 How to reach each section

| Section | Home tile `data-pw` | Side menu `data-pw` | URL |
|---|---|---|---|
| Boutiques | `seller-dashboard-tab-boutiques` | `seller-dashboard-menu-boutiques` | `/sy-en/sellerProfile/sellerDashboard/{sellerId}?tab=boutiques` |
| Locations | `seller-dashboard-tab-locations` | `seller-dashboard-menu-locations` | `...?tab=locations` |
| Shop Info | `seller-dashboard-tab-shopInfo` | `seller-dashboard-menu-shopInfo` | `...?tab=shopInfo` |

Boutique detail pages:

- New: `/sy-en/sellerProfile/sellerDashboard/{sellerId}/boutiques/new`
- Edit: `/sy-en/sellerProfile/sellerDashboard/{sellerId}/boutiques/{boutiqueId}`

A section without permission shows the shared Access Denied block:
`data-pw="dashboard-access-denied"`, title "Access Denied", plus a message.

### 1.2 Cases — permissions (all need a faked role)

**PERM-01 — A role with no boutique, location or shop-info permission sees none of the three tiles.**
- Setup: fake permissions = `["READ_PRODUCTS"]`.
- Expect: no `seller-dashboard-tab-boutiques`, `-locations`, `-shopInfo` on
  home, and no matching side-menu item. Check each tile by name.

**PERM-02 — Any one boutique permission is enough to show the Boutiques tile.**
- Run once per permission: `READ_BUTIKS`, `CREATE_BUTIKS`, `UPDATE_BUTIKS`,
  `DELETE_BUTIKS`, `CHANGE_BOUTIQUE_STATUS`.
- Expect: the tile is shown and the list opens (not Access Denied).

**PERM-03 — A location permission without `READ_LOCATIONS` shows the tile, but the section says Access Denied.**
- Setup: fake permissions = `["CREATE_LOCATION"]`.
- Expect: tile shown. After opening: `dashboard-access-denied` with message
  "You don't have permission to view locations". No `GET /shop/locations` is
  sent (`LocationsTab.load` returns early).

**PERM-04 — A direct link to a section the role may not open says Access Denied.**
- Setup: fake permissions = `["READ_PRODUCTS"]`. Open `?tab=boutiques`, then
  `?tab=shopInfo`.
- Expect: "You don't have permission to view boutiques" and
  "You don't have permission to view shop info".

**PERM-05 — `READ_SHOP_INFO` without `UPDATE_SHOP_INFO` makes the form read-only.** (SCRIPT-26 covers this — extend it, do not copy it.)
- Expect: "Read only" badge in the header; name, contact and address inputs
  are `disabled`; logo "Upload/Change" and "Upload Banner/Change Banner"
  buttons are `disabled`; no remove (X) buttons; no `shop-info-save-btn`.

**PERM-06 — `READ_BUTIKS` only: the "Add Boutique" link is not offered.**
- Expect: no "+ Add Boutique" link in the list header, and no
  "+ Add your first boutique" link in the empty state.

**PERM-07 — `READ_LOCATIONS` only: no Add, Edit or Activate/Deactivate.**
- Expect: no `locations-add-btn`, no `location-edit-btn`, no
  `location-toggle-btn`. The card has no action row at all.

**PERM-08 — `READ_LOCATIONS` + `CHANGE_LOCATION_STATUS`: toggle shown, Edit hidden.**

**PERM-09 — Shop-info server call is skipped without `READ_SHOP_INFO`.**
- This needs a **real** account with a small role (the server reads the real
  list — see 0.1). With the QA seller only, it cannot be proved in a browser.
- Expect: no `GET /shop/info` with this shop's `x-seller-id` during the
  dashboard load (`ShopInfoLoader` skips the call when the server says the
  permission is missing).
- If no such account exists, say plainly that this case is not covered. The
  unit test `ShopInfoLoader.test.tsx` covers the logic.

---

## 2. Boutiques

Code: `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`
(`renderBoutiques`), `components/SellerDashboard/boutiqueEdit/*`,
`.../boutiques/new/page.tsx`, `.../boutiques/[boutiqueId]/page.tsx`.

**The boutique pages have no `data-pw` hooks**, except the back buttons. Use
roles and the English text below (in `sy-en`), or add `data-pw` hooks in an
app change first.

### 2.1 The boutique list (dashboard tab)

Facts from the code:

- Request: `GET /shop/boutiques`. The list is `data.boutiques`, or `data` if
  that is the array.
- The list is asked **once per arrival** on the dashboard, not once per tab
  switch. Coming back from the editor is a new arrival, so the list is asked
  again.
- States, in this order:
  1. permissions not ready → skeleton
  2. permissions failed to load → error with Retry
  3. no boutique permission → Access Denied
  4. loading and no rows yet → boutique grid skeleton
  5. error and no rows → error message + "Retry"
  6. no rows → "No boutiques found" + "Boutiques created for this shop will
     appear here." + (with `CREATE_BUTIKS`) link "+ Add your first boutique"
  7. rows → header "Boutiques" with a count badge (= number of rows), link
     "+ Add Boutique" (with `CREATE_BUTIKS`), one card per row
- Each card is a link to `.../boutiques/{id}`. On the card:
  - the `icon` image, or the text "No Image"
  - a status pill **only if `status` is present**: `status === 1` → "Active",
    anything else → "Inactive"
  - the name, or "Unnamed Boutique"
  - the description with HTML tags removed, cut at 100 characters, then
    "..." if it was longer; or "No description"
  - the slug as `/{slug}`, only if present
- The side menu item shows the same row count.

**BQ-L-01 — The list shows the rows the backend holds.**
- Steps: open the Boutiques tab. Read `GET /shop/boutiques` yourself (direct
  call, same session, `x-seller-id`).
- Expect: one card per backend row, found by its link
  `a[href$="/boutiques/{id}"]`. For each row: the name, the status word and
  the slug match. Do not assert on a count — check each id by name.

**BQ-L-02 — A card's text follows the code's rules.** (mocked)
- Mock rows: (a) no `icon`, (b) no `status` key, (c) `status: 0`,
  (d) `name: ""`, (e) description `<p>` + 150 characters, (f) no description,
  (g) no slug.
- Expect: (a) "No Image"; (b) no pill; (c) "Inactive"; (d) "Unnamed Boutique";
  (e) plain text, 100 characters + "..."; (f) "No description"; (g) no slug chip.

**BQ-L-03 — Empty list.** (mocked: `data: { boutiques: [] }`)
- Expect: "No boutiques found" and the subtitle. With `CREATE_BUTIKS`:
  "+ Add your first boutique" links to `.../boutiques/new`.

**BQ-L-04 — The list call is refused.** (mocked: `success: false`, message "X")
- Expect: the message "X" and a "Retry" button. Click Retry → a new
  `GET /shop/boutiques` is sent.
- Note: this shares one error state with the page. Mock only the boutiques
  call.

**BQ-L-05 — A card opens its editor, and Back returns to the Boutiques tab.**
- Steps: open the tab, click a card, wait for the editor, press the back
  button `data-pw="seller-boutique-edit-screen-back-button"`.
- Expect: URL is `.../boutiques/{id}`; after Back, the URL has
  `?tab=boutiques` again and the list is shown.

**BQ-L-06 — A direct link to the editor, then Back, goes to the dashboard home.**
- Steps: `goto` the edit URL directly, press the back button.
- Expect: the dashboard home (no `?tab=`). The code goes back in history only
  when the last page was this dashboard; otherwise it opens the dashboard home.

**BQ-L-07 — "+ Add Boutique" opens the new-boutique page.**
- Expect: URL ends with `/boutiques/new`, title "New Boutique".

### 2.2 Opening the editor (both modes)

Load order (`BoutiqueEditor.load`):

1. `GET /languages`. If it fails or is empty, the app uses 4 built-in
   languages: English, العربية, Türkçe, کوردی (`en`, `ar`, `tr`, `ku`).
2. Create mode: `GET /shop/boutiques/lookups`. Edit mode:
   `GET /shop/boutiques/{id}/edit`.
3. While loading: a form skeleton.
4. If step 2 fails:
   - the error text contains `permission`, `forbidden` or `403` (any case) →
     Access Denied with "You don't have permission to view or edit this
     boutique."
   - any other text → the text and a "Retry" button
   - edit answer with no `data.boutique` → "Boutique not found."

If the editor has no permission list yet (deep link), it asks
`/shop/auth/permissions` itself.

The layout guard runs first: if the server's shop list is conclusive and this
`sellerId` is not in it, the page redirects to `/{lang}` (the home page).

**BQ-O-01 — Opening a shop id the seller does not own redirects home.**
- Steps: `goto` `/sy-en/sellerProfile/sellerDashboard/999999999/boutiques/1`.
- Expect: the final URL is `/sy-en` (home). No editor is drawn.

**BQ-O-02 — The languages call fails: the 4 built-in tabs are shown.** (mocked)
- Mock `/languages` as a 500 (note: it is a GET, so the retries add ~3 s).
- Expect: the Translations section has 4 tabs (`role="tab"`): "English",
  "العربية", "Türkçe", "کوردی". Check each by name.

**BQ-O-03 — The tabs follow the languages answer.** (mocked)
- Mock `/languages` with 2 languages, e.g. `en` and `ar`.
- Expect: exactly those two tabs, by name. Save then asks every one of them
  for all fields (see 2.4).

**BQ-O-04 — The edit load is refused with a permission message → Access Denied.** (mocked)
- Mock `/shop/boutiques/{id}/edit`: `success: false`,
  `message: "You do not have permission"`.
- Expect: `dashboard-access-denied` with the boutique message above.

**BQ-O-05 — The edit load fails for another reason → message + Retry.** (mocked)
- Mock: `success: false`, `message: "Server error"`.
- Expect: "Server error" and "Retry". Retry sends the languages and edit
  calls again.

**BQ-O-06 — A boutique id that does not exist.** (live)
- Steps: open `.../boutiques/999999999` for the QA shop.
- Expect: an error or Access Denied — **the backend's message decides which**.
  Quote the backend message in the test output. The service comment says the
  backend answers 404 "Boutique not found." for another seller's boutique.

**BQ-O-07 — A `READ_BUTIKS`-only role opening a boutique.**
- This needs a real small-role account, because the backend decides
  (`/edit` needs `UPDATE_BUTIKS` by the service comment).
- Expect: Access Denied if the backend's message contains
  permission / forbidden / 403; otherwise the message + Retry. Record which.

### 2.3 View mode (edit route)

Facts:

- The header shows: the English (`en`) icon, the English name (or
  "Unnamed Boutique"), a status pill ("Active" / "Inactive"), and
  "ID: {boutiqueId}".
- All fields are disabled. No upload buttons, no banner controls, no
  "Copy from" select.
- **The language tabs still work** in view mode, so a test can read each
  language.
- With `UPDATE_BUTIKS`: an "Edit" button. Without it: the text "View only"
  with a lock icon.
- Sections, in order: "Availability", "Translations", "Restricted countries".

**BQ-V-01 — The editor shows what the backend holds, per language.**
- Steps: read `GET /shop/boutiques/{id}/edit` yourself. Open the editor.
  Click each language tab.
- Expect, per language in `boutique.translations`: name input value =
  `name`; bio = `bio`; the description text matches; the number of banner
  images (`alt` "Banner 1", "Banner 2", …) = number of `banners`, in
  `sequence` order. Check each language by its code in the message.
- A language the backend has no translation for shows empty fields.

**BQ-V-02 — Availability shows the stored value.**
- Expect: the select shows "Web" (1), "Mobile" (2) or "Web + Mobile" (3). If
  the stored value is not 1, 2 or 3, it shows "Web + Mobile".

**BQ-V-03 — Restricted countries show the stored set.**
- Expect: each iso in `restricted_countries_iso` is an active chip; the
  others are not. Chip labels are country names in the app language. If the
  lookups have no countries: "No countries available."

**BQ-V-04 — Without `UPDATE_BUTIKS`: "View only", no "Edit".** (faked role)

**BQ-V-05 — The status pill follows `boutique.status`.**

### 2.4 Edit mode and Save (edit route)

Facts:

- "Edit" turns edit mode on. Header buttons: (with
  `CHANGE_BOUTIQUE_STATUS`) "Set inactive" / "Set active", then "Cancel",
  "Save Changes". A sticky bar at the bottom repeats "Cancel" and
  "Save Changes".
- "Set active / Set inactive" only changes the form. The header pill changes
  at once, but nothing is sent until Save.
- **Cancel** puts back the last saved values, clears errors and the status
  blockers, and leaves edit mode. No request.
- **Client validation, for every language tab** (`helpers.validate`):
  - name — "Name is required."
  - description — "Description is required." (an empty rich-text box counts
    as empty)
  - bio — "Bio is required."
  - icon — "Icon is required."
  - banners — "At least one banner is required."
- When validation fails: no request; the error toast "Please fix the
  highlighted fields before saving."; the editor jumps to the **first**
  language (in tab order) that has an error; the field messages show under
  the fields and the fields shake.
- When validation passes:
  1. `POST /shop/boutiques/{id}/update` with the body below.
  2. Refused → error toast with all `detailed_error[].message` joined by
     " • ", or the `message`, or "Failed to update boutique." Edit mode stays
     on.
  3. Saved, and the status was changed → `POST .../change-status`
     `{ "status": 0|1 }`.
     - Refused → the edits are already saved; the status goes back to the old
       value; the header shows "Status could not be changed:" and one line
       per `detailed_error[].message` (or the `message`, or
       "Could not change status."); error toast "Your changes were saved, but
       the status could not be updated."; edit mode ends.
     - Accepted → the status comes from `data.status`.
  4. If nothing failed: toast "Boutique updated successfully.", edit mode ends.
- The service comment says: `status: 0` always succeeds; `status: 1` may be
  refused (422) with blockers in `detailed_error`.

Update body (`helpers.buildUpdatePayload`, mode `update`):

```json
{
  "boutique_global_data": {
    "name": "<en name>",
    "availability": 1,
    "description": "<en description, sanitised HTML>",
    "bio": "<en bio>",
    "icon": "<en icon, bare file name>",
    "countries_iso": ["SY"],
    "product_resources": [ ...unchanged related_product_ids ]
  },
  "custom_data": [
    {
      "id": 12,
      "language_code": "en",
      "name": "...",
      "description": "...",
      "bio": "...",
      "icon": "file.webp",
      "banners": [ { "id": 3, "file_path": "b.webp", "sequence": 1 } ]
    }
  ]
}
```

- `id` is sent only for a translation / banner that already exists.
- `icon` and `file_path` are **bare file names**, never a folder path.
- `sequence` is the banner's position in the tab, starting at 1.
- The global data comes from the `en` language. If there is no `en` tab, it
  comes from the first tab.

**BQ-E-01 — A text edit reaches the backend, and is put back.** (live, own boutique only)
- Steps: open a boutique the test owns. Edit → change the English bio to a
  value with the run's timestamp → Save Changes.
- Expect, as separate steps: (1) the update call answers `success: true`;
  (2) toast "Boutique updated successfully."; (3) edit mode ended (the "Edit"
  button is back); (4) a direct `GET /shop/boutiques/{id}/edit` returns the
  new bio for `en`. Then put the old bio back.

**BQ-E-02 — The request body has the right shape.**
- Catch the update request (`x-proxy-url` ends with `/update`).
- Expect: the key is `custom_data` (not `boutique_custom_data`); one entry per
  language; `icon` and every `file_path` have no `/`; `sequence` runs 1, 2, …;
  `boutique_global_data.name` = the English name.

**BQ-E-03 — Cancel throws away the changes and sends nothing.**
- Steps: Edit → change the name → Cancel.
- Expect: the old name is back; edit mode is off; no update request.

**BQ-E-04 — An empty required field blocks Save, per field.**
- Run once per field: name, description, bio. Clear it in **one** non-English
  tab (for example `tr`). Switch to the `en` tab. Click Save Changes.
- Expect: no update request; toast "Please fix the highlighted fields before
  saving."; the active tab is now the `tr` tab; the field message is under the
  right field.

**BQ-E-05 — Removing the last banner of a language blocks Save.**
- Steps: in one language, delete every banner (button `aria-label="Delete"` on
  each banner) → Save.
- Expect: "At least one banner is required." under Banners for that language;
  no request.

**BQ-E-06 — The backend refuses the update.** (mocked)
- Mock the update: `success: false`, `detailed_error: [{message:"A"},{message:"B"}]`.
- Expect: error toast "A • B"; still in edit mode; the form keeps the typed
  values.

**BQ-E-07 — Set inactive, then Save: both calls go, status changes.** (live, own boutique)
- Steps: active boutique → Edit → "Set inactive" → Save.
- Expect: (1) update call `success: true`; (2) change-status call body
  `{"status":0}` and `success: true`; (3) pill "Inactive"; (4) direct read
  shows `status: 0`. Put it back afterwards.

**BQ-E-08 — Status refused: edits stay saved, status goes back.** (mocked change-status)
- Mock change-status: `success: false`,
  `detailed_error: [{message:"Add a product first"}]`.
- Steps: inactive boutique → Edit → change bio → "Set active" → Save.
- Expect: update call sent and accepted; "Status could not be changed:" with
  the line "Add a product first"; toast "Your changes were saved, but the
  status could not be updated."; pill back to "Inactive"; no
  "Boutique updated successfully." toast.

**BQ-E-09 — No status change → no change-status call.**
- Steps: Edit → change bio only → Save.
- Expect: only the update call; no `/change-status` request.

**BQ-E-10 — Without `CHANGE_BOUTIQUE_STATUS`, no status button in edit mode.** (faked role: `UPDATE_BUTIKS` only)

**BQ-E-11 — Availability change is sent.**
- Steps: Edit → pick "Mobile" → Save.
- Expect: `boutique_global_data.availability === 2`. The select only offers
  values 1, 2, 3, even if the lookups list more.

**BQ-E-12 — A restricted country chip toggles in and out of the body.**
- Steps: Edit → click a country chip → Save.
- Expect: that iso is in `boutique_global_data.countries_iso`. Click it again
  and save → it is gone.

**BQ-E-13 — "Copy from" fills the active language from another one.**
- Facts: the "Copy from…" select sits next to Name, Boutique icon,
  Description, Bio and Banners. It shows only in edit mode, and only when
  **another** language already has that field filled. It lists those
  languages by name.
- Steps: in the `ar` tab, clear Name; pick "English" in its "Copy from…".
- Expect: the `ar` name = the English name. For Banners: the same images
  appear, and in the saved body they have **no** `id` (they are new records
  for this language).

**BQ-E-14 — Banner order controls.**
- Facts: on each banner, "Move left" (disabled on the first), "Move right"
  (disabled on the last), "Delete". All are `aria-label`s.
- Steps: move banner 2 left → Save.
- Expect: in the body, that banner's `file_path` now has `sequence: 1`.

### 2.5 Media in the editor (icon and banners)

Facts (`BoutiqueEditor`, `helpers`):

- **Icon** ("Upload icon", file input `accept="image/*"`):
  - not an image → toast "Please choose an image file."; no upload
  - over 10 MB → toast "Icon image must be 10 MB or smaller."; no upload
  - upload: `POST /gated/upload`, `folder = boutiques/boutiques/icon`
  - success → the preview changes; the form keeps the bare file name
  - failure → toast with the media server's error, or "Image upload failed.";
    an answer with no file name → "Upload returned no file."
  - while uploading, the button shows a spinner
- **Banners** ("Add banner" tile, many files allowed). The files are checked
  and uploaded **one at a time**, in order:
  - not an image → toast "Please choose an image file.", file skipped
  - over 10 MB → toast "Banner image must be 10 MB or smaller.", file skipped
  - width under 600 px, or width ÷ height under 1.5 or over 1.8 → a warning
    dialog: "This banner may not display well", "For best results use a banner
    of 1280 × 750 (16:9).", "Your image is {w}×{h}." Buttons: "Cancel" (skip
    this file) and "Ignore & upload". A click on the dark backdrop = Cancel.
    The next file waits until you choose.
  - an image the browser cannot read for size → allowed, no warning
  - upload: `POST /gated/upload/bulk`, `folder = boutiques/boutiques`
  - while uploading, the tile shows "Uploading…"
  - a new banner is added at the end of the active language only

Good test sizes: 1280×750 (ratio 1.71, no warning), 500×300 (too narrow),
1200×600 (ratio 2.0), 900×900 (ratio 1.0).

**BQ-M-01 — A good icon uploads and shows.** (live: upload only on an owned boutique)
- Expect: one `/gated/upload` request with `folder=boutiques/boutiques/icon`;
  the icon preview changes; after Save, `icon` in the body is a bare file name.

**BQ-M-02 — A non-image icon is refused before any upload.**
- Steps: set a `.txt` file on the hidden icon input.
- Expect: toast "Please choose an image file."; no ticket call, no
  `/gated/upload`.

**BQ-M-03 — An icon over 10 MB is refused before any upload.**

**BQ-M-04 — A good banner uploads with no warning.** (1280×750)
- Expect: no warning dialog; one `/gated/upload/bulk`; one more banner image
  in the active tab.

**BQ-M-05 — A badly shaped banner asks first; "Cancel" uploads nothing.** (900×900)
- Expect: the dialog with "Your image is 900×900."; after Cancel, no
  `/gated/upload/bulk` and no new banner.

**BQ-M-06 — "Ignore & upload" uploads the badly shaped banner.**

**BQ-M-07 — Three banners at once: good, bad shape, good.**
- Expect: the first uploads; the dialog stops the queue at the second; after
  "Ignore & upload" (or "Cancel") the third uploads. Assert each file by name.

**BQ-M-08 — The media server refuses the upload.** (mock the media URL with 500 and `{ "message": "X" }`)
- Expect: toast "X" (banner) or the error text (icon); no new banner / icon.

### 2.6 Create a boutique

Facts:

- Route `.../boutiques/new`. Back button
  `data-pw="seller-boutique-create-screen-back-button"`.
- **The page itself does not check `CREATE_BUTIKS`.** Only the link to it is
  hidden. The lookups call (`CREATE_BUTIKS` by the service comment) decides.
- The form opens in edit mode at once, every language empty, availability
  "Web + Mobile", no countries.
- Header: "New Boutique", "Fill in the details and create your boutique.",
  "Cancel", "Create Boutique". **No status button.**
- "Cancel" (header or sticky bar) goes to the dashboard **home** (no
  `?tab=`). No request.
- The same validation as 2.4 runs for every language.
- Save → `POST /shop/boutiques`. Body as in 2.4, but the per-language key is
  **`boutique_custom_data`**, and no `id` fields.
- Accepted → toast "Boutique created successfully."; the page is
  **replaced** by `.../boutiques/{newId}`. The new id is read from
  `data.boutique_id`, then `data.boutique.id`, then `data.id`. With no id, it
  goes to the dashboard home.
- Refused → toast with `detailed_error` messages joined by " • ", or the
  `message`, or "Failed to create boutique."; the form stays filled.

> **Clean-up warning.** The UI cannot delete a boutique (2.7). A live create
> case leaves a boutique on staging every run. Before you write one, agree a
> clean-up plan with the team — for example a harness call to
> `DELETE /shop/boutiques/{id}/delete`. Name test boutiques with the
> `trydos-qa-` prefix, like `newQaLocationName`.
> **Tip:** upload the icon and one banner in English only, then use
> "Copy from" → English in every other tab. That fills all languages with no
> extra uploads.

**BQ-C-01 — Create, and the new boutique exists on the backend.** (live, with a clean-up plan)
- Expect, as separate steps: (1) `POST /shop/boutiques` answers
  `success: true` with an id; (2) the URL becomes `.../boutiques/{newId}`;
  (3) direct `GET /shop/boutiques/{newId}/edit` returns each language's name
  by code; (4) the Boutiques list shows a card linking to `{newId}`.

**BQ-C-02 — The create body uses `boutique_custom_data`.**
- Catch the request. Expect `boutique_custom_data` is present and
  `custom_data` is absent; no `id` in any entry.

**BQ-C-03 — Create with an empty form is blocked on the client.**
- Steps: open new → click "Create Boutique".
- Expect: no `POST /shop/boutiques`; toast "Please fix the highlighted fields
  before saving."; the first tab with errors is active; all 5 field messages
  show in that tab.

**BQ-C-04 — Only English filled: still blocked, and the editor jumps to the next language.**
- Expect: the active tab moves to the second language in tab order.

**BQ-C-05 — The backend refuses the create.** (mocked)
- Expect: toast with the joined `detailed_error` messages; the URL is still
  `/boutiques/new`; the fields keep their values.

**BQ-C-06 — Accepted with no id → dashboard home.** (mocked: `success: true`, `data: []`)
- Expect: the URL is the dashboard home.

**BQ-C-07 — Cancel on the new page goes to the dashboard home and sends nothing.**

**BQ-C-08 — The lookups call is refused.** (mocked)
- Message with "permission" → Access Denied; any other message → message +
  "Retry".

### 2.7 Delete a boutique — not offered

`BoutiqueEditor` sets `canDelete = false` for everyone ("pending a product
decision"). So the "Delete boutique" button and its dialog never show.

**BQ-D-01 — No user is offered "Delete boutique", not even `SUPER_ADMIN` or `DELETE_BUTIKS`.**
- Steps: open a boutique, click "Edit".
- Expect: no button named "Delete boutique".
- When the team turns delete back on, this case must change in the same
  change.

---

## 3. Locations

Code: `components/SellerDashboard/locations/LocationsTab.tsx`,
`LocationFormModal.tsx`, `LocationMapPicker.tsx`, `types.ts`.

**There is no delete.** The API has none. A location can only be
deactivated, and deactivating does not detach it from products. Every live
write must land on a row the test created (`newQaLocationName`), and the test
leaves it inactive at the end (`deactivateLocationQuietly`).

### 3.1 The list

Facts:

- Request: `GET /shop/locations`, with `status=1|0` when a filter is set and
  `page=N` when N > 1. Rows: `data.locations`; paging: `data.meta`
  (`current_page`, `last_page`, `per_page`, `total`, `has_more_pages`).
- The service comment says: newest first; page size comes from the business
  setting `pagination_limit`.
- Header "Locations" with a count = `meta.total` (or the row count).
- Filter `data-pw="locations-status-filter"`: "All statuses" (`all`),
  "Active" (`1`), "Inactive" (`0`). A change reloads page 1.
- States:
  - loading → row skeleton
  - error → `data-pw="locations-error"`: the message (or "Failed to load
    locations") + "Retry" (reloads the same page)
  - empty → `data-pw="locations-empty"`: "No locations found" + "Locations
    added to this shop will appear here." With `CREATE_LOCATION` **and** the
    filter on "All statuses": a button "Add your first location".
  - rows → `data-pw="locations-list"`
- Card `data-pw="location-card"`, `data-location-id="{id}"`:
  - `location-name`
  - `location-status`: "Active" if `status === 1`, else "Inactive"
  - `location-address`, or the grey text "Address: —" when there is none
  - a country chip (`nicename`, else `name`) when `country` is present
  - `location-edit-btn` "Edit" (with `UPDATE_LOCATION`)
  - `location-toggle-btn` "Deactivate" (active row) / "Activate" (inactive
    row) (with `CHANGE_LOCATION_STATUS`)
- Paging shows only when `last_page > 1`: "Previous",
  `pagination-status` ("Page x / y", with `data-current`, `data-last`),
  `pagination-next` "Next".

**LOC-01 — The list shows the rows the backend holds.** (SD-04 — extend, do not copy)

**LOC-02 — Each filter sends its own value and shows only matching rows.** (SD-05)
- Expect: "Active" → `x-proxy-url` has `status=1` and every card says
  "Active"; "Inactive" → `status=0` and every card says "Inactive"; "All
  statuses" → no `status` in the URL.

**LOC-03 — Card text rules.** (mocked)
- Mock rows with: no address; `country: null`; a country with `nicename`;
  a country with only `name`; `status: 0`.
- Expect: "Address: —"; no country chip; `nicename`; `name`; "Inactive".

**LOC-04 — Empty list, filter "All statuses", with `CREATE_LOCATION`.** (mocked)
- Expect: `locations-empty`, "No locations found", button
  "Add your first location". The button opens the create form.

**LOC-05 — Empty list with filter "Active": no "Add your first location".** (mocked)

**LOC-06 — The list call is refused, then Retry works.** (mocked with `mockBackendSequence`: first `success:false`, then a good answer)
- Expect: `locations-error` with the message; Retry → the list shows.

**LOC-07 — Paging.** (mocked: `meta.last_page = 3`)
- Expect: "Page 1 / 3"; "Previous" disabled; Next → request with `page=2`
  and "Page 2 / 3"; on page 3 "Next" is disabled.

**LOC-08 — A deep link to `?tab=locations` loads the list.**
- Steps: `goto` the URL directly (not via a tile).
- Expect: the list (or the empty state) shows, and it does not stay on the
  skeleton. (A real bug here was fixed in `LocationsTab`; the comment there
  explains it.)
- Note: during the first moment, before the permissions arrive, the section
  can show Access Denied. Do not judge the first paint. Wait for
  `locations-list`, `locations-empty` or `locations-error`.

### 3.2 Activate / Deactivate

Facts:

- `POST /shop/locations/{id}/change-status` with `{ "status": <the other value> }`.
- While it runs, that button shows a spinner and **every** other toggle click
  is ignored.
- Accepted → the row's status is set from `data.status` (or the sent value);
  toast "Status changed successfully". **The list is not asked again.**
- Refused → `data-pw="locations-action-error"` with the message, or
  "Failed to change location status". The row does not change.

**LOC-10 — Deactivate, then Activate; the backend holds each status.** (SD-08)

**LOC-11 — The toggle sends the opposite status.**
- Expect: an active row sends `{"status":0}`; an inactive row sends
  `{"status":1}`.

**LOC-12 — With the "Active" filter on, a row you deactivate stays in view as "Inactive".**
- Because the list is not asked again after a toggle. Expect the card still
  there, now saying "Inactive". After you change the filter or reload, it is
  gone from the "Active" view.

**LOC-13 — The toggle is refused.** (mocked)
- Expect: `locations-action-error` with the backend message; the row's status
  word did not change.

### 3.3 The create / edit form

Facts:

- Open: `locations-add-btn` (create) or `location-edit-btn` (edit).
- Modal `data-pw="location-form"`, `data-mode="create"` or `"edit"`. Title
  "Add Location" / "Edit Location", subtitle "Warehouses and pickup points
  for this shop".
- While it loads: a spinner.
  - Create loads `GET /shop/locations/lookups` → countries from
    `data.countries`.
  - Edit loads `GET /shop/locations/{id}/edit` → the form is refilled from
    `data.location`, countries from `data.lookups.countries`. (So an edit
    never calls the lookups endpoint.)
  - Load refused → `data-pw="location-form-error"` with the message or
    "Failed to load locations". The form is still drawn.
- Fields:
  - Name `location-name-input`, at most 255 characters (`maxLength`)
  - Country `location-country-select`, first option "Select", then
    `nicename` or `name`
  - Address `location-address-input`
  - a map (3.4)
  - Latitude `location-latitude-input`, Longitude `location-longitude-input`
    (both `type="number"`)
- Close with no request: `location-close-btn`, `location-cancel-btn`
  ("Cancel"), the Escape key, or a click on the dark backdrop.
- There is **no status field**. Status changes only with the list toggle.
- Client validation (no request when it fails). Messages under each field,
  at `<field data-pw>-error`:

  | Field | Rule | Message | Error `data-pw` |
  |---|---|---|---|
  | Name | not blank after trim | "Name is required" | `location-name-field-error` |
  | Country | one picked | "Country is required" | `location-country-field-error` |
  | Latitude | empty, or a number from -90 to 90 | "Latitude must be between -90 and 90" | `location-latitude-field-error` |
  | Longitude | empty, or a number from -180 to 180 | "Longitude must be between -180 and 180" | `location-longitude-field-error` |

- Typing in a field clears its message. Changing Name **or** Country clears
  both the name and the country messages (the backend's unique-name rule
  covers the pair).
- Body (same for create and edit):
  - always `name` (trimmed) and `country_id` (a number)
  - `address` only when not blank (trimmed)
  - `latitude` / `longitude` only when the input is not empty (as numbers)
- Create → `POST /shop/locations`. Edit → `POST /shop/locations/{id}/update`.
- Refused → each `detailed_error[]` entry with a `code` and a `message` is
  shown under the field whose name is the `code` (`name`, `country_id`,
  `address`, `latitude`, `longitude`); the envelope `message` (or
  "Failed to save location") shows in `location-form-error`. The modal stays
  open.
- The service comment says the name is unique per shop per country, and a
  duplicate gives 422 with `detailed_error[].code = "name"`.
- Accepted → the modal closes; toast "Location created successfully" /
  "Location updated successfully"; the list is asked again for the same page.

**LOC-20 — Create; the location exists on the backend.** (SD-06)

**LOC-21 — Edit; the change reaches the backend.** (SD-07)

**LOC-22 — Client refusals, one per rule, with no request.** (SD-09 — extend for any missing rule)
- Name blank (spaces only); no country; latitude 91; latitude -91; longitude
  181; longitude -181. One step per rule, each named in the message.
- Note: a `type="number"` input gives an empty value for text like "abc" in
  the browser. Empty means "no coordinate", so "abc" is **not** refused — it
  is dropped. Do not write a case that expects "abc" to be refused.

**LOC-23 — Boundary values are accepted.**
- Latitude -90 and 90, longitude -180 and 180 → no client message; the
  request is sent.

**LOC-24 — Optional fields are left out of the body when empty.**
- Steps: create with name + country only.
- Expect: the body has exactly `name` and `country_id` — check that
  `address`, `latitude`, `longitude` are each absent, by name.

**LOC-25 — A duplicate name in the same country is refused by the backend, and shown on the field.** (live: use the name SD-06 made)
- Expect: the create call is refused; `location-name-field-error` shows the
  backend's message; `location-form-error` shows the envelope message. Quote
  both.

**LOC-26 — A backend field error is bound to its field.** (mocked)
- Mock: `success:false`, `message:"Invalid"`,
  `detailed_error:[{code:"latitude",message:"Bad lat"}]`.
- Expect: "Bad lat" under latitude; "Invalid" in `location-form-error`;
  modal still open.

**LOC-27 — Changing the country clears a name error.**
- After LOC-25, change the country → `location-name-field-error` is gone.

**LOC-28 — The edit form is filled from the edit endpoint, not from the card.** (mocked edit answer with a different name than the list row)
- Expect: the name input shows the edit endpoint's name. No
  `/shop/locations/lookups` request was sent.

**LOC-29 — Closing the form sends nothing.**
- Four steps: close button, Cancel, Escape, backdrop. After each: the modal
  is gone, no create / update request.

**LOC-30 — The form's load is refused.** (mocked lookups `success:false`)
- Expect: `location-form-error` with the message; the country select has only
  "Select".

### 3.4 The map

Facts (`LocationMapPicker`):

- Without a Google Maps key, or when the map script fails: the box says
  "Map is unavailable" and "Coordinates are optional". The inputs still work.
- A click on the map sets latitude and longitude, rounded to 6 decimals, and
  draws a pin.
- The button `aria-label="Use my current location"` asks the browser for the
  position:
  - success → the inputs get the position; zoom 14
  - refused → "Error getting your location"
  - no geolocation in the browser → "Geolocation is not supported by your
    browser"
- The hint under the map: "Pick the position on the map".

**LOC-40 — "Use my current location" fills the inputs.**
- Setup: `context.grantPermissions(["geolocation"])`,
  `context.setGeolocation({ latitude: 33.5138, longitude: 36.2765 })`.
- Expect: latitude input `33.513800`, longitude `36.276500`.

**LOC-41 — Geolocation refused → "Error getting your location".**
- Setup: do not grant the permission.

**LOC-42 — The map fails to load → "Map is unavailable", and you can still save with typed coordinates.**
- Setup: block `maps.googleapis.com`.

---

## 4. Shop Info

Code: `components/SellerDashboard/ShopInfo.tsx`, `ShopInfoLoader.tsx`,
`services/sellerDashboard/index.ts` (`getShopInfo`, `updateShopInfo`,
`uploadShopImage`), `[sellerId]/layout.tsx`.

### 4.1 Load

Facts:

- The tab is wrapped by the page's gate: skeleton until permissions are
  ready; permissions failed → message + Retry; no `READ_SHOP_INFO` → Access
  Denied "You don't have permission to view shop info".
- `GET /shop/info` fills the form from `data.name`, `data.contact`,
  `data.address`, `data.image`, `data.banner`.
- **Expect two `GET /shop/info` calls**, not one: `ShopInfoLoader` (in the
  layout) asks once per shop for the currency, and the form asks again. Do
  not assert a call count.
- A logo / banner value counts as **none** when it is empty, not a string,
  or ends with `/` (a folder with no file).
  - no logo → a monogram (letters of the shop name)
  - no banner → "No banner yet"
- Logo button: "Upload" (no logo) / "Change". Banner button: "Upload Banner"
  / "Change Banner". Under each: the file name, or the last part of the URL.
- Banner label: "Shop Banner" + "Ratio 6:1".
- Contact hint: "Country code must lead, e.g. AE = 971"; placeholder
  `971XXXXXXXXX`.
- Refused load → `data-pw="shop-info-load-error"`: the backend message, or
  "Failed to load shop info", and "Retry". No empty form is shown.
- A loaded name is also pushed to the dashboard header (the shop name next to
  the shop picture).

Selectors: form `shop-info-form`; inputs `shop-info-name-input`,
`shop-info-contact-input`, `shop-info-address-input`; fields
`shop-info-name-field`, `shop-info-contact-field`, `shop-info-address-field`;
remove buttons `shop-info-logo-clear-btn`, `shop-info-banner-clear-btn`;
save `shop-info-save-btn`; save error `shop-info-save-error`.

**SI-01 — The form is filled from the shop's record.** (SD-10)

**SI-02 — A logo / banner that is a folder path counts as none.** (mocked `image: "https://x/image/upload/seller/"`, `banner: ""`)
- Expect: the monogram, "Upload", "No banner yet", "Upload Banner"; no
  remove buttons.

**SI-03 — The load is refused, then Retry works.** (mocked with a sequence)
- Expect: `shop-info-load-error` with the message, no `shop-info-form`.
  Retry → the form shows with the values.

### 4.2 Client validation

Rules, checked in this order, on Save (`validateForm`):

| Field | Rule | Message | Error `data-pw` |
|---|---|---|---|
| Shop Name | not blank after trim | "Shop Name is required" | `shop-info-name-field-error` |
| Contact | not blank | "Contact is required" | `shop-info-contact-field-error` |
| Contact | matches `^\+?\d+$` after trim (an optional `+`, then digits only) | "Contact must contain valid numbers" | `shop-info-contact-field-error` |
| Address | not blank after trim | "Address is required" | `shop-info-address-field-error` |

- All failing fields show at once. Typing in a field clears **its** message.
- No upload and no `PUT` when validation fails.

**SI-10 — Empty contact and non-numeric contact are refused with no request.** (SD-11)

**SI-11 — Each rule on its own, one step each.**
- Name "   "; contact "   "; contact "971-555"; contact "+971 555" (space);
  contact "++971"; address "   ". Each step names its rule.

**SI-12 — Accepted contact shapes reach the PUT.**
- "+971500000000" and "971500000000" → a `PUT /shop/info` is sent with the
  trimmed value. (Put the old contact back.)

**SI-13 — Typing clears only that field's message.**
- Make all three fail, type in Name → only the name message is gone.

### 4.3 Save — body rules

Save → (uploads, if any) → `PUT /shop/info`. The button shows "Saving..."
during the save. The body always has `name`, `address`, `contact`, trimmed.

The `image` (logo) and `banner` keys follow these rules
(`ShopInfo.handleSubmit` + `updateShopInfo`). Each picture is handled on its
own:

| What the seller did | What is sent |
|---|---|
| The shop has no picture, and none was picked | the key is **left out** |
| The shop has a picture, and it was not touched | the stored file's **bare name** (last part of the URL) |
| A new picture was picked and cropped | it is uploaded first (`POST /gated/upload`, `folder=seller`), then its **bare name** is sent |
| The remove (X) button was pressed, and no new picture picked | `""` (empty string = remove it) |
| X pressed, then a new picture picked | the new picture's bare name |

- A missing key means "do not touch it". `""` means "blank it". `null` is
  never sent (the service comment says the core backend refuses `null` with
  "The image field must be a string").
- Accepted → toast "Shop Info Updated Successfully!"; the staged files are
  cleared; the dashboard header shows the new name and logo.
- Refused (`success: false`) **or** a failed media upload →
  `shop-info-save-error` with the backend / media message, or
  "Failed to update". The typed values stay.

> **About SD-12.** The header of `sellerDashboard.live.spec.ts` says SD-12 is
> red because the app sent `image: ""` for a shop with no logo. The current
> code does **not** do that any more: a folder-only URL counts as "no
> picture", so the key is left out. Run SD-12 to learn what the backend says
> today. If it is green, update that header in the same change.

**SI-20 — A contact and address change reaches the backend, and is put back.** (SD-12)

**SI-21 — No logo and no banner: both keys are left out.** (catch the PUT; mock GET with no media if the QA shop has some)
- Expect: the body has `name`, `address`, `contact`; `image` absent;
  `banner` absent. Check each key by name.

**SI-22 — Stored logo, untouched: the bare file name is sent.** (mocked GET `image: "https://cdn/x/image/upload/seller/logo.webp"`)
- Expect: `image === "logo.webp"` — no `/` in it.

**SI-23 — Remove the logo: `image: ""` is sent.** (mock the PUT; do not run against the live shop unless you put the logo back)
- Steps: click `shop-info-logo-clear-btn` → Save.
- Expect: the monogram shows at once; the body has `image: ""`; `banner` is
  unchanged by the rules above.

**SI-24 — A new logo: crop, upload, then the PUT.** (mock the media server and the PUT)
- Steps: set an image on the hidden logo input → the "Crop Image" dialog
  opens → click `image-crop-save-button`.
- Expect, as separate steps: (1) the preview shows and the button says
  "Change"; (2) after Save, one `POST /gated/upload` with `folder=seller`;
  (3) the PUT body `image` = the bare name of the URL the media server
  returned.

**SI-25 — Closing the crop dialog stages nothing.**
- Steps: pick a file → close the crop dialog (its close button) → Save.
- Expect: no `/gated/upload`; the PUT follows the "not touched" rule.

**SI-26 — The same file can be picked twice in a row.**
- Steps: pick `a.png`, close the crop dialog, pick `a.png` again.
- Expect: the crop dialog opens the second time too (the input is reset).

**SI-27 — The backend refuses the save.** (mocked PUT `success:false`, `message:"X"`)
- Expect: `shop-info-save-error` says "X"; the inputs keep the typed values;
  no success toast.

**SI-28 — The media upload fails: no PUT is sent.** (mock `/gated/upload` 500)
- Expect: `shop-info-save-error` shows the media message (or
  "Media server upload failed"); no `PUT /shop/info`.

**SI-29 — A saved name shows in the dashboard header.** (live: the name must be put back — the QA seed finds its shop by name, so prefer a mocked PUT)
- Expect: after the success toast, the header shop name equals the new name.

**SI-30 — Banner: same rules as the logo.**
- Repeat SI-22, SI-23 and SI-24 for the banner (`shop-info-banner-clear-btn`,
  "Upload Banner" / "Change Banner", key `banner`).

---

## 5. Things in the code that may surprise you

These come from reading the code. They are facts about the current code, not
test results. Some may be bugs. If a case turns red on one of them, follow
`CLAUDE.md` → "A red test is not a bug report": confirm in the code first.

1. **Locations can flash Access Denied on a deep link.** `LocationsTab` is
   not wrapped in the page's permission gate. Until the permissions arrive,
   `canRead` is false, so it draws Access Denied for a moment.
2. **A location's address or coordinates may not be clearable on edit.** The
   form leaves `address`, `latitude` and `longitude` out of the body when they
   are empty. What the backend does with a missing key on update is a backend
   decision. Write a case that clears the address on edit and reads the row
   back. Report what you see; do not guess.
3. **The new-boutique page does not check `CREATE_BUTIKS` itself.** Only the
   link is hidden. The lookups call decides.
4. **Boutique delete is turned off for everyone** (`canDelete = false`).
5. **The boutique editor's Access Denied depends on words in the backend
   message** (`permission`, `forbidden`, `403`). A refusal with other words
   shows as an error with Retry.
6. **A location status toggle does not ask for the list again.** Under a
   status filter, the changed row stays until the next load.
7. **`GET /shop/info` is called twice** when the Shop Info tab opens (loader +
   form).
8. **Every boutique language must be complete** (name, description, bio,
   icon, one banner) before any save, on create and on edit.

---

## 6. Case list (quick view)

| Area | Cases | Status today |
|---|---|---|
| Permissions | PERM-01 … PERM-09 | partly (SCRIPT-26) |
| Boutique list | BQ-L-01 … BQ-L-07 | none |
| Boutique open | BQ-O-01 … BQ-O-07 | none |
| Boutique view | BQ-V-01 … BQ-V-05 | none |
| Boutique edit / save / status | BQ-E-01 … BQ-E-14 | none |
| Boutique media | BQ-M-01 … BQ-M-08 | none |
| Boutique create | BQ-C-01 … BQ-C-08 | none |
| Boutique delete | BQ-D-01 | none |
| Location list | LOC-01 … LOC-08 | LOC-01, LOC-02 (SD-04, SD-05) |
| Location status | LOC-10 … LOC-13 | LOC-10 (SD-08) |
| Location form | LOC-20 … LOC-30 | LOC-20, LOC-21, LOC-22 (SD-06, SD-07, SD-09) |
| Location map | LOC-40 … LOC-42 | none |
| Shop info load | SI-01 … SI-03 | SI-01 (SD-10) |
| Shop info validation | SI-10 … SI-13 | SI-10 (SD-11) |
| Shop info save | SI-20 … SI-30 | SI-20 (SD-12) |

When you write a case, give it the next free `SD-nn` number in
`sellerDashboard.live.spec.ts` (or a `SCRIPT-nn` number in the scripted
file), and note the guide id (for example `BQ-E-07`) in its comment.
