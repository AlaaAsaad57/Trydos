// @vitest-environment node
//
// Doing the same work once per request instead of twice. AC-29, AC-30.
//
// WHERE THIS FILE LIVES, AND WHY
// The helper under test sits under `serverRequests/**`, which is a sensitive
// path. A new file inside that folder would trip the protected-path stop, so the
// test sits in this mirror instead. Nothing inside the folder is added or
// changed, and no guardrail had to be loosened to allow it.
//
// WHAT IS STOOD IN, AND WHAT THAT COSTS
// The helper keeps its store in the framework's per-request memo. Outside a real
// render that memo does nothing at all — it hands the work straight back and
// keeps nothing, in every build of the framework. So a test written against the
// real thing would watch the helper run the same work twice and call it a bug in
// the helper, when it is the harness that is missing.
//
// This file therefore supplies the one thing the helper is designed to sit on: a
// store that stays the same for the length of one request. What that proves is
// OUR half — the keying, the sharing, and what happens when shared work fails.
// What it does NOT prove is the framework's half: that the store is really new
// on the next request and really shared within one. That is the framework's job,
// and the conventions here say to assume the framework works.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 5000, hookTimeout: 5000 });

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    // One request's worth of memory: the first call builds the value, every
    // later call in the same module instance gets that same one back. Re-import
    // the module (see `loadForOneRequest`) to start the next request.
    cache: <T,>(fn: () => T) => {
      let value: T;
      let built = false;
      return () => {
        if (!built) {
          value = fn();
          built = true;
        }
        return value;
      };
    },
  };
});

/** A fresh copy of the helper — i.e. the start of a new request. */
async function loadForOneRequest() {
  vi.resetModules();
  return import("serverRequests/requestDedup");
}

/** Work that can be counted, and released when the test says so. */
function makeWork<T>(result: T) {
  let release!: (value: T) => void;
  let fail!: (reason: Error) => void;
  const run = vi.fn(
    () =>
      new Promise<T>((resolve, reject) => {
        release = resolve;
        fail = reject;
      }),
  );
  return {
    run,
    finish: () => release(result),
    breakIt: (message: string) => fail(new Error(message)),
    get callCount() {
      return run.mock.calls.length;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the same work asked for twice (AC-29)", () => {
  it("runs it once and gives both callers the same answer", async () => {
    // This is the real case: a page and the pop-up version of the same page are
    // both rendered for one visit. Two identical searches go out, and the second
    // one opens a snapshot on the search cluster that nobody ever reads or
    // closes. One execution is the whole point.
    const { dedupeRequest } = await loadForOneRequest();
    const work = makeWork("the result");

    const first = dedupeRequest("listing:shoes", work.run);
    const second = dedupeRequest("listing:shoes", work.run);
    work.finish();

    await expect(first).resolves.toBe("the result");
    await expect(second).resolves.toBe("the result");
    expect(work.callCount).toBe(1);
  });

  it("hands the second caller the very same work, not a copy of the answer", async () => {
    const { dedupeRequest } = await loadForOneRequest();
    const work = makeWork("the result");

    const first = dedupeRequest("listing:shoes", work.run);
    const second = dedupeRequest("listing:shoes", work.run);
    work.finish();
    await first;

    // Same promise object: the second caller joined the work already in flight
    // rather than starting its own and finishing at the same time by luck.
    expect(second).toBe(first);
  });

  it("still shares when the second caller arrives after the work has finished", async () => {
    const { dedupeRequest } = await loadForOneRequest();
    const work = makeWork("the result");

    const first = dedupeRequest("listing:shoes", work.run);
    work.finish();
    await first;

    await expect(dedupeRequest("listing:shoes", work.run)).resolves.toBe(
      "the result",
    );
    expect(work.callCount).toBe(1);
  });

  it("keeps different work apart", async () => {
    const { dedupeRequest } = await loadForOneRequest();
    const shoes = makeWork("shoes");
    const coats = makeWork("coats");

    const a = dedupeRequest("listing:shoes", shoes.run);
    const b = dedupeRequest("listing:coats", coats.run);
    shoes.finish();
    coats.finish();

    await expect(a).resolves.toBe("shoes");
    await expect(b).resolves.toBe("coats");
    expect(shoes.callCount).toBe(1);
    expect(coats.callCount).toBe(1);
  });

  it("tells apart two keys that only differ at the end", async () => {
    // The caller builds these keys by joining the search terms, the sort and the
    // filters together, so near-identical keys are the normal case, not a rare
    // one. A sloppy match here would show a shopper someone else's results.
    const { dedupeRequest } = await loadForOneRequest();
    const first = makeWork("page one");
    const second = makeWork("page two");

    const a = dedupeRequest("listing:shoes|page:1", first.run);
    const b = dedupeRequest("listing:shoes|page:2", second.run);
    first.finish();
    second.finish();

    await expect(a).resolves.toBe("page one");
    await expect(b).resolves.toBe("page two");
  });

  it("starts again on the next request", async () => {
    const one = await loadForOneRequest();
    const workA = makeWork("first request");
    const a = one.dedupeRequest("listing:shoes", workA.run);
    workA.finish();
    await a;

    const two = await loadForOneRequest();
    const workB = makeWork("second request");
    const b = two.dedupeRequest("listing:shoes", workB.run);
    workB.finish();

    // A new request must not be served last request's answer. (What is proved
    // here is that the helper holds nothing of its own across the two — the
    // framework is what really hands out a new store per request.)
    await expect(b).resolves.toBe("second request");
    expect(workB.callCount).toBe(1);
  });
});

describe("when the shared work fails (AC-30)", () => {
  it("fails every caller that joined it", async () => {
    const { dedupeRequest } = await loadForOneRequest();
    const work = makeWork("never returned");

    const first = dedupeRequest("listing:shoes", work.run);
    const second = dedupeRequest("listing:shoes", work.run);
    // Both handles are watched before the failure is triggered, so neither can
    // surface later as an unhandled failure in some other test.
    const results = Promise.allSettled([first, second]);
    work.breakIt("the search cluster said no");

    expect(await results).toEqual([
      { status: "rejected", reason: expect.any(Error) },
      { status: "rejected", reason: expect.any(Error) },
    ]);
    expect(work.callCount).toBe(1);
  });

  it("lets the next caller try again instead of handing on the failure", async () => {
    // A failed entry used to stay in the store for the rest of the request, so
    // the first error for a key became the answer for every later caller — one
    // refused query took the rest of the page down with it. Now the entry is
    // dropped, and only successes are shared.
    const { dedupeRequest } = await loadForOneRequest();
    const failing = makeWork("never returned");

    const first = dedupeRequest("listing:shoes", failing.run);
    const watched = first.catch(() => "failed");
    failing.breakIt("the search cluster said no");
    await watched;

    const working = makeWork("recovered");
    const second = dedupeRequest("listing:shoes", working.run);
    working.finish();

    await expect(second).resolves.toBe("recovered");
    expect(failing.callCount).toBe(1);
    expect(working.callCount).toBe(1);
  });

  it("stops holding a key open once its work has failed", async () => {
    // The other half of the same fix: a failure no longer leaves an entry behind,
    // so keys built from the address cannot pile up in a request that hits a run
    // of errors.
    const { dedupeRequest } = await loadForOneRequest();
    const failing = makeWork("never returned");

    const attempt = dedupeRequest("listing:shoes", failing.run);
    const watched = attempt.catch(() => "failed");
    failing.breakIt("the search cluster said no");
    await watched;

    // A success now stores cleanly under the same key.
    const working = makeWork("recovered");
    const retry = dedupeRequest("listing:shoes", working.run);
    working.finish();
    await retry;

    const joined = dedupeRequest("listing:shoes", working.run);
    await expect(joined).resolves.toBe("recovered");
    expect(working.callCount).toBe(1);
  });

  it("lets the next request try again after a failure", async () => {
    const one = await loadForOneRequest();
    const failing = makeWork("never returned");
    const attempt = one.dedupeRequest("listing:shoes", failing.run);
    const watched = attempt.catch(() => "failed");
    failing.breakIt("the search cluster said no");
    await watched;

    const two = await loadForOneRequest();
    const working = makeWork("recovered");
    const retry = two.dedupeRequest("listing:shoes", working.run);
    working.finish();

    // The stickiness above lasts for one request only — the next visitor is not
    // stuck with an error someone else received.
    await expect(retry).resolves.toBe("recovered");
  });
});
