// The profile card at the top of the settings page.
//
// It decides, with no backend, which of two completely different cards a
// visitor gets: a signed-in shopper's name, number and picture, or an invitation
// to log in. Getting that wrong either hides a shopper's own details from them
// or shows a guest a card belonging to nobody.
//
// The part worth the most here is the placeholder list. The app stores a
// **name** in the picture field for visitors who have no picture, and one of the
// values it stores is misspelled — `verfied_guest`. That misspelling is
// load-bearing: correct it in the component without correcting it wherever the
// value is written and every one of those shoppers gets a broken image instead
// of the placeholder. So it is pinned here by name.
//
// ---------------------------------------------------------------------------
// What is stubbed, and why
//
// The card renders the verify control, which reaches `AuthOverlay` and through
// it the scaled canvas — `:root` variables and a `<style>` tag its cleanup never
// removes, leaking into every later case in this file. It also statically
// imports the QR sign-in modals, which drag a barcode reader and a service in.
// None of that is anything AC-13 asserts, so all three are stood in for.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./VerifyUser", () => ({
  default: () => <div data-testid="verify-control" />,
}));
vi.mock("components/setting/profile/VerifyUser", () => ({
  default: () => <div data-testid="verify-control" />,
}));
vi.mock("components/Login/QrScannerModal", () => ({
  default: () => <div data-testid="qr-scanner" />,
}));
vi.mock("components/Login/QrApprovalSheet", () => ({
  default: () => <div data-testid="qr-approval" />,
}));
vi.mock("services/auth", () => ({ default: {} }));

import Profile from "components/setting/profile/index";
import { buildUser } from "../../../fixtures/user";
import { renderWithProviders, screen, userEvent } from "../../../render";

const show = (overrides: Record<string, unknown> = {}, storeUser?: unknown) =>
  renderWithProviders(
    <Profile
      isRtl={false}
      language="en"
      local="gb-en"
      SafeUserProfile={buildUser(overrides as never)}
    />,
    { store: { userProfile: storeUser ?? buildUser(overrides as never) } },
  );

afterEach(() => {
  vi.clearAllMocks();
});

describe("a signed-in shopper", () => {
  it("sees their own name on the card", async () => {
    await show({ name: "Test User" });

    expect(
      screen.getByText("Test User"),
      "a signed-in shopper's own name is not on their profile card",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Login"),
      "a signed-in shopper is being invited to log in on their own profile card",
    ).not.toBeInTheDocument();
  });

  it("gets a link to the picture page and a link to their profile", async () => {
    const { container } = await show();

    expect(
      container.querySelector('a[href$="/settings/profile/picture"]'),
      "a signed-in shopper has no way to reach the picture page from the card",
    ).not.toBeNull();
    expect(
      container.querySelector('a[href$="/settings/profile"]'),
      "a signed-in shopper has no way to reach their profile from the card",
    ).not.toBeNull();
  });

  it("shows the verify control", async () => {
    await show();

    expect(
      screen.getByTestId("verify-control"),
      "a signed-in shopper's card does not carry the verify control",
    ).toBeInTheDocument();
  });
});

describe("a visitor who is not signed in", () => {
  const GUEST = { phone: "0" } as const;

  it("is invited to log in instead of shown a card", async () => {
    await show(GUEST);

    expect(
      screen.getByText("Login"),
      "a visitor who is not signed in is not being invited to log in",
    ).toBeInTheDocument();
  });

  it("has no profile link to follow", async () => {
    const { container } = await show(GUEST);

    expect(
      container.querySelector('a[href*="/settings/profile"]'),
      "a visitor who is not signed in was given a link into somebody's profile",
    ).toBeNull();
  });

  it("opens the sign-in surface when the card is tapped, instead of navigating", async () => {
    const user = userEvent.setup();
    const { store } = await show(GUEST);

    await user.click(screen.getByText("Login"));

    expect(
      store.getState().loginOpen,
      "tapping the card as a signed-out visitor did not open the sign-in surface",
    ).toBe(true);
  });
});

describe("the placeholder names the app stores instead of a picture", () => {
  // Every value the card must treat as "no picture". The third is misspelled in
  // the app and that spelling is deliberate — see the note at the top.
  const PLACEHOLDERS = ["guest", "verified_guest", "verfied_guest", "null", ""];

  for (const value of PLACEHOLDERS) {
    it(`treats ${value === "" ? "an empty value" : `"${value}"`} as no picture`, async () => {
      await show({ image: value });

      expect(
        screen.getByAltText("user profile placeholder"),
        `the card tried to load "${value}" as a real picture instead of falling back to the placeholder`,
      ).toBeInTheDocument();
      expect(
        screen.queryByAltText("user profile"),
        `the card treated "${value}" as a real picture, so the shopper sees a broken image`,
      ).not.toBeInTheDocument();
    });
  }

  it("still shows a real picture when there is one", async () => {
    await show({ image: "/user/test-user.png" });

    expect(
      screen.getByAltText("user profile"),
      "a shopper with a real picture on record is being shown the placeholder instead",
    ).toBeInTheDocument();
  });
});
