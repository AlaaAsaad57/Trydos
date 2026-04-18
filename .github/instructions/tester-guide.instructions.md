---
applyTo: "tester guide/**/*.md"
description: "Use when the user asks for a tester guide, QA guide, test scenarios, or manual testing checklist. Ensures complete case-specific coverage."
---

# Tester Guide Instructions

When the user asks for a tester guide, create a complete, case-specific manual testing document.

## Objective

- Cover all relevant testing areas for the exact case the user asks for.
- Avoid generic checklists that are not tied to the requested case.
- Make the guide directly usable by a tester without additional explanation.

## Required Workflow

1. Identify the exact requested case (feature, flow, bug fix, API, or page).
2. Infer affected modules, actors, dependencies, and environments.
3. Build scenarios that include normal flow, edge cases, and failure conditions.
4. Provide explicit expected results for every scenario.
5. Include out-of-scope notes so boundaries are clear.

If the request is ambiguous, ask concise clarifying questions first. If questions are not possible, proceed with explicit assumptions.

## Required Sections In Every Tester Guide

1. `Title`
2. `Purpose`
3. `Scope`
4. `Out Of Scope`
5. `Assumptions`
6. `Preconditions`
7. `Environment And Build`
8. `Test Data`
9. `Execution Steps`
10. `Test Scenarios`
11. `Expected Results`
12. `Negative And Edge Cases`
13. `API/Network Validation` (when applicable)
14. `UI/Responsive Validation` (when applicable)
15. `Security/Permission Validation` (when applicable)
16. `Performance/Latency Checks` (when applicable)
17. `Logging And Evidence To Capture`
18. `Severity/Priority Guidance`
19. `Exit Criteria`
20. `Risks And Notes`

## Scenario Quality Rules

- Write scenarios as action-oriented, numbered steps.
- Each scenario must include:
  - scenario ID
  - precondition (if needed)
  - steps
  - expected result
  - severity if failed
- Include positive, negative, boundary, and regression-focused scenarios.
- Validate behavior for role-based access and permission differences where relevant.
- Include cross-browser/device coverage only when relevant to the case.

## Completeness Rules

- Map scenarios to all impacted user journeys for the case.
- Include data validation (required fields, invalid formats, limits, duplicates, empty states).
- Include network/API behavior (status codes, payload correctness, error handling, retries) when relevant.
- Include integration touchpoints (analytics, notifications, third-party systems) when relevant.
- Include localization, timezone, and currency checks when the case can be affected by them.

## Output Style

- Keep content concise but complete.
- Use clear headings and numbered lists.
- Prefer checklists and scenario tables when they improve clarity.
- Avoid filler text and vague instructions.

## Final Validation Before Responding

Confirm the generated tester guide:

- Is specific to the requested case.
- Covers all related flows and realistic edge cases.
- Defines expected outcomes clearly enough for pass/fail decisions.
- Includes evidence/logging expectations for defect reporting.
