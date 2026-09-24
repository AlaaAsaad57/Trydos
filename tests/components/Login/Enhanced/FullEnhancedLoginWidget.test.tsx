// The login / signup widget, and only the three-try cap on the code step.
//
// This is not a suite for the whole widget. It exists because the widget keeps
// its OWN copy of the attempt counter — it is not built on `usePhoneVerifyFlow`
// — so proving the hook proves nothing here. Without this file the cap on the
// busiest of the three code screens would ship unguarded.
//
// Real: the widget, its screens, both input primitives, `utils/otpLocks`, the
// store, the translations. Stood in: `services/auth` (the network),
// `utils/gtag`, `LogError`, and four modules the cap has nothing to do with —
// see the mock notes below.
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("services/auth", () => ({
  default: {
    SendOtp: vi.fn(),
    VerifyOtp: vi.fn(),
    UpdateName: vi.fn(),
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

// The scaled canvas writes hardcoded element ids and `:root` variables and
// allows only one instance. Nothing here is about layout, and no other test
// mounts it, so it is stood in for rather than exercised for the first time in
// a file about counting.
vi.mock("scaling/Page", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Called on the success path only; this file never reaches it.
vi.mock("serverRequests", () => ({
  fetchStoriesForUser: vi.fn(async () => []),
}));

// A static import that pulls in the whole `qrcode` package. The QR screen has
// its own test; here it is two buttons, so the widget's QR hand-offs (approved,
// back) can be pressed.
vi.mock("components/Login/Enhanced/screens/QrLoginScreen", () => ({
  default: ({ onApproved, onBack }: { onApproved: () => void; onBack: () => void }) => (
    <div>
      <button onClick={onApproved}>qr approved</button>
      <button onClick={onBack}>qr back</button>
    </div>
  ),
}));

// The screens slide in and out under `AnimatePresence mode="wait"`, which holds
// the next screen back until the current one has finished leaving. Nothing
// finishes leaving in jsdom, so without this stand-in the walk to the code step
// stops on the first screen. Swapped for plain elements: this file is about
// counting, not motion.
vi.mock("framer-motion", () => {
  // Cached per tag, and this is not an optimisation. A proxy that built a new
  // function on every property read would hand React a different component type
  // each render, so the whole screen would unmount and remount between
  // keystrokes — the number field would keep only the first digit typed into it.
  const stubs = new Map<string, React.ComponentType<Record<string, unknown>>>();
  const stubFor = (tag: string) => {
    if (!stubs.has(tag)) {
      stubs.set(tag, function MotionStub({
        children,
        ...props
      }: Record<string, unknown> & { children?: React.ReactNode }) {
        const {
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          custom: _custom,
          variants: _variants,
          whileTap: _whileTap,
          whileHover: _whileHover,
          ...rest
        } = props;
        return React.createElement(tag, rest, children);
      });
    }
    return stubs.get(tag)!;
  };
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy({}, { get: (_target, tag: string) => stubFor(tag) }),
  };
});

import AuthService from "services/auth";
import { fetchStoriesForUser } from "serverRequests";
import { useAppStore } from "store";
import { LogError } from "utils/functions";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { lockNumber, recordSessionNumber } from "utils/otpLocks";
import FullEnhancedLoginWidget from "components/Login/Enhanced/FullEnhancedLoginWidget";

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

const phoneField = () =>
  document.querySelector<HTMLInputElement>(
    '[data-pw="input-phone-number-field"]',
  )!;

const codeField = () =>
  document.querySelector<HTMLInputElement>('[data-pw="input-otp-field"]')!;

/** The widget renders nothing unless the store says the modal is open, and it
 *  opens on its own first screen — so every case walks the same road to the
 *  code step. Written once here rather than three times below. */
async function atCodeStep() {
  const user = userEvent.setup();
  await renderWithProviders(<FullEnhancedLoginWidget />, {
    // The widget reads the country out of the route, and the number field only
    // offers its send arrow for a number valid in that country. The harness
    // defaults to `gb`, which would reject the Syrian test number and leave the
    // walk stuck on the number screen.
    country: "sy",
    store: { loginOpen: true, verficationID: VERIFICATION_ID },
  });

  await user.click(await screen.findByText("I Have Already Account"));
  await user.type(phoneField(), PHONE);
  await user.click(
    await screen.findByRole("button", { name: "Send phone number" }),
  );
  await screen.findByText("Choose Verification Method");
  await user.click(
    document.querySelector<HTMLButtonElement>('[data-pw="sms-receive-otp"]')!,
  );
  await waitFor(() => expect(codeField()).toBeInTheDocument());

  return { user };
}

/** Type one code, and wait for it to have reached the check. Clearing first is
 *  not tidiness: the field reports a finished code on EVERY keystroke once six
 *  digits are already in it, so typing over the last code spends several tries
 *  at once — the boxes would lock after two codes and a case that only checked
 *  the final state would still pass. */
async function typeCode(
  user: ReturnType<typeof userEvent.setup>,
  code: string,
  expectedChecks: number,
) {
  await user.clear(codeField());
  await user.type(codeField(), code);
  await waitFor(() =>
    expect(
      verifyOtp,
      "each typed code must reach the check exactly once",
    ).toHaveBeenCalledTimes(expectedChecks),
  );
}

beforeEach(() => {
  setDevice("pointer");
  window.sessionStorage.clear();
  sendOtp.mockReset();
  // What a send the backend accepted leaves behind.
  sendOtp.mockImplementation(async () => {
    lockNumber(PHONE, 120);
    recordSessionNumber(PHONE);
  });
  verifyOtp.mockReset();
});

afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("the three-try cap on the login and signup screen", () => {
  it("locks the boxes after three wrong codes", async () => {
    verifyOtp.mockRejectedValue(new Error("Wrong Code"));
    const { user } = await atCodeStep();

    await typeCode(user, "000000", 1);
    await typeCode(user, "000000", 2);
    await typeCode(user, "000000", 3);

    expect(
      verifyOtp,
      "three typed codes must cost exactly three checks — any more means the " +
        "boxes locked after fewer codes than the shopper actually typed",
    ).toHaveBeenCalledTimes(3);
    await waitFor(() =>
      expect(
        codeField(),
        "after the third wrong code this screen must stop taking input",
      ).toBeDisabled(),
    );
  });

  it("says how many tries are left, then says the tries ran out", async () => {
    verifyOtp.mockRejectedValue(new Error("Wrong Code"));
    const { user } = await atCodeStep();

    await typeCode(user, "000000", 1);
    expect(
      await screen.findByText(/Tries left: 2/),
      "this widget builds its own message and does not share the hook's — a " +
        "screen that locks silently tells the shopper nothing",
    ).toBeInTheDocument();

    await typeCode(user, "000000", 2);
    expect(
      await screen.findByText(/Tries left: 1/),
      "the count must go down; a count stuck at two means the message is built " +
        "from a stale value and the cap is really four codes",
    ).toBeInTheDocument();

    await typeCode(user, "000000", 3);
    expect(
      await screen.findByText("Too many wrong codes. Ask for a new code."),
      "the third wrong code must replace the wording rather than offer a " +
        "count of zero tries",
    ).toBeInTheDocument();
  });

  it("does not spend a try when the number has no account", async () => {
    // The digits were right; the account simply does not exist, and the shopper
    // is taken off this screen. Counting it would arm the cap on a screen
    // nobody is looking at.
    verifyOtp.mockRejectedValue(new Error("user not found"));
    const { user } = await atCodeStep();

    await typeCode(user, "123456", 1);

    expect(
      await screen.findByText("Not Registered !"),
      "a number with no account belongs on its own screen, not on a wrong-code " +
        "retry",
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Tries left/),
      "and it must not be counted as a wrong code — the shopper typed the " +
        "right digits",
    ).toBeNull();
  });

  it("keeps the analytics attempt count separate from the cap", async () => {
    verifyOtp.mockRejectedValue(new Error("Wrong Code"));
    const { user } = await atCodeStep();

    await typeCode(user, "000000", 1);

    const verifyEvent = gaEvent.mock.calls
      .map(([payload]: [{ action: string; params: { attempts?: number } }]) => payload)
      .filter((payload) => payload.action === GA_EVENT_NAMES.VERIFY_OTP)
      .at(-1);

    expect(
      verifyEvent?.params.attempts,
      "the reported attempts must keep counting every check, not the wrong " +
        "codes the cap counts — repointing it at the cap changes what this " +
        "event has always meant with no error anywhere",
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// The rest of the widget: every screen it moves between, and what each hand-off
// sends to analytics and to the auth service. `SendOtp` here arms NO cooldown
// unless a case says so, so the resend and change links are on screen at once.
// ---------------------------------------------------------------------------

const updateName = AuthService.UpdateName as unknown as ReturnType<typeof vi.fn>;
const fetchStories = fetchStoriesForUser as unknown as ReturnType<typeof vi.fn>;
const logError = LogError as unknown as ReturnType<typeof vi.fn>;
const pw = (id: string) => document.querySelector<HTMLElement>(`[data-pw="${id}"]`)!;
const actions = () =>
  gaEvent.mock.calls.map(([payload]: [{ action: string }]) => payload.action);
const isOpen = () => useAppStore.getState().loginOpen;

async function openWidget() {
  const user = userEvent.setup();
  await renderWithProviders(<FullEnhancedLoginWidget />, {
    country: "sy",
    store: { loginOpen: true, verficationID: VERIFICATION_ID },
  });
  await screen.findByText("I Have Already Account");
  return { user };
}

type User = ReturnType<typeof userEvent.setup>;

async function sendNumber(user: User) {
  await user.click(await screen.findByRole("button", { name: "Send phone number" }));
  await screen.findByText("Choose Verification Method");
}

async function typePhoneAndSend(user: User) {
  await user.type(phoneField(), PHONE);
  await sendNumber(user);
}

async function pickMethod(user: User, how: "whatsapp" | "sms" = "sms") {
  await user.click(pw(`${how}-receive-otp`));
  await waitFor(() => expect(codeField(), "the code step did not open").toBeInTheDocument());
}

async function toCodeStep(user: User, how: "whatsapp" | "sms" = "sms") {
  await typePhoneAndSend(user);
  await pickMethod(user, how);
}

describe("FullEnhancedLoginWidget — the screens and their hand-offs", () => {
  beforeEach(() => {
    // Closing the widget (setLoginOpen(false)) scrolls the page back; jsdom
    // has no scrolling.
    document.documentElement.scrollTo = vi.fn() as never;
    sendOtp.mockReset();
    sendOtp.mockResolvedValue(undefined);
    updateName.mockReset();
    updateName.mockResolvedValue(undefined);
    fetchStories.mockReset();
    fetchStories.mockResolvedValue({ data: [{ id: 1 }] });
  });

  it("renders nothing while the login modal is closed", async () => {
    const { container } = await renderWithProviders(<FullEnhancedLoginWidget />, {
      store: { loginOpen: false },
    });
    expect(container.innerHTML, "a closed widget rendered markup").toBe("");
  });

  it("'later' on the first screen closes the widget and is reported as a skip", async () => {
    const { user } = await openWidget();
    await user.click(pw("take-look"));
    expect(isOpen(), "later did not close the widget").toBe(false);
    expect(actions(), "the later click was not reported").toContain(
      GA_EVENT_NAMES.LATER_TAKE_LOOK_CLICKED,
    );
  });

  it("a new customer signs up with WhatsApp, lands on the name step and names the account", async () => {
    verifyOtp.mockResolvedValue([false, ""]);
    const { user } = await openWidget();
    await user.click(pw("create-account"));
    expect(actions(), "signup start was not reported").toContain(GA_EVENT_NAMES.SIGNUP_START);
    await user.click(pw("agree-continue"));
    // Back from the number screen goes to the terms for a signup.
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await user.click(pw("agree-continue"));
    await toCodeStep(user, "whatsapp");
    expect(sendOtp, "WhatsApp was not asked for").toHaveBeenCalledWith(PHONE, 1, expect.any(Function));

    await user.type(codeField(), "123456");
    await screen.findByText("Enter Your Name !", undefined, { timeout: 5000 });
    expect(fetchStories, "the story rail was not re-read after sign-up").toHaveBeenCalledWith(
      "en",
      "sy",
      1,
    );
    expect(useAppStore.getState().storiesData, "the fresh stories were not stored").toEqual([
      { id: 1 },
    ]);
    expect(actions(), "the sign-up was not reported").toContain(GA_EVENT_NAMES.SIGN_UP);

    await user.type(pw("input-user-name-field") as HTMLInputElement, "Rana");
    await user.click(pw("submit-user-name"));
    await waitFor(() => expect(isOpen(), "naming the account did not close").toBe(false));
    expect(updateName, "the name was not sent").toHaveBeenCalledWith("Rana");
  }, 15000);

  it("signing up with a number that already has a named account offers to log in", async () => {
    verifyOtp.mockResolvedValue([true, "Rana"]);
    fetchStories.mockRejectedValue(new Error("stories down"));
    const { user } = await openWidget();
    await user.click(pw("create-account"));
    await user.click(pw("agree-continue"));
    await toCodeStep(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Already Registered !", undefined, { timeout: 4000 });
    expect(logError, "a failed story refresh was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: expect.stringContaining("refreshing stories") }),
    );

    // Back goes to the number; come forward again and log in.
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(phoneField(), "back from already-registered did not show the number").toBeInTheDocument();
    await sendNumber(user);
    await pickMethod(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Already Registered !", undefined, { timeout: 4000 });
    await user.click(pw("login-continue"));
    // A named account finishes from the welcome screen without the name step.
    await waitFor(() => expect(isOpen(), "the welcome screen did not close").toBe(false), {
      timeout: 4000,
    });
  }, 20000);

  it("'cancel' on the already-registered screen closes as a skip", async () => {
    verifyOtp.mockResolvedValue([true, "Rana"]);
    const { user } = await openWidget();
    await user.click(pw("create-account"));
    await user.click(pw("agree-continue"));
    await toCodeStep(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Already Registered !", undefined, { timeout: 4000 });
    await user.click(pw("cancel-take-look"));
    expect(isOpen(), "cancel did not close").toBe(false);
  }, 15000);

  it("logging in with a number that has no account offers to create one, and a failed name save still closes", async () => {
    verifyOtp.mockResolvedValue([false, ""]);
    updateName.mockRejectedValue(new Error("name refused"));
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Not Registered !", undefined, { timeout: 4000 });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(phoneField(), "back from not-registered did not show the number").toBeInTheDocument();
    await sendNumber(user);
    await pickMethod(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Not Registered !", undefined, { timeout: 4000 });
    await user.click(pw("create-account-continue"));
    await user.type(pw("input-user-name-field") as HTMLInputElement, "Omar");
    await user.click(pw("submit-user-name"));
    await waitFor(() => expect(isOpen(), "a failed name save kept the widget open").toBe(false));
    expect(logError, "the failed name save was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: expect.stringContaining("handleNameSubmit") }),
    );
  }, 20000);

  it("'cancel' on the not-registered screen closes as a skip", async () => {
    verifyOtp.mockResolvedValue([false, ""]);
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Not Registered !", undefined, { timeout: 4000 });
    await user.click(pw("cancel-take-look"));
    expect(isOpen(), "cancel did not close").toBe(false);
  }, 15000);

  it("a login for an account with a real name closes after the welcome", async () => {
    verifyOtp.mockResolvedValue([true, "Rana"]);
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user);
    await user.type(codeField(), "123456");
    await waitFor(() => expect(pw("welcome"), "no welcome screen").toBeTruthy(), { timeout: 4000 });
    await waitFor(
      () => expect(isOpen(), "the login did not close after the welcome").toBe(false),
      { timeout: 4000 },
    );
    expect(actions(), "the login was not reported").toContain(GA_EVENT_NAMES.LOGIN);
  }, 15000);

  it("a login for an account with a placeholder name asks for the name", async () => {
    verifyOtp.mockResolvedValue([true, "x"]);
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user);
    await user.type(codeField(), "123456");
    await screen.findByText("Enter Your Name !", undefined, { timeout: 6000 });
    expect(isOpen(), "a placeholder-name login closed before the name step").toBe(true);
  }, 15000);

  it("moves back and forth between the number, method and code screens", async () => {
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    // Back from the number screen goes to the first screen for a login.
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(await screen.findByText("I Have Already Account"));
    await typePhoneAndSend(user);
    await user.click(pw("edit-phone-number"));
    expect(phoneField(), "Edit did not go back to the number").toBeInTheDocument();
    await sendNumber(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(phoneField(), "back from the method screen did not show the number").toBeInTheDocument();
    await sendNumber(user);
    await pickMethod(user);

    await user.click(pw("change-otp-method"));
    await screen.findByText("Choose Verification Method");
    await pickMethod(user);
    await user.click(pw("change-phone-number"));
    expect(phoneField(), "change number did not go back").toBeInTheDocument();
    await sendNumber(user);
    await pickMethod(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(
      await screen.findByText("Choose Verification Method"),
      "back from the code screen did not show the methods",
    ).toBeInTheDocument();
  }, 20000);

  it("resends the code by the chosen method, and shows why a resend failed", async () => {
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user, "whatsapp");
    sendOtp.mockClear();
    await user.click(pw("resend-code"));
    await waitFor(() =>
      expect(sendOtp, "the resend did not use WhatsApp").toHaveBeenCalledWith(
        PHONE,
        1,
        expect.any(Function),
      ),
    );
    expect(actions(), "the resend was not reported").toContain(GA_EVENT_NAMES.RESEND_OTP);

    sendOtp.mockRejectedValue(new Error("The code service is busy"));
    await waitFor(() => expect(pw("resend-code"), "the resend link did not come back").toBeTruthy());
    await user.click(pw("resend-code"));
    expect(
      await screen.findByText("The code service is busy"),
      "the resend error was not shown",
    ).toBeInTheDocument();
    expect(logError, "the failed resend was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: expect.stringContaining("handleResendOtp") }),
    );
  }, 15000);

  it("drops the server's wait message when the failed resend armed a cooldown", async () => {
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user);
    sendOtp.mockImplementation(async () => {
      lockNumber(PHONE, 120);
      throw new Error("Please wait 120 seconds before trying again");
    });
    await user.click(pw("resend-code"));
    await waitFor(() => expect(sendOtp, "the resend was not tried").toHaveBeenCalledTimes(2));
    expect(
      screen.queryByText("Please wait 120 seconds before trying again"),
      "the frozen server wait message was shown next to the countdown",
    ).toBeNull();
  }, 15000);

  it("shows a translated fallback when sending the first code fails with no useful text", async () => {
    sendOtp.mockRejectedValue(new Error(""));
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await typePhoneAndSend(user);
    await user.click(pw("sms-receive-otp"));
    expect(
      await screen.findByText("Something went wrong"),
      "no fallback error text",
    ).toBeInTheDocument();
    expect(actions(), "the failed send was not reported").toContain(GA_EVENT_NAMES.EXCEPTION);
  });

  it("reports the code timer running out once the cooldown ends", async () => {
    sendOtp.mockImplementation(async () => {
      lockNumber(PHONE, 1);
    });
    const { user } = await openWidget();
    await user.click(pw("have-account-button"));
    await toCodeStep(user);
    await waitFor(
      () =>
        expect(actions(), "the timer expiry was not reported").toContain(
          GA_EVENT_NAMES.TIMER_EXPIRED,
        ),
      { timeout: 4000 },
    );
  }, 15000);

  it("QR login: back returns to the first screen, approval closes the widget", async () => {
    const { user } = await openWidget();
    await user.click(pw("scan-qr-code"));
    await user.click(await screen.findByText("qr back"));
    await user.click(pw("scan-qr-code"));
    await user.click(await screen.findByText("qr approved"));
    expect(isOpen(), "QR approval did not close").toBe(false);
    expect(
      gaEvent.mock.calls.some(
        ([p]: [{ action: string; params: { method_otp?: string } }]) =>
          p.action === GA_EVENT_NAMES.LOGIN && p.params.method_otp === "qr",
      ),
      "the QR login was not reported",
    ).toBe(true);
  });
});
