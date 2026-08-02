---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Spec — remove-debug-pages-and-any-leaking-servers-info

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Backend disclosure reduction — remove client-facing debug surfaces and backend
identity.

## Business Goal

Someone probing the storefront from a browser can currently build an accurate map
of our backend estate: the hostnames of our services, how many there are, what
each one is for, and which of the two backends serves any given endpoint. Two
unauthenticated debug pages hand most of this over directly. That map is the
first step of a targeted attack, and it costs an attacker nothing to obtain.

This work removes that reconnaissance value. It does not make the platform
attack-proof — it raises the cost of the first step and removes surfaces that
should never have shipped to production.

## User Story

> As the operator of the Trydos storefront, I want the browser to disclose
> nothing about our backend hosts, service inventory, or backend split, so that
> an attacker performing reconnaissance gains no free map of our internal
> architecture.

## Functional Requirements

- **FR-1 — Backend hostnames must not reach the browser.** The base URLs of the
  market, Go gateway, elastic, stories, comments, and wallet services must not
  be present in anything served to the client, and must not be resolvable from
  client-side code.
- **FR-2 — One documented exception.** The chat service base URL is knowingly
  excluded from FR-1, because retained webview functionality reads it from the
  browser. This exception must be explicit, not incidental.
- **FR-3 — The API-test and request-log debug surfaces must not be reachable.**
  Neither may resolve in any deployed environment, and neither may be reachable
  by direct URL.
- **FR-4 — The user-simulation debug surface is retained** and must continue to
  work as it does today. It is deliberately not covered by FR-3.
- **FR-5 — Client-side request logging must cease.** The application must stop
  recording request URLs, bodies, responses, and user identifiers into browser
  storage.
- **FR-6 — Responses must not disclose which backend served a request.** No
  response may indicate whether an endpoint is handled by the Go gateway or the
  legacy backend.
- **FR-7 — Service identifiers exchanged with the browser must be
  non-descriptive.** The values the client uses to address each proxied service
  must not name or abbreviate that service. The mapping from identifier to
  service must be resolvable only on the server. Identifiers that differ in
  request-handling behaviour must remain distinct from one another.
- **FR-8 — Product comparison must be served by the Go gateway.** The comparison
  feature's product-detail and quantity/price lookups must reach the Go backend,
  and the feature must continue to return correct data. This corrects an existing
  misrouting.
- **FR-9 — No functional regression.** Every proxied service must remain fully
  reachable and behave as before, for both guest and authenticated sessions.

## Non-Functional Requirements

- **NFR-1 — No user-visible behaviour change**, other than the correction
  required by FR-8.
- **NFR-2 — Type safety, linting, and a production build must all pass.**
- **NFR-3 — No unused or orphaned code may be left behind** by the removals.
- **NFR-4 — The identifier-to-service mapping must remain legible to
  maintainers** on the server side, so that opaque external values do not make
  the codebase harder to work on.
- **NFR-5 — Diagnostic capability must degrade knowingly, not silently.** Where
  removing client-side logging reduces error-report context, that loss must be
  accepted deliberately rather than discovered later.

## Constraints

- **C-1 — Configuration must be updated before release.** The renamed
  configuration values must exist in every deployment environment — production,
  preview, and development — before the change is published. Publishing first
  would leave every backend address empty and take the platform down.
- **C-2 — The chat service configuration is excluded** from the rename (FR-2).
- **C-3 — The service-identifier change must take effect as a single
  indivisible change.** A partially applied mapping causes live requests to be
  rejected as an unknown service.
- **C-4 — Two services that share an address but differ in request handling must
  keep separate identifiers.** Collapsing them would lose a behavioural
  distinction.
- **C-5 — Data already stored in users' browsers is not cleaned up.** Existing
  request-log data is left to expire on its own schedule.
- **C-6 — Work already applied to the working tree is part of this ticket** and
  must be delivered with it, not committed separately.
- **C-7 — Removing client-side logging must not remove the ability to report
  errors**, only the locally retained request history.

## Edge Cases

- **EC-1 — Returning users carry stale browser state.** Existing browsers hold
  request-log data and an unread record of the last unauthorized request. Neither
  is read by the application; both must be harmless after the change.
- **EC-2 — A deployment environment is missed during configuration update.**
  Preview and development environments fail the same way production would (C-1).
- **EC-3 — Rebuilding an older deployment** against updated configuration
  reintroduces the failure C-1 guards against.
- **EC-4 — Error-reporting history splits.** Telemetry tagged with the old
  service names will not match records tagged with the new identifiers, so saved
  searches and dashboards filtering on the old values stop matching.
- **EC-5 — Sessions in flight during release.** Users mid-session must not be
  logged out or broken; authentication state is keyed independently of the
  service identifiers.
- **EC-6 — FR-8 changes the effective upstream.** If the legacy backend is
  currently answering the comparison lookups, the corrected routing may surface
  differences in the shape of the response.
- **EC-7 — Call sites not covered by automated checking.** Some places that name
  a service are not verifiable by the type system and can break silently, most
  notably a binary file download in the seller dashboard.

## Open Questions

None. All questions raised during research were resolved before this
specification was written.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | The API-test debug surface does not resolve; requesting it directly returns a not-found response. | FR-3 |
| AC-2  | The request-log debug surface does not resolve; requesting it directly returns a not-found response. | FR-3 |
| AC-3  | The user-simulation debug surface still resolves and functions as before. | FR-4 |
| AC-4  | Neither the hostnames nor the configuration-variable names of the six in-scope backends appear anywhere in the built client output. | FR-1 |
| AC-5  | The chat backend remains present in the client output, and this is recorded as the known, accepted exception rather than reported as a failure. | FR-2 |
| AC-6  | After exercising the application, no request URLs, bodies, responses, or user identifiers are written to browser storage. | FR-5 |
| AC-7  | No response returned to the browser indicates which backend served the request. | FR-6 |
| AC-8  | Every service identifier sent from the browser is non-descriptive: it does not name or abbreviate the service it addresses, and the identifiers share no common decodable pattern. | FR-7 |
| AC-9  | Services that share an address but differ in request handling still carry distinct identifiers, and the behaviour that distinguishes them is unchanged. | FR-7, C-4 |
| AC-10 | All seven proxied services remain reachable and return correct results, for both guest and authenticated sessions. | FR-9 |
| AC-11 | Product comparison returns correct product-detail and quantity/price data, served by the Go gateway. | FR-8 |
| AC-12 | The seller-dashboard binary template download still succeeds. | FR-9, EC-7 |
| AC-13 | Type checking, linting, and a production build all complete successfully. | NFR-2 |
| AC-14 | No unused files, exports, or dependencies remain after the removals. | NFR-3 |
| AC-15 | Error reporting still functions after client-side request logging is removed. | FR-5, C-7 |
| AC-16 | No file outside the agreed change set is modified. | NFR-1 |

## Out of Scope

- **The webview calling functionality and the chat backend host.** It calls the
  chat service directly from the browser and cannot simply be routed through the
  proxy, because it authenticates with a token supplied by its caller rather than
  the browser's own session. Redirecting it would authenticate as a different
  principal. Deferred to a separate ticket; this is the reason for FR-2.
- **Bearer tokens carried in webview URLs.** A pre-existing defect discovered
  during research: a session token is passed as a URL parameter and propagated
  into further navigation, exposing it via referrer headers, browser history, and
  server access logs. **This is more severe than anything this ticket addresses**
  and needs its own security ticket. It is named here so it is not lost.
- **The media service address and its API key.** The media host stays reachable
  from the browser because uploads go direct. The accompanying API key is a live
  credential embedded in client code and requires its own remediation.
- **The image-host allowlist**, which publicly names the media host, a staging
  host, and a storage bucket.
- **Cross-site request forgery protection on the proxy**, and **restricting which
  upstream paths the proxy will forward.** These are the two controls that would
  actually constrain proxy abuse. Opaque identifiers (FR-7) raise reconnaissance
  cost only and must not be treated as a substitute.
- **Sanitizing error responses** across the API surface, several of which return
  upstream error detail.
- **Cleaning up request-log data already stored in users' browsers** (C-5).

## Achievable outcome — stated plainly

This ticket removes the debug surfaces, stops client-side request logging, hides
**six of the seven** backend hostnames, and obfuscates service names. It does
**not** achieve zero disclosure: the chat host remains (FR-2), the opaque
identifiers are still visible to anyone reading the client code, and an attacker
can still determine how many services exist by probing them. Acceptance is
measured against the criteria above, not against a claim of total opacity.
