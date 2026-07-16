"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";
import {
  getQrStatus,
  markScanned,
  approveQrLogin,
  denyQrLogin,
  type QrContext,
  type QrUser,
} from "services/qrLogin";
import "public/styles/qrLogin.css";

type Props = {
  requestId: string;
  user: QrUser;
  isRtl: boolean;
  language: string;
  onDone: (result: "approved" | "denied") => void;
};

function QrApprovalSheet({ requestId, user, isRtl, language, onDone }: Props) {
  const [ctx, setCtx] = useState<QrContext | null>(null);
  const [busy, setBusy] = useState(false);
  const t = (key: string) => translateFunction(key, language);

  // Mark the desktop session as scanned, then read its context to show here.
  useEffect(() => {
    (async () => {
      await markScanned(requestId);
      const res = await getQrStatus(requestId);
      setCtx(res.context || null);
    })();
  }, [requestId]);

  const deviceLine = ctx
    ? [ctx.browser, ctx.os, ctx.city].filter(Boolean).join(" · ")
    : t("a device");

  const approve = async () => {
    setBusy(true);
    await approveQrLogin(requestId, user);
    onDone("approved");
  };
  const deny = async () => {
    setBusy(true);
    await denyQrLogin(requestId);
    onDone("denied");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-sheet-backdrop" dir={isRtl ? "rtl" : "ltr"} onClick={deny}>
      <div className="qr-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{t("Log in on this device?")}</h3>
        <div className="qr-sheet-ctx">{deviceLine}</div>
        <div className="qr-sheet-actions">
          <button className="qr-sheet-deny" onClick={deny} disabled={busy}>
            {t("Deny")}
          </button>
          <button className="qr-sheet-approve" onClick={approve} disabled={busy}>
            {t("Approve")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default QrApprovalSheet;
