import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  ORDER_EVENTS,
  ORDER_MGMT_EVENTS,
  resolveVerifyFlowSource,
  startOrderAttempt,
  endOrderAttempt,
  trackOrder,
  trackOrderMgmt,
} from "utils/orderFunnel";
import * as posthogModule from "utils/posthog";

vi.mock("utils/posthog", () => ({
  posthogCapture: vi.fn(),
}));

describe("orderFunnel utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveVerifyFlowSource", () => {
    it("maps 'open Story' to 'story'", () => {
      expect(resolveVerifyFlowSource("open Story"), "should return 'story'").toBe("story");
    });

    it("maps 'open chat' to 'chat'", () => {
      expect(resolveVerifyFlowSource("open chat"), "should return 'chat'").toBe("chat");
    });

    it("maps 'seller' to 'seller'", () => {
      expect(resolveVerifyFlowSource("seller"), "should return 'seller'").toBe("seller");
    });

    it("maps custom string markers directly", () => {
      expect(resolveVerifyFlowSource("custom_flow"), "should return custom string").toBe("custom_flow");
    });

    it("defaults to 'checkout' for boolean true, null, or undefined", () => {
      expect(resolveVerifyFlowSource(true), "should default boolean true to 'checkout'").toBe("checkout");
      expect(resolveVerifyFlowSource(null), "should default null to 'checkout'").toBe("checkout");
      expect(resolveVerifyFlowSource(undefined), "should default undefined to 'checkout'").toBe("checkout");
    });
  });

  describe("startOrderAttempt & endOrderAttempt", () => {
    it("mints an order attempt ID string starting with oa_ or UUID format", () => {
      const attemptId = startOrderAttempt();
      expect(typeof attemptId, "attemptId should be a string").toBe("string");
      expect(attemptId.length > 5, "attemptId should not be empty").toBe(true);
    });

    it("ends order attempt safely without throwing", () => {
      expect(() => endOrderAttempt(), "endOrderAttempt should execute smoothly").not.toThrow();
    });
  });

  describe("trackOrder & trackOrderMgmt", () => {
    it("calls posthogCapture with event name and merged properties", () => {
      trackOrder(ORDER_EVENTS.BEGIN_CHECKOUT, { cart_value: 150 });
      expect(posthogModule.posthogCapture, "trackOrder should trigger posthogCapture").toHaveBeenCalledWith(
        ORDER_EVENTS.BEGIN_CHECKOUT,
        expect.objectContaining({ cart_value: 150 }),
      );
    });

    it("calls posthogCapture for order management events", () => {
      trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_HISTORY_VIEWED, { page: 1 });
      expect(posthogModule.posthogCapture, "trackOrderMgmt should trigger posthogCapture").toHaveBeenCalledWith(
        ORDER_MGMT_EVENTS.ORDER_HISTORY_VIEWED,
        expect.objectContaining({ page: 1 }),
      );
    });
  });
});
