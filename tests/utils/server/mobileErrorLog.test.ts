// @vitest-environment node
//
// utils/server/mobileErrorLog.ts — posts one error record to the backend error
// log. It must never throw.
import { afterEach, describe, expect, it, vi } from "vitest";

import { postServerErrorLog } from "utils/server/mobileErrorLog";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const sentDescription = (spy: { mock: { calls: any[][] } }) =>
  JSON.parse(JSON.parse(spy.mock.calls[0][1].body).error_description);

describe("postServerErrorLog", () => {
  it("posts an object record marked as coming from the web", async () => {
    vi.stubEnv("GO_BACKEND_URL", "https://api.example.com");
    const fetchSpy = vi.fn(async (_url: string, _init: any) => ({}));
    vi.stubGlobal("fetch", fetchSpy);
    await postServerErrorLog({ scenario: "x" });
    expect(fetchSpy.mock.calls[0][0], "the error log address is wrong").toBe("https://api.example.com/mobile_error_log/store");
    expect(sentDescription(fetchSpy), "the record is wrong").toMatchObject({ platform: "🛑WEB🛑", scenario: "x" });
  });

  it("wraps a list or a plain value in a payload field", async () => {
    const fetchSpy = vi.fn(async (_url: string, _init: any) => ({}));
    vi.stubGlobal("fetch", fetchSpy);
    await postServerErrorLog([1, 2]);
    expect(sentDescription(fetchSpy).payload, "a list was not wrapped").toEqual([1, 2]);
  });

  it("never throws when the post fails or the fetch itself throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("down"))));
    await expect(postServerErrorLog(undefined), "a failed post escaped").resolves.toBeUndefined();
    vi.stubGlobal("fetch", () => {
      throw new Error("sync");
    });
    await expect(postServerErrorLog("x"), "a throwing fetch escaped").resolves.toBeUndefined();
  });
});
