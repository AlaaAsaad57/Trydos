// store/index.ts — the one combined store. These are the few members defined
// in the file itself rather than in a slice.
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "store";

afterEach(() => {
  vi.unstubAllEnvs();
  delete (navigator as any).mediaDevices;
});

describe("store members defined in store/index.ts", () => {
  it("setDashboardShopInfo keeps the settled shop info", () => {
    const info = {
      sellerId: "s1",
      currency: { code: "SYP", name: "Syrian pound" },
      newProductsApproval: true,
      available: true,
      permitted: true,
    };
    useAppStore.getState().setDashboardShopInfo(info);
    expect(useAppStore.getState().dashboardShopInfo, "the shop info was not kept").toEqual(info);
  });

  it("checkCameraPermissions records a grant", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn(async () => ({})) },
      configurable: true,
    });
    await useAppStore.getState().checkCameraPermissions();
    expect(useAppStore.getState().cameraPermissions, "the camera grant was not recorded").toBe("granted");
  });

  it("checkCameraPermissions records a refusal and throws", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn(async () => Promise.reject(new Error("denied"))) },
      configurable: true,
    });
    await expect(useAppStore.getState().checkCameraPermissions(), "a refused camera did not throw").rejects.toThrow();
    expect(useAppStore.getState().cameraPermissions, "the camera refusal was not recorded").toBe("revoked");
  });

  it("builds the store with devtools in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const fresh = await import("store");
    expect(typeof fresh.useAppStore.getState().setDashboardShopInfo, "the development store did not build").toBe(
      "function",
    );
  });
});
