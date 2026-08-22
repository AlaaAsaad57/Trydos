// The screen where the shopper types the code, and the two clocks it runs.
//
// It is the only screen with a decision of its own: when may another code be
// asked for, and when is the one already sent past typing. Those are different
// questions with different answers, and this file is mostly about keeping them
// apart — see the note on the component. The regression cases below all failed
// against the version that answered both from the send cooldown.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useState } from "react";

import { lockNumber } from "utils/otpLocks";
import EnterPinScreen from "components/Login/Enhanced/screens/EnterPinScreen";

import { resetDevice, setDevice } from "../../../../mocks/device";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../render";

const PHONE = "963991234567";

type ScreenProps = Partial<React.ComponentProps<typeof EnterPinScreen>>;

/** The screen does not hold the code it is shown — its host does. This stands
 *  in for that host so the boxes behave the way they do in the real flow. */
function Host(props: ScreenProps) {
  const [pin, setPin] = useState("");
  return (
    <EnterPinScreen
      phone={PHONE}
      method="sms"
      pin={pin}
      setPin={setPin}
      onSubmit={() => {}}
      {...props}
    />
  );
}

async function renderScreen(props: ScreenProps = {}) {
  const user = userEvent.setup();
  const rendered = await renderWithProviders(<Host {...props} />);
  return { ...rendered, user };
}

/** Six boxes are drawn; one hidden field is typed into. */
const codeField = () =>
  document.querySelector<HTMLInputElement>('[data-pw="input-otp-field"]')!;

beforeEach(() => {
  setDevice("pointer");
  window.sessionStorage.clear();
});

afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("a code sent to a number that armed no cooldown", () => {
  // `services/auth.SendOtp` skips the client lock for an allow-listed test
  // number, and `utils/otpLocks` keeps nothing at all when sessionStorage is
  // unavailable. Both land here: a real code was sent, and the guard is empty.

  it("lets the shopper type the code they were just sent", async () => {
    const onSubmit = vi.fn();
    const { user } = await renderScreen({ onSubmit });

    await user.type(codeField(), "123456");

    expect(
      onSubmit,
      "the code must reach the check. A screen that will not take it strands " +
        "a shopper holding a code that works, with nothing they can do",
    ).toHaveBeenCalledWith("123456");
  });

  it("does not claim the code expired the moment it arrives", async () => {
    await renderScreen();

    expect(
      screen.queryByText("The Code Sent Has Expired"),
      "the code was sent seconds ago — saying it has expired is both wrong " +
        "and the reason the shopper stops trying",
    ).not.toBeInTheDocument();
    expect(
      codeField(),
      "and the boxes must be usable, not only unlabelled as dead",
    ).toBeEnabled();
  });

  it("still offers another code, because nothing is holding the send back", async () => {
    await renderScreen({ onResend: vi.fn() });

    expect(
      screen.getByRole("button", { name: "Resend Code" }),
      "no cooldown is running, so asking for another code is allowed — that " +
        "much the old screen had right and it must not be lost",
    ).toBeInTheDocument();
  });
});

describe("the two clocks", () => {
  it("keeps the code typeable after the send cooldown runs out", async () => {
    // One second of cooldown, then it is spent — the same moment that used to
    // disable the boxes. The code itself is good for far longer.
    lockNumber(PHONE, 1);
    const onSubmit = vi.fn();
    const { user } = await renderScreen({ onSubmit, onResend: vi.fn() });

    await screen.findByRole(
      "button",
      { name: "Resend Code" },
      { timeout: 4000 },
    );

    expect(
      screen.queryByText("The Code Sent Has Expired"),
      "our send cooldown is a rate limit, not the life of the code — the code " +
        "does not die because we are willing to send another one",
    ).not.toBeInTheDocument();

    await user.type(codeField(), "123456");
    expect(
      onSubmit,
      "a code that is still good must still be accepted once the resend unlocks",
    ).toHaveBeenCalledWith("123456");
  });

  it("declares the code expired once its own life runs out", async () => {
    await renderScreen({ timerSeconds: 1 });

    expect(
      await screen.findByText("The Code Sent Has Expired", undefined, {
        timeout: 4000,
      }),
      "a code past its life must be called dead — dropping the notice with " +
        "the bug would leave a shopper retyping a code that cannot work",
    ).toBeInTheDocument();
    expect(
      codeField(),
      "and the boxes close, so the shopper asks for a new code instead of " +
        "spending attempts on a dead one",
    ).toBeDisabled();
  });

  it("gives a resent code a life of its own", async () => {
    const onSubmit = vi.fn();
    const { user } = await renderScreen({
      timerSeconds: 1,
      onResend: vi.fn(),
      onSubmit,
    });
    await screen.findByText("The Code Sent Has Expired", undefined, {
      timeout: 4000,
    });

    await user.click(screen.getByRole("button", { name: "Resend Code" }));

    expect(
      screen.queryByText("The Code Sent Has Expired"),
      "the new code is not the old one — carrying the old one's expiry over " +
        "would make every code after the first dead on arrival",
    ).not.toBeInTheDocument();

    await user.type(codeField(), "654321");
    expect(
      onSubmit,
      "and the code that just arrived must be typeable",
    ).toHaveBeenCalledWith("654321");
  });

  it("counts down to the resend while the cooldown runs", async () => {
    lockNumber(PHONE, 120);
    await renderScreen({ onResend: vi.fn() });

    expect(
      screen.getByText(/Resend After -/),
      "while the send is held back the shopper must see how long is left",
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Resend Code" }),
      "offering Resend inside the cooldown gives a button whose only outcome " +
        "is a refusal",
    ).not.toBeInTheDocument();
    expect(
      codeField(),
      "the code is at its freshest here — the boxes must be open",
    ).toBeEnabled();
  });
});

describe("what the screen says about the code", () => {
  it("names the way the code was sent", async () => {
    await renderScreen({ method: "whatsapp" });

    expect(
      screen.getByText("Enter Verification Code Sent To Your Whatsapp"),
      "a shopper watching the wrong app for a code needs to be told which one " +
        "it went to",
    ).toBeInTheDocument();
  });

  it("shows the number the code went to", async () => {
    await renderScreen();

    expect(
      screen.getByText(`+${PHONE}`),
      "the number must be on screen, or a code sent to a typo looks like a " +
        "delivery failure",
    ).toBeInTheDocument();
  });

  it("shows the reason a code was refused", async () => {
    await renderScreen({ error: "Please Enter The Correct Code Sent To Your Phone" });

    expect(
      screen.getByRole("alert"),
      "a refused code must say so in words, not only in the colour of the boxes",
    ).toHaveTextContent("Please Enter The Correct Code Sent To Your Phone");
  });

  it("holds the boxes closed while the code is being checked", async () => {
    await renderScreen({ loading: "verify-pin" });

    expect(
      codeField(),
      "a second submit while the first is in flight burns one of the " +
        "shopper's server-side attempts",
    ).toBeDisabled();
  });

  it("holds them closed once the code has been accepted", async () => {
    await renderScreen({ isValidPin: "valid" });

    expect(
      codeField(),
      "the shopper is through — further typing can only undo that",
    ).toBeDisabled();
  });
});

describe("asking for another code", () => {
  it("does not resend while the cooldown is still running", async () => {
    const onResend = vi.fn();
    // Offer the button, then close the window under it: the button is drawn
    // from state that ticks once a second, so it can outlive the cooldown's
    // start by up to a second.
    const { user } = await renderScreen({ onResend });
    await screen.findByRole("button", { name: "Resend Code" });
    lockNumber(PHONE, 120);

    await user.click(screen.getByRole("button", { name: "Resend Code" }));

    expect(
      onResend,
      "the handler re-reads the guard at the moment of the tap — without that " +
        "a stale button sends a request the limiter will refuse",
    ).not.toHaveBeenCalled();
  });

  it("clears the old code out of the boxes when a new one is asked for", async () => {
    const { user } = await renderScreen({ onResend: vi.fn() });
    await user.type(codeField(), "12345");

    await user.click(screen.getByRole("button", { name: "Resend Code" }));

    await waitFor(() => {
      expect(
        codeField(),
        "the old code is dead once a new one is on its way — leaving it in " +
          "the boxes invites a submit that spends an attempt",
      ).toHaveValue("");
    });
  });

  it("reports the cooldown running out, once", async () => {
    const onTimerExpired = vi.fn();
    lockNumber(PHONE, 1);
    await renderScreen({ onTimerExpired, onResend: vi.fn() });

    await screen.findByRole(
      "button",
      { name: "Resend Code" },
      { timeout: 4000 },
    );
    // Two more ticks of the same interval.
    await new Promise((resolve) => setTimeout(resolve, 2100));

    expect(
      onTimerExpired,
      "the funnel counts one expiry per code, not one per second the screen " +
        "stays open",
    ).toHaveBeenCalledTimes(1);
  });
});
