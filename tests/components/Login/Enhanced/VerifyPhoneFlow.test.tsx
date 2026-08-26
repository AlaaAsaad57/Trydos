// The fullscreen phone → method → code journey, driven the way a shopper drives
// it: typing into the number field, tapping a method, typing six digits.
//
// The hook underneath is proven separately (usePhoneVerifyFlow.test.tsx). What
// this file proves is the wiring the hook cannot see — that each screen is
// handed the state it needs, that a step change puts the right screen up, and
// that a number the account already owns cannot be swapped for another one.
//
// Real: the three screens, both input primitives, `utils/otpLocks`, the store,
// the translations. Stood in: `services/auth` (the network), `utils/gtag`,
// `LogError`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("services/auth", () => ({
  default: {
    SendOtp: vi.fn(),
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
import { lockNumber, recordSessionNumber } from "utils/otpLocks";
import VerifyPhoneFlow from "components/Login/Enhanced/VerifyPhoneFlow";

import { resetDevice, setDevice } from "../../../mocks/device";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
  within,
} from "../../../render";

const sendOtp = AuthService.SendOtp as unknown as ReturnType<typeof vi.fn>;

const PHONE = "963991234567";
const VERIFICATION_ID = "verification-id-from-the-send";

type FlowProps = Partial<React.ComponentProps<typeof VerifyPhoneFlow>>;

async function renderFlow(props: FlowProps = {}) {
  const verify = props.verify ?? vi.fn(async () => ({ ok: true }));
  const onSuccess = props.onSuccess ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();

  const user = userEvent.setup();
  const rendered = await renderWithProviders(
    <VerifyPhoneFlow
      verify={verify}
      onSuccess={onSuccess}
      onClose={onClose}
      {...props}
    />,
    { store: { verficationID: VERIFICATION_ID } },
  );

  return { ...rendered, user, verify, onSuccess, onClose };
}

/** The number field is visually hidden, so it has no accessible name to ask
 *  for. It is the field the screen types into, and the send arrow only appears
 *  once what is in it is a whole number. */
const phoneField = () =>
  document.querySelector<HTMLInputElement>(
    '[data-pw="input-phone-number-field"]',
  )!;

/** Same for the code field: six boxes are drawn, one hidden field is typed into. */
const codeField = () =>
  document.querySelector<HTMLInputElement>('[data-pw="input-otp-field"]')!;

beforeEach(() => {
  // These cases are the desk interface: a real field, typed into with a real
  // keyboard. The phone interface is a different set of controls and gets its
  // own block at the end of this file.
  setDevice("pointer");
  window.sessionStorage.clear();
  sendOtp.mockReset();
  sendOtp.mockResolvedValue(undefined);
});

afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("a shopper confirming a number they typed", () => {
  it("opens on the number step", async () => {
    await renderFlow();

    expect(
      screen.getByRole("heading", { name: "Verify Your Number !" }),
      "a flow opened to confirm a number must say so — the login heading here " +
        "tells an already signed-in shopper they are signed out",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter Your Phone Number Registered With Us"),
      "the number step must be the one on screen",
    ).toBeInTheDocument();
  });

  it("offers no way to send until the number is whole", async () => {
    const { user } = await renderFlow();

    await user.type(phoneField(), "96399");

    expect(
      screen.queryByRole("button", { name: "Send phone number" }),
      "half a number must not be sendable — the backend refuses it and the " +
        "shopper spends an attempt finding out",
    ).not.toBeInTheDocument();
  });

  it("takes a whole number to the method step", async () => {
    const { user } = await renderFlow();

    await user.type(phoneField(), PHONE);
    await user.click(screen.getByRole("button", { name: "Send phone number" }));

    expect(
      await screen.findByText("Choose Verification Method"),
      "a whole number must move the shopper on to choosing how the code arrives",
    ).toBeInTheDocument();
    expect(
      sendOtp,
      "the number step must send nothing — the code goes out only once a " +
        "method is chosen",
    ).not.toHaveBeenCalled();
  });

  it("carries the number it was given on to the method step", async () => {
    const { user } = await renderFlow();

    await user.type(phoneField(), PHONE);
    await user.click(screen.getByRole("button", { name: "Send phone number" }));

    expect(
      await screen.findByText(`+${PHONE}`),
      "the shopper must see which number the code is going to before they " +
        "send it, or a typo costs a full cooldown to find",
    ).toBeInTheDocument();
  });

  it("lets the shopper go back and correct the number", async () => {
    const { user } = await renderFlow();

    await user.type(phoneField(), PHONE);
    await user.click(screen.getByRole("button", { name: "Send phone number" }));
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(
      await screen.findByText("Enter Your Phone Number Registered With Us"),
      "Edit must return the shopper to the number step",
    ).toBeInTheDocument();
    expect(
      phoneField(),
      "the number must still be there to correct, not cleared to blank",
    ).toHaveValue(PHONE);
  });
});

describe("a shopper confirming a number the account already owns", () => {
  it("opens straight on the method step", async () => {
    await renderFlow({ initialPhone: `+${PHONE}`, phoneLocked: true });

    expect(
      screen.getByText("Choose Verification Method"),
      "there is nothing to type — a locked number goes straight to choosing " +
        "how the code arrives",
    ).toBeInTheDocument();
    expect(
      screen.getByText(`+${PHONE}`),
      "the stored number must be shown as bare digits behind one plus, not " +
        "as the '++963…' a raw stored value would print",
    ).toBeInTheDocument();
  });

  it("offers no way to swap the number", async () => {
    await renderFlow({ initialPhone: PHONE, phoneLocked: true });

    expect(
      screen.queryByRole("button", { name: "Edit" }),
      "the shopper must confirm the number the account owns — an Edit here " +
        "lets them verify somebody else's number instead",
    ).not.toBeInTheDocument();
  });

  it("offers no way to swap the number from the code step either", async () => {
    const { user } = await renderFlow({ initialPhone: PHONE, phoneLocked: true });

    await user.click(screen.getByRole("button", { name: /Send SMS/ }));
    await screen.findByText(/Enter Verification Code Sent To Your/);

    expect(
      screen.queryByRole("button", { name: "Change Number" }),
      "the same rule holds one step later — the code step must not offer a " +
        "way back to a different number",
    ).not.toBeInTheDocument();
  });
});

describe("choosing how the code arrives", () => {
  it("sends on WhatsApp and shows the code step", async () => {
    const { user } = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: /Send WhatsApp/ }));

    expect(
      sendOtp,
      "tapping WhatsApp must send on WhatsApp (flag 1), not on SMS",
    ).toHaveBeenCalledWith(PHONE, 1, expect.any(Function));
    expect(
      await screen.findByText("Enter Verification Code Sent To Your Whatsapp"),
      "the code step must name the way the code was actually sent, so a " +
        "shopper watching the wrong app knows to look elsewhere",
    ).toBeInTheDocument();
  });

  it("sends by SMS and says so", async () => {
    const { user } = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: /Send SMS/ }));

    expect(
      sendOtp,
      "tapping SMS must send by SMS (flag 0)",
    ).toHaveBeenCalledWith(PHONE, 0, expect.any(Function));
    expect(
      await screen.findByText("Enter Verification Code Sent To Your SMS"),
      "the code step must name SMS as the way the code was sent",
    ).toBeInTheDocument();
  });

  it("says why nothing happened when the send is refused", async () => {
    sendOtp.mockRejectedValue(new Error("This number is not registered"));
    const { user } = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: /Send SMS/ }));

    expect(
      await screen.findByRole("alert"),
      "a refused send must put the reason on screen — a tap that does nothing " +
        "and says nothing reads as a broken button",
    ).toHaveTextContent("This number is not registered");
    expect(
      screen.getByText("Choose Verification Method"),
      "a refused send must leave the shopper on the method step, not on a " +
        "code step with no code sent",
    ).toBeInTheDocument();
  });

  it("shows a countdown and stops both methods while the number is on cooldown", async () => {
    lockNumber(PHONE, 90);
    await renderFlow({ initialPhone: PHONE, phoneLocked: true });

    expect(
      await screen.findByText(/before trying again/),
      "a shopper inside the cooldown must be told how long is left, not left " +
        "tapping a button that will be refused",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send SMS/ }),
      "the SMS button must be unusable while the cooldown runs",
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Send WhatsApp/ }),
      "the WhatsApp button must be unusable too — the cooldown is per number, " +
        "not per method",
    ).toBeDisabled();
  });

  it("says the session ran out of numbers once the allowance is used", async () => {
    recordSessionNumber("963991111111");
    recordSessionNumber("963992222222");
    await renderFlow({ initialPhone: PHONE, phoneLocked: true });

    expect(
      await screen.findByText("Session limit reached. Try again later."),
      "a shopper stopped by the per-session number cap must be told that is " +
        "why, not shown an empty countdown",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send SMS/ }),
      "the cap must stop the send, not only describe it",
    ).toBeDisabled();
  });
});

describe("entering the code", () => {
  beforeEach(() => {
    // What `services/auth.SendOtp` does after a send the backend accepted: it
    // mirrors the server's resend cooldown into the client guard. The screens
    // read that guard, so a stand-in that skips it does not describe a shopper
    // who was actually sent a code — see the note above `atCodeStep`.
    sendOtp.mockImplementation(async () => {
      lockNumber(PHONE, 120);
      recordSessionNumber(PHONE);
    });
  });

  async function atCodeStep(props: FlowProps = {}) {
    const flow = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      ...props,
    });
    await flow.user.click(screen.getByRole("button", { name: /Send SMS/ }));
    await screen.findByText("Enter Verification Code Sent To Your SMS");
    return flow;
  }

  it("draws one box per digit of the code", async () => {
    await atCodeStep();

    expect(
      document.querySelectorAll('[data-pw^="otp-digit-"]'),
      "the code is six digits and the screen must show six boxes, or the " +
        "shopper stops typing early",
    ).toHaveLength(6);
  });

  it("checks the code as soon as the last digit lands", async () => {
    const verify = vi.fn(async () => ({ ok: true }));
    const { user } = await atCodeStep({ verify });

    await user.type(codeField(), "123456");

    await waitFor(() => {
      expect(
        verify,
        "the code must be checked against the id the send returned — with the " +
          "wrong id a correct code is refused",
      ).toHaveBeenCalledWith("123456", VERIFICATION_ID);
    });
  });

  it("tells the host once the shopper is through", async () => {
    const outcome = { user: { id: 7 } };
    const onSuccess = vi.fn();
    const { user } = await atCodeStep({
      verify: vi.fn(async () => outcome),
      onSuccess,
    });

    await user.type(codeField(), "123456");

    await waitFor(
      () => {
        expect(
          onSuccess,
          "this callback is the only signal the host gets — without it the " +
            "shopper is verified and the app carries on as if they were not",
        ).toHaveBeenCalledWith(outcome);
      },
      { timeout: 2000 },
    );
  });

  it("says a wrong code was wrong", async () => {
    const { user } = await atCodeStep({
      verify: vi.fn(async () => {
        throw new Error("Wrong Code");
      }),
    });

    await user.type(codeField(), "000000");

    expect(
      await screen.findByRole("alert"),
      "a refused code must say so in words — the shopper cannot tell a wrong " +
        "code from a dead screen otherwise",
    ).toHaveTextContent("Please Enter The Correct Code Sent To Your Phone");
  });

  it("counts down to the resend rather than offering it at once", async () => {
    await atCodeStep();

    expect(
      await screen.findByText(/Resend After -/),
      "a code has just gone out — the resend must be behind the same cooldown " +
        "the server armed, shown as a countdown",
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Resend Code" }),
      "offering Resend inside the cooldown gives the shopper a button whose " +
        "only outcome is a refusal",
    ).not.toBeInTheDocument();
  });

  it("offers the resend once the cooldown runs out", async () => {
    sendOtp.mockImplementation(async () => {
      lockNumber(PHONE, 1);
      recordSessionNumber(PHONE);
    });
    await atCodeStep();

    expect(
      // The screen re-reads the guard once a second, so this is the real wait a
      // shopper does, shortened to one second.
      await screen.findByRole("button", { name: "Resend Code" }, { timeout: 4000 }),
      "once the cooldown is spent the shopper must be able to ask for another " +
        "code, or a code that never arrived is the end of the road",
    ).toBeInTheDocument();
  });

  it("goes back to the method step to change how the code arrives", async () => {
    // The three ways out of the code step — resend, change number, change
    // method — are all offered together, and only once the cooldown is spent.
    sendOtp.mockImplementation(async () => {
      lockNumber(PHONE, 1);
      recordSessionNumber(PHONE);
    });
    const { user } = await atCodeStep();

    await user.click(
      await screen.findByRole("button", { name: "Method" }, { timeout: 4000 }),
    );

    expect(
      await screen.findByText("Choose Verification Method"),
      "a code that never arrives by SMS must be reachable by WhatsApp without " +
        "starting the flow again",
    ).toBeInTheDocument();
  });
});

describe("a shopper whose send left no cooldown behind", () => {
  // `services/auth.SendOtp` arms the client cooldown from the server's reply —
  // but not for an allow-listed test number, and not at all when the browser
  // will not give `utils/otpLocks` any storage. The code is real either way,
  // and it has to be typeable. This whole journey used to end at a code step
  // that opened saying the code had expired, with the boxes shut.
  it("can type the code and get through", async () => {
    const outcome = { user: { id: 7 } };
    const verify = vi.fn(async () => outcome);
    const onSuccess = vi.fn();
    // The send resolves and arms nothing — the default stand-in in this file.
    const { user } = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      verify,
      onSuccess,
    });

    await user.click(screen.getByRole("button", { name: /Send SMS/ }));
    await screen.findByText("Enter Verification Code Sent To Your SMS");

    expect(
      screen.queryByText("The Code Sent Has Expired"),
      "the code went out a second ago — a screen that calls it expired sends " +
        "the shopper away from a code that works",
    ).not.toBeInTheDocument();

    await user.type(codeField(), "123456");

    await waitFor(
      () => {
        expect(
          onSuccess,
          "the shopper must reach the end of the flow, not be stopped at the " +
            "last step by a clock that was never about their code",
        ).toHaveBeenCalledWith(outcome);
      },
      { timeout: 2000 },
    );
  });
});

describe("closing the flow", () => {
  it("can be closed from the number step", async () => {
    const { user, onClose } = await renderFlow();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      onClose,
      "a shopper who opened this by accident must be able to leave the number step",
    ).toHaveBeenCalledTimes(1);
  });

  it("can be closed from the method step", async () => {
    const { user, onClose } = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      onClose,
      "the method step must be closable too — it is where a locked-number " +
        "flow opens",
    ).toHaveBeenCalledTimes(1);
  });

  it("can be closed from the code step", async () => {
    const { user, onClose } = await renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
    });

    await user.click(screen.getByRole("button", { name: /Send SMS/ }));
    await screen.findByText("Enter Verification Code Sent To Your SMS");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      onClose,
      "a shopper whose code never arrives must be able to leave the code step",
    ).toHaveBeenCalledTimes(1);
  });
});

describe("in a right-to-left language", () => {
  it("shows the number step in Arabic", async () => {
    const dictionary = (
      await import("public/translations/translations.ar.js")
    ).default as Record<string, string>;

    const user = userEvent.setup();
    await renderWithProviders(
      <VerifyPhoneFlow
        verify={vi.fn()}
        onSuccess={vi.fn()}
        onClose={vi.fn()}
        lang="ar"
      />,
      { language: "ar", store: { verficationID: VERIFICATION_ID } },
    );

    expect(
      screen.getByRole("heading", {
        name: dictionary["Verify Your Number !"],
      }),
      "the heading must come from the Arabic file — an English heading here is " +
        "the whole screen's first line",
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        dictionary["Enter Your Phone Number Registered With Us"],
      ),
      "the instruction under the heading must be translated too",
    ).toBeInTheDocument();

    // The number itself is never mirrored: it is dialled, not read as prose.
    await user.type(phoneField(), PHONE);
    await user.click(
      screen.getByRole("button", {
        name: dictionary["Send phone number"] ?? "Send phone number",
      }),
    );

    const shown = await screen.findByText(`+${PHONE}`);
    expect(
      within(shown).queryByText(/[٠-٩]/),
      "the dialled number must stay in Western digits — an Arabic-digit " +
        "number is not the number the backend was given",
    ).not.toBeInTheDocument();
  });
});
