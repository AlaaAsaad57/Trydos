// utils/posthog.ts — the lazy PostHog wrapper. It starts only in production,
// only once, and never lets an analytics failure reach the app.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", async () => (await import("../mocks/posthog")).makePosthogMock());

async function load(env = "production") {
  vi.stubEnv("NODE_ENV", env);
  vi.resetModules();
  const wrapper = await import("utils/posthog");
  const client = ((await import("posthog-js")) as any).default;
  Object.values(client).forEach((fn: any) => fn.mockReset?.());
  return { ...wrapper, client };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("posthogInit", () => {
  it("starts PostHog once in production, through our own ingest path", async () => {
    const { posthogInit, client } = await load();
    await posthogInit("key-1");
    await posthogInit("key-1");
    expect(client.init.mock.calls.map((c: any[]) => [c[0], c[1].api_host]), "PostHog was not started exactly once").toEqual([
      ["key-1", "/ingest"],
    ]);
  });

  it("does nothing outside production, or without a key", async () => {
    const dev = await load("development");
    await dev.posthogInit("key-1");
    expect(dev.client.init, "PostHog started outside production").not.toHaveBeenCalled();
    const prod = await load();
    await prod.posthogInit(undefined);
    expect(prod.client.init, "PostHog started without a key").not.toHaveBeenCalled();
  });

  it("swallows a failing init", async () => {
    const { posthogInit, client } = await load();
    client.init.mockImplementation(() => {
      throw new Error("sdk broke");
    });
    await expect(posthogInit("key-1"), "an init failure escaped").resolves.toBeUndefined();
  });
});

describe("the event helpers", () => {
  it("do nothing before init", async () => {
    const { posthogCapture, posthogIdentify, posthogReset, posthogCaptureException, client } = await load();
    await posthogCapture("e");
    await posthogIdentify(1, {});
    await posthogReset();
    await posthogCaptureException(new Error("x"));
    expect(
      [client.capture, client.identify, client.reset, client.captureException].some((f: any) => f.mock.calls.length),
      "an event went out before init",
    ).toBe(false);
  });

  it("pass events, identity, errors and resets on after init", async () => {
    const m = await load();
    await m.posthogInit("key-1");
    const err = new Error("x");
    await m.posthogCapture("click", { a: 1 });
    await m.posthogIdentify(7, { name: "A" });
    await m.posthogCaptureException(err, { p: 1 });
    await m.posthogReset();
    expect(m.client.capture, "the event was not sent").toHaveBeenCalledWith("click", { a: 1 });
    expect(m.client.identify, "the user id was not sent as text").toHaveBeenCalledWith("7", { name: "A" });
    expect(m.client.captureException, "the error was not sent whole").toHaveBeenCalledWith(err, { p: 1 });
    expect(m.client.reset, "the identity was not reset").toHaveBeenCalled();
  });

  it("swallow a failure inside the SDK", async () => {
    const m = await load();
    await m.posthogInit("key-1");
    for (const name of ["capture", "identify", "captureException", "reset"]) {
      m.client[name].mockImplementation(() => {
        throw new Error("sdk broke");
      });
    }
    await expect(
      Promise.all([m.posthogCapture("e"), m.posthogIdentify(1, {}), m.posthogCaptureException("x"), m.posthogReset()]),
      "an SDK failure escaped",
    ).resolves.toBeDefined();
  });
});
