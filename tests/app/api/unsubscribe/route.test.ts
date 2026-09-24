// @vitest-environment node
//
// The push-topic unsubscribe route.
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

const request = (body: unknown) =>
  new NextRequest("https://trydos.test/api/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  unsubscribeFromTopic.mockResolvedValue({});
});

describe("the push-topic unsubscribe route", () => {
  it.each([{ token: "d1" }, { topic: "deals" }])("refuses a call missing a field: %o", async (body) => {
    const response = await POST(request(body));

    expect(response.status, "a call missing the token or topic was accepted").toBe(400);
    expect(unsubscribeFromTopic, "a device was unsubscribed with a missing field").not.toHaveBeenCalled();
  });

  it("unsubscribes the device from the topic", async () => {
    const response = await POST(request({ token: "d1", topic: "deals" }));

    expect(unsubscribeFromTopic, "the device was not unsubscribed").toHaveBeenCalledWith("d1", "deals");
    await expect(response.json(), "the answer did not say success").resolves.toEqual({ success: true });
  });

  it("answers 500 with the error text, or a fallback", async () => {
    unsubscribeFromTopic.mockRejectedValueOnce(new Error("bad token"));
    const failed = await POST(request({ token: "d1", topic: "deals" }));
    expect(failed.status, "a Firebase failure did not become 500").toBe(500);
    expect((await failed.json()).message, "the error text was not used").toBe("bad token");

    unsubscribeFromTopic.mockRejectedValueOnce(undefined);
    expect(
      (await (await POST(request({ token: "d1", topic: "deals" }))).json()).message,
      "the fallback text was not used",
    ).toBe("Failed to unsubscribe from topic");
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });
});
