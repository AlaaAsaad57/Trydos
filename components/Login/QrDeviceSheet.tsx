"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";
import CustomQRCode from "components/Login/Enhanced/ui/CustomQRCode";
import QrApprovalSheet from "components/Login/QrApprovalSheet";
import {
  approveDevice,
  createDeviceQrSession,
  denyDevice,
  getDeviceQrStatus,
  isTouchPhone,
  MAX_QR_CODES,
  QR_POLL_MS,
  type QrSession,
} from "services/qrLogin";
import "public/styles/qrLogin.css";

type Props = {
  isRtl: boolean;
  language: string;
  onClose: () => void;
};

// QR login, Direction B: this signed-in browser shows a QR, a phone's app
// claims it, and the user approves the phone here.
//
// - 'loading'   making a code
// - 'pending'   showing the QR, waiting for a phone to claim it
// - 'claimed'   a phone claimed it: show its name with Approve and Deny
// - 'approved'  the phone is signed in
// - 'denied'    the user denied it
// - 'stopped'   MAX_QR_CODES codes expired in a row: wait for "Show a new code"
// - 'error'     a call failed
type Step = "loading" | "pending" | "claimed" | "approved" | "denied" | "stopped" | "error";

/** How long the "signed in" or "denied" line stays before the sheet closes. */
const DONE_CLOSE_MS = 1500;

function QrDeviceSheet({ isRtl, language, onClose }: Props) {
  const t = (key: string) => translateFunction(key, language);
  const [step, setStep] = useState<Step>("loading");
  const [session, setSession] = useState<QrSession | null>(null);
  const [deviceLine, setDeviceLine] = useState("");
  const codesRef = useRef(0);
  const startedRef = useRef(false);

  const start = useCallback(async () => {
    if (codesRef.current >= MAX_QR_CODES) {
      setStep("stopped");
      return;
    }
    codesRef.current += 1;
    setStep("loading");
    try {
      setSession(await createDeviceQrSession());
      setStep("pending");
    } catch {
      setSession(null);
      setStep("error");
    }
  }, []);

  const showNewCode = () => {
    codesRef.current = 0;
    start();
  };

  // React StrictMode mounts twice; make only one session.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start();
  }, [start]);

  // Ask every 2 seconds while a phone may still claim the code, or while the
  // user decides. A claim can still expire while the sheet is open.
  useEffect(() => {
    if (step !== "pending" && step !== "claimed") return;
    if (!session) return;
    // The next call starts 2 seconds after the last one answered, so only one
    // status call is ever waiting. Overlapping calls could each see "expired"
    // and make two codes.
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await getDeviceQrStatus(session.requestId);
        if (stopped) return;
        if (res.status === "expired") {
          start();
          return;
        } else if (res.status === "claimed" && step === "pending") {
          codesRef.current = 0;
          setDeviceLine([res.deviceName, res.platform].filter(Boolean).join(" · "));
          setStep("claimed");
        } else if (res.status === "approved" || res.status === "denied") {
          // Decided in another tab of the same account.
          setStep(res.status);
          return;
        }
      } catch {
        // network blip — keep asking
      }
      if (!stopped) timer = setTimeout(poll, QR_POLL_MS);
    };
    timer = setTimeout(poll, QR_POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [step, session, start]);

  useEffect(() => {
    if (step !== "approved" && step !== "denied") return;
    const timer = setTimeout(onClose, DONE_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [step, onClose]);

  const decide = (answer: "approve" | "deny") => async () => {
    if (!session) return;
    try {
      const res =
        answer === "approve"
          ? await approveDevice(session.requestId)
          : await denyDevice(session.requestId);
      setStep(res.status === "approved" ? "approved" : "denied");
    } catch {
      setStep("error");
    }
  };

  // Closing while a phone waits for an answer denies it, so the phone stops
  // waiting at once.
  const close = () => {
    if (step === "claimed" && session) denyDevice(session.requestId).catch(() => {});
    onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-sheet-backdrop" dir={isRtl ? "rtl" : "ltr"} onClick={close}>
      <div className="qr-sheet" data-pw="qr-device-sheet" onClick={(e) => e.stopPropagation()}>
        {step === "claimed" ? (
          <QrApprovalSheet
            deviceLine={deviceLine}
            language={language}
            onApprove={decide("approve")}
            onDeny={decide("deny")}
          />
        ) : (
          <>
            <h3>{t("Sign in on your phone")}</h3>
            <div className="qr-sheet-ctx">
              {t("In the Trydos app, tap Sign in with QR, then scan this code.")}
            </div>
            <div className="qr-sheet-code">
              {step === "pending" && session && (
                <CustomQRCode value={session.qrPayload} size={220} bg="#FFFFFF" />
              )}
              {step === "loading" && <span className="qr-sheet-spinner" />}
              {step === "approved" && (
                <p className="qr-sheet-result" data-pw="qr-device-approved">
                  {t("Your phone is now signed in")}
                </p>
              )}
              {step === "denied" && (
                <p className="qr-sheet-result" data-pw="qr-device-denied">
                  {t("The sign-in was denied")}
                </p>
              )}
              {(step === "stopped" || step === "error") && (
                <button className="qr-sheet-retry" data-pw="qr-show-new-code" onClick={showNewCode}>
                  {step === "error" && <span>{t("Something went wrong")}</span>}
                  <u>{t("Show a new code")}</u>
                </button>
              )}
            </div>
            {step === "pending" && session && isTouchPhone() && (
              <a className="qr-sheet-open-app" data-pw="qr-open-in-app" href={session.qrPayload}>
                {t("Open in app")}
              </a>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default QrDeviceSheet;
