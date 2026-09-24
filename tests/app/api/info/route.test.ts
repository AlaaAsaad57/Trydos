// @vitest-environment node
//
// The push-token info route: asks Google's instance-id service which topics a
// device token is subscribed to.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonReply, makeMockFetch } from "../../../mocks/mockFetch";

const getAccessToken = vi.fn(async () => ({ access_token: "google-access" }));
const getFirebaseAdminApp = vi.fn(() => ({ options: { credential: { getAccessToken } } }) as any);
vi.mock("utils/firebaseAdmin", () => ({ getFirebaseAdminApp: () => getFirebaseAdminApp() }));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/info/route";

let net: ReturnType<typeof makeMockFetch>;
const request = (query: string) => new NextRequest(`https://trydos.test/api/info${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("the push-token info route", () => {
  it("refuses a call without a token", async () => {
    const response = await GET(request(""));

    expect(response.status, "a call without a token was accepted").toBe(400);
    expect(net.callCount, "Google was asked about no token").toBe(0);
  });

  it("returns the token's topic names and details", async () => {
    net.queueReply(jsonReply({ rel: { topics: { news: {}, deals: {} } } }));

    const response = await GET(request("?token=device-1"));

    expect(net.calls[0].url, "Google was not asked about this token").toBe(
      "https://iid.googleapis.com/iid/info/device-1?details=true",
    );
    expect(net.calls[0].headers.authorization, "the Google call was not authorised").toBe("Bearer google-access");
    await expect(response.json(), "the topic names were not listed").resolves.toMatchObject({
      topics: ["news", "deals"],
    });
  });

  it("returns an empty topic list when the token has none", async () => {
    net.queueReply(jsonReply({}));

    const response = await GET(request("?token=device-1"));

    await expect(response.json(), "a token with no topics did not get an empty list").resolves.toEqual({
      topics: [],
      details: {},
    });
  });

  it("passes Google's refusal status through", async () => {
    net.queueReply(jsonReply({ error: "InvalidToken" }, 404));

    const response = await GET(request("?token=device-1"));

    expect(response.status, "Google's 404 was not passed through").toBe(404);
    await expect(response.json(), "Google's refusal body was not passed through").resolves.toEqual({
      error: "IID API error",
      details: { error: "InvalidToken" },
    });
  });

  it("answers 500 when the server has no Google credential", async () => {
    getFirebaseAdminApp.mockReturnValueOnce({ options: {} });

    const response = await GET(request("?token=device-1"));

    expect(response.status, "a missing credential did not become 500").toBe(500);
    expect(LogServerError, "the missing credential was not reported").toHaveBeenCalled();
  });
});
