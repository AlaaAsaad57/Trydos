# Seller Dashboard — E2E Test Cases

For the automated-test developer writing **end-to-end** tests against the seller
dashboard. This lists every current section and the cases to cover. Keep tests
behavioural (drive the real UI); don't test implementation details.

## Scope

- **Covered:** dashboard shell + permissions, Products (list), Gallery, Comments &
  Reviews, Stories, Shop Info, Team (members & roles), Boutiques, Excel.
- **Ignore — Product edit:** do **not** write tests for the product **edit page /
  edit form** or the **"allow to purchase" (change-status)** toggle. That page is
  being removed; the change-status control lives only inside it. Products coverage
  = the **list + opening a product** only.
- **Out of scope — Orders:** owned separately; covered elsewhere.

## Conventions (apply everywhere — not repeated per case)

- **Permission-gated:** a section's tile/tab is hidden without its view permission;
  `SUPER_ADMIN` sees everything; opening a section without its view permission
  shows an **Access Denied** message. Client gating is UX only.
- **Standard states:** wherever there's a list or form, verify **Loading**,
  **Empty**, and **Error + Retry**.
- **Success flag:** responses carry `{ success }` — treat `success:false` as a
  failure even on HTTP 200.

### Permission map (view / write per section)

| Section | View | Write / actions |
|---------|------|-----------------|
| Products (list) | any of `READ_PRODUCTS`,`CREATE_PRODUCT`,`UPDATE_PRODUCT`,`CHANGE_PRODUCT_STATUS` | — (list only) |
| Gallery | `READ_PRODUCT_IMAGES` | `UPLOAD_PRODUCT_IMAGES`, `DELETE_PRODUCT_IMAGES` |
| Comments | `READ_COMMENTS` | `REPLY_COMMENT`, `EDIT_REPLY`, `DELETE_REPLY` |
| Stories | `READ_STORY` | `CREATE_STORY`, `DELETE_STORY` |
| Shop Info | `READ_SHOP_INFO` | `UPDATE_SHOP_INFO` |
| Team | any `*_EMPLOYEES` or `USER_MANAGEMENT_ACCESS` | invite/role/remove (Change-role & Remove shown only to `SUPER_ADMIN`) |
| Boutiques | any `*_BUTIKS` | — (read-only) |
| Excel | `CREATE_PRODUCT` or `UPDATE_PRODUCT` | upload/process |
| Orders *(out of scope)* | any `*_ORDERS` | — |
| Permissions tab | always visible | — |

`SUPER_ADMIN` bypasses every check.

---

## 1. Dashboard shell & permissions

- Shop list loads → skeletons, then one card per shop (name, seller id, role /
  permission-count badge).
- Empty shops → **"No shops available"** (no redirect).
- "Enter Dashboard" → navigates to that shop's dashboard.
- Leave shop from a card → confirm → card removed; failure surfaces inline.
- Bootstrap uses context permissions if present, else fetches permissions for the
  seller id; while loading → **"Preparing your dashboard…"**.
- Open dashboard for a seller id not in the user's shops → falls back to a generic
  label, no crash, no redirect.
- Shop switcher (side menu) opens/closes via toggle, outside-click, and Escape;
  lazy-loads product/boutique counts + role on first open.
- Tile/tab visible only with its permission (see map); `SUPER_ADMIN` → all tiles +
  "Super Admin" badge; no permissions → only the Permissions tile.
- Back: from an open tab → returns to home grid; from home → exits to the shop
  list.

## 2. Products (list only — edit page ignored)

- Visible with any PRODUCTS permission; otherwise Access Denied.
- List loads page 1 → cards (image or placeholder, category, name, price, stock
  badge, social stats); pagination when `last_page > 1`.
- Click a card → navigates to the product page. *(The edit page itself is out of
  scope.)*
- Empty → "No products found"; a fetch error with a list already shown keeps the
  list; error with empty list → Error + Retry.
- Social stats: show "—" while pending; if `READ_COMMENTS` is missing they degrade
  to 0 and never block the grid.
- Badges: `status===1` → Active (green) else Inactive; stock `0` → Out of stock
  (red), `≤5` amber, else grey; missing price/image handled gracefully.

## 3. Gallery (product images)

- Upload controls shown only with `UPLOAD_PRODUCT_IMAGES`; select/delete controls
  only with `DELETE_PRODUCT_IMAGES`; browsing works with view only.
- Browse loads (60/page); pagination when `last_page > 1`.
- View → lightbox open/close. Copy URL → clipboard + transient "Copied!".
- Upload: pick files / folder / drag-drop → confirm modal with previews → Upload →
  grid refetches page 1.
- Delete single (hover → confirm → removed); bulk (Select mode → tick → Delete(N)
  → confirm → removed, mode exits); Select-all / Deselect-all; Cancel clears.
- Validation: non-image files filtered out; an all-non-image selection doesn't open
  the modal; upload/delete failure → error shown, selection preserved.
- States: Empty "No images found"; Loading; per-action spinners (uploading /
  deleting).

## 4. Comments & Reviews

- FAQ item with **no** reply + `REPLY_COMMENT` → Reply button; without the perm →
  no button. Item **with** a reply → Edit / Delete buttons only with
  `EDIT_REPLY` / `DELETE_REPLY`. Reviews sub-tab has **no** reply UI at all.
- Default FAQ tab loads; switching to Reviews refetches and resets to page 1;
  Load More appends the next page.
- Reply → modal (quotes comment) → submit → item flips to "has reply" and shows the
  reply block.
- Edit → modal prefilled → submit → reply text updates.
- Delete → confirm → reply removed, row reverts to "Waiting Seller Reply…";
  "Deleting…" while pending.
- Reaction totals shown on comment and reply; review rating shown read-only.
- Validation: empty/whitespace reply blocked (submit disabled); a failed action
  makes no local change. *(The 1000-char reply cap is enforced server-side — no
  client maxLength.)*
- Empty → "No comments found" (both tabs); Loading state; Load More has its own
  spinner.

## 5. Seller Stories

- "Add Story" only with `CREATE_STORY`; per-card Delete only with `DELETE_STORY`.
- List loads page 1 + total badge; Prev/Next pagination.
- Open a story → viewer (image, or autoplaying video) with link / linked product /
  viewers / date; close via backdrop or button.
- Create image story: pick → crop → preview → Share → success + list refetch.
  Video story (≤ 60s, ≤ 10 MB); optionally with a link and a linked product.
- Delete → confirm → removed; Cancel → no change.
- Validation: SVG rejected; file > 10 MB rejected; video > 60s rejected; a link
  without a scheme is normalized to `https://`; an invalid link → inline error +
  Share disabled; empty link → saved as null; no file → Share disabled;
  upload/save failure → error, modal stays open.
- Empty → "No stories yet"; Loading state; product picker has its own
  load-more/empty states.

## 6. Shop Info

- Without `UPDATE_SHOP_INFO` → read-only (lock badge, disabled inputs, no Save);
  with it → editable + Save.
- Load populates name, contact, address, logo, banner.
- Save with no new media → keeps existing logo/banner → success. Save with a new
  logo and/or banner (crop → preview → upload → save) → success.
- Validation: name, address, contact all required; contact must match `^\+?\d+$`;
  a field's error clears on change; upload/save failure → "Failed to update".
- States: loading skeletons; no logo → monogram; no banner → placeholder.

## 7. Team management (members & roles)

- Add-user form only with `USER_MANAGEMENT_ACCESS` / `SUPER_ADMIN`; members table
  only with a read-employees permission; **Change-role** and **Remove** per member
  only for `SUPER_ADMIN`; **Leave shop** only on the current user's own row.
- Members list + total count; "Load more" when more pages exist.
- Role picker loads; debounced search (~400ms); "Load more roles"; selecting a role
  fills the field.
- Invite with valid phone + role → success, form resets, list refetches.
- Change a member's role (SUPER_ADMIN) → dropdown → pick → row updates inline.
- Remove a member (SUPER_ADMIN) → removed. Leave shop → leave action fires
  *(note: no auto-redirect afterwards yet)*.
- Validation: empty phone or role → "Please fill in all fields" (button disabled);
  invalid phone → backend error inline; failed change/remove → inline error, no
  change.
- Empty → "No users found" / "No roles found"; loading states.
- Role field shape varies (`role.name` / `role_name` / string) — render must
  tolerate all.

## 8. Boutiques (read-only)

- Visible with any BOUTIQUES permission; **read-only** — no create/edit/delete/
  status controls.
- List grid: icon (or placeholder), name, status badge, description (HTML stripped,
  truncated), slug chip.
- Empty → "No boutiques found"; Loading; Error + Retry.
- Badges: `status===1` → Active else Inactive (none if undefined); missing icon /
  description / slug all handled.

## 9. Excel bulk upload

- Visible only with `CREATE_PRODUCT` or `UPDATE_PRODUCT`.
- On open: categories + uploaded-files table both fetch.
- Pick a category → Download Template enabled → downloads the `.xlsx` (binary file).
- Select a valid Excel file → shows name + size; Upload → uploads then processes →
  success + files table refetch.
- Files table: name, id, status badge (uploaded / processing / completed / failed),
  date, actions; Refresh; Notes modal when a file has processing notes.
- Validation: category with no template → error banner; wrong file type rejected;
  Upload with no file → "No file selected"; upload/process failure → error;
  categories/files fetch failure → Retry.
- Empty → "No files uploaded yet"; loading states; Download disabled until a
  category is picked; Upload disabled until a valid file is chosen.
- Status transitions (uploaded → processing → completed/failed) reflect on refresh;
  Notes button disabled when there are none.
