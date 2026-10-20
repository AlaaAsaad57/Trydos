// utils/mapsConfig.ts — the Google Maps key comes from the env setting only.
// There is no built-in key: a key in the code cannot be rotated, and it stays
// in git history for ever.
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("GOOGLE_MAPS_API_KEY", () => {
  it("uses the env setting when it is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "env-key");
    vi.resetModules();
    const { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LOADER_ID } = await import("utils/mapsConfig");
    expect([GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LOADER_ID], "the key or loader id is wrong").toEqual([
      "env-key",
      "google-map-script",
    ]);
  });

  it("is empty when the setting is empty — no key is written in the code", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    vi.resetModules();
    const { GOOGLE_MAPS_API_KEY } = await import("utils/mapsConfig");
    expect(GOOGLE_MAPS_API_KEY, "a key is still written in the code").toBe("");
  });
});
