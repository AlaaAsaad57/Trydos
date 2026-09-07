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

vi.mock("services/auth", () => ({
  default: {
    UserID: vi.fn(() => 777),
  },
}));

import { useAppStore } from "store";

describe("orderFunnel utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      cart: [],
      orderData: {} as any,
      currency: { code: "USD" },
      total_cash: null,
      total: null,
      userProfile: { is_phone_verified: true },
    });
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
    it("mints an order attempt ID string and stashes attempt_id on store orderData", () => {
      const attemptId = startOrderAttempt();
      expect(typeof attemptId, "attemptId should be a string").toBe("string");
      expect(attemptId.length > 5, "attemptId should not be empty").toBe(true);
      expect((useAppStore.getState().orderData as any)?.attempt_id).toBe(attemptId);
    });

    it("ends order attempt and clears attempt_id from store orderData", () => {
      (useAppStore.getState() as any).setOrderData({ attempt_id: "test-attempt-123" });
      endOrderAttempt();
      expect((useAppStore.getState().orderData as any)?.attempt_id).toBeUndefined();
    });

    it("falls back to oa_ prefix when crypto.randomUUID throws", () => {
      const originalCrypto = globalThis.crypto;
      try {
        Object.defineProperty(globalThis, "crypto", {
          value: {
            randomUUID: () => {
              throw new Error("UUID unsupported");
            },
          },
          configurable: true,
        });

        const attemptId = startOrderAttempt();
        expect(attemptId.startsWith("oa_")).toBe(true);
      } finally {
        Object.defineProperty(globalThis, "crypto", {
          value: originalCrypto,
          configurable: true,
        });
      }
    });
  });

  describe("trackOrder baseProps extraction", () => {
    it("calls posthogCapture with event name and merged base properties from store", () => {
      useAppStore.setState({
        cart: [{ id: 1 }, { id: 2 }],
        currency: { code: "EUR" },
        total_cash: 250,
        total: 200,
        userProfile: { is_phone_verified: true },
        orderData: { attempt_id: "oa-current-attempt" } as any,
      });

      trackOrder(ORDER_EVENTS.BEGIN_CHECKOUT, { custom_field: "foo" });

      expect(posthogModule.posthogCapture).toHaveBeenCalledWith(
        ORDER_EVENTS.BEGIN_CHECKOUT,
        expect.objectContaining({
          order_attempt_id: "oa-current-attempt",
          currency: "EUR",
          item_count: 2,
          cart_value: 250,
          is_phone_verified: true,
          user_id: 777,
          custom_field: "foo",
        }),
      );
    });

    it("falls back to total when total_cash is null", () => {
      useAppStore.setState({
        total_cash: null,
        total: 180,
      });

      trackOrder(ORDER_EVENTS.ORDER_SUBMIT_ATTEMPT);

      expect(posthogModule.posthogCapture).toHaveBeenCalledWith(
        ORDER_EVENTS.ORDER_SUBMIT_ATTEMPT,
        expect.objectContaining({
          cart_value: 180,
        }),
      );
    });

    it("allows explicit caller props to override base props", () => {
      useAppStore.setState({
        currency: { code: "TRY" },
      });

      trackOrder(ORDER_EVENTS.CART_VIEWED, { currency: "USD" });

      expect(posthogModule.posthogCapture).toHaveBeenCalledWith(
        ORDER_EVENTS.CART_VIEWED,
        expect.objectContaining({
          currency: "USD",
        }),
      );
    });
  });

  describe("trackOrderMgmt baseProps extraction", () => {
    it("calls posthogCapture for order management events with mgmtBaseProps", () => {
      useAppStore.setState({
        currency: { code: "SYP" },
      });

      trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_HISTORY_VIEWED, { page: 1 });

      expect(posthogModule.posthogCapture).toHaveBeenCalledWith(
        ORDER_MGMT_EVENTS.ORDER_HISTORY_VIEWED,
        expect.objectContaining({
          currency: "SYP",
          user_id: 777,
          page: 1,
        }),
      );
    });
  });
});

