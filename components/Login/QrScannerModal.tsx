"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import { translateFunction } from "utils/functions";
import { parseQrPayload } from "services/qrLogin";
import "public/styles/qrLogin.css";

type Props = {
  isRtl: boolean;
  language: string;
  onDetected: (requestId: string) => void;
  onClose: () => void;
};

function QrScannerModal({ isRtl, language, onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const hitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDetectedRef = useRef(onDetected);
  const [hit, setHit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => translateFunction(key, language);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let mounted = true;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
      const requestId = code ? parseQrPayload(code.data) : null;
      if (requestId && !doneRef.current) {
        doneRef.current = true;
        setHit(true);
        stop();
        hitTimeoutRef.current = setTimeout(() => onDetectedRef.current(requestId), 180);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (mounted) setError(t("Camera unavailable — allow camera access to scan"));
      }
    })();

    return () => {
      mounted = false;
      stop();
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-scanner-root" dir={isRtl ? "rtl" : "ltr"}>
      <video ref={videoRef} className="qr-scanner-video" playsInline muted />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="qr-scanner-title">
        <h3>{t("Scan to sign in")}</h3>
        <p>{t("Point at the QR on your other screen")}</p>
      </div>

      <button
        className="qr-scanner-close"
        style={isRtl ? { left: 20 } : { right: 20 }}
        onClick={onClose}
        aria-label={t("Close")}
      >
        ✕
      </button>

      <div className={`qr-reticle ${hit ? "qr-hit" : ""}`}>
        <span className="qr-corner tl" />
        <span className="qr-corner tr" />
        <span className="qr-corner bl" />
        <span className="qr-corner br" />
        {!hit && <div className="qr-scanline" />}
      </div>

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: 24,
            right: 24,
            textAlign: "center",
            color: "#fff",
            fontSize: 13,
            background: "rgba(0,0,0,0.5)",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>,
    document.body,
  );
}

export default QrScannerModal;
