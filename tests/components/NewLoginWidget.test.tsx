// The new login (NewLoginDesign/NewLoginWidget) on the login page, Stage 2 of
// UI-MIGRATION-PLAN.md: the real flow, step by step, and the way back.
//
// A file of its own, next to NewLoginWidgetReducedMotion.test.tsx: this one has
// to stand framer-motion in (screens never finish leaving in jsdom), and that
// one needs the real MotionConfig. The two cannot share one module mock.
//
// Real: the widget, its screens, the input primitives, `utils/otpLocks`,
// `utils/loginPath`, the store, the translations. Stood in: the network
// (`services/auth`, `services/qrLogin`), analytics, the scaled canvas, the
// logo layer, the 8 second Quick Preview and the success screen's timer.
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("services/auth", () => ({
  default: { SendOtp: vi.fn(), VerifyOtp: vi.fn(), UpdateName: vi.fn() },
}));
vi.mock("services/qrLogin", () => ({ createQrSession: vi.fn(), getQrStatus: vi.fn() }));
vi.mock("utils/gtag", () => ({ GAevent: vi.fn(), pageview: vi.fn() }));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  LogError: vi.fn(),
}));
vi.mock("serverRequests", () => ({ fetchStoriesForUser: vi.fn(async () => ({ data: [] })) }));
vi.mock("scaling/Page", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// The logo layer measures the screens' slots in the layout jsdom does not have.
vi.mock("NewLoginDesign/AuthLogoLayer", () => ({ default: () => null }));
// The Quick Preview runs for 8 seconds; here it is one button to its end.
vi.mock("NewLoginDesign/QuickPreviewScreen", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete}>preview done</button>
  ),
}));
// The success screen waits 2.5 s before it calls onDone; here it is a button,
// and it says which of the two endings it is.
vi.mock("NewLoginDesign/NewSuccessScreen", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  default: ({ variant, onDone }: { variant: string; onDone?: () => void }) => (
    <button onClick={onDone}>{`success ${variant}`}</button>
  ),
}));
vi.mock("framer-motion", () => {
  // Cached per tag: a new component type on every read would remount the
  // screen between keystrokes.
  const stubs = new Map<string, React.ComponentType<Record<string, unknown>>>();
  const stubFor = (tag: string) => {
    if (!stubs.has(tag)) {
      stubs.set(tag, function MotionStub({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) {
        const {
          initial: _i, animate: _a, exit: _e, transition: _t, custom: _c, variants: _v,
          whileTap: _wt, whileHover: _wh, drag: _d, dragConstraints: _dc, dragElastic: _de,
          onDragEnd: _ode, layout: _l,
          ...rest
        } = props;
        return React.createElement(tag, rest, children);
      });
    }
    return stubs.get(tag)!;
  };
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MotionConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy({}, { get: (_target, tag: string) => stubFor(tag) }),
  };
});

import AuthService from "services/auth";
import { createQrSession, getQrStatus } from "services/qrLogin";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { routerSpies } from "../mocks/nextNavigation";
import NewLoginWidget from "NewLoginDesign/NewLoginWidget";
import { resetDevice, setDevice } from "../mocks/device";
import { renderWithProviders, screen, userEvent, waitFor } from "../render";

const sendOtp = AuthService.SendOtp as unknown as ReturnType<typeof vi.fn>;
const verifyOtp = AuthService.VerifyOtp as unknown as ReturnType<typeof vi.fn>;
const updateName = AuthService.UpdateName as unknown as ReturnType<typeof vi.fn>;
const gaEvent = GAevent as unknown as ReturnType<typeof vi.fn>;
const actions = () => gaEvent.mock.calls.map(([payload]: [{ action: string }]) => payload.action);
const pw = (id: string) => document.querySelector<HTMLElement>(`[data-pw="${id}"]`);
/** Waits for the element with this data-pw, and names it when it never comes. */
const find = (id: string, timeout = 2000) =>
  waitFor(
    () => {
      const el = pw(id);
      if (!el) throw new Error(`[data-pw="${id}"] is not on the screen`);
      return el;
    },
    { timeout },
  );

const PHONE = "963991234567";
const VERIFICATION_ID = "verification-id-from-the-send";
type User = ReturnType<typeof userEvent.setup>;

/** Opens the login page on /sy-en/login, with `next` as the page to go back to. */
async function openLogin(next?: string) {
  const user = userEvent.setup();
  await renderWithProviders(<NewLoginWidget />, {
    country: "sy",
    path: "/login",
    search: next === undefined ? "" : `next=${encodeURIComponent(next)}`,
    store: { verficationID: VERIFICATION_ID },
  });
  await user.click(await screen.findByText("preview done"));
  return { user };
}

/** Get Started → (terms) → number → method → the code boxes. */
async function toCodeStep(user: User, how: "signIn" | "signUp") {
  if (how === "signIn") await user.click(pw("have-account-button")!);
  else {
    await user.click(pw("create-account")!);
    await user.click(await find("agree-continue"));
  }
  const phoneField = (await find("input-phone-number-field")) as HTMLInputElement;
  expect(phoneField.value, "the number field is not empty: a test number is still filled in").toBe("");
  await user.type(phoneField, PHONE);
  await user.click(await screen.findByRole("button", { name: "Send Phone Number" }));
  await user.click(await find("sms-receive-otp"));
  await waitFor(() => expect(pw("input-otp-field"), "the code step did not open after the code was sent").not.toBeNull());
}

const typeCode = async (user: User, code: string) => {
  const field = pw("input-otp-field") as HTMLInputElement;
  await user.clear(field);
  await user.type(field, code);
};

beforeEach(() => {
  // With a mouse: on a touch device the number and code fields draw their own
  // keypad and have no input to type into.
  setDevice("pointer");
  sendOtp.mockReset();
  sendOtp.mockResolvedValue(undefined);
  verifyOtp.mockReset();
  updateName.mockReset();
  updateName.mockResolvedValue(undefined);
  window.sessionStorage.clear();
});
afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("the login page — signing in", () => {
  it("sends the code, checks it, says welcome back and goes back to the page in ?next=", async () => {
    verifyOtp.mockResolvedValue([true, "Rana"]);
    const { user } = await openLogin("/sy-en/products/12");
    await toCodeStep(user, "signIn");
    expect(sendOtp, "the code was not sent by SMS to the typed number").toHaveBeenCalledWith(PHONE, 0, expect.any(Function));

    await typeCode(user, "123456");
    await waitFor(() =>
      expect(verifyOtp, "the code was not checked with the id the send gave back").toHaveBeenCalledWith("123456", VERIFICATION_ID),
    );
    await user.click(await screen.findByText("success login", undefined, { timeout: 3000 }));
    expect(routerSpies.refresh, "the pages cached for the guest were not dropped after the sign-in").toHaveBeenCalled();
    expect(routerSpies.replace, "the end of the login did not go back to the page in ?next=").toHaveBeenLastCalledWith("/sy-en/products/12");
    expect(actions(), "the sign-in was not reported to analytics").toContain(GA_EVENT_NAMES.LOGIN);
  }, 15000);

  it("an account with no real name gives its name first, then gets welcome back (A-22)", async () => {
    verifyOtp.mockResolvedValue([true, "x"]);
    const { user } = await openLogin();
    await toCodeStep(user, "signIn");
    await typeCode(user, "123456");
    const nameField = (await find("input-user-name-field", 3000)) as HTMLInputElement;
    expect(screen.queryByText("success login"), "welcome back came before the name").toBeNull();
    await user.type(nameField, "Rana");
    await user.click(pw("submit-user-name")!);
    await waitFor(() => expect(updateName, "the name was not saved").toHaveBeenCalledWith("Rana"));
    await user.click(await screen.findByText("success login"));
    expect(routerSpies.replace, "with no ?next= the login did not end on the home page").toHaveBeenLastCalledWith("/sy-en");
  }, 15000);

  it("locks the boxes after three wrong codes and says the tries ran out", async () => {
    verifyOtp.mockRejectedValue(new Error("Wrong Code"));
    const { user } = await openLogin();
    await toCodeStep(user, "signIn");
    for (let i = 1; i <= 3; i++) {
      await typeCode(user, "000000");
      await waitFor(() => expect(verifyOtp, `wrong code ${i} did not reach the check exactly once`).toHaveBeenCalledTimes(i));
    }
    expect(await screen.findByText("Too Many Wrong Codes. Ask For A New Code."), "the third wrong code did not say the tries ran out").toBeInTheDocument();
    await waitFor(() => expect(pw("input-otp-field"), "the boxes still take a code after three wrong ones").toBeDisabled());
  }, 15000);
});

describe("the login page — signing up (D-13: verify, name, success)", () => {
  it("a new customer agrees, verifies, names the account and then sees the sign-up ending", async () => {
    verifyOtp.mockResolvedValue([false, ""]);
    const { user } = await openLogin("/sy-ar/settings/profile");
    await toCodeStep(user, "signUp");
    expect(actions(), "the sign-up start was not reported").toContain(GA_EVENT_NAMES.SIGNUP_START);
    await typeCode(user, "123456");
    const nameField = (await find("input-user-name-field", 3000)) as HTMLInputElement;
    expect(screen.queryByText("success signup"), "the sign-up ending came before the name").toBeNull();
    await user.type(nameField, "Rana");
    await user.click(pw("submit-user-name")!);
    await user.click(await screen.findByText("success signup"));
    expect(updateName, "the name was not saved").toHaveBeenCalledWith("Rana");
    expect(routerSpies.replace, "the sign-up did not go back to the page in ?next=").toHaveBeenLastCalledWith("/sy-ar/settings/profile");
  }, 15000);
});

describe("the login page — leaving without signing in (A-20)", () => {
  it("'Later' goes back to the page in ?next= and is reported as a skip", async () => {
    const { user } = await openLogin("/sy-en/products/12");
    await user.click(await find("take-look"));
    expect(routerSpies.replace, "'Later' did not go back to the page the shopper left").toHaveBeenLastCalledWith("/sy-en/products/12");
    expect(actions(), "'Later' was not reported as a skip").toContain(GA_EVENT_NAMES.LATER_TAKE_LOOK_CLICKED);
  });

  it("a ?next= to another host goes to the home page, not to the other host", async () => {
    const { user } = await openLogin("//evil.example/steal");
    await user.click(await find("take-look"));
    expect(routerSpies.replace, "the login page followed a ?next= to another host").toHaveBeenLastCalledWith("/sy-en");
  });
});

describe("the login page — QR login before its backend (A-23)", () => {
  it("opens the sheet with \"Soon available\" and calls no QR mock", async () => {
    const { user } = await openLogin();
    await user.click(await find("scan-qr-code"));
    const box = await find("qr-soon-available");
    expect(box.textContent, "the QR sheet does not say \"Soon available\"").toContain("Soon Available");
    expect(createQrSession, "the QR sheet still asks the localStorage mock for a session").not.toHaveBeenCalled();
    expect(getQrStatus, "the QR sheet still polls the localStorage mock").not.toHaveBeenCalled();
    expect(pw("qr-show-new-code"), "the QR sheet still offers \"Show a new code\"").toBeNull();
  });
});
