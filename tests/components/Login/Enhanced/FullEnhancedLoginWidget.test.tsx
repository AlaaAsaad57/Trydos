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

// A static import that pulls in the whole `qrcode` package. The cap does not
// touch the QR path.
vi.mock("components/Login/Enhanced/screens/QrLoginScreen", () => ({
  default: () => null,
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
