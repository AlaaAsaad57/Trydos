# Live tests — against the real staging backend

This folder is **empty on purpose**. The split that holds it exists so that
writing the first live test is a new file and nothing else — no config change,
no script change, no argument about whether it belongs in the main suite.

Nothing here has been written yet. Picking this up is its own ticket.

---

## What these are for

The isolated suite (`pnpm test:run`, everything else under `tests/`) answers
**"did our code break?"**. It stubs the backend, so it keeps answering that
question correctly even when staging is down.

A live test answers a different question: **"has the backend drifted away from
what our stubs assume?"** That is a contract test. It is red when staging is
down, when a deploy is mid-flight, or when someone changed a response shape —
all useful to know, none of it a reason to block a pull request.

Because they answer different questions, they never run together.

## How to run them

```bash
pnpm test:live      # this folder only
pnpm test:run       # the isolated suite only — never includes this folder
```

`pnpm test:live` is **not** part of `pnpm test:run` and is **not** part of CI.
If it were, every future test phase would depend on staging being up, and a red
suite would stop meaning "the code broke".

## The rules a live test follows

**1. It does not load `tests/setup.ts`.** That file starts msw with
`onUnhandledRequest: "error"`, which would block the very requests these tests
exist to make. The `live` project in `vitest.config.mts` leaves it out; do not
add it back.

**2. It reads the real addresses from the untracked `.env.development`, and
skips cleanly when they are missing.** Both point at **staging**:

| Variable | Backend |
|---|---|
| `BACKEND_URL` | the core backend |
| `GO_BACKEND_URL` | the gateway (name pending the rename to `GATEWAY_BACKEND_URL`) |

Unset means skip, not fail. Someone who has never configured staging must still
be able to run `pnpm test:live` and get a clean result.

**3. Assertions stay loose.** Status code, the *shape* of a token field, whether
a retry happened. Never an exact response body — pinning one turns a harmless
backend addition into a red suite.

**4. Never assert, log, or snapshot a token or an OTP value.** Not in an error
message, not in a failure diff, not in a snapshot file.

**5. Writing to staging is limited to what was approved.** Creating throwaway
guest records through `/auth/register-guest` is approved. Anything that changes
data a person can see — an order, a product, a shop — is not, and needs its own
decision first.

## What the first tests should cover

Agreed when the split was designed, kept here so it is not lost:

- **The guest-token contract, end to end.** Send a deliberately bad
  `MARKET-TOKEN` at an authed endpoint and let the real
  `401 → /auth/register-guest → retry → 200` sequence run. This is the single
  highest-value live test: it is the path `serverRequests/HandleAuthedFetch.ts`
  takes, and the isolated suite can only prove our half of it.
- **The valid-token half**, using a test account. The owner offered a fixed test
  phone and a fixed debug OTP for this — `TEST_ACCOUNT_PHONE` and
  `TEST_ACCOUNT_OTP` in `.env.development`. Same rule as above: skip when unset,
  and never print either value.
- **`starting-setting` vs `starting_setting`.** The core backend returns the
  hyphen form and the gateway returns the underscore form, and the app reads the
  underscore form only. A live test is the only thing that will notice if that
  ever changes on either side.

## When this folder stops being empty

A live workflow file (`.github/workflows/test-live.yml`) gets added at the same
time: `workflow_dispatch` plus a nightly `schedule`, staging addresses and the
test account supplied as repository secrets, skipping cleanly when they are not
set. It is a separate file from `tests.yml` so that the pull-request check never
needs a secret and never depends on staging.
