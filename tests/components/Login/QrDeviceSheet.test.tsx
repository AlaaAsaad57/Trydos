// The Settings QR sheet, Direction B: the signed-in web shows a QR, a phone's
// app claims it, and the user approves the phone here. It asks for the status
// every 2 seconds and stops making new codes after 3 in a row.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import QrDeviceSheet from "components/Login/QrDeviceSheet";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

const { qr } = vi.hoisted(() => ({
  qr: {
    createDeviceQrSession: vi.fn(),
    getDeviceQrStatus: vi.fn(),
    approveDevice: vi.fn(),
    denyDevice: vi.fn(),
    isTouchPhone: vi.fn(() => false),
    MAX_QR_CODES: 3,
    QR_POLL_MS: 2000,
  },
}));
vi.mock("services/qrLogin", () => qr);
vi.mock("components/Login/Enhanced/ui/CustomQRCode", () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr">{value}</div>,
}));

const session = (n = 1) => ({ requestId: `id-${n}`, qrPayload: `trydos://qr/app/id-${n}`, expiresAt: 0 });

async function open() {
  const onClose = vi.fn();
  await renderWithProviders(<QrDeviceSheet isRtl={false} language="en" onClose={onClose} />);
  await act(async () => {});
  return { onClose };
}

const tick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });

beforeEach(() => {
  vi.useFakeTimers();
  Object.values(qr).forEach((f) => typeof f === "function" && (f as any).mockReset?.());
  qr.isTouchPhone.mockReturnValue(false);
  let n = 0;
  qr.createDeviceQrSession.mockImplementation(async () => session(++n));
  qr.getDeviceQrStatus.mockResolvedValue({ status: "pending", deviceName: null, platform: null });
  qr.approveDevice.mockResolvedValue({ status: "approved" });
  qr.denyDevice.mockResolvedValue({ status: "denied" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("QrDeviceSheet", () => {
  it("shows the app link from device/create as the QR", async () => {
    await open();
    expect(screen.getByTestId("qr").textContent, "the sheet does not show the app link").toBe(
      "trydos://qr/app/id-1",
    );
  });

  it("asks for the status every 2 seconds", async () => {
    await open();
    await tick();
    expect(qr.getDeviceQrStatus, "the sheet did not ask for the status after 2 seconds").toHaveBeenCalledWith("id-1");
  });

  it("never sends a second status call while the first is still waiting", async () => {
    await open();
    qr.getDeviceQrStatus.mockReturnValueOnce(new Promise(() => {}));
    await tick();
    await tick();
    await tick();
    expect(
      qr.getDeviceQrStatus,
      "a new status call started before the last one answered",
    ).toHaveBeenCalledOnce();
  });

  it("shows the phone's name with Approve and Deny after a claim, and approves on tap", async () => {
    qr.getDeviceQrStatus.mockResolvedValue({ status: "claimed", deviceName: "Alaa's iPhone", platform: "ios" });
    await open();
    await tick();
    expect(screen.getByText("Alaa's iPhone · ios"), "the claimed phone's name is not shown").toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText(/^approve$/i));
    });
    expect(qr.approveDevice, "Approve did not approve this request").toHaveBeenCalledWith("id-1");
    expect(screen.getByText(/^your phone is now signed in$/i), "the sheet did not say the phone is signed in").toBeTruthy();
  });

  it("makes a new code when one expires, and stops after 3 codes", async () => {
    qr.getDeviceQrStatus.mockResolvedValue({ status: "expired", deviceName: null, platform: null });
    await open();
    await tick();
    await tick();
    await tick();
    expect(qr.createDeviceQrSession, "the sheet did not stop after 3 codes").toHaveBeenCalledTimes(3);
    expect(screen.getByText(/^show a new code$/i), "the sheet did not offer a new code after 3").toBeTruthy();
  });

  it("denies a waiting phone when the user closes the sheet", async () => {
    qr.getDeviceQrStatus.mockResolvedValue({ status: "claimed", deviceName: "Phone", platform: null });
    const { onClose } = await open();
    await tick();
    await act(async () => {
      fireEvent.click(document.querySelector(".qr-sheet-backdrop")!);
    });
    expect(qr.denyDevice, "closing did not deny the waiting phone").toHaveBeenCalledWith("id-1");
    expect(onClose, "closing did not close the sheet").toHaveBeenCalledOnce();
  });

  it("shows 'Open in app' only on a phone", async () => {
    qr.isTouchPhone.mockReturnValue(true);
    await open();
    const link = screen.getByText(/^open in app$/i);
    expect(link.getAttribute("href"), "'Open in app' does not open the QR's link").toBe("trydos://qr/app/id-1");
  });
});
