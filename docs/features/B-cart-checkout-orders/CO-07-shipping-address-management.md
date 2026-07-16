# CO-07 — Shipping Address Management

| | |
|---|---|
| **Feature ID** | CO-07 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-05 (against `develop`) |
| **Source of truth** | `components/Cart/ShippingAddressContainer.tsx`, `components/Cart/AddressListContainer.tsx`, `components/Cart/AddAddressForm.tsx`, `services/order.ts`, `store/Cart/reducer.ts` |

---

## What it is

The **delivery-address step** of checkout — where a shopper picks which saved address an order ships
to, or adds, edits, deletes and sets a **default** address. The default address is the one the order
is actually placed against.

## Where it appears

Inside the **checkout pane** of the cart slide-over (CO-03 → `OrdersPage`): a shipping-address
summary card, an "all my addresses" bottom-sheet chooser, and an add/edit address form. The same
components are reused in **Settings** (personal-info address modal) and when **changing an existing
order's address** (CO-19).

## Who uses it

Any shopper placing an order. Guests can add an address too (they're also prompted for a name).

## How it works (verified behaviour)

- **Choosing / setting default.** The address list shows every saved address; tapping one sets it as
  default (server-side), and the checkout uses the default (`is_default === 1`) address.
- **Adding.** The form collects an address title (e.g. "Home"), a detailed address + note, the
  region (CO-08), a map pin (CO-08), and contact details (name, phone, optional alternative phone).
  Phone is sanitised; required fields (detail, title, region, contact name, phone ≥ 5 chars) shake
  if empty. A guest-supplied name also updates the account name.
- **Editing.** Edit pre-fills the form from the saved address and saves back with its id; the button
  reads "Edit & Save".
- **Deleting.** A confirmation modal precedes deletion.
- **Country is fixed from the store locale** (shown read-only) — there is no country dropdown; you
  choose region/city within that country via the region picker (CO-08).

## Data source

| Item | Value |
|------|-------|
| List addresses | `GET /customer/address/list` — `order.GetAddressList` |
| Add | `POST /customer/address/add` — `order.AddAddressList` |
| Edit | `POST /customer/address/update` — `order.UpdateAddressList` |
| Delete | `POST /customer/address/delete?address_id=…` — `order.DeleteAddressList` |
| Set default | `POST /customer/address/set-default` — `{ address_id }` — `order.SetDefault` |
| Used at checkout | `POST /customer/order/checkout…?address_id={defaultId}` — `order.PlaceOrder` |
| Backend | **Legacy backend** (`NEXT_PUBLIC_BACKEND_URL`) — `/customer/address/*` is not on the Go allow-list; token injected via `/api/proxy` |

## Technical reference

| Item | Value |
|------|-------|
| Summary card | `components/Cart/ShippingAddressContainer.tsx` |
| Address chooser | `components/Cart/AddressListContainer.tsx` (per-row edit / delete / select) |
| Add / edit form | `components/Cart/AddAddressForm.tsx` |
| Orchestration | `components/Cart/OrdersPage.tsx` (slides + delete modal) |
| Service | `services/order.ts` — `GetAddressList` / `AddAddressList` / `UpdateAddressList` / `DeleteAddressList` / `SetDefault` |
| Store | `store/Cart/reducer.ts` — `addressLists`, `addressDetails`, `setAddressList`, `addAddress`, `startUpdateAddress`, `updateAddress`, `setDefaultAddress`, `deleteAddress` |
| Request codes | `utils/Requests.ts` (address block) |

## Current status & maturity

**Live and stable.** Full add / edit / delete / choose-default lifecycle wired to the backend, and
reused across checkout, settings and order-address changes.

## Known gaps / notes

No dedicated gaps found..

## Related features

CO-08 (Region / map picker — the region + pin captured in this form) · CO-11 (Place order — uses the
default address) · CO-19 (Change delivery address — reuses these components) · AC-23 (Saved
addresses in Settings).
