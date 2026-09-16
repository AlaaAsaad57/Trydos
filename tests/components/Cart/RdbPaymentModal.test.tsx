import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import RdbPaymentModal from "components/Cart/RdbPaymentModal";
import { renderWithProviders } from "../../render";
import {
  StartRdbPayment,
  GetRdbRequest,
  CancelRdbRequest,
} from "services/rdbPayment";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

vi.mock("services/rdbPayment", () => ({
  StartRdbPayment: vi.fn(),
  GetRdbRequest: vi.fn(),
  CancelRdbRequest: vi.fn(),
}));

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("components/Login/Enhanced/ui/CustomQRCode", () => ({
  default: ({ value }: { value: string }) => (
    <div data-pw="rdb-qr" data-value={value} />
  ),
}));

const pending = {
  request_reference: "ref-1",
  status: "awaiting_payment" as const,
  rdb_request_id: "rdb-1",
  request_code: "REQ8F3K2M1Q",
  short_code: "12345678",
  deep_link: "rdb://pay/REQ8F3K2M1Q",
  qr_payload: "https://pay.rdb.example/r/v1/REQ8F3K2M1Q",
  amount: "100.50",
  currency: "USD",
  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  paid_at: null,
  receipt_number: null,
  failure_reason: null,
  order_ids: [] as number[],
};

const storeState = {
  addressLists: [{ id: 77, is_default: 1 }],
  cart: [{ cart_group_id: "cg-1" }],
};

// Mirrors the component's own POLL_INTERVAL_MS (components/Cart/RdbPaymentModal.tsx).
// Not imported because the component does not export it — kept as a named
// constant here instead of a bare magic number so the race test reads clearly.
const POLL_INTERVAL_MS = 4000;

describe("RdbPaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ rdbLock: null });
  });

  it("shows the QR payload, the short code and the amount exactly as they arrived", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-pw="rdb-qr"]')?.getAttribute("data-value"),
        "the QR must carry the payload the core backend sent",
      ).toBe("https://pay.rdb.example/r/v1/REQ8F3K2M1Q");
    });
    expect(
      screen.getByText("12345678"),
      "the short code for manual entry in the RDB app is missing",
    ).toBeInTheDocument();
    expect(
      screen.getByText("100.50 USD"),
      "the amount must be shown as the string the core backend sent, not a rounded number",
    ).toBeInTheDocument();
  });

  it("sends the default address to the core backend when it starts a payment", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        StartRdbPayment,
        "the payment must start against the shopper's default address",
      ).toHaveBeenCalledWith(expect.objectContaining({ addressId: 77 }));
    });
  });

  it("reopens an existing request instead of starting a second one", async () => {
    vi.mocked(GetRdbRequest).mockResolvedValueOnce(pending);

    await renderWithProviders(
      <RdbPaymentModal reference="ref-9" onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        GetRdbRequest,
        "reopening must read the pending request, not create a new one",
      ).toHaveBeenCalledWith("ref-9");
    });
    expect(
      StartRdbPayment,
      "reopening a pending request must not start a second one",
    ).not.toHaveBeenCalled();
  });

  it("adopts the pending request when the core backend answers 409", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "already_pending",
      reference: "ref-9",
    });
    vi.mocked(GetRdbRequest).mockResolvedValueOnce({ ...pending, request_reference: "ref-9" });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        GetRdbRequest,
        "a 409 at start must send the shopper to the request they already have",
      ).toHaveBeenCalledWith("ref-9");
    });
  });

  it("loads the orders and reports success once the core backend says paid", async () => {
    const onSuccess = vi.fn();
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(GetRdbRequest).mockResolvedValue({
      ...pending,
      status: "paid",
      order_ids: [501],
    });
    vi.mocked(fetchData).mockResolvedValue({
      success: true,
      data: [{ id: 501, order_group_id: "og-1" }],
    } as any);

    // Fake timers go on before the component mounts, so the very first poll
    // timer the component registers is a fake one from the start — with
    // `shouldAdvanceTime`, real time still passes normally underneath, which
    // is what `renderWithProviders`'s language-file wait needs.
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={onSuccess} onClose={vi.fn()} />,
      { store: storeState },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      fetchData,
      "a paid request must load the orders through the cart-to-order lookup",
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/getOrdersByCartGroupID?cart_group_id=cg-1",
      }),
    );
    expect(onSuccess, "a paid request must move the shopper to the order screen").toHaveBeenCalled();
    expect(
      useAppStore.getState().rdbLock,
      "a paid request must release the cart lock",
    ).toBeNull();
    vi.useRealTimers();
  });

  it("stops and says the payment expired", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(GetRdbRequest).mockResolvedValue({ ...pending, status: "expired" });

    // Fake timers go on before the component mounts, so the very first poll
    // timer the component registers is a fake one from the start — with
    // `shouldAdvanceTime`, real time still passes normally underneath, which
    // is what `renderWithProviders`'s language-file wait needs.
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    const callsAfterFirstPoll = vi.mocked(GetRdbRequest).mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });

    expect(
      screen.getByText("Payment expired"),
      "an expired request must say so instead of spinning",
    ).toBeInTheDocument();
    expect(
      vi.mocked(GetRdbRequest).mock.calls.length,
      "polling must stop once the core backend reports an end state",
    ).toBe(callsAfterFirstPoll);
    vi.useRealTimers();
  });

  it("shows the core backend's own reason when the request failed", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(GetRdbRequest).mockResolvedValue({
      ...pending,
      status: "failed",
      failure_reason: "cart changed after payment",
    });

    // Fake timers go on before the component mounts, so the very first poll
    // timer the component registers is a fake one from the start — with
    // `shouldAdvanceTime`, real time still passes normally underneath, which
    // is what `renderWithProviders`'s language-file wait needs.
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      screen.getByText("cart changed after payment"),
      "a failed request must quote the core backend's reason, not a generic message",
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("cancels the request through the core backend and closes", async () => {
    const onClose = vi.fn();
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({
      ok: true,
      alreadyPaid: false,
      gone: false,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={onClose} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(screen.getByText("Cancel payment"), "the cancel button is missing").toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        CancelRdbRequest,
        "the cancel must be sent to the core backend for this reference",
      ).toHaveBeenCalledWith("ref-1");
    });
    expect(onClose, "a cancelled payment must close the screen").toHaveBeenCalled();
  });

  it("keeps the first end state when the countdown expires while a cancel answer is still in flight", async () => {
    // This proves the same defect the poll-vs-countdown race in the finding
    // describes — `settle()` has no re-entrancy guard, so any two callers
    // that reach it can both run to completion — using a pairing this test
    // can drive without depending on emergent timer ordering. Two callers of
    // `settle()` carry no `stoppedRef` check of their own before calling it:
    // the countdown's `tick()`, and `cancel()`'s "the core backend already
    // says paid" branch. Driving both deterministically (a real countdown
    // expiry, and a cancel answer held back with a controlled promise) hits
    // the exact unguarded code path the finding names, without needing the
    // poll timer and the countdown interval to land on the same tick — an
    // interleaving this test could not force to fire on demand (see the fix
    // report for what was tried).
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const shortExpiry = new Date(Date.now() + 2000).toISOString();
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: { ...pending, expires_at: shortExpiry },
    });

    // Hold the cancel's "already paid" re-fetch back, so it can be resolved
    // after the countdown has already settled the screen as "expired".
    let resolveAlreadyPaidLookup!: (value: unknown) => void;
    const alreadyPaidLookup = new Promise((resolve) => {
      resolveAlreadyPaidLookup = resolve;
    });
    vi.mocked(GetRdbRequest).mockReturnValueOnce(alreadyPaidLookup as any);

    // Hold the cancel call itself back too, so the click can be fired well
    // before the countdown reaches zero, exactly like a shopper who presses
    // "Cancel payment" right as the request is about to expire.
    let resolveCancel!: (value: unknown) => void;
    const cancelAnswer = new Promise((resolve) => {
      resolveCancel = resolve;
    });
    vi.mocked(CancelRdbRequest).mockReturnValueOnce(cancelAnswer as any);

    vi.mocked(fetchData).mockResolvedValue({
      success: true,
      data: [{ id: 501, order_group_id: "og-1" }],
    } as any);

    // Plain fake timers, not `shouldAdvanceTime`: this test's default
    // (English) render skips `renderWithProviders`'s language-file wait, so
    // there is no real-time dependency, and the expiry below has to land on
    // an exact virtual instant.
    vi.useFakeTimers();

    await renderWithProviders(
      <RdbPaymentModal onSuccess={onSuccess} onClose={onClose} />,
      { store: storeState },
    );

    // Let the mount's `StartRdbPayment` promise resolve so the cancel button
    // is on the screen.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Cancel payment"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(
      CancelRdbRequest,
      "the cancel must have reached the core backend before the countdown below is allowed to expire",
    ).toHaveBeenCalledWith("ref-1");

    // Cross the expiry while the cancel is still waiting on the core
    // backend. The countdown's own `tick()` settles the screen as "expired"
    // — the first end state.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(
      screen.getByText("Payment expired"),
      "the countdown must have already settled the screen as expired before the cancel answer below arrives",
    ).toBeInTheDocument();

    // Now the core backend answers the cancel: it refused because the
    // payment had already landed, so `cancel()` re-fetches and settles a
    // second time with "paid". Pre-fix this overwrites the expired state;
    // the fix must make this a no-op. Each step gets its own microtask flush
    // so every state update this chain produces (cancel's own `setCancelling`,
    // the second settle's writes, and — pre-fix — `loadOrders()`'s fetch) is
    // captured inside `act()` rather than leaking past it.
    await act(async () => {
      resolveCancel({ ok: false, alreadyPaid: true });
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      resolveAlreadyPaidLookup({ ...pending, status: "paid", order_ids: [501] });
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(
      screen.getByText("Payment expired"),
      "settle() must not run a second time — the screen has to keep the first end state (expired), not be overwritten by the late 'already paid' answer",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Payment received"),
      "a second settle() call must not flip the screen to paid once it already reached an end state",
    ).not.toBeInTheDocument();
    expect(
      onSuccess,
      "a settle() call that arrives after the screen already ended must not move the shopper on a second time",
    ).not.toHaveBeenCalled();
    expect(
      onClose,
      "a settle() call that arrives after the screen already ended must not close the screen a second time",
    ).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("says it could not start when the core backend refuses", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "refused",
      message: "Cart is not available",
      httpStatus: 403,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        screen.getByText("Cart is not available"),
        "a refused start must quote the core backend's reason",
      ).toBeInTheDocument();
    });
  });

  it("shows the translated generic message, not the raw backend sentence, when a start is refused with 409 and no pending reference", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "refused",
      message: "rdb_conflict_unhandled_case",
      httpStatus: 409,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        screen.getByText("Could not start the payment. Please try again"),
        "a 409 with no pending reference is not a documented case (design doc §3.3) and must not put the backend's raw sentence on screen",
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText("rdb_conflict_unhandled_case"),
      "the raw backend sentence for this undocumented case must never reach the shopper",
    ).toBeNull();
    expect(
      document.querySelector('[data-pw="rdb-start-error-close"]'),
      "a refused start must always give the shopper a way to close the screen",
    ).not.toBeNull();
  });

  it("still shows the backend's own reason for a 403 refusal, and offers a way to close", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "refused",
      message: "Cart is not available",
      httpStatus: 403,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-pw="rdb-start-error-close"]'),
        "every refused start must offer a way to close the screen, not only the 409 case",
      ).not.toBeNull();
    });
  });

  it("opens exactly one payment screen at a time, from the store's point of view", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });

    const { unmount } = await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        useAppStore.getState().rdbPaymentScreenOpen,
        "a mounted payment screen must tell the rest of the app it is open, so the cart-lock sheet stays out of the way",
      ).toBe(true);
    });

    unmount();

    expect(
      useAppStore.getState().rdbPaymentScreenOpen,
      "closing the payment screen must let the cart-lock sheet show again",
    ).toBe(false);
  });

  it("asks again instead of ending the screen when a poll answer is lost", async () => {
    // This is the behaviour the finding calls the most dangerous rule to get
    // wrong: a dropped connection or a 404/500 on one poll must never look
    // like the payment failed to a shopper who may already have paid. Delete
    // the retry in RdbPaymentModal.tsx (the `if (!next) { schedulePoll(ref);
    // return; }` branch) and this test goes red — see the fix report for the
    // red run.
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    // First poll: the answer is lost (a dropped connection, a 404, a 500 —
    // GetRdbRequest reads all of these as null, services/rdbPayment.ts).
    // Every poll after that answers normally and still awaiting payment.
    vi.mocked(GetRdbRequest)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(pending);

    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(
      vi.mocked(GetRdbRequest).mock.calls.length,
      "the first poll must have fired",
    ).toBe(1);
    expect(
      screen.getByText("Waiting for your payment"),
      "a lost poll answer must not end the screen or say the payment failed",
    ).toBeInTheDocument();
    expect(
      useAppStore.getState().rdbLock,
      "a lost poll answer must not release the cart lock — the payment is still open",
    ).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(
      vi.mocked(GetRdbRequest).mock.calls.length,
      "the screen must ask again after a lost answer instead of giving up",
    ).toBe(2);
    expect(
      screen.getByText("Waiting for your payment"),
      "the screen must still be open after the retry",
    ).toBeInTheDocument();

    vi.useRealTimers();
  });
});
