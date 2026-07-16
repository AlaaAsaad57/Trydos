# SD-28 — Share Product

| | |
|---|---|
| **Feature ID** | SD-28 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/products/ShareOptions.tsx`, `components/products/ShareButton.tsx`, `services/chat.ts` |

---

## What it is

Sharing a product **out** to social channels / messaging apps, or **in-app** to the shopper's own
contacts and chats.

## Where it appears

On the product page (SD-19), from the Share action in the sticky footer — it expands a share
panel.

## Who uses it

Any shopper who wants to send a product to someone.

## How it works (verified behaviour)

- **External channels:** Facebook, X (Twitter), WhatsApp, Telegram, Email, Copy Link, and the
  device's native share sheet (when available). Email uses a `mailto:` on mobile and a Gmail
  compose fallback on desktop.
- **Tracked** (unlike the listing-page share, SD-17): each external share **posts to the backend**
  (`share_product_on_apps`, with the app name and product id) **and** fires a Google Analytics
  `SHARE_CONTENT` event. Each shared URL is tagged with `utm_source=<channel>` for attribution.
- **Share in-app to contacts / chats.** Below the social row, the panel lists the shopper's
  contacts merged with their active chats; selecting people and confirming sends the product as a
  card into those chats (see CH-12). This fires a separate GA event (`share_context: internal`).

## Data source

| Item | Value |
|------|-------|
| External share log | `POST /api/v1/elasticsearch/share_product_on_apps` (`{ app_name, product_id, shared_count: 1 }`, `server: "chat"`) |
| In-app send | `chat.ShareProduct({ userId: <selected>, product: {…} })` (`services/chat.ts`) |
| Contacts + chats | `getContactsForSharing` (merges contacts with active chat channels) |
| Analytics | GA `SHARE_CONTENT` (external) / internal chat-share event |

## Technical reference

| Item | Value |
|------|-------|
| Share panel | `components/products/ShareOptions.tsx` (via `ShareSection.tsx`, in `ExtendedAreaInfo.tsx`) |
| In-app send button | `components/products/ShareButton.tsx` (`selectedContactsForShare` in store) |
| Contact avatars | `components/products/ShareAvatar.tsx` |
| UTM | `generateUrlForSharing(app)` appends `utm_source=<app>` |

## Current status & maturity

**Live and stable.** More capable than the listing-bar share (SD-17) — it has backend logging,
analytics and in-app contact sharing.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · CH-12 (Share product to chat) · PF-32 (Multi-channel sharing) ·
PF-33 (Share to contacts) · PF-34 (Campaign-tagged links) · SD-17 (the lighter listing share).
