// @vitest-environment node
//
// Getting a new session without the visitor noticing. AC-18 to AC-28.
//
// A refresh credential is single-use. Every one of these outcomes exists because
// spending one badly logs a real person out mid-action, and the ways to spend it
// badly are not obvious: two requests can arrive at once and spend it twice; a
// reply can carry half a pair; a rotation can arrive with no profile and quietly
// downgrade a signed-in shopper to a guest; and a context that cannot store a
// cookie can consume a credential it has nowhere to put.
//
// So the tests below check what did NOT happen as often as what did — no
// exchange while signing out, no deletion on a rejection, no profile write
// without a profile in the reply.
//
// TIMEOUTS ARE SET ON PURPOSE. Several tests hold a reply open until they
// release it. If a release is ever missed, the failure should be this file
// timing out in seconds, not the whole run hanging.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeNextHeadersMock } from "../../mocks/nextHeaders";

vi.setConfig({ testTimeout: 5000, hookTimeout: 5000 });

// Two separate request contexts. The framework gives each request its own cookie
// jar, so the tests need more than one to ask what happens when two different
// visitors are being served at the same moment. `active` is which request is
// currently running; it stays on `headers` for every test that only has one.
const headers = makeNextHeadersMock();
const secondVisitor = makeNextHeadersMock();
let active = headers;

vi.mock("next/headers", () => ({
  cookies: () => active.cookies(),
  headers: () => active.headers(),
  draftMode: () => active.draftMode(),
}));

const LogServerError = vi.fn(async () => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: unknown[]) => LogServerError(...(args as [])),
  default: (...args: unknown[]) => LogServerError(...(args as [])),
}));

// Reserved names that cannot resolve anywhere. Backends are named for the ROLE
// they play — the backend that serves verified shoppers is the "core" one, the
// one that serves guests is the "gateway" — never for what they are built with.
const CORE = "https://core.invalid";
const GATEWAY = "https://gateway.invalid";
const CHAT = "https://chat.invalid";
const STORIES = "https://stories.invalid";

const MARKET_PATH = "/auth/refresh-token";
const SERVICE_PATH = "/api/v1/auth/refresh-token";

// Obviously invented credentials. Nothing here came from a real session.
const OLD_REFRESH = "refresh-credential-before-rotation";
const NEW_TOKEN = "session-credential-after-rotation";
const NEW_REFRESH = "refresh-credential-after-rotation";

/** A shopper with a phone number is served by the core backend. */
const VERIFIED_PROFILE = encodeURIComponent(
  JSON.stringify({ id: 501, phone: "+442079460111", name: "Verified For Tests" }),
);
/** A guest has no phone number, so the gateway serves them. */
const GUEST_PROFILE = encodeURIComponent(JSON.stringify({ id: 502, phone: "" }));

/** Every gate a test opened, so `afterEach` can always let them go. */
let openGates: Array<() => void> = [];

/**
 * A network that records what it was asked and answers with what you queued.
 * With `gated: true` a reply is held until the test releases it — that is how
 * two callers can be in flight at the same time.
 */
function makeNetwork(
  replies: Array<{ status?: number; body?: unknown; throws?: string }>,
  options: { gated?: boolean } = {},
) {
  const queue = [...replies];
  const calls: Array<{ url: string; body: any; headers: any }> = [];

  const fetch = vi.fn(async (input: any, init: any = {}) => {
    calls.push({
      url: String(input),
      body: JSON.parse(init?.body || "{}"),
      headers: init?.headers ?? {},
    });

    if (options.gated) {
      await new Promise<void>((resolve) => openGates.push(resolve));
    }

    const next = queue.shift() ?? { status: 200, body: {} };
    if (next.throws) throw new Error(next.throws);

    return {
      ok: (next.status ?? 200) >= 200 && (next.status ?? 200) < 300,
      status: next.status ?? 200,
      json: async () => {
        if (next.body === undefined) throw new Error("not readable as data");
        return next.body;
      },
    };
  });

  return { fetch, calls, get callCount() { return fetch.mock.calls.length; } };
}

/** The reply shape both market backends and the chat service return. */
const wrappedPair = (extra: Record<string, unknown> = {}) => ({
  data: {
    token: NEW_TOKEN,
    access_token: NEW_TOKEN,
    refresh_token: NEW_REFRESH,
    expires_at: "2026-03-01T00:00:00Z",
    ...extra,
  },
});

const seed = (cookies: Record<string, string> = {}, failWrites = false) =>
  headers.__reset({
    cookies: {
      [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: OLD_REFRESH,
      [COOKIE_NAMES.CHAT_REFRESH_TOKEN]: OLD_REFRESH,
      [COOKIE_NAMES.STORIES_REFRESH_TOKEN]: OLD_REFRESH,
      ...cookies,
    },
    failWrites,
  });

/** Fresh module state — only needed where a flight may be left un-settled. */
async function loadFresh() {
  vi.resetModules();
  return import("utils/server/authRefresh");
}

/**
 * Wait until `expected` callers are actually waiting on the network, then let
 * them all go.
 *
 * A single turn of the event loop is not enough: the helper reads cookies and
 * works out which backend serves this visitor before it calls out, and each of
 * those is a step of its own. Releasing too early releases nothing, and the test
 * then waits for a reply that will never be sent.
 *
 * The wait is bounded and fails with a sentence, so a caller that never arrives
 * reads as "only 1 of 2 callers reached the network" instead of a timeout.
 */
/**
 * Wait until `expected` calls have reached the network, WITHOUT releasing them.
 *
 * The two-visitor test needs this. The real framework gives each request its own
 * async context; this file fakes that with one `active` switch, so a request has
 * to finish reading its own cookies before the switch happens or it reads the
 * other visitor's jar. Reaching the network is the proof that it has.
 */
async function waitForCalls(net: { callCount: number }, expected: number) {
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  for (let i = 0; i < 50 && net.callCount < expected; i++) await tick();

  if (net.callCount < expected) {
    throw new Error(
      `only ${net.callCount} of ${expected} call(s) reached the network`,
    );
  }
}

async function releaseWhen(expected: number) {
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  for (let i = 0; i < 50 && openGates.length < expected; i++) await tick();

  if (openGates.length < expected) {
    throw new Error(
      `only ${openGates.length} of ${expected} caller(s) reached the network`,
    );
  }
  openGates.splice(0).forEach((release) => release());
}

beforeEach(() => {
  openGates = [];
  active = headers;
  secondVisitor.__reset();
  seed();
  LogServerError.mockClear();
  vi.stubEnv("BACKEND_URL", CORE);
  vi.stubEnv("GO_BACKEND_URL", GATEWAY);
  vi.stubEnv("NEXT_PUBLIC_CHAT_BACKEND_URL", CHAT);
  vi.stubEnv("STORIES_BACKEND_URL", STORIES);
});

afterEach(() => {
  // Let go of anything still held, so a failed assertion can never leave a
  // pending reply behind for the next test to wait on.
  openGates.splice(0).forEach((release) => release());
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("refusing to exchange at all (AC-18)", () => {
  it("does nothing while the visitor is signing out", async () => {
    seed({ [COOKIE_NAMES.LOGOUT_GUARD]: "1" });
    const net = makeNetwork([]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    // Minting a fresh credential in the middle of signing out would bring the
    // session back to life a moment after the visitor asked to end it.
    await expect(refreshMarketSession()).resolves.toEqual({
      status: "ineligible",
    });
    expect(net.callCount).toBe(0);
  });

  it("does nothing when there is no stored refresh credential", async () => {
    headers.__reset({ cookies: {} });
    const net = makeNetwork([]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await expect(refreshMarketSession()).resolves.toEqual({
      status: "no-token",
    });
    expect(net.callCount).toBe(0);
  });
});

describe("when the exchange is refused (AC-19)", () => {
  it("reports it as invalid and leaves the stored credential alone", async () => {
    const net = makeNetwork([{ status: 401, body: {} }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    const outcome = await refreshMarketSession();

    expect(outcome).toEqual({ status: "invalid" });
    // The call really happened — this is not the "no credential" path wearing
    // the same answer.
    expect(net.callCount).toBe(1);

    // A rejected credential stays in the jar, and that is deliberate: a
    // rejection cannot tell "this is dead" from "someone else already rotated
    // it", and deleting the winner's fresh credential would sign out a visitor
    // who was fine. The cost is that a genuinely dead credential is carried
    // until the expire route clears it. Reviewed and kept — the reasoning and
    // what would really fix it are written up in REFRESH-FLOWS.md.
    expect(headers.__deletes).not.toContain(COOKIE_NAMES.MARKET_REFRESH_TOKEN);
    expect(headers.__cookieJar[COOKIE_NAMES.MARKET_REFRESH_TOKEN]).toBe(
      OLD_REFRESH,
    );
  });
});

describe("when the exchange cannot be completed (AC-20)", () => {
  it("reports a dropped connection as unavailable, and says so", async () => {
    const net = makeNetwork([{ throws: "connection reset" }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    const outcome = await refreshMarketSession();

    expect(outcome).toEqual({ status: "unavailable" });
    // The address really was asked for. Without this the same answer would come
    // back from a helper that never built a usable address at all.
    expect(net.calls[0].url).toBe(`${GATEWAY}${MARKET_PATH}`);
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });

  it("reports a server error as unavailable, and says so", async () => {
    const net = makeNetwork([{ status: 500, body: { message: "upstream down" } }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    expect(await refreshMarketSession()).toEqual({ status: "unavailable" });
    expect(net.calls[0].url).toBe(`${GATEWAY}${MARKET_PATH}`);
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });

  it("reports a reply it cannot read as unavailable, and says so", async () => {
    const net = makeNetwork([{ status: 200, body: undefined }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    expect(await refreshMarketSession()).toEqual({ status: "unavailable" });
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["only a session credential", { data: { token: NEW_TOKEN } }],
    ["only a refresh credential", { data: { refresh_token: NEW_REFRESH } }],
    ["neither", { data: {} }],
  ])("refuses to store a reply carrying %s", async (_name, body) => {
    const net = makeNetwork([{ status: 200, body }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    expect(await refreshMarketSession()).toEqual({ status: "unavailable" });
    // Half a pair is worse than none: storing it would leave the visitor with a
    // session that cannot be renewed, and the old credential already spent.
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)).toBeUndefined();
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });
});

describe("a successful exchange (AC-21, AC-22, AC-23)", () => {
  it("stores both halves together, each with its own lifetime", async () => {
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");
    const { SECURE_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } = await import(
      "utils/server/tokenManager"
    );

    const outcome = await refreshMarketSession();

    expect(outcome).toEqual({ status: "refreshed", token: NEW_TOKEN });
    expect(net.calls[0].body).toEqual({ refresh_token: OLD_REFRESH });

    const session = headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN);
    const refresh = headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN);

    expect(session?.value).toBe(NEW_TOKEN);
    expect(refresh?.value).toBe(NEW_REFRESH);
    // Both hidden from the browser; the storage for the longer-lived credential
    // outlives the session it renews, or it expires before it can be used.
    expect(session?.options).toMatchObject({ httpOnly: true });
    expect(refresh?.options).toMatchObject({ httpOnly: true });
    expect(session?.options.maxAge).toBe(SECURE_COOKIE_OPTIONS.maxAge);
    expect(refresh?.options.maxAge).toBe(REFRESH_COOKIE_OPTIONS.maxAge);
    expect(Number(refresh?.options.maxAge)).toBeGreaterThan(
      Number(session?.options.maxAge),
    );
  });

  it("updates the stored profile when the reply carries one", async () => {
    const net = makeNetwork([
      { status: 200, body: wrappedPair({ user: { id: 501, name: "Renamed" } }) },
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await refreshMarketSession();

    const profile = headers.__lastWrite(COOKIE_NAMES.USER_DATA);
    expect(decodeURIComponent(String(profile?.value))).toContain("Renamed");
  });

  it("leaves the stored profile alone when the reply carries none", async () => {
    // This is the guard against a silent downgrade: one backend does not return
    // a profile on a rotation, and writing an empty one would turn a signed-in
    // shopper into a guest at the exact moment their session was renewed.
    seed({ [COOKIE_NAMES.USER_DATA]: VERIFIED_PROFILE });
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await refreshMarketSession();

    expect(headers.__lastWrite(COOKIE_NAMES.USER_DATA)).toBeUndefined();
    expect(headers.__cookieJar[COOKIE_NAMES.USER_DATA]).toBe(VERIFIED_PROFILE);
  });

  it("says so loudly when the rotated pair could not be stored", async () => {
    // The caller promised this context can store cookies. If it could not, a
    // single-use credential has just been spent with nowhere to put its
    // replacement — the visitor is about to be signed out and nobody would know
    // why unless this is reported.
    seed({}, true);
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    const outcome = await refreshMarketSession();

    expect(outcome).toEqual({ status: "refreshed", token: NEW_TOKEN });
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });
});

describe("asking the backend that serves this visitor (AC-24, AC-25)", () => {
  it("sends a verified shopper to the core backend", async () => {
    seed({ [COOKIE_NAMES.USER_DATA]: VERIFIED_PROFILE });
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await refreshMarketSession();

    expect(net.calls[0].url).toBe(`${CORE}${MARKET_PATH}`);
  });

  it.each([
    ["a guest with no phone number", GUEST_PROFILE],
    ["a visitor with no stored profile at all", undefined],
  ])("sends %s to the gateway", async (_name, profile) => {
    seed(profile ? { [COOKIE_NAMES.USER_DATA]: profile } : {});
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await refreshMarketSession();

    expect(net.calls[0].url).toBe(`${GATEWAY}${MARKET_PATH}`);
  });

  it("carries the visitor's own language and country", async () => {
    // The exchange also updates the stored locale. Sending nothing would reset a
    // Turkish shopper to the defaults behind their back.
    seed({ [COOKIE_NAMES.LOCAL]: "tr-tr" });
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await refreshMarketSession();

    expect(net.calls[0].headers).toMatchObject({ Lang: "tr", Country: "tr" });
  });

  it("falls back to the default locale when none is stored", async () => {
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await import("utils/server/authRefresh");

    await refreshMarketSession();

    expect(net.calls[0].headers).toMatchObject({ Lang: "en", Country: "gb" });
  });
});

describe("the chat and stories sessions (AC-18 to AC-22)", () => {
  it("exchanges a chat credential and rotates the chat pair only", async () => {
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshChatSession } = await import("utils/server/authRefresh");

    const outcome = await refreshChatSession();

    expect(outcome).toEqual({ status: "refreshed", token: NEW_TOKEN });
    expect(net.calls[0].url).toBe(`${CHAT}${SERVICE_PATH}`);
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)?.value).toBe(NEW_TOKEN);
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_REFRESH_TOKEN)?.value).toBe(
      NEW_REFRESH,
    );
    // A chat rotation must not touch the shopper's own session.
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toBeUndefined();
  });

  it("exchanges a stories credential and rotates the stories pair only", async () => {
    const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshStoriesSession } = await import("utils/server/authRefresh");

    const outcome = await refreshStoriesSession();

    expect(outcome).toEqual({ status: "refreshed", token: NEW_TOKEN });
    expect(net.calls[0].url).toBe(`${STORIES}${SERVICE_PATH}`);
    expect(headers.__lastWrite(COOKIE_NAMES.STORIES_TOKEN)?.value).toBe(NEW_TOKEN);
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toBeUndefined();
  });

  it.each([
    ["chat", "refreshChatSession"],
    ["stories", "refreshStoriesSession"],
  ])("does not exchange a %s credential while signing out", async (_n, fn) => {
    seed({ [COOKIE_NAMES.LOGOUT_GUARD]: "1" });
    const net = makeNetwork([]);
    vi.stubGlobal("fetch", net.fetch);
    const refresh: any = await import("utils/server/authRefresh");

    await expect(refresh[fn]()).resolves.toEqual({ status: "ineligible" });
    expect(net.callCount).toBe(0);
  });

  it.each([
    ["chat", "refreshChatSession", COOKIE_NAMES.CHAT_REFRESH_TOKEN],
    ["stories", "refreshStoriesSession", COOKIE_NAMES.STORIES_REFRESH_TOKEN],
  ])("keeps a rejected %s credential in the jar", async (_n, fn, cookie) => {
    const net = makeNetwork([{ status: 401, body: {} }]);
    vi.stubGlobal("fetch", net.fetch);
    const refresh: any = await import("utils/server/authRefresh");

    await expect(refresh[fn]()).resolves.toEqual({ status: "invalid" });
    expect(headers.__deletes).not.toContain(cookie);
  });
});

// The chat and stories helpers walk the same ladder as the shopper one, against
// their own hosts and their own cookies. Testing them by hand twice invites the
// two copies to drift apart, which is exactly how one of them ends up missing a
// branch the other has.
const SERVICES = [
  {
    name: "chat",
    call: "refreshChatSession",
    base: CHAT,
    refreshCookie: COOKIE_NAMES.CHAT_REFRESH_TOKEN,
    sessionCookie: COOKIE_NAMES.CHAT_TOKEN,
  },
  {
    name: "stories",
    call: "refreshStoriesSession",
    base: STORIES,
    refreshCookie: COOKIE_NAMES.STORIES_REFRESH_TOKEN,
    sessionCookie: COOKIE_NAMES.STORIES_TOKEN,
  },
] as const;

describe.each(SERVICES)(
  "the $name session, the rest of the ladder (AC-18 to AC-23)",
  ({ call, base, refreshCookie, sessionCookie }) => {
    const load = async () => (await import("utils/server/authRefresh")) as any;

    it("does nothing when there is no stored credential for it", async () => {
      // The other services keep theirs, so this proves the helper reads its own
      // cookie rather than any refresh cookie it can find.
      seed();
      headers.__cookieJar[refreshCookie] = "";
      delete headers.__cookieJar[refreshCookie];
      const net = makeNetwork([]);
      vi.stubGlobal("fetch", net.fetch);

      await expect((await load())[call]()).resolves.toEqual({
        status: "no-token",
      });
      expect(net.callCount).toBe(0);
    });

    it("reports a dropped connection as unavailable, and says so", async () => {
      const net = makeNetwork([{ throws: "connection reset" }]);
      vi.stubGlobal("fetch", net.fetch);

      await expect((await load())[call]()).resolves.toEqual({
        status: "unavailable",
      });
      expect(net.calls[0].url).toBe(`${base}${SERVICE_PATH}`);
      expect(LogServerError).toHaveBeenCalledTimes(1);
    });

    it("reports a server error as unavailable, and says so", async () => {
      const net = makeNetwork([{ status: 503, body: { message: "down" } }]);
      vi.stubGlobal("fetch", net.fetch);

      await expect((await load())[call]()).resolves.toEqual({
        status: "unavailable",
      });
      expect(LogServerError).toHaveBeenCalledTimes(1);
    });

    it("reports a reply it cannot read as unavailable, and says so", async () => {
      const net = makeNetwork([{ status: 200, body: undefined }]);
      vi.stubGlobal("fetch", net.fetch);

      await expect((await load())[call]()).resolves.toEqual({
        status: "unavailable",
      });
      expect(LogServerError).toHaveBeenCalledTimes(1);
    });

    it("refuses to store a reply carrying half a pair", async () => {
      const net = makeNetwork([
        { status: 200, body: { data: { access_token: NEW_TOKEN } } },
      ]);
      vi.stubGlobal("fetch", net.fetch);

      await expect((await load())[call]()).resolves.toEqual({
        status: "unavailable",
      });
      expect(headers.__lastWrite(sessionCookie)).toBeUndefined();
      expect(LogServerError).toHaveBeenCalledTimes(1);
    });

    it("carries the visitor's own language and country", async () => {
      seed({ [COOKIE_NAMES.LOCAL]: "tr-tr" });
      const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
      vi.stubGlobal("fetch", net.fetch);

      await (await load())[call]();

      expect(net.calls[0].headers).toMatchObject({ Lang: "tr", Country: "tr" });
    });

    it("says so loudly when the rotated pair could not be stored", async () => {
      seed({}, true);
      const net = makeNetwork([{ status: 200, body: wrappedPair() }]);
      vi.stubGlobal("fetch", net.fetch);

      await expect((await load())[call]()).resolves.toEqual({
        status: "refreshed",
        token: NEW_TOKEN,
      });
      expect(LogServerError).toHaveBeenCalledTimes(1);
    });
  },
);

describe("when there is no request to read at all", () => {
  // A helper called outside a request — a build step, a stray import — must fail
  // through like any other unavailable exchange rather than throwing into the
  // caller and taking the page with it.
  const brokenContext = {
    cookies: () => Promise.reject(new Error("no request to read")),
    headers: () => Promise.reject(new Error("no request to read")),
    draftMode: () => Promise.reject(new Error("no request to read")),
  };

  it.each([
    ["the shopper session", "refreshMarketSession"],
    ["the chat session", "refreshChatSession"],
    ["the stories session", "refreshStoriesSession"],
  ])("reports %s as unavailable rather than throwing", async (_name, call) => {
    const net = makeNetwork([]);
    vi.stubGlobal("fetch", net.fetch);
    const refresh: any = await import("utils/server/authRefresh");
    active = brokenContext as unknown as typeof headers;

    await expect(refresh[call]()).resolves.toEqual({ status: "unavailable" });
    expect(net.callCount).toBe(0);
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });
});

describe("the stories reply arriving in either shape (AC-28)", () => {
  it("reads a pair returned at the top level", async () => {
    // What the service returns today from its refresh call.
    const net = makeNetwork([
      {
        status: 200,
        body: { access_token: NEW_TOKEN, refresh_token: NEW_REFRESH },
      },
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshStoriesSession } = await import("utils/server/authRefresh");

    expect(await refreshStoriesSession()).toEqual({
      status: "refreshed",
      token: NEW_TOKEN,
    });
  });

  it("reads a pair returned inside a wrapper", async () => {
    // What the SAME service returns from its sign-in call. The two disagree, so
    // the reader accepts both and neither shape can silently stop working.
    const net = makeNetwork([
      {
        status: 200,
        body: { data: { access_token: NEW_TOKEN, refresh_token: NEW_REFRESH } },
      },
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshStoriesSession } = await import("utils/server/authRefresh");

    expect(await refreshStoriesSession()).toEqual({
      status: "refreshed",
      token: NEW_TOKEN,
    });
  });

  it("prefers the top-level pair when a reply somehow carries both", async () => {
    const net = makeNetwork([
      {
        status: 200,
        body: {
          access_token: NEW_TOKEN,
          refresh_token: NEW_REFRESH,
          data: { access_token: "wrapped-token", refresh_token: "wrapped-refresh" },
        },
      },
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { refreshStoriesSession } = await import("utils/server/authRefresh");

    expect(await refreshStoriesSession()).toEqual({
      status: "refreshed",
      token: NEW_TOKEN,
    });
  });
});

describe("two callers at once (AC-26, AC-27)", () => {
  // These are the tests that can leave a flight un-settled, so this block starts
  // from a fresh copy of the module each time. The blocks above share one import
  // on purpose: an awaited call always clears its own flight.
  it("spends one credential, not one per caller", async () => {
    const net = makeNetwork([{ status: 200, body: wrappedPair() }], {
      gated: true,
    });
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await loadFresh();

    const first = refreshMarketSession();
    const second = refreshMarketSession();
    await releaseWhen(1);
    const [a, b] = await Promise.all([first, second]);

    // Two requests hit a rejected session at the same moment. If both exchanged,
    // the second would spend a credential the first had already used, and the
    // visitor would be signed out by the very thing meant to keep them in.
    expect(net.callCount).toBe(1);
    expect(a).toEqual(b);
  });

  it("lets a later caller exchange again once the first is done", async () => {
    const net = makeNetwork(
      [
        { status: 200, body: wrappedPair() },
        { status: 200, body: wrappedPair() },
      ],
      { gated: true },
    );
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await loadFresh();

    const first = refreshMarketSession();
    await releaseWhen(1);
    await first;

    const second = refreshMarketSession();
    await releaseWhen(1);
    await second;

    expect(net.callCount).toBe(2);
  });

  it("never shares an exchange with a DIFFERENT visitor served at the same time", async () => {
    // REGRESSION. The flight used to be a single variable held for the life of
    // the server process, while a cookie jar lives for one request — so two
    // people served by the same instance at the same moment shared an exchange,
    // and the second was handed the FIRST one's freshly minted credential. The
    // caller puts that token straight onto its own retry, so visitor B's request
    // went out carrying visitor A's credential, and B's session was never really
    // renewed. Sharing is now keyed on the credential being spent.
    const net = makeNetwork(
      [
        { status: 200, body: wrappedPair({ token: "visitor-a-new-token" }) },
        { status: 200, body: wrappedPair({ token: "visitor-b-new-token" }) },
      ],
      { gated: true },
    );
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await loadFresh();

    // Visitor A's request begins its exchange.
    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "visitor-a-refresh" },
    });
    active = headers;
    const requestA = refreshMarketSession();
    // A is held at the network, so it has finished reading its own jar.
    await waitForCalls(net, 1);

    // Visitor B — a different person, a different jar — asks while A is still
    // in flight.
    secondVisitor.__reset({
      cookies: { [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "visitor-b-refresh" },
    });
    active = secondVisitor;
    const requestB = refreshMarketSession();

    await releaseWhen(2);
    const [outcomeA, outcomeB] = await Promise.all([requestA, requestB]);

    // Each visitor spent their own credential, in their own exchange.
    expect(net.callCount).toBe(2);
    expect(net.calls.map((call) => call.body.refresh_token).sort()).toEqual([
      "visitor-a-refresh",
      "visitor-b-refresh",
    ]);

    // And each was given back their own, not the other's.
    expect(outcomeA).toEqual({ status: "refreshed", token: "visitor-a-new-token" });
    expect(outcomeB).toEqual({ status: "refreshed", token: "visitor-b-new-token" });
    expect(outcomeA).not.toEqual(outcomeB);

    // B's own session really was renewed, in B's own jar.
    expect(secondVisitor.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      "visitor-b-new-token",
    );
  });

  it("still shares when the same visitor asks twice at once", async () => {
    // The other half of the fix: the saved round trip is the whole point, and a
    // single-use credential must not be spent twice for one person.
    const net = makeNetwork(
      [{ status: 200, body: wrappedPair() }, { status: 200, body: wrappedPair() }],
      { gated: true },
    );
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession } = await loadFresh();

    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "one-visitor-refresh" },
    });
    const first = refreshMarketSession();
    const second = refreshMarketSession();
    await releaseWhen(1);
    const [a, b] = await Promise.all([first, second]);

    expect(net.callCount).toBe(1);
    expect(a).toEqual(b);
  });

  it("never lets one service's exchange stand in for another's", async () => {
    // Each service holds its OWN credential pair. Sharing a flight would hand a
    // chat caller the shopper's answer, and it would retry with a credential
    // nobody had renewed.
    const net = makeNetwork(
      [
        { status: 200, body: wrappedPair() },
        { status: 200, body: wrappedPair() },
        { status: 200, body: wrappedPair() },
      ],
      { gated: true },
    );
    vi.stubGlobal("fetch", net.fetch);
    const { refreshMarketSession, refreshChatSession, refreshStoriesSession } =
      await loadFresh();

    const all = Promise.all([
      refreshMarketSession(),
      refreshChatSession(),
      refreshStoriesSession(),
    ]);
    await releaseWhen(3);
    await all;

    expect(net.callCount).toBe(3);
    expect(net.calls.map((call) => call.url).sort()).toEqual(
      [
        `${CHAT}${SERVICE_PATH}`,
        `${GATEWAY}${MARKET_PATH}`,
        `${STORIES}${SERVICE_PATH}`,
      ].sort(),
    );
  });
});
