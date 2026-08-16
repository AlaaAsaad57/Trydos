// @vitest-environment node
//
// The record of every send attempt that reaches the server. AC-15 to AC-17.
//
// WHY THE ORDER OF THIS FILE IS DELIBERATE
// This recorder is silent by design in three different ways: it does nothing
// outside production, nothing without an analytics key, and it swallows every
// error so analytics can never break a sign-in. That makes it very easy to write
// a test suite that passes while proving nothing — the runner is not production
// and its analytics key is empty, so "it did nothing" is the default answer to
// every question.
//
// So the recording path is written FIRST and everything else is measured against
// it. A silence test only means something once we have seen this file make a
// call at all.
//
// The deferred work is flushed inside the test body, on purpose. The real
// after-response hook runs the callback once the reply has been sent; if a test
// let that callback settle on its own, it could land after the suite had torn
// its fake network down — and then the swallow-everything rule turns a real
// outbound request to the analytics service into a passing test. Nothing here is
// allowed to leave the process: the check in `afterEach` fails the test if any
// deferred work is still sitting in the queue.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { failureReply, jsonReply, makeMockFetch } from "../../mocks/mockFetch";

/** Deferred work handed to the after-response hook, held until a test runs it. */
const deferred: Array<() => unknown> = [];
let afterThrows = false;

vi.mock("next/server", () => ({
  after: (callback: () => unknown) => {
    if (afterThrows) {
      // What the real hook does when there is no request to defer against.
      throw new Error("`after` was called outside a request scope");
    }
    deferred.push(callback);
  },
}));

/** Run everything the recorder deferred, and say how much there was. */
async function flushDeferred() {
  const queued = deferred.splice(0);
  for (const callback of queued) await callback();
  return queued.length;
}

// Obviously invented, and self-describing. The key is not a real project key and
// the addresses are from the range reserved for documentation.
const ANALYTICS_KEY = "phc_key_for_tests_not_real";
const CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/";

const attempt = (overrides: Record<string, unknown> = {}) => ({
  outcome: "blocked" as const,
  reason: "session_cap",
  rawIp: "203.0.113.7",
  normalizedIp: "203.0.113.7",
  sid: "session-key-for-tests",
  isWhatsapp: 1,
  ...overrides,
});

beforeEach(() => {
  afterThrows = false;
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", ANALYTICS_KEY);
});

afterEach(() => {
  // Nothing may be left to settle after the test that created it. If this fires,
  // a deferred call could have gone out for real once the fake network stopped.
  expect(deferred).toHaveLength(0);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("recording an attempt (AC-16)", () => {
  it("sends the outcome, the reason, both addresses and the session key", async () => {
    const net = makeMockFetch([jsonReply({ status: 1 })]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(
      attempt({
        outcome: "blocked",
        reason: "ip_cap",
        rawIp: "203.0.113.7",
        normalizedIp: "203.0.113.0",
        sid: "session-key-for-tests",
        isWhatsapp: 1,
      }),
    );
    expect(await flushDeferred()).toBe(1);

    expect(net.calls).toHaveLength(1);
    expect(net.calls[0].url).toBe(CAPTURE_URL);
    expect(net.calls[0].method).toBe("POST");

    const sent = net.calls[0].body;
    expect(sent.api_key).toBe(ANALYTICS_KEY);
    expect(sent.event).toBe("otp_send_attempt");
    // The session key is the identity, not the phone number and not an account
    // id — it is what survives the rotation the limiter is defending against.
    expect(sent.distinct_id).toBe("session-key-for-tests");
    expect(sent.properties).toMatchObject({
      outcome: "blocked",
      block_reason: "ip_cap",
      // The real address, carried as an ordinary property. The automatic one is
      // discarded when the event is taken in, which is the entire reason this
      // server-side record exists.
      ip: "203.0.113.7",
      normalized_ip: "203.0.113.0",
      is_whatsapp: true,
      source: "server_action",
    });
  });

  it("does not create a person, and does not look up the server's location", async () => {
    const net = makeMockFetch([jsonReply({ status: 1 })]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(attempt());
    await flushDeferred();

    // Without these two, every send attempt would build a person record (cost)
    // and would be placed at the SERVER's location, which is worse than useless
    // on an event whose whole point is the caller's address.
    expect(net.calls[0].body.properties.$process_person_profile).toBe(false);
    expect(net.calls[0].body.properties.$geoip_disable).toBe(true);
  });

  it.each([
    ["a code that was sent", "sent"],
    ["a send the limiter blocked", "blocked"],
    ["a send the backend refused", "failed"],
  ])("records %s", async (_name, outcome) => {
    const net = makeMockFetch([jsonReply({ status: 1 })]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(attempt({ outcome }));
    await flushDeferred();

    expect(net.calls[0].body.properties.outcome).toBe(outcome);
  });

  it("reads the delivery channel as a plain yes or no", async () => {
    const net = makeMockFetch([jsonReply({ status: 1 }), jsonReply({ status: 1 })]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    // The caller passes this straight through from a form, so it arrives as text
    // as often as a number.
    captureOtpAttempt(attempt({ isWhatsapp: "1" }));
    captureOtpAttempt(attempt({ isWhatsapp: "0" }));
    await flushDeferred();

    expect(net.calls[0].body.properties.is_whatsapp).toBe(true);
    expect(net.calls[1].body.properties.is_whatsapp).toBe(false);
  });
});

describe("staying out of the way (AC-17)", () => {
  it("returns before the record is sent, so the code is not held up", async () => {
    const net = makeMockFetch([jsonReply({ status: 1 })]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(attempt());

    // The call has been arranged but not made: the visitor is not waiting on the
    // analytics service to get their code.
    expect(deferred).toHaveLength(1);
    expect(net.calls).toHaveLength(0);

    expect(await flushDeferred()).toBe(1);
    expect(net.calls).toHaveLength(1);
  });

  it("swallows a failure from the analytics service", async () => {
    const net = makeMockFetch([failureReply("analytics unreachable")]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(attempt());

    // The deferred work rejecting must not become an unhandled rejection or a
    // failed send. It is analytics; the code still has to reach the visitor.
    await expect(flushDeferred()).resolves.toBe(1);
    expect(net.calls).toHaveLength(1);
  });

  it("swallows being called where there is nothing to defer against", async () => {
    afterThrows = true;
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    expect(() => captureOtpAttempt(attempt())).not.toThrow();
    expect(net.calls).toHaveLength(0);
  });
});

describe("staying silent where it should (AC-15)", () => {
  // These are only meaningful because the tests above proved this file DOES make
  // a call when it is supposed to. Read on their own they would pass against a
  // recorder that had been deleted.
  it("does nothing outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(attempt());

    expect(deferred).toHaveLength(0);
    expect(net.calls).toHaveLength(0);
  });

  it("does nothing when no analytics key is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);
    const { captureOtpAttempt } = await import("utils/server/otpTelemetry");

    captureOtpAttempt(attempt());

    expect(deferred).toHaveLength(0);
    expect(net.calls).toHaveLength(0);
  });
});
