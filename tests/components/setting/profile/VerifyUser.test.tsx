// The verify control on the settings profile card.
//
// It decides one thing without any backend: does this account already have a
// usable phone on record? If it does it reads **Verified** and opens nothing;
// if it does not it offers **Verify Now**.
//
// The second behaviour here is the one that is easy to get wrong and easy to
// miss. This control opens its own re-verify overlay, and the app has other,
// global auth surfaces that can be up at the same time. Only one scaled canvas
// may be mounted at a time, so this overlay stands down whenever a global
// surface is up — and it must **stay** down when that surface closes. An
// overlay that pops back the moment a global prompt clears puts the shopper in
// a flow they never asked for, with its state gone.
//
// ---------------------------------------------------------------------------
// Why `AuthOverlay` is the stub, and not the flow inside it
//
// `AuthOverlay` is what mounts the scaled canvas: it writes `:root` variables
// and appends a `<style>` tag to `<head>` that its cleanup never removes, so a
// real mount leaks into every later case in this file. The verify flow is only
// its child. Stubbing the child would leave the leak in place — which is the
// mistake an earlier draft of this work made.
//
// Nothing here asserts on the flow's internals. "The overlay was asked to open"
// is the whole criterion.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("components/Login/Enhanced/AuthOverlay", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-overlay">{children}</div>
  ),
}));

vi.mock("components/Login/Enhanced/VerifyPhoneFlow", () => ({
  default: () => <div data-testid="verify-phone-flow" />,
}));

// The profile service is stubbed in every component file here: the unit setup
// treats an unhandled request as an error, and this service pulls a wide graph.
vi.mock("services/auth", () => ({
  default: { VerifyOtp: vi.fn(async () => ({ success: true })) },
}));

import VerifyUser from "components/setting/profile/VerifyUser";
import { buildUser } from "../../../fixtures/user";
import { renderWithProviders, screen, userEvent } from "../../../render";

/** A phone the app will accept as real. Fake and non-routable — see
 *  `tests/fixtures/user.ts`; nothing here may carry a real identity. */
const USABLE_PHONE = buildUser().phone;

afterEach(() => {
  vi.clearAllMocks();
});

describe("an account that already has a usable phone", () => {
  it("reads Verified", async () => {
    await renderWithProviders(<VerifyUser phone={USABLE_PHONE} />, {
      store: { userProfile: buildUser() },
    });

    expect(
      screen.getByText("Verified"),
      "an account with a usable phone on record is not marked as verified",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Verify Now"),
      "an account with a usable phone is being asked to verify a number it already has",
    ).not.toBeInTheDocument();
  });

  it("opens nothing when it is tapped", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<VerifyUser phone={USABLE_PHONE} />, {
      store: { userProfile: buildUser() },
    });

    await user.click(screen.getByText("Verified"));

    expect(
      screen.queryByTestId("auth-overlay"),
      "tapping a verified account's control opened the re-verify overlay, which it has no reason to do",
    ).not.toBeInTheDocument();
  });
});

describe("an account with no usable phone", () => {
  it("reads Verify Now", async () => {
    await renderWithProviders(<VerifyUser phone="" />, {
      store: { userProfile: buildUser({ phone: "" }) },
    });

    expect(
      screen.getByText("Verify Now"),
      "an account with no usable phone is not being offered a way to verify one",
    ).toBeInTheDocument();
  });

  it("opens the re-verify overlay when it has a number to work with", async () => {
    const user = userEvent.setup();
    // A number the app does not consider usable, but which exists — that is the
    // branch that re-verifies rather than sending the shopper to sign in.
    await renderWithProviders(<VerifyUser phone="+1000000" />, {
      store: { userProfile: buildUser({ phone: "+1000000" }) },
    });

    await user.click(screen.getByText("Verify Now"));

    expect(
      screen.getByTestId("auth-overlay"),
      "an unverified account with a number on record was not offered the re-verify step",
    ).toBeInTheDocument();
  });

  it("sends a shopper with no number at all to the sign-in surface instead", async () => {
    const user = userEvent.setup();
    const { store } = await renderWithProviders(<VerifyUser phone="0" />, {
      store: { userProfile: buildUser({ phone: "0" }) },
    });

    await user.click(screen.getByText("Verify Now"));

    expect(
      store.getState().loginOpen,
      "a visitor with no number on record was not sent to the sign-in surface",
    ).toBe(true);
    expect(
      screen.queryByTestId("auth-overlay"),
      "a visitor with no number to re-verify was shown the re-verify overlay anyway",
    ).not.toBeInTheDocument();
  });
});

describe("standing down for a global auth surface", () => {
  it("closes its overlay when a global surface opens, and does not reopen when that surface clears", async () => {
    const user = userEvent.setup();
    const { store } = await renderWithProviders(<VerifyUser phone="+1000000" />, {
      store: { userProfile: buildUser({ phone: "+1000000" }) },
    });

    await user.click(screen.getByText("Verify Now"));
    expect(
      screen.getByTestId("auth-overlay"),
      "the re-verify overlay never opened, so this case cannot show it standing down",
    ).toBeInTheDocument();

    // A global auth surface goes up — only one scaled canvas may be mounted.
    await vi.waitFor(() => {
      store.setState({ loginOpen: true });
    });
    expect(
      screen.queryByTestId("auth-overlay"),
      "the settings overlay stayed up while a global auth surface was open — two scaled canvases corrupt each other",
    ).not.toBeInTheDocument();

    // The global surface closes. This is the half that is easy to miss.
    await vi.waitFor(() => {
      store.setState({ loginOpen: false });
    });
    expect(
      screen.queryByTestId("auth-overlay"),
      "the settings overlay came back on its own once the global surface closed, dropping the shopper into a flow they did not ask for",
    ).not.toBeInTheDocument();
  });

  it("stands down for a re-authentication demand too, not only the sign-in surface", async () => {
    const user = userEvent.setup();
    const { store } = await renderWithProviders(<VerifyUser phone="+1000000" />, {
      store: { userProfile: buildUser({ phone: "+1000000" }) },
    });

    await user.click(screen.getByText("Verify Now"));
    expect(
      screen.getByTestId("auth-overlay"),
      "the re-verify overlay never opened, so this case cannot show it standing down",
    ).toBeInTheDocument();

    await vi.waitFor(() => {
      store.setState({ shouldAuthinticated: true });
    });
    expect(
      screen.queryByTestId("auth-overlay"),
      "the settings overlay stayed up while the app was demanding a re-authentication",
    ).not.toBeInTheDocument();
  });
});
