// utils/mapsConfig.ts — the Google Maps key comes from the env setting, with a
// fixed fallback so a map never breaks silently when the setting is missing.
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

  it("falls back to the built-in key when the setting is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    vi.resetModules();
    const { GOOGLE_MAPS_API_KEY } = await import("utils/mapsConfig");
    expect(GOOGLE_MAPS_API_KEY.startsWith("AIza"), "no fallback key was used").toBe(true);
  });
});
