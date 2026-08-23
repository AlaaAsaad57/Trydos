# Unit Testing Conventions

How to write a test in this repository. For **what** to test and **in what
order**, see [`UNIT_TEST_ROADMAP.md`](./UNIT_TEST_ROADMAP.md) — it holds the
phase list. This document holds the rules that apply to every phase.

## Commands

| Command | What it does |
|---|---|
| `pnpm test` | Watch mode. For working on a test. **Never use this in a gate — it does not exit.** |
| `pnpm test:run` | Runs the suite once and exits. This is what the `unit-tests` gate check calls. |
| `pnpm test:coverage` | Runs once with coverage. Prints a summary and writes `coverage/index.html`. |

Coverage output is ignored by git. Open `coverage/index.html` in a browser to
read it.

## Where a test file goes

**A test file goes in the `tests/` mirror of the file it tests.**

```
serverRequests/HandleAuthedFetch.ts  →  tests/serverRequests/HandleAuthedFetch.test.ts
utils/cookies/cookie-manager.ts      →  tests/utils/cookies/cookie-manager.test.ts
utils/server/authRefresh.ts          →  tests/utils/server/authRefresh.test.ts
app/api/auth/login/route.ts          →  tests/app/api/auth/login/route.test.ts
```

**Mirror the full path.** `utils/server/tokenManager.ts` goes to
`tests/utils/server/tokenManager.test.ts`, not `tests/utils/tokenManager.test.ts`.
Flattening one level looks harmless and then two files that test neighbouring
modules end up in different folders.

There are two reasons for the mirror. The first is safety: some of these paths
carry auth, cookies, routing and build config, and a new file inside one of them
trips the protected-path stop. Testing from outside the glob avoids that without
weakening any guardrail. The sensitive globs are `proxy.ts`, `serverRequests/**`,
`utils/cookies/**`, `app/api/auth/**`, `services/auth.ts`, `services/cart.ts`,
`services/order.ts`, `services/orders.ts`, `store/index.ts` and `next.config.ts`.
The second is simply that one location per suite is easier to find than two.

**The one exception is `utils/functions.test.ts`**, which sits next to its source
because it was written before this rule settled. Leave it there; do not copy it.

## Lint rules and tests

The i18n rules (`local/translate-key-exists`, `i18next/no-literal-string`) are
**off** for any file named `*.test.*` or `*.spec.*`. Those rules protect wording
a user can see, and a test ships none — a test often uses a deliberately fake or
untranslated key. You do not need a `eslint-disable` comment for this.

Every other lint rule still applies to test files.

## How to mock

Use `vi.mock` at the top level of the file, then import the module under test
**inside** the test through a loader that resets the module registry first. This
matters because the modules here read the store and the cookies at import time.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("store", () => ({
  useAppStore: { getState: () => mockStoreState },
}));

async function loadModule() {
  vi.resetModules();
  return import("./theModule");
}
```

See `utils/functions.test.ts` for a full working example.

Rules:

- **No test performs real I/O.** No network, no Redis, no Elasticsearch, no
  Firebase, no real cookie writes. If a test would reach outside the process,
  mock the boundary.
- **Clean up.** `vi.unstubAllGlobals()` and `vi.clearAllMocks()` in `afterEach`.
- **Pin anything ambient.** Fix the timezone and the locale before asserting on a
  formatted date or number, or the test passes on your machine and fails on
  someone else's.

## Coverage

`vitest.config.mts` covers **whole folders** — `app/**`, `components/**`,
`services/**`, `store/**`, `utils/**`, `serverRequests/**` and `proxy.ts`.

So a phase adds nothing to that list. Every file the app ships is already in the
report, and a file with no test shows up at 0% — which makes the report double as
the list of what is still to do. (It used to be an explicit list of files, one
per phase. That version flattered the number: it only ever reported on files
somebody had already tested.)

There is no pass mark for coverage, on purpose. Too little is covered for a
number to mean anything yet. One can be added once enough is covered.

Read the whole-app share as the honest headline, and the per-file numbers for
depth. `pnpm test:coverage` prints the summary and writes `coverage/index.html`.

## What not to test

- **Plain setters.** `setFoo: (v) => set({ foo: v })` asserts that Zustand works,
  not that our code does. Test the functions that compute something.
- **Type-only files.** Nothing to execute.
- **Translation completeness.** Already covered by `pnpm lint:i18n-parity` and the
  `local/translate-key-exists` rule. Do not duplicate it.
- **The framework.** Assume Next.js, React and Zustand work.

## Two things that will waste an afternoon

**`server-only` resolves through a shared stand-in.** That import is a marker the
framework's build understands; it is not an installed package, so nothing can
load a module carrying it until something stands in. `vitest.config.mts` points
it at `tests/mocks/serverOnly.ts`, which resolves to nothing in a server-like
test and **throws in a browser-like one** — the same rule the build applies, just
decided by test environment instead of by bundle. So a test for a server module
needs `// @vitest-environment node` at the top of the file. If you see
"server-only: this module cannot be imported from a browser-like test", that line
is what is missing.

This alias is shared by every test in the repository. Deleting one phase's tests
does not remove it, and removing it stops several suites loading at all.

**The framework's per-request memory does nothing in a test.** `cache()` from
React only memoizes while a render is in progress. Outside one — which is every
unit test — it calls straight through and keeps nothing, in every build. A module
built on it will appear to run its work twice, and that is the harness missing,
not the module misbehaving. Supply the store yourself in that test file (see
`tests/serverRequests/requestDedup.test.ts`) and say in the file what the
stand-in therefore does not prove.

## When a module resists testing

Write it down in the ticket as a finding. Do **not** refactor the module to make
it testable inside a testing ticket — that is its own ticket, with its own
review.
