---
ticket: ui-migrations-7e-start-flow
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Review — ui-migrations-7e-start-flow

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1..FR-17, NFR-1..NFR-7, AC-1..AC-20) and `plan.md` (approach,
answers to OQ-3/5/6/12/15, Steps 1-14, Files to change, Integration surface,
Tests, Rollback). The code the plan names was read for context: `components/Home/Init.tsx`,
`utils/PopupCountry.tsx`, `components/global/PageCover.tsx`, `components/skeleton/SheetSkeleton.tsx`,
`NewLoginDesign/NewLoginWidget.tsx`, `components/DemoApp1/screens/CountryPickerBody.tsx`,
`components/DemoApp1/AppShell.tsx`, `components/Home/NavbarClient.tsx`, `utils/fetchData.ts`,
`proxy.ts` (read only).

**How the panel ran on this account.** The account owner forbids subagents and parallel
agents. So the three advisory lenses (senior, security, performance) were applied by the
main agent, one after another, with each lens's own instructions
(`agents/senior-reviewer.md`, `security-reviewer.md`, `performance-reviewer.md`). The same
agent wrote the plan, so this panel is less independent than the framework intends. The
CG-8 falsifier check is also done by the main agent, not blind (see `comprehension.md > degraded`).

## Plan Summary

`Init` keeps its "when" rules and renders a new `AppStartFlow` host in place of
`PopupCountry`. The host wraps the real `NewLoginWidget` with the `/demo`
`CountryPickerBody` fed by the real country list. A pick saves the locale cookies, and the
flow goes on with no reload. The end of the flow does one full load to the picked country's
address. A small `AppSignInAsk` host runs the `/demo` 5 s timer on every page except
`/login`, `/loginDemo` and `/demo`, with the phone-based guest test and the real overlay
states. It loads the sheet and the login only when needed. A new store flag
`loginLayerOpen` keeps one scaled canvas. The proven hang is fixed by a server guard in
`CoverBox`. No protected path changes.

## Risks

- Two `AppScaler` instances if any path opens a login canvas while `loginLayerOpen` is not set.
- A loop in the flow if its end moves to a `gb-` address (see S-2).
- `/demo` look changes through the new optional props on shared design parts.
- Safari 26 bottom colour during the first paint of the flow (see S-1).

## Assumptions

- `NewLoginWidget`'s `onFinish` runs on "Later", on the close and on the login's end (read in `NewLoginWidget.tsx:257-302`).
- The proxy keeps honouring `_bypass=popup-selection` on a supported locale (`proxy.ts:474-492`).
- The app's start always reads the starter settings fresh (`services/home.ts:41-63`, cache read commented out).

## Open Questions

- none beyond the findings below.

## Panel Findings (advisory)

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| security | major | **S-3.** `?changed-country=<new>,<old>` comes from the address, so anyone can write it. Step 6 uses those values as the rows, writes them into the `country` cookie, and builds the end address `/<picked>-<lang>…`. A value such as `/evil.example` would make `/<picked>` a protocol-relative `//evil.example-en/…` address: an open redirect after the flow. | plan Step 6; AC-5, AC-7; FR-5 | **mitigate** (owner) — follow-up F-1 |
| senior | major | **S-2.** Step 6 says the picked country "falls back to the address's country when nothing was picked: a close before a pick". On a `gb-` address that end address is `/gb-<lang>…`, where `Init` shows the flow again: a loop. The picker column has no Later or close button, so the path is unreachable today, but the plan still declares a test for it (AC-7 row, "a close before a pick keeps the address's country"). | plan Step 6; Tests AC-7; FR-7 | **mitigate** (owner) — follow-up F-2 |
| senior | major | **S-1.** Step 6 and Step 7 draw the server-side white cover as a full-screen box. If it is `position: fixed`, iPhone Safari 26 paints a solid block under its bar while it shows, and the splash fix of part 1 exists to avoid exactly that (the widget runs in the document flow there). The plan does not say how the cover is placed. | plan Steps 6-7; NFR-7, AC-19 | **mitigate** (owner) — follow-up F-3 |
| performance | minor | **P-1.** `AppSignInAsk` runs on every page and Step 8 reads `anyLayerOpen()` from `components/DemoApp1/ui.tsx`, a large module. An old page such as `/about` may not load `ui.tsx` today, so this import could break NFR-1's 1,024 B budget. | plan Step 8; NFR-1, AC-18 | minor, no disposition required — checked by the Step 13 numbers |
| performance | minor | **P-2.** The login widget loads only on the sheet's "Get Started" tap, so the first tap waits for a large chunk. S7e-9 asks for no wait on a tap. | plan Step 8; S7e-9 | minor, no disposition required — noted |
| senior | minor | **S-4.** `CountryPickerBody` imports `COUNTRIES` from `components/DemoApp/demoPlaces.ts`, which also holds the `/demo` place tree. The real flow's chunk then carries `/demo` place data. S7e-6 names only `demoOrders.ts` and `DemoData.tsx`, but the spirit is the same. | plan Step 5; S7e-6 | minor, no disposition required — noted |
| senior | minor | **S-5.** FR-3 / AC-3 (no page visible before the cover) rely on `Init`'s server render deciding "show". For a `?no-country` address the decision needs the query; if `Init` bails out to the client there, the page shows first. The plan checks this only in the browser at Step 12. | plan Steps 7, 12; FR-3, AC-3 | minor, no disposition required — checked at Step 12 |
| performance | info | `introWords` adds about 20 keys to every page's RSC payload (HTML, not JS). NFR-1 counts JS only. | plan Step 4; NFR-1 | info — noted |
| security | info | No secret, no new endpoint, no protected path. The staging phone and codes used in Step 12 are never written to a file (plan says so). | plan Step 12 | info — noted |
| senior | info | The `language` cookie that Step 6 also sets is read by `proxy.ts:461`, `utils/fetchData.ts:190` and `InitFunction.tsx:11`, so it is needed (checked). | plan Step 6 | info — noted |

## Decision

`APPROVED`

- Rationale: the plan meets PL-11..PL-14 (integration surface stated, every OQ answered,
  one Tests row per AC-n with existing coverage searched). The hang cause is proven, and the
  fix is one guard at its source. The owner passed the gate 5/5 (`comprehension.md`) and
  approved on 2026-11-28 with the words "approved but should implement fix those majors". So
  the three `major` findings are mitigated in implement as the follow-ups below; they do not
  send the plan back.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — 2026-11-28

## ADR reference

- ADR: none

## Required Follow-up Actions

Implement carries these out inside the files `plan.md` already lists. They add no file and no
test file; they change how Steps 6 and 7 are built and which test cases the declared files hold.

1. **F-1 (S-3).** `AppStartFlow` uses a `changed-country` value only when it is a 2-letter
   code found in the real country list. Otherwise the address counts as `no-country` (all list
   rows, nothing chosen). The end address is built with `new URL(path, window.location.origin)`,
   and the move happens only when the result's origin equals the page's origin. Test cases in
   `tests/components/DemoApp1/AppStartFlow.test.tsx`:
   - "a changed-country value that is not a listed country is ignored";
   - "the end address always stays on this site".
2. **F-2 (S-2).** The flow ends only after a pick. On `changed-country` the marked new country
   counts as the pick, so "Later" there ends on it. Drop the "falls back to the address's country"
   rule of Step 6, and drop the test case "a close before a pick keeps the address's country". The
   end address never has a `gb-` locale. Test case in the same file: "the end of the flow never
   opens a gb address".
3. **F-3 (S-1).** The server-side white cover of Steps 6 and 7 sits in the document as
   `CoverBox` and `Layer` do: `position: absolute`, never `fixed`. Step 12 adds a WebKit check with
   an iPhone Safari 26 user agent on `/gb-en`. While the cover and the splash wait, no element with
   `position: fixed` may touch the bottom edge of the window (the same check part 1 ran for P-1).
   The result goes in `implement.md`.
