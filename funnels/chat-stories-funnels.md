# Funnels — Chat & Stories

_Proposed PostHog funnels (and the events they need) to answer two questions:_

1. **Engagement → activity** — do users who use **stories** or **chat** stay active / retain better?
2. **Engagement → revenue** — do **stories** / **chat** users **purchase** more, and which flows convert?

> PostHog stitches events **per person** (`distinct_id`, and across sessions once a user is
> identified on login — see `utils/posthog.ts`, `person_profiles: "identified_only"`). So a funnel
> like `view_story → order_completed` works **without** threading product IDs through every step —
> PostHog correlates at the user level over a time window. We add a few IDs as **properties** only
> so we can break funnels down by seller/product, not because the funnel needs them.

This is intentionally **minimal**. Stories viewing is already tracked; chat is the real blind spot.
We add **6 events total** (3 of them optional) and build the funnels below.

---

## What we already have (reuse — no code)

From `docs/posthog-events.md` / `utils/GAEvents.ts`. Every `GAevent()` is fanned out to PostHog
(`utils/gtag.ts`) with global props auto-attached (`user_id_guest`/`user_id_verify`, `screen_name`,
`device_type`, `country_name`, `session_id`, …).

| Event | Fires today | Useful for |
|---|---|---|
| `view_story` | per story shown — `store/homepage/actions.jsx:19`, `StoryHolder.tsx:~208`. Props: `story_id`, `item_id`, `story_type`, `product_link`, `screen_name` | Stories top-of-funnel + retention cohort |
| `screen_view_event` (`STORY_SCREEN`) | story viewer mount — `NewStories.tsx:~91` | Stories session entry |
| `screen_view_event` (`CHAT_SCREEN`) | chat modal open — `ChatModal.tsx:~26` | Chat entry (until `chat_opened` lands) |
| `view_item` | product page view | bridge step (story/chat → product) |
| `add_to_cart` / `order_add_to_cart` | cart add | mid-funnel |
| `order_begin_checkout` | checkout start | mid-funnel |
| `purchase` / `order_completed` | order placed | funnel goal |
| `share_content` | product shared (channel) | adjacent to chat product-share |

**Gaps that block the funnels below:**
- Stories are tracked for *viewing* but **not for the shoppable click** (story → product). That click
  is the conversion bridge and fires **no** event today (`StoryViewer.tsx:429-446`).
- Chat emits **zero** custom events beyond the screen view — no open, no message sent, no product share.

---

## New events (6 — keep it to these)

> **Status: all 6 are now wired** via `utils/posthogEvents.ts:trackPosthog()` (PostHog-only) and
> documented in `docs/posthog-events.md` §4. The funnels below can be built in the PostHog UI now.


**Routing rule (important):**
- An event **already in** `utils/GAEvents.ts:GA_EVENT_NAMES` → fire via **`GAevent()`** as today (it
  fans out to both GA and PostHog). This applies to the *reused* events above (`view_story`, etc.).
- A **new** event (none of the 6 below exist in `GA_EVENT_NAMES`) → send it to **PostHog only**. Do
  **not** add it to `GA_EVENT_NAMES` and do **not** route it through `GAevent()` — we don't want new
  names polluting the GA taxonomy.

**How to send a PostHog-only event and keep the global props.** The global props (screen, country,
device, `user_id_guest`/`user_id_verify`, session) are computed *inside* `GAevent`
(`utils/gtag.ts:70-79`) and attached to its PostHog fan-out — `posthogCapture()` alone does **not**
add them. So add a thin posthog-only wrapper that attaches the same lean prop block and calls
`posthogCapture(event, props)`:

```ts
// utils/posthogEvents.ts (new) — posthog-only, mirrors gtag's global-prop block.
// Names live in their own maps (CHAT_EVENTS / STORY_EVENTS), NOT in GA_EVENT_NAMES.
export const STORY_EVENTS = { STORY_PRODUCT_CLICKED: "story_product_clicked", /* … */ } as const;
export const CHAT_EVENTS  = { CHAT_MESSAGE_SENT: "chat_message_sent", /* … */ } as const;

export const trackPosthog = (event: string, props?: Record<string, unknown>) =>
  posthogCapture(event, { ...globalProps(), ...props }); // globalProps = the lean block from gtag.ts
```

Best to **factor the global-prop block out of `gtag.ts`** into a shared `globalProps()` so `GAevent`
and `trackPosthog` use one source (no duplication). **Do not** use `trackOrder()` — its `baseProps`
read the live cart, which is empty on chat/stories screens. Add a row to `docs/posthog-events.md` in
the same PR (repo rule); note these are PostHog-only (like the order-funnel stream in §2).

### Stories

| Event | Where to fire | Props | Priority |
|---|---|---|---|
| `story_product_clicked` | "View Product" tap — `components/Home/Stories/StoryViewer.tsx:429-446` (in the `onClick` that already calls `setSelectedStory(null)`) | `story_id`, `product_slug`, `story_type`, `seller_user_id` | **P0 — the shoppable bridge** |
| `story_link_clicked` | "View More" external link — `StoryViewer.tsx:405-427` | `story_id`, `story_type`, `link` | P2 (optional) |
| `story_uploaded` | upload success — `AddStoryWidget.tsx:~272` (image) / `~315` (video). Constants already exist (`CONFIRM_UPLOAD_STORY_BUTTON`) but are commented out | `media_type` (image/video), `has_link`, `has_product` | P2 (seller-side engagement) |

### Chat

| Event | Where to fire | Props | Priority |
|---|---|---|---|
| `chat_opened` | chat modal open — `components/Chat/ChatModal.tsx:18-32` (alongside the existing `SCREEN_VIEW`) | `source` (nav / product / order), `unread_count` | **P1** (clearer than relying on `screen_view_event`) |
| `chat_message_sent` | message send — `components/Chat/pages/ConversationContainer.tsx:370-409` | `conversation_id`, `message_type` (text/image/voice/video/share_product), `is_order_chat` (bool, from `order_chat_participant_id`), `is_reply` | **P0 — core engagement signal** |
| `chat_product_shared` | product shared into chat — `services/chat.ts:119-150` (`ShareProduct`) | `product_id`, `product_slug`, `receiver_user_id` | **P0 — the chat→purchase bridge** |

> Everything else the chat code *could* emit (calls, pin/mute, block, forward, delete, search — see the
> wider audit) is **out of scope**: it doesn't serve either question. Add later only if a specific
> question demands it.

---

## Funnels to build in PostHog

> **Status: ✅ built in PostHog on 2026-06-14** (via PostHog MCP). All five live on the dashboard
> **[Engagement → Conversion Funnels (Stories & Chat)](https://eu.posthog.com/project/200119/dashboard/746757)**
> (id `746757`). They currently read **empty** — the chat/stories events are wired in code but
> `trackPosthog()` no-ops outside production, so no events have been ingested yet. Tiles populate
> automatically once a prod build ships these events. See `funnels/README.md` for the full build log.
>
> | # | Funnel | Insight | Conversion window |
> |---|---|---|---|
> | A | Shoppable story → purchase | [`5YRJuZ0Z`](https://eu.posthog.com/project/200119/insights/5YRJuZ0Z) | 7 days |
> | B1 | Chat → purchase | [`WldKkpg3`](https://eu.posthog.com/project/200119/insights/WldKkpg3) | 14 days |
> | B2 | Chat product share → purchase | [`OteeGGFL`](https://eu.posthog.com/project/200119/insights/OteeGGFL) | 14 days |
> | C | Story creation (seller upload) | [`HlqM7Fkg`](https://eu.posthog.com/project/200119/insights/HlqM7Fkg) | 1 day |
> | D | Chat engagement depth | [`QHPWr8pr`](https://eu.posthog.com/project/200119/insights/QHPWr8pr) | 7 days |
>
> Breakdowns (`seller_user_id`, `story_type`, `is_order_chat`, `media_type`) were **not** baked into
> the saved insights — apply them ad-hoc in the UI per the notes below, since the breakdown properties
> have no ingested values to validate against yet.

Build these in **PostHog → Funnels**. Suggested conversion window **7 days** unless noted (shopping
consideration is multi-session). Add **breakdowns** where called out.

### A. Shoppable story → purchase  ⭐ (primary stories question)
```
view_story → story_product_clicked → view_item → add_to_cart → order_completed
```
- **Answers:** do stories drive sales, and where do shoppable stories leak?
- **Breakdown:** `seller_user_id` (which sellers' stories convert), `story_type` (video vs image).
- Until `story_product_clicked` ships, a weaker proxy is `view_story → view_item → order_completed`
  (can't distinguish a story-driven product view from any other — that's exactly why P0).

### B. Chat → purchase  ⭐ (primary chat question)
```
chat_opened → chat_message_sent → order_completed
```
and the stronger commerce-intent variant:
```
chat_product_shared → view_item → add_to_cart → order_completed
```
- **Answers:** do buyers who talk to sellers convert better than those who don't?
- **Breakdown:** `is_order_chat` (pre-sale chat vs post-order support — very different intent).
- **Window:** 14 days (seller negotiation often spans days).

### C. Story creation (seller engagement) — optional
```
screen_view_event[STORY_SCREEN] → (open add-story) → story_uploaded
```
- **Answers:** of sellers who can post stories, how many actually do? Upload drop-off.
- Needs `story_uploaded` (P2) and optionally re-enabling the commented-out add-story button events.

### D. Chat engagement depth — optional
```
chat_opened → chat_message_sent (1) → chat_message_sent (≥3)
```
- Use a funnel with a repeated step / or a "≥N events" cohort. Shows lurkers vs real conversations.

---

## Beyond funnels: the "active users" question

Funnels show conversion; **retention + correlation** answer "are these users more active." No extra
events needed beyond the above.

- **Retention** (PostHog → Retention): cohort **"performed `view_story`"** or **"performed
  `chat_message_sent`"** as the *start* event, returning event = any pageview / `screen_view_event`.
  Compare against the all-users baseline → does engaging with stories/chat predict coming back?
- **Correlation** (PostHog → Funnels → Correlation tab): on funnel **B** or the global
  `order_completed` funnel, enable correlation to see whether `chat_message_sent` /
  `story_product_clicked` are statistically correlated with conversion. This is the fastest read on
  "engagement ↔ purchase" before you commit to dashboards.
- **Cohorts to save:** `Stories viewers`, `Chat senders`, `Story-driven buyers`
  (`story_product_clicked` then `order_completed`) — reuse across insights.

---

## Suggested rollout order

1. ~~**P0 events** — `story_product_clicked`, `chat_message_sent`, `chat_product_shared`.~~ ✅ done.
2. ~~**P1** — `chat_opened`.~~ ✅ done. ~~**P2** — `story_link_clicked`, `story_uploaded`.~~ ✅ done.
3. ~~**Build the funnels in PostHog** — A & B, then C & D.~~ ✅ done 2026-06-14 (see table above + `funnels/README.md`).
4. **→ Next:** ship a prod build so the events ingest, then add the two retention cohorts
   (`Stories viewers`, `Chat senders`) and turn on the Correlation tab on funnel B.

Each PR: add the name to a PostHog-only map (`STORY_EVENTS` / `CHAT_EVENTS`, **not** `GA_EVENT_NAMES`),
fire via the `trackPosthog()` wrapper with the props above, and add the row to `docs/posthog-events.md`.
Verify on a preview/prod deploy (wrappers no-op in dev).
