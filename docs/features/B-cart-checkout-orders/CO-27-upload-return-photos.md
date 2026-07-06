# CO-27 — Upload Return Photos

| | |
|---|---|
| **Feature ID** | CO-27 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Orders/UploadImageComponent.tsx`, `components/global/ImageCropWidget.tsx`, `components/setting/orders/ReturnOrderItemWrapper.tsx`, `services/order.ts` |

---

## What it is

The **photo-evidence step** inside the return flow — the shopper attaches one or more images of the
item they want to send back. At least one photo is **mandatory** before a return can be submitted.

## Where it appears

Inside the return form (CO-26), which opens from an order's per-item options sheet. The uploader
only appears **after a return reason has been selected**.

## Who uses it

Any shopper creating a return request (CO-26).

## How it works (verified behaviour)

- **Two ways to add a photo:** pick from the device (`accept="image/*"`) or use the **in-app
  camera** (captures WebP).
- **Every image is cropped and normalised.** Whichever source is used, the image passes through the
  crop widget, which re-encodes the result to **JPEG** — so all uploads land as JPEG regardless of
  the original format.
- **At least one photo is required, up to five.** The return's Submit button stays disabled until an
  image is attached, and the uploader now caps at **5 photos, ≤ 5 MB each** (oversize or over-count
  additions are rejected with a message).
- **Photos show as a horizontal strip** with a per-image **"X"** to remove one. Removing an image
  that's already saved on a return request calls a server remove endpoint; otherwise it just drops it
  from the local list.
- **Upload target.** Images go to a **dedicated media server** (not the order backend), into the
  `return_request_products` folder; only the returned file's short path (`sub_path`) is stored and
  sent on with the return request.

## Data source

| Item | Value |
|------|-------|
| Upload image | `POST {NEXT_PUBLIC_MEDIA_SERVER_BASE_URL}/upload` — multipart `FormData` (`file`, `folder="return_request_products"`), header `x-api-key` |
| Remove saved image | `GET /customer/order/return_request_products/remove_image?return_request_product_id=…&image=…` |
| Display URL | `NEXT_PUBLIC_BASE_MEDIA_URL + "/return_request_products/" + sub_path` |
| Backend | Media server for upload; **legacy backend** for the remove call |

## Technical reference

| Item | Value |
|------|-------|
| Uploader | `components/Orders/UploadImageComponent.tsx` (file + `react-webcam` camera) |
| Crop / re-encode | `components/global/ImageCropWidget.tsx` (`canvas.toBlob(..., "image/jpeg")`) |
| Mount point | `components/setting/orders/ReturnOrderItemWrapper.tsx` (rendered once a reason is picked) |
| Services | `services/order.ts` — `UploadImageForOrderReturn` (`uploadToMediaServer`), `removeImage` |
| Request code | `utils/Requests.ts` — `REMOVE_IMAGE` (136) |
| State | Local React state (no dedicated store slice) |

## Current status & maturity

**Live.** Attaching evidence photos works from both file and camera, images are normalised to JPEG,
and the return flow correctly requires at least one before submission.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-26 (Create a return request — the flow this step lives in) · CO-28 (Manage a return — track /
confirm / cancel) · CO-23 (Rate & review — reuses the same image uploader).
