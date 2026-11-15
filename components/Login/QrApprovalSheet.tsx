"use client";

import { useState } from "react";
import { translateFunction } from "utils/functions";
import QrDeviceDetails, { type QrDeviceInfo } from "components/Login/QrDeviceDetails";
import "public/styles/qrLogin.css";

type Props = {
  /** The device the user approves: its place, browser and system. */
  device: QrDeviceInfo;
  language: string;
  onApprove: () => Promise<void> | void;
  onDeny: () => Promise<void> | void;
};

/**
 * "Log in on this device?" with Approve and Deny. It never approves by itself:
 * a QR link can be sent to someone, so the user must always see the device
 * and choose.
 */
function QrApprovalSheet({ device, language, onApprove, onDeny }: Props) {
  const [busy, setBusy] = useState(false);
  const t = (key: string) => translateFunction(key, language);

  const run = (action: () => Promise<void> | void) => async () => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qr-sheet-approval">
      <h3>{t("Log in on this device?")}</h3>
      <QrDeviceDetails device={device} language={language} />
      {/* Someone can show the user their own QR, or send its link. If the user
          approves, that person's device signs in to the user's account. */}
      <p className="qr-sheet-warning" data-pw="qr-approve-warning">
        {t("Approve only if you started this sign-in yourself.")}
      </p>
      <div className="qr-sheet-actions">
        <button className="qr-sheet-deny" data-pw="qr-deny" onClick={run(onDeny)} disabled={busy}>
          {t("Deny")}
        </button>
        <button className="qr-sheet-approve" data-pw="qr-approve" onClick={run(onApprove)} disabled={busy}>
          {t("Approve")}
        </button>
      </div>
    </div>
  );
}

export default QrApprovalSheet;
