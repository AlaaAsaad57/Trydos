// The settings route pages (server components) and the settings template.
// Each page reads the locale, maybe the stored profile, and hands both to one
// settings component, stubbed here.
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setRoute } from "../../mocks/nextNavigation";

const spies = vi.hoisted(() => ({
  lang: { current: "sy-en" },
  profile: { current: null as any },
  props: {} as Record<string, any>,
  getOrderStatues: vi.fn(async (_a: unknown) => [{ id: 1 }]),
  GetCountries: vi.fn(async (_a: unknown) => [{ iso: "sy" }]),
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
vi.mock("serverRequests/product", () => ({ GetCountries: (a: unknown) => spies.GetCountries(a) }));
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
  "components/setting/orders",
  "components/setting/profile",
  "components/setting/WalletLinkCard",
  "components/settings/GoToSellerDashBoard",
  "components/global/RouterRefresh",
  "components/setting/checklist/ChecklistView",
  "components/settings/PersonalInfoCountries",
  "components/settings/LanguageSetting",
  "components/setting/orders/OrdersView",
  "components/setting/orders/OrderDetailsWrapper",
  "components/global/Setting",
  "components/settings/WalletTransactions",
  "components/settings/PersonalInfoAddress",
  "components/setting/profile/PersonalInfoForm",
  "components/settings/UploadProfilePhoto",
  "components/settings/ProfileSizeInfo",
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

  it("renders the menu, country and language links for a guest", async () => {
    const { default: Page } = await load("page");

    render(await Page());

    expect(spies.props["components/setting/orders"].user, "a guest did not get an empty profile").toEqual({
      name: "",
      phone: "",
      is_phone_verified: 0,
    });
    expect(spies.props["components/settings/GoToSellerDashBoard"].isAuthed, "a guest was treated as signed in").toBe(false);
    expect(screen.getByText("en:My Checklist").closest("a")?.getAttribute("href"), "the checklist link is wrong").toBe(
      "/sy-en/settings/checklist",
    );
    expect(screen.getByText("sy-name-en"), "the country name is missing").toBeInTheDocument();
    expect(screen.getByText("English"), "the language name is missing").toBeInTheDocument();
  });

  it.each([
    ["iq-ar", "العربية", true],
    ["tr-tr", "Turkish", false],
    ["iq-ku", "کوردی", true],
  ])("names the language for %s and sets the reading direction", async (lang, name, rtl) => {
    spies.lang.current = lang;
    spies.profile.current = { name: "Sara", phone: "963900000000", is_phone_verified: 1 };
    const { default: Page } = await load("page");

    render(await Page());

    expect(screen.getByText(name), `the ${lang} language name is wrong`).toBeInTheDocument();
    expect(spies.props["components/setting/BackBar"].isRtl, `the ${lang} direction is wrong`).toBe(rtl);
    expect(spies.props["components/settings/GoToSellerDashBoard"].isAuthed, "a signed-in shopper was treated as a guest").toBe(true);
  });

  it("shows no language name for a language it does not know", async () => {
    spies.lang.current = "sy-fr";
    spies.profile.current = { name: "Sara" };
    const { default: Page } = await load("page");

    const { container } = render(await Page());

    expect(
      container.querySelector('[data-pw="language-button"]')?.textContent,
      "an unknown language got a name",
    ).toBe("");
    expect(spies.props["components/settings/GoToSellerDashBoard"].isAuthed, "a profile with no phone was treated as signed in").toBe(false);
  });
});

describe("the settings profile page", () => {
  it("shows the stored photo with a change link", async () => {
    spies.profile.current = { name: "Sara", image: "me.png" };
    const { default: Profile } = await load("profile/page");

    render(await Profile());

    expect(screen.getByText("en:Change Photo"), "the change-photo label is missing").toBeInTheDocument();
    expect(document.querySelector('img[src="https://img.test/me.png"]'), "the stored photo is not shown").not.toBeNull();
    expect(screen.getByText("en:Bank Cards").closest("a")?.getAttribute("href"), "the bank cards link is wrong").toBe(
      "/sy-en/settings/profile/Bank-Cards",
    );
  });

  it("offers to add a photo when there is none, right-to-left in Arabic", async () => {
    spies.lang.current = "iq-ar";
    const { default: Profile } = await load("profile/page");

    render(await Profile());

    expect(screen.getByText("ar:Add Photo"), "the add-photo label is missing").toBeInTheDocument();
    expect(spies.props["components/setting/BackBar"].isRtl, "the Arabic page is not right-to-left").toBe(true);
  });
});

describe("the other settings pages", () => {
  it.each([
    ["checklist/page", "components/setting/checklist/ChecklistView", { isRtl: false, language: "en", local: "sy-en" }],
    ["countries/page", "components/settings/PersonalInfoCountries", { isRtl: false, local: "sy-en" }],
    ["prefferences/page", "components/global/Setting", { lang: "sy-en" }],
    ["wallet/page", "components/settings/WalletTransactions", { isRtl: false, local: "sy-en" }],
    ["profile/info/page", "components/setting/profile/PersonalInfoForm", { initialData: { name: "", phone: "", is_phone_verified: 0 } }],
    ["profile/picture/page", "components/settings/UploadProfilePhoto", { userProfile: { name: "", phone: "", is_phone_verified: 0 } }],
    ["profile/size/page", "components/settings/ProfileSizeInfo", { initialData: { name: "", phone: "", is_phone_verified: 0 } }],
  ])("%s hands the locale and profile to its component", async (path, component, expected) => {
    const { default: Page } = await load(path);

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(spies.props[component], `${path} did not hand the right values to its component`).toMatchObject(expected);
  });

  it.each([
    ["profile/info/page", "components/setting/profile/PersonalInfoForm"],
    ["profile/picture/page", "components/settings/UploadProfilePhoto"],
    ["profile/size/page", "components/settings/ProfileSizeInfo"],
    ["profile/Bank-Cards/page", "components/setting/BackBar"],
    ["checklist/page", "components/setting/checklist/ChecklistView"],
    ["countries/page", "components/settings/PersonalInfoCountries"],
    ["prefferences/page", "components/setting/BackBar"],
    ["wallet/page", "components/settings/WalletTransactions"],
  ])("%s faces right-to-left in Arabic", async (path, component) => {
    spies.lang.current = "iq-ar";
    spies.profile.current = { name: "Sara" };
    const { default: Page } = await load(path);

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(spies.props[component]?.isRtl, `${path} is not right-to-left in Arabic`).toBe(true);
  });

  it.each([
    ["profile/info/page", "components/setting/profile/PersonalInfoForm", "initialData"],
    ["profile/picture/page", "components/settings/UploadProfilePhoto", "userProfile"],
    ["profile/size/page", "components/settings/ProfileSizeInfo", "initialData"],
  ])("%s uses the stored profile when there is one", async (path, component, prop) => {
    spies.profile.current = { name: "Sara" };
    const { default: Page } = await load(path);

    render(await Page());

    expect(spies.props[component][prop], `${path} did not use the stored profile`).toEqual({ name: "Sara" });
  });

  it("the bank cards page shows only its back bar", async () => {
    const { default: Page } = await load("profile/Bank-Cards/page");

    render(await Page());

    expect(spies.props["components/setting/BackBar"].name, "the bank cards title is not translated").toBe(
      "en:Profile | Bank Cards",
    );
  });

  it("the address page loads the countries for the locale", async () => {
    const { default: Page } = await load("profile/address/page");

    render(await Page());

    expect(spies.GetCountries, "the countries were not asked for the locale").toHaveBeenCalledWith({ country: "sy", language: "en" });
    expect(spies.props["components/settings/PersonalInfoAddress"].countries, "the countries were not passed on").toEqual([
      { iso: "sy" },
    ]);
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
