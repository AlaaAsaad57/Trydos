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

**A test file sits next to the file it tests.**

```
utils/orderFunnel.ts       →  utils/orderFunnel.test.ts
store/listing/reducer.ts   →  store/listing/reducer.test.ts
```

**Exception — sensitive paths.** When the file you are testing sits under one of
the sensitive globs listed below, put the test in a `tests/` mirror of the same
path instead:

```
serverRequests/HandleAuthedFetch.ts  →  tests/serverRequests/HandleAuthedFetch.test.ts
utils/cookies/cookie-manager.ts      →  tests/utils/cookies/cookie-manager.test.ts
app/api/auth/login/route.ts          →  tests/app/api/auth/login/route.test.ts
```

The reason is safety, not taste. These paths carry auth, cookies, routing and
build config, so we keep them free of files that are not runtime code. Writing
the test outside the glob keeps that line clean. The sensitive globs are
`proxy.ts`, `serverRequests/**`,
`utils/cookies/**`, `app/api/auth/**`, `services/auth.ts`, `services/cart.ts`,
`services/order.ts`, `services/orders.ts`, `store/index.ts` and `next.config.ts`.

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

`vitest.config.mts` holds an explicit `include` list. **It names files, not
folders.**

Naming a folder would report on hundreds of files nobody has tested, and the
number stops meaning anything. Each phase appends the files it covered:

```ts
include: [
  'utils/functions.tsx',
  'utils/orderFunnel.ts',   // added by the phase that tested it
],
```

Watch the file extension — the source may be `.tsx` while the test is `.ts`. An
entry that matches nothing produces an empty report that looks like a broken
config.

There is no pass mark for coverage, on purpose. Too little is covered for a
number to mean anything yet. One can be added once enough is covered.

## What not to test

- **Plain setters.** `setFoo: (v) => set({ foo: v })` asserts that Zustand works,
  not that our code does. Test the functions that compute something.
- **Type-only files.** Nothing to execute.
- **Translation completeness.** Already covered by `pnpm lint:i18n-parity` and the
  `local/translate-key-exists` rule. Do not duplicate it.
- **The framework.** Assume Next.js, React and Zustand work.

## When a module resists testing

Write it down in the ticket as a finding. Do **not** refactor the module to make
it testable inside a testing ticket — that is its own ticket, with its own
review.
