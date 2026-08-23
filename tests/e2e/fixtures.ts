// The test object every spec imports, instead of `@playwright/test` directly.
//
//   import { test, expect } from "./fixtures";
//
// Two reasons it exists rather than being added later:
//
//   * **Skipping is automatic.** A machine with no staging addresses started no
//     server, so every spec must skip rather than fail against nothing. Doing it
//     here means no spec has to remember, and no spec can forget.
//   * **It is where the write tracker goes.** Ticket 2 adds a `track` fixture
//     that registers a created order the moment its id is known, and cancels it
//     in teardown if the spec died before it could. Fixtures are the only place
//     that reliably runs after a failing test.

import { test, expect } from "@playwright/test";

import { hasBackends, loadLiveEnv } from "./harness/env";

// Registered when this module loads, which is once per spec file — so every spec
// that imports `test` from here inherits it, and none of them has to remember.
//
// `beforeEach` rather than an auto fixture on purpose: `test.skip(condition, …)`
// is supported in a test body and in a hook, and a fixture is neither.
test.beforeEach(() => {
  loadLiveEnv();
  test.skip(
    !hasBackends(),
    "No staging addresses configured — see tests/e2e/README.md.",
  );
});

export { test, expect };
