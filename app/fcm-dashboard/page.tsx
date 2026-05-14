"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "overview" | "inspector" | "broadcast" | "settings";

type Analytics = {
  messagesSent: number;
  deliveryRate: number;
  inactiveTokens: number;
};

type DeviceInfo = {
  platform: string;
  topics: string[];
  appVersion?: string;
};

type Settings = {
  webLinkEnabled: boolean;
  webLink: string;
  badgeCountEnabled: boolean;
  badgeCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "inspector", label: "Device Inspector" },
  { id: "broadcast", label: "Broadcast" },
  { id: "settings", label: "Settings" },
];

const PLATFORM_BADGE: Record<string, string> = {
  IOS: "bg-blue-100 text-blue-700",
  ANDROID: "bg-green-100 text-green-700",
  CHROME: "bg-amber-100 text-amber-700",
  WEB: "bg-amber-100 text-amber-700",
};

const DEFAULT_SETTINGS: Settings = {
  webLinkEnabled: false,
  webLink: "",
  badgeCountEnabled: false,
  badgeCount: 0,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function FcmDashboard() {
  // -- Unlock state
  const [adminToken, setAdminToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);

  // -- Navigation
  const [section, setSection] = useState<Section>("overview");

  // -- Analytics
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // -- Inspector
  const [fcmToken, setFcmToken] = useState("");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorError, setInspectorError] = useState("");

  // -- Broadcast
  const [bTitle, setBTitle] = useState("");
  const [bBody, setBBody] = useState("");
  const [bTopic, setBTopic] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // -- Settings
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── API helpers ─────────────────────────────────────────────────────────────

  function headers(extra?: Record<string, string>) {
    return { "x-fcm-token": adminToken, ...extra };
  }

  async function unlock() {
    const t = tokenInput.trim();
    if (!t) return;
    setUnlockLoading(true);
    setUnlockError("");
    try {
      const res = await fetch("/api/fcm/analytics", {
        headers: { "x-fcm-token": t },
      });
      if (res.status === 401) {
        setUnlockError("Invalid admin token.");
        return;
      }
      const data: Analytics = await res.json();
      setAdminToken(t);
      setAnalytics(data);
      setUnlocked(true);
    } catch {
      setUnlockError("Connection error. Try again.");
    } finally {
      setUnlockLoading(false);
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/fcm/analytics", { headers: headers() });
      if (!res.ok) return;
      setAnalytics(await res.json());
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function inspectToken() {
    const t = fcmToken.trim();
    if (!t) return;
    setInspectorLoading(true);
    setInspectorError("");
    setDeviceInfo(null);
    try {
      const res = await fetch(
        `/api/fcm/inspect?token=${encodeURIComponent(t)}`,
        { headers: headers() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDeviceInfo(data);
    } catch (err: unknown) {
      setInspectorError(
        err instanceof Error ? err.message : "Failed to inspect token.",
      );
    } finally {
      setInspectorLoading(false);
    }
  }

  async function sendBroadcast() {
    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const res = await fetch("/api/fcm/broadcast", {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ title: bTitle, body: bBody, topic: bTopic }),
      });
      const data = await res.json();
      setBroadcastResult(
        data.success
          ? { ok: true, text: `Sent — ID: ${data.messageId}` }
          : { ok: false, text: data.message || "Unknown error" },
      );
    } catch {
      setBroadcastResult({ ok: false, text: "Network error." });
    } finally {
      setBroadcastLoading(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/fcm/settings", { headers: headers() });
      if (!res.ok) return;
      setSettings(await res.json());
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveSettings() {
    setSettingsLoading(true);
    setSettingsSaved(false);
    try {
      const res = await fetch("/api/fcm/settings", {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(settings),
      });
      if (res.ok) setSettingsSaved(true);
    } finally {
      setSettingsLoading(false);
    }
  }

  function navigateTo(s: Section) {
    setSection(s);
    if (s === "overview") fetchAnalytics();
    if (s === "settings") loadSettings();
  }

  // ── Lock Screen ─────────────────────────────────────────────────────────────

  if (!unlocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <LockIcon />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              FCM Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter your admin token to continue.
            </p>
          </div>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="Admin token"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {unlockError && (
            <p className="mt-2 text-xs text-red-600">{unlockError}</p>
          )}
          <button
            onClick={unlock}
            disabled={unlockLoading || !tokenInput.trim()}
            className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {unlockLoading ? "Verifying…" : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-gray-900 text-white">
        <div className="border-b border-gray-800 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            FCM Dashboard
          </p>
          <p className="mt-0.5 text-xs text-gray-600">Internal Debug Tool</p>
        </div>

        <nav className="flex-1 py-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex w-full items-center px-5 py-2.5 text-sm transition-colors ${
                section === item.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <NavIcon id={item.id} active={section === item.id} />
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-800 px-5 py-4">
          <span className="text-xs text-gray-600">Debug Mode</span>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* ── Overview ── */}
        {section === "overview" && (
          <div>
            <SectionHeader
              title="Overview"
              subtitle="Aggregated FCM activity metrics"
              action={
                <RefreshButton
                  loading={analyticsLoading}
                  onClick={fetchAnalytics}
                />
              }
            />
            <div className="mt-6 grid grid-cols-3 gap-5">
              <StatCard
                label="Messages Sent"
                value={analytics?.messagesSent}
                accent="indigo"
                loading={analyticsLoading}
              />
              <StatCard
                label="Est. Delivery Rate"
                value={
                  analytics !== null ? `${analytics.deliveryRate}%` : undefined
                }
                accent="emerald"
                loading={analyticsLoading}
              />
              <StatCard
                label="Inactive Tokens"
                value={analytics?.inactiveTokens}
                accent="rose"
                loading={analyticsLoading}
              />
            </div>
          </div>
        )}

        {/* ── Device Inspector ── */}
        {section === "inspector" && (
          <div>
            <SectionHeader
              title="Device Inspector"
              subtitle="Resolve an FCM token to its platform and subscribed topics"
            />
            <div className="mt-6 flex max-w-2xl gap-3">
              <input
                type="text"
                value={fcmToken}
                onChange={(e) => setFcmToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && inspectToken()}
                placeholder="Paste FCM registration token…"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={inspectToken}
                disabled={inspectorLoading || !fcmToken.trim()}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {inspectorLoading ? "Inspecting…" : "Inspect"}
              </button>
            </div>

            {inspectorError && (
              <p className="mt-3 text-sm text-red-600">{inspectorError}</p>
            )}

            {deviceInfo && (
              <div className="mt-6 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${PLATFORM_BADGE[deviceInfo.platform] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {deviceInfo.platform}
                  </span>
                  {deviceInfo.appVersion && (
                    <span className="text-xs text-gray-400">
                      v{deviceInfo.appVersion}
                    </span>
                  )}
                </div>

                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Active Topic Subscriptions
                </p>
                {deviceInfo.topics.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No active subscriptions found.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {deviceInfo.topics.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-indigo-50 px-2.5 py-1 font-mono text-xs text-indigo-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Broadcast ── */}
        {section === "broadcast" && (
          <div>
            <SectionHeader
              title="Broadcast"
              subtitle="Send a push notification to all subscribers of a topic"
            />
            <div className="mt-6 max-w-lg space-y-4">
              <Field
                label="Topic"
                placeholder="e.g. all_users, en_promotions"
                value={bTopic}
                onChange={setBTopic}
              />
              <Field
                label="Title"
                placeholder="Notification title"
                value={bTitle}
                onChange={setBTitle}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Body
                </label>
                <textarea
                  rows={4}
                  value={bBody}
                  onChange={(e) => setBBody(e.target.value)}
                  placeholder="Notification body text…"
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={sendBroadcast}
                disabled={
                  broadcastLoading || !bTitle || !bBody || !bTopic.trim()
                }
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {broadcastLoading ? "Sending…" : "Send Broadcast"}
              </button>

              {broadcastResult && (
                <p
                  className={`text-sm ${broadcastResult.ok ? "text-emerald-600" : "text-red-600"}`}
                >
                  {broadcastResult.ok ? "✓" : "✗"} {broadcastResult.text}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {section === "settings" && (
          <div>
            <SectionHeader
              title="Platform Settings"
              subtitle="Override notification behaviour per platform"
            />
            <div className="mt-6 max-w-lg space-y-4">
              {/* Web Link */}
              <SettingCard
                title="Web Link"
                description="Override the click-action URL for Chrome / Web users"
                enabled={settings.webLinkEnabled}
                onToggle={(v) =>
                  setSettings((s) => ({ ...s, webLinkEnabled: v }))
                }
              >
                {settings.webLinkEnabled && (
                  <input
                    type="url"
                    value={settings.webLink}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, webLink: e.target.value }))
                    }
                    placeholder="https://example.com/promo"
                    className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </SettingCard>

              {/* Badge Count */}
              <SettingCard
                title="Badge Count"
                description="Set the app-icon badge number for iOS users"
                enabled={settings.badgeCountEnabled}
                onToggle={(v) =>
                  setSettings((s) => ({ ...s, badgeCountEnabled: v }))
                }
              >
                {settings.badgeCountEnabled && (
                  <input
                    type="number"
                    min={0}
                    value={settings.badgeCount}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        badgeCount: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                    className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </SettingCard>

              <button
                onClick={saveSettings}
                disabled={settingsLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {settingsLoading ? "Saving…" : "Save Settings"}
              </button>

              {settingsSaved && (
                <p className="text-sm text-emerald-600">
                  ✓ Settings saved successfully.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  loading,
}: {
  label: string;
  value: string | number | undefined;
  accent: "indigo" | "emerald" | "rose";
  loading: boolean;
}) {
  const styles = {
    indigo: "bg-indigo-50 border-indigo-100",
    emerald: "bg-emerald-50 border-emerald-100",
    rose: "bg-rose-50 border-rose-100",
  };
  const text = {
    indigo: "text-indigo-700",
    emerald: "text-emerald-700",
    rose: "text-rose-700",
  };

  return (
    <div className={`rounded-xl border p-6 ${styles[accent]}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-wider ${text[accent]} opacity-60`}
      >
        {label}
      </p>
      <p className={`mt-3 text-3xl font-bold ${text[accent]}`}>
        {loading ? (
          <span className="inline-block h-8 w-20 animate-pulse rounded-md bg-current opacity-20" />
        ) : value !== undefined ? (
          value
        ) : (
          <span className="text-xl opacity-40">—</span>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function SettingCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        <Toggle enabled={enabled} onChange={onToggle} />
      </div>
      {children}
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        enabled ? "bg-indigo-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function RefreshButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
    >
      <RefreshIcon spinning={loading} />
      {loading ? "Refreshing…" : "Refresh"}
    </button>
  );
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-indigo-600"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function NavIcon({ id, active }: { id: Section; active: boolean }) {
  const cls = `w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-500"}`;

  if (id === "overview") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  }
  if (id === "inspector") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  }
  if (id === "broadcast") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12" />
        <path d="M2 8.32A19.5 19.5 0 0 1 5.07 4.69 19.79 19.79 0 0 1 13.7 1.67 2 2 0 0 1 16 3.68v3" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  // settings
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
