// @vitest-environment node
//
// utils/serverErrorReporter.ts — LogServerError. It reads the shopper's cookies
// on the server, builds one error record, hands it to Sentry (ReportError) and
// posts it to the backend error log.
import { beforeEach, describe, expect, it, vi } from "vitest";

const readServerCookies = vi.hoisted(() => vi.fn());
vi.mock("utils/cookies/server-cookie-fallback", () => ({ readServerCookies }));
const ReportError = vi.hoisted(() => vi.fn());
vi.mock("utils/errorReported", () => ({ ReportError }));
const readStoredLastPaths = vi.hoisted(() => vi.fn(async () => ["/a", "/b"]));
vi.mock("utils/history", () => ({ readStoredLastPaths }));
const postServerErrorLog = vi.hoisted(() => vi.fn(async (_e: any) => {}));
vi.mock("utils/server/mobileErrorLog", () => ({ postServerErrorLog }));

import { LogServerError } from "utils/serverErrorReporter";

/** The eleven cookie values, in the order the reporter asks for them. */
const cookies = (overrides: Record<number, any> = {}) => {
  const base: any[] = [
    encodeURIComponent(JSON.stringify({ id: 7 })),
    null,
    null,
    "ar",
    "sy",
    "1.2.3.4",
    null,
    null,
    null,
    null,
    null,
  ];
  for (const [i, v] of Object.entries(overrides)) base[Number(i)] = v;
  return base;
};

beforeEach(() => {
  vi.clearAllMocks();
  readServerCookies.mockResolvedValue(cookies());
});

describe("LogServerError", () => {
  it("reports an Error with the shopper's cookies, the page and the last paths, to Sentry and the backend", async () => {
    const err = new Error("boom");
    await LogServerError(err, "/sy-ar/cart");
    const record = ReportError.mock.calls[0]?.[0];
    expect(record, "the error record is wrong").toMatchObject({
      message: "boom",
      name: "Error",
      userData: { id: 7 },
      language: "ar",
      country: "sy",
      userIP: "1.2.3.4",
      last_request: "server_error",
      current_url: "/sy-ar/cart",
      last_paths: ["/a", "/b"],
    });
    expect(postServerErrorLog, "the backend error log did not get the same record").toHaveBeenCalledWith(record);
  });

  it("keeps an object as it is, turns a plain value into a message, and handles nothing at all", async () => {
    await LogServerError({ scenario: "x", code: 1 });
    await LogServerError("text failure");
    await LogServerError();
    const records = ReportError.mock.calls.map((c) => c[0]);
    expect(records[0], "an object error lost its fields").toMatchObject({ scenario: "x", code: 1 });
    expect(records[1].message, "a text error has no message").toBe("text failure");
    expect(records[2].message, "no error still got a message").toBeUndefined();
  });

  it("reads a cookie it cannot decode as empty, without losing the others", async () => {
    readServerCookies.mockResolvedValue(cookies({ 1: "%E0%A4%A" }));
    await LogServerError(new Error("x"));
    const record = ReportError.mock.calls[0]?.[0];
    expect(record.userChat, "an unreadable cookie was not read as empty").toBeNull();
    expect(record.userData, "a good cookie was lost").toEqual({ id: 7 });
  });

  it("does not throw when reading the cookies fails, or when the backend post fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    readServerCookies.mockRejectedValueOnce(new Error("no request scope"));
    await expect(LogServerError(new Error("x")), "a cookie failure escaped").resolves.toBeUndefined();
    expect(consoleError.mock.calls[0]?.[0], "the reporter failure was not written to the console").toBe(
      "Failed to log server error:",
    );
    postServerErrorLog.mockRejectedValueOnce(new Error("backend down"));
    await expect(LogServerError(new Error("y")), "a backend failure escaped").resolves.toBeUndefined();
    consoleError.mockRestore();
  });

  it("does not post to the backend from the browser", async () => {
    vi.stubGlobal("window", {});
    await LogServerError(new Error("x"));
    vi.unstubAllGlobals();
    expect(ReportError, "the browser did not report to Sentry").toHaveBeenCalled();
    expect(postServerErrorLog, "the browser posted to the backend error log").not.toHaveBeenCalled();
  });
});
