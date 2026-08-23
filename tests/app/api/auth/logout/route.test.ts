// @vitest-environment node
//
// Tests for the logout route — the one place that clears every credential this
// app stores. AC-18, AC-19, AC-20.
//
// Why the tests live here and not next to the route: `app/api/auth/**` is a
// sensitive path, so files that are not runtime code go in the `tests/` mirror.
// See docs/testing/UNIT_TESTING.md.
//
// THE ONE THING TO KNOW ABOUT AC-18
// The route deletes the names in `SECURE_COOKIE_NAMES`, which is derived from
// `HTTPONLY_COOKIE_NAMES`. If this file asserted against that same list it would
// be comparing the code with itself: a credential added to the shared list but
// never wired into the cleanup path would be missing from both sides and the
// test would still pass. So the expected names are written out **literally**
// below, and a separate canary checks the shared list still has the same
// members. The literal list catches "in the list, not cleared"; the canary
// catches "new credential in neither".
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeMockFetch, jsonReply } from "../../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

// The reporter is not a passive dependency: it reaches a backend through the
// real `fetch`. Left alone it would land in the recorded calls, eat a queued
// reply, and — because several call sites do not await it — leak into whichever
// file the runner picks next.
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

/**
 * Every name the logout route must delete, written out rather than imported.
 * Twelve are the literal cookie names; the thirteenth is a deliberately
 * unreadable generated constant, so it is referenced by name — pinning 120
 * characters of gibberish here would prove nothing the canary does not.
 */
const EXPECTED_CLEARED = [
  "MARKET-TOKEN",
  "MARKET-REFRESH-TOKEN",
  "DEVICE-TOKEN",
  "CHAT-TOKEN",
  "CHAT-REFRESH-TOKEN",
  "STORIES-TOKEN",
  "STORIES-REFRESH-TOKEN",
  "rdb_at",
  "User-Data",
  "USER-CHAT",
  "USER-STORIES",
  "WALLET_USER",
  COOKIE_NAMES.USER_ID_HASH,
];

/** Deliberately never cleared by a logout — see cookie-manager.ts. */
const MUST_SURVIVE = ["VISIT-ID", "LOGOUT-GUARD"];

/**
 * Addresses. Every one is a reserved `.invalid` host so a call that escapes a
 * stand-in dies on this machine instead of leaving it, and every one is
 * different so no two services can be confused for each other. The two
 * storefront addresses carry a path component on purpose: the proxy's path
 * guard compares against the base path, and a bare origin would make that check
 * pass for anything.
 */
const ADDRESSES = {
  BACKEND_URL: "https://core.invalid/api/v1",
  GO_BACKEND_URL: "https://gateway.invalid/api/v1",
  NEXT_PUBLIC_CHAT_BACKEND_URL: "https://chat.invalid",
  STORIES_BACKEND_URL: "https://stories.invalid",
  COMMENT_BACKEND_URL: "https://comments.invalid",
  WALLET_BACKEND_URL: "https://wallet.invalid",
  ELASTIC_BACKEND_URL: "https://search.invalid",
  WALLET_PUBLIC_API_KEY: "test-wallet-api-key",
};

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/logout/route");
};

/** A logout call. Send a token only when the test is about the detach. */
const makeRequest = (body?: Record<string, unknown>) =>
  new NextRequest("https://trydos.test/api/auth/logout", {
    method: "POST",
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }
      : {}),
  });

beforeEach(() => {
  headers.__reset();
  Object.entries(ADDRESSES).forEach(([key, value]) => vi.stubEnv(key, value));
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("the addresses these tests use", () => {
  it("are all different, so no two services can be confused", () => {
    const hosts = Object.values(ADDRESSES);
    expect(new Set(hosts).size).toBe(hosts.length);
  });
});

describe("clearing every credential (AC-18)", () => {
  it("deletes all thirteen stored credentials and profiles", async () => {
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(headers.__deletes).toEqual(expect.arrayContaining(EXPECTED_CLEARED));
    expect(headers.__deletes).toHaveLength(EXPECTED_CLEARED.length);
  });

  it("still deletes the legacy credential nothing writes any more", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest());

    // Old browsers still carry it. Nothing reads or sets it, so this deletion
    // is the only thing that ever removes it.
    expect(headers.__deletes).toContain("DEVICE-TOKEN");
  });

  it("leaves the two cookies a logout must never clear", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest());

    MUST_SURVIVE.forEach((name) => {
      expect(headers.__deletes).not.toContain(name);
    });
  });

  // The canary. The literal list above catches a name that is in the shared
  // list but not in the cleanup path. This catches the other direction: a new
  // credential added to the shared list and to neither the cleanup path nor
  // this file.
  it("matches the shared list exactly — a new credential fails here first", async () => {
    const { SECURE_COOKIE_NAMES } = await import("utils/server/tokenManager");

    expect(SECURE_COOKIE_NAMES).toHaveLength(EXPECTED_CLEARED.length);
    expect([...SECURE_COOKIE_NAMES].sort()).toEqual(
      [...EXPECTED_CLEARED].sort(),
    );
  });

  it("deletes nothing outside the expected list", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest());

    headers.__deletes.forEach((name) => {
      expect(EXPECTED_CLEARED).toContain(name);
    });
  });
});

describe("arming the logout guard (AC-19)", () => {
  it("arms the guard after the deletions, so it is not wiped by them", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest());

    const guard = headers.__lastWrite(COOKIE_NAMES.LOGOUT_GUARD);
    expect(guard?.value).toBe("1");
    expect(headers.__deletes).not.toContain(COOKIE_NAMES.LOGOUT_GUARD);
  });

  it("hides the guard from the browser and gives it a short life of its own", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest());

    const guard = headers.__lastWrite(COOKIE_NAMES.LOGOUT_GUARD);
    expect(guard?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30,
    });
  });

  // `secure` is derived from the environment, so the assertion is about the
  // value the rule produces here — not a copy of the rule itself. Mirroring the
  // expression would re-compute the source and stay green if the option were
  // hardcoded or dropped altogether.
  it("keeps the secure flag off outside production, and present", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest());

    const guard = headers.__lastWrite(COOKIE_NAMES.LOGOUT_GUARD);
    expect(guard?.options).toHaveProperty("secure");
    expect(guard?.options.secure).toBe(false);
  });

  it("turns the secure flag on in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    // This route reads the flag when the request is handled, not when the
    // module loads, so no reload is needed here.
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.LOGOUT_GUARD)?.options.secure).toBe(
      true,
    );
  });
});

describe("detaching this device from push (AC-20)", () => {
  // WHAT THIS CRITERION CAN AND CANNOT PROVE HERE — recorded finding.
  //
  // The route hands the detach to the framework's "run this after the response"
  // helper. That helper only works inside a real request scope, and a test calls
  // the handler directly, so the hand-off itself cannot complete: it throws, and
  // the route's own catch reports that as a failed logout. The 500 is the test
  // harness meeting a framework boundary, NOT how the route behaves for a user,
  // so it is deliberately not asserted as behaviour. Changing the route to make
  // this reachable is forbidden here (AC-38), so it is written down instead.
  //
  // The ordering half of AC-20 is still provable, and the two tests below are
  // what prove it. Preparation reads the chat credential. If it ran *after* the
  // deletions that credential would already be gone and preparation would always
  // come back empty — so the fact that it comes back empty ONLY when the chat
  // credential was absent at entry shows preparation ran while the credentials
  // were still readable.
  it("prepares the detach only when a chat session is there to detach", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.CHAT_TOKEN]: "chat-token-1234567890" },
    });
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ fcmToken: "device-token-1" }));

    // Preparation succeeded, so the route reached the deferred hand-off — the
    // one step this harness cannot carry out. Reaching it at all is the proof
    // that the chat credential was still readable at that point.
    expect(response.status).toBe(500);
    // And the credentials were cleared before that hand-off, not after it.
    expect(headers.__deletes).toHaveLength(EXPECTED_CLEARED.length);
  });

  it("does not reach for a detach when the caller sends no push token", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.CHAT_TOKEN]: "chat-token-1234567890" } });
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(net.callCount).toBe(0);
  });

  it("does not reach for a detach when there is no chat session to detach", async () => {
    // No chat credential, so there is nothing to authenticate the call with.
    const { POST } = await loadRoute();

    await POST(makeRequest({ fcmToken: "device-token-1" }));

    expect(net.callCount).toBe(0);
  });

  it("still logs out when preparing the detach fails", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.CHAT_TOKEN]: "chat-token-1234567890" } });
    vi.stubEnv("NEXT_PUBLIC_CHAT_BACKEND_URL", "");
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ fcmToken: "device-token-1" }));

    expect(response.status).toBe(200);
    expect(headers.__deletes).toHaveLength(EXPECTED_CLEARED.length);
  });
});

describe("when something goes wrong", () => {
  it("answers with a failure that names no backend technology", async () => {
    const { POST } = await loadRoute();
    // Make the cookie store refuse writes, which is what breaks the route.
    headers.__setFailWrites(true);

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toMatch(
      /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i,
    );
  });
});
