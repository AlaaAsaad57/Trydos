---
ticket: home-stories-pagination-reset
title: "Home stories bar drops loaded pages and skips a page after a product modal opens"
workflow:
  type: hotfix
  version: 2
  current_stage: verify
  capabilities: []
status: completed
owner: developer
created_at: 2026-09-02
updated_at: 2026-09-02
links:
  clickup: ""
  github: ""
---

# Ticket Record — home-stories-pagination-reset

Incident: on the homepage, the stories bar loads page 2 correctly. Opening a
product (an intercepted modal route) and closing it removes the loaded page 2
from the bar, and the next paged request asks for `page=3` instead of `page=2`.
Every further open/close skips one more page.

Workflow: `hotfix` — `intake -> diagnose -> patch -> verify`.
Definition: `workflows/hotfix/workflow.yaml` (wf plugin 3.7.0).

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-09-02
- from_stage: intake
  to_stage: diagnose
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-09-02
- from_stage: diagnose
  to_stage: patch
  event: diagnose-completed
  result: passed
  by: developer
  timestamp: 2026-09-02
- from_stage: patch
  to_stage: verify
  event: patch-completed
  result: passed
  by: developer
  timestamp: 2026-09-02
- from_stage: verify
  to_stage: patch
  event: verify-failed
  result: failed
  by: developer
  timestamp: 2026-09-02
- from_stage: patch
  to_stage: verify
  event: patch-completed
  result: passed
  by: developer
  timestamp: 2026-09-02
- stage: verify
  event: verify-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-09-02
```
