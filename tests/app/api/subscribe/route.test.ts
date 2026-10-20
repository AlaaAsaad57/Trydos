// @vitest-environment node
//
// The push-topic subscribe route. A shop's order topic has a guessable name,
// so the route must know who asks and check that they belong to that shop
// before it subscribes a device (A1-6).
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const subscribeToTopic = vi.fn();
vi.mock("utils/firebaseAdmin", () => ({
  getFirebaseMessaging: () => ({ subscribeToTopic }),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { POST } from "app/api/subscribe/route";

const CORE = "https://core.invalid/api/v1";
const TOPIC = "shop_7_order";

// Every request carries the session cookie unless a test says otherwise.
const request = (body: unknown, cookie: string | null = "MARKET-TOKEN=session") =>
  new NextRequest("https://trydos.test/api/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });

const fetchMock = vi.fn();

/** The core backend's answer to the shop list: these shops, with these
 *  permissions. A fresh Response per call, because a body can be read once. */
const shopsAre = (shops: unknown[], status = 200) =>
  fetchMock.mockImplementation(async () =>
    new Response(JSON.stringify({ data: shops }), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BACKEND_URL", CORE);
  vi.stubGlobal("fetch", fetchMock);
  subscribeToTopic.mockResolvedValue({});
  shopsAre([{ seller_id: 7, permissions: ["READ_ORDERS"] }]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the push-topic subscribe route", () => {
  it("refuses a caller with no session before asking anybody", async () => {
    const response = await POST(request({ token: "d1", topic: TOPIC }, null));

    expect(response.status, "a caller with no session was accepted").toBe(401);
    expect(fetchMock, "the shop list was asked for a caller with no session").not.toHaveBeenCalled();
    expect(subscribeToTopic, "a device was subscribed for a caller with no session").not.toHaveBeenCalled();
  });

  it.each([{ token: "d1" }, { topic: TOPIC }])("refuses a call missing a field: %o", async (body) => {
    const response = await POST(request(body));

    expect(response.status, "a call missing the token or topic was accepted").toBe(400);
    expect(subscribeToTopic, "a device was subscribed with a missing field").not.toHaveBeenCalled();
  });

  it("refuses a topic that is not a shop order topic", async () => {
    const response = await POST(request({ token: "d1", topic: "deals" }));

    expect(response.status, "a topic outside the shop order topics was accepted").toBe(403);
    expect(fetchMock, "the shop list was asked for a topic that can never be allowed").not.toHaveBeenCalled();
    expect(subscribeToTopic, "a device was subscribed to a topic outside the shop order topics").not.toHaveBeenCalled();
  });

  it("asks the core backend for the shopper's shops with the session, then subscribes", async () => {
    const response = await POST(request({ token: "d1", topic: TOPIC }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url, "the shop list was not asked from the core backend").toBe(`${CORE}/shop/auth/permissions`);
    expect(init.headers.Authorization, "the shop list was not asked with the session").toBe("Bearer session");
    expect(subscribeToTopic, "the device was not subscribed to the topic").toHaveBeenCalledWith("d1", TOPIC);
    await expect(response.json(), "the answer did not say success").resolves.toEqual({ success: true });
  });

  it("accepts the order-detail topic of the same shop", async () => {
    await POST(request({ token: "d1", topic: "shop_7_order_detail" }));

    expect(subscribeToTopic, "the order-detail topic was not subscribed").toHaveBeenCalledWith("d1", "shop_7_order_detail");
  });

  it("refuses a shop the shopper is not a member of", async () => {
    shopsAre([{ seller_id: 8, permissions: ["READ_ORDERS"] }]);

    const response = await POST(request({ token: "d1", topic: TOPIC }));

    expect(response.status, "a shop the shopper is not in was accepted").toBe(403);
    expect(subscribeToTopic, "a device was subscribed to another shop's orders").not.toHaveBeenCalled();
  });

  it("refuses a member with no order permission", async () => {
    shopsAre([{ seller_id: 7, permissions: ["READ_SHOP_INFO"] }]);

    const response = await POST(request({ token: "d1", topic: TOPIC }));

    expect(response.status, "a member with no order permission was accepted").toBe(403);
    expect(subscribeToTopic, "a device was subscribed without an order permission").not.toHaveBeenCalled();
  });

  it("refuses when the core backend refuses the session", async () => {
    shopsAre([], 401);

    const response = await POST(request({ token: "d1", topic: TOPIC }));

    expect(response.status, "a refused session still got the topic").toBe(403);
    expect(subscribeToTopic, "a device was subscribed on a refused session").not.toHaveBeenCalled();
  });

  it("answers 503 when the core backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));

    const response = await POST(request({ token: "d1", topic: TOPIC }));

    expect(response.status, "an unreachable core backend did not become 503").toBe(503);
    expect(LogServerError, "the unreachable core backend was not reported").toHaveBeenCalled();
    expect(subscribeToTopic, "a device was subscribed with no shop list").not.toHaveBeenCalled();
  });

  it("answers 500 with the error text, or a fallback", async () => {
    subscribeToTopic.mockRejectedValueOnce(new Error("bad token"));
    const failed = await POST(request({ token: "d1", topic: TOPIC }));
    expect(failed.status, "a Firebase failure did not become 500").toBe(500);
    expect((await failed.json()).message, "the error text was not used").toBe("bad token");

    subscribeToTopic.mockRejectedValueOnce(undefined);
    expect(
      (await (await POST(request({ token: "d1", topic: TOPIC }))).json()).message,
      "the fallback text was not used",
    ).toBe("Failed to subscribe to topic");
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });
});
