// services/notifications.ts — the notifications list and the notification
// types a shopper can choose, both from the core (market) backend.
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchData = vi.hoisted(() => vi.fn());
vi.mock("utils/fetchData", () => ({ fetchData }));
const LogServerError = vi.hoisted(() => vi.fn());
vi.mock("utils/serverErrorReporter", () => ({ LogServerError }));

import { fetchNotifications, getNotificationsTypes } from "services/notifications";

beforeEach(() => vi.clearAllMocks());

describe("fetchNotifications", () => {
  it("asks for the page and returns the answer", async () => {
    fetchData.mockResolvedValue({ success: true, data: [1] });
    expect(await fetchNotifications(3), "the answer was not returned").toEqual({ success: true, data: [1] });
    expect(fetchData.mock.calls[0][0].url, "the wrong page was asked for").toBe("/user-notifications/get?page=3");
  });

  it("reports a refusal and returns nothing", async () => {
    fetchData.mockResolvedValue({ success: false, message: "Unauthorized" });
    expect(await fetchNotifications(1), "a refusal returned something").toBeUndefined();
    expect(LogServerError.mock.calls[0]?.[0]?.scenario, "the market backend refusal was not reported").toBe(
      "Error In fetchNotifications in services/notifications",
    );
  });
});

describe("getNotificationsTypes", () => {
  it("returns the notification types", async () => {
    fetchData.mockResolvedValue({ success: true, data: ["orders"] });
    expect(await getNotificationsTypes(), "the answer was not returned").toEqual({ success: true, data: ["orders"] });
  });

  it("reports a refusal and returns nothing", async () => {
    fetchData.mockResolvedValue({ success: false, message: "down" });
    expect(await getNotificationsTypes(), "a refusal returned something").toBeUndefined();
    expect(LogServerError.mock.calls[0]?.[0]?.scenario, "the market backend refusal was not reported").toBe(
      "Error In getNotificationsTypes in services/notifications",
    );
  });
});
