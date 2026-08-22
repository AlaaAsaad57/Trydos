// The app-wide "confirm your number" overlay.
//
// Every flow that needs a verified shopper — the checkout gate, posting a
// story, opening chat, a session that expired, the seller dashboard — raises
// this one widget by writing a marker into the store. The widget reads that
// marker to decide three things nothing else decides: which number to put in
// front of the shopper, what to do when they finish, and what to do when they
// walk away. Getting any of them wrong strands somebody mid-order, so each is
// checked here on its own.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("services/auth", () => ({
  default: {
    SendOtp: vi.fn(),
    VerifyOtp: vi.fn(),
  },
}));

vi.mock("utils/gtag", () => ({
  GAevent: vi.fn(),
  pageview: vi.fn(),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  LogError: vi.fn(),
}));

vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  trackOrder: vi.fn(),
}));

vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  ChatConroller: vi.fn(),
  DisableScroll: vi.fn(),
  EnableScroll: vi.fn(),
}));

import AuthService from "services/auth";
import { useAppStore } from "store";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { ChatConroller, DisableScroll, EnableScroll } from "utils/tinyUtils";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";

import { resetDevice, setDevice } from "../../mocks/device";
import {
  restoreLocation,
  stubLocation,
  type LocationStub,
} from "../../mocks/location";
import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const verifyOtp = AuthService.VerifyOtp as unknown as ReturnType<typeof vi.fn>;
const track = trackOrder as unknown as ReturnType<typeof vi.fn>;
const openChat = ChatConroller as unknown as ReturnType<typeof vi.fn>;

const ACCOUNT_PHONE = "963991234567";
const EXPIRED_PHONE = "963997654321";

let location: LocationStub;
let fetched: ReturnType<typeof vi.fn>;

async function renderWidget(store: Record<string, unknown> = {}) {
  const user = userEvent.setup();
  const rendered = await renderWithProviders(<ConfirmMobilePhoneWidget />, {
    store,
  });
  return { ...rendered, user };
}

beforeEach(() => {
  setDevice("pointer");
  location = stubLocation();
  window.sessionStorage.clear();
  verifyOtp.mockReset();
  verifyOtp.mockResolvedValue({ ok: true });
  // The dismissal asks a route handler to clear the sub-service tokens. The
  // request is the behaviour under test, so it is recorded, never made.
  fetched = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetched);
});

afterEach(() => {
  vi.unstubAllGlobals();
  restoreLocation();
  resetDevice();
  vi.clearAllMocks();
});

describe("which number the shopper is asked to confirm", () => {
  it("uses the number on the account, and does not let it be changed", async () => {
    await renderWidget({
      userProfile: { id: 1, phone: `+${ACCOUNT_PHONE}` },
      shouldAuthinticated: true,
    });

    expect(
      screen.getByText(`+${ACCOUNT_PHONE}`),
      "the account's own number must be the one offered — asking a signed-in " +
        "shopper to type it again is a step for nothing",
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
      "and it must not be swappable: this widget confirms the account's " +
        "number, so an Edit here verifies somebody else's",
    ).not.toBeInTheDocument();
  });

  it("asks for a number when the account has none", async () => {
    await renderWidget({
      userProfile: { id: 1, phone: null },
      shouldAuthinticated: true,
    });

    expect(
      screen.getByText("Enter Your Phone Number Registered With Us"),
      "a guest has no number on file, so the flow has to start by asking",
    ).toBeInTheDocument();
  });

  it.each([
    [0, "a numeric zero"],
    ["0", "the string zero"],
  ])("treats %s (%s) as no number at all", async (phone, _description) => {
    await renderWidget({
      userProfile: { id: 1, phone },
      shouldAuthinticated: true,
    });

    expect(
      screen.getByText("Enter Your Phone Number Registered With Us"),
      "the backend uses zero to mean 'not set' — sending a code to it would " +
        "fail, and locking the shopper to it leaves them no way forward",
    ).toBeInTheDocument();
  });

  it("reuses the number of a session that expired", async () => {
    // /api/auth/expire has already swapped in a fresh guest, so the profile no
    // longer carries the number the shopper was signed in with.
    await renderWidget({
      userProfile: { id: 2, phone: null },
      shouldAuthinticated: "expired-login",
      expiredSessionPhone: EXPIRED_PHONE,
    });

    expect(
      screen.getByText(`+${EXPIRED_PHONE}`),
      "the shopper is signing back into the account they just lost — making " +
        "them retype the number is the app forgetting who they were",
    ).toBeInTheDocument();
  });

  it("does not hand that number to any other flow", async () => {
    await renderWidget({
      userProfile: { id: 2, phone: null },
      // Opened from the cart gate, not from a session that expired.
      shouldAuthinticated: true,
      expiredSessionPhone: EXPIRED_PHONE,
    });

    expect(
      screen.getByText("Enter Your Phone Number Registered With Us"),
      "a number left over from a dead session belongs to that sign-in only — " +
        "offering it elsewhere puts somebody else's number in front of a guest",
    ).toBeInTheDocument();
  });
});

describe("what the funnel is told", () => {
  it("records that the flow opened, and where from", async () => {
    await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: "open Story",
    });

    expect(
      track,
      "the funnel counts how many shoppers reach this gate and from which " +
        "flow — an unlabelled open cannot be told from a checkout one",
    ).toHaveBeenCalledWith(ORDER_EVENTS.VERIFY_FLOW_OPENED, {
      flow_source: "story",
    });
  });

  it("calls an unmarked open a checkout, because that is what raises it", async () => {
    await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
    });

    expect(
      track,
      "the cart gate is the flow that sets the plain marker; reporting it as " +
        "unknown would take the order funnel's biggest step off the chart",
    ).toHaveBeenCalledWith(ORDER_EVENTS.VERIFY_FLOW_OPENED, {
      flow_source: "checkout",
    });
  });

  it("stops the page behind the overlay scrolling", async () => {
    const { unmount } = await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
    });

    expect(
      DisableScroll,
      "the overlay covers the screen — a page scrolling underneath it moves " +
        "content the shopper cannot see or reach",
    ).toHaveBeenCalledTimes(1);

    // The tidy-up of the test BEFORE this one also unmounts a widget, and that
    // happens after this file's `afterEach` has cleared the spies — see the
    // note on `cleanup()` in tests/setup.ts. Count from here, not from zero.
    (EnableScroll as unknown as ReturnType<typeof vi.fn>).mockClear();

    unmount();
    expect(
      EnableScroll,
      "and the page must scroll again afterwards, or the whole app is frozen " +
        "once the widget has been up",
    ).toHaveBeenCalledTimes(1);
  });
});

describe("when the shopper finishes verifying", () => {
  /** Drive the real flow to the end: send a code, type it, land on success. */
  async function verifyThrough(store: Record<string, unknown>) {
    const sendOtp = AuthService.SendOtp as unknown as ReturnType<typeof vi.fn>;
    sendOtp.mockResolvedValue(undefined);
    const rendered = await renderWidget(store);

    await rendered.user.click(screen.getByRole("button", { name: /Send SMS/ }));
    await screen.findByText("Enter Verification Code Sent To Your SMS");
    const field = document.querySelector<HTMLInputElement>(
      '[data-pw="input-otp-field"]',
    )!;
    await rendered.user.type(field, "123456");
    return rendered;
  }

  it("takes the overlay down", async () => {
    await verifyThrough({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
    });

    await waitFor(
      () => {
        expect(
          useAppStore.getState().shouldAuthinticated,
          "the marker is what holds this overlay up — leaving it set keeps a " +
            "verified shopper staring at the screen they just finished",
        ).toBe(false);
      },
      { timeout: 2000 },
    );
  });

  it("reports a checkout shopper as returned to checkout", async () => {
    await verifyThrough({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
    });

    await waitFor(
      () => {
        expect(
          track,
          "this is the step that says the gate did not cost the order — " +
            "without it a completed verify looks the same as an abandoned one",
        ).toHaveBeenCalledWith(
          ORDER_EVENTS.VERIFY_COMPLETED_RETURNED_TO_CHECKOUT,
          { flow_source: "checkout" },
        );
      },
      { timeout: 2000 },
    );
  });

  it("opens the story composer for a shopper who came to post one", async () => {
    await verifyThrough({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: "open Story",
    });

    await waitFor(
      () => {
        expect(
          useAppStore.getState().addStoryEnable,
          "the shopper asked to post a story and was stopped to verify — " +
            "finishing has to put them back where they were going",
        ).toBe(true);
      },
      { timeout: 2000 },
    );
    expect(
      track,
      "and a story open is not a checkout return",
    ).not.toHaveBeenCalledWith(
      ORDER_EVENTS.VERIFY_COMPLETED_RETURNED_TO_CHECKOUT,
      expect.anything(),
    );
  });

  it("opens chat for a shopper who came to send a message", async () => {
    await verifyThrough({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: "open chat",
    });

    await waitFor(
      () => {
        expect(
          openChat,
          "same again for chat: the shopper was on their way somewhere and " +
            "must be taken there",
        ).toHaveBeenCalledWith(true);
      },
      { timeout: 2000 },
    );
  });

  it("forgets the number of the session that expired", async () => {
    await verifyThrough({
      userProfile: { id: 2, phone: null },
      shouldAuthinticated: "expired-login",
      expiredSessionPhone: EXPIRED_PHONE,
    });

    await waitFor(
      () => {
        expect(
          useAppStore.getState().expiredSessionPhone,
          "it was kept only to get the shopper back in — holding it after " +
            "that leaves one shopper's number waiting for the next one",
        ).toBeNull();
      },
      { timeout: 2000 },
    );
  });
});

describe("when the shopper walks away without verifying", () => {
  it("settles the requests that were waiting on them", async () => {
    const { user } = await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
      reAuthResult: "pending",
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      useAppStore.getState().reAuthResult,
      "anything parked waiting for this verify must be told it is not coming",
    ).toBe("cancelled");
    expect(
      useAppStore.getState().shouldAuthinticated,
      "and the overlay must come down",
    ).toBe(false);
  });

  it("clears the sub-service tokens it left behind", async () => {
    const { user } = await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: "open Story",
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      fetched,
      "the stories token was minted for a shopper who never finished — " +
        "leaving it set means the app still thinks they did",
    ).toHaveBeenCalledWith(
      "/api/auth/clear-tokens",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tokens: ["STORIES-TOKEN"] }),
        keepalive: true,
      }),
    );
  });

  it("does not clear them again after a session that expired", async () => {
    const { user } = await renderWidget({
      userProfile: { id: 2, phone: null },
      shouldAuthinticated: "expired-login",
      expiredSessionPhone: EXPIRED_PHONE,
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      fetched,
      "/api/auth/expire already cleared them and issued a fresh guest — " +
        "clearing again would throw away the new guest's tokens",
    ).not.toHaveBeenCalled();
  });

  it("reloads, so the page matches whatever token is now stored", async () => {
    const { user } = await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      location.reload,
      "the client state is stale the moment the shopper declines — rendering " +
        "on against it shows an account that is no longer signed in",
    ).toHaveBeenCalledTimes(1);
  });

  it("sends a shopper off the seller dashboard rather than reloading it", async () => {
    const { user } = await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: "seller",
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      location.href,
      "an unverified shopper has no dashboard — reloading it lands them on a " +
        "page that cannot load",
    ).toBe("/");
    expect(
      location.reload,
      "and the reload must not race the redirect",
    ).not.toHaveBeenCalled();
  });

  it("still leaves, even if the clean-up call throws", async () => {
    fetched.mockImplementation(() => {
      throw new Error("the network is gone");
    });
    const { user } = await renderWidget({
      userProfile: { id: 1, phone: ACCOUNT_PHONE },
      shouldAuthinticated: true,
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      location.reload,
      "the navigation is the one step that must happen — a failed clean-up " +
        "that swallows it traps the shopper under an overlay they cannot close",
    ).toHaveBeenCalledTimes(1);
  });
});
