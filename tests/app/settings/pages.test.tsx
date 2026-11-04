// The settings route pages (server components) and the settings template.
// Each old page reads the locale, maybe the stored profile, and hands both to
// one settings component, stubbed here. The pages of the new profile screens
// (Stage 4) and the wallet (Stage 5) render nothing: they only send a guest to
// the login.
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { navigationSpies, setRoute } from "../../mocks/nextNavigation";

const spies = vi.hoisted(() => ({
  lang: { current: "sy-en" },
  profile: { current: null as any },
  props: {} as Record<string, any>,
  getOrderStatues: vi.fn(async (_a: unknown) => [{ id: 1 }]),
}));

vi.mock("next/root-params", () => ({ lang: async () => spies.lang.current }));
vi.mock("utils/cookies/server-cookie-manager", () => ({ getCookieServer: async () => spies.profile.current }));
vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
  GetImageUrl: (photo: string) => `https://img.test/${photo}`,
}));
vi.mock("utils/countryData", () => ({ getLocalizedCountryName: (c: string, l: string) => `${c}-name-${l}` }));
vi.mock("serverRequests/meta/buildAlternates", () => ({ buildAlternates: (lang: string, path: string) => `/${lang}${path}` }));
vi.mock("serverRequests/settings", () => ({ getOrderStatues: (a: unknown) => spies.getOrderStatues(a) }));
vi.mock("react-loading-skeleton", () => ({ default: () => null }));
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children, custom }: any) => (
    <div data-testid="presence" data-direction={custom}>
      {children}
    </div>
  ),
  motion: {
    div: ({ children, variants }: any) => {
      spies.props.variants = variants;
      return <div>{children}</div>;
    },
  },
}));

const stubbed = [
  "components/setting/BackBar",
  "components/setting/checklist/ChecklistView",
  "components/settings/PersonalInfoCountries",
  "components/settings/LanguageSetting",
  "components/setting/orders/OrdersView",
  "components/setting/orders/OrderDetailsWrapper",
  "components/global/Setting",
  "components/global/InitialNavigation",
];
for (const path of stubbed) {
  vi.doMock(path, () => ({
    default: (p: any) => {
      spies.props[path] = p;
      return null;
    },
  }));
}
vi.doMock("components/global/NextLink", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} data-pw={rest["data-pw"]}>
      {children}
    </a>
  ),
}));

const load = (path: string) => import(`app/(client)/[lang]/settings/${path}`);

beforeEach(() => {
  vi.clearAllMocks();
  spies.lang.current = "sy-en";
  spies.profile.current = null;
  for (const key of Object.keys(spies.props)) delete spies.props[key];
});
afterEach(() => vi.unstubAllGlobals());

describe("the settings home page", () => {
  it("builds translated metadata", async () => {
    spies.lang.current = "iq-ar";
    const { generateMetadata } = await load("page");

    const metadata = await generateMetadata();

    expect(metadata, "the settings metadata is not translated or has the wrong alternates").toEqual({
      title: "ar:Settings - TryDos",
      description: "ar:Manage your account settings and preferences.",
      alternates: "/iq-ar/settings",
    });
  });

});

// The paths of the new profile screens (S4-1, S4-3) and the wallet (Stage 5).
// The screen mount draws the screen; the page only checks the shopper (S4-4).
const SCREEN_PAGES = [
  ["page", "settings"],
  ["profile/page", "settings/profile"],
  ["profile/info/page", "settings/profile/info"],
  ["profile/size/page", "settings/profile/size"],
  ["profile/picture/page", "settings/profile/picture"],
  ["profile/address/page", "settings/profile/address"],
  ["profile/address/new/page", "settings/profile/address/new"],
  ["profile/client-info/page", "settings/profile/client-info"],
  ["client-id/page", "settings/client-id"],
  ["preferences/page", "settings/preferences"],
  ["wallet/page", "settings/wallet"],
] as const;

describe("the pages of the new screens", () => {
  it.each(SCREEN_PAGES)(
    "%s sends a guest to the login, with the way back",
    async (file, path) => {
      spies.lang.current = "iq-ar";
      spies.profile.current = { name: "guest", phone: "0" };
      const { default: Page } = await load(file);

      await expect(Page(), `${file} let a guest through`).rejects.toThrow();

      expect(
        navigationSpies.redirect,
        `${file} did not send the guest to the login with /iq-ar/${path} as the way back`,
      ).toHaveBeenCalledWith(
        `/iq-ar/login?next=${encodeURIComponent(`/iq-ar/${path}`)}`,
      );
    },
  );

  it.each(SCREEN_PAGES)(
    "%s sends a visitor with no profile cookie to the login",
    async (file) => {
      spies.profile.current = null;
      const { default: Page } = await load(file);

      await expect(Page(), `${file} let a visitor with no profile through`).rejects.toThrow();
      expect(navigationSpies.redirect, `${file} did not redirect`).toHaveBeenCalled();
    },
  );

  it.each(SCREEN_PAGES)(
    "%s renders nothing for a signed-in shopper, so the mount draws the screen",
    async (file) => {
      spies.profile.current = { name: "Sara", phone: "963900000000" };
      const { default: Page } = await load(file);

      expect(await Page(), `${file} rendered content of its own`).toBeNull();
      expect(navigationSpies.redirect, `${file} redirected a signed-in shopper`).not.toHaveBeenCalled();
    },
  );
});

describe("the other settings pages", () => {
  it.each([
    ["checklist/page", "components/setting/checklist/ChecklistView", { isRtl: false, language: "en", local: "sy-en" }],
    ["countries/page", "components/settings/PersonalInfoCountries", { isRtl: false, local: "sy-en" }],
    ["prefferences/page", "components/global/Setting", { lang: "sy-en" }],
  ])("%s hands the locale and profile to its component", async (path, component, expected) => {
    const { default: Page } = await load(path);

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(spies.props[component], `${path} did not hand the right values to its component`).toMatchObject(expected);
  });

  it.each([
    ["checklist/page", "components/setting/checklist/ChecklistView"],
    ["countries/page", "components/settings/PersonalInfoCountries"],
    ["prefferences/page", "components/setting/BackBar"],
  ])("%s faces right-to-left in Arabic", async (path, component) => {
    spies.lang.current = "iq-ar";
    spies.profile.current = { name: "Sara" };
    const { default: Page } = await load(path);

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(spies.props[component]?.isRtl, `${path} is not right-to-left in Arabic`).toBe(true);
  });

  it("the orders page loads the order statuses for the locale", async () => {
    spies.lang.current = "iq-ku";
    const { default: Orders } = await load("orders/page");

    render(await Orders());

    expect(spies.getOrderStatues, "the order statuses were not asked for the locale").toHaveBeenCalledWith({
      language: "ku",
      country: "iq",
    });
    expect(spies.props["components/setting/orders/OrdersView"], "the orders view did not get the statuses").toMatchObject({
      isRtl: true,
      order_group_statuses: [{ id: 1 }],
    });
  });

  it("the order details page hands the order, pack and chat ids on", async () => {
    const { default: Page } = await load("orders/[id]/page");

    render(await Page({ params: Promise.resolve({ id: "g1" }), searchParams: Promise.resolve({ order_id: "p1", chat_id: "c1" }) }));

    expect(spies.props["components/setting/orders/OrderDetailsWrapper"], "the order ids were not passed on").toMatchObject({
      order_group_id: "g1",
      order_id: "p1",
      order_chat_id: "c1",
      local: "sy-en",
    });
  });

  it("the languages page loads the language codes from the core backend", async () => {
    vi.stubEnv("BACKEND_URL", "https://core.invalid/api/v1");
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ data: [{ code: "en" }, { code: "ar" }] })));
    vi.stubGlobal("fetch", fetchSpy);
    const { default: Page } = await load("languages/page");

    render(await Page());

    expect((fetchSpy.mock.calls[0] as any)[0], "the languages were not asked from the core backend").toBe(
      "https://core.invalid/api/v1/languages",
    );
    expect(spies.props["components/settings/LanguageSetting"].languages, "the language codes were not passed on").toEqual([
      "en",
      "ar",
    ]);
    vi.unstubAllEnvs();
  });

  it("the languages page faces right-to-left in Arabic and copes with no language list", async () => {
    spies.lang.current = "iq-ar";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
    const { default: Page } = await load("languages/page");

    render(await Page());

    expect(spies.props["components/settings/LanguageSetting"], "an empty answer was not handled").toMatchObject({
      languages: undefined,
      isRtl: true,
    });
  });
});

describe("the settings template", () => {
  it("slides forward into a deeper page and back out of it", async () => {
    const { default: Template } = await load("template");
    setRoute({ pathname: "/sy-en/settings" });
    const { rerender } = render(<Template>page</Template>);
    expect(screen.getByTestId("presence").dataset.direction, "the first page did not slide forward").toBe("1");

    setRoute({ pathname: "/sy-en/settings/profile/info" });
    rerender(<Template>page</Template>);
    expect(screen.getByTestId("presence").dataset.direction, "a deeper page did not slide forward").toBe("1");

    setRoute({ pathname: "/sy-en/settings" });
    rerender(<Template>page</Template>);
    expect(screen.getByTestId("presence").dataset.direction, "going back up did not slide backward").toBe("-1");
  });

  it("enters from the side it moves toward and leaves by the other", async () => {
    const { default: Template } = await load("template");
    render(<Template>page</Template>);
    const { variants } = spies.props;

    expect(variants.enter(1), "a forward page does not enter from the right").toEqual({ x: "100%", opacity: 0 });
    expect(variants.enter(-1), "a backward page does not enter from the left").toEqual({ x: "-100%", opacity: 0 });
    expect(variants.exit(1).x, "a page left forward does not exit to the left").toBe("-100%");
    expect(variants.exit(-1).x, "a page left backward does not exit to the right").toBe("100%");
  });
});
