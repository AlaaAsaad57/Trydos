// @vitest-environment node
//
// The renewal gate, and a renewal that a page load cut off.
//
// CI run 36620489226 failed CMT-07 with "the page was still renewing its
// credential (/api/auth/refresh) 20 s later", while no renewal was running:
// the server made no call at all in those 20 s. A reload at the end of CMT-06
// had cut the renewal off, and Playwright reports such a call as neither
// finished nor failed (measured 2026-09-29), so the gate kept waiting for it.
//
// The gate only listens to events, so a context and a page made by hand drive
// it here the same way Playwright does.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { waitForRenewalSettled, watchRenewals } from "../e2e/harness/renewalGate";

type Listener = (arg: unknown) => void;

const emitter = () => {
  const listeners = new Map<string, Listener[]>();
  return {
    on: (event: string, listener: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    },
    emit: (event: string, arg?: unknown) => {
      for (const listener of listeners.get(event) ?? []) listener(arg);
    },
  };
};

/** A context with one page, wired to the gate. */
const setUp = () => {
  const context = emitter();
  const page = { ...emitter(), context: () => context };
  const mainFrame = { page: () => page, parentFrame: () => null };

  const request = (path: string, navigation = false) => ({
    url: () => `http://127.0.0.1:3100${path}`,
    isNavigationRequest: () => navigation,
    frame: () => mainFrame,
  });

  watchRenewals(context as never);
  context.emit("page", page);

  /** A new document: its navigation request, then its load events. */
  const loadNewDocument = () => {
    context.emit("request", request("/sy-en/product", true));
    page.emit("domcontentloaded");
    page.emit("load");
  };

  return { context, page, request, loadNewDocument };
};

/** Run the gate to its end and say how it ended. */
const gateOutcome = async (page: unknown): Promise<string> => {
  const outcome = waitForRenewalSettled(page as never).then(
    () => "returned",
    (error: Error) => `threw: ${error.message}`,
  );
  await vi.advanceTimersByTimeAsync(25_000);
  return outcome;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("a renewal that a page load cut off", () => {
  it("is not waited for once the new document has loaded", async () => {
    const { context, page, request, loadNewDocument } = setUp();
    loadNewDocument();
    await vi.advanceTimersByTimeAsync(2_000);

    // The renewal starts, and a reload cuts it off: Playwright sends no
    // `requestfinished` and no `requestfailed` for it.
    context.emit("request", request("/api/auth/refresh"));
    await vi.advanceTimersByTimeAsync(200);
    loadNewDocument();

    expect(
      await gateOutcome(page),
      "the gate kept waiting for a renewal the reload had already ended, and blamed it after 20 s",
    ).toBe("returned");
  });

  it("is written down, so the guest that follows has a named cause", async () => {
    const { context, page, request, loadNewDocument } = setUp();
    loadNewDocument();
    await vi.advanceTimersByTimeAsync(2_000);

    context.emit("request", request("/api/auth/refresh"));
    await vi.advanceTimersByTimeAsync(200);
    loadNewDocument();
    await gateOutcome(page);

    const logged = vi.mocked(console.log).mock.calls.map((call) => String(call[0]));
    expect(
      logged.some((line) => line.includes("cut off /api/auth/refresh")),
      "the gate dropped a cut-off renewal without saying so in the log",
    ).toBe(true);
  });
});

describe("a renewal that is still running", () => {
  it("is still waited for, and named, when it started after the page loaded", async () => {
    const { context, page, request, loadNewDocument } = setUp();
    loadNewDocument();
    await vi.advanceTimersByTimeAsync(2_000);

    // Started by the new document and never answered: a real hang.
    context.emit("request", request("/api/auth/refresh"));

    expect(
      await gateOutcome(page),
      "the gate let the page leave while its own renewal was still in flight",
    ).toContain("threw: the page was still renewing its credential (/api/auth/refresh)");
  });

  it("is still waited for after a client-side navigation, which ends no call", async () => {
    const { context, page, request, loadNewDocument } = setUp();
    loadNewDocument();
    await vi.advanceTimersByTimeAsync(2_000);

    context.emit("request", request("/api/auth/refresh"));
    // `pushState`: the address changes, but no document loads.
    page.emit("framenavigated");

    expect(
      await gateOutcome(page),
      "a client-side navigation made the gate forget a renewal that was still running",
    ).toContain("threw: the page was still renewing its credential (/api/auth/refresh)");
  });

  it("is let go once it finishes", async () => {
    const { context, page, request, loadNewDocument } = setUp();
    loadNewDocument();
    await vi.advanceTimersByTimeAsync(2_000);

    const renewal = request("/api/auth/refresh");
    context.emit("request", renewal);
    await vi.advanceTimersByTimeAsync(500);
    context.emit("requestfinished", renewal);

    expect(
      await gateOutcome(page),
      "the gate kept waiting after the renewal had answered",
    ).toBe("returned");
  });
});
