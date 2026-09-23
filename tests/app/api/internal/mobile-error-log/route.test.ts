// @vitest-environment node
//
// The client error sink: it forwards a browser error to the gateway's error
// log, with a snapshot of the session cookies.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { jsonReply, makeMockFetch } from "../../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

const POST = async (req: NextRequest) =>
  (await import("app/api/internal/mobile-error-log/route")).POST(req);

let net: ReturnType<typeof makeMockFetch>;

const request = (body?: string) =>
  new NextRequest("https://trydos.test/api/internal/mobile-error-log", {
    method: "POST",
    ...(body === undefined ? {} : { body, headers: { "content-type": "application/json" } }),
  });

/** The error record the route sent to the gateway. */
const sentRecord = () => JSON.parse(net.calls[0].body.error_description);

beforeEach(() => {
  headers.__reset();
  vi.stubEnv("GO_BACKEND_URL", "https://gateway.invalid/api/v1");
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the client error sink", () => {
  it("forwards an error object to the gateway's error log, marked as web", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "m", other: "x" } });
    net.queueReply(jsonReply({}));

    const response = await POST(request(JSON.stringify({ error: { message: "boom", code: 7 } })));

    expect(response.status, "the sink did not answer 200").toBe(200);
    expect(net.calls[0].url, "the error did not go to the gateway's error store").toBe(
      "https://gateway.invalid/api/v1/mobile_error_log/store",
    );
    expect(sentRecord(), "the record did not carry the error, the web mark and the cookie snapshot").toMatchObject({
      platform: "\u{1F6D1}WEB\u{1F6D1}",
      message: "boom",
      code: 7,
      chatToken: null,
      cookiesSnapshot: { other: "x" },
    });
  });

  it("wraps an error that is not an object in a message field", async () => {
    net.queueReply(jsonReply({}));

    await POST(request(JSON.stringify({ error: "plain text" })));

    expect(sentRecord().message, "a text error was not kept as the message").toContain("plain text");
  });

  it("still logs something when the body is not JSON", async () => {
    net.queueReply(jsonReply({}));

    const response = await POST(request("not json"));

    expect(response.status, "a body that is not JSON broke the sink").toBe(200);
    expect(sentRecord().platform, "nothing was forwarded for a body that is not JSON").toBe("\u{1F6D1}WEB\u{1F6D1}");
  });

  it("answers 500 when the gateway cannot be reached", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    net.queueReply({ kind: "failure", error: new Error("gateway down") });

    const response = await POST(request(JSON.stringify({ error: {} })));

    expect(response.status, "a dropped gateway call did not become 500").toBe(500);
    await expect(response.json(), "the failure answer was not success:false").resolves.toEqual({ success: false });
    consoleError.mockRestore();
  });
});
