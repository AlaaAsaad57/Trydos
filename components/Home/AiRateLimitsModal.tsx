"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  aiRateLimitsAction,
  type AiRateLimitsResult,
} from "serverActions/aiRateLimits";

// DEBUG modal — shows the last Cerebras search-analyzer rate-limit snapshot
// (org-level quota). Opened from the "Show AI Rate Limits" item in the Home
// menu. Lets QA see remaining requests/tokens and reset countdowns so a quota
// hit reads as "AI rate limit", not a bug. Portal + very high z-index.

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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "2px 0",
      }}
    >
      <span style={{ color: "#666", fontSize: 12 }}>{k}</span>
      <span style={{ ...mono, textAlign: "right" }}>{v}</span>
    </div>
  );
}

// Friendly labels for the documented Cerebras headers; unknown x-ratelimit-*
// headers still render with a de-prefixed fallback label.
const HEADER_LABELS: Record<string, string> = {
  "x-ratelimit-limit-requests-day": "Requests / day (limit)",
  "x-ratelimit-remaining-requests-day": "Requests remaining today",
  "x-ratelimit-limit-tokens-minute": "Tokens / min (limit)",
  "x-ratelimit-remaining-tokens-minute": "Tokens remaining (min)",
  "x-ratelimit-reset-requests-day": "Requests reset in",
  "x-ratelimit-reset-tokens-minute": "Tokens reset in",
};

function labelFor(key: string) {
  return (
    HEADER_LABELS[key] ||
    key.replace(/^x-ratelimit-/, "").replace(/-/g, " ")
  );
}

function valueFor(key: string, raw: string) {
  // Reset headers are "seconds until reset".
  if (key.includes("reset")) {
    const n = Number(raw);
    return Number.isFinite(n) ? `${n}s` : raw;
  }
  return raw;
}

function agoText(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return iso;
  const secs = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

function AiRateLimitsModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<AiRateLimitsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiRateLimitsAction();
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load AI rate limits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (typeof document === "undefined") return null;

  const snap = data?.snapshot || null;
  // Order: remaining first (what matters), then limits, then resets.
  const headerEntries = snap
    ? Object.entries(snap.headers).sort(([a], [b]) => {
        const rank = (k: string) =>
          k.includes("remaining") ? 0 : k.includes("reset") ? 2 : 1;
        return rank(a) - rank(b) || a.localeCompare(b);
      })
    : [];

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
          <strong style={{ fontSize: 15 }}>AI Rate Limits (debug)</strong>
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
                Redis is NOT connected — rate-limit snapshots can't be read. This
                panel is a diagnostic, not the limiter itself.
              </div>
            )}

            {data.redis && !snap && (
              <div style={{ ...box, fontSize: 12, color: "#666" }}>
                No snapshot yet. The Cerebras analyzer stores limits after the
                first multi-word search — run one search, then Refresh.
              </div>
            )}

            {snap && (
              <>
                <div style={box}>
                  <div style={label}>Provider</div>
                  <Row k="Provider" v={snap.provider} />
                  <Row k="Model" v={snap.model} />
                  <Row
                    k="Last call"
                    v={
                      <span
                        style={{ color: snap.ok ? "#2e7d32" : "#dc3545" }}
                      >
                        {snap.status} {snap.ok ? "OK" : "rate-limited / error"}
                      </span>
                    }
                  />
                  <Row k="Updated" v={agoText(snap.updatedAt)} />
                </div>

                <div
                  style={{
                    ...box,
                    borderColor: snap.ok ? "#e5e5e5" : "#e0a800",
                  }}
                >
                  <div style={label}>Limits (from last response headers)</div>
                  {headerEntries.length ? (
                    headerEntries.map(([k, v]) => (
                      <Row key={k} k={labelFor(k)} v={valueFor(k, v)} />
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "#999" }}>
                      no x-ratelimit headers returned
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default AiRateLimitsModal;
