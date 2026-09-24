// utils/errorReported.tsx — ReportError, the one way into Sentry. It turns any
// payload into a real Error named after its scenario, sets the user, and puts
// the context on the scope as tags, extras and a breadcrumb.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", async () => (await import("../mocks/sentry")).makeSentryMock());

import * as Sentry from "@sentry/nextjs";

import { ReportError } from "utils/errorReported";

const sentry = Sentry as any;
const scope = sentry.__scope;
scope.addBreadcrumb = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReportError", () => {
  it("sends an Error named after the scenario, with the user, tags, extras and a breadcrumb", async () => {
    await ReportError({
      scenario: "checkout",
      message: "payment failed",
      stack: "Error: payment failed\n at x",
      userData: { id: 7, name: "Ada" },
      userIP: "1.2.3.4",
      country: "sy",
      language: "ar",
      request_server: "market",
      current_url: "/sy-ar/cart",
      last_paths: ["/a"],
    });
    const sent = sentry.captureException.mock.calls[0]?.[0];
    expect(sent?.message, "the Sentry error is not named after the scenario").toBe("[checkout] payment failed");
    expect(sent?.stack, "the payload stack was not kept").toBe("Error: payment failed\n at x");
    expect(sentry.setUser, "the user was not set").toHaveBeenCalledWith({ id: "7", username: "Ada", ip_address: "1.2.3.4" });
    expect(scope.setTag.mock.calls, "the tags are wrong").toEqual([
      ["scenario", "checkout"],
      ["country", "sy"],
      ["language", "ar"],
      ["server", "market"],
      ["page_url", "/sy-ar/cart"],
    ]);
    expect(scope.setFingerprint, "the grouping is wrong").toHaveBeenCalledWith(["checkout", "payment failed"]);
    expect(scope.setExtras.mock.calls[0]?.[0], "the extras are missing").toMatchObject({ last_paths: ["/a"], country: "sy" });
    expect(scope.addBreadcrumb.mock.calls[0]?.[0]?.message, "the breadcrumb is wrong").toBe("checkout: payment failed");
  });

  it("falls back through source, type and unknown, and takes the stack of a nested error", async () => {
    await ReportError({ source: "login", user_id: 3, error: { stack: "nested stack", message: "x" } });
    await ReportError({ type: "front-end-exception", userId: 4 });
    await ReportError("plain text");
    const messages = sentry.captureException.mock.calls.map((c: any[]) => c[0].message);
    expect(messages, "the scenario fallbacks are wrong").toEqual([
      "[login] x",
      "[front-end-exception] Unknown error",
      "[unknown] plain text",
    ]);
    expect(sentry.captureException.mock.calls[0][0].stack, "the nested stack was not used").toBe("nested stack");
    expect(sentry.setUser.mock.calls.map((c: any[]) => c[0].id), "the user ids are wrong").toEqual(["3", "4"]);
  });

  it("sets no extras when the payload has none, and never throws when Sentry fails", async () => {
    await ReportError({ scenario: "bare" });
    expect(scope.setExtras, "empty extras were set").not.toHaveBeenCalled();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    sentry.withScope.mockImplementationOnce(() => {
      throw new Error("sentry down");
    });
    await expect(ReportError({ scenario: "x" }), "a Sentry failure escaped").resolves.toBeUndefined();
    expect(consoleError.mock.calls[0]?.[0], "the Sentry failure was not written to the console").toBe("Error in ReportError:");
    consoleError.mockRestore();
  });
});
