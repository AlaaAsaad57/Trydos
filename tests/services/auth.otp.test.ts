// Sending a code, verifying it, and verifying a changed number.
//
// Every assertion about state reads the state afterwards, through the REAL auth
// slice (tests/mocks/authStore.ts) — not "was this action called". What matters
// is where the shopper ends up: signed in, marked verified, one attempt fewer.
//
// This file does NOT reset the module registry between tests: nothing it touches
// keeps state at module scope. What it does reset, every test, is the store and
// the two stand-ins it queues replies on — see `beforeEach`.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeMockFetch, jsonReply } from "tests/mocks/mockFetch";
import { queueReplies, SEND_OTP_NO_REPLY } from "tests/mocks/authGraph";

vi.mock("store", async () => {
  const { makeAuthStoreModule } = await import("tests/mocks/authStore");
  return makeAuthStoreModule();
});
vi.mock("serverActions/sendOtp", async () => (await import("tests/mocks/authGraph")).makeSendOtpMock());
vi.mock("utils/functions", async () => (await import("tests/mocks/authGraph")).makeFunctionsMock());
vi.mock("utils/otpLocks", async () => (await import("tests/mocks/authGraph")).makeOtpLocksMock());
vi.mock("utils/fetchData", async () => (await import("tests/mocks/authGraph")).makeFetchDataMock());
vi.mock("utils/authMe", async () => (await import("tests/mocks/authGraph")).makeAuthMeMock());
vi.mock("utils/gtag", async () => (await import("tests/mocks/authGraph")).makeGtagMock());
vi.mock("utils/posthog", async () => (await import("tests/mocks/authGraph")).makePosthogMock());
vi.mock("utils/orderFunnel", async () => (await import("tests/mocks/authGraph")).makeOrderFunnelMock());
vi.mock("utils/GAEvents", async () => (await import("tests/mocks/authGraph")).makeGaEventNamesMock());
vi.mock("utils/Requests", async () => (await import("tests/mocks/authGraph")).makeRequestsMock());
vi.mock("utils/serverErrorReporter", async () => (await import("tests/mocks/authGraph")).makeErrorReporterMock());
vi.mock("utils/UploadUtils", async () => (await import("tests/mocks/authGraph")).makeUploadUtilsMock());
vi.mock("utils/cookies/cookie-manager", async () => (await import("tests/mocks/authGraph")).makeCookieNamesMock());
vi.mock("@/store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("services/home", async () => (await import("tests/mocks/authGraph")).makeHomeServiceMock());
vi.mock("services/story", async () => (await import("tests/mocks/authGraph")).makeStoryServiceMock());
vi.mock("services/wallet", async () => (await import("tests/mocks/authGraph")).makeWalletMock());

const auth = (await import("services/auth")).default;
const store = await import("store");
const sendOtp = await import("serverActions/sendOtp");
const otpLocks = await import("utils/otpLocks");
const funnel = await import("utils/orderFunnel");
const gtag = await import("utils/gtag");
const reporter = await import("utils/serverErrorReporter");
const notifications = await import("@/store/notifications/reducer");
const fetchDataModule = await import("utils/fetchData");

/** The reply queue for the request helper. Its default is a loud failure, so an
 *  unplanned call cannot pass quietly (NFR-4). */
let market: ReturnType<typeof queueReplies>;
let net: ReturnType<typeof makeMockFetch>;

const PHONE = "+905551112233";

beforeEach(() => {
  // The store lives in a `vi.mock` factory and outlives a test — reset it, or
  // `attempts` and the user records leak into the next one.
  (store as any).__resetAuthStore();

  // Reset and re-arm the two stand-ins this file queues replies on. A plain
  // `clearAllMocks` keeps queued implementations, so a one-off reply would
  // survive into the next test.
  (sendOtp.sendOtpAction as any).mockReset();
  (sendOtp.sendOtpAction as any).mockResolvedValue(SEND_OTP_NO_REPLY);
  (fetchDataModule.fetchData as any).mockReset();
  market = queueReplies(fetchDataModule.fetchData, "fetchData");

  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);

  // `_getLocale` reads the address bar; jsdom's default would silently give the
  // fallback country instead of the one under test.
  window.history.replaceState({}, "", "/gb-en/checkout");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("sending a code", () => {
  it("records the verification id, starts the cooldown the server asked for, and counts the number (AC-1)", async () => {
    (sendOtp.sendOtpAction as any).mockResolvedValue({
      success: true,
      verificationId: "vid-1",
      message: "sent",
      lockSeconds: 90,
    });

    const id = await auth.SendOtp(PHONE, 0, vi.fn());

    expect(id).toBe("vid-1");
    expect(store.useAppStore.getState().verficationID).toBe("vid-1");
    expect(otpLocks.lockNumber).toHaveBeenCalledWith(PHONE, 90);
    expect(otpLocks.recordSessionNumber).toHaveBeenCalledWith(PHONE);
  });

  it("falls back to the documented default cooldown when the server names none (AC-2)", async () => {
    (sendOtp.sendOtpAction as any).mockResolvedValue({
      success: true,
      verificationId: "vid-2",
      message: "sent",
    });

    await auth.SendOtp(PHONE, 1, vi.fn());

    expect(otpLocks.lockNumber).toHaveBeenCalledWith(PHONE, 120);
  });

  // The server exempts a configured test number from its own limiter and counts
  // nothing for it. The browser mirror has to step aside too: if it locked the
  // button anyway, the tester would still be stopped for a minute and the
  // exemption would look broken — by the one half of it that the server cannot
  // see.
  it("mirrors no lock and counts nothing when the server says the number is allowlisted", async () => {
    (sendOtp.sendOtpAction as any).mockResolvedValue({
      success: true,
      verificationId: "vid-test",
      message: "sent",
      lockSeconds: 0,
      allowlisted: true,
    });

    const id = await auth.SendOtp(PHONE, 0, vi.fn());

    expect(id).toBe("vid-test");
    expect(store.useAppStore.getState().verficationID).toBe("vid-test");
    expect(otpLocks.lockNumber).not.toHaveBeenCalled();
    expect(otpLocks.recordSessionNumber).not.toHaveBeenCalled();
  });

  it("still starts the cooldown when the send is refused with one, and reports the refusal (AC-3)", async () => {
    (sendOtp.sendOtpAction as any).mockResolvedValue({
      success: false,
      message: "Too many requests",
      lockSeconds: 300,
    });
    const onError = vi.fn();

    await expect(auth.SendOtp(PHONE, 0, onError)).rejects.toThrow("Too many requests");

    expect(otpLocks.lockNumber).toHaveBeenCalledWith(PHONE, 300);
    expect(otpLocks.recordSessionNumber).not.toHaveBeenCalled();
    expect(store.useAppStore.getState().wrongNumber).toBe("Too many requests");
    expect(onError).toHaveBeenCalled();
  });

  it("reports, calls the caller's error hook and raises when the send never reaches the server — and starts no cooldown (AC-4)", async () => {
    (sendOtp.sendOtpAction as any).mockRejectedValue(new Error("network down"));
    const onError = vi.fn();

    await expect(auth.SendOtp(PHONE, 0, onError)).rejects.toThrow("network down");

    expect(otpLocks.lockNumber).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(reporter.LogServerError).toHaveBeenCalled();
    // The screen is left with a reason. It used to be overwritten with the empty
    // string the method started with, so a send that never reached the server
    // showed nothing at all.
    expect(store.useAppStore.getState().wrongNumber).toBe(
      "Failed to send verification code",
    );
  });
});

/** A reply the login route would send for a correct code. */
function loginReply(overrides: Record<string, any> = {}) {
  return {
    code: 200,
    success: true,
    isSuccessful: true,
    data: {
      already_exists: true,
      user: { id: 7, name: "Ada", phone: PHONE, image: "ada.png", id_token: "tok-7" },
      ...(overrides.data ?? {}),
    },
    ChatUser: { id: "c1" },
    StoriesUser: { id: "s1" },
    WalletUser: { id: "w1" },
    ...overrides,
  };
}

describe("verifying a code", () => {
  it("writes all four service records, each marked verified (AC-5)", async () => {
    market.reply(loginReply());

    await auth.VerifyOtp("123456", "vid-1");

    const s = store.useAppStore.getState();
    expect(s.user).toMatchObject({ id: 7, name: "Ada", is_verified: 1, is_phone_verified: 1 });
    expect(s.userChat).toMatchObject({ id: "c1", is_verified: 1, is_phone_verified: 1, need_auth: false });
    expect(s.userStories).toMatchObject({ id: "s1", is_verified: 1, is_phone_verified: 1, need_auth: false });
    expect(s.userWallet).toMatchObject({ id: "w1", is_verified: 1, is_phone_verified: 1, need_auth: false });
  });

  it("releases the re-verification wait and clears the prompt marker (AC-6)", async () => {
    (store as any).__resetAuthStore({ shouldAuthinticated: "expired", reAuthResult: "pending" });
    market.reply(loginReply());

    await auth.VerifyOtp("123456", "vid-1");

    const s = store.useAppStore.getState();
    expect(s.reAuthResult).toBe("success");
    expect(s.shouldAuthinticated).toBe(false);
  });

  it("reports the guest-to-user mapping only when the id actually changed (AC-7)", async () => {
    (store as any).__resetAuthStore({ userProfile: { id: 3 } });
    market.reply(loginReply());

    await auth.VerifyOtp("123456", "vid-1");

    expect(gtag.GAevent).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { user_id_guest: 3, user_id_verify: 7 },
      }),
    );
  });

  it("does not report a mapping when the shopper was already this user (AC-7)", async () => {
    (store as any).__resetAuthStore({ userProfile: { id: 7 } });
    market.reply(loginReply());

    await auth.VerifyOtp("123456", "vid-1");

    expect(gtag.GAevent).not.toHaveBeenCalled();
  });

  it("reports back whether the account already existed, and under what name (AC-8)", async () => {
    market.reply(loginReply({ data: { already_exists: false, user: { id: 7, name: "Grace" } } }));

    const result = await auth.VerifyOtp("123456", "vid-1");

    expect(result).toEqual([false, "Grace"]);
  });

  it("leaves a message and spends NO attempt when the user is unknown (AC-9)", async () => {
    market.reply({ code: 200, success: false, data: { message: "user not found" } });

    await expect(auth.VerifyOtp("123456", "vid-1")).rejects.toThrow("user not found");

    const s = store.useAppStore.getState();
    expect(s.wrongNumber).toBe("user not found");
    expect(s.attempts).toBe(4);
    expect(s.failedLogin).toBe(false);
  });

  it("spends an attempt and flags the failure on a wrong code (AC-10)", async () => {
    market.reply({ isSuccessful: false, success: false, data: {} });

    await expect(auth.VerifyOtp("000000", "vid-1")).rejects.toThrow();

    const s = store.useAppStore.getState();
    expect(s.attempts).toBe(3);
    expect(s.failedLogin).toBe(true);
  });

  it("shows the refusal and raises when the server rejects the code outright (AC-10)", async () => {
    market.reply({ code: 501, success: false, message: "code expired" });

    await expect(auth.VerifyOtp("000000", "vid-1")).rejects.toThrow();

    expect(notifications.showErrorNotification).toHaveBeenCalledWith("code expired");
    expect(store.useAppStore.getState().attempts).toBe(3);
  });

  it("reports a failed verification with the flow it was opened from (AC-11)", async () => {
    (store as any).__resetAuthStore({ shouldAuthinticated: "expired" });
    market.reply({ isSuccessful: false, success: false, data: {} });

    await expect(auth.VerifyOtp("000000", "vid-1")).rejects.toThrow();

    expect(funnel.resolveVerifyFlowSource).toHaveBeenCalledWith("expired");
    expect(funnel.trackOrder).toHaveBeenCalledWith(
      "verify_otp_failed",
      expect.objectContaining({ flow_source: "expired" }),
    );
  });
});

describe("verifying a changed number", () => {
  it("marks the phone verified, mirrors it to the profile copy, and returns the one-time token (AC-12)", async () => {
    market.reply({ success: true, isSuccessful: true, data: { id_token: "one-time-token" } });
    net.queueReply(jsonReply({ ok: true }));

    const token = await auth.VerifyOtpForUpdatePhone("123456", "vid-9");

    expect(token).toBe("one-time-token");
    expect(store.useAppStore.getState().userProfile).toMatchObject({ is_phone_verified: 1 });
    expect(net.calls[0].url).toBe("/api/auth/update-user");
    expect(net.calls[0].body.updates).toEqual([
      { name: "User-Data", value: { is_phone_verified: 1 } },
    ]);
  });

  it("fails WITHOUT marking the phone verified when the reply carries no token (AC-12)", async () => {
    // No token means the server did not confirm the number. The explicit check
    // that stops here is the whole point: without it, an unconfirmed reply would
    // mark the shopper's phone verified in the state AND in the stored profile
    // copy before anything failed.
    market.reply({ success: true, isSuccessful: true });

    await expect(auth.VerifyOtpForUpdatePhone("123456", "vid-9")).rejects.toThrow();

    expect(store.useAppStore.getState().userProfile).toBeNull();
    expect(net.calls).toHaveLength(0);
  });

  it("shows its own wording, never a raw internal error (AC-12)", async () => {
    // The catch used to hand `error.message` straight to the screen, so an
    // unexpected failure showed the engine's own untranslated text.
    market.reply({ success: true, isSuccessful: true });

    await expect(auth.VerifyOtpForUpdatePhone("123456", "vid-9")).rejects.toThrow();

    expect(store.useAppStore.getState().wrongNumber).toBe("Something went wrong");
  });

  it("encodes the code and the verification id into the query (AC-12)", async () => {
    let seen: any = null;
    market.reply((args: any) => {
      seen = args;
      return { success: true, isSuccessful: true, data: { id_token: "t" } };
    });
    net.queueReply(jsonReply({ ok: true }));

    await auth.VerifyOtpForUpdatePhone("12&34#56", "vid 9");

    // A separator in either value can no longer add parameters upstream.
    expect(seen.url).toContain("12%2634%2356");
    expect(seen.url).toContain("vid%209");
  });

  it("carries the code and the verification id to the call (AC-12)", async () => {
    // FINDING (implement.md): both values are interpolated into the query string
    // with no encoding, so a separator character in either can add parameters
    // upstream. Pinned as it behaves today — this asserts the values are
    // carried, NOT the literal URL, so the encoding fix will not read as a
    // regression.
    let seen: any = null;
    market.reply((args: any) => {
      seen = args;
      return { success: true, isSuccessful: true, data: { id_token: "t" } };
    });
    net.queueReply(jsonReply({ ok: true }));

    await auth.VerifyOtpForUpdatePhone("123456", "vid-9");

    expect(seen.url).toContain("123456");
    expect(seen.url).toContain("vid-9");
    expect(seen.server).toBe("market");
  });
});
