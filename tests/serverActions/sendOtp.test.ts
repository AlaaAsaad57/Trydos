// @vitest-environment node
//
// The only way an OTP send ever happens. AC-1 to AC-10, and AC-16.
//
// WHY THE FIRST LINE OF THIS FILE MATTERS MOST
// tests/setup.ts replaces this action for the whole suite, because the client
// module graph reaches it and loading it for real drags in the server side. That
// stand-in is why the action has never been executed by a test. It is lifted
// here, and here only — so the very first thing this file checks is that the
// REAL action loaded. Without that check, every assertion below could be made
// against the stub and would pass while proving nothing.
//
// WHAT IS STOOD IN, AND WHY EACH ONE HAS TO BE
//   • the error reporter — the action's catch calls it WITHOUT waiting, so left
//     real its cookie read and outbound request outlive the test, and its own
//     error handling would hide the fake network's complaint. The file would
//     break the no-real-input-or-output rule in silence.
//   • next/headers — for the one cookie the action reads.
//   • the authed-fetch helper — so a backend reply is chosen directly and no
//     request is ever built for real.
//   • the identity layer — replaced wholesale, so no hashing and no salt are
//     involved at all, and the assertion is that the identity it resolved is the
//     identity the limiter was asked about (never a fixed hash value).
//   • the telemetry recorder — the real one defers its work and swallows its own
//     errors, so a test could pass because the recording quietly did nothing.
//     Standing it in makes the three outcomes readable off a spy.
//   • the limiter keeps the suite-wide stand-in, so each refusal can be chosen.
//
// Two modules are deliberately left real: the endpoint constants and the cookie
// names. They are constants, they reach nothing, and standing them in would only
// let the test agree with itself.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { SEND_OTP } from "utils/endpointConfig";

import { cacheSpies } from "../mocks/serverRequests";
import { makeNextHeadersMock } from "../mocks/nextHeaders";

vi.unmock("serverActions/sendOtp");

const headers = makeNextHeadersMock({ cookies: { [COOKIE_NAMES.LOCAL]: "gb-en" } });
vi.mock("next/headers", () => headers);

const HandleAuthedFetch = vi.fn();
vi.mock("serverRequests/HandleAuthedFetch", () => ({
  HandleAuthedFetch: (...args: unknown[]) => HandleAuthedFetch(...(args as [])),
}));

/** The identity the action resolves. Opaque keys; documentation-range address. */
const IDENTITY = {
  sid: "session-key-fixture",
  ip: "address-key-fixture",
  rawIp: "192.0.2.10",
  normalizedIp: "192.0.2.10",
  userId: "4242",
  hasUserId: true,
  registeredGuest: false,
  hasMarketToken: true,
  visitId: "visit-id-fixture",
  mintedVisitId: false,
};

const resolveOtpIdentity = vi.fn(async () => IDENTITY);
vi.mock("utils/server/otpIdentity", () => ({
  resolveOtpIdentity: (...args: unknown[]) =>
    resolveOtpIdentity(...(args as [])),
}));

const captureOtpAttempt = vi.fn();
vi.mock("utils/server/otpTelemetry", () => ({
  captureOtpAttempt: (...args: unknown[]) => captureOtpAttempt(...(args as [])),
}));

const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: unknown[]) => LogServerError(...(args as [])),
  default: vi.fn(async () => undefined),
}));

/**
 * Load the real action.
 *
 * Imported inside the tests rather than at the top of the file, because every
 * `vi.mock` call above is hoisted: a top-level import of the action would run
 * those factories before the stand-ins they close over had been created, and the
 * file would fail to load at all. This is the shape
 * `tests/serverRequests/HandleAuthedFetch.test.ts` already uses for the same
 * reason.
 */
async function loadSendOtpAction() {
  const loaded = await import("serverActions/sendOtp");
  return loaded.sendOtpAction;
}

/** Call the real action. */
const sendOtp = async (input: { phone: string; isWhatsapp: number | string }) =>
  (await loadSendOtpAction())(input);

/** A reserved, non-routable number — never a real one, and never a real shape. */
const PHONE = "+999000000001";
/** The same number, exactly, as a person would type it. */
const TYPED_PHONE = "+999 (000) 000-001";
/** The shortest number the guard allows: 6 digits, the lower bound exactly. */
const SHORTEST_ALLOWED = "999000";
/** The longest number the guard allows: 15 digits, E.164's maximum exactly. */
const LONGEST_ALLOWED = "999000000000001";
/** An obviously fake cooldown, so the lock time asserted is never the machine's. */
const COOLDOWN = "75";

/** The limiter's allowed answer — the shape the real one returns. */
const ALLOWED = { allowed: true, reason: "ok", lockSeconds: 60 } as const;

/** A backend reply in the shape the transport hands back. */
const reply = (data: unknown, error?: string) => ({ data, error });

beforeEach(() => {
  headers.__reset({ cookies: { [COOKIE_NAMES.LOCAL]: "gb-en" } });
  HandleAuthedFetch.mockReset();
  captureOtpAttempt.mockClear();
  LogServerError.mockClear();
  resolveOtpIdentity.mockClear();
  resolveOtpIdentity.mockResolvedValue(IDENTITY);
  // Obviously fake, and set here rather than read from the machine: two criteria
  // assert the lock time the action reports, and the action reads it from the
  // environment.
  vi.stubEnv("BACKEND_URL", "https://example.com");
  vi.stubEnv("OTP_COOLDOWN_SECONDS", COOLDOWN);
});

afterEach(() => {
  vi.unstubAllEnvs();
  // The suite-wide reset only forgets calls; it does not drain a queued
  // single-use reply, and it does not restore an implementation. So this file
  // puts the limiter's documented default back itself, or an unconsumed reply
  // would surface in a completely unrelated test file later in the run.
  cacheSpies.otpRateLimit.mockReset();
  cacheSpies.otpRateLimit.mockImplementation(async () => ({ ...ALLOWED }));
});

describe("the real action is what is under test", () => {
  it("loaded the real action, not the run-wide stand-in", async () => {
    expect(vi.isMockFunction(await loadSendOtpAction())).toBe(false);
  });
});

describe("a number that cannot be a number", () => {
  // AC-1. Refused before anything is spent — and the limiter is not consulted,
  // so a hostile caller cannot burn another session's allowance with rubbish.
  //
  // Both ends of the range are here. The long cases are the ones that used to get
  // through: no real shopper can type more than 15 digits (the phone input caps
  // it), so a longer number only ever arrives from a caller posting to the action
  // directly — and each distinct one it sends becomes another member of the
  // per-session number set the limiter counts and stores.
  it.each([
    ["too few digits", "12345"],
    ["nothing at all", ""],
    ["only punctuation", "+++ () --"],
    ["one digit too many", `${LONGEST_ALLOWED}2`],
    ["an absurdly long run of digits", "9".repeat(40)],
  ])("refuses %s without consulting the limiter", async (_case, phone) => {
    await expect(sendOtp({ phone, isWhatsapp: 0 })).resolves.toEqual({
      success: false,
      message: "Invalid Phone Number",
    });

    expect(cacheSpies.otpRateLimit).not.toHaveBeenCalled();
    expect(HandleAuthedFetch).not.toHaveBeenCalled();
  });

  // The guard must reject a long number without also rejecting the longest real
  // one. Both boundaries are asserted, so narrowing the range later fails here
  // rather than in production.
  it.each([
    ["the shortest allowed", SHORTEST_ALLOWED],
    ["the longest allowed", LONGEST_ALLOWED],
  ])("accepts %s number and consults the limiter", async (_case, phone) => {
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await expect(
      sendOtp({ phone, isWhatsapp: 0 }),
    ).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(cacheSpies.otpRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ phone: `+${phone}` }),
    );
  });

  // The range counts digits, not characters. Applying it to the raw input instead
  // would refuse the longest real number as soon as someone typed it with spaces
  // or brackets — which is how most people type a phone number.
  it("counts digits, so heavy punctuation does not push a valid number over", async () => {
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));
    const typed = "+999 (000) 0000-000-01";

    await expect(
      sendOtp({ phone: typed, isWhatsapp: 0 }),
    ).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(typed.length).toBeGreaterThan(LONGEST_ALLOWED.length);
    expect(cacheSpies.otpRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ phone: `+${LONGEST_ALLOWED}` }),
    );
  });
});

describe("the number it passes on", () => {
  // AC-2. One normalised form, whatever was typed.
  it("strips everything that is not a digit and adds a single plus", async () => {
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await sendOtp({ phone: TYPED_PHONE, isWhatsapp: 1 });

    expect(cacheSpies.otpRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ phone: PHONE }),
    );
    const body = JSON.parse(HandleAuthedFetch.mock.calls[0][0].body);
    expect(body).toEqual({ phone: PHONE, is_via_whatsapp: 1 });
  });

  it("sends it to the send-OTP endpoint on the core backend", async () => {
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(HandleAuthedFetch.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        url: `https://example.com${SEND_OTP}`,
        method: "POST",
        local: "gb-en",
      }),
    );
  });
});

describe("the identity the limiter is asked about", () => {
  // AC-10. Pass-through of what the identity layer resolved — never a hash value
  // written into this file, which would commit the effect of a real secret.
  it("is the identity the action resolved", async () => {
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(resolveOtpIdentity).toHaveBeenCalledWith({ ensureUserId: true });
    expect(cacheSpies.otpRateLimit).toHaveBeenCalledWith({
      sid: IDENTITY.sid,
      ip: IDENTITY.ip,
      phone: PHONE,
    });
  });
});

describe("when the limiter refuses", () => {
  // AC-3. Nothing reaches the backend — the whole point of running the limiter
  // before the send rather than after it.
  it("reports the refusal and never calls the backend", async () => {
    cacheSpies.otpRateLimit.mockResolvedValueOnce({
      allowed: false,
      reason: "cooldown",
      lockSeconds: 30,
    });

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        blocked: true,
        reason: "cooldown",
        lockSeconds: 30,
      }),
    );
    expect(HandleAuthedFetch).not.toHaveBeenCalled();
  });

  // AC-4. A person waiting out a cooldown and a person who has hit a cap are told
  // different things, and both are told how long.
  it("says something different for a cooldown than for a cap", async () => {
    cacheSpies.otpRateLimit.mockResolvedValueOnce({
      allowed: false,
      reason: "cooldown",
      lockSeconds: 30,
    });
    const cooldown = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    cacheSpies.otpRateLimit.mockResolvedValueOnce({
      allowed: false,
      reason: "ip_cap",
      lockSeconds: 600,
    });
    const cap = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(cooldown.message).toBe("Please wait 30 seconds before trying again");
    expect(cap.message).toBe(
      "Too many verification requests. Please wait 600 seconds before trying again",
    );
    expect(cooldown.message).not.toBe(cap.message);
  });

  it("still reports a wait when the limiter gives no lock time", async () => {
    cacheSpies.otpRateLimit.mockResolvedValueOnce({
      allowed: false,
      reason: "session_cap",
      lockSeconds: 0,
    });

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(result.lockSeconds).toBe(60);
    expect(result.message).toContain("60 seconds");
  });
});

describe("when the backend answers", () => {
  // AC-5 and AC-6. The verification id arrives in two different shapes depending
  // on the endpoint, and both are the same success to a caller.
  it.each([
    ["nested under data", { data: { verificationId: "v-nested" } }, "v-nested"],
    ["at the top level", { verificationId: "v-flat" }, "v-flat"],
  ])("finds the verification id %s", async (_case, data, expected) => {
    HandleAuthedFetch.mockResolvedValue(reply(data));

    await expect(
      sendOtp({ phone: PHONE, isWhatsapp: 0 }),
    ).resolves.toEqual(
      expect.objectContaining({
        success: true,
        verificationId: expected,
        lockSeconds: Number(COOLDOWN),
      }),
    );
  });

  // AC-7. No id means the send did not happen, and the backend's own words are
  // what the person should see — a throttle message is far more useful than
  // "Failed to send verification code".
  it("passes the backend's message through when there is no verification id", async () => {
    HandleAuthedFetch.mockResolvedValue(
      reply({ message: "This number is blocked" }),
    );

    await expect(
      sendOtp({ phone: PHONE, isWhatsapp: 0 }),
    ).resolves.toEqual({
      success: false,
      message: "This number is blocked",
      lockSeconds: Number(COOLDOWN),
    });
  });

  // The transport encodes a non-2xx as "HTTP <status> <url>: <body>", so the
  // message the person needs is buried inside a string. If this ever stops
  // working, a throttled user sees a generic failure and tries again immediately.
  it("digs the message out of the transport's error text", async () => {
    HandleAuthedFetch.mockResolvedValue(
      reply(
        undefined,
        `HTTP 429 https://example.com${SEND_OTP}: {"message":"Please wait 60 seconds before trying again"}`,
      ),
    );

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Please wait 60 seconds before trying again");
  });

  it("falls back to its own words when the backend gives none", async () => {
    HandleAuthedFetch.mockResolvedValue(reply({}));

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(result).toEqual({
      success: false,
      message: "Failed to send verification code",
      lockSeconds: Number(COOLDOWN),
    });
  });
});

describe("when something unexpected breaks", () => {
  // AC-8. A caller gets an answer, never an exception — a thrown server action
  // would surface to the person as a broken page rather than a failed send.
  it("returns a failed result instead of throwing", async () => {
    resolveOtpIdentity.mockRejectedValueOnce(new Error("identity blew up"));

    await expect(
      sendOtp({ phone: PHONE, isWhatsapp: 0 }),
    ).resolves.toEqual({
      success: false,
      message: "Failed to send verification code",
    });
  });

  it("reports the failure", async () => {
    HandleAuthedFetch.mockRejectedValueOnce(new Error("transport blew up"));

    await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(LogServerError).toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "sendOtpAction" }),
    );
  });
});

describe("what is recorded about every attempt", () => {
  // AC-9. Three outcomes, one record each, under its own name. These records are
  // what the abuse dashboards are built on, so a missing one is invisible until
  // someone needs it.
  it("records a send that went out", async () => {
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await sendOtp({ phone: PHONE, isWhatsapp: 1 });

    expect(captureOtpAttempt).toHaveBeenCalledTimes(1);
    expect(captureOtpAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "sent",
        sid: IDENTITY.sid,
        rawIp: IDENTITY.rawIp,
        normalizedIp: IDENTITY.normalizedIp,
        isWhatsapp: 1,
      }),
    );
  });

  it("records a refusal, with the reason it was refused for", async () => {
    cacheSpies.otpRateLimit.mockResolvedValueOnce({
      allowed: false,
      reason: "ip_cap",
      lockSeconds: 600,
    });

    await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(captureOtpAttempt).toHaveBeenCalledTimes(1);
    expect(captureOtpAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "blocked", reason: "ip_cap" }),
    );
  });

  it.each([
    ["the backend rejected it", { message: "no" }, "backend_rejected"],
    ["there was no id at all", {}, "no_verification_id"],
  ])("records a failure when %s", async (_case, data, reason) => {
    HandleAuthedFetch.mockResolvedValue(reply(data));

    await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(captureOtpAttempt).toHaveBeenCalledTimes(1);
    expect(captureOtpAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "failed", reason }),
    );
  });
});

describe("a number on the test-number allowlist", () => {
  // The exemption exists so the people who have to log in over and over — the
  // manual testers and the live suite, which shares one address for a whole run
  // — are not locked out by rules aimed at the public. The allowlist module is
  // deliberately left REAL here: it is the thing under test, and standing it in
  // would only let the test agree with itself.
  //
  // Every case sets the list from the environment, exactly as a deployment does.
  // The file's `afterEach` clears it, so nothing leaks into the tests above,
  // which all assume no list at all.

  it("is not sent to the limiter, and its send still goes out for real", async () => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001");
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(cacheSpies.otpRateLimit).not.toHaveBeenCalled();
    expect(HandleAuthedFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        verificationId: "v-1",
        // Nothing was counted for this number, so the browser must not invent a
        // lock of its own — zero seconds, and the flag that says why.
        lockSeconds: 0,
        allowlisted: true,
      }),
    );
  });

  // The list is written by a person, in an environment variable. Insisting on
  // one exact spelling is how an exemption silently does nothing.
  it.each([
    ["a leading plus", "+999000000001"],
    ["spaces and brackets", "+999 (000) 000-001"],
    ["several numbers, one of them this one", "963937729850,999000000001"],
    ["untidy separators", " 963937729850 , +999-000-000-001 "],
  ])("is matched on digits alone — %s", async (_case, configured) => {
    vi.stubEnv("OTP_TEST_PHONES", configured);
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await sendOtp({ phone: TYPED_PHONE, isWhatsapp: 0 });

    expect(cacheSpies.otpRateLimit).not.toHaveBeenCalled();
  });

  // The exemption must be exactly as wide as the list and no wider. These two
  // are the cases that would turn the limiter off for everyone.
  it.each([
    ["a number that is not on the list", "963937729850"],
    ["no list configured at all", ""],
  ])("does not exempt %s", async (_case, configured) => {
    vi.stubEnv("OTP_TEST_PHONES", configured);
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(cacheSpies.otpRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ phone: PHONE }),
    );
    expect(result.lockSeconds).toBe(Number(COOLDOWN));
    expect(result.allowlisted).toBeUndefined();
  });

  // A refusal from the backend is still a refusal — the exemption is ours, not
  // the backend's. What it must not do is leave the tester with a locked button
  // for a number our own limiter never counted.
  it("gets no lock when the backend itself refuses the send", async () => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001");
    HandleAuthedFetch.mockResolvedValue(reply({ message: "no" }));

    const result = await sendOtp({ phone: PHONE, isWhatsapp: 0 });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "no",
        lockSeconds: 0,
        allowlisted: true,
      }),
    );
  });

  // The attempt is still recorded, under its own reason. Without it a test
  // number's sends would be invisible on the abuse dashboards — and telling
  // "the testers" apart from "an attacker" is the whole use of that view.
  it("is still recorded, named as a test number", async () => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001");
    HandleAuthedFetch.mockResolvedValue(reply({ data: { verificationId: "v-1" } }));

    await sendOtp({ phone: PHONE, isWhatsapp: 1 });

    expect(captureOtpAttempt).toHaveBeenCalledTimes(1);
    expect(captureOtpAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "sent", reason: "test_phone" }),
    );
  });
});

describe("nothing real was touched", () => {
  // AC-16. The backend helper is a stand-in, so no request was ever built; the
  // reporter and the recorder are stand-ins, so nothing left the process. What is
  // worth checking beyond that is that the suite-wide stand-in for the cache is
  // still in force here — this file lifts the one for the action, and only that
  // one.
  it("still has the suite-wide stand-in for the cache layer", () => {
    expect(vi.isMockFunction(cacheSpies.otpRateLimit)).toBe(true);
  });
});
