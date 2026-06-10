# Image Gallery Tab — Tester Guide

A simple, non‑technical walkthrough for testing the **Gallery** tab inside the Seller Dashboard. You do **not** need any coding knowledge to follow this guide.

---

## 1. What is this feature?

The **Gallery** tab is a shared image library for a shop's products. From here a seller can:

- **Browse** all images already uploaded for the shop.
- **Search** images by name.
- **Upload** new images (single files, multiple files, or a whole folder).
- **View** an image full‑screen, **copy its link**, or **delete** it.

Images are first uploaded to the media (image) server, and then saved to the shop so they appear in the gallery list.

---

## 2. Who can see and use it?

Access is controlled by **permissions** assigned to the logged‑in user for that shop:

| Permission | What it allows |
| --- | --- |
| `READ_PRODUCT_IMAGES` | The user can **see** the Gallery tab and browse/search images. |
| `UPLOAD_PRODUCT_IMAGES` | The user can **upload** new images (the upload box appears). |
| `DELETE_PRODUCT_IMAGES` | The user can **delete** images (the 🗑️ button appears). |

What this means when testing:

- A user **without** `READ_PRODUCT_IMAGES` will **not** see the "Gallery" menu item at all.
- A user **with** `READ_PRODUCT_IMAGES` only can **browse and search**, but the upload box is hidden and there is **no delete button**.
- `UPLOAD_PRODUCT_IMAGES` adds the upload box; `DELETE_PRODUCT_IMAGES` adds the delete button. They are independent.
- A **Super Admin** automatically has access to everything.

> ✅ **Test tip:** Ask for several test accounts — one with no gallery permission, one read‑only, one read+upload, one read+delete, and one with all three — to confirm each behaves as described.

---

## 3. How to open the Gallery tab

1. Log in with a seller account that has access to a shop.
2. Go to the **Seller Profile / Seller Dashboard**.
3. Click the **menu button** (the ☰ icon near the shop name at the top).
4. In the side menu, click the **Gallery** item.
5. The gallery screen opens and starts loading the shop's images.

---

## 4. What you should see

When the screen finishes loading:

- **(If you can upload)** A dashed **"Drop images here"** box at the top with **Select Files** and **Select Folder** buttons.
- A **search bar**.
- A **grid of images**. Hovering over an image shows action buttons: 👁️ View, 📋 Copy URL, and (if you can delete) 🗑️ Delete.
- If the shop has many images, **Previous / Next** paging buttons appear at the bottom.
- If there are no images yet, you'll see **"No images found"**.

---

## 5. Test scenarios

### A. Browse existing images (READ_PRODUCT_IMAGES)
1. Open the Gallery tab.
2. **Check:** the saved images load into the grid, each with its name underneath.

### B. Search
1. Type part of an image name in the search bar.
2. **Check:** after a short pause the grid updates to show only matching images.
3. Clear the search and **check:** the full list returns.

### C. Upload single / multiple files (UPLOAD_PRODUCT_IMAGES)
1. Click **Select Files**.
2. Pick one or several pictures from your computer.
3. A **confirmation window** opens showing thumbnails of what you chose.
4. (Optional) Remove a thumbnail with its red **x**.
5. Click **Upload**.
6. **Check:** the window closes, and after a moment the new images appear in the grid.

### D. Upload a whole folder
1. Click **Select Folder** and choose a folder containing images.
2. **Check:** only image files from that folder appear in the confirmation window (non‑images are ignored).
3. Click **Upload** and confirm they appear in the grid.

### E. Drag & drop
1. Drag image files from your computer directly onto the dashed box.
2. **Check:** the confirmation window opens with those images, and Upload works the same way.

### F. View full‑screen
1. Hover an image and click **👁️**.
2. **Check:** the image opens large; clicking the background or the **×** closes it.

### G. Copy URL
1. Hover an image and click **📋**.
2. **Check:** the icon briefly turns into a ✅ ("Copied!"). Paste somewhere to confirm a link was copied.

### H. Delete an image (DELETE_PRODUCT_IMAGES)
1. Hover an image and click **🗑️**.
2. **Check:** a small spinner shows, then the image disappears from the grid.
3. Refresh and re‑open the tab — **check:** it stays gone.

### I. Read‑only user (no upload, no delete)
1. Log in as a user with **only** `READ_PRODUCT_IMAGES`.
2. **Check:** the upload box is **not** shown and images have **no 🗑️ delete button**, but View and Copy still work.

### J. No access user (no READ_PRODUCT_IMAGES)
1. Log in as a user without any gallery permission.
2. **Check:** the **Gallery** menu item does **not** appear.

---

## 6. Language testing

The app supports **English, Arabic, Turkish, and Kurdish**.

1. Switch the app language.
2. Re‑open the Gallery tab.
3. **Check:** labels (Drop images here, Select Files, Search, buttons, messages) appear translated, and Arabic/Kurdish display correctly right‑to‑left.

---

## 7. What to report if something looks wrong

When raising a bug, please include:

- The **account** used and its **permissions** (read‑only, upload, delete, super admin, etc.).
- The **shop** (Seller ID — shown at the bottom of the side menu).
- The **language** you were testing in.
- The **steps** you took.
- What you **expected** vs. what **actually happened**.
- A **screenshot** if possible (especially of any error message).

---

## 8. Quick checklist

- [ ] Gallery menu item appears for users with read permission.
- [ ] Existing images load with their names.
- [ ] Search filters the grid correctly.
- [ ] Uploading files (and a folder) works and the new images appear.
- [ ] Drag & drop upload works.
- [ ] View (full‑screen) and Copy URL work.
- [ ] Delete removes the image and it stays gone after refresh.
- [ ] Read‑only users see no upload box and no delete button.
- [ ] Users without permission don't see the tab.
- [ ] All four languages display correctly.
