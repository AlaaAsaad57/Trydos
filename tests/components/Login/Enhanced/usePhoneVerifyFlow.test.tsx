// The send / resend / verify plumbing behind both phone-verify hosts.
//
// This hook is the only place in the app that decides whether a one-time code
// is sent at all: it reads the client-side guard (`utils/otpLocks`), it counts
// the verify attempts a resend reports, and it holds the re-entrancy lock that
// stops one shopper burning two server-side attempts on one tap. None of that
// is visible in a screen test, so it is proven here, directly.
//
// WHAT IS REAL AND WHAT IS STOOD IN
//   real  — the store (the hook reads `verficationID` off it), `utils/otpLocks`
//           (sessionStorage works in jsdom, and the guard's rules are the
//           subject of half these cases), `translateFunction`.
//   stood in — `services/auth` (the network boundary), `utils/gtag` (analytics,
//           asserted on), `LogError` (the error reporter).
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
import { useAppStore } from "store";
import { LogError } from "utils/functions";
import { GAevent } from "utils/gtag";
import { GA_BUTTONS_NAMES, GA_EVENT_NAMES } from "utils/GAEvents";
import { lockNumber, recordSessionNumber } from "utils/otpLocks";
import {
  usePhoneVerifyFlow,
  type UsePhoneVerifyFlowOptions,
} from "components/Login/Enhanced/usePhoneVerifyFlow";

import { act, renderHook, waitFor } from "../../../render";

const sendOtp = AuthService.SendOtp as unknown as ReturnType<typeof vi.fn>;
const gaEvent = GAevent as unknown as ReturnType<typeof vi.fn>;
const logError = LogError as unknown as ReturnType<typeof vi.fn>;

const PHONE = "963991234567";
const VERIFICATION_ID = "verification-id-from-the-send";

/** Render the hook with the two options every case needs and a seeded store. */
function renderFlow(options: Partial<UsePhoneVerifyFlowOptions> = {}) {
  const verify = options.verify ?? vi.fn(async () => ({ ok: true }));
  const onSuccess = options.onSuccess ?? vi.fn();

  const rendered = renderHook(() =>
    usePhoneVerifyFlow({
      verify,
      onSuccess,
      source: "TestHost",
      ...options,
    }),
  );

  return { ...rendered, verify, onSuccess };
}

beforeEach(() => {
  // The guard lives in sessionStorage, so it outlives a test unless it is
  // cleared. Leaving it would make a later "no cooldown running" case pass or
  // fail on what the case before it locked.
  window.sessionStorage.clear();
  useAppStore.setState(
    { ...useAppStore.getInitialState(), verficationID: VERIFICATION_ID } as any,
    true as any,
  );
  sendOtp.mockReset();
  sendOtp.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("where the flow starts", () => {
  it("starts on the phone step when the shopper has no number yet", () => {
    const { result } = renderFlow();

    expect(
      result.current.step,
      "a shopper with no number to confirm must be asked for one first",
    ).toBe("enter-phone");
  });

  it("skips the phone step when the account already owns the number", () => {
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    expect(
      result.current.step,
      "a locked number must not be re-typed — the flow starts at the method step",
    ).toBe("select-method");
  });

  it("still asks for a number when it is locked but none was supplied", () => {
    const { result } = renderFlow({ initialPhone: "", phoneLocked: true });

    expect(
      result.current.step,
      "there is nothing to lock without a number, so the phone step must stay",
    ).toBe("enter-phone");
  });

  it.each([
    ["+963991234567", "a stored profile number carrying a plus"],
    ["00963991234567", "an international number typed with a double zero"],
    ["0963991234567", "a number typed with a national leading zero"],
    ["963 99 123 4567", "a number typed with spaces"],
  ])("normalises %s (%s) to bare digits", (seed) => {
    const { result } = renderFlow({ initialPhone: seed, phoneLocked: true });

    expect(
      result.current.phone,
      `the seeded number ${seed} must reach the send as bare digits, or the ` +
        "screens show ++963… and the backend is given a differently-shaped number",
    ).toBe(PHONE);
  });
});

describe("sending the code", () => {
  it("sends on the chosen method and moves to the code step", async () => {
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.sendMethod("whatsapp");
    });

    expect(
      sendOtp,
      "choosing WhatsApp must ask the sign-in service to send on WhatsApp (flag 1)",
    ).toHaveBeenCalledWith(PHONE, 1, expect.any(Function));
    expect(returned, "a send the backend accepted must report success").toBe(
      true,
    );
    expect(
      result.current.step,
      "after a code is sent the shopper must be on the code step",
    ).toBe("enter-pin");
    expect(
      result.current.error,
      "a send that worked must leave no error on the screen",
    ).toBe("");
  });

  it("sends on SMS with the SMS flag, not the WhatsApp one", async () => {
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    await act(async () => {
      await result.current.sendMethod("sms");
    });

    expect(
      sendOtp,
      "choosing SMS must ask the sign-in service to send by SMS (flag 0)",
    ).toHaveBeenCalledWith(PHONE, 0, expect.any(Function));
  });

  it("reports the send to analytics, naming the host that asked for it", async () => {
    const { result } = renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      source: "VerifyPhoneFlow",
    });

    await act(async () => {
      await result.current.sendMethod("whatsapp");
    });

    expect(
      gaEvent,
      "a send must be reported as send_otp, attributed to the host, or the " +
        "one-time-code funnel loses this host's leg",
    ).toHaveBeenCalledWith({
      action: GA_EVENT_NAMES.SEND_OTP,
      params: {
        method: "whatsapp",
        source: "VerifyPhoneFlow",
        button_name: GA_BUTTONS_NAMES.CHOOSE_WHATSAPP_BUTTON,
      },
    });
  });

  it("tells the host to run its own transition once the step moved", async () => {
    const onAdvance = vi.fn();
    const { result } = renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      onAdvance,
    });

    await act(async () => {
      await result.current.sendMethod("sms");
    });

    expect(
      onAdvance,
      "the host's slide direction is nudged from here — without it the code " +
        "step animates in from the wrong side",
    ).toHaveBeenCalledTimes(1);
  });

  it("refuses to send while a cooldown is running on that number", async () => {
    lockNumber(PHONE, 120);
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.sendMethod("sms");
    });

    expect(
      sendOtp,
      "the client guard must stop a send before the request, not after — a " +
        "request that reaches the limiter costs the shopper a refusal",
    ).not.toHaveBeenCalled();
    expect(
      returned,
      "a send blocked by the cooldown must report failure, so the host can " +
        "tell it apart from a send that worked and armed the same cooldown",
    ).toBe(false);
    expect(
      result.current.step,
      "a blocked send must leave the shopper where they are, not on the code step",
    ).toBe("select-method");
  });

  it("refuses to send once the session has used its allowance of numbers", async () => {
    recordSessionNumber("963991111111");
    recordSessionNumber("963992222222");
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.sendMethod("sms");
    });

    expect(
      sendOtp,
      "a third number in one session must be stopped before the request",
    ).not.toHaveBeenCalled();
    expect(returned, "a capped send must report failure").toBe(false);
  });

  it("shows the host's own blocked message when the host asked for one", async () => {
    lockNumber(PHONE, 90);
    const { result } = renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      blockedMessage: (seconds) => `Wait ${seconds} seconds`,
    });

    await act(async () => {
      await result.current.sendMethod("sms");
    });

    expect(
      result.current.error,
      "a host with no cooldown display of its own must be given the message, " +
        "or the shopper taps Send and nothing at all happens",
    ).toMatch(/^Wait \d+ seconds$/);
  });

  it("stays silent when the host already shows its own countdown", async () => {
    lockNumber(PHONE, 90);
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    await act(async () => {
      await result.current.sendMethod("sms");
    });

    expect(
      result.current.error,
      "the method screen renders the countdown itself — a second message " +
        "would sit in the same slot saying the same thing",
    ).toBe("");
  });

  it("surfaces the reason when the send is refused after the request", async () => {
    sendOtp.mockRejectedValue(new Error("This number is not registered"));
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.sendMethod("sms");
    });

    expect(
      result.current.error,
      "the reason the send was refused must reach the screen, not be replaced " +
        "by a generic line",
    ).toBe("This number is not registered");
    expect(returned, "a refused send must report failure").toBe(false);
    expect(
      result.current.step,
      "a refused send must not move the shopper to a code step with no code sent",
    ).toBe("select-method");
    expect(
      logError,
      "a refused send must be reported, naming the host it happened in",
    ).toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "Error sending OTP in TestHost" }),
    );
  });

  it("drops the backend's static wait message when a countdown is already running", async () => {
    sendOtp.mockImplementation(async () => {
      // What the real service does from the limiter's reply: it arms the client
      // cooldown and then rethrows.
      lockNumber(PHONE, 120);
      throw new Error("Please wait 120 seconds before trying again");
    });
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    await act(async () => {
      await result.current.sendMethod("sms");
    });

    expect(
      result.current.error,
      "the screen's live countdown owns that slot — keeping the server's " +
        "frozen number would park a second timer behind it that never ticks",
    ).toBe("");
  });

  it("falls back to a translated line when the failure carries nothing to show", async () => {
    sendOtp.mockRejectedValue(new Error("Wrong Code"));
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    await act(async () => {
      await result.current.sendMethod("sms");
    });

    expect(
      result.current.error,
      "an internal string must never reach the shopper — a generic translated " +
        "line is shown instead",
    ).toBe("Something went wrong");
  });
});

describe("resending the code", () => {
  /** Get a flow to the code step the way a shopper does, then clear the guard
   *  the successful send would have armed, so the resend case starts clean. */
  async function atCodeStep(options: Partial<UsePhoneVerifyFlowOptions> = {}) {
    const flow = renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      ...options,
    });
    await act(async () => {
      await flow.result.current.sendMethod("sms");
    });
    sendOtp.mockClear();
    gaEvent.mockClear();
    return flow;
  }

  it("resends on the method already chosen, without asking again", async () => {
    const { result } = await atCodeStep();

    await act(async () => {
      await result.current.resend();
    });

    expect(
      sendOtp,
      "a resend must repeat the method the shopper picked, not silently switch it",
    ).toHaveBeenCalledWith(PHONE, 0, expect.any(Function));
    expect(
      result.current.step,
      "a resend must keep the shopper on the code step",
    ).toBe("enter-pin");
  });

  it("does nothing before a method has been chosen", async () => {
    const { result } = renderFlow({ initialPhone: PHONE, phoneLocked: true });

    await act(async () => {
      await result.current.resend();
    });

    expect(
      sendOtp,
      "there is no method to resend on yet — sending anyway would pick one " +
        "the shopper never chose",
    ).not.toHaveBeenCalled();
  });

  it("does nothing while the number is on cooldown", async () => {
    const { result } = await atCodeStep();
    lockNumber(PHONE, 120);

    await act(async () => {
      await result.current.resend();
    });

    expect(
      sendOtp,
      "a resend during the cooldown must be stopped before the request",
    ).not.toHaveBeenCalled();
  });

  it("reports the resend with the attempts made since the last send", async () => {
    const verify = vi.fn(async () => {
      throw new Error("Wrong Code");
    });
    const { result } = await atCodeStep({ verify });

    await act(async () => {
      await result.current.verifyPin("111111");
    });
    await act(async () => {
      await result.current.verifyPin("222222");
    });
    await act(async () => {
      await result.current.resend();
    });

    expect(
      gaEvent,
      "the resend report must carry how many codes the shopper had already " +
        "tried — that count is what tells a bad delivery from a bad code",
    ).toHaveBeenCalledWith({
      action: GA_EVENT_NAMES.RESEND_OTP,
      params: {
        method: "sms",
        attempts: 2,
        source: "TestHost",
        button_name: GA_BUTTONS_NAMES.RESEND_OTP_BUTTON,
      },
    });
  });

  it("starts the attempt count again after a code is resent", async () => {
    const verify = vi.fn(async () => {
      throw new Error("Wrong Code");
    });
    const { result } = await atCodeStep({ verify });

    await act(async () => {
      await result.current.verifyPin("111111");
    });
    await act(async () => {
      await result.current.resend();
    });
    gaEvent.mockClear();
    await act(async () => {
      await result.current.resend();
    });

    expect(
      gaEvent,
      "attempts are counted against the code in the shopper's hand — a new " +
        "code starts at zero",
    ).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ attempts: 0 }) }),
    );
  });

  it("clears a code left in the boxes when a new one is sent", async () => {
    const { result } = await atCodeStep();
    act(() => {
      result.current.setPin("123456");
    });

    await act(async () => {
      await result.current.resend();
    });

    expect(
      result.current.pin,
      "the old code is dead once a new one is sent — leaving it in the boxes " +
        "invites the shopper to submit it and lose an attempt",
    ).toBe("");
  });
});

describe("verifying the code", () => {
  async function atCodeStep(options: Partial<UsePhoneVerifyFlowOptions> = {}) {
    const flow = renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      ...options,
    });
    await act(async () => {
      await flow.result.current.sendMethod("sms");
    });
    return flow;
  }

  it("verifies the typed code against the id the send returned", async () => {
    const { result, verify } = await atCodeStep();

    await act(async () => {
      await result.current.verifyPin("123456");
    });

    expect(
      verify,
      "the code must be checked against the verification id the send stored — " +
        "with the wrong id the backend refuses a correct code",
    ).toHaveBeenCalledWith("123456", VERIFICATION_ID);
  });

  it("marks the code good and hands the result to the host", async () => {
    const outcome = { user: { id: 7 } };
    const verify = vi.fn(async () => outcome);
    const onSuccess = vi.fn();
    const { result } = await atCodeStep({ verify, onSuccess });

    await act(async () => {
      await result.current.verifyPin("123456");
    });

    expect(
      result.current.isValidPin,
      "an accepted code must show as accepted before the host tears the flow down",
    ).toBe("valid");

    await waitFor(
      () => {
        expect(
          onSuccess,
          "the host is only told the shopper is through by this callback — if " +
            "it never fires, the shopper is verified and the app does not know",
        ).toHaveBeenCalledWith(outcome);
      },
      { timeout: 2000 },
    );
  });

  it("checks a code once, however many times the boxes fire", async () => {
    const verify = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 50)),
    );
    const { result } = await atCodeStep({ verify });

    await act(async () => {
      await Promise.all([
        result.current.verifyPin("123456"),
        result.current.verifyPin("123456"),
      ]);
    });

    expect(
      verify,
      "the code inputs can fire twice inside one tick, and every extra check " +
        "burns one of the shopper's server-side attempts",
    ).toHaveBeenCalledTimes(1);
  });

  it("says the code was wrong, and reports it", async () => {
    const verify = vi.fn(async () => {
      throw new Error("Wrong Code");
    });
    const { result } = await atCodeStep({ verify });

    await act(async () => {
      await result.current.verifyPin("000000");
    });

    expect(
      result.current.isValidPin,
      "a refused code must show as refused, or the shopper waits at a screen " +
        "that looks like it is still working",
    ).toBe("notvalid");
    expect(
      result.current.error,
      "a refused code must say so in words, not only in the colour of the boxes",
    ).toBe(
      "Please Enter The Correct Code Sent To Your Phone — Tries left: 2",
    );
    expect(
      logError,
      "a refused code must be reported, naming the host it happened in",
    ).toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "Error verifying OTP in TestHost" }),
    );
  });

  it("clears the wrong code so the shopper can type the next one", async () => {
    const verify = vi.fn(async () => {
      throw new Error("Wrong Code");
    });
    const { result } = await atCodeStep({ verify });

    // The code inputs write the pin as it is typed; `verifyPin` never does.
    // Without this the boxes are already empty and the wait below proves nothing.
    act(() => {
      result.current.setPin("000000");
    });
    await act(async () => {
      await result.current.verifyPin("000000");
    });
    expect(
      result.current.pin,
      "the wrong code must stay on screen while it is marked wrong — clearing " +
        "it at once hides what the shopper typed before they can read the mark",
    ).toBe("000000");

    await waitFor(
      () => {
        expect(
          result.current.pin,
          "a wrong code must be taken out of the boxes — leaving it there means " +
            "the shopper has to clear six digits by hand before retrying",
        ).toBe("");
      },
      { timeout: 3000 },
    );
    expect(
      result.current.isValidPin,
      "the refused state must clear with the code, so the next attempt starts neutral",
    ).toBe("");
  });

  it("lets the shopper try again after a wrong code", async () => {
    const verify = vi
      .fn()
      .mockRejectedValueOnce(new Error("Wrong Code"))
      .mockResolvedValueOnce({ ok: true });
    const { result } = await atCodeStep({ verify });

    await act(async () => {
      await result.current.verifyPin("000000");
    });
    await act(async () => {
      await result.current.verifyPin("123456");
    });

    expect(
      verify,
      "the guard against a double submit must release once the check settled, " +
        "or one wrong code locks the shopper out of the screen for good",
    ).toHaveBeenCalledTimes(2);
    expect(
      result.current.isValidPin,
      "the second, correct code must be accepted",
    ).toBe("valid");
  });
});

// Three wrong codes per code sent, then the boxes go dead until a new code
// arrives. The count is held in memory only, and every failed check counts —
// a refused code, a network fault and a server fault alike.
describe("the three-try cap", () => {
  const REFUSED = () => new Error("Wrong Code");

  async function atCodeStep(options: Partial<UsePhoneVerifyFlowOptions> = {}) {
    const flow = renderFlow({
      initialPhone: PHONE,
      phoneLocked: true,
      ...options,
    });
    await act(async () => {
      await flow.result.current.sendMethod("sms");
    });
    return flow;
  }

  /** Type a wrong code `times` times against a flow already on the code step. */
  async function typeWrongCodes(
    result: { current: { verifyPin: (pin: string) => Promise<void> } },
    times: number,
  ) {
    for (let i = 0; i < times; i += 1) {
      await act(async () => {
        await result.current.verifyPin("000000");
      });
    }
  }

  it("says two tries are left after the first wrong code", async () => {
    const verify = vi.fn().mockRejectedValue(REFUSED());
    const { result } = await atCodeStep({ verify });

    await typeWrongCodes(result, 1);

    expect(
      result.current.error,
      "after one wrong code the shopper must be told how many tries remain, " +
        "instead of guessing in the dark",
    ).toBe("Please Enter The Correct Code Sent To Your Phone — Tries left: 2");
    expect(
      result.current.attemptsLocked,
      "one wrong code must not kill the boxes — two tries are still owed",
    ).toBe(false);
  });

  it("counts the second wrong code down to one try left", async () => {
    const verify = vi.fn().mockRejectedValue(REFUSED());
    const { result } = await atCodeStep({ verify });

    await typeWrongCodes(result, 2);

    expect(
      result.current.error,
      "the remaining count must go down with each wrong code; a count that " +
        "stays at two means the message is built from a stale value",
    ).toBe("Please Enter The Correct Code Sent To Your Phone — Tries left: 1");
    expect(
      result.current.attemptsLocked,
      "two wrong codes must not kill the boxes — one try is still owed",
    ).toBe(false);
  });

  it("drops the count and says to ask for a new code on the third", async () => {
    const verify = vi.fn().mockRejectedValue(REFUSED());
    const { result } = await atCodeStep({ verify });

    await typeWrongCodes(result, 3);

    expect(
      result.current.error,
      "the third wrong code must replace the wording, not append a count of zero",
    ).toBe("Too many wrong codes. Ask for a new code.");
    expect(
      result.current.attemptsLocked,
      "the third wrong code must kill the boxes",
    ).toBe(true);
  });

  it("spends one try when the boxes report a finished code twice at once", async () => {
    const verify = vi.fn().mockRejectedValue(REFUSED());
    const { result } = await atCodeStep({ verify });

    // Both calls in one act, the way the pin inputs can fire twice inside a
    // single tick before `loading` has re-rendered.
    await act(async () => {
      await Promise.all([
        result.current.verifyPin("000000"),
        result.current.verifyPin("000000"),
      ]);
    });

    expect(
      verify,
      "a double fire must reach the backend once, not twice",
    ).toHaveBeenCalledTimes(1);
    expect(
      result.current.error,
      "typing once must cost one try — a double fire that spends two would " +
        "lock a shopper out after typing two codes",
    ).toBe("Please Enter The Correct Code Sent To Your Phone — Tries left: 2");
  });

  it("gives three fresh tries once a new code arrives", async () => {
    const verify = vi.fn().mockRejectedValue(REFUSED());
    const { result } = await atCodeStep({ verify });
    await typeWrongCodes(result, 3);

    // The send guard is armed by the send above, so clear it: this case is
    // about the cap, not about the cooldown.
    window.sessionStorage.clear();
    await act(async () => {
      await result.current.resend();
    });

    expect(
      result.current.attemptsLocked,
      "a code that arrives must bring the boxes back to life",
    ).toBe(false);

    await typeWrongCodes(result, 1);

    expect(
      result.current.error,
      "a new code must restore all three tries, not resume from the spent count",
    ).toBe("Please Enter The Correct Code Sent To Your Phone — Tries left: 2");
  });

  it("stays locked when the request for a new code fails", async () => {
    const verify = vi.fn().mockRejectedValue(REFUSED());
    const { result } = await atCodeStep({ verify });
    await typeWrongCodes(result, 3);

    window.sessionStorage.clear();
    sendOtp.mockRejectedValueOnce(new Error("the send backend refused the code"));
    await act(async () => {
      await result.current.resend();
    });

    expect(
      result.current.attemptsLocked,
      "no new code arrived, so nothing has been earned back — the boxes must " +
        "stay dead rather than open on the same spent code",
    ).toBe(true);
  });

  it("spends a try on a check that never reached a verdict", async () => {
    // Not a refused code: the request itself failed, so nobody judged the
    // digits. Counting it is a deliberate decision, recorded as EC-9.
    const verify = vi.fn().mockRejectedValue(new Error("Network request failed"));
    const { result } = await atCodeStep({ verify });

    await typeWrongCodes(result, 3);

    expect(
      result.current.attemptsLocked,
      "every failed check counts the same, whatever the reason — a shopper " +
        "offline spends tries exactly as a guesser does",
    ).toBe(true);
  });

  it("keeps the analytics attempt count separate from the cap", async () => {
    const verify = vi
      .fn()
      .mockRejectedValueOnce(REFUSED())
      .mockResolvedValueOnce({ ok: true });
    const { result } = await atCodeStep({ verify });

    await typeWrongCodes(result, 1);
    await act(async () => {
      await result.current.verifyPin("123456");
    });

    window.sessionStorage.clear();
    gaEvent.mockClear();
    await act(async () => {
      await result.current.resend();
    });

    const resendEvent = gaEvent.mock.calls
      .map(([payload]: [{ action: string; params: { attempts?: number } }]) => payload)
      .find((payload) => payload.action === GA_EVENT_NAMES.RESEND_OTP);

    expect(
      resendEvent?.params.attempts,
      "the reported attempts must keep counting every check — the wrong one " +
        "and the accepted one — not only the wrong codes the cap counts",
    ).toBe(2);
  });
});
