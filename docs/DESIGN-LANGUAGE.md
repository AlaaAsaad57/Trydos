# Trydos — Design Language

> Practical, build-ready reference for the Trydos mobile e-commerce / live-shopping app.
> Audience: an engineer or designer building **new** pages that must look native to the app.
>
> **Source of truth:** the "Existing code tokens" (Quicksand, the f-10/12/14/16 scale, `#3c3c3c` text, `#f85555/#f64f65` red, 15px radius, `0 3px 10px rgba(0,0,0,0.1)` shadow, the inverted Tailwind breakpoints) **always win**. Where the 91 reference artboards introduced colors/values not in code, they are mapped to the nearest code token and explicitly **flagged as NEW** — confirm with design before hardcoding them.

---

## 1. Overview & Design Principles

Trydos is a **rounded, soft, high-trust** storefront. The personality:

- **Quicksand everywhere** — a geometric rounded sans. Friendly, never sharp. Default `font-sans`.
- **Soft surfaces, not hard lines.** Almost every container is a `15px`-radius card on a near-white surface (`#fafafa`/`#f8f8f8`/`#f5f5f5`) with one gentle shadow (`0 3px 10px rgba(0,0,0,0.1)`). Hairline borders, not heavy strokes.
- **Mobile-first, thumb-driven.** Designs are drawn at the `xs/sm` (≤480px) breakpoint. Bottom sheets, a fixed bottom tab bar, and a floating Buy button are the signature interaction model. Horizontal scroll rows (scrollbars hidden) carry stories, offers, products, sizes, and order thumbnails.
- **Two accent families, two jobs.**
  - **Red** (`#f85555`/`#f64f65`) = the **brand & live** accent: the shopping-bag logo, the live tab dot, "Verified", likes/urgency, destructive icons.
  - **Purple/Indigo** = the **system / primary-action** accent: progress spinners, primary CTAs, selected states, links. *(NEW vs code — see §2.)*
- **Selection by outline + contrast, not checkboxes.** Selected cards/chips/tabs get a colored 1px outline + faint tint; unselected are flat grey. Radios/checkboxes are avoided.
- **Trust & urgency are first-class.** Verified-purchase microcopy, refund guarantees, rating distributions, countdown timers, "Last N" stock, and color-coded promo banners are recurring, intentional patterns.
- **Two-tone wordmark.** "**try**dos" — `try` bold, `dos` light.

---

## 2. Color System

### 2.1 Confirmed code tokens (authoritative)

| Token | Hex | Usage | Code class / utility |
|---|---|---|---|
| Text / primary | `#3c3c3c` | Headings, primary body | `.color-dark-gray` |
| Text / secondary | `#505050` | Secondary text | — |
| Text / muted | `#707070` | Captions, meta | — |
| Text / faint-1 | `#929191` | Placeholders, disabled labels | — |
| Text / faint-2 | `#b8b8b8` | Hints, dim icons | — |
| Accent / red | `#f85555` | Brand bag, like, urgency, error | — |
| Accent / red-alt | `#f64f65` | Same family (gradient/variant) | — |
| Surface / bar | `#fafafa` | Navbar, home-bar | — |
| Surface / card | `#f8f8f8` | Product card bg | `.product-container` |
| Surface / input | `#f2f2f2` | Search input bg (≥912px) | — |
| Skeleton base | `#ebebeb` | Skeleton loader base | — |
| Skeleton highlight | `#f5f5f5` | Skeleton highlight | — |
| Image loader | `#e6e6e6` | Image placeholder | — |

### 2.2 Semantic palette (code tokens merged with artboard observations)

Artboards render slightly darker neutrals (e.g. `#1a1a1a`, `#8a8a8e`) than the code text tokens. **Use the code tokens** (`#3c3c3c` etc.); treat the darker artboard values as "the same role, rendered punchier." Map as below.

| Semantic role | Recommended hex | Map to code token | Usage |
|---|---|---|---|
| Text primary | `#3c3c3c` | `.color-dark-gray` | Titles, key values, bold prices |
| Text secondary | `#505050` | — | Sub-labels |
| Text muted | `#707070` | — | Captions, attribute labels |
| Text faint / placeholder | `#929191`–`#b8b8b8` | faint tokens | Placeholders, disabled |
| Surface app | `#ffffff` | — | Page background |
| Surface bar | `#fafafa` | bar token | Navbar / home-bar |
| Surface card | `#f8f8f8` / `#f5f5f5` | card token | Cards, list rows, sheets-content |
| Surface input/track | `#f2f2f2` | input token | Inputs, segmented tracks, chip fill |
| Hairline / border | `#e5e5ea`–`#e6e6e6` | image-loader token | Card borders, dividers |
| **Brand red (bag/live/like)** | `#f85555` / `#f64f65` | red tokens | Logo, live dot, verified, likes, error |

### 2.3 NEW colors observed in artboards (flag before hardcoding)

These do **not** exist in code tokens. They are functionally important across many screens. **Recommendation: introduce them as named tokens, but reconcile the primary-action color first — artboards are inconsistent (see §2.4).**

| Proposed token | Hex (representative) | Role | Where seen |
|---|---|---|---|
| `primary` (indigo/purple) | `#5b3fe0` (range `#4b33d9`–`#6c4fd8`) | **Primary CTA, selected state, spinner, links-in-flow** | PDP Buy/CTA, change/return sheets, profile save, uploading spinner |
| `link-blue` | `#2f6be0` | Inline text links ("Back to your wallet"), some confirm CTAs, filter icon | Order details, confirmation dialogs |
| `success-green` | `#2ea84f` / `#27ae60` | Add-to-bag success, free shipping/return, delivered, recommend, address CTA fill `#e8f7ec` | PDP, order delivered, reviews, address |
| `warning-amber` | `#e6b400` / `#f5a623` | "Waiting confirmation", pending, "Best Price", "Last N" stock, return-requested strip `#fbf6e6` | Order status, promos, stock |
| `urgency-orange` | `#f2682c` / `#f08a24` | Flash Deal, Lock countdown, "Return Requested" tag, caution actions | Promo strips, return |
| `info-teal/mint` | `#7fe3d6` | Clarification hero dot, success toast bg `#d6f5e3` | Confirmation modals, toasts |
| `scrim` | `rgba(0,0,0,0.45)` (sheets) / `0.55–0.7` (full-screen dialogs) | Modal overlays | All bottom sheets & dialogs |

### 2.4 ⚠ Inconsistencies to reconcile (flag in audit)

1. **Primary action color is not unified.** The same "confirm" intent is rendered as **indigo-purple** (`#5b3fe0`, PDP & change-product sheets), **royal blue** (`#2f6be0`, confirmation dialogs 213/218/228), and even **blue "Save"** (artboard 30) vs **green address CTA** (32/25). **Pick ONE primary token** (recommended: indigo `#5b3fe0`, the most frequent for the actual brand CTA) and one link token (`#2f6be0`).
2. **Selection accent drifts** — purple `#5b3fe0` vs indigo `#6c5ce7`/`#7b61ff` vs blue `#4a90e2` (address cards) for "selected outline." Unify to the primary token.
3. **Destructive button color flips** — sometimes solid red is the primary destructive action (210/211/235), sometimes red is the *safe* "I Disagree" underlined secondary (193/196). Define a single destructive convention (see §7).
4. **Brand red shade** — artboards use `#e2342b`/`#e8392f`/`#f0463c` for the bag; **code says `#f85555`/`#f64f65`.** Use the code red.

---

## 3. Typography

**Family:** Quicksand via `next/font`. Tailwind: `font-sans`.
**Weight classes:** `.light` (Light) · `.regular` (Regular) · `.medium` / `.med-text` (Medium) · `.semibold` (SemiBold) · `.bold` (Bold).
**Scale (px) utilities:** `f-10` (10) · `f-12` (12) · `f-14` (14) · `f-16` (16). Plus **8px** for tiny meta (timestamps, "USD" units, micro-captions).

> Artboards label many sizes 17–34px (drawn at large mobile scale). **Snap to the code scale.** Map artboard intent → nearest token below. Reserve 18–22px for true hero/screen titles only if a larger token is added; otherwise cap body UI at `f-16`.

### 3.1 Role → token table

| Role | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Screen / sheet title | `f-16` (bump to 18 if token exists) | `.medium` / `.semibold` | `#3c3c3c` | Centered in headers |
| Section header | `f-16` | `.medium` | `#3c3c3c` | With leading line icon + optional help bubble |
| Card title / brand wordmark | `f-14`–`f-16` | `.bold` | `#3c3c3c` | "MANGO" is bold, tracked, uppercase |
| Body / list-row label | `f-14`–`f-16` | `.regular` | `#3c3c3c` | |
| Secondary body / banner copy | `f-14` | `.regular` | `#707070` | Helper banners, descriptions |
| Field label (floating) | `f-12`–`f-14` | `.regular` | `#505050` | `(Optional)` suffix in faint |
| Placeholder | `f-14`–`f-16` | `.regular` | `#929191` | |
| Caption / attribute label | `f-12` | `.regular` | `#707070` | "Color:", "Size:", meta labels |
| Price — current | `f-16` (hero PDP larger) | `.bold` | `#3c3c3c` | |
| Price — struck original | `f-12` | `.regular` line-through | `#929191` | Always precedes current |
| Price — "USD" unit | `f-10`–`f-12` | `.regular` | `#707070` | |
| Micro-meta (timestamp, qty, tab caption) | `f-10` / 8px | `.regular` | `#707070`/`#929191` | |
| Link / inline action | `f-12`–`f-14` | `.medium` | `link-blue` | Often underlined |
| Two-tone wordmark "trydos" | — | `try` `.bold` + `dos` `.light` | `#3c3c3c` | |

### 3.2 Hierarchy rules

- **One bold value per row.** In meta key/value rows, the **value** is bold/dark, the **label** is muted regular.
- **Numbers carry emphasis.** In summaries ("2 Item . 160 USD"), bold the digits, mute the words/units.
- **Centered titles** in top app bars; **left-aligned** everything else.
- Verified-purchase microcopy always bolds the word **trydos** as a trust signal.

---

## 4. Spacing, Radius, Elevation

### 4.1 Spacing rhythm

| Context | Value |
|---|---|
| Page side padding (dense screens: orders, listing) | **16px** |
| Page side padding (profile/form/account screens) | **24px** (drawn ~20–24) |
| Vertical gap between stacked cards/rows | **12–16px** |
| Internal card/field padding | **16px** (fields ~14–16) |
| Attribute grid row gap | **6–8px** |
| Horizontal scroll item gap | **8–12px** |
| Chip gap (wrap & rows) | **8–10px** |
| Bottom tab bar height | **~64px**, fixed |
| Top app bar / navbar height | **50px** (code) / sheets ~56–64 |
| 2-column listing gutter | **~10px** |

### 4.2 Radius system

| Radius | Use | Class |
|---|---|---|
| **15px** | Cards, bars, product container, list rows, banners | `.rounded-15` / `.product-container` |
| **5px** | Small chips, tooltips, tiny badges | — |
| **50%** | Avatars, circular icon badges, story rings | `.rounded-50` |
| ~20–24px (sheet top) | Bottom-sheet top corners | (map to a larger rounded value) |
| Full pill | CTAs, segmented tabs, filter chips | `rounded-full` |

> Artboards say "12px/14px/16px/20px" for cards — **standardize to 15px** (`.rounded-15`) for all cards/rows/banners; use full-pill for buttons/chips; 50% for avatars.

### 4.3 Elevation / shadow

| Token | Value | Use |
|---|---|---|
| Card shadow | `0 3px 10px rgba(0,0,0,0.1)` | All cards |
| Home-bar shadow | `0 3px 10px rgba(0,0,0,0.103)` | Home/listing bars |
| Sheet lift | same family, slightly stronger | Bottom sheets above scrim |
| Floating Buy button | drop shadow + elevation | PDP raised CTA |

Keep elevation **single-layer and subtle**. No multi-shadow stacks. Borders are `1px` hairline (`#e5e5ea`–`#e6e6e6`).

---

## 5. Layout & Grid

- **Mobile-first.** Design and build at `xs/sm` (≤480px) first.
- **Container max-width:** `1365px` (`.site-container`) / `1366px` (home & listing containers).
- **Custom Tailwind breakpoints (MAX-width based — inverted!):**

| Name | Meaning |
|---|---|
| `xs` / `sm` | max **480px** |
| `md` | max **768px** |
| `lg2` | max **912px** |
| `lg` | **min 769px** (the only min-width one) |

- **Listing grid:** 2 columns, ~10px gutter, ~12px page padding. Cards share one base anatomy (see §6.7).
- **Horizontal scroll rows** (`.horizntal-scroll`): scrollbars hidden; **edge-peek pattern** (last item bleeds off-screen to signal scroll). Used for stories, offers (embla carousels), products, size chips, order thumbnails, color swatches, filter chips.
- **Bottom tab bar:** fixed, 4 tabs (`trydos` [red live dot] · Empty · Chat · Me [avatar]).
- **Bottom sheets** slide up over a scrim; **cart slides up as a bottom sheet.** Full-screen confirmation dialogs use a darker blurred scrim.

---

## 6. Component Inventory

### 6.1 Top app bar / header

- **Anatomy:** back chevron (left) · centered title (often with a small leading icon, e.g. red bag for "Order Details") · optional right action (text "Save" / kebab `⋮`).
- **Height:** ~56–64px (sheet contexts); navbar 50px (logo 136×50).
- **Variants:** (a) title only; (b) title + right **text action** ("Save", primary-colored); (c) title + **kebab** overflow; (d) inline cart summary ("2 Item 1150 USD" + bag icon) on PDP.
- **Notes:** title `f-16 .medium #3c3c3c`. Right text action uses the **primary** token. Bottom hairline/soft shadow.

### 6.2 Bottom tab bar (global nav)

- 4 items, icon + `f-10` caption. Active **trydos** = red filled live dot; active **Me** = avatar with red ring. Two-tone "trydos" wordmark.
- Fixed, ~64px, surface `#fafafa`.

### 6.3 Category tab bar (home)

- Horizontal row: vertical icon (~28px) + label. Tabs: Man / Women / Children / Home / Electronic.
- **Active:** near-black icon + bold label. **Inactive:** faint grey (`#b8b8b8`). Hairline divider beneath.

### 6.4 Stories / Seller-spotlight row

- Tall portrait cards (~190px, `15px` radius, soft shadow), small circular avatar (~36px, thin gold/white ring `#d9a441`) top-left, name caption bottom over a dark gradient.
- Horizontal scroll, edge-peek. Doubles as live-shopping/seller entry → componentize as **`SellerStoryCard`**.

### 6.5 Hero / promo banner

- Full-width image card, `15px` radius, bottom-left white text overlay (brand title bold + subtitle) on a dark scrim. Tappable deep-link.

### 6.6 Offer carousel

- Embla carousel of promo cards. Same product-card base reskinned with promo banner pills + colored card glow (see §6.7, §7).

### 6.7 Product card (+ variants)

**Base size:** **200 × 377px**, bg `#f8f8f8` (`.product-container`), radius **15px**.

**Anatomy (top→bottom):** image (≈4:5, may have a thin rounded outline) → brand (bold, `f-12`–`f-14`) → attributes line (pipe-separated, `f-10`–`f-12` `#707070`) → promo/info line → footer: **price block** (left) + **Buy** button (right).

**Price block:** small ruler/size icon + bold number + small grey "USD". Struck original precedes current when discounted.

**Buy button:** "Buy" label + filled bag icon, bottom-right.

**Variants** (layered onto the same base via a top promo pill + optional colored glow):

| Variant | Trigger | Treatment |
|---|---|---|
| Default / clean | no promo | base card, no glow |
| Best Price | price reassurance | blue pill "Best Price (Last 3 Days)" |
| Flash Deal | urgency | orange/red pill + lightning + live countdown, card glow |
| Offer Test Area | experiment | blue outline pill |
| Luck / Lock | scarcity | orange pill "Add To Bag Within 20 Seconds", countdown |

**Compact thumbnail** (orders): rounded square ~90–110px on light backdrop + 2-line caption ("Medium / Blue") + small state glyph.

### 6.8 Buttons & CTAs

| Type | Shape | Fill | Label | Use |
|---|---|---|---|---|
| **Primary (enabled)** | full-width pill | **primary** `#5b3fe0`, solid | white `.semibold` `f-16` | Add To Bag, Change/Return Request, Confirm |
| **Primary (disabled)** | full-width pill | `#d9d9de` grey | faint white | Until form valid / size selected |
| **Confirmed / toggled** | full-width pill | **outline** primary on white | primary text | "We Will Inform You…", restock-subscribed |
| **Secondary / address CTA** | full-width pill | pale-green `#e8f7ec` + green border | dark label + pin icon | Add Shipping Address |
| **Destructive (primary path)** | full-width pill | red `#f85555` solid | white | Cancel Request (when enabled) |
| **Destructive (secondary path)** | underlined text / red-tint bar | translucent red | underlined white/red | "I Disagree" |
| **Floating Buy** | raised circle, straddles sheet top | primary purple | white arrow + "Buy" | PDP signature CTA |
| **Text action** | inline | none | primary, sometimes underlined | "Save", links |

> **Disabled→enabled is the canonical state pair:** identical geometry, only the fill swaps grey→primary. Document every gated CTA this way.

### 6.9 Inputs & form fields

- **Floating-label card:** white rounded rect (`15px`), 1px hairline, label top-left (`#505050` `f-12`–`f-14`), placeholder/value inside (`#929191`). `(Optional)` suffix in faint grey.
- **Two-line stacked field** (Size Info): question label on top, value+unit ("000 CM") below.
- **Segmented control:** light grey track; **active segment = white pill with primary 1px outline** (not a fill); inactive = grey text.
- **Gender selector:** 3 equal pills; selected = primary outline + rounded inner pill + dark text.

### 6.10 Chips

- **Reason / filter chip:** pill (`5px`–full), grey fill `#f2f2f2`, dark label `f-12`–`f-14`. **Selected = primary 1px outline + faint tint.**
- **Status filter chips** (orders): All / In Progress / Delivered / Returned / Cancelled — selected chip filled/emphasized, single-select, horizontally scrollable, with a leading sort/filter icon.
- **Trust/benefit chips** (PDP): icon + short label (Free Shipping, Free Return, All Inclusive).

### 6.11 Bottom sheets

- White surface, top corners ~20–24px radius, centered grey grabber pill, over `rgba(0,0,0,0.45)` scrim. Swipe/scrim-to-dismiss.
- **Recurring sheets:** PDP variant/size sheet (with floating Buy bridging the top edge), Change Product Request (segmented Color/Size/Qty), Return Product (reasons + photo upload), Cancel Order (deflection-first CTAs), Action-about-product (hero image + caption + colored-icon action rows), Reviews, FAQ, Shipping/Delivery info, Cart.
- **Action-sheet row:** rounded grey pill (`#f2f2f2`), circular colored leading icon, bold title + muted subtitle. **Color only on the icon** signals intent (blue=neutral, orange=caution, red=destructive, grey=dismiss).

### 6.12 Full-screen confirmation dialog ("Clarification")

- Dark **blurred** scrim (`0.55–0.7`), centered: hero mint/teal dot-in-ring → large title → subtitle → 2–3 centered policy lines → terms-consent row (underlined link) → **terms-gated** primary CTA + destructive secondary.
- Distinct from white bottom sheets — reserved for **high-friction destructive confirmation** (cancel/return/change).

### 6.13 Order summary & detail cards

- **Order summary card** (list): grey container (`15px`), dual-aligned meta rows (date/id, status/items+price), horizontal product thumbnail carousel.
- **3-column meta card** (detail): Order Number / Date / Invoice, each = line icon + grey caption + bold value, thin vertical dividers.
- **Seller group card:** brand wordmark + "Buying N Item . NNN USD" + delivery meta + **status stepper** + divider + line items.
- **Line item:** image left → brand + name + 2×2 attribute grid (label muted / value dark) + item status + **strikethrough+bold price** + qty badge/kebab.
- **Address card:** home icon + label · edit(pencil)/delete(red trash) · address lines · phone + recipient. **Selected = white + primary border, full contrast; unselected = grey fill, dimmed** (single-select radio behavior).
- **Status timeline (cream `#fbf6e6`):** leading state icon + title + muted sub-line + trailing timer; scales from multi-step to a single confirmation row.

### 6.14 Profile / account blocks

- **Identity card:** grey (`#f5f5f5`, `15px`), QR + name + phone + "Add Size" link + "Verified Now" (red check) + right tile (photo or "try" wordmark placeholder).
- **Quick-stat tile:** 2-up grid, icon + bold title + grey metadata (Orders "1 Action", Wallet "300 USD").
- **Settings list row:** full-width grey rounded row, leading outline icon + label, ~64px, no trailing affordance.
- **Avatar uploader lifecycle:** placeholder ("try" wordmark + "Add Photo" band) → source picker (Take Photo / Choose From Library) → uploading (primary spinner + status) → filled (Save + red "Remove Photo").

### 6.15 Filter / sort bar

- Leading filter/sort icon (blue) + scrollable status chips. Single-select, one emphasized chip.

### 6.16 Empty & loading states

- **Empty-state card:** muted card, centered faint icon + 2 muted lines ("Your … List Is Empty"), followed by the section's primary/secondary CTA. CTA label adapts ("Add Shipping Address" → "Add New Shipping Address" when populated).
- **Loading card:** large `#f5f5f5` rounded card replacing the content region, centered **primary** spinner + primary status caption + leading icon.
- **Skeletons:** base `#ebebeb`, highlight `#f5f5f5`; image placeholders `#e6e6e6`.
- **Toasts:** dismissible rounded card, left circular info icon, title + body, close X. Color-variant by intent: success mint `#d6f5e3`, warning peach `#fbe7d8`.

---

## 7. Badges & Status System

### 7.1 Promo / urgency banners (listing & PDP promo slot)

| Badge | Color | Meaning / when |
|---|---|---|
| Best Price (Last N Days) | blue `link-blue` | Price reassurance, no urgency |
| Flash Deal `-50 USD` + countdown | orange/red `#f2682c` | Time-limited discount; lightning + live timer; card glow |
| Offer Test Area | blue outline | A/B experiment marker |
| Luck! / Lock! Add within Ns | orange `#f08a24` (green time highlight) | Scarcity countdown; "lock" the price |
| Fast Packing & Today Shipping | teal/primary | Fulfillment-speed cue |
| "Last 1" / "Last 2" stock | amber | Low-stock urgency on swatch/recommended size |

> PDP variant sheet has **one swappable promo slot** above the footer; only icon/accent/message change (states: none / fast-packing / flash-deal / countdown-lock).

### 7.2 Order status (state-driven, single component)

Enum progression: **Pending → Preparing → Shipped → Out For Delivery → Delivered**, plus return states.

| State | Accent | Indicator |
|---|---|---|
| Pending | neutral | check/dot icon |
| Preparing | amber/tan | box/truck icon; stepper 1st bag active |
| Shipped | neutral + truck | truck glyph; stepper advanced |
| Out For Delivery | + green countdown pill ("4h-30m") | highlight delivery card |
| Delivered | green | handoff icon; all stepper bags filled; label "Delivery Date" |
| Waiting Confirmation | **amber/gold outlined card** | spinner |
| Return Requested | **orange tag** `#e8862e` | timer + cream notice strip + live countdown |
| Returned | orange tag | cream success row OR inline blue "Back to your wallet" link |
| Cancelled | red X badge | + wallet-refund link |

- **Bag stepper:** row of 4 shopping-bag icons; progress encoded purely by how many are colored (yellow→tan→blue→green) vs greyed. Reuse as the fulfillment indicator everywhere.
- **Verified Now:** circular check + red label.

### 7.3 Action-intent color coding (icons in action sheets)

blue = neutral/change · orange = caution/return · red = destructive/cancel/report · grey = dismiss/hide.

---

## 8. Iconography & the Red Bag Motif

- **Style:** thin, rounded, monochrome line icons. Stars use a rounded "squircle" 5-point style. Avatars/icon badges are circular (`.rounded-50`).
- **Core set:** back chevron · shopping bag · heart (like) · search/magnifier · sort/filter · share/paper-plane · kebab `⋮` · help/question bubble · info-with-soundwaves (banner) · truck (shipping) · location pin · phone · person · star · QR · wallet · trash (red, destructive) · pencil (edit) · bell (notify) · camera/gallery (uploader) · circled-plus (add).
- **Color rule:** icons inherit text-muted (`#707070`) by default; tint only to encode state/intent (see §7.3) or for the brand.
- **The red bag logo** (`#f85555` family) is the brand signature: app/order headers, the live tab dot (filled red circle), Me-tab avatar ring, and "trydos" wordmark accent. Keep it red and reserved for brand/live moments — never reuse red for generic primary actions.

---

## 9. Screen Patterns / Page Templates

### 9.1 Home feed
Status bar → search icon (top-left) → category tab bar + hairline → **stories/seller row** (edge-peek) → **hero promo banner** → **horizontal product rail(s)** → lazy feed sections → fixed bottom tab bar.

### 9.2 Listing / brand grid
App bar (back + brand + search/sort/filter/share cluster) → horizontal category/story rail (circular avatars + count) → **2-column product grid** mixing card variants (default + promo) → vertical scroll.

### 9.3 Product detail (PDP)
**Base layer:** floating top cart-summary header → full-width media → bottom info strip (price + benefits row) → pinned bottom social/action bar (Like / Comment / **raised Buy** / Share / More with k-counts).
**Variant sheet (slides up over dimmed base):** product header (thumb + brand + verified + title) → delivery/refund meta rows → price → **swappable promo slot** → "Selected Color" swatch carousel → size-system tabs (CM/INC/EU/…) → size chip grid (selected=primary fill, unavailable=**red border+text**, default=grey) → recommended-size row ("Last N") → footer price recap + **Add To Bag** CTA + `+` FAB.
**State machine:** size chip {default / selected / unavailable-red}; CTA {Add To Bag → Added To Your Bag ×N (mutates label + qty badge) ; Notify Me → outlined "We Will Inform You"}; footer = mini line-item list for multi-variant bags (one chip per color+size; total = sum of per-variant qty).
**Expanded full page:** hero + sale/stock badges → rating row → attribute pills → shipping/return blocks → Product Style gallery → Buyers Comment → FAQ → review search → size tabs/grid → sizing-distribution bar chart.

### 9.4 Profile / account
Identity card → 2-up quick tiles (Orders / Wallet) → settings list rows → 2-up locale row (Country / Language) → bottom tab bar. **Profile sub-pages share one template:** header + info banner (primary info icon) + section header (icon + label + help bubble) + content/empty-state + CTA.

### 9.5 Order details
App bar (back + bag + title + kebab) → order summary chip → 3-column meta card → status row + stepper → divider → shipping/recipient block → seller group card(s) → line items → optional cream status timeline → contextual CTA (rate / cancel-return / back-to-wallet). Per-item kebab → action sheet → reason sheet (gated CTA) → Clarification dialog.

### 9.6 Cart sheet
Slides up as a bottom sheet from any context; promo banner ("Add N Item To Your Bag") + price block + trust chips + qty bag-pill (thumb + bag + qty + `+`, red trash to remove).

---

## 10. Checklist — Building a NEW Page Consistently

1. **Font & sizes:** `font-sans` (Quicksand). Use only `f-10/12/14/16` (+8px micro). Bold the value, mute the label.
2. **Colors:** text `#3c3c3c`/`#505050`/`#707070`; surfaces `#fafafa`/`#f8f8f8`/`#f5f5f5`/`#f2f2f2`; hairlines `#e6e6e6`. **Red `#f85555` only for brand/live/like/error.** Use the single **primary** token (`#5b3fe0`) for CTAs/selection/links-in-flow — do **not** invent a new primary color.
3. **Radius:** cards/rows/banners `15px` (`.rounded-15`); buttons/chips full-pill; avatars `.rounded-50`; sheet tops ~20–24px.
4. **Shadow:** one `0 3px 10px rgba(0,0,0,0.1)`. No multi-shadow.
5. **Spacing:** 16px side padding (24px for profile/forms); 12–16px between cards; 16px inside cards.
6. **Layout:** mobile-first at `xs/sm` (≤480px); container ≤1365px; use the inverted breakpoints (`md`=max768, `lg2`=max912, `lg`=min769).
7. **Header:** back chevron + centered `f-16 .medium` title + (right text action / kebab as needed).
8. **Selection = outline + tint**, never checkbox. Selected uses the primary outline; unselected stays flat grey.
9. **CTAs:** full-width pill; disabled grey `#d9d9de` → enabled primary, **same geometry**. Gated CTAs document both states.
10. **Lists/cards:** grey rounded row, leading icon + label; multi-state cards (selected/default/disabled) = one component, variant by border + opacity.
11. **Horizontal data:** use `.horizntal-scroll` with edge-peek; hide scrollbars.
12. **Modals:** white bottom sheet + grabber over `rgba(0,0,0,0.45)` for inputs/actions; dark blurred full-screen dialog only for destructive confirmation.
13. **Status/promo:** reuse the badge/stepper vocabulary in §7 (don't invent new status colors).
14. **States:** always provide empty (card + faint icon + 2 lines + CTA), loading (primary spinner / `#ebebeb` skeleton), success (toast + mutated CTA), and error (red inline + red chip border).
15. **Trust copy:** bold **trydos** in verified-purchase / guarantee microcopy.
16. **Reuse before building:** SellerStoryCard, ProductCard (+promo slot), OrderStatusRow+BagStepper, AddressCard, ConfirmationDialog (gated), BottomSheet, ActionSheetRow, FloatingBuy, SizeChipGrid, MetaStatTile — all already recur; parameterize rather than re-create.

---

### Notable cross-artboard patterns
- **One reusable shell, many states.** Order details, PDP variant sheet, confirmation dialog, address-change sheet, and product cards are each a single component driven by an enum/boolean (status, selectedVariant, agreed, promo type). Build them that way.
- **Disabled→enabled CTA pairs**, **selected-by-outline**, **strikethrough+bold price**, **3-col meta tile**, **bag stepper**, and **info-banner / section-header / help-bubble** chrome repeat across the whole app.

### Inconsistencies flagged for audit
1. **Primary action color split three ways** (indigo `#5b3fe0` vs blue `#2f6be0` vs green) — unify.
2. **Selection accent drift** (purple/indigo/blue) — unify to primary.
3. **Destructive convention flips** (red-as-primary vs red-as-safe-secondary across cancel flows) — define one rule.
4. **Brand red shade** in artboards (`#e2342b`/`#f0463c`) ≠ code (`#f85555`/`#f64f65`) — use code.
5. **Copy typos** to fix in build: "Delivred", "Cahnge", "Terms Of Cancellation Terms", "Add 1 Item To You Bag", "4nm". Plus the asset-naming bug: several **Order Details** artboards are filed under "Listing page".
