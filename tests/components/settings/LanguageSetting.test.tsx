// The language picker on the settings page (components/settings/LanguageSetting.tsx).
//
// It lists the languages, marks the chosen one, and shows Save only once the
// shopper picks a language different from the current one. Save writes the
// locale cookie and reloads the settings page under the new locale.
import { afterEach, describe, expect, it, vi } from "vitest";

const setLocaizationCookies = vi.hoisted(() => vi.fn());
vi.mock("utils/cookies/cookie-manager", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, setLocaizationCookies };
});

import LanguageSetting from "components/settings/LanguageSetting";
import { fireEvent, renderWithProviders, screen, userEvent } from "../../render";

const sel = (pw: string) =>
  document.querySelector(`[data-pw="${pw}"]`) as HTMLElement;
const MARKED = "rgba(64, 44, 221";

/** A stand-in address that records where the page was sent. jsdom cannot
 *  navigate, and the page re-renders images after Save, so `href` must stay a
 *  full URL when read. */
function fakeLocation() {
  const sentTo: string[] = [];
  const location = {
    pathname: "/gb-en/settings",
    origin: "http://localhost",
    get href() {
      return "http://localhost/gb-en/settings";
    },
    set href(value: string) {
      sentTo.push(value);
    },
  };
  return { location, sentTo };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderPicker() {
  return renderWithProviders(
    <LanguageSetting
      local="gb-en"
      languageVar="en"
      languages={["en", "ar", "tr", "ku", "xx"]}
      isRtl={false}
    />,
  );
}

describe("the language list", () => {
  it("names every language and marks the current one", async () => {
    await renderPicker();
    for (const name of ["English", "العربية", "Turkish", "کوردی"]) {
      expect(screen.getByText(name), `${name} is not listed`).toBeInTheDocument();
    }
    expect(
      sel("language-en").getAttribute("style"),
      "the current language is not marked",
    ).toContain(MARKED);
    expect(
      sel("language-xx").textContent,
      "an unknown language code was given a name",
    ).toBe("");
    expect(
      screen.queryByText("Save"),
      "Save is offered before anything changed",
    ).not.toBeInTheDocument();
  });
});

describe("saving a new language", () => {
  it("writes the cookie, clears the cached settings and reloads under the new locale", async () => {
    const { location, sentTo } = fakeLocation();
    sessionStorage.setItem("starttingSetting", "cached");
    await renderPicker();
    await userEvent.setup().click(sel("language-ar"));
    expect(
      sel("language-ar").getAttribute("style"),
      "the picked language is not marked",
    ).toContain(MARKED);
    vi.stubGlobal("location", location);
    fireEvent.click(screen.getByText("Save"));

    expect(
      setLocaizationCookies,
      "the new language was not written to the cookie",
    ).toHaveBeenCalledWith(null, "ar");
    expect(
      sessionStorage.getItem("starttingSetting"),
      "the cached settings were not cleared",
    ).toBeNull();
    expect(
      sentTo,
      "the page did not reload under the new locale",
    ).toEqual(["/gb-ar/settings"]);

    fireEvent.click(screen.getByText("Save"));
    expect(
      setLocaizationCookies,
      "a second Save while switching sent the change again",
    ).toHaveBeenCalledTimes(1);
  });

  it("lets the shopper try again when writing the cookie throws", async () => {
    setLocaizationCookies.mockImplementationOnce(() => {
      throw new Error("cookie blocked");
    });
    await renderPicker();
    await userEvent.setup().click(sel("language-tr"));
    vi.stubGlobal("location", fakeLocation().location);
    fireEvent.click(screen.getByText("Save"));
    fireEvent.click(screen.getByText("Save"));
    expect(
      setLocaizationCookies,
      "after a failed save, Save stayed locked",
    ).toHaveBeenCalledTimes(2);
  });
});
