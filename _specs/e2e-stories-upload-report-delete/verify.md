---
ticket: e2e-stories-upload-report-delete
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Verify — e2e-stories-upload-report-delete

**2026-09-20 — every acceptance criterion in scope is proved. The browser lane
is green against real staging, and the existing QA lock still holds.**

It took four attempts. The first two never reached Playwright, and the two
diagnoses behind them were both wrong; the third and fourth each found a real
defect in the application. All of that is recorded below rather than tidied away,
because two of those defects are now fixed on the strength of it.

## What was proved

| AC | How | Result |
|---|---|---|
| AC-1 | `tests/services/story.test.ts` | pass |
| AC-2 | `tests/utils/qaStoryFilter.test.ts` + `storiesBarClient.test.tsx` (late viewer) | pass |
| AC-3, AC-4 | `tests/utils/qaStoryFilter.test.ts` | pass |
| AC-11 | `tests/harness/storyFinder.test.ts` | pass |
| AC-16 | `tests/services/story.test.ts` | pass |
| AC-18 | `tests/utils/qaStoryFilter.test.ts` | pass |
| BUG-1 | `tests/components/Home/addStoryWidget.test.tsx` | red first, then pass |

Validation profile `full`, all four checks:

| Check | Result |
|---|---|
| `pnpm lint` | exit 0 — 0 errors |
| `npx tsc --noEmit` | exit 0 |
| `pnpm test:run` | **198 files, 3001 tests, all passed** |
| `pnpm build` | exit 0 (run locally, before the search backend went down) |

## The browser lane

```
npx tsx tests/e2e/cli.ts run --lane=account --grep="STORY-"      →  8 passed (4.0m)
npx tsx tests/e2e/cli.ts run --lane=account --grep=@prod-safe    → 17 passed (4.5m)
```

| Case | AC | Result |
|---|---|---|
| STORY-00a the uploader signs in | — | pass |
| STORY-00b the reporter signs in | — | pass |
| STORY-01 a photo story is uploaded and carries this run's mark | AC-5, AC-7 | pass |
| STORY-03 the feed shows this run's own story | AC-12 | pass |
| STORY-03b a guest never sees it while it is live | AC-14 | pass |
| STORY-04 the second account reports it | AC-8, AC-10 | pass |
| STORY-05 deleted, and gone from the backend | AC-9, AC-13 | pass, 28 s |
| the QA safety lock, 17 cases including QA-11 | AC-14 | pass |

The stories backend's own answer to the report, from the run log:
`POST /api/v1/stories/report → 201 · "Report submitted successfully" · reportId 73`.

## What the four attempts cost, and what they bought

**Attempt 1 — build failed.** Read as "the search backend is down". **Wrong.**
`curl -k` answered `401`: alive, asking for credentials.

**Attempt 2 — build failed again.** Read as "this machine's proxy breaks TLS".
Node does report `SELF_SIGNED_CERT_IN_CHAIN`, and exporting all 585 trusted
certificate authorities into `NODE_EXTRA_CA_CERTS` changed nothing. **Also
wrong, and irrelevant:** `services/elastic/elasticsearch.config.ts:16` sets
`rejectUnauthorized: false`, so the app never verifies that certificate. The real
cause was the `requestTimeout: 8000` on the same client — the home page
prerenders through a search query, and it did not answer inside eight seconds
from here. It passed on the next attempt with no change.

**Attempt 3 — 6 passed, STORY-04 failed.** A test defect, and an instructive one.
`openRing` expected the uploader's tile to be in the rendered bar, but the bar
loads page one and fetches more only when its end scrolls into view. The
uploading account sees its own ring at the front; the reporting account sees it
wherever the backend orders it. Fixed by walking the bar the way a shopper does,
bounded to the same five pages as the feed finder. **AC-11 is about exactly this,
and it had only been solved at the data level.**

**Attempt 4 — 7 passed, STORY-05 failed → `BUG-2`.** A real application defect;
see Findings.

## Findings — application defects this ticket fixed

| BUG | What was wrong | Proof | Fixed in |
|---|---|---|---|
| BUG-1 | The upload sheet's promise never settled on three paths: a video over a minute, a refused upload (both branches), and a video the browser never decodes. The `await` never returned, so nothing after it ran; on one path the spinner never stopped. | `tests/components/Home/addStoryWidget.test.tsx`, two cases, **seen red** then green | `AddStoryWidget.tsx` — every exit settles, the decode wait is capped, `finally` always clears the control |
| BUG-2 | **The delete confirmation could not be pressed.** `react-cube-navigation` mounts four panes at once; each has a `transform`, which creates a stacking context, so the dialog's `z-index: 999999999999999` cannot escape its own pane. Inactive panes are only `aria-hidden` — they still take pointer events, and their tap zones sat on top of it. | `STORY-05` **seen red**, with a 38-attempt interception log naming the intercepting pane, then green in 28 s | `StoryHolder.tsx` — the confirmation now portals to `document.body`, the same escape `ReportStoryModal` already used |

`BUG-2` is the one a unit test could never have caught: jsdom has no layout, so
nothing there can see one element covering another.

## A gap this found

`pnpm e2e:health` printed:

```
[e2e] no health check was made — no search backend, or the probe is off.
```

while `ELASTICSEARCH_NODE` **is** set in `.env.development`. The health command is
the thing you are meant to run before blaming a test, and it said nothing about
the backend that went on to stop the build. Whatever it is checking, it is not
the value that is configured. Worth its own ticket; not this one's to fix.

## What happens next

**Do not add `--skip-build`** to get past the build: the viewer allow-list is a
`NEXT_PUBLIC_` value and is inlined at build time, so a reused build would serve
an app without it and every stories case would fail for the wrong reason.

## Known coverage gaps, carried forward

- `STORY-00b` and `STORY-04` run locally only. `TEST_ACCOUNT_OTP_2` is in the
  local environment file but is not a repository secret, so on CI the report
  journey skips. That is missing coverage, not a pass.
- `AC-6` (a video story) is withdrawn — no tool available here can produce an MP4
  the app's picker accepts.
- `BUG-1`'s refusal path is fixed but not separately proved; a test for it passes
  before and after, so none is claimed.
