# Shop Info Tab — Tester Guide

A simple, non‑technical walkthrough for testing the **Shop Info** tab inside the Seller Dashboard. You do **not** need any coding knowledge to follow this guide.

---

## 1. What is this feature?

Every shop (seller) has a **Shop Info** screen where the shop's basic details can be viewed and edited:

- **Shop Name**
- **Contact number**
- **Address**
- **Shop Image** (the shop logo)
- **Shop Banner** (the wide cover picture)

This guide explains how to open that screen and what to check to make sure everything works.

---

## 2. Who can see and use it?

Access is controlled by **permissions** assigned to the logged‑in user for that shop:

| Permission | What it allows |
| --- | --- |
| `READ_SHOP_INFO` | The user can **see** the Shop Info tab and the saved details. |
| `UPDATE_SHOP_INFO` | The user can **edit and save** changes (the **Update** button appears). |

What this means when testing:

- A user **without** `READ_SHOP_INFO` will **not** see the "Shop Info" menu item at all.
- A user **with** `READ_SHOP_INFO` but **without** `UPDATE_SHOP_INFO` can **view** the info, but the fields are greyed out and there is **no Update button** (read‑only).
- A user **with both** permissions can view **and** save changes.
- A **Super Admin** automatically has access to everything.

> ✅ **Test tip:** Ask for three test accounts — one with no shop‑info permission, one with read‑only, and one with full edit — to confirm each behaves as described above.

---

## 3. How to open the Shop Info tab

1. Log in with a seller account that has access to a shop.
2. Go to the **Seller Profile / Seller Dashboard**.
3. Click the **menu button** (the ☰ icon near the shop name at the top).
4. In the side menu, click **🏠 Shop Info**.
5. The "Edit Shop Info" screen opens.

While it loads you'll briefly see grey placeholder boxes (loading skeletons) — this is normal.

---

## 4. What you should see

When the screen finishes loading, the shop's current details appear:

- **Shop Name** field — filled with the saved name.
- **Contact** field — filled with the saved phone number.
- **Address** box — filled with the saved address.
- **Upload Image** area — shows the current shop logo (or "Preview" if none).
- **Upload Banner** area — shows the current banner (or "Preview" if none).

---

## 5. Test scenarios

### A. View the existing info (READ_SHOP_INFO)
1. Open the Shop Info tab.
2. **Check:** the name, contact, address, image and banner match what is saved for the shop.

### B. Edit the text fields (UPDATE_SHOP_INFO)
1. Change the **Shop Name**, **Contact**, and **Address**.
2. Click **Update**.
3. **Check:** a success message appears: *"Shop Info Updated Successfully!"*
4. Refresh the page and re‑open the tab.
5. **Check:** your changes are still there.

### C. Upload a new shop image
1. Click **Browse** next to "Upload Image".
2. Pick any picture from your computer.
3. A **crop window** opens — adjust the crop and confirm/save.
4. **Check:** the chosen picture now appears in the square preview box.
5. Click **Update**.
6. **Check:** success message appears, and after refreshing the new image is still shown.

### D. Upload a new banner
1. Click **Browse** next to "Upload Banner".
2. Pick a wide picture (recommended ratio **6:1**).
3. Crop and confirm in the crop window.
4. **Check:** the banner preview updates.
5. Click **Update** and confirm it saves after a refresh.

### E. Update only some fields
1. Change **only** the name (don't touch the images).
2. Click **Update**.
3. **Check:** the name is saved **and** the existing image/banner are still there (they should not disappear).

### F. Validation (required fields)
Try saving with bad data and confirm friendly red error messages appear and saving is blocked:

| What you do | Expected message |
| --- | --- |
| Leave **Shop Name** empty → Update | "Shop Name is required" |
| Leave **Contact** empty → Update | "Contact is required" |
| Type letters in **Contact** (e.g. `abc123`) → Update | "Contact must contain valid numbers" |
| Leave **Address** empty → Update | "Address is required" |

> ℹ️ The **Contact** number should be entered **with the country code and digits only** — for example, for the UAE use `971...` (no `+`, no spaces).

### G. Read‑only user (no UPDATE_SHOP_INFO)
1. Log in as a user who can **view but not edit**.
2. Open the Shop Info tab.
3. **Check:** all fields are greyed out / not editable, and there is **no Update button**.

### H. No access user (no READ_SHOP_INFO)
1. Log in as a user without shop‑info permission.
2. **Check:** the **🏠 Shop Info** menu item does **not** appear.

---

## 6. Language testing

The app supports **English, Arabic, Turkish, and Kurdish**.

1. Switch the app language.
2. Re‑open the Shop Info tab.
3. **Check:** labels (Shop Name, Contact, Address, buttons, error messages) appear translated, and Arabic/Kurdish display correctly right‑to‑left.

---

## 7. What to report if something looks wrong

When raising a bug, please include:

- The **account** used and its **permissions** (read‑only, full edit, super admin, etc.).
- The **shop** (Seller ID — shown at the bottom of the side menu).
- The **language** you were testing in.
- The **steps** you took.
- What you **expected** vs. what **actually happened**.
- A **screenshot** if possible (especially of the field and any error message).

---

## 8. Quick checklist

- [ ] Shop Info menu item appears for users with read permission.
- [ ] Existing name, contact, address, image, banner load correctly.
- [ ] Editing and saving text works and persists after refresh.
- [ ] New image uploads, crops, previews, and saves.
- [ ] New banner uploads, crops, previews, and saves.
- [ ] Updating one field keeps the other (unchanged) values intact.
- [ ] Required‑field and number‑only validations show correct messages.
- [ ] Read‑only users cannot edit (no Update button).
- [ ] Users without permission don't see the tab.
- [ ] All four languages display correctly.
