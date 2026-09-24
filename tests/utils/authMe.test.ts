// utils/authMe.ts — one shared POST /api/auth/me for callers that ask at the
// same moment; a later caller asks again.
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchAuthMe } from "utils/authMe";

afterEach(() => vi.unstubAllGlobals());

describe("fetchAuthMe", () => {
  it("shares one request between callers that ask at the same time", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ user: { id: 1 } }) }));
    vi.stubGlobal("fetch", fetchSpy);
    const [a, b] = await Promise.all([fetchAuthMe(), fetchAuthMe()]);
    expect(a, "the answer is wrong").toEqual({ user: { id: 1 } });
    expect(b, "the second caller did not share the answer").toBe(a);
    expect(fetchSpy.mock.calls, "the request was not sent once, as a POST with cookies").toEqual([
      ["/api/auth/me", { credentials: "include", method: "POST" }],
    ]);
    await fetchAuthMe();
    expect(fetchSpy.mock.calls.length, "a later caller did not ask again").toBe(2);
  });

  it("answers null for a refused or failed request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    expect(await fetchAuthMe(), "a refused request gave data").toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    expect(await fetchAuthMe(), "a failed request gave data").toBeNull();
  });
});
