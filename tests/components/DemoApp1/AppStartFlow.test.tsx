// The real start flow (components/DemoApp1/AppStartFlow.tsx, Stage 7e part 2):
// the /demo country picker with the real country list, inside the real login
// widget, as a layer over the page.
//
// The login widget is a stand-in here: it draws the host's picker and offers
// its `onFinish`. The picker itself (CountryPickerBody) is the real one.
import React from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const picked = vi.fn();
vi.mock("NewLoginDesign/NewLoginWidget", () => ({
  default: (p: any) => (
    <div data-testid="login-widget" data-step={p.initialStep}>
      {p.countryPicker?.(() => picked())}
      <button onClick={p.onFinish}>finish</button>
    </div>
  ),
}));

import AppStartFlow, { endAddress, readChanged } from "components/DemoApp1/AppStartFlow";
import { isCrawlerAgent } from "utils/botAgent";
import { useAppStore } from "store";

/** The list staging's core backend gave on 2026-11-28 (GET /countries). */
const STAGING = [
  { iso: "IQ", name: "Iraq" },
  { iso: "LB", name: "lebanon" },
  { iso: "SY", name: "syria" },
  { iso: "TR", name: "Turkey" },
];

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0";

const agent =
  Object.getOwnPropertyDescriptor(navigator, "userAgent") ??
  Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");
const setAgent = (value: string) =>
  Object.defineProperty(navigator, "userAgent", { value, configurable: true });

const clearCookies = () => {
  for (const name of ["country", "lang", "language"])
    document.cookie = `${name}=; path=/; max-age=0`;
};
const cookie = (name: string) =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];

/** Past the picker's fill and hold (HOLD_MS, 1000 ms). */
const afterHold = () => act(() => new Promise((r) => setTimeout(r, 1100)));
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

const open = async (
  props: Partial<React.ComponentProps<typeof AppStartFlow>> = {},
  options: Parameters<typeof renderWithProviders>[1] = {},
) => {
  const onRetry = vi.fn();
  const view = await renderWithProviders(
    <AppStartFlow
      words={{}}
      countries={STAGING}
      changed={null}
      loadFailed={false}
      onRetry={onRetry}
      {...props}
    />,
    options,
  );
  await flush();
  return { ...view, onRetry };
};

const row = (id: string) => document.querySelector(`[data-pw="demo-picker-country-${id}"]`) as HTMLElement | null;
const rowIds = () =>
  Array.from(document.querySelectorAll('[data-pw^="demo-picker-country-"]'))
    .map((el) => el.getAttribute("data-pw")!.replace("demo-picker-country-", ""))
    .filter((id) => id !== "skeleton");

describe("AppStartFlow — the real start flow", () => {
  beforeEach(() => {
    picked.mockReset();
    clearCookies();
  });
  afterEach(() => {
    if (agent) Object.defineProperty(navigator, "userAgent", agent);
    clearCookies();
  });

  it("the first render is the white cover and reads no browser value", () => {
    const html = renderToString(
      <AppStartFlow words={{}} countries={[]} changed={null} loadFailed={false} onRetry={() => {}} />,
    );
    expect(html, "the server render is not the white start cover").toContain('data-pw="start-cover"');
    expect(html, "the server render drew the login before the browser check").not.toContain("login-widget");
    expect(html, "the start cover is a fixed box (Safari 26 paints a block under its bar, finding S-1)").not.toContain(
      "position:fixed",
    );
  });

  it("a crawler user agent gets no start flow", async () => {
    setAgent(GOOGLEBOT);
    await open();
    expect(screen.queryByTestId("login-widget"), "a crawler got the start flow over the page").toBeNull();
    expect(document.querySelector('[data-pw="start-cover"]'), "a crawler still has the white cover over the page").toBeNull();
    expect(useAppStore.getState().loginLayerOpen, "a crawler's page marked a login layer open").toBe(false);
  });

  it("Instagram's in-app browser is not a crawler", async () => {
    expect(isCrawlerAgent(INSTAGRAM), "the Instagram in-app browser was taken for a crawler").toBe(false);
    expect(isCrawlerAgent("WhatsApp/2.23.20 A"), "the WhatsApp link-preview fetcher was not taken for a crawler").toBe(true);
    setAgent(INSTAGRAM);
    await open();
    expect(screen.getByTestId("login-widget").dataset.step, "an Instagram shopper did not get the start flow").toBe(
      "country-picker",
    );
  });

  it("the rows are the countries of the list, nothing chosen", async () => {
    await open();
    expect(rowIds(), "the rows are not the list's countries in the design's order").toEqual(["tr", "sy", "iq", "lb"]);
    for (const id of ["tr", "sy", "iq", "lb"])
      expect(row(id)?.getAttribute("aria-pressed"), `the ${id} row is chosen before any tap`).toBe("false");
    expect(useAppStore.getState().loginLayerOpen, "the open start flow did not hold the other login canvases").toBe(true);
  });

  it("a list country with no design flag gets its standard flag", async () => {
    await open({ countries: [...STAGING, { iso: "JO", name: "Jordan" }] });
    const jordan = row("jo");
    expect(jordan, "a listed country outside the design's four has no row").not.toBeNull();
    expect(jordan!.querySelector("img")?.getAttribute("src"), "Jordan's row does not show its standard flag").toBe(
      "/icons/flag/jo.svg",
    );
    expect(jordan!.textContent, "Jordan's row has no name").toContain("Jordan");
  });

  it("Syria's name is the translated word in ar", async () => {
    await open({ words: { Syria: "سوريا" } }, { language: "ar" });
    expect(row("sy")?.textContent, "Syria's row is not in Arabic on an ar page").toContain("سوريا");
  });

  it("changed-country shows only its two countries, the new one chosen", async () => {
    await open({ changed: "sy,tr" }, { country: "sy" });
    expect(rowIds(), "a country change does not show exactly its two countries").toEqual(["tr", "sy"]);
    expect(row("sy")?.getAttribute("aria-pressed"), "the address's new country is not chosen at first").toBe("true");
    expect(
      document.querySelector('[data-pw="demo-country-map-sy"]')?.getAttribute("data-on"),
      "the new country is not chosen on the map",
    ).toBe("true");
  });

  it("a tap on the other row picks it", async () => {
    await open({ changed: "sy,tr" }, { country: "sy" });
    fireEvent.click(row("tr")!);
    await afterHold();
    expect(picked, "a tap on the old country did not move the flow on").toHaveBeenCalledTimes(1);
    expect(cookie("country"), "the old country was not saved as the shopper's country").toBe("tr");
  });

  it("a map country outside the two takes no tap", async () => {
    await open({ changed: "sy,tr" }, { country: "sy" });
    fireEvent.click(document.querySelector('[data-pw="demo-country-map-iq"]')!);
    await afterHold();
    expect(picked, "a tap on Iraq's shape picked a country outside the change").not.toHaveBeenCalled();
    expect(cookie("country"), "a tap on Iraq's shape saved a country").toBeUndefined();
  });

  it("a pick saves the country and language cookies and moves on with no page load", async () => {
    await open({}, { language: "ar" });
    fireEvent.click(row("sy")!);
    await afterHold();
    expect(picked, "the pick did not move the flow on to the Quick Preview").toHaveBeenCalledTimes(1);
    expect(cookie("country"), "the picked country was not saved").toBe("sy");
    expect(cookie("lang"), "the page's language was not saved with the pick").toBe("ar");
    expect(cookie("language"), "the `language` cookie the old popup set was not saved").toBe("ar");
    expect(window.location.pathname, "the pick moved the page before the flow ended").toBe("/gb-ar");
  });

  it("a failed list shows the retry, and the retry reads it again", async () => {
    const { onRetry } = await open({ countries: [], loadFailed: true });
    expect(
      document.querySelector('[data-pw="country-load-failed"]')?.textContent,
      "the failed list has no message",
    ).toContain("The country list could not be loaded");
    fireEvent.click(document.querySelector('[data-pw="country-retry"]')!);
    expect(onRetry, "Try again did not read the list again").toHaveBeenCalledTimes(1);
  });

  it("an empty list shows skeleton rows", async () => {
    await open({ countries: [] });
    expect(
      document.querySelectorAll('[data-pw="demo-picker-country-skeleton"]').length > 0 && rowIds().length === 0,
      "a list that is still loading does not show skeleton rows in the rows' place",
    ).toBe(true);
  });

  it("a changed-country value that is not a listed country is ignored", async () => {
    expect(readChanged("/evil.example,tr", ["tr", "sy"]), "a path in changed-country was accepted as a country").toBeNull();
    expect(readChanged("xx,tr", ["tr", "sy"]), "an unlisted code in changed-country was accepted").toBeNull();
    expect(readChanged("sy,tr", ["tr", "sy"]), "a good country change was refused").toEqual(["sy", "tr"]);
    await open({ changed: "xx,tr" }, { country: "sy" });
    expect(rowIds(), "a bad country change did not fall back to every listed country").toEqual(["tr", "sy", "iq", "lb"]);
    for (const id of rowIds())
      expect(row(id)?.getAttribute("aria-pressed"), `a bad country change chose ${id}`).toBe("false");
  });

  it("the end of the flow opens the same path in the picked country with the flags gone", () => {
    const to = endAddress("sy", "en", ["sy", "tr"], {
      origin: "https://shop.test",
      pathname: "/gb-en/about",
      search: "?no-country=true&cart=1&q=2&_t=9&changed-country=sy,tr",
    });
    expect(to, "the end address is not the same path in the picked country").toBe(
      "https://shop.test/sy-en/about?q=2&_bypass=popup-selection",
    );
  });

  it("the end address always stays on this site", () => {
    const where = { origin: "https://shop.test", pathname: "//evil.test/x", search: "" };
    expect(endAddress("/evil.test", "en", ["sy"], where), "a path as the country gave an end address").toBeNull();
    expect(endAddress("sy", "en/../x", ["sy"], where), "a bad language gave an end address").toBeNull();
    const to = endAddress("sy", "en", ["sy"], where);
    expect(new URL(to!).origin, "the end address left this site").toBe("https://shop.test");
  });

  it("the end of the flow never opens a gb address", async () => {
    const where = { origin: "https://shop.test", pathname: "/gb-en", search: "" };
    expect(endAddress("gb", "en", ["gb", "sy"], where), "the flow could end on a gb address").toBeNull();
    expect(endAddress(null, "en", ["sy"], where), "the flow could end with no pick").toBeNull();
    await open();
    fireEvent.click(screen.getByText("finish"));
    expect(screen.getByTestId("login-widget"), "an end with no pick closed the flow").toBeInTheDocument();
    expect(window.location.pathname, "an end with no pick moved the page").toBe("/gb-en");
  });
});
