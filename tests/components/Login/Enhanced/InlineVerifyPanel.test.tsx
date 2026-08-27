// The verify flow squeezed into the cart footer's ~200px panel.
//
// It shares `usePhoneVerifyFlow` with the fullscreen flow (proven separately)
// and is built from the same input primitives, so what is left to prove here is
// what only this panel does: the two intro steps it owns, the fact that it
// never puts the in-app keypad up, and — the one that is easy to get wrong —
// telling a cooldown that means "your code is on its way" apart from one that
// means "we refused to send".
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

import AuthService from "services/auth";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { lockNumber, recordSessionNumber } from "utils/otpLocks";
import InlineVerifyPanel from "components/Login/Enhanced/InlineVerifyPanel";

import { resetDevice, setDevice } from "../../../mocks/device";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../render";

const sendOtp = AuthService.SendOtp as unknown as ReturnType<typeof vi.fn>;
const verifyOtp = AuthService.VerifyOtp as unknown as ReturnType<typeof vi.fn>;
const gaEvent = GAevent as unknown as ReturnType<typeof vi.fn>;

const PHONE = "963991234567";
const VERIFICATION_ID = "verification-id-from-the-send";

type PanelProps = Partial<React.ComponentProps<typeof InlineVerifyPanel>>;

async function renderPanel(props: PanelProps = {}) {
  const onSuccess = props.onSuccess ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();

  const user = userEvent.setup();
  const rendered = await renderWithProviders(
    <InlineVerifyPanel onSuccess={onSuccess} onClose={onClose} {...props} />,
    { store: { verficationID: VERIFICATION_ID } },
  );

  return { ...rendered, user, onSuccess, onClose };
}

const phoneField = () =>
  document.querySelector<HTMLInputElement>(
    '[data-pw="input-phone-number-field"]',
  );
const codeField = () =>
  document.querySelector<HTMLInputElement>('[data-pw="input-otp-field"]');

/** A send the backend accepted: it resolves, and mirrors the server's resend
 *  cooldown into the client guard the way `services/auth.SendOtp` does. */
const sendThatWorked = () => {
  sendOtp.mockImplementation(async () => {
    lockNumber(PHONE, 120);
    recordSessionNumber(PHONE);
  });
};

/** A send the limiter refused: it arms the very same cooldown, then throws. */
const sendThatWasRefused = () => {
  sendOtp.mockImplementation(async () => {
    lockNumber(PHONE, 120);
    throw new Error("Please wait before trying again");
  });
};

beforeEach(() => {
  // The panel passes `disableCustomKeypad`, so it takes the device keyboard on
  // any device. Standing it on a phone is therefore the honest default here,
  // and it is what the last block below checks.
  setDevice("touch");
  window.sessionStorage.clear();
  sendOtp.mockReset();
  sendOtp.mockResolvedValue(undefined);
  verifyOtp.mockReset();
  verifyOtp.mockResolvedValue({ ok: true });
});

afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("a shopper with no number on file", () => {
  it("asks first whether they already have an account", async () => {
    await renderPanel();

    expect(
      screen.getByRole("button", { name: "I Have Already Account" }),
      "the panel opens on the same choice the fullscreen login opens on",
    ).toBeInTheDocument();
    expect(
      phoneField(),
      "nothing is asked for until the shopper says which of the two they are",
    ).not.toBeInTheDocument();
  });

  it("takes an existing account straight to the number", async () => {
    const { user } = await renderPanel();

    await user.click(
      screen.getByRole("button", { name: "I Have Already Account" }),
    );

    expect(
      phoneField(),
      "somebody who already agreed to the terms must not be asked again",
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agree & Continue" }),
      "and must not be shown the terms step at all",
    ).not.toBeInTheDocument();
  });

  it("puts the terms in front of a new customer first", async () => {
    const { user } = await renderPanel();

    await user.click(screen.getByRole("button", { name: "New Customer" }));

    expect(
      screen.getByRole("button", { name: "Agree & Continue" }),
      "a new account is created here, so the terms must be accepted here — " +
        "the short panel is not a reason to skip them",
    ).toBeInTheDocument();
    expect(
      phoneField(),
      "and the number is not asked for until they are",
    ).not.toBeInTheDocument();
  });

  it("records the terms the same way the fullscreen signup does", async () => {
    const { user } = await renderPanel();

    await user.click(screen.getByRole("button", { name: "New Customer" }));
    await user.click(screen.getByRole("button", { name: "Agree & Continue" }));

    expect(
      gaEvent,
      "accepting the terms in the cart must be counted as accepting them, or " +
        "the signup funnel loses every shopper who started from the cart",
    ).toHaveBeenCalledWith({
      action: GA_EVENT_NAMES.TERMS_SERVICES,
      params: { mission: "signup", status: "terms_accepted" },
    });
    expect(
      phoneField(),
      "and accepting them moves the shopper on to the number",
    ).toBeInTheDocument();
  });
});

describe("a shopper whose account already owns a number", () => {
  it("skips the intro and opens on the method step", async () => {
    await renderPanel({ initialPhone: PHONE, phoneLocked: true });

    expect(
      screen.getByRole("button", { name: "Send SMS" }),
      "there is nothing to ask and nothing to agree to — the panel is one tap " +
        "from a code",
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "I Have Already Account" }),
      "asking an existing shopper whether they have an account is a step for " +
        "nothing",
    ).not.toBeInTheDocument();
  });

  it("offers no way to swap that number", async () => {
    await renderPanel({ initialPhone: PHONE, phoneLocked: true });

    expect(
      screen.queryByRole("button", { name: "Change Number" }),
      "the shopper must confirm the number the account owns, not one they " +
        "choose now",
    ).not.toBeInTheDocument();
  });

  it("lets a shopper who typed their own number go back and fix it", async () => {
    const { user } = await renderPanel();

    await user.click(
      screen.getByRole("button", { name: "I Have Already Account" }),
    );
    await user.type(phoneField()!, PHONE);
    await user.click(screen.getByRole("button", { name: "Send phone number" }));
    await user.click(screen.getByRole("button", { name: "Change Number" }));

    expect(
      phoneField(),
      "a number the shopper typed is theirs to correct — a typo must not cost " +
        "them the whole panel",
    ).toBeInTheDocument();
  });
});

describe("sending the code", () => {
  it("sends on the method that was tapped", async () => {
    const { user } = await renderPanel({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: "Send WhatsApp" }));

    expect(
      sendOtp,
      "tapping WhatsApp must send on WhatsApp (flag 1), not on SMS",
    ).toHaveBeenCalledWith(PHONE, 1, expect.any(Function));
  });

  it("shows the code boxes once a code is on its way", async () => {
    sendThatWorked();
    const { user } = await renderPanel({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: "Send SMS" }));

    expect(
      await waitFor(() => codeField()),
      "the panel is one screen — after a send it must become somewhere to " +
        "type the code",
    ).toBeInTheDocument();
  });

  it("stops both methods while the number is on cooldown", async () => {
    lockNumber(PHONE, 90);
    await renderPanel({ initialPhone: PHONE, phoneLocked: true });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Send SMS" }),
        "a send inside the cooldown would only be refused",
      ).toBeDisabled();
    });
    expect(
      screen.getByRole("button", { name: "Send WhatsApp" }),
      "the cooldown is per number, so the other method is no way around it",
    ).toBeDisabled();
  });

  it("says when the session has used its allowance of numbers", async () => {
    recordSessionNumber("963991111111");
    recordSessionNumber("963992222222");
    await renderPanel({ initialPhone: PHONE, phoneLocked: true });

    expect(
      await screen.findByText("Session limit reached. Try again later."),
      "the cap has no countdown to show, so it must say what it is in words",
    ).toBeInTheDocument();
  });
});

describe("what a running cooldown is telling the shopper", () => {
  // A successful send arms the same per-number cooldown a refused one does.
  // Reading the cooldown alone therefore cannot say which happened, and getting
  // it wrong puts a red "we would not send it" line under the boxes a code was
  // just sent to.

  it("reads as 'your code is coming' after a send that worked", async () => {
    sendThatWorked();
    const { user } = await renderPanel({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: "Send SMS" }));

    expect(
      await screen.findByText(/Resend After -/),
      "the code went out — the cooldown left is the wait before another one, " +
        "and must be said that way",
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/before trying again/),
      "telling a shopper we refused the send, under the boxes holding the " +
        "code we just sent them, is the panel contradicting itself",
    ).not.toBeInTheDocument();
  });

  it("reads as 'we would not send it' after a send that was refused", async () => {
    sendThatWasRefused();
    const { user } = await renderPanel({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: "Send SMS" }));

    expect(
      await screen.findByText(/before trying again/),
      "no code is coming, so the wait must be stated as the refusal it is",
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Resend After -/),
      "there is nothing to resend — the shopper has no code",
    ).not.toBeInTheDocument();
  });

  it("does not carry one number's refusal over to another", async () => {
    sendThatWasRefused();
    const { user } = await renderPanel();

    await user.click(
      screen.getByRole("button", { name: "I Have Already Account" }),
    );
    await user.type(phoneField()!, PHONE);
    await user.click(screen.getByRole("button", { name: "Send phone number" }));
    await user.click(screen.getByRole("button", { name: "Send SMS" }));
    await screen.findByText(/before trying again/);

    // A refusal is against the number, not against the shopper. Another number
    // carries its own cooldown and starts clean.
    await user.click(screen.getByRole("button", { name: "Change Number" }));
    await user.clear(phoneField()!);
    await user.type(phoneField()!, "963997654321");

    await waitFor(() => {
      expect(
        screen.queryByText(/before trying again/),
        "holding the first number's refusal against the second stops a " +
          "shopper who simply mistyped their number",
      ).not.toBeInTheDocument();
    });
  });
});

describe("entering the code", () => {
  async function atCodeStep() {
    sendThatWorked();
    const panel = await renderPanel({ initialPhone: PHONE, phoneLocked: true });
    await panel.user.click(screen.getByRole("button", { name: "Send SMS" }));
    await waitFor(() => expect(codeField()).toBeInTheDocument());
    return panel;
  }

  it("checks the code against the id the send returned", async () => {
    const { user } = await atCodeStep();

    await user.type(codeField()!, "123456");

    await waitFor(() => {
      expect(
        verifyOtp,
        "the code must be checked against the verification id the send stored " +
          "— with the wrong id a correct code is refused",
      ).toHaveBeenCalledWith("123456", VERIFICATION_ID);
    });
  });

  it("tells the cart once the shopper is verified", async () => {
    const { user, onSuccess } = await atCodeStep();

    await user.type(codeField()!, "123456");

    await waitFor(
      () => {
        expect(
          onSuccess,
          "this is what lets the order carry on — without it the shopper is " +
            "verified and the cart still asks them to verify",
        ).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it("holds the resend closed while the cooldown runs", async () => {
    await atCodeStep();

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "Resend Code" }),
          "a resend inside the cooldown would only be refused, so the button " +
            "must stop being tappable",
        ).toBeDisabled();
      },
      { timeout: 3000 },
    );
  });

  it("sends nothing when the resend is tapped inside the cooldown", async () => {
    // The panel re-reads the guard once a second, so the button can still be
    // live for up to a second after the send that locked it.
    const { user } = await atCodeStep();

    await user.click(screen.getByRole("button", { name: "Resend Code" }));

    expect(
      sendOtp,
      "the send itself re-reads the guard, so a stale button costs the " +
        "shopper nothing — one send is all that happened",
    ).toHaveBeenCalledTimes(1);
  });

  it("says why a code was refused", async () => {
    const { user } = await atCodeStep();
    verifyOtp.mockRejectedValue(new Error("Wrong Code"));

    await user.type(codeField()!, "000000");

    expect(
      await screen.findByRole("alert"),
      "a refused code must say so in words — the boxes changing colour is not " +
        "a reason the shopper can act on",
    ).toHaveTextContent("Please Enter The Correct Code Sent To Your Phone");
  });

  it("still says why a code was refused once the resend cooldown is running", async () => {
    // A *successful* send arms the same 120-second per-number cooldown a refused
    // one does, and the panel re-reads that guard once a second. So about a
    // second after the code arrives, the cooldown is running for every shopper —
    // this is the ordinary case, not an edge one. The test above happens to run
    // inside the gap before the first tick, which is why it passes on a quiet
    // machine and fails on a loaded one.
    const { user } = await atCodeStep();
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "Resend Code" }),
          "the cooldown has not reached the panel yet, so this case is not " +
            "testing what it claims to",
        ).toBeDisabled();
      },
      { timeout: 2000 },
    );

    verifyOtp.mockRejectedValue(new Error("Wrong Code"));
    await user.type(codeField()!, "000000");

    expect(
      await screen.findByRole("alert", {}, { timeout: 2000 }),
      "a wrong code must say so in words while the resend is on cooldown too — " +
        "not being allowed to resend yet is no reason to hide why the code was " +
        "refused",
    ).toHaveTextContent("Please Enter The Correct Code Sent To Your Phone");
  });
});

describe("on a phone", () => {
  it("uses the device's own keyboard, never the in-app keypad", async () => {
    const { user } = await renderPanel({
      initialPhone: PHONE,
      phoneLocked: true,
    });
    sendThatWorked();

    await user.click(screen.getByRole("button", { name: "Send SMS" }));
    await waitFor(() => expect(codeField()).toBeInTheDocument());

    expect(
      document.querySelector('[data-pw="keypad-digit-1"]'),
      "the in-app keypad is fixed to the bottom of the screen and would cover " +
        "this whole panel — the shopper would be typing into something they " +
        "cannot see",
    ).not.toBeInTheDocument();
    expect(
      codeField(),
      "so there has to be a real field for the device keyboard to fill",
    ).toBeInTheDocument();
  });
});

describe("closing the panel", () => {
  it("hands the close back to the cart", async () => {
    const { user, onClose } = await renderPanel();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      onClose,
      "the panel lives inside the cart's own button — only the cart can take " +
        "it down",
    ).toHaveBeenCalledTimes(1);
  });
});
