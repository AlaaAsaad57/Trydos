// @vitest-environment node
//
// The push-topic unsubscribe route. It needs a session and accepts only the
// shop order topics (A1-6); a device token cannot be guessed, so leaving a
// topic needs no membership check.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const unsubscribeFromTopic = vi.fn();
vi.mock("utils/firebaseAdmin", () => ({
  getFirebaseMessaging: () => ({ unsubscribeFromTopic }),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { POST } from "app/api/unsubscribe/route";

const TOPIC = "shop_7_order";

// Every request carries the session cookie unless a test says otherwise.
const request = (body: unknown, cookie: string | null = "MARKET-TOKEN=session") =>
  new NextRequest("https://trydos.test/api/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  unsubscribeFromTopic.mockResolvedValue({});
});

describe("the push-topic unsubscribe route", () => {
  it("refuses a caller with no session", async () => {
    const response = await POST(request({ token: "d1", topic: TOPIC }, null));

    expect(response.status, "a caller with no session was accepted").toBe(401);
    expect(unsubscribeFromTopic, "a device was unsubscribed for a caller with no session").not.toHaveBeenCalled();
  });

  it.each([{ token: "d1" }, { topic: TOPIC }])("refuses a call missing a field: %o", async (body) => {
    const response = await POST(request(body));

    expect(response.status, "a call missing the token or topic was accepted").toBe(400);
    expect(unsubscribeFromTopic, "a device was unsubscribed with a missing field").not.toHaveBeenCalled();
  });

  it("refuses a topic that is not a shop order topic", async () => {
    const response = await POST(request({ token: "d1", topic: "deals" }));

    expect(response.status, "a topic outside the shop order topics was accepted").toBe(403);
    expect(unsubscribeFromTopic, "a device was unsubscribed from a topic outside the shop order topics").not.toHaveBeenCalled();
  });

  it("unsubscribes the device from the topic", async () => {
    const response = await POST(request({ token: "d1", topic: TOPIC }));

    expect(unsubscribeFromTopic, "the device was not unsubscribed").toHaveBeenCalledWith("d1", TOPIC);
    await expect(response.json(), "the answer did not say success").resolves.toEqual({ success: true });
  });

  it("answers 500 with the error text, or a fallback", async () => {
    unsubscribeFromTopic.mockRejectedValueOnce(new Error("bad token"));
    const failed = await POST(request({ token: "d1", topic: TOPIC }));
    expect(failed.status, "a Firebase failure did not become 500").toBe(500);
    expect((await failed.json()).message, "the error text was not used").toBe("bad token");

    unsubscribeFromTopic.mockRejectedValueOnce(undefined);
    expect(
      (await (await POST(request({ token: "d1", topic: TOPIC }))).json()).message,
      "the fallback text was not used",
    ).toBe("Failed to unsubscribe from topic");
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });
});
