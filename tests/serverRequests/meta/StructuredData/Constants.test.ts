// @vitest-environment node
//
// The site origin behind every canonical, hreflang, sitemap, robots and JSON-LD
// URL. It must come from the environment: the production setting first, then
// the production domain Vercel gives every deployment, and never a hardcoded
// staging domain.
import { afterEach, describe, expect, it, vi } from "vitest";

const STAGING = "https://trydos.ramaaz.dev";

const load = async (env: { site?: string; vercel?: string }) => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", env.site ?? "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", env.vercel ?? "");
  vi.resetModules();
  const mod = await import("serverRequests/meta/StructuredData/Constants");
  return mod.General_Site_Data.url;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the site origin", () => {
  it("is the production setting when it is set, without a trailing slash", async () => {
    const url = await load({ site: "https://shop.example/", vercel: "preview.example" });

    expect(url, "the site setting was not used as the origin").toBe("https://shop.example");
  });

  it("is the production domain Vercel gives the deployment when the setting is empty", async () => {
    const url = await load({ vercel: "shop.example" });

    expect(url, "the Vercel production domain was not used as the origin").toBe("https://shop.example");
  });

  it("is never the staging domain when nothing is set", async () => {
    const url = await load({});

    expect(url, "the origin fell back to the staging domain").not.toBe(STAGING);
    expect(() => new URL(url), `the fallback origin is not a valid URL (${url})`).not.toThrow();
  });
});
