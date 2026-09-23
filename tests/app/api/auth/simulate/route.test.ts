// @vitest-environment node
//
// The tester-only simulate route: it writes the session cookies it is handed
// and deletes the ones it is not handed.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/simulate/route");
};

const makeRequest = (body: unknown) =>
  new NextRequest("https://trydos.test/api/auth/simulate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

beforeEach(() => headers.__reset());
afterEach(() => vi.clearAllMocks());

describe("the simulate route", () => {
  it("writes every cookie it is handed, with a 30-minute life", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({
        userData: { id: 3 },
        userChat: "already-a-string",
        userStories: { id: 9 },
        marketToken: "m",
        chatToken: "c",
        chatRefreshToken: "cr",
        storiesToken: "s",
        storiesRefreshToken: "sr",
        walletToken: "w",
        userIdHash: "h",
      }),
    );

    expect(response.status, "the simulate route did not answer 200").toBe(200);
    expect(
      JSON.parse(decodeURIComponent(headers.__lastWrite(COOKIE_NAMES.USER_DATA)!.value)),
      "the profile was not stored as encoded JSON",
    ).toEqual({ id: 3 });
    expect(
      decodeURIComponent(headers.__lastWrite(COOKIE_NAMES.USER_CHAT)!.value),
      "a profile given as a string was not stored as it came",
    ).toBe("already-a-string");
    for (const [name, value] of [
      [COOKIE_NAMES.MARKET_TOKEN, "m"],
      [COOKIE_NAMES.CHAT_TOKEN, "c"],
      [COOKIE_NAMES.CHAT_REFRESH_TOKEN, "cr"],
      [COOKIE_NAMES.STORIES_TOKEN, "s"],
      [COOKIE_NAMES.STORIES_REFRESH_TOKEN, "sr"],
      [COOKIE_NAMES.WALLET_TOKEN, "w"],
      [COOKIE_NAMES.USER_ID_HASH, "h"],
    ]) {
      expect(headers.__lastWrite(name)?.value, `${name} was not written as handed`).toBe(value);
    }
    expect(
      headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.options,
      "the simulated cookie is not http-only, strict and 30 minutes long",
    ).toMatchObject({ httpOnly: true, sameSite: "strict", path: "/", maxAge: 1800 });
    expect(headers.__deletes, "a cookie that was handed in was also deleted").toEqual([]);
  });

  it("deletes every session cookie it is not handed", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest({}));

    for (const name of [
      COOKIE_NAMES.USER_CHAT,
      COOKIE_NAMES.USER_STORIES,
      COOKIE_NAMES.MARKET_TOKEN,
      COOKIE_NAMES.CHAT_TOKEN,
      COOKIE_NAMES.CHAT_REFRESH_TOKEN,
      COOKIE_NAMES.STORIES_TOKEN,
      COOKIE_NAMES.STORIES_REFRESH_TOKEN,
      COOKIE_NAMES.WALLET_TOKEN,
      COOKIE_NAMES.USER_ID_HASH,
    ]) {
      expect(headers.__deletes, `${name} was not deleted when it was not handed`).toContain(name);
    }
    expect(
      headers.__lastWrite(COOKIE_NAMES.USER_DATA),
      "a profile was written although none was handed",
    ).toBeUndefined();
  });
});
