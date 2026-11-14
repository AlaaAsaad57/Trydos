// The "Login with QR" screen (QR login, Direction A): it creates a QR session
// (services/qrLogin), shows the code, and asks for the status every 2 seconds
// until the app scans it, approves or declines it, or it expires. An expired
// code is replaced by itself, up to 3 codes in a row.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import QrLoginScreen from "components/Login/Enhanced/screens/QrLoginScreen";

import { act, fireEvent, renderWithProviders, screen } from "../../../../render";

const { qr } = vi.hoisted(() => ({
  qr: {
    createQrSession: vi.fn(),
    getQrStatus: vi.fn(),
    isTouchPhone: vi.fn(() => false),
    MAX_QR_CODES: 3,
    QR_POLL_MS: 2000,
  },
}));
vi.mock("services/qrLogin", () => qr);
vi.mock("components/Login/Enhanced/ui/CustomQRCode", () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr" data-value={value} />,
}));

const SESSION = { requestId: "req-1", qrPayload: "trydos://qr/req-1", expiresAt: 0 };

async function tick(ms = 2000) {
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
    qr.isTouchPhone.mockReset();
    qr.isTouchPhone.mockReturnValue(false);
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
      screen.getByText(/Open Settings → Linked Devices → Scan/),
      "the how-to line is missing while waiting",
    ).toBeInTheDocument();

    await tick();
    expect(qr.getQrStatus, "the session was not polled").toHaveBeenCalledWith("req-1");

    qr.getQrStatus.mockResolvedValue({ status: "scanned" });
    await tick();
    expect(
      screen.getByText("Scanned — Confirm On Your Phone To Continue"),
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
    expect(screen.getByText("Login Was Declined On Your Phone"), "the decline is not shown").toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-pw="qr-show-new-code"]') as HTMLElement);
    await act(async () => {});
    expect(qr.createQrSession, "'Show a new code' did not make one").toHaveBeenCalledTimes(2);
  });

  // A second tab overwrites the secret cookie, so the status route refuses this
  // tab with 403 for good. Polling on would show a dead code for ever.
  it("makes a new code when the status route refuses this browser with 403", async () => {
    await openScreen();
    qr.createQrSession.mockResolvedValueOnce({ ...SESSION, requestId: "req-2", qrPayload: "p2" });
    qr.getQrStatus.mockRejectedValueOnce(Object.assign(new Error("forbidden"), { status: 403 }));
    await tick();
    await act(async () => {});
    expect(qr.createQrSession, "a 403 from the status route did not make a new code").toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("qr").dataset.value, "the new code is not shown after a 403").toBe("p2");
  });

  it("never sends a second status call while the first is still waiting", async () => {
    await openScreen();
    qr.getQrStatus.mockReturnValueOnce(new Promise(() => {}));
    await tick();
    await tick();
    await tick();
    expect(qr.getQrStatus, "a new status call started before the last one answered").toHaveBeenCalledOnce();
  });

  it.each([
    ["the session service fails", () => qr.createQrSession.mockRejectedValue(new Error("down"))],
    ["the session answer has no payload", () => qr.createQrSession.mockResolvedValue({ requestId: "r" })],
  ])("shows 'Something Went Wrong' when %s", async (_name, setup) => {
    setup();
    await openScreen();
    expect(screen.getByText("Something Went Wrong"), "no error with a retry").toBeInTheDocument();
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

  it("waits 2 seconds between status calls", async () => {
    await openScreen();
    await tick(1900);
    expect(qr.getQrStatus, "the status was asked before 2 seconds").not.toHaveBeenCalled();
    await tick(100);
    expect(qr.getQrStatus, "the status was not asked after 2 seconds").toHaveBeenCalledOnce();
  });

  it("stops after 3 codes in a row, and 'Show a new code' starts again", async () => {
    qr.getQrStatus.mockResolvedValue({ status: "expired" });
    await openScreen();
    await tick();
    await tick();
    await tick();
    await tick();
    expect(qr.createQrSession, "the screen made more than 3 codes in a row").toHaveBeenCalledTimes(3);
    expect(screen.queryByTestId("qr"), "a code still shows after the screen stopped").not.toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-pw="qr-show-new-code"]') as HTMLElement);
    await act(async () => {});
    expect(qr.createQrSession, "'Show a new code' did not make a new code").toHaveBeenCalledTimes(4);
  });

  it("shows 'Something Went Wrong' when signing in after the approval fails", async () => {
    const onApproved = vi.fn().mockRejectedValue(new Error("collect failed"));
    await openScreen({ onApproved });
    qr.getQrStatus.mockResolvedValue({ status: "approved" });
    await tick();
    await act(async () => {});
    expect(onApproved, "the approval was not handed over").toHaveBeenCalledWith("req-1");
    expect(screen.getByText("Something Went Wrong"), "a failed sign-in left no error").toBeInTheDocument();
  });

  it("shows 'Open in app' with the QR's link on a phone only", async () => {
    qr.isTouchPhone.mockReturnValue(true);
    await openScreen();
    const link = document.querySelector('[data-pw="qr-open-in-app"]');
    expect(link, "a phone gets no 'Open in app' button").not.toBeNull();
    expect(link!.getAttribute("href"), "'Open in app' does not open the QR's link").toBe(SESSION.qrPayload);
  });

  it("hides 'Open in app' on a computer", async () => {
    await openScreen();
    expect(
      document.querySelector('[data-pw="qr-open-in-app"]'),
      "a computer shows 'Open in app'",
    ).toBeNull();
  });

  it("has no close button when no handler is given", async () => {
    await openScreen();
    expect(document.querySelector('[data-pw="close"]'), "a close button showed with no handler").toBeNull();
  });
});
