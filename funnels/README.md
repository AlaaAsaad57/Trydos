# Funnels — catalog & build log

Every PostHog funnel we maintain for Trydos, with full step definitions and ready-to-paste query
specs so they can be **recreated on the company PostHog account** (or any other project).

- **Current project:** Default project (`200119`), org Ramaaz — **EU** cloud (`eu.posthog.com`).
- **Event registry:** `docs/posthog-events.md` (single source of truth for every event).
- **Specs:** `funnels/chat-stories-funnels.md` (stories/chat) · `docs/posthog-order-funnel.md` (checkout).

> **Porting to the company account:** all events below are sent client-side from this codebase, so
> they'll appear in whatever PostHog project the prod `NEXT_PUBLIC_POSTHOG_*` keys point at. Recreate
> each funnel there with the JSON in [Appendix — recreation specs](#appendix--recreation-specs):
> `read-data-schema` to confirm the events exist, `query-funnel` to preview, `insight-create` to save,
> `dashboard-create` to group. Same steps apply whether via the PostHog MCP or the UI's funnel builder.

---

## Catalog

| # | Funnel | Status | Events ingesting? | Insight (current project) |
|---|---|---|---|---|
| 1 | **Checkout · Create-order conversion** | live | ✅ yes | [`We23VGLc`](https://eu.posthog.com/project/200119/insights/We23VGLc) |
| 2 | **Product discovery · Browse** | live | ✅ yes | [`6OdD2IZm`](https://eu.posthog.com/project/200119/insights/6OdD2IZm) |
| 3 | **Engagement · Share / notify → return** | live | ✅ yes | [`FOX3HItD`](https://eu.posthog.com/project/200119/insights/FOX3HItD) |
| A | **Stories → Purchase** (shoppable) | built, empty | ⏳ pending prod | [`5YRJuZ0Z`](https://eu.posthog.com/project/200119/insights/5YRJuZ0Z) |
| B1 | **Chat → Purchase** | built, empty | ⏳ pending prod | [`WldKkpg3`](https://eu.posthog.com/project/200119/insights/WldKkpg3) |
| B2 | **Chat product share → Purchase** | built, empty | ⏳ pending prod | [`OteeGGFL`](https://eu.posthog.com/project/200119/insights/OteeGGFL) |
| C | **Story creation** (seller upload) | built, empty | ⏳ pending prod | [`HlqM7Fkg`](https://eu.posthog.com/project/200119/insights/HlqM7Fkg) |
| D | **Chat engagement depth** | built, empty | ⏳ pending prod | [`QHPWr8pr`](https://eu.posthog.com/project/200119/insights/QHPWr8pr) |

Funnels A–D live on the dashboard
**[Engagement → Conversion Funnels (Stories & Chat)](https://eu.posthog.com/project/200119/dashboard/746757)**
(id `746757`). Funnels 1–3 are standalone insights (no dashboard yet).

> ⏳ **"pending prod"** = the chat/stories events are wired in code but go through
> `utils/posthogEvents.ts:trackPosthog()` / `GAevent()`, which **no-op outside production**. None
> have been ingested yet (confirmed against the live event schema). The funnels are saved and correct;
> they populate automatically once a prod build ships the events.

---

## 1–3 · Commerce funnels (live data)

Created 2026-06-13; titled + described 2026-06-14. Default conversion window (14 d), order type
`ordered`, no breakdowns.

**1 · Checkout · Create-order conversion** — primary purchase funnel.
`$pageview → add_to_cart → view_cart → order_begin_checkout → address_selected → payment_method_selected → checkout_confirm_clicked → order_submit_attempt → place_order_clicked → order_completed`
⚠️ `order_submit_attempt` is listed **before** `place_order_clicked` — the reverse of the canonical
order in `docs/posthog-order-funnel.md`. Left as the author built it; swap the two steps if exact
drop-off attribution matters. Break drop-off down by the sibling `*_blocked_*` / `*_failed` events.

**2 · Product discovery · Browse** — pre-cart attention.
`$pageview → view_item_list → view_item → view_time_product → view_image`

**3 · Engagement · Share / notify → return** — engagement-to-return.
`$pageview → (share_content OR enable_product_notifications) → $pageleave → $pageview`
Step 2 is an **OR GroupNode** (either event counts).

## A–D · Stories & Chat engagement→conversion funnels

Created 2026-06-14 from `funnels/chat-stories-funnels.md`. Order type `ordered`, range `-90d`,
`filterTestAccounts: false`. Breakdowns left off the saved insights (no ingested values yet) — apply
ad-hoc in the UI.

| # | Steps | Window | Suggested breakdown |
|---|---|---|---|
| A | `view_story → story_product_clicked → view_item → add_to_cart → order_completed` | 7 d | `seller_user_id`, `story_type` |
| B1 | `chat_opened → chat_message_sent → order_completed` | 14 d | `is_order_chat` |
| B2 | `chat_product_shared → view_item → add_to_cart → order_completed` | 14 d | — |
| C | `screen_view_event[screen_name=story_screen] → story_uploaded` | 1 d | `media_type` |
| D | `chat_opened → chat_message_sent → chat_message_sent → chat_message_sent` (≥3 msgs) | 7 d | — |

**Not yet done:** the two retention cohorts (`Stories viewers`, `Chat senders`) and the Correlation
tab on funnel B — see `chat-stories-funnels.md` §"Beyond funnels".

---

## Appendix — recreation specs

Paste each `source` into an `insight-create` call as
`{ "name": "…", "query": { "kind": "InsightVizNode", "source": <below> } }`, or rebuild step-by-step in
the UI. Confirm events exist first with `read-data-schema {"query":{"kind":"events"}}`.

### 1 · Checkout · Create-order conversion
```json
{ "kind": "FunnelsQuery", "funnelsFilter": { "funnelVizType": "steps", "funnelOrderType": "ordered" },
  "series": [
    { "kind": "EventsNode", "event": "$pageview", "name": "Pageview" },
    { "kind": "EventsNode", "event": "add_to_cart" },
    { "kind": "EventsNode", "event": "view_cart" },
    { "kind": "EventsNode", "event": "order_begin_checkout" },
    { "kind": "EventsNode", "event": "address_selected" },
    { "kind": "EventsNode", "event": "payment_method_selected" },
    { "kind": "EventsNode", "event": "checkout_confirm_clicked" },
    { "kind": "EventsNode", "event": "place_order_clicked" },
    { "kind": "EventsNode", "event": "order_submit_attempt" },
    { "kind": "EventsNode", "event": "order_completed" }
  ] }
```
_(canonical step order — `place_order_clicked` then `order_submit_attempt`)._

### 2 · Product discovery · Browse
```json
{ "kind": "FunnelsQuery", "funnelsFilter": { "funnelVizType": "steps", "funnelOrderType": "ordered" },
  "series": [
    { "kind": "EventsNode", "event": "$pageview", "name": "Pageview" },
    { "kind": "EventsNode", "event": "view_item_list" },
    { "kind": "EventsNode", "event": "view_item" },
    { "kind": "EventsNode", "event": "view_time_product" },
    { "kind": "EventsNode", "event": "view_image" }
  ] }
```

### 3 · Engagement · Share / notify → return
```json
{ "kind": "FunnelsQuery", "funnelsFilter": { "funnelVizType": "steps", "funnelOrderType": "ordered" },
  "series": [
    { "kind": "EventsNode", "event": "$pageview", "name": "Pageview" },
    { "kind": "GroupNode", "operator": "OR", "name": "share_content, enable_product_notifications",
      "nodes": [
        { "kind": "EventsNode", "event": "share_content" },
        { "kind": "EventsNode", "event": "enable_product_notifications" }
      ] },
    { "kind": "EventsNode", "event": "$pageleave" },
    { "kind": "EventsNode", "event": "$pageview", "name": "Pageview" }
  ] }
```

### A · Stories → Purchase
```json
{ "kind": "FunnelsQuery", "dateRange": { "date_from": "-90d" },
  "funnelsFilter": { "funnelOrderType": "ordered", "funnelWindowInterval": 7, "funnelWindowIntervalUnit": "day" },
  "series": [
    { "kind": "EventsNode", "event": "view_story" },
    { "kind": "EventsNode", "event": "story_product_clicked" },
    { "kind": "EventsNode", "event": "view_item" },
    { "kind": "EventsNode", "event": "add_to_cart" },
    { "kind": "EventsNode", "event": "order_completed" }
  ] }
```

### B1 · Chat → Purchase
```json
{ "kind": "FunnelsQuery", "dateRange": { "date_from": "-90d" },
  "funnelsFilter": { "funnelOrderType": "ordered", "funnelWindowInterval": 14, "funnelWindowIntervalUnit": "day" },
  "series": [
    { "kind": "EventsNode", "event": "chat_opened" },
    { "kind": "EventsNode", "event": "chat_message_sent" },
    { "kind": "EventsNode", "event": "order_completed" }
  ] }
```

### B2 · Chat product share → Purchase
```json
{ "kind": "FunnelsQuery", "dateRange": { "date_from": "-90d" },
  "funnelsFilter": { "funnelOrderType": "ordered", "funnelWindowInterval": 14, "funnelWindowIntervalUnit": "day" },
  "series": [
    { "kind": "EventsNode", "event": "chat_product_shared" },
    { "kind": "EventsNode", "event": "view_item" },
    { "kind": "EventsNode", "event": "add_to_cart" },
    { "kind": "EventsNode", "event": "order_completed" }
  ] }
```

### C · Story creation (seller upload)
```json
{ "kind": "FunnelsQuery", "dateRange": { "date_from": "-90d" },
  "funnelsFilter": { "funnelOrderType": "ordered", "funnelWindowInterval": 1, "funnelWindowIntervalUnit": "day" },
  "series": [
    { "kind": "EventsNode", "event": "screen_view_event", "custom_name": "Story screen viewed",
      "properties": [{ "key": "screen_name", "type": "event", "value": "story_screen", "operator": "exact" }] },
    { "kind": "EventsNode", "event": "story_uploaded" }
  ] }
```

### D · Chat engagement depth
```json
{ "kind": "FunnelsQuery", "dateRange": { "date_from": "-90d" },
  "funnelsFilter": { "funnelOrderType": "ordered", "funnelWindowInterval": 7, "funnelWindowIntervalUnit": "day" },
  "series": [
    { "kind": "EventsNode", "event": "chat_opened" },
    { "kind": "EventsNode", "event": "chat_message_sent", "custom_name": "1st message" },
    { "kind": "EventsNode", "event": "chat_message_sent", "custom_name": "2nd message" },
    { "kind": "EventsNode", "event": "chat_message_sent", "custom_name": "3rd message" }
  ] }
```

---

Keep this catalog, `docs/posthog-events.md`, and the per-funnel spec docs in sync whenever a funnel or
event changes.
