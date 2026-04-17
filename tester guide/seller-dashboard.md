# Seller Dashboard — Tester Guide

## Overview

The Seller Dashboard is a role-protected internal tool that lets seller team members manage their shop's products, boutiques, users, and orders. Access is strictly gated by permissions assigned to each user on a per-shop basis.

---

## How to Access It

1. Log in as a user who has been added to at least one shop.
2. Go to **Settings** (bottom nav or profile menu).
3. A button **"Go to Seller Dashboard"** appears — tap it.
   - If the user has no shop access, the button shows **"Become A Seller At Trydos"** instead. Tapping it opens the "become a seller" modal.
4. The **Store Selection** screen loads. It shows a table of all shops the current user belongs to.

---

## Page 1: Store Selection (`/[lang]/sellerProfile`)

### What to test

| Scenario                      | Expected result                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| User has shops assigned       | Table shows Shop Name, Seller ID, and action buttons                                   |
| User has no shops             | Message: "No shops available"                                                          |
| Loading state                 | Spinner + "Loading..." text next to it                                                 |
| Tap **Enter** on a shop       | Navigate to that shop's dashboard (`/[lang]/sellerProfile/sellerDashboard/[sellerId]`) |
| Tap **Leave** on a shop       | Confirmation modal appears                                                             |
| Confirm leave in the modal    | Shop is removed from the list (no page reload needed)                                  |
| Cancel leave in the modal     | Modal closes, shop stays in the list                                                   |
| Leave API fails               | Red error message shown inside the modal                                               |
| Click outside the leave modal | Modal closes                                                                           |

---

## Page 2: Seller Dashboard (`/[lang]/sellerProfile/sellerDashboard/[sellerId]`)

### Layout

- A **Back bar** at the top links back to the Store Selection page.
- The **shop name** and **Seller ID** are displayed in the header.
- A **hamburger menu** (☰) in the header opens a sliding side drawer with all available tabs.
- The drawer only shows tabs the current user has permission to access.
- The dashboard footer inside the drawer shows the current Seller ID.

### Permissions loaded on entry

When entering this page, permissions for the current shop are loaded either from the cached shop list or from the API. All tab visibility is derived from these permissions:

| Permission group required                                                                            | Tab shown   |
| ---------------------------------------------------------------------------------------------------- | ----------- |
| Any of `READ_PRODUCTS`, `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `CHANGE_PRODUCT_STATUS`                  | Products    |
| Any of `READ_BUTIKS`, `CREATE_BUTIKS`, `UPDATE_BUTIKS`, `DELETE_BUTIKS`, `CHANGE_BOUTIQUE_STATUS`    | Boutiques   |
| Any of `SUPER_ADMIN`, `USER_MANAGEMENT_ACCESS`, `READ_ROLES`, `READ_EMPLOYEES`, `CREATE_ROLES`, etc. | Permissions |
| Any from Employees group OR `USER_MANAGEMENT_ACCESS` OR `SUPER_ADMIN`                                | Users       |
| Any of `READ_ORDERS`, `UPDATE_ORDER_INFO`, `CHANGE_ORDER_STATUS`, etc.                               | Orders      |

> If a user opens a tab they lack full access to, the content area shows an **"Access Denied"** message.

---

## Tab: Products 📦

Requires any product-related permission.

### What to test

| Scenario                  | Expected result                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Products load on tab open | Grid of product cards loads (spinner shown while loading)                             |
| Product card content      | Shows product image, name, category, unit price, current stock, Active/Inactive badge |
| Product has no image      | Placeholder "No Image" shown in the card                                              |
| Product is inactive       | Badge shows grey "Inactive"                                                           |
| Product is active         | Badge shows green "Active"                                                            |
| Empty products list       | Message: "No products found"                                                          |
| API error                 | Red error message + "Retry" button                                                    |
| Retry works               | Tapping "Retry" re-fetches products                                                   |
| Multiple pages exist      | Pagination controls appear: Previous / "Page X of Y" / Next                           |
| Previous on page 1        | Button is disabled                                                                    |
| Next on last page         | Button is disabled                                                                    |
| Navigate to next page     | Products update to next page; page counter updates                                    |

---

## Tab: Boutiques 🏪

Requires any boutique-related permission.

### What to test

| Scenario                          | Expected result                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Boutiques load on tab open        | Grid of boutique cards loads                                                              |
| Boutique card content             | Shows icon/image, name, Active/Inactive badge, description (truncated at 100 chars), slug |
| Boutique has no image             | Placeholder "No Image" shown                                                              |
| Description longer than 100 chars | Truncated with "..."                                                                      |
| Empty boutiques list              | Message: "No boutiques found"                                                             |
| API error                         | Red error message + "Retry" button                                                        |

---

## Tab: Permissions 🔐

Requires any Admin, Roles, or Employees permission (or `SUPER_ADMIN`).

### What to test

| Scenario                  | Expected result                                                                 |
| ------------------------- | ------------------------------------------------------------------------------- |
| Tab opens for Super Admin | Blue-purple banner at top: "Super Admin — You have full access to all features" |
| Normal permission user    | No Super Admin banner; permissions grouped by category                          |
| Permission groups shown   | E.g. PRODUCTS, BOUTIQUES, ORDERS, EMPLOYEES, ROLES, etc. as separate cards      |
| Permission color coding   | READ = blue, CREATE = green, UPDATE = yellow, DELETE = red, other = grey        |
| No permissions assigned   | Message: "No permissions assigned"                                              |
| API error                 | Red error message + "Retry" button                                              |

---

## Tab: Users 👥

Only visible if user has `USER_MANAGEMENT_ACCESS`, `SUPER_ADMIN`, or any Employee permission. However, **adding, deleting, and changing roles** requires `SUPER_ADMIN`.

### Sub-section: Add User Form

| Scenario                       | Expected result                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Phone field empty              | "Add User" button is disabled                                                  |
| Role not selected              | "Add User" button is disabled                                                  |
| Valid phone format             | e.g. `+9611234567` (format hint shown under field)                             |
| Search roles                   | Typing in the Role field filters roles via API (400ms debounce)                |
| Role dropdown appears on focus | Roles list dropdown opens                                                      |
| Select a role from dropdown    | Role name fills the input; role_id stored internally                           |
| Roles paginated                | "Load more roles" button appears if more exist                                 |
| No roles found                 | Message "No roles found" in dropdown                                           |
| Submit with valid data         | Request sent; on success: green "User added successfully!" banner, form resets |
| Submit fails                   | Red error message shown in form                                                |
| Seller ID field                | Pre-filled, read-only, cannot be changed                                       |

### Sub-section: Users List

| Scenario                           | Expected result                                                           |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Users load                         | Table shows Name/Phone and Role columns                                   |
| No users found                     | Message: "No users found"                                                 |
| Super Admin — Change role button   | Appears next to each user's role name                                     |
| Tap "Change role"                  | Dropdown opens with searchable role list                                  |
| Search in change-role dropdown     | Filters roles via API (400ms debounce)                                    |
| Select new role                    | API call to update role; user row updates with new role name immediately  |
| Click outside change-role dropdown | Dropdown closes                                                           |
| Escape key on dropdown             | Dropdown closes                                                           |
| Super Admin — Delete button        | Red "Delete" button shown per user                                        |
| Confirm delete                     | User removed from list immediately (no confirm modal — fires immediately) |
| Current logged-in user row         | Shows "Leave Shop" button (yellow) for that user only                     |
| Tap "Leave Shop"                   | API call to leave shop                                                    |
| More users available               | "Load more" button at bottom of table                                     |

---

## Tab: Orders 📊

Requires any order-related permission (e.g. `READ_ORDERS`).

### Order List Screen

| Scenario               | Expected result                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Tab opens              | Orders list loads with spinner                                                                                       |
| Filter tabs visible    | All · In Progress · Collected · Returned · Cancelled                                                                 |
| Default filter         | "All" tab selected                                                                                                   |
| Tap a filter tab       | Orders re-fetch with that status filter; tab highlights                                                              |
| Loading state          | Spinner + "Loading orders..."                                                                                        |
| Empty orders list      | Message: "No orders found"                                                                                           |
| API error              | Red error message + "Retry" button                                                                                   |
| Each order card shows  | Timestamp, remaining time (if > 0), Order ID, status label, item count, total amount (USD), product images (up to 4) |
| Remaining time display | Shows e.g. "30m" or "2h 15m" in blue next to timestamp                                                               |
| No remaining time      | Blue remaining time label not shown                                                                                  |
| Product images in card | Up to 4 product thumbnails shown horizontally                                                                        |
| No images              | Placeholder "No items" shown                                                                                         |
| Tap an order card      | Navigates to Order Detail Screen                                                                                     |

### Real-time order updates

| Scenario                                | Expected result                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| A new order is placed by a customer     | New order appears at the top of the list automatically (via push notification) |
| An existing order is updated externally | Order card refreshes in list and detail screens automatically                  |
| `shouldUpdateOrders` triggers           | Full order list re-fetches from API                                            |

### Order Detail Screen

Tap any order card in the list to enter Order Detail.

| Scenario             | Expected result                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Header               | Back button (←), "Order Details" title with bag icon                                                           |
| Stats grid (top row) | Order Number, Order Date, Order Invoice (total in USD)                                                         |
| Action status card   | Shows Collect Type + pipeline icons (Confirm → Pack → Collect → Collected) with active steps highlighted black |
| Duration card        | "Remaining Xh Ym" in blue, or "No remaining time" if expired                                                   |
| Orders summary card  | Item count, Confirmed X/Y, Packed X/Y, Collected X/Y                                                           |
| Back button          | Returns to Order List                                                                                          |

### Per-item actions

Each item in the detail screen goes through a 3-step lifecycle: **Pending → Confirmed → Packed → Ready to Collect**

| Item state               | Buttons shown                                                     | Expected action                                                           |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Pending (not confirmed)  | "Confirm & Start Backing" (blue outline) + "Cancel" (red outline) | Confirm → item marked `is_confirm: true`; Cancel → item removed from list |
| Confirmed but not packed | "Packed" (purple)                                                 | Pack → item marked `is_packed: true`                                      |
| Packed                   | "Ready To Collect" (blue, read-only)                              | No action; display only                                                   |

| Scenario                        | Expected result                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Tap "Confirm & Start Backing"   | Button shows "Updating...", item switches to Confirmed state                                        |
| Tap "Cancel" on item            | Item is removed from the detail screen (quantity decremented to 0)                                  |
| Tap "Packed"                    | Button shows "Updating...", item switches to Packed state                                           |
| Action while another is loading | Buttons show loading / disabled state                                                               |
| Item has no image               | Placeholder "No image" shown                                                                        |
| Item shows                      | Brand name, product name, Color, Size, Product ID, Quantity, unit price / order total, Status label |

---

## Error & Edge Cases

| Case                                                                                           | Expected result                                                                  |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Network request fails on any tab                                                               | Red error message shown within the relevant section                              |
| Permissions load fails                                                                         | Fallback to cached shop permissions if available; error message otherwise        |
| User navigates directly to `/sellerProfile/sellerDashboard/[sellerId]` without a valid session | Should redirect or show appropriate error                                        |
| `sellerId` in URL does not match any shop the user belongs to                                  | "Access Denied" or empty state across all tabs                                   |
| Rapid tab switching                                                                            | Each tab only fetches data once (already-loaded tabs don't re-fetch on re-visit) |

---

## URL Structure

| Screen           | URL                                                |
| ---------------- | -------------------------------------------------- |
| Store Selection  | `/{lang}/sellerProfile`                            |
| Seller Dashboard | `/{lang}/sellerProfile/sellerDashboard/{sellerId}` |

`{lang}` format: `{country}-{language}` e.g. `sy-en`, `lb-ar`
