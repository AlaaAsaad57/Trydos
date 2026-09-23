// The locale root layout (server component) and the locale home page.
//
// The layout is not rendered: it returns the whole <html> document, full of
// client providers. The tests read the element tree it returns instead, which
// is what the framework renders.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { navigationSpies } from "../mocks/nextNavigation";

const spies = vi.hoisted(() => ({
  lang: { current: "sy-en" },
  GetHomeMetaData: vi.fn(),
  LogServerError: vi.fn(),
}));

vi.mock("next/root-params", () => ({ lang: async () => spies.lang.current }));
vi.mock("next/font/local", () => ({
  default: (opts: { variable: string }) => ({ variable: opts.variable, className: "font" }),
}));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => null }));
vi.mock("next/script", () => ({ default: () => null }));
vi.mock("serverRequests/meta/StructuredData/Organaization", () => ({ default: () => null }));
vi.mock("serverRequests/meta/StructuredData/Website", () => ({ default: () => null }));
vi.mock("serverRequests/meta/StructuredData/Constants", () => ({
  General_Site_Data: { url: "https://trydos.test", og: "/og.png" },
}));
vi.mock("serverRequests/meta/home", () => ({ GetHomeMetaData: (...a: unknown[]) => spies.GetHomeMetaData(...a) }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: (...a: unknown[]) => spies.LogServerError(...a) }));
vi.mock("utils/server", () => ({ translateFunction: (key: string, language: string) => `${language}:${key}` }));
for (const path of [
  "components/Home/RedeemedLuckScript",
  "components/Cart/CartProvider",
  "components/Cart/RdbPaymentLockedSheet",
  "components/Home/Init",
  "components/Home/AuthNavContainer",
  "components/Home/AuthNavSkeleton",
  "components/Home/NavbarClient",
  "components/global/NavigationLoaderSafetyNet",
  "components/PathTracker",
  "components/ModalRoute/ModalSlot",
  "components/global/NavigationLoaderGate",
  "components/global/DeferredLayoutClients",
  "components/Home/CategoryHomeView",
]) {
  vi.doMock(path, () => ({ default: () => null }));
}
vi.mock("components/ModalRoute/OverlayVisibility", () => ({
  OverlayVisibilityProvider: () => null,
  MainContent: () => null,
}));

const loadLayout = () => import("app/(client)/[lang]/layout");
const loadHome = () => import("app/(client)/[lang]/page");

/** Find the first element in a tree that matches. */
const find = (node: any, match: (n: any) => boolean): any => {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = find(child, match);
      if (hit) return hit;
    }
    return undefined;
  }
  if (match(node)) return node;
  return find(node.props?.children, match);
};

// The first import of the layout pulls a large module graph; under a busy
// parallel run it can take longer than one test is allowed, so it is warmed here.
beforeAll(async () => {
  await loadLayout();
  await loadHome();
}, 60_000);

beforeEach(() => {
  vi.clearAllMocks();
  spies.lang.current = "sy-en";
  spies.GetHomeMetaData.mockResolvedValue({ title: "Home" });
});

describe("the locale root layout", () => {
  it("builds one static locale and the site metadata", async () => {
    const layout = await loadLayout();

    expect(layout.generateStaticParams(), "the build does not prerender exactly sy-en").toEqual([{ lang: "sy-en" }]);
    expect(String(layout.metadata.metadataBase), "the metadata base is not the site address").toBe("https://trydos.test/");
    expect(layout.viewport.userScalable, "the page can be zoomed").toBe(false);
  });

  it("answers not-found for a locale segment the app does not serve", async () => {
    spies.lang.current = "zz-qq";
    const { default: RootLayout } = await loadLayout();

    await expect(RootLayout({ children: null, modal: null }), "an unknown locale rendered").rejects.toThrow();
    expect(navigationSpies.notFound, "an unknown locale did not answer not-found").toHaveBeenCalled();
  });

  it("renders the document in the locale language with the five font faces", async () => {
    const { default: RootLayout } = await loadLayout();

    const tree: any = await RootLayout({ children: "page", modal: "modal" });

    expect(tree.type, "the layout does not render an html element").toBe("html");
    expect(tree.props.lang, "the document language is not the sy-en language tag").toBe("en-SY");
    for (const face of ["--Quicksand-Regular", "--Quicksand-Light", "--Quicksand-Medium", "--Quicksand-Bold", "--Quicksand-SemiBold"]) {
      expect(tree.props.className, `the ${face} font face is missing`).toContain(face);
    }
    const body = find(tree, (n) => n.type === "body");
    expect(body.props.className, "an English page is marked right-to-left").not.toContain("text-rtl");
    expect(
      find(tree, (n) => n.props?.id === "image-fallback"),
      "the image fallback script is not in the body",
    ).toBeDefined();
  });

  it.each(["sy-ar", "iq-ku"])("marks the body right-to-left for %s", async (lang) => {
    spies.lang.current = lang;
    const { default: RootLayout } = await loadLayout();

    const tree: any = await RootLayout({ children: null, modal: null });

    expect(find(tree, (n) => n.type === "body").props.className, `${lang} is not marked right-to-left`).toContain(
      "text-rtl",
    );
  });
});

describe("the locale home page", () => {
  it("returns the home metadata", async () => {
    const { generateMetadata } = await loadHome();

    expect(await generateMetadata(), "the home metadata was not returned").toEqual({ title: "Home" });
    expect(spies.GetHomeMetaData, "the home metadata was asked for a category").toHaveBeenCalledWith({
      local: "sy-en",
      category: null,
    });
  });

  it("falls back to translated default metadata and reports when the build fails", async () => {
    spies.lang.current = "iq-ar";
    spies.GetHomeMetaData.mockRejectedValue(new Error("meta down"));
    const { generateMetadata } = await loadHome();

    const metadata: any = await generateMetadata();

    expect(spies.LogServerError, "the failed home metadata was not reported").toHaveBeenCalled();
    expect(metadata.title, "the fallback title is not translated").toBe("ar:TryDos - Premium Shopping Experience");
    expect(metadata.openGraph.url, "the fallback address is not the locale home").toBe("https://trydos.test/iq-ar");
    expect(metadata.twitter.images, "the fallback share image is wrong").toEqual(["https://trydos.test/og.png"]);
  });

  it("renders the home view with no category", async () => {
    const { default: HomePage } = await loadHome();

    const tree: any = await HomePage();

    expect(tree.props.slug, "the home view was given a category").toBeNull();
  });
});
