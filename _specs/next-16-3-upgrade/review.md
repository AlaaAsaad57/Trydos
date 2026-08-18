---
ticket: next-16-3-upgrade
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-18
links:
  clickup:
  github:
---

# Review — next-16-3-upgrade

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Round 6 — APPROVED.** Majors across the rounds: **9 → 7 → 3 → 1 → 1 → 0**.
All three lenses returned no major findings and all three stated the plan is
ready. The comprehension check passed 4/4. Follow-up numbering continues
unbroken; the items below are carried into implement, not back into planning.

## Review Scope

`spec.md` (unchanged since it was written) and `plan.md` revision 6, with
`research.md` and rounds 1–5 of this file as background. The panel ran all three
lenses, each told which of its own prior findings to verify and which decisions
are settled.

The senior lens was additionally tasked with a dedicated **internal-consistency
audit**, because rounds 4 and 5 each closed every follow-up while introducing a
new contradiction. It confirms revision 6's *Measurement and reference map* is
coherent: every name used in a step is defined in the map, no step restates a
condition the map contradicts, the round-5 route-table contradiction is gone, and
every cross-reference survives the step renumbering.

Comprehension check: 4 questions against a floor of 3, one on the mandatory
integration axis (CG-5). No `major` findings, so CG-6 seeded no extra questions.
Recorded in `comprehension.md`.

## Plan Summary

Six commits: pin the three framework packages and `typescript` exactly with a
constrained lock diff and a resolved-version **regression** gate; convert
twenty-eight leaf files carrying the accessor flag; convert the root layout in
its own commit; align the four error boundaries, or drop that slice if the
installed contract already matches; then two compiler switches in separate
commits that revert together if the native path proves inactive, without removing
the accessor flag. Every baseline and reference is defined once in a measurement
map that the steps refer to by name.

## Risks

- Slice B remains the only change that can alter user-visible output, and it
  touches the root layout, which renders on every page in the locale tree and
  feeds four raw-HTML structured-data payloads.
- The accessor's flag status in the target version is unverified from this
  repository and is a step-6 check with two branches; the plan's ordering rules
  are written for the gated branch.
- The framework configuration is edited by up to three commits, two of them in
  the same block, so a revert there can conflict textually.
- The deploy path's dependency-override gap stays open by decision; this ticket
  measures it and blocks only on a regression.

## Assumptions

- The target patch is published for all three framework packages — a step-3
  check, not an assumption.
- The deploy install command still installs development dependencies (AC-11) —
  confirmed by the owner before implement begins.
- React stays at 19.2.0.

## Open Questions

- No `OQ-n` from `research.md` is open; each is answered in `spec.md` or
  `plan.md` (PL-12 satisfied).
- **Governance question, unresolved and now recurring** (rounds 2–6): a
  response-header regression has no acceptance criterion to fail against, and the
  correct fix — adding a criterion to `spec.md` — is a hard stop under
  `CLAUDE.md`. Six rounds have hit this wall. It did not block approval and it is
  recorded as an accepted limitation, but it is worth raising with the Workflow
  Owner as a question about whether spec amendment should become a supported
  move, independent of this ticket.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

**No `major` findings in this round from any lens.** Seven minors and several
informational notes, all carried into implement as named follow-ups rather than
into another plan revision.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | minor | The flag-conditional branch is not carried through. Step 6 and *Files to change* mark the accessor flag conditional, but five later statements are absolute — "edited by three different commits", the flag-ordering rules, and step 7's "build with the flag applied". In the stable branch an implementer meets instructions that cannot be executed or whose reason has evaporated. | plan steps 6, 7, Integration surface, Rollback | **Accept — FU-66.** The sharpest of the round; fold in at implement. |
| security | minor | Slice B2 converts the root layout, which feeds the locale into two of the four raw-HTML payloads, but step 10 verifies only the page language attribute and the right-to-left class — the exact two signals step 9 says pass through a mapping whitelist that would mask a divergence. | plan step 10 against step 9 | **Accept — FU-67.** Keep the byte-identity assertion running through B2; remove instrumentation after B2, not B1. |
| performance | minor | A flag-only rendering-mode shift has two conflicting responses: the map's global rule says no route may change its rendering mode, but step 7 says only "record any difference". If the flag alone pushes locale routes to per-request rendering, that is a cost on every page and the plan does not say it blocks. | plan Measurement map, step 7 | **Accept — FU-68.** State whether a flag-induced shift blocks or is accepted with the cost named. |
| senior | minor | Rollback says both ordering constraints are stated in the Integration surface, but the ordering list does not contain the D1/D2 pairing — it appears only in step 13. The pointer is wrong. | plan Rollback against Integration surface | **Accept — FU-69.** Wording. |
| senior | minor | Internal count mismatch: the twenty-nine is derived as thirty-six minus one route handler, five client dashboard screens and the client not-found page (six client files), while the exclusion paragraph says seven client components. The repository has nine client files under the locale tree, six of which read route parameters. Does not change the settled twenty-nine-file set. | plan Files to change | **Accept — FU-70.** Correct the counts. |
| senior | minor | The three-sample rule is written for dev-memory readings only, so the build-duration band would be judged on one noisy sample per side. | plan Measurement map, steps 2, 4 | **Accept — FU-71.** Extend the rule or mark the band indicative. |
| senior | minor | Two measurements escape the map that claims to define every reading: step 13's "measurable compile-time drop" has no named baseline, and the post-D2 dev-memory readings at steps 13 and 14 are unnamed. | plan steps 13, 14, Out of scope | **Accept — FU-72.** Name the final reading, or prefer the Babel-plugin-absent signal. |
| security | info | Slice B1 commits a framework-configuration edit but is the one configuration-touching commit with no header comparison attached; coverage returns only at the final gate run. | plan step 9 against steps 4, 13, 15 | **Accept as optional.** Fold the header comparison into the step-7 flag-only build — near-zero cost, that build happens anyway. FU-73. |
| performance | info | Roughly ten cold-cache production builds plus about fifteen dev-server sampling sessions land on a machine the spec itself calls constrained; the plan does not budget implement time for this. | plan steps 2–15 | **Noted.** Expect implement to be build-bound; sequence across sessions. |
| performance | info | The root layout is converted twice — the throwaway probe and the real conversion — costing one extra build. | plan steps 8, 10 | **Noted.** Keep it: the probe runs before the twenty-eight leaf files, so the extra build is cheaper than reworking B1. |
| senior | info | "Six commits" is stated absolutely while slice C may be dropped, a reporting-tool bump may add one, and the lint fallout has no stated commit home. The Validation strategy already says the count is not the check, so nothing is at risk. | plan Approach, steps 5, 11 | **Noted.** State that lint fallout is committed with slice A if touched. |
| performance | info | `BASE-DEV-MEM` is the one reading with no gate and no threshold. | plan Measurement map | **Noted.** Correct under NFR-4; keep it labelled as evidence, not pass/fail. |
| senior | info | The Integration surface tests out against the repository: the framework configuration as shared protected ground, the lock file against the two package managers and the override gap, the four raw-HTML sinks, the eleven metadata URL builders, the browser-suite workflow as a late failure point, and the four ways the locale is read. Nothing material missing. | plan Integration surface | **Noted.** No action. |
| security | info | Every security-relevant check survived the restructuring intact and correctly placed: the pre-bump resolved-version snapshot outside the working tree, the in-process byte-identity comparison with its metadata coverage and URL-field targeting, the unconditional escaping ticket, and the preview-deploy proof of AC-2 with the upload-token caveat. | plan steps 2, 4, 9, 16 | **Noted.** No action. |
| senior | info | No over-engineering: no wrapper around the accessor, no configuration for a value that never changes, protected-path handling and the lint-fallout stop rule unchanged and correct. | plan Files to change, Out of scope | **Noted.** No action. |

## Decision

`APPROVED`

- Rationale: all three lenses returned no major findings and all three stated the
  plan is ready. The senior lens's dedicated internal-consistency audit — added
  because rounds 4 and 5 each closed every follow-up while introducing a new
  contradiction — confirms that revision 6's measurement map removed the failure
  mode rather than renaming it: every reference is defined once with its build
  state, every step refers to it by name, and the round-5 contradiction is gone.
  The plan is executable end to end: an implementer can follow it without
  inventing a decision, every check can mechanically run, every revert trigger
  has a defined comparison partner and threshold, and every acceptance criterion
  has a stated way to be recorded at verify — including AC-10, which needed an
  explicit answer because the accessor flag provably cannot be turned off on its
  own. Seven minors remain. None blocks: they are wording corrections, a check
  placement inside slice B, two count and naming tidies, and one genuine
  gap — the flag-conditional branch is not carried through the later absolute
  statements — which an implementer meets only in the branch where the flag turns
  out unnecessary, and which is one sentence to resolve. They are carried into
  implement as FU-66..FU-73 rather than into a seventh revision, because a
  further round would cost more than the corrections are worth and the panel has
  converged. The comprehension check passed 4/4, covering the ordering constraint
  that breaks the build, the reference table, the AC-10 recording method, and why
  the locale check cannot be an HTTP probe.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-review (ADR-009), comprehension check passed
  4/4 on 2026-08-18.

## ADR reference

- ADR: none

## Required Follow-up Actions

**None blocking.** Implementation may begin. The following are carried into
implement and recorded at verify; none requires a plan revision or a spec change.

- **FU-66** — Carry the flag-conditional branch through. One sentence in step 6:
  if the accessor is stable in the target version, no flag exists, the three
  flag-ordering rules do not apply, slice B1 reverts alone, and the framework
  configuration is edited by two commits rather than three.
- **FU-67** — Keep the in-process byte-identity assertion running through slice
  B2, covering the URL-bearing fields of the payloads the root layout mounts, and
  remove the instrumentation after B2 rather than after B1.
- **FU-68** — State whether a flag-induced rendering-mode shift blocks slice B or
  is accepted with the cost named at verify. The map's global rule and step 7
  currently disagree on its force.
- **FU-69** — Fix the Rollback pointer: the D1/D2 pairing is stated in step 13,
  not in the Integration surface ordering list.
- **FU-70** — Make the client-file counts agree: nine client files under the
  locale tree, six of which read route parameters. The twenty-nine-file set is
  unchanged.
- **FU-71** — Extend the three-sample rule to build-duration readings, or state
  that the build-duration band is indicative and never a gate.
- **FU-72** — Name the post-D2 dev-memory reading in the measurement map and say
  whether step 14 reuses it, and either give the compile-time signal a baseline
  or prefer the Babel-plugin-absent signal.
- **FU-73** — Optional: fold the header and source-map comparison into the step-7
  flag-only build, so the one configuration-touching commit without header
  coverage gains it at near-zero cost.

**Accepted limitation, unchanged:** a response-header regression has no
acceptance criterion to fail. The check exists in the plan and runs, but
`/verify` records against `AC-n`. See Open Questions.
