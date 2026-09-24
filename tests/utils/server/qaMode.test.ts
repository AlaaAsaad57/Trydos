// @vitest-environment node
//
// utils/server/qaMode.ts — the one switch that lets a request see QA data. It
// is on only when QA_VIEW_SECRET is set, at least 32 characters, and the
// `x-qa-view` header carries the same value.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers }));

const SECRET = "s".repeat(40);

async function load() {
  vi.resetModules();
  return (await import("utils/server/qaMode")).qaMode;
}

const sending = (value: string | null) =>
  headers.mockResolvedValue({ get: (name: string) => (name === "x-qa-view" ? value : null) });

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  headers.mockReset();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  warn.mockRestore();
});

describe("qaMode", () => {
  it("is off, with one warning, when the secret is not set", async () => {
    vi.stubEnv("QA_VIEW_SECRET", "");
    const qaMode = await load();
    sending(SECRET);
    expect(await qaMode(), "QA mode opened with no secret").toBe(false);
    expect(await qaMode(), "QA mode opened with no secret").toBe(false);
    expect(warn.mock.calls.map((c) => c[0]), "the warning was not given exactly once").toEqual([
      "[qa-mode] QA mode is OFF: QA_VIEW_SECRET is not set. Every request will see the shopper-facing catalogue.",
    ]);
  });

  it("is off when the secret is too short", async () => {
    vi.stubEnv("QA_VIEW_SECRET", "short");
    const qaMode = await load();
    sending("short");
    expect(await qaMode(), "a placeholder secret opened QA mode").toBe(false);
    expect(String(warn.mock.calls[0]?.[0]), "the short-secret warning is missing").toContain("shorter than 32");
  });

  it("is on only when the header matches the secret", async () => {
    vi.stubEnv("QA_VIEW_SECRET", SECRET);
    const qaMode = await load();
    sending(` ${SECRET} `);
    expect(await qaMode(), "the right header did not open QA mode").toBe(true);
    sending("wrong");
    expect(await qaMode(), "a wrong header opened QA mode").toBe(false);
    sending(null);
    expect(await qaMode(), "no header opened QA mode").toBe(false);
  });

  it("is off when there are no request headers", async () => {
    vi.stubEnv("QA_VIEW_SECRET", SECRET);
    const qaMode = await load();
    headers.mockRejectedValue(new Error("no request scope"));
    expect(await qaMode(), "a render with no request opened QA mode").toBe(false);
  });
});
