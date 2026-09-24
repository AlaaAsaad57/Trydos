// utils/PopupCountry.tsx — the "Select Your Region" popup that components/Home/Init
// shows when the visitor's country changed, or when there is no country yet.
//
// The popup first plays a short progress bar, then shows the two country
// choices. Picking one writes the locale cookies and moves the page to the same
// path under the new locale.
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../render";

vi.mock("components/settings/PersonalInfoCountries", () => ({
  default: ({ local, infoMessage }: any) => (
    <div data-testid="country-list">
      {local}|{infoMessage}
    </div>
  ),
}));
vi.mock("components/global/Spinner", () => ({
  default: () => <div data-testid="spinner" />,
}));

const setLocaizationCookies = vi.hoisted(() => vi.fn());
vi.mock("utils/cookies/cookie-manager", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return { ...actual, setLocaizationCookies };
});

import PopupCountry from "utils/PopupCountry";

const COUNTRIES = [{ id: 1 }];

/** Run the progress bar to the end: 150 ms steps, then the 500 ms hand-over. */
async function finishProgress() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(150 * 20);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
}

let replace: ReturnType<typeof vi.fn>;
const realLocation = window.location;

beforeEach(() => {
  vi.useFakeTimers();
  // Each step adds 0.5 * 10 + 2 = 7 per cent, so every band of the bar is seen.
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  setLocaizationCookies.mockReset();
  replace = vi.fn();
  Object.defineProperty(window, "location", {
    value: {
      href: "http://localhost:3000/",
      origin: "http://localhost:3000",
      protocol: "http:",
      host: "localhost:3000",
      hostname: "localhost",
      port: "3000",
      pathname: "/",
      search: "",
      hash: "",
      replace,
      assign: vi.fn(),
      reload: vi.fn(),
      toString: () => "http://localhost:3000/",
    },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(window, "location", { value: realLocation, configurable: true });
});

describe("the progress bar", () => {
  it("walks through every loading message and ends on Ready!", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged={null} noCountry={false} />,
      { country: "sy", path: "/products" },
    );
    expect(screen.getByText("Preparing Your Experience"), "the loading screen is not shown first").toBeInTheDocument();
    const seen: string[] = [];
    const bands = ["Initializing...", "Loading countries...", "Preparing options...", "Almost ready...", "Ready!"];
    for (let i = 0; i < 16; i += 1) {
      for (const band of bands) if (screen.queryByText(band) && !seen.includes(band)) seen.push(band);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
    }
    expect(seen, "a loading band was skipped").toEqual(bands);
  });
});

describe("the country-changed choice", () => {
  it("offers the new and the old country and moves to the new one", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged="tr,iq" noCountry={false} />,
      { country: "sy", path: "/products" },
    );
    await finishProgress();
    expect(screen.getByText("Select Your Region"), "the region box did not open").toBeInTheDocument();
    const box = document.querySelector('[data-pw="address-info-header"]');
    expect(box?.textContent, "the changed-country message is missing").toContain("You previously visited from");

    fireEvent.click(document.querySelector('[data-pw="countain-with"]')!);
    expect(screen.getByText("Switching Country..."), "no switching screen after the choice").toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(setLocaizationCookies, "the locale cookies were not written").toHaveBeenCalledWith("tr", "en");
    expect(document.cookie, "the country cookie was not written").toContain("country=tr");
    expect(replace, "the page did not move to the new locale").toHaveBeenCalledWith(
      "http://localhost:3000/tr-en/products?_bypass=popup-selection",
    );
  });

  it("moves back to the old country from the second button", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged="tr,iq" noCountry={false} />,
      { country: "sy", path: "/cart" },
    );
    await finishProgress();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(replace, "the page did not move to the old locale").toHaveBeenCalledWith(
      "http://localhost:3000/iq-en/cart?_bypass=popup-selection",
    );
  });

  it("ignores a second choice while the first is still moving the page", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged="tr,iq" noCountry={false} />,
      { country: "sy", path: "/" },
    );
    await finishProgress();
    const buttons = screen.getAllByRole("button");
    act(() => {
      buttons[0].click();
      buttons[1].click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(replace.mock.calls, "two navigations ran at once").toEqual([
      ["http://localhost:3000/tr-en?_bypass=popup-selection"],
    ]);
  });

  it("comes back to the choice when writing the cookies fails", async () => {
    setLocaizationCookies.mockImplementation(() => {
      throw new Error("cookie blocked");
    });
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged="tr,iq" noCountry={false} />,
      { country: "sy", path: "/" },
    );
    await finishProgress();
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button")[0]);
    });
    expect(replace, "the page moved although the cookies failed").not.toHaveBeenCalled();
    expect(screen.getByText("Select Your Region"), "the choice did not come back after the failure").toBeInTheDocument();
  });

  it("shows no choice when the changed pair is broken", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged="undefined,iq" noCountry={false} />,
      { country: "sy" },
    );
    await finishProgress();
    expect(screen.queryAllByRole("button"), "a broken pair still offered buttons").toEqual([]);
  });
});

describe("the no-country and waiting states", () => {
  it("shows the country list in the visitor's language when there is no country", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged={null} noCountry />,
      { country: "sy", params: { lang: ["sy-ar"] as any } },
    );
    await finishProgress();
    expect(screen.getByTestId("country-list").textContent, "the country list got the wrong locale").toContain(
      "sy-ar|",
    );
  });

  it("keeps the spinner up while the countries have not arrived", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={[]} forChanged={null} noCountry={false} />,
      { country: "sy" },
    );
    await finishProgress();
    expect(screen.getByText("Loading..."), "no waiting text while countries load").toBeInTheDocument();
    expect(screen.getByTestId("spinner"), "no spinner while countries load").toBeInTheDocument();
  });

  it("falls back to English when the route has no locale", async () => {
    await renderWithProviders(
      <PopupCountry options={[]} countries={COUNTRIES} forChanged={null} noCountry />,
      { country: "sy", params: { lang: undefined as any } },
    );
    expect(screen.getByText("Preparing Your Experience"), "the English text is missing").toBeInTheDocument();
  });
});
