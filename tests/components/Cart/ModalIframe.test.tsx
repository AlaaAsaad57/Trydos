// The external payment frame (components/Cart/ModalIframe.tsx).
//
// The frame closes in two ways: the shopper taps X, or the payment page posts
// "close-iframe". Both then ask the core backend for the orders of the cart
// group, and put them in the store when there are any. `fetchData` is replaced
// so no request leaves the test.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModalIframe from "components/Cart/ModalIframe";
import { useAppStore } from "store";

import { act, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const fetchData = vi.hoisted(() => vi.fn());
vi.mock("utils/fetchData", () => ({
  fetchData,
  abortInFlightForLogout: vi.fn(),
}));

async function openFrame(isLoading = false) {
  const closeIframe = vi.fn();
  const handleIframeLoad = vi.fn();
  const view = await renderWithProviders(
    <ModalIframe
      _closeIframe={closeIframe}
      handleIframeLoad={handleIframeLoad}
      isLoading={isLoading}
      openIframe={{ isShow: true, url: "https://pay.example/checkout" }}
    />,
    { store: { cart: [{ cart_group_id: 77 }], orderData: null } },
  );
  return { ...view, closeIframe, handleIframeLoad };
}

const postClose = (data = "close-iframe") =>
  act(async () => {
    window.dispatchEvent(new MessageEvent("message", { data }));
  });

beforeEach(() => {
  fetchData.mockReset();
});

describe("the payment frame", () => {
  it("shows the payment page and a spinner while it loads", async () => {
    const { handleIframeLoad } = await openFrame(true);
    const frame = document.querySelector("iframe")!;
    expect(frame.getAttribute("src"), "the frame is not on the payment page").toBe(
      "https://pay.example/checkout",
    );
    expect(document.querySelector(".animate-spin"), "no spinner while the frame loads").not.toBeNull();
    frame.dispatchEvent(new Event("load"));
    expect(handleIframeLoad, "the frame's load was not reported").toHaveBeenCalled();
  });

  it("closes on X and puts the cart group's orders in the store", async () => {
    fetchData.mockResolvedValue({ success: true, data: [{ id: 9 }] });
    const { closeIframe } = await openFrame();
    await userEvent.click(screen.getByText("X"));

    expect(closeIframe, "X did not close the frame").toHaveBeenCalled();
    expect(
      fetchData.mock.calls[0][0].url,
      "the orders were not asked for this cart group",
    ).toBe("/customer/order/getOrdersByCartGroupID?cart_group_id=77");
    await waitFor(() =>
      expect(
        (useAppStore.getState() as any).orderData,
        "the returned orders were not put in the store",
      ).toMatchObject({ data: [{ id: 9 }], success: true }),
    );
  });

  it("leaves the store alone when the cart group has no orders yet", async () => {
    fetchData.mockResolvedValue({ success: true, data: [] });
    await openFrame();
    await userEvent.click(screen.getByText("X"));
    await waitFor(() => expect(fetchData, "the orders were not asked for").toHaveBeenCalled());
    expect((useAppStore.getState() as any).orderData, "an empty answer changed the stored order").toBeNull();
  });

  it("keeps the store as it was when the core backend refuses the X request", async () => {
    fetchData.mockResolvedValue({ success: false, message: "nope" });
    await openFrame();
    await userEvent.click(screen.getByText("X"));
    await waitFor(() => expect(fetchData, "the orders were not asked for").toHaveBeenCalled());
    expect((useAppStore.getState() as any).orderData, "a refused answer changed the stored order").toBeNull();
  });

  it("closes when the payment page posts 'close-iframe' and loads the orders", async () => {
    fetchData.mockResolvedValue({ success: true, data: [{ id: 3 }] });
    const { closeIframe } = await openFrame();

    await postClose("something-else");
    expect(closeIframe, "an unrelated message closed the frame").not.toHaveBeenCalled();

    await postClose();
    expect(closeIframe, "the 'close-iframe' message did not close the frame").toHaveBeenCalled();
    await waitFor(() =>
      expect(
        (useAppStore.getState() as any).orderData,
        "the orders were not put in the store after the page closed the frame",
      ).toMatchObject({ data: [{ id: 3 }] }),
    );
  });

  it("keeps the store as it was when the order read fails after the page closed the frame", async () => {
    fetchData.mockResolvedValueOnce({ success: false, message: "nope" });
    await openFrame();
    await postClose();
    fetchData.mockResolvedValueOnce({ success: true, data: [] });
    await postClose();
    await waitFor(() => expect(fetchData, "the orders were not asked for twice").toHaveBeenCalledTimes(2));
    expect((useAppStore.getState() as any).orderData, "a failed or empty read changed the stored order").toBeNull();
  });
});
