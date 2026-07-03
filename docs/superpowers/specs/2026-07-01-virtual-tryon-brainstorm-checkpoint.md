# Virtual Try-On — Brainstorm Checkpoint (WIP)

> **Status:** Mid-brainstorm, NOT yet a finalized design. Resume the dialogue from
> the "OPEN QUESTIONS" section below.
> **Session to resume:** `2ecddace-e724-4fcf-845f-773fd2f4c50d`
> **Date:** 2026-07-01

## Goal (user's words)
Build a Virtual Try-On feature: user opens their camera and sees themselves
"wearing" a product from the store's product photos. User referenced
**wanna.fashion** as the target experience: open camera → load a 3D model →
composited onto the live video → tracks the user's movement with a small delay.
User constraints: **self-hosted, no per-image API/SaaS cost, prefers no GPU on
the server ("host on a server (no gpu)"), and wants it "locked so the server
doesn't go down."**

## What already exists in the repo (the front-end shell is ~80% built, ML is a stub)
- `components/products/VirtualTryOn.tsx` — the purple badge button on a product;
  opens the modal via `setIsModalOpen(product)` (Zustand store).
- `components/products/VirtualTryOnWrapper.tsx` + `TryOnWidget.tsx` — wiring.
- `components/products/TryOnModal.tsx` — full UI flow: shows product images, lets
  the user **take a photo (camera) or upload one**, capture works, then a
  **"Try On" button**.
  - **THE GAP:** `handleTryOn()` is a **stub** — it runs a fake 3-second
    `setTimeout` then shows the user's ORIGINAL photo back. No model, no
    compositing, no actual try-on. The entire generation/AR engine is missing.
  - Note: modal opens the **rear** camera (`facingMode: "environment"`) — wrong
    for selfie-style apparel try-on; would need `"user"`.
- Trydos is a **multi-seller marketplace / live-shopping** platform (seller
  dashboards, seller profiles, sellers upload products as photos). This is
  decisive for scaling (see below).

## Research findings (3 web-research agents, all complete)

### The core reality
- **Real-time live video try-on for full APPAREL (shirts/dresses) is NOT a solved
  production technology** — not even Snap/Google. Live cloth draping on a moving
  body jitters, breaks on occlusion, needs a hand-built 3D model per garment.
- **Two distinct technologies, split by product type:**

| | Real-time AR (Wanna-style) | AI-image generation (Google/FASHN-style) |
|---|---|---|
| How | 3D model composited on live camera, tracked; runs **client-side (user's device)** | Diffusion model renders person wearing garment; **server-side**, async ~5–20s |
| Server compute | **None** — phone does the work | Cheap GPU needed (see below) |
| Licensing | Clean (open AR libs: MediaPipe etc.) | ⚠️ Landmine (see below) |
| Cost per product | ⚠️ A **3D model per SKU** | ✅ Just the existing product photo |
| Best categories | **Eyewear (best), watches, shoes, rings, bags** | **Shirts, dresses, pants, outerwear** |
| Marketplace scale | ⚠️ Only where you make 3D assets | ✅ Whole catalog automatically from photos |

### How Wanna actually works (decoded)
- Its real-time "wow" (sneakers/watches/bags) = **client-side AR rendering of a
  pre-made 3D model** + on-device tracking. NOT a server model, NOT diffusion.
- Its clothing try-on "supports 3D content created in **CLO and Browzwear**" —
  i.e. **professional 3D-garment CAD authored per SKU by artists.** Not automatic.
- ⇒ Wanna's model = enterprise tool for **single brands with small curated
  catalogs + a 3D budget.** Does NOT fit a multi-seller marketplace with
  arbitrary photo uploads.

### The 3D-asset supply problem (the real bottleneck for the AR path)
Four ways to get a 3D model per product, none free of trade-offs:
1. **Author them** (Blender/CLO3D artists) — best quality, human cost per SKU,
   only realistic for a small curated/flagship set.
2. **Sellers upload 3D** — unrealistic; they upload phone photos.
3. **Auto photo→3D on save** (user's idea) — research-grade, unreliable for
   arbitrary products today. Not a turnkey button.
4. **Category templates** — for RIGID standard shapes (eyewear/watches/rings),
   map the product's photo/texture onto a generic 3D template. Semi-automatic,
   **scales within that one category.** This is how much eyewear try-on works.
⇒ AR is realistic exactly where shape is rigid + standardized. Eyewear is the
   strongest flagship candidate.

### CPU-only feasibility for the apparel AI-image path — VERDICT: not viable free
- CPU-only diffusion try-on = **~3 min to tens of minutes per image**, even fully
  optimized (OpenVINO/int8/few-step). Sub-10s on CPU is a mirage for real VTON.
- Realistic zero-API-fee floor = **scale-to-zero cheap GPU** (RunPod Serverless /
  Modal 4090, or used RTX 3090) behind a **job queue + async delivery**:
  **~$30–100/month** at low volume, ~6–18s/image. A 24GB GPU is enough (no
  A100/H100). This satisfies "no per-image API fee" but NOT "no GPU / free".
- Lightweight GAN/warping models (DM-VTON, 37MB) *could* run in low-seconds on CPU
  but at 256×192 with visible artifacts — demo quality, not production.
- **Licensing landmine:** IDM-VTON, CatVTON, OOTDiffusion = **CC BY-NC-SA
  (non-commercial) — cannot ship in a commercial store.** Leffa code is MIT but
  its **weights are trained on VITON-HD/DressCode (research-only datasets)** →
  also not commercially safe as shipped. Clean commercial path = license a hosted
  API, or retrain a permissive architecture (Leffa MIT / SD-SDXL OpenRAIL) on
  data you own. This applies to the image path only, NOT the AR path.

### Key providers/tools (reference)
- **AR (client-side, free/open):** MediaPipe (Pose/FaceMesh/Hands, in-browser,
  30fps), TensorFlow.js; paid polished SDKs: Snap Camera Kit, Banuba, DeepAR.
- **AI-image APIs (if ever chosen):** FASHN AI (~$0.04–0.075/img, commercial OK,
  5–17s), Kling/Kolors via fal.ai (~$0.07), Google Vertex AI Try-On.
- **Self-host image (commercial-safe only):** Leffa architecture retrained on
  owned data.

## Decisions made so far
- Category focus: user picked **"Both, apparel first"** initially, then pivoted
  toward the **real-time AR (Wanna) experience** after seeing how it works.
- Engine sourcing: user rejected API/SaaS; wants **self-hosted, no cost, no server
  GPU.** (This is fully compatible with the AR path, incompatible with a *free*
  apparel-image path.)
- 3D-from-photo on save: discussed; **auto-generation is not reliable today** —
  parked unless scoped to templated rigid categories.
- Skip building custom 3D-garment reconstruction.

## OPEN QUESTIONS (resume here)
User was "thinking out loud." Still need, in their words:
1. **What does Trydos sell most?** Mostly clothing/general goods, or real
   eyewear/watch/shoe volume?
2. **Is the goal the "wow"/marketing moment, or genuine fit-help?**
3. **Any appetite/budget to create 3D assets** for even a handful of showcase
   products?

## Leading recommendation (to confirm once questions answered)
Given Trydos is a multi-seller marketplace:
- **AR-first only makes sense as a focused flagship on ONE rigid category —
  most likely EYEWEAR** (reliable tracking + template-friendly = scales within the
  category, client-side, zero server cost, satisfies the no-GPU/free constraint).
- **Catalog-wide APPAREL try-on realistically means the AI-image path** — which
  costs a cheap scale-to-zero GPU (~$30–100/mo) + a licensing fix, and is async
  (not live). The existing modal flow fits this with minor changes.
- Likely answer = **phased**: pick one to ship first. AR-eyewear gives the
  real-time wow at zero server cost; apparel-image gives catalog-wide coverage at
  small cost.

## Next steps in the brainstorming workflow
1. Get the 3 open answers → lock the direction.
2. Present the design in sections (architecture, components, data flow, errors).
3. On approval, write the final design doc + run spec self-review + user review.
4. Then invoke `superpowers:writing-plans` (the ONLY next skill).
