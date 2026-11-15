"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";
import QrScannerModal from "components/Login/QrScannerModal";
import QrApprovalSheet from "components/Login/QrApprovalSheet";
import type { QrDeviceInfo } from "components/Login/QrDeviceDetails";
import {
  approveWebQr,
  claimAppQr,
  denyWebQr,
  getClaimStatus,
  markWebQrScanned,
  QR_POLL_MS,
  QrLoginError,
  type ScannedQr,
} from "services/qrLogin";
import "public/styles/qrLogin.css";

type Props = {
  isRtl: boolean;
  language: string;
  /**
   * - true: Direction A. This signed-in phone scans a browser's QR and
   *   approves it.
   * - false: Direction B. This signed-out phone scans a signed-in device's QR,
   *   claims it, and signs in after the approval.
   */
  signedIn: boolean;
  /** Direction B: the other device approved. Collect the tokens and sign in. */
  onSignIn?: (requestId: string) => Promise<void>;
  onClose: () => void;
};

// The phone scanner. It does the app's part on a phone browser until the app
// ships its own scanner (docs/qr-login-tasks.md, section 4).
//
// - 'scanning'  the camera looks for a Trydos QR
// - 'working'   a call is running
// - 'confirm'   Direction A: the browser's place, with Approve and Deny
// - 'waiting'   Direction B: claimed, waiting for the other device to approve
// - 'approved'  Direction A: the browser is signed in
// - 'denied'    the sign-in was denied
// - 'failed'    the code can't be used here: show why, with "Scan again"
type Step = "scanning" | "working" | "confirm" | "waiting" | "approved" | "denied" | "failed";

/** How long the "signed in" or "denied" line stays before the sheet closes. */
const DONE_CLOSE_MS = 1500;

/** The line to show for a refused call. The backend's own message is never shown. */
const failText = (e: unknown) => {
  const status = e instanceof QrLoginError ? e.status : 0;
  if (status === 409) return "This code was used on another device";
  if (status === 410 || status === 404) return "This code expired";
  return "Something went wrong";
};

function QrScanFlow({ isRtl, language, signedIn, onSignIn, onClose }: Props) {
  const t = (key: string) => translateFunction(key, language);
  const [step, setStep] = useState<Step>("scanning");
  const [requestId, setRequestId] = useState("");
  const [device, setDevice] = useState<QrDeviceInfo>({});
  const [failKey, setFailKey] = useState("");

  const fail = (key: string) => {
    setFailKey(key);
    setStep("failed");
  };

  const onDetected = async (qr: ScannedQr) => {
    // A signed-in phone approves a browser (web). A signed-out phone signs
    // itself in (app). Any other pair calls nothing.
    if (qr.kind !== (signedIn ? "web" : "app")) {
      fail("This code is not for this screen");
      return;
    }
    setRequestId(qr.requestId);
    setStep("working");
    try {
      if (signedIn) {
        const where = await markWebQrScanned(qr.requestId);
        setDevice({
          browser: where.browser,
          os: where.os,
          city: where.city,
          region: where.region,
          country: where.country,
        });
        setStep("confirm");
      } else {
        await claimAppQr(qr.requestId);
        setStep("waiting");
      }
    } catch (e) {
      fail(failText(e));
    }
  };

  // Direction B: ask every 2 seconds whether the other device approved. The
  // next call starts after the last one answered, so only one call waits.
  useEffect(() => {
    if (step !== "waiting" || !requestId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await getClaimStatus(requestId);
        if (stopped) return;
        if (res.status === "approved") {
          setStep("working");
          try {
            await onSignIn?.(requestId);
          } catch {
            fail("Something went wrong");
          }
          return;
        }
        if (res.status === "denied") {
          setStep("denied");
          return;
        }
        if (res.status === "expired") {
          fail("This code expired");
          return;
        }
      } catch (e) {
        if (stopped) return;
        // 403: this phone no longer holds the secret. 409: already decided.
        // Neither can change, so stop. Anything else, such as a network
        // blip: keep asking.
        const status = e instanceof QrLoginError ? e.status : 0;
        if (status === 403 || status === 409) {
          fail(failText(e));
          return;
        }
      }
      if (!stopped) timer = setTimeout(poll, QR_POLL_MS);
    };
    timer = setTimeout(poll, QR_POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [step, requestId, onSignIn]);

  useEffect(() => {
    if (step !== "approved" && step !== "denied") return;
    const timer = setTimeout(onClose, DONE_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [step, onClose]);

  const decide = (answer: "approve" | "deny") => async () => {
    try {
      const res = answer === "approve" ? await approveWebQr(requestId) : await denyWebQr(requestId);
      setStep(res.status === "approved" ? "approved" : "denied");
    } catch (e) {
      fail(failText(e));
    }
  };

  // Closing while the browser waits for an answer denies it, so the browser
  // stops waiting at once.
  const close = () => {
    if (step === "confirm" && requestId) denyWebQr(requestId).catch(() => {});
    onClose();
  };

  if (step === "scanning") {
    return (
      <QrScannerModal isRtl={isRtl} language={language} onDetected={onDetected} onClose={onClose} />
    );
  }
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-sheet-backdrop" dir={isRtl ? "rtl" : "ltr"} onClick={close}>
      <div className="qr-sheet" data-pw="qr-scan-sheet" onClick={(e) => e.stopPropagation()}>
        {step === "confirm" && (
          <QrApprovalSheet
            device={device}
            language={language}
            onApprove={decide("approve")}
            onDeny={decide("deny")}
          />
        )}
        {step === "working" && (
          <div className="qr-sheet-status">
            <span className="qr-sheet-spinner" />
          </div>
        )}
        {step === "waiting" && (
          <div className="qr-sheet-status" data-pw="qr-scan-waiting">
            <h3>{t("Approve on your other device")}</h3>
            <span className="qr-sheet-spinner" />
          </div>
        )}
        {step === "approved" && (
          <p className="qr-sheet-result" data-pw="qr-scan-approved">
            {t("The browser is now signed in")}
          </p>
        )}
        {step === "denied" && (
          <p className="qr-sheet-result" data-pw="qr-scan-denied">
            {t("The sign-in was denied")}
          </p>
        )}
        {step === "failed" && (
          <>
            <p className="qr-sheet-result" data-pw="qr-scan-failed">
              {t(failKey)}
            </p>
            <button
              className="qr-sheet-scan-again"
              data-pw="qr-scan-again"
              onClick={() => setStep("scanning")}
            >
              {t("Scan again")}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default QrScanFlow;
