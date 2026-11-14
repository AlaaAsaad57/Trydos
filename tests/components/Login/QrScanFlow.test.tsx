// The phone scanner. It does the app's part on a phone browser until the app
// ships its own scanner.
// - Signed in: scan a browser's QR (trydos://qr/web/…), see where it is, and
//   approve or deny it.
// - Signed out: scan a signed-in device's QR (trydos://qr/app/…), claim it,
//   wait for the approval, then sign in.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import QrScanFlow from "components/Login/QrScanFlow";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

const { qr } = vi.hoisted(() => {
  class QrLoginError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string) {
      super(code);
      this.status = status;
      this.code = code;
    }
  }
  return {
    qr: {
      markWebQrScanned: vi.fn(),
      approveWebQr: vi.fn(),
      denyWebQr: vi.fn(),
      claimAppQr: vi.fn(),
      getClaimStatus: vi.fn(),
      QR_POLL_MS: 2000,
      QrLoginError,
    },
  };
});
vi.mock("services/qrLogin", () => qr);

// English text shows with a capital on every word, so the text checks
// ignore case. The camera can't run here. The stand-in gives one button per kind of QR.
vi.mock("components/Login/QrScannerModal", () => ({
  default: ({ onDetected }: { onDetected: (q: { kind: string; requestId: string }) => void }) => (
    <div>
      <button onClick={() => onDetected({ kind: "web", requestId: "web-1" })}>scan web qr</button>
      <button onClick={() => onDetected({ kind: "app", requestId: "app-1" })}>scan app qr</button>
    </div>
  ),
}));

async function open(signedIn: boolean) {
  const onClose = vi.fn();
  const onSignIn = vi.fn(async () => {});
  await renderWithProviders(
    <QrScanFlow isRtl={false} language="en" signedIn={signedIn} onSignIn={onSignIn} onClose={onClose} />,
  );
  return { onClose, onSignIn };
}

const scan = (kind: "web" | "app") =>
  act(async () => {
    fireEvent.click(screen.getByText(`scan ${kind} qr`));
  });

const tick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });

beforeEach(() => {
  vi.useFakeTimers();
  [qr.markWebQrScanned, qr.approveWebQr, qr.denyWebQr, qr.claimAppQr, qr.getClaimStatus].forEach((f) =>
    f.mockReset(),
  );
  qr.markWebQrScanned.mockResolvedValue({
    browser: "Chrome",
    os: "Windows",
    city: "Mumbai",
    region: null,
    country: "IN",
    expiresAt: 0,
  });
  qr.approveWebQr.mockResolvedValue({ status: "approved" });
  qr.denyWebQr.mockResolvedValue({ status: "denied" });
  qr.claimAppQr.mockResolvedValue({ status: "claimed", expiresAt: 0 });
  qr.getClaimStatus.mockResolvedValue({ status: "claimed" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("QrScanFlow, signed in (Direction A)", () => {
  it("marks the browser's QR as scanned and shows where the browser is", async () => {
    await open(true);
    await scan("web");
    expect(qr.markWebQrScanned, "scanning did not tell the backend this phone scanned").toHaveBeenCalledWith("web-1");
    expect(screen.getByText("Chrome · Windows · Mumbai"), "the browser's place is not on the approve sheet").toBeTruthy();
  });

  it("approves on tap and says the browser is signed in", async () => {
    await open(true);
    await scan("web");
    await act(async () => {
      fireEvent.click(screen.getByText(/^approve$/i));
    });
    expect(qr.approveWebQr, "Approve did not approve this browser").toHaveBeenCalledWith("web-1");
    expect(screen.getByText(/^The browser is now signed in$/i), "the sheet did not say the browser is signed in").toBeTruthy();
  });

  it("denies the browser when the user closes the approve sheet", async () => {
    const { onClose } = await open(true);
    await scan("web");
    await act(async () => {
      fireEvent.click(document.querySelector(".qr-sheet-backdrop")!);
    });
    expect(qr.denyWebQr, "closing did not deny the waiting browser").toHaveBeenCalledWith("web-1");
    expect(onClose, "closing did not close the sheet").toHaveBeenCalled();
  });

  it("refuses an app QR and calls nothing", async () => {
    await open(true);
    await scan("app");
    expect(screen.getByText(/^This code is not for this screen$/i), "a wrong QR did not say so").toBeTruthy();
    expect(qr.markWebQrScanned, "a wrong QR still called web/scanned").not.toHaveBeenCalled();
    expect(qr.claimAppQr, "a signed-in phone claimed an app QR").not.toHaveBeenCalled();
  });

  it("says the code was used on another device when another user scanned first (409)", async () => {
    qr.markWebQrScanned.mockRejectedValue(new qr.QrLoginError(409, "conflict"));
    await open(true);
    await scan("web");
    expect(
      screen.getByText(/^This code was used on another device$/i),
      "a 409 from scan/scanned did not show the used-elsewhere line",
    ).toBeTruthy();
  });
});

describe("QrScanFlow, signed out (Direction B)", () => {
  it("claims the QR and waits for the other device", async () => {
    await open(false);
    await scan("app");
    expect(qr.claimAppQr, "scanning did not claim the QR").toHaveBeenCalledWith("app-1");
    expect(screen.getByText(/^Approve on your other device$/i), "the phone does not say to approve on the other device").toBeTruthy();
  });

  it("signs in once the other device approves", async () => {
    const { onSignIn } = await open(false);
    await scan("app");
    qr.getClaimStatus.mockResolvedValue({ status: "approved" });
    await tick();
    expect(qr.getClaimStatus, "the phone did not ask for the status after 2 seconds").toHaveBeenCalledWith("app-1");
    expect(onSignIn, "the phone did not sign in after the approval").toHaveBeenCalledWith("app-1");
  });

  it("says the sign-in was denied", async () => {
    const { onSignIn } = await open(false);
    await scan("app");
    qr.getClaimStatus.mockResolvedValue({ status: "denied" });
    await tick();
    expect(screen.getByText(/^The sign-in was denied$/i), "a denied claim did not say so").toBeTruthy();
    expect(onSignIn, "a denied claim still signed in").not.toHaveBeenCalled();
  });

  it("says the code expired when the session ends", async () => {
    await open(false);
    await scan("app");
    qr.getClaimStatus.mockResolvedValue({ status: "expired" });
    await tick();
    expect(screen.getByText(/^This code expired$/i), "an expired claim did not say so").toBeTruthy();
  });

  it("refuses a web QR and calls nothing", async () => {
    await open(false);
    await scan("web");
    expect(screen.getByText(/^This code is not for this screen$/i), "a wrong QR did not say so").toBeTruthy();
    expect(qr.claimAppQr, "a wrong QR still claimed").not.toHaveBeenCalled();
    expect(qr.markWebQrScanned, "a signed-out phone called web/scanned").not.toHaveBeenCalled();
  });

  it("goes back to the camera on 'Scan again'", async () => {
    await open(false);
    await scan("web");
    await act(async () => {
      fireEvent.click(screen.getByText(/^Scan again$/i));
    });
    expect(screen.getByText("scan app qr"), "'Scan again' did not open the camera again").toBeTruthy();
  });
});
