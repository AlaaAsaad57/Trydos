# Permissions Tab — Tester Guide

How to test the **Permissions** section inside the Seller Dashboard. No coding
needed. Everything here was read from the code, not from older docs.

Source files:
`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`
(`renderPermissions`, `showRoleInfo`, `PERMISSION_GROUPS`) and
`services/sellerDashboard/index.ts`.

---

## 1. What it is

A **read-only** screen. It shows two things:

1. **Your role** in this shop (one banner at the top).
2. **Your permissions** for this shop, sorted into groups, shown as blue chips.

You cannot change anything here. There are no buttons except the **Retry**
button that appears when loading fails.

It shows **your own** access only. There is no way to look at another user's
permissions from this screen.

---

## 2. How to open it

1. Sign in with an account that belongs to a shop.
2. Open **Seller Profile** → pick a shop → **Enter Dashboard**.
3. Open the side menu (☰ next to the shop name) and click **Permissions**, or
   click the **Permissions** tile on the dashboard home page.

The URL becomes:

```
/sy-en/sellerProfile/sellerDashboard/<sellerId>?tab=permissions
```

Use the `sy-en` locale when you type a URL by hand. `gb-en` opens the region
picker on top of the page.

---

## 3. Who can open it — important

**Everybody.** The menu item and the home tile are always shown (`show: true`),
and the screen itself has **no permission check**. A user with zero permissions
still opens this tab and sees the "No permissions assigned" message.

This is on purpose and is different from every other tab. Do not report the tab
being visible as a bug.

---

## 4. What you should see

### The role banner

| Case | What shows |
| --- | --- |
| You have `SUPER_ADMIN` | Dark grey card, star icon, **"Super Admin"** + "You have full access to all features" |
| Any other role | Light grey card with your role name + "Your role in this shop" |
| The backend sent no role name | The same light grey card, reading **"Member"** |

The role name comes from the same answer as the permissions, so the banner and
the permission chips always appear together.

### The permission chips

Each group is one white card with a heading and blue chips inside. A chip is the
permission name with the underscores removed and each word capitalised:
`READ_PRODUCTS` → **"Read Products"**.

An unknown permission (one the app does not know) goes into the **OTHER** group.
It is never dropped.

---

## 5. Group map — what belongs where

Use this to check the grouping is right. This is the full list in the code.

| Group heading | Permissions |
| --- | --- |
| Products | READ_PRODUCTS, CREATE_PRODUCT, UPDATE_PRODUCT, CHANGE_PRODUCT_STATUS |
| Boutiques | READ_BUTIKS, CREATE_BUTIKS, UPDATE_BUTIKS, DELETE_BUTIKS, CHANGE_BOUTIQUE_STATUS |
| Locations | READ_LOCATIONS, CREATE_LOCATION, UPDATE_LOCATION, CHANGE_LOCATION_STATUS |
| Categories | READ / CREATE / UPDATE / DELETE_CATEGORIES, CHANGE_CATEGORY_STATUS |
| Brands | READ / CREATE / UPDATE / DELETE_BRANDS, CHANGE_BRAND_STATUS |
| Orders | READ_ORDERS, UPDATE_ORDER_INFO, CHANGE_ORDER_STATUS, READ_ORDER_PAYMENTS, CONFIRM_ORDER_PAYMENT, REFUND_ORDER_PAYMENT, CANCEL_ORDER, ASSIGN_SHIPPING, UPDATE_TRACKING, CHANGE_ORDER_STATUS_PACKAGED, CHANGE_ORDER_STATUS_CANCELED |
| Employees | READ / CREATE / UPDATE / DELETE_EMPLOYEES |
| Roles | READ / CREATE / UPDATE / DELETE_ROLES |
| Job Titles, Offices, Departments, Work Forms | READ / CREATE / UPDATE / DELETE of each |
| Languages, Currencies, Shipping, Countries | READ / CREATE / UPDATE / DELETE of each |
| Shop Info | READ_SHOP_INFO, UPDATE_SHOP_INFO |
| Product Images | READ_PRODUCT_IMAGES, UPLOAD_PRODUCT_IMAGES, DELETE_PRODUCT_IMAGES |
| Stories | READ_STORY, CREATE_STORY, DELETE_STORY |
| Comments | READ_COMMENTS, REPLY_COMMENT, EDIT_REPLY, DELETE_REPLY |
| Admin | SUPER_ADMIN, USER_MANAGEMENT_ACCESS |
| Other | anything not listed above |

**Cross-check with the menu.** The chips must agree with the tabs the user can
open. If a chip says "Read Story" but there is no **Stories** item in the side
menu, that is a real bug. Report it with both screenshots.

---

## 6. Test scenarios

### A. Super Admin

1. Open the tab with a Super Admin account.
2. **Check:** dark grey "Super Admin" banner.
3. **Check:** an **Admin** card with a "Super Admin" chip.
4. **Check:** every dashboard tab is in the side menu.

### B. Normal role, few permissions

1. Open with an account that has, for example, only story permissions.
2. **Check:** the light grey banner shows the role name, not "Super Admin".
3. **Check:** only the groups for the permissions the user really has appear.
   No empty group cards.

### C. Zero permissions

1. Open with an account that is in the shop but has no permission at all.
2. **Check:** the message **"No permissions assigned"** with an icon.
3. **Check:** no error, and no spinner left on the screen.

### D. Loading

1. Slow the network (DevTools → Network → Slow 3G) and open the tab.
2. **Check:** grey placeholder rows first, then the content. Never an empty
   screen, and never "No permissions assigned" before the answer arrives.

### E. Failure and Retry

1. Make the backend answer with `success: false`, or use a shop id that the
   backend does not return in the list.
2. **Check:** an error card with the backend message and a **Retry** button.
3. Click **Retry**. **Check:** the request runs again and the content appears.

> **Trap:** a **403** does not show this card. The app reads it as "this account
> does not have this shop" and sends the user to the storefront **home page**. A
> 500 or a 503 does show the card.

### F. Switching shops

1. Open Permissions in shop A and note the chips.
2. Go back, enter shop B, open Permissions.
3. **Check:** the chips and the role belong to shop B. Nothing is left over
   from shop A.

### G. Language

1. Repeat with `sy-ar` (Arabic), `sy-tr` and `sy-ku`.
2. **Check:** the layout flips to right-to-left in Arabic and Kurdish.
3. **Check:** which words stay in English. See section 7.

### H. Back button

1. Open the Permissions tab, then press the browser **Back** button.
2. **Check:** you leave the dashboard. The tab is written to the URL with
   `replace`, so Back does **not** return you to the dashboard home. This is by
   design.

---

## 7. Just fixed — please check these first

Five problems were found in the code and fixed. Each one has a unit test, so
these are regression checks: confirm the good behaviour, and report anything
that still looks like the old one.

1. **Group headings were raw keys in English.** Sixteen of the twenty-two groups
   printed their key in capitals — **PRODUCTS**, **ORDERS**, **EMPLOYEES** — with
   only six having a readable label. Now every group has one. Check every
   heading in the table in section 5 reads as normal words.
   *Note for Arabic, Turkish and Kurdish:* most of those groups already read
   correctly in those three languages, so the visible change there is smaller.
   The one that leaked English everywhere was **Comments**.

2. **The role banner could spin forever.** The role name came only from the shop
   list, so opening the dashboard by URL (a pasted link, or a reload on this tab)
   left a spinner where the banner should be. The role now arrives with the
   permissions. **Test it:** copy the tab URL, open it in a new tab, and check the
   banner appears at the same moment as the chips.

3. **The header badge said "Member".** In that same case the badge at the top of
   the page fell back to "Member" although the role was known. It now shows the
   role. **Test it:** in that new tab, the badge and the banner must agree.

4. **A broken backend threw the seller off the page.** Any failed dashboard read
   sent the browser to the storefront home. Now only a **4xx refusal** does that —
   which is the case it was written for, "this seller does not have this shop". A
   **5xx or 429** keeps the seller on the page and shows the error card with the
   Retry button. **Test it:** a 500 must leave you on the dashboard.

5. **Twelve permission chips had no translation** (the Locations, Shop Info and
   Product Images ones, plus Read Story, Read Comments and Reply Comment). They
   are now in all three files. Check they read in Arabic, Turkish and Kurdish.

While fixing 1 and 5, two translation entries were found swapped: `"Products"`
held a Kurdish word in the Turkish file and a Turkish word in the Kurdish file.
Both were corrected, so the word "Products" may look different from before
anywhere else in the app that uses it.

## 8. Still worth reporting

- **A 403 still sends you to the storefront home.** That is on purpose: it means
  the backend says this account does not have this shop. Report it only if it
  happens to an account that *does* have the shop.
- **Kurdish wording.** The Kurdish file uses two different words for comments,
  and the "Other" group heading reads **"ئەتر"**. Both are older entries this work
  did not touch. Please have a Kurdish speaker confirm them.
- **Any chip that stays in English** in Arabic, Turkish or Kurdish. Name the chip.

---

## 9. Where the data comes from (for reporting a bug)

| Item | Value |
| --- | --- |
| Endpoint | `GET /shop/auth/permissions` on the **core** (`market`) backend |
| How it is sent | Through `/api/proxy`, with the shop id in the `x-seller-id` header |
| Request code | `147` (`GET_SELLER_PERMISSIONS`) |

Two things to know before you report a problem:

- **The page often does not call the API at all.** If the shop list already
  carries the permissions for this shop, the page reuses them and makes no
  request. To force the real call, open the dashboard URL directly in a new tab.
- **The shop list calls the same endpoint** without the `x-seller-id` header
  (request `GET_SHOPES_FOR_SELLER`). If you see two calls to the same URL in the
  Network tab, that is why.

On a slow or overloaded backend (502, 503, 504, 429) the app retries up to three
times, waiting 1 second and then 2 seconds. So a failure can take about 5 seconds
to appear. That is not a hang.

**In every bug report include:** the account, the shop id (shown as "Seller ID:"
in the page header), the language, the full URL, and the `/api/proxy` entry from
the Network tab with its response.
