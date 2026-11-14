// The approve view of QR login, Direction B: "Log in on this device?" with the
// phone's name, and Approve and Deny. It never approves by itself.
import { describe, expect, it, vi } from "vitest";

import QrApprovalSheet from "components/Login/QrApprovalSheet";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

async function openSheet(deviceLine = "Alaa's iPhone · ios") {
  const onApprove = vi.fn();
  const onDeny = vi.fn();
  await renderWithProviders(
    <QrApprovalSheet deviceLine={deviceLine} language="en" onApprove={onApprove} onDeny={onDeny} />,
  );
  return { onApprove, onDeny };
}

describe("QrApprovalSheet", () => {
  it("names the phone that asks to sign in", async () => {
    await openSheet();
    expect(screen.getByText("Alaa's iPhone · ios"), "the sheet does not name the phone").toBeTruthy();
  });

  it("says 'a device' when the phone sent no name", async () => {
    await openSheet("");
    expect(screen.getByText(/^a device$/i), "the sheet shows an empty device line").toBeTruthy();
  });

  it("approves only when the user taps Approve", async () => {
    const { onApprove, onDeny } = await openSheet();
    expect(onApprove, "the sheet approved by itself").not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByText(/^approve$/i));
    });
    expect(onApprove, "tapping Approve did not approve").toHaveBeenCalledOnce();
    expect(onDeny, "tapping Approve also denied").not.toHaveBeenCalled();
  });

  it("denies when the user taps Deny", async () => {
    const { onApprove, onDeny } = await openSheet();
    await act(async () => {
      fireEvent.click(screen.getByText(/^deny$/i));
    });
    expect(onDeny, "tapping Deny did not deny").toHaveBeenCalledOnce();
    expect(onApprove, "tapping Deny also approved").not.toHaveBeenCalled();
  });
});
