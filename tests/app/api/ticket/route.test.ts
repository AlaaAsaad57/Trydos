// @vitest-environment node
//
// The media ticket route: trades the shopper's market credential for a
// short-lived media-server ticket.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { jsonReply, makeMockFetch } from "../../../mocks/mockFetch";

import { POST } from "app/api/ticket/route";

let net: ReturnType<typeof makeMockFetch>;

const request = (headers: Record<string, string>, body: unknown = { folder: "f", story: "s", count: 2 }) =>
  new NextRequest("https://trydos.test/api/ticket", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("the media ticket route", () => {
  it("refuses a call with no credential in the header or the cookie", async () => {
    const response = await POST(request({}));

    expect(response.status, "a call with no credential was accepted").toBe(401);
    expect(net.callCount, "the media server was asked without a credential").toBe(0);
  });

  it("asks the media server with the header credential and returns the ticket", async () => {
    net.queueReply(jsonReply({ ticket: "t-1" }));

    const response = await POST(request({ authorization: "Bearer header-cred" }));

    expect(net.calls[0].url, "the ticket was not asked from the media server").toBe(
      "https://example.com/gated/ticket",
    );
    expect(net.calls[0].headers.authorization, "the header credential was not sent").toBe("Bearer header-cred");
    expect(net.calls[0].body, "the folder, story and count were not sent").toEqual({ folder: "f", story: "s", count: 2 });
    await expect(response.json(), "the ticket was not returned").resolves.toEqual({ success: true, ticket: "t-1" });
  });

  it("falls back to the market cookie when there is no header credential", async () => {
    net.queueReply(jsonReply({ ticket: "t-1" }));

    await POST(request({ cookie: `${COOKIE_NAMES.MARKET_TOKEN}=cookie-cred` }));

    expect(net.calls[0].headers.authorization, "the cookie credential was not sent").toBe("Bearer cookie-cred");
  });

  it("passes the media server's refusal and status through", async () => {
    net.queueReply(jsonReply({ reason: "no access" }, 403));

    const response = await POST(request({ authorization: "Bearer header-cred" }));

    expect(response.status, "the media server's 403 was not passed through").toBe(403);
    await expect(response.json(), "the refusal body was not passed through").resolves.toEqual({
      success: false,
      message: "Failed to get ticket",
      reason: "no access",
    });
  });

  it("answers 500 when the media server returns no ticket", async () => {
    net.queueReply(jsonReply({}));

    const response = await POST(request({ authorization: "Bearer header-cred" }));

    expect(response.status, "an answer with no ticket did not become 500").toBe(500);
  });

  it("answers 500 with the error text when the media server cannot be reached", async () => {
    net.queueReply({ kind: "failure", error: new Error("media down") });

    const response = await POST(request({ authorization: "Bearer header-cred" }));

    expect(response.status, "a dropped media call did not become 500").toBe(500);
    expect((await response.json()).message, "the error text was not used").toBe("media down");
  });

  // The fallback text was copied from the subscribe route: a failed ticket
  // request tells the caller it failed to subscribe to a topic.
  it("BUG-app-2: a failure with no message names the ticket, not a topic subscription", async () => {
    net.queueReply({ kind: "failure", error: new Error("") });

    const response = await POST(request({ authorization: "Bearer header-cred" }));

    expect((await response.json()).message, "the fallback text names the wrong operation").toBe(
      "Failed to get ticket",
    );
  });
});
