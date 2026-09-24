import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import RdbPaymentLockedSheet from "components/Cart/RdbPaymentLockedSheet";
import { renderWithProviders } from "../../render";
import { CancelRdbRequest, GetRdbRequest } from "services/rdbPayment";
import { useAppStore } from "store";
import { useNotificationStore } from "store/notifications/reducer";

vi.mock("services/rdbPayment", () => ({
  CancelRdbRequest: vi.fn(),
  GetRdbRequest: vi.fn(),
}));

vi.mock("components/Cart/RdbPaymentModal", () => ({
  default: (props: any) => (
    <div data-pw="rdb-payment-modal" data-reference={props.reference ?? ""}>
      <button onClick={props.onSuccess}>modal-success</button>
      <button onClick={props.onClose}>modal-close</button>
    </div>
  ),
}));

describe("RdbPaymentLockedSheet", () => {
  beforeEach(() => {
    // A full reset, not just a clear: a couple of these tests give
    // `GetRdbRequest` a persistent `mockResolvedValue` (its poll runs on a
    // 4-second interval, so a one-shot `mockResolvedValueOnce` would starve
    // the recurring calls). `clearAllMocks` would leave that implementation
    // in place for the next test's mount-time poll.
    vi.resetAllMocks();
    useNotificationStore.setState({ notifications: [] });
  });

  it("draws nothing while no payment request holds the cart", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: null },
    });

    expect(
      screen.queryByText("You have a payment in progress"),
      "with no lock the sheet must stay out of the way",
    ).toBeNull();
  });

  it("tells the shopper the cart is locked and offers both ways out", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    expect(
      screen.getByText("You have a payment in progress"),
      "a locked cart must say so in words",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Continue payment"),
      "the shopper must be able to go back to the payment screen",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cancel payment"),
      "the shopper must be able to cancel and edit the cart again",
    ).toBeInTheDocument();
  });

  it("opens the payment screen and hands it the pending reference, so it reopens instead of starting a second request", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Continue payment"));

    await waitFor(() => {
      const modal = document.querySelector('[data-pw="rdb-payment-modal"]');
      expect(
        modal,
        "the payment screen must open on the pending request",
      ).not.toBeNull();
      expect(
        modal?.getAttribute("data-reference"),
        "the payment screen must reopen the pending request, not start a second one",
      ).toBe("ref-1");
    });
  });

  it("clears the lock after the core backend cancels the request", async () => {
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({
      ok: true,
      alreadyPaid: false,
      gone: false,
    });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        useAppStore.getState().rdbLock,
        "a cancelled request must unlock the cart",
      ).toBeNull();
    });
    expect(
      CancelRdbRequest,
      "the cancel must be sent to the core backend for the pending reference",
    ).toHaveBeenCalledWith("ref-1");
  });

  it("keeps the lock and says so when the payment already landed", async () => {
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({
      ok: false,
      alreadyPaid: true,
      gone: false,
    });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        screen.getByText("This payment is already paid"),
        "a paid request cannot be cancelled and the shopper must be told why",
      ).toBeInTheDocument();
    });
  });

  it("says so when the cancel fails for a reason other than already-paid", async () => {
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({
      ok: false,
      alreadyPaid: false,
      gone: false,
    });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        useNotificationStore
          .getState()
          .notifications.some(
            (n) =>
              n.type === "error" &&
              n.message === "Could not cancel the payment. Please try again",
          ),
        "a cancel that fails for a reason other than already-paid must tell the shopper, not leave the spinner's old screen up with nothing changed",
      ).toBe(true);
    });
  });

  it("clears the lock rather than trapping the shopper when the cancel 404s because the request is already gone", async () => {
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({
      ok: false,
      alreadyPaid: false,
      gone: true,
    });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        useAppStore.getState().rdbLock,
        "a 404 means the request no longer exists, so the cart must unlock instead of leaving the shopper stuck",
      ).toBeNull();
    });
    expect(
      screen.queryByText("This payment is already paid"),
      "a gone reference is not the same case as an already-paid one",
    ).toBeNull();
  });

  it("does not render while a payment screen is already open elsewhere, and does not poll either", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: {
        rdbLock: { reference: "ref-1", expires_at: null },
        rdbPaymentScreenOpen: true,
      },
    });

    expect(
      screen.queryByText("You have a payment in progress"),
      "the sheet must never paint over a payment screen that is already open",
    ).toBeNull();
    expect(
      GetRdbRequest,
      "a payment screen open elsewhere is already polling — the sheet must not poll the same reference a second time",
    ).not.toHaveBeenCalled();
  });

  it("clears the lock itself when its own poll finds the request has left awaiting_payment", async () => {
    vi.mocked(GetRdbRequest).mockResolvedValue({
      request_reference: "ref-1",
      status: "expired",
    } as any);

    // Fake timers go on before the component mounts, matching the pattern the
    // payment screen's own tests use, so the sheet's very first poll timer is
    // a fake one from the start.
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(
      GetRdbRequest,
      "the sheet must poll the reference itself while its own view is on screen",
    ).toHaveBeenCalledWith("ref-1");
    expect(
      useAppStore.getState().rdbLock,
      "an end state found by the sheet's own poll must clear the lock, otherwise nothing ever notices when the shopper is not on the payment screen",
    ).toBeNull();

    vi.useRealTimers();
  });

  it("hides itself when the shopper dismisses it, but leaves the lock alone", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    await waitFor(() => {
      expect(
        screen.getByText("You have a payment in progress"),
        "the sheet must be showing before it can be dismissed",
      ).toBeInTheDocument();
    });

    const closeControl = document.querySelector('[data-pw="rdb-lock-close"]');
    expect(closeControl, "the sheet must offer a close control").not.toBeNull();
    fireEvent.click(closeControl!);

    expect(
      screen.queryByText("You have a payment in progress"),
      "the close control must let the shopper stop seeing the sheet",
    ).toBeNull();
    expect(
      useAppStore.getState().rdbLock,
      "dismissing the sheet must not cancel the still-pending payment",
    ).not.toBeNull();
  });
  it("shows again after a dismiss when the core backend refuses another cart write for the same pending request", async () => {
    vi.mocked(GetRdbRequest).mockResolvedValue(null as any);
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(document.querySelector('[data-pw="rdb-lock-close"]')!);
    expect(
      screen.queryByText("You have a payment in progress"),
      "the close control must hide the sheet before the second refusal",
    ).toBeNull();

    // The shopper taps + in the cart. The core backend answers 409 again with
    // the same reference, and the cart service stores the lock again.
    act(() => {
      useAppStore.getState().setRdbLock({ reference: "ref-1", expires_at: null });
    });

    expect(
      screen.queryByText("You have a payment in progress"),
      "a new refused cart write must show the sheet again, even for the same reference, or the shopper sees nothing and the action fails without a word",
    ).not.toBeNull();
  });

  it.each(["modal-success", "modal-close"])(
    "goes back to the locked sheet when the payment screen reports %s",
    async (button) => {
      vi.mocked(GetRdbRequest).mockResolvedValue(null as any);
      await renderWithProviders(<RdbPaymentLockedSheet />, {
        store: { rdbLock: { reference: "ref-1", expires_at: null } },
      });
      fireEvent.click(screen.getByText("Continue payment"));
      fireEvent.click(await screen.findByText(button));
      expect(
        await screen.findByText("You have a payment in progress"),
        "closing the payment screen should show the locked sheet again",
      ).toBeInTheDocument();
    },
  );

  it("hides itself when the shopper taps the dark backdrop, but not when tapping the sheet", async () => {
    vi.mocked(GetRdbRequest).mockResolvedValue(null as any);
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });
    fireEvent.click(screen.getByText("You have a payment in progress"));
    expect(
      screen.queryByText("You have a payment in progress"),
      "a tap inside the sheet must not close it",
    ).not.toBeNull();
    fireEvent.click(document.querySelector('[data-pw="rdb-cart-locked"]')!);
    expect(
      screen.queryByText("You have a payment in progress"),
      "a tap on the backdrop should hide the sheet",
    ).toBeNull();
    expect(useAppStore.getState().rdbLock, "hiding must keep the lock").not.toBeNull();
  });

  it("sends only one cancel while the first one is still running", async () => {
    vi.mocked(GetRdbRequest).mockResolvedValue(null as any);
    let finish: (v: any) => void = () => {};
    vi.mocked(CancelRdbRequest).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }) as any,
    );
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });
    const cancelButton = document.querySelector('[data-pw="rdb-lock-cancel"]')!;
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);
    expect(CancelRdbRequest, "a second tap must not send a second cancel").toHaveBeenCalledTimes(1);
    await act(async () => finish({ ok: true }));
  });
});
