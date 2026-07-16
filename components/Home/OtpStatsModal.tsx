"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { otpStatsAction, type OtpStatsResult } from "serverActions/otpStats";

// DEBUG modal — shows the live OTP rate-limit counters (session + IP) for the
// current request identity. Opened from the "Show OTP Statics" item in the
// Home menu. Portal + very high z-index so it sits above everything.

const box: React.CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  border: "1px solid #e5e5e5",
  padding: 12,
  marginBottom: 10,
};

const label: React.CSSProperties = {
  fontSize: 11,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 4,
};

const mono: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 12,
  wordBreak: "break-all",
  color: "#222",
};

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "2px 0" }}>
      <span style={{ color: "#666", fontSize: 12 }}>{k}</span>
      <span style={{ ...mono, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function fmtTtl(ttl: number) {
  if (ttl === -2) return "—"; // key does not exist
  if (ttl === -1) return "no expiry";
  return `${ttl}s`;
}

function OtpStatsModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<OtpStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await otpStatsAction();
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load OTP stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (typeof document === "undefined") return null;

  const ipCollapsed =
    data && data.identity.rawIp !== data.identity.normalizedIp;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#f6f6f6",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <strong style={{ fontSize: 15 }}>OTP Stats (debug)</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={load}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #4d84ff",
                background: "#fff",
                color: "#4d84ff",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>

        {loading && <div style={{ fontSize: 13, color: "#666" }}>Loading…</div>}
        {error && <div style={{ fontSize: 13, color: "#d33" }}>{error}</div>}

        {data && !loading && (
          <>
            {!data.redis && (
              <div
                style={{
                  ...box,
                  background: "#fff6f6",
                  borderColor: "#f0c0c0",
                  color: "#c0392b",
                  fontSize: 12,
                }}
              >
                Redis is NOT connected — the rate limiter is failing OPEN
                (everything is allowed). Per-IP / per-session caps are not being
                enforced.
              </div>
            )}

            <div style={box}>
              <div style={label}>Request identity</div>
              <Row k="Raw IP" v={data.identity.rawIp} />
              <Row k="Normalized IP" v={data.identity.normalizedIp} />
              {ipCollapsed && (
                <div style={{ fontSize: 11, color: "#2e7d32", marginTop: 4 }}>
                  IPv6 collapsed to /64 — sessions on this network now share one
                  IP key ✓
                </div>
              )}
              <Row k="IP key" v={data.identity.ip} />
              <Row k="Session key" v={data.identity.sid} />
              <Row
                k="Tokens"
                v={
                  (data.identity.hasMarketToken ? "MARKET " : "") +
                    (data.identity.hasDeviceToken ? "DEVICE" : "") || "none (anon)"
                }
              />
            </div>

            <div style={box}>
              <div style={label}>Limits (effective)</div>
              <Row k="Per session" v={`${data.limits.sessionMax} numbers`} />
              <Row k="Per IP" v={`${data.limits.ipMax} sends`} />
              <Row k="Window" v={`${data.limits.windowSeconds}s`} />
              <Row k="Cooldown" v={`${data.limits.cooldownSeconds}s / IP`} />
            </div>

            <div
              style={{
                ...box,
                borderColor:
                  data.session.count >= data.limits.sessionMax
                    ? "#e0a800"
                    : "#e5e5e5",
              }}
            >
              <div style={label}>
                Session set — {data.session.count}/{data.limits.sessionMax}{" "}
                (expires {fmtTtl(data.session.ttl)})
              </div>
              {data.session.numbers.length ? (
                data.session.numbers.map((n) => (
                  <div key={n} style={mono}>
                    {n}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "#999" }}>empty</div>
              )}
            </div>

            <div
              style={{
                ...box,
                borderColor:
                  data.ip.count >= data.limits.ipMax ? "#dc3545" : "#e5e5e5",
              }}
            >
              <div style={label}>
                IP sends — {data.ip.count}/{data.limits.ipMax} (expires{" "}
                {fmtTtl(data.ip.ttl)})
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>
                total OTPs sent from this IP this window (new + resends)
              </div>
            </div>

            <div style={box}>
              <div style={label}>Active cooldown (per IP)</div>
              {data.cooldown.ttl > 0 ? (
                <Row k="next OTP in" v={`${data.cooldown.ttl}s`} />
              ) : (
                <div style={{ fontSize: 12, color: "#999" }}>none</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default OtpStatsModal;
