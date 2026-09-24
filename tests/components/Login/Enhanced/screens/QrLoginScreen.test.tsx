// The "Login with QR" screen: it creates a QR session (services/qrLogin), shows
// the code, and polls the session every second until the phone scans it,
// approves or declines it, or it expires (then a new code is made).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import QrLoginScreen from "components/Login/Enhanced/screens/QrLoginScreen";

import { act, fireEvent, renderWithProviders, screen } from "../../../../render";

const { qr } = vi.hoisted(() => ({
  qr: { createQrSession: vi.fn(), getQrStatus: vi.fn() },
}));
vi.mock("services/qrLogin", () => qr);
vi.mock("components/Login/Enhanced/ui/CustomQRCode", () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr" data-value={value} />,
}));

const SESSION = { requestId: "req-1", qrPayload: "trydos://qr/req-1", expiresAt: 0 };

async function tick(ms = 1000) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function openScreen(props: any = {}) {
  const onApproved = vi.fn();
  const view = await renderWithProviders(<QrLoginScreen onApproved={onApproved} {...props} />);
  await act(async () => {});
  return { ...view, onApproved };
}

describe("QrLoginScreen", () => {
  beforeEach(() => {
    qr.createQrSession.mockReset();
    qr.createQrSession.mockResolvedValue(SESSION);
    qr.getQrStatus.mockReset();
    qr.getQrStatus.mockResolvedValue({ status: "pending" });
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the new code, then the scanned state, then hands over the approval once", async () => {
    const { onApproved } = await openScreen();
    expect(screen.getByTestId("qr").dataset.value, "the QR does not carry the session payload").toBe(
      SESSION.qrPayload,
    );
    expect(
      screen.getByText(/open Settings → Linked Devices → Scan/),
      "the how-to line is missing while waiting",
    ).toBeInTheDocument();

    await tick();
    expect(qr.getQrStatus, "the session was not polled").toHaveBeenCalledWith("req-1");

    qr.getQrStatus.mockResolvedValue({ status: "scanned" });
    await tick();
    expect(
      screen.getByText("Scanned — confirm on your phone to continue"),
      "the scanned state is not shown",
    ).toBeInTheDocument();
    expect(screen.getByTestId("qr").parentElement!.className, "the QR is not dimmed once scanned").toContain(
      "opacity-30",
    );
    // A second "scanned" answer changes nothing.
    await tick();

    qr.getQrStatus.mockResolvedValue({ status: "approved" });
    await tick();
    await tick();
    expect(onApproved, "the approval was not handed over exactly once").toHaveBeenCalledTimes(1);
    expect(onApproved, "the approval did not carry the session id").toHaveBeenCalledWith("req-1");
  });

  it("makes a new code when the old one expires", async () => {
    await openScreen();
    qr.createQrSession.mockResolvedValueOnce({ ...SESSION, requestId: "req-2", qrPayload: "p2" });
    qr.getQrStatus.mockResolvedValueOnce({ status: "expired" });
    await tick();
    await act(async () => {});
    expect(qr.createQrSession, "an expired code was not replaced").toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("qr").dataset.value, "the new code is not shown").toBe("p2");
  });

  it("offers a new code after the phone declines, and keeps polling through a network blip", async () => {
    await openScreen();
    qr.getQrStatus.mockRejectedValueOnce(new Error("blip"));
    await tick();
    expect(screen.getByTestId("qr"), "a network blip dropped the code").toBeInTheDocument();

    qr.getQrStatus.mockResolvedValue({ status: "denied" });
    await tick();
    expect(screen.getByText("Login was declined on your phone"), "the decline is not shown").toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-pw="qr-show-new-code"]') as HTMLElement);
    await act(async () => {});
    expect(qr.createQrSession, "'Show a new code' did not make one").toHaveBeenCalledTimes(2);
  });

  it.each([
    ["the session service fails", () => qr.createQrSession.mockRejectedValue(new Error("down"))],
    ["the session answer has no payload", () => qr.createQrSession.mockResolvedValue({ requestId: "r" })],
  ])("shows 'Something went wrong' when %s", async (_name, setup) => {
    setup();
    await openScreen();
    expect(screen.getByText("Something went wrong"), "no error with a retry").toBeInTheDocument();
    expect(screen.queryByTestId("qr"), "a code showed without a session").not.toBeInTheDocument();
  });

  it("shows a spinner while the first code is made, and closes with the first handler it has", async () => {
    qr.createQrSession.mockReturnValue(new Promise(() => {}));
    const onClose = vi.fn();
    const onBack = vi.fn();
    const { container } = await openScreen({ onClose, onBack });
    expect(container.querySelector(".animate-spin"), "no spinner while loading").not.toBeNull();
    fireEvent.click(document.querySelector('[data-pw="close"]') as HTMLElement);
    expect(onClose, "close did not use onClose").toHaveBeenCalled();
    expect(onBack, "close used onBack when onClose was given").not.toHaveBeenCalled();
  });

  it("has no close button when no handler is given", async () => {
    await openScreen();
    expect(document.querySelector('[data-pw="close"]'), "a close button showed with no handler").toBeNull();
  });
});
