// The sheet on the phone that approves or denies a QR login from another
// device. It marks the QR session as scanned, shows which device asked, and
// sends the answer through services/qrLogin.
import { beforeEach, describe, expect, it, vi } from "vitest";

import QrApprovalSheet from "components/Login/QrApprovalSheet";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { qr } = vi.hoisted(() => ({
  qr: {
    getQrStatus: vi.fn(),
    markScanned: vi.fn(),
    approveQrLogin: vi.fn(),
    denyQrLogin: vi.fn(),
  },
}));
vi.mock("services/qrLogin", () => qr);

const USER = { id: 1, name: "Rana" } as any;

async function openSheet(isRtl = false) {
  const onDone = vi.fn();
  await renderWithProviders(
    <QrApprovalSheet requestId="req-1" user={USER} isRtl={isRtl} language="en" onDone={onDone} />,
  );
  await act(async () => {});
  return { onDone };
}

describe("QrApprovalSheet", () => {
  beforeEach(() => {
    Object.values(qr).forEach((f) => f.mockReset());
    qr.markScanned.mockResolvedValue(undefined);
    qr.getQrStatus.mockResolvedValue({ status: "scanned", context: { browser: "Chrome", os: "", city: "Aleppo" } });
    qr.approveQrLogin.mockResolvedValue(undefined);
    qr.denyQrLogin.mockResolvedValue(undefined);
  });

  it("marks the session scanned and names the asking device", async () => {
    await openSheet();
    expect(qr.markScanned, "the session was not marked scanned").toHaveBeenCalledWith("req-1");
    expect(screen.getByText("Chrome · Aleppo"), "the device line is wrong").toBeInTheDocument();
    expect(document.querySelector(".qr-sheet-backdrop")?.getAttribute("dir"), "LTR is not set").toBe("ltr");
  });

  it("says 'a device' when the session has no context", async () => {
    qr.getQrStatus.mockResolvedValue({ status: "scanned" });
    await openSheet(true);
    expect(screen.getByText("a device"), "no fallback device line").toBeInTheDocument();
    expect(document.querySelector(".qr-sheet-backdrop")?.getAttribute("dir"), "RTL is not set").toBe("rtl");
  });

  it("approves for the signed-in user", async () => {
    const { onDone } = await openSheet();
    fireEvent.click(document.querySelector('[data-pw="qr-approve"]') as HTMLElement);
    expect(
      (document.querySelector('[data-pw="qr-deny"]') as HTMLButtonElement).disabled,
      "the buttons stayed on while approving",
    ).toBe(true);
    await waitFor(() => expect(onDone, "approval was not reported").toHaveBeenCalledWith("approved"));
    expect(qr.approveQrLogin, "the approval did not carry the user").toHaveBeenCalledWith("req-1", USER);
  });

  it("denies from the button and from the backdrop, but not from inside the sheet", async () => {
    const { onDone } = await openSheet();
    fireEvent.click(document.querySelector(".qr-sheet") as HTMLElement);
    expect(qr.denyQrLogin, "a click inside the sheet denied").not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('[data-pw="qr-deny"]') as HTMLElement);
    await waitFor(() => expect(onDone, "the deny was not reported").toHaveBeenCalledWith("denied"));
    fireEvent.click(document.querySelector(".qr-sheet-backdrop") as HTMLElement);
    await waitFor(() => expect(qr.denyQrLogin, "the backdrop did not deny").toHaveBeenCalledTimes(2));
  });
});
