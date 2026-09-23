// The country picker (components/settings/PersonalInfoCountries.tsx).
//
// It loads the country list (session cache first), marks the country in the
// address, and on a new pick writes the locale cookie, reloads the starter
// settings for the new country and moves the page to the new locale. On the
// settings page (top bar shown) it asks first; inside the region popup
// (`hideTopBar`) it switches at once.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCountries = vi.hoisted(() => vi.fn());
vi.mock("serverRequests/product", () => ({ GetCountries: getCountries }));

const fetchDataMock = vi.hoisted(() => vi.fn());
vi.mock("utils/fetchData", () => ({
  fetchData: fetchDataMock,
  abortInFlightForLogout: vi.fn(),
}));

const setLocaizationCookies = vi.hoisted(() => vi.fn());
vi.mock("utils/cookies/cookie-manager", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, setLocaizationCookies };
});

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

import PersonalInfoCountries from "components/settings/PersonalInfoCountries";
import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const COUNTRIES = [
  { id: 1, iso: "GB" },
  { id: 2, iso: "SY" },
];

const row = (iso: string) =>
  document.querySelector(`[data-pw="personal-info-countries-${iso}"]`) as HTMLElement;
const MARKED = "rgba(64, 44, 221";

/** jsdom cannot navigate. This stand-in records the page moves the picker
 *  makes (through `href` or `pathname`), and keeps reads absolute so images
 *  that re-render still resolve. */
let original: PropertyDescriptor | undefined;
function stubAddress(pathname: string) {
  original = Object.getOwnPropertyDescriptor(window, "location");
  const moves: string[] = [];
  const stub = {
    origin: "http://localhost",
    search: "",
    hash: "",
    get pathname() {
      return pathname;
    },
    set pathname(value: string) {
      moves.push(value);
    },
    get href() {
      return `http://localhost${pathname}`;
    },
    set href(value: string) {
      moves.push(value);
    },
  };
  Object.defineProperty(window, "location", { configurable: true, value: stub });
  return moves;
}

beforeEach(() => {
  sessionStorage.clear();
  getCountries.mockReset();
  getCountries.mockResolvedValue(COUNTRIES);
  fetchDataMock.mockReset();
  fetchDataMock.mockResolvedValue({ success: true, data: { currency: { symbol: "$" } } });
});
afterEach(() => {
  if (original) Object.defineProperty(window, "location", original);
  original = undefined;
  vi.clearAllMocks();
});

async function renderPicker(props: any = {}) {
  const setSettings = vi.fn();
  const r = await renderWithProviders(
    <PersonalInfoCountries local="gb-en" {...props} />,
    { store: { setSettings } },
  );
  await waitFor(() => expect(row("SY"), "the country list did not load").not.toBeNull());
  return { ...r, setSettings };
}

describe("the country list", () => {
  it("loads the list, keeps it in the session, and marks the address country", async () => {
    await renderPicker();
    expect(getCountries, "the list was not asked for this country and language").toHaveBeenCalledWith({
      country: "gb",
      language: "en",
    });
    expect(JSON.parse(sessionStorage.getItem("countries-gb-en")!), "the list was not kept in the session").toEqual(COUNTRIES);
    await waitFor(() => expect(row("GB").getAttribute("style"), "the address country is not marked").toContain(MARKED));
    expect(
      screen.getByText(/Entering The Information Below Clearly/),
      "the default info message is not shown",
    ).toBeInTheDocument();
  });

  it("reads the list from the session without asking again, and shows a custom message", async () => {
    sessionStorage.setItem("countries-gb-en", JSON.stringify(COUNTRIES));
    await renderPicker({ infoMessage: "Pick your region" });
    expect(getCountries, "a cached list was asked for again").not.toHaveBeenCalled();
    expect(screen.getByText("Pick your region"), "the custom info message is not shown").toBeInTheDocument();
  });

  it("shows a spinner while loading, and an empty list when loading fails", async () => {
    let fail: (e: any) => void = () => {};
    getCountries.mockReturnValue(new Promise((_, reject) => (fail = reject)));
    await renderWithProviders(<PersonalInfoCountries local="gb-en" infoMessage="" />);
    expect(row("GB"), "rows showed while loading").toBeNull();
    fail(new Error("down"));
    await waitFor(() =>
      expect(screen.getByText("Available Countries"), "the picker broke on a failed list").toBeInTheDocument(),
    );
  });
});

describe("changing country from the settings page", () => {
  it("asks first; cancel keeps the country, and tapping the current one does nothing", async () => {
    await renderPicker({ isRtl: true });
    const user = userEvent.setup();
    await user.click(row("GB"));
    expect(screen.queryByText("Confirm Country Change"), "tapping the current country asked to change it").not.toBeInTheDocument();

    await user.click(row("SY"));
    expect(screen.getByText("Confirm Country Change"), "a new country did not ask for confirmation").toBeInTheDocument();
    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm Country Change"), "cancel left the confirmation open").not.toBeInTheDocument();
    expect(setLocaizationCookies, "cancel still changed the country").not.toHaveBeenCalled();
  });

  it("confirm writes the cookie, stores the new settings and moves to the new settings page", async () => {
    const moves = stubAddress("/gb-en/settings/countries");
    const { setSettings } = await renderPicker();
    const user = userEvent.setup();
    await user.click(row("SY"));
    await user.click(screen.getByText("Confirm"));

    await waitFor(() => expect(moves, "the page did not move to the new country").toEqual(["/sy-en/settings"]));
    expect(setLocaizationCookies, "the new country was not written to the cookie").toHaveBeenCalledWith("sy", "en");
    expect(setSettings, "the new starter settings were not stored").toHaveBeenCalled();
    expect(sessionStorage.getItem("starttingSetting"), "the new starter settings were not cached").not.toBeNull();
  });

  it("logs refused starter settings and does not move", async () => {
    const moves = stubAddress("/gb-en/settings/countries");
    fetchDataMock.mockResolvedValue({ success: false, message: "no settings" });
    await renderPicker();
    const user = userEvent.setup();
    await user.click(row("SY"));
    await user.click(screen.getByText("Confirm"));
    await waitFor(() =>
      expect(logError, "refused starter settings were not logged").toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "PersonalInfoCountries: the starter settings did not update after a country change",
        }),
      ),
    );
    expect(moves, "the page moved although the settings were refused").toEqual([]);
    expect(row("SY").parentElement!.className, "the list stayed faded after the failure").not.toContain("opacity-50");
  });
});

describe("changing country inside the region popup", () => {
  it("switches at once and rewrites the gb locale in the current address", async () => {
    const moves = stubAddress("/gb-en/products/shoe");
    await renderPicker({ hideTopBar: true });
    expect(
      document.querySelector('[data-pw="personal-info-countries-back-button"]'),
      "the popup shows the top bar",
    ).toBeNull();
    await userEvent.setup().click(row("SY"));
    await waitFor(() =>
      expect(moves, "the popup did not move to the same page in the new country").toEqual([
        "http://localhost/sy-en/products/shoe",
      ]),
    );
  });
});
