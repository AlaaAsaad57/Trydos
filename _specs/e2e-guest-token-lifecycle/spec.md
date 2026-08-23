---
ticket: e2e-guest-token-lifecycle
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-19
links:
  clickup:
  github:
---

# Spec — e2e-guest-token-lifecycle

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Browser coverage for a guest's token lifecycle.

## Business Goal

Every visitor who has not signed in browses on a token the app issued for them,
and that token stops being accepted about a minute after it is issued. So the
two moments that keep the storefront usable for a guest — quietly exchanging a
refused token, and quietly issuing a whole new guest when that exchange cannot
happen — run for every anonymous visitor, many times a session.

Nothing tests either of them in a browser today. If they break, a guest sees a
failure, an empty screen, or a login prompt they cannot answer, and the first
report comes from a real shopper. This closes that gap for the one visitor type
that cannot be asked to log in and try again.

## User Story

> As a shopper who has never signed in, I want the site to keep working when my
> token stops being accepted, so that I never see an error or lose my place
> while I am browsing.

## Functional Requirements

- **FR-1** — Prove that a first-time visitor is registered as a guest, and ends
  that first visit holding both a working token and the means to renew it.
- **FR-2** — Prove that when a guest's token is refused, the app exchanges it
  for a new one and the visitor stays the same guest.
- **FR-3** — Prove that when the means to renew is refused as well, the app
  issues a completely new guest rather than leaving the visitor stuck.
- **FR-4** — Prove that neither of those recoveries ever asks a guest to sign
  in. A guest has no account to sign in to, so a prompt is a dead end.
- **FR-5** — Prove all of the above without any real token value ever being
  compared, written to a log, or saved in a file.

## Non-Functional Requirements

- **NFR-1** — This repository is public and everything the pipeline keeps is
  readable by anyone. No token value may appear in an assertion, in output, or
  in any recorded artifact.
- **NFR-2** — Coverage must survive ordinary change on the staging backend. No
  criterion may depend on a particular guest, a particular product, or a
  particular number of requests.
- **NFR-3** — Each case must reach its conclusion well inside the guest session
  window, and must fail visibly rather than quietly renewing on its own.
- **NFR-4** — Coverage must tolerate the boot sequence gaining new requests. A
  request that must happen is required; extra requests alongside it are not a
  failure.
- **NFR-5** — Like the rest of this browser coverage, these cases never gate a
  pull request. Red means staging is unhappy or behaviour changed, which is
  worth knowing and is not a reason to block a merge.

## Constraints

- **C-1** — A guest session is valid for roughly sixty seconds by design. The
  app never renews on a timer; it renews only after a real refusal. Any case
  that lets that minute lapse before its next authenticated action will renew by
  itself, which would make FR-1 unreliable and could hide FR-2 entirely.
- **C-2** — Exercising FR-3 creates a real new guest on the staging backend on
  every run. This is accepted, and no cleanup is required or expected. It is the
  only thing these cases leave behind.
- **C-3** — Several refusals at the same moment share a single exchange. Counting
  requests would be measuring timing, not behaviour.
- **C-4** — The identity these cases read is the one the app currently holds for
  the visitor, not a statement from the backend. It answers "is this still the
  same guest as far as the app is concerned", which is exactly what FR-2 and
  FR-3 differ on, and nothing more may be read into it.
- **C-5** — Identity may only ever be compared with an earlier reading of
  itself. Guests are created on staging by traffic that is not ours, so any
  fixed value would be wrong.
- **C-6** — A refusal must be provoked by making the visitor's own stored
  credential unusable. Nothing on the backend may be altered to produce one.

## Edge Cases

- Several refused requests in flight at once, sharing one exchange (C-3).
- A session lapsing on its own part-way through a case, which must be a visible
  failure and never a silent pass (C-1, NFR-3).
- A re-registration beginning while another is already under way.
- The staging backend being unavailable, where these behave like every other
  case here — the run is red or skipped, and that is not a pull request problem.
- A visitor whose credential is refused while they are looking at a page that
  performs no authenticated action, so nothing is renewed until they do
  something.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | No. What is in the cart is not part of this ticket. Opening the cart stays the action that provokes a refusal, but nothing is asserted about its contents. Proving contents survive would first require putting something in the cart, which is a separate capability another ticket already owns. It becomes its own case once that exists. | Out of Scope |
| OQ-2 | Both. A renewal is proven by the outcome — the stored credential changed and the visitor is the same guest — **and** by observing that a renewal was requested and no new registration was. The outcome alone would be sound, but observing the route is what makes a failure diagnosable, and it is the only thing that tells a renewal apart from a re-registration that happened to keep the identity. | AC-4, AC-5, AC-6, AC-7 |
| OQ-3 | A required subset. The first visit must be shown to register the guest and to leave them holding both credentials; other requests in the boot sequence are permitted and must not cause a failure. Pinning the exact set would turn an ordinary change into a break. | AC-1, AC-2, NFR-4 |
| OQ-4 | Deferred — this asks where the coverage is organised, which is an approach decision. | Open Questions |
| OQ-5 | Each case begins from a freshly registered guest so its window starts at zero, and each case carries a stated time budget from registration to its final assertion, exceeding which is a visible failure rather than a quiet renewal. | C-1, NFR-3, AC-10 |
| OQ-6 | Deferred — this asks where the identity reading lives, which is an approach decision. | Open Questions |
| OQ-7 | Yes. The re-registration case must also show that no sign-in prompt appears. The same recovery does prompt other kinds of visitor, so proving a guest stays silent is what prevents a future change from putting an unanswerable prompt in front of every guest whose session lapsed. | AC-8 |
| OQ-8 | Deferred — this asks how the case list is recorded, which is an approach decision. | Open Questions |

## Open Questions

- **OQ-4** — Does this coverage extend the existing guest browsing coverage, or
  stand on its own? It writes nothing but creates a guest, manipulates stored
  credentials, and observes requests, which is a different character from
  read-only browsing. `/plan` decides.
- **OQ-6** — Is reading the visitor's identity done directly where the case is
  written, or placed behind a shared step alongside the other visitor actions?
  The standing rule is that a case describes the journey and never names an
  endpoint. `/plan` decides.
- **OQ-8** — How are these cases recorded in the catalogue of scenarios, and do
  they continue the existing guest numbering or form a group of their own?
  `/plan` decides.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | After a first visit by a visitor with no history, the visitor holds both a working credential and the means to renew it, and the app can name who they are. | FR-1 |
| AC-2 | That first visit is shown to have registered the guest. Additional requests made during the same visit do not cause a failure. | FR-1, NFR-4 |
| AC-3 | Nothing in this coverage depends on a particular guest, a particular product, or a particular number of requests; identity is only ever compared against an earlier reading of itself. | NFR-2 |
| AC-4 | When only the visitor's working credential is made unusable and they then perform an authenticated action, both stored credentials end up different from before. | FR-2 |
| AC-5 | In that same case the visitor is still the same guest, and a renewal was requested while no new registration was. | FR-2 |
| AC-6 | When both the working credential and the means to renew are made unusable and the visitor then performs an authenticated action, both stored credentials end up different from before. | FR-3 |
| AC-7 | In that same case the visitor is a different guest than before, and a renewal was attempted and followed by a new registration. | FR-3 |
| AC-8 | In no case is the guest shown a sign-in or session-expired prompt. | FR-4 |
| AC-9 | No real credential value is compared, printed, or stored anywhere by this coverage; the only permitted observations are whether a value changed and how long it is. | FR-5, NFR-1 |
| AC-10 | Each case starts from a freshly registered guest and reaches its final assertion within a stated budget; exceeding that budget fails the case rather than allowing a renewal that nobody asked for. | NFR-3, C-1 |
| AC-11 | Running this coverage leaves nothing behind on the staging backend except the guests it registered, and it never alters anything on the backend to provoke a refusal. | C-2, C-6 |

## Out of Scope

- What is in the cart, and whether it survives a renewal or is lost with a new
  guest. Opening the cart is only the action that provokes a refusal here.
  Becomes its own case once putting something in a cart is a capability this
  coverage has.
- The same lifecycle for a visitor who has signed in. Their recovery is a
  different path with a different outcome, including prompts a guest never sees.
- The prompt behaviour shown to sellers and to phone-verified shoppers, beyond
  proving a guest never sees it.
- The separate credentials used by chat, stories and the wallet.
- Correcting the known incorrect reference to cart contents in the existing
  coverage. It is unrelated to this ticket and has its own.
- Changing the sixty-second session lifetime. It is intended, and these cases
  work within it rather than against it.
- Anything already covered without a browser. The auth routes, the server-side
  fetch and the credential handling all have isolated coverage already, and this
  ticket must not restate it.
