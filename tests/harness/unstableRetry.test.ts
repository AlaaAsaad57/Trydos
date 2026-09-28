// @vitest-environment node
//
// The backend retry, and a page that closed before its answer came.
//
// CI run 36416474747 lost two solo-lane cases to the retry itself, not to the
// app and not to a backend:
//
//     Error: route.fulfill: Fetch response has been disposed
//        at harness/unstableRetry.ts:121
//
// "search finds products" and GUEST-48 had both finished their own checks. A
// picture request was still held by the retry when the case closed its
// context, the answer had nobody left to take it, and the throw from
// `route.fulfill` turned a finished case red.
//
// The retry needs a browser to run for real. What it does with a route does
// not, so a route made by hand proves it here.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { retryUnstableBackends } from "../e2e/harness/unstableRetry";

type Handler = (route: unknown) => Promise<void>;

/** Install the retry on a context made by hand, and return what it registered. */
const installedHandler = async (): Promise<Handler> => {
  let handler: Handler | undefined;
  const context = {
    route: async (_matcher: unknown, registered: Handler) => {
      handler = registered;
    },
  };
  await retryUnstableBackends(context as never);
  if (!handler) throw new Error("the retry registered no route handler");
  return handler;
};

/** One held request, as the retry sees it. */
const heldRequest = (options: {
  fetch: () => Promise<unknown>;
  fulfill?: () => Promise<void>;
  abort?: () => Promise<void>;
  pageClosed?: boolean;
  url?: string;
  resourceType?: string;
}) => {
  const route = {
    fetch: vi.fn(options.fetch),
    fulfill: vi.fn(options.fulfill ?? (async () => undefined)),
    abort: vi.fn(options.abort ?? (async () => undefined)),
    continue: vi.fn(async () => undefined),
    request: () => ({
      url: () =>
        options.url ?? "https://media.example.com/image/upload/product/a.jpg",
      method: () => "GET",
      resourceType: () => options.resourceType ?? "fetch",
      headers: () => ({}),
      frame: () => ({ page: () => ({ isClosed: () => options.pageClosed ?? false }) }),
    }),
  };
  return route;
};

const answer = (status: number) => ({ status: () => status });

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("a page that closed before its answer came", () => {
  it("does not fail the case when the answer can no longer be handed over", async () => {
    const handler = await installedHandler();
    const route = heldRequest({
      fetch: async () => answer(200),
      fulfill: async () => {
        throw new Error("route.fulfill: Fetch response has been disposed");
      },
    });

    await expect(
      handler(route),
      "the retry threw because the page that asked had closed, which fails a case that had already finished",
    ).resolves.toBeUndefined();
  });

  it("stops asking again, because nobody is waiting for the answer", async () => {
    const handler = await installedHandler();
    const route = heldRequest({
      fetch: async () => {
        throw new Error("route.fetch: Target page, context or browser has been closed");
      },
      abort: async () => {
        throw new Error("route.abort: Target page, context or browser has been closed");
      },
      pageClosed: true,
    });

    const done = handler(route).then(
      () => "finished",
      (error: Error) => `threw: ${error.message}`,
    );
    // Longer than the three waits together (5 + 10 + 20 seconds).
    await vi.advanceTimersByTimeAsync(40_000);

    expect(
      await done,
      "the retry threw for a request whose page had closed",
    ).toBe("finished");
    expect(
      route.fetch.mock.calls.length,
      "the retry asked the backend again for a page that had already closed",
    ).toBe(1);
  });
});

describe("a call the browser makes ahead of the app (a preload)", () => {
  // The home page preloads the stories bar with `<link rel="preload">`, a GET
  // to `/api/proxy?u=/api/v1/stories/users_stories`. On `127.0.0.1` the proxy
  // refuses that one call with 503 every time: the call carries
  // `Origin: http://127.0.0.1:3100` and the app compares it with
  // `http://localhost:3100`. The app then asks again with its own `fetch`,
  // which answers 200, so nothing a shopper sees depends on the preload.
  //
  // The retry took that 503 for a backend that fell over. It held the call for
  // 35 seconds on every page, 88 times in the account lane of CI run
  // 36416474747, and the renewal gate (`harness/renewalGate.ts`) waited its
  // full 20 seconds for it before every navigation of a signed-in page.
  const PRELOAD = "http://127.0.0.1:3100/api/proxy?s=x&u=%2Fapi%2Fv1%2Fstories%2Fusers_stories";

  it("is left alone, and is not asked again", async () => {
    const handler = await installedHandler();
    const route = heldRequest({
      url: PRELOAD,
      resourceType: "other",
      fetch: async () => answer(503),
    });

    const done = handler(route);
    await vi.advanceTimersByTimeAsync(40_000);
    await done;

    expect(
      route.fetch.mock.calls.length,
      "the retry took hold of a preload, whose answer no case reads",
    ).toBe(0);
    expect(
      route.continue.mock.calls.length,
      "the preload was not passed on to the app untouched",
    ).toBe(1);
  });

  it("does not stop the app's own call to the same address being asked again", async () => {
    const handler = await installedHandler();
    const answers = [answer(503), answer(200)];
    const route = heldRequest({
      url: PRELOAD,
      resourceType: "fetch",
      fetch: async () => answers.shift(),
    });

    const done = handler(route);
    await vi.advanceTimersByTimeAsync(5_000);
    await done;

    expect(
      route.fetch.mock.calls.length,
      "the proxy's 503 on the app's own call was not asked again",
    ).toBe(2);
  });
});

describe("a page that is still open", () => {
  it("still reports an answer that could not be handed over", async () => {
    const handler = await installedHandler();
    const route = heldRequest({
      fetch: async () => answer(200),
      fulfill: async () => {
        throw new Error("route.fulfill: status code 0 is not supported");
      },
    });

    await expect(
      handler(route),
      "a real fault while handing over an answer was hidden",
    ).rejects.toThrow("status code 0 is not supported");
  });

  it("still asks again after a Cloudflare 520, and hands over the good answer", async () => {
    const handler = await installedHandler();
    const answers = [answer(520), answer(200)];
    const route = heldRequest({ fetch: async () => answers.shift() });

    const done = handler(route);
    await vi.advanceTimersByTimeAsync(5_000);
    await done;

    expect(
      route.fetch.mock.calls.length,
      "a 520 from Cloudflare was not asked again",
    ).toBe(2);
    expect(
      route.fulfill.mock.calls.length,
      "the good answer after the retry was not handed to the page",
    ).toBe(1);
  });
});
