// utils/history.ts — the last four paths the shopper visited, kept in the
// `last_paths` cookie. PathTracker writes it in the browser; LogError reads it
// (on either side) to attach to an error report.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readServerCookies = vi.hoisted(() => vi.fn(async (_names: string[]): Promise<any[]> => [undefined]));
vi.mock("utils/cookies/server-cookie-fallback", () => ({ readServerCookies }));

import { readStoredLastPaths, storeLastPaths } from "utils/history";

const clearCookie = () => {
  document.cookie = "last_paths=; Path=/; Max-Age=0";
};

beforeEach(clearCookie);
afterEach(() => {
  vi.unstubAllGlobals();
  clearCookie();
  vi.resetModules();
});

describe("storeLastPaths and readStoredLastPaths (browser)", () => {
  it("keeps the last four distinct paths, most recent last", async () => {
    for (const p of ["/a", "/b", "/a", "/c", "/d", "/e"]) await storeLastPaths(p);
    expect(await readStoredLastPaths(), "the path history is wrong").toEqual(["/a", "/c", "/d", "/e"]);
  });

  it("does not repeat the same path twice in a row, and trims it", async () => {
    await storeLastPaths(" /x ");
    await storeLastPaths("/x");
    expect(await readStoredLastPaths(), "a repeated path was stored twice").toEqual(["/x"]);
  });

  it("ignores an empty or non-text path", async () => {
    await storeLastPaths("");
    await storeLastPaths("   ");
    await storeLastPaths(42 as any);
    expect(await readStoredLastPaths(), "an empty path was stored").toEqual([]);
  });

  it("reads a broken or non-list cookie as empty, and drops non-text entries", async () => {
    document.cookie = "other=1; Path=/";
    document.cookie = "last_paths=%7Bbroken; Path=/";
    expect(await readStoredLastPaths(), "a broken cookie was not read as empty").toEqual([]);
    document.cookie = `last_paths=${encodeURIComponent(JSON.stringify({ a: 1 }))}; Path=/`;
    expect(await readStoredLastPaths(), "a non-list cookie was not read as empty").toEqual([]);
    document.cookie = `last_paths=${encodeURIComponent(JSON.stringify(["/ok", 5]))}; Path=/`;
    expect(await readStoredLastPaths(), "a non-text entry was kept").toEqual(["/ok"]);
    document.cookie = "other=; Path=/; Max-Age=0";
  });
});

describe("readStoredLastPaths (server)", () => {
  it("reads the cookie through the server cookie reader", async () => {
    vi.stubGlobal("window", undefined);
    vi.resetModules();
    const fresh = await import("utils/history");
    readServerCookies.mockResolvedValueOnce([encodeURIComponent(JSON.stringify(["/s"]))]);
    expect(await fresh.readStoredLastPaths(), "the server did not read the cookie").toEqual(["/s"]);
    expect(readServerCookies, "the wrong cookie was asked for").toHaveBeenCalledWith(["last_paths"]);
  });

  it("writes and reads nothing without a document", async () => {
    vi.stubGlobal("document", undefined);
    vi.resetModules();
    const fresh = await import("utils/history");
    await fresh.storeLastPaths("/z");
    expect(await fresh.readStoredLastPaths(), "a path was read with no document").toEqual([]);
  });
});
