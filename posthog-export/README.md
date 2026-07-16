# PostHog export bundle

Portable snapshot of the **created** PostHog entities in project `Default project`
(id `200119`, org `Ramaaz`, `eu.posthog.com`), exported via the PostHog MCP on **2026-06-15**.

Purpose: re-create this analytics setup in a **different PostHog org/account** (production)
without copying anything by hand.

## What's in here

| File | Contents |
|------|----------|
| `manifest.json` | Source project info + inventory + notes |
| `insights.json` | 17 insights (funnels, trends, retention, lifecycle, HogQL tables) as ready `insight-create` payloads |
| `dashboards.json` | 2 dashboards + which insights tile onto them (by original `short_id`) |
| `cohorts.json` | 1 cohort (`Internal / Test users`) |

There are **0** actions, feature flags, surveys, and experiments — nothing to export for those.

## What is NOT in here (and can't be)

- **Raw collected data** — events, persons, sessions. This is not a portable artifact; it
  re-accumulates in the new project once the SDK points at it.
- **IDs** — every entity gets a brand-new id in the target project. That's why dashboard↔insight
  links are stored **by name / short_id** and rebuilt at import time, not copied.

`_starter: true` marks PostHog's auto-generated starter dashboard/insights (`My App Dashboard`
and the `Internal / Test users` cohort). A fresh project creates its **own** copies of these, so
importing them will create duplicates. **Skip starter items unless you deliberately want them.**

## How to import (into the new account)

Point the PostHog MCP at the **target** project (switch org/project in the MCP), then drive the
create tools. Order matters: **cohorts → dashboards → insights** (insights attach to dashboards
using the new dashboard id).

Tell Claude:

> "Import `posthog-export/` into the **current** PostHog project. Skip `_starter: true` items.
>  1. For each cohort in `cohorts.json`: `cohorts-create` with `{name, description, is_static, filters}`.
>  2. For each dashboard in `dashboards.json`: `dashboard-create` with `{name, description, pinned, delete_insights: false}`. Keep a map of dashboard name → new id.
>  3. For each insight in `insights.json`: `insight-create` with `{name, description, favorited, tags, query}`. If its `_dashboard` is set, also pass `dashboards: [<new id of that dashboard>]` so it tiles onto the right dashboard."

### Field mapping (source → create tool)

- **insight-create** ← `insights.json[*]`: pass `name`, `description`, `favorited`, `tags`, `query`
  verbatim. Add `dashboards: [newDashboardId]` when `_dashboard` is non-null. Drop the `_`-prefixed
  helper keys (`_source_short_id`, `_dashboard`, `_starter`).
- **dashboard-create** ← `dashboards.json[*]`: pass `name`, `description`, `pinned`,
  `delete_insights: false`. The `tiles` array is only a re-link reference — tiles are created by
  setting each insight's `dashboards` field in step 3. (`layouts` are best-effort cosmetic; the
  create tool doesn't take per-tile layout, so positions may need a quick drag in the UI.)
- **cohorts-create** ← `cohorts.json[*]`: pass `name`, `description`, `is_static`, `filters`.

## Caveats to expect on import

1. **Tile order / layout** is approximate — `dashboard-create` + per-insight `dashboards` rebuilds
   membership and order, but pixel layout (`layouts`) may need a manual nudge in the UI.
2. **Queries reference events by name** (`order_completed`, `chat_opened`, `story_uploaded`, …).
   They save fine immediately but stay empty until those events are ingested in the new project.
3. **`resultCustomizations` / color presets** (in `FOX3HItD`) are cosmetic and safe to keep or drop.
4. Re-export anytime by re-running the MCP read tools (`insights-list` + `insight-get`,
   `dashboards-get-all` + `dashboard-get`, `cohorts-list` + `cohorts-retrieve`).
