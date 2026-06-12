"use client";

import { useState } from "react";
import "styles/globals.css";
/**
 * Laravel vs Go backend performance comparison.
 *
 * Each endpoint row is ONE logical API expressed as two independent, fully
 * editable URLs — the left cell hits server A, the right cell hits server B.
 * They are paired only for reporting ("same API, different servers"); the paths,
 * hosts and even ports may differ. A template (base URL + path) is pre-filled
 * when you add a row, but every URL is free text you can rewrite afterwards.
 *
 * Requests are NOT sent from the browser directly — they go through the
 * same-origin `/api/backend-compare` route, which forwards them server-to-server.
 * That sidesteps CORS entirely (the Go backend rejects browser pre-flights) and
 * the latency reported is the pure backend round-trip measured on the server.
 */

const LARAVEL_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const GO_BASE = process.env.NEXT_PUBLIC_GO_BACKEND_URL || "";

const PROXY_URL = "/api/backend-compare";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "tr", label: "Türkçe" },
  { value: "ku", label: "کوردی" },
];

const COUNTRIES = [
  { value: "gb", label: "United Kingdom" },
  { value: "sy", label: "Syria" },
  { value: "tr", label: "Turkey" },
  { value: "lb", label: "Lebanon" },
  { value: "jo", label: "Jordan" },
  { value: "eg", label: "Egypt" },
];

// Optional teardown fired after EACH call (warm-up + every measured iteration)
// so a mutating endpoint can be retried cleanly. Its latency is NOT measured.
// Example: Cart Add must remove the item it just created before the next add,
// using the cart-item id returned in the add response.
interface CleanupConfig {
  enabled: boolean;
  url: string; // full URL of the teardown request (e.g. Laravel /cart/remove)
  idPath: string; // dot-path to the id inside the call's response (e.g. data.id_cart)
  bodyTemplate: string; // teardown body; "{{id}}" is replaced with the extracted id
}

// One row = one API, with a separate free-typed URL + body per backend.
interface EndpointPair {
  id: string;
  name: string;
  method: string;
  leftUrl: string; // server A (Laravel) — full URL, editable
  rightUrl: string; // server B (Go) — full URL, editable
  leftBody: string; // server A request body, editable
  rightBody: string; // server B request body, editable
  cleanup?: CleanupConfig; // optional unmeasured teardown after each call
}

const join = (base: string, path: string) =>
  base.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);

// Bases used to pre-fill the default rows. They fall back to the configured
// env URLs, but default to the known dev hosts so the comparison set always
// loads ready to run.
const LARAVEL_DEFAULT_BASE =
  LARAVEL_BASE || "https://trydos_develop.ramaaz.dev/api/v1";
const GO_DEFAULT_BASE = GO_BASE || "https://trydosv2.ramaaz.dev/api/v1";

// New (manually added) rows pre-fill from the env template; defaults below are
// explicit because each side can carry a different URL/body.
const pair = (
  id: string,
  name: string,
  method: string,
  path: string,
  body = "",
): EndpointPair => ({
  id,
  name,
  method,
  leftUrl: LARAVEL_BASE ? join(LARAVEL_BASE, path) : path,
  rightUrl: GO_BASE ? join(GO_BASE, path) : path,
  leftBody: body,
  rightBody: body,
});

// Endpoints already migrated to Go — the comparison set shown on every load.
// Cart Add intentionally differs per side (Laravel expects `id`, Go expects
// `product_id`).
const DEFAULT_ENDPOINTS: EndpointPair[] = [
  {
    id: "1",
    name: "Starting Settings",
    method: "GET",
    leftUrl: join(LARAVEL_DEFAULT_BASE, "/web/home/startingSettings"),
    rightUrl: join(GO_DEFAULT_BASE, "/web/home/startingSettings"),
    leftBody: "",
    rightBody: "",
  },
  {
    id: "2",
    name: "Currency",
    method: "GET",
    leftUrl: join(LARAVEL_DEFAULT_BASE, "/home/currency"),
    rightUrl: join(GO_DEFAULT_BASE, "/home/currency"),
    leftBody: "",
    rightBody: "",
  },
  {
    id: "3",
    name: "Register Guest",
    method: "POST",
    leftUrl: join(LARAVEL_DEFAULT_BASE, "/auth/register-guest"),
    rightUrl: join(GO_DEFAULT_BASE, "/auth/register-guest"),
    leftBody: '{\n  "original_user_id": 9040\n}',
    rightBody: '{\n  "original_user_id": 9040\n}',
  },
  {
    id: "4",
    name: "Cart Add",
    method: "POST",
    leftUrl: join(LARAVEL_DEFAULT_BASE, "/cart/add"),
    rightUrl: join(GO_DEFAULT_BASE, "/cart/add"),
    leftBody:
      '{\n  "id": 17,\n  "image": "pllchnqdjlerqxmvxl7r.jpg",\n  "quantity": 1,\n  "product_variation_id": "cdc8a521-e3dc-4571-b417-7d5785ff8fca",\n  "is_luck": false\n}',
    rightBody:
      '{\n  "product_id": 17,\n  "image": "pllchnqdjlerqxmvxl7r.jpg",\n  "quantity": 1,\n  "product_variation_id": "cdc8a521-e3dc-4571-b417-7d5785ff8fca",\n  "is_luck": false\n}',
    // After each add, remove the created item via Laravel so the next add is
    // clean. The add response carries the cart-item id at data.id_cart, which
    // /cart/remove expects as { "key": <id> }.
    cleanup: {
      enabled: true,
      url: join(LARAVEL_DEFAULT_BASE, "/cart/remove"),
      idPath: "data.id_cart",
      bodyTemplate: '{ "key": {{id}} }',
    },
  },
];

interface SingleRun {
  ok: boolean;
  status: number;
  time: number; // ms
  error?: string;
}

interface BackendResult {
  runs: SingleRun[];
  avg: number;
  min: number;
  max: number;
  successCount: number;
  lastStatus: number;
  lastBody: string;
}

interface ComparisonResult {
  endpoint: EndpointPair;
  laravel: BackendResult;
  go: BackendResult;
  winner: "laravel" | "go" | "tie" | "n/a";
  diffPercent: number; // how much faster the winner is
}

function summarize(runs: SingleRun[], lastStatus: number, lastBody: string): BackendResult {
  const ok = runs.filter((r) => r.ok);
  const times = ok.map((r) => r.time);
  const avg = times.length
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0;
  return {
    runs,
    avg,
    min: times.length ? Math.min(...times) : 0,
    max: times.length ? Math.max(...times) : 0,
    successCount: ok.length,
    lastStatus,
    lastBody,
  };
}

// Walk a dot-path ("data.id_cart") into a parsed response and pull the id out.
function extractId(bodyText: string, idPath: string): string | number | null {
  if (!bodyText || !idPath.trim()) return null;
  try {
    const json = JSON.parse(bodyText);
    const value = idPath
      .split(".")
      .reduce<unknown>(
        (acc, key) =>
          acc != null && typeof acc === "object"
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        json,
      );
    return typeof value === "string" || typeof value === "number"
      ? value
      : null;
  } catch {
    return null;
  }
}

export default function BackendComparePage() {
  const [token, setToken] = useState("");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("gb");
  const [iterations, setIterations] = useState(10);
  const [endpoints, setEndpoints] = useState<EndpointPair[]>(DEFAULT_ENDPOINTS);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      accept: "application/json",
      lang: language,
      "Accept-Language": language,
      "x-lang": language,
      country: country,
      countryCode: country.toUpperCase(),
    };
    if (token.trim()) {
      headers["Authorization"] = `Bearer ${token.trim()}`;
    }
    return headers;
  };

  // Run one HTTP call (via the same-origin proxy) and capture the
  // server-measured backend latency.
  const runOnce = async (
    url: string,
    ep: EndpointPair,
    rawBody: string,
  ): Promise<SingleRun & { body?: string }> => {
    const headers = buildHeaders();
    const sendBody =
      ["POST", "PUT", "PATCH"].includes(ep.method) && rawBody.trim()
        ? rawBody
        : undefined;
    if (sendBody) headers["Content-Type"] = "application/json";

    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          url,
          method: ep.method,
          headers,
          body: sendBody,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        status: number;
        time: number;
        error?: string;
        body?: string;
      };
      return {
        ok: data.ok,
        status: data.status,
        time: data.time ?? 0,
        error: data.error,
        body: data.body ?? "",
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        time: 0,
        error: err instanceof Error ? err.message : "Proxy request failed",
        body: "",
      };
    }
  };

  // Fire the teardown request (e.g. /cart/remove). Unmeasured and best-effort —
  // failures are swallowed so they never affect the comparison.
  const runCleanup = async (cleanup: CleanupConfig, id: string | number) => {
    const headers = buildHeaders();
    headers["Content-Type"] = "application/json";
    const body = cleanup.bodyTemplate.replace(/\{\{\s*id\s*\}\}/g, String(id));
    try {
      await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          url: cleanup.url,
          method: "POST",
          headers,
          body,
        }),
      });
    } catch {
      /* teardown is best-effort */
    }
  };

  // One measured call, followed by its (unmeasured) teardown so the next
  // iteration starts from a clean state.
  const runMeasured = async (url: string, ep: EndpointPair, rawBody: string) => {
    const r = await runOnce(url, ep, rawBody);
    if (ep.cleanup?.enabled && ep.cleanup.url.trim() && r.body) {
      const id = extractId(r.body, ep.cleanup.idPath);
      if (id != null) await runCleanup(ep.cleanup, id);
    }
    return r;
  };

  const runBackend = async (
    url: string,
    ep: EndpointPair,
    rawBody: string,
  ): Promise<BackendResult> => {
    const runs: SingleRun[] = [];
    let lastStatus = 0;
    let lastBody = "";
    for (let i = 0; i < iterations; i++) {
      const r = await runMeasured(url, ep, rawBody);
      runs.push({ ok: r.ok, status: r.status, time: r.time, error: r.error });
      lastStatus = r.status;
      if (r.body) lastBody = r.body;
    }
    return summarize(runs, lastStatus, lastBody);
  };

  const runTest = async () => {
    setRunning(true);
    setResults([]);
    const out: ComparisonResult[] = [];

    for (const ep of endpoints) {
      const hasLeft = ep.leftUrl.trim();
      const hasRight = ep.rightUrl.trim();
      if (!hasLeft && !hasRight) continue;
      setProgress(`Testing "${ep.name || ep.leftUrl || ep.rightUrl}" …`);

      // Warm-up call to each side (excluded from stats) so the first-request
      // connection/TLS cost doesn't unfairly skew one backend. Runs the teardown
      // too, so the warm-up doesn't leave a stale item behind.
      if (hasLeft) await runMeasured(ep.leftUrl, ep, ep.leftBody);
      if (hasRight) await runMeasured(ep.rightUrl, ep, ep.rightBody);

      const laravel = hasLeft
        ? await runBackend(ep.leftUrl, ep, ep.leftBody)
        : summarize([], 0, "");
      const go = hasRight
        ? await runBackend(ep.rightUrl, ep, ep.rightBody)
        : summarize([], 0, "");

      let winner: ComparisonResult["winner"] = "n/a";
      let diffPercent = 0;
      if (laravel.successCount > 0 && go.successCount > 0) {
        if (laravel.avg === go.avg) {
          winner = "tie";
        } else if (go.avg < laravel.avg) {
          winner = "go";
          diffPercent = ((laravel.avg - go.avg) / laravel.avg) * 100;
        } else {
          winner = "laravel";
          diffPercent = ((go.avg - laravel.avg) / go.avg) * 100;
        }
      }

      out.push({ endpoint: ep, laravel, go, winner, diffPercent });
      setResults([...out]);
    }

    setProgress("");
    setRunning(false);
  };

  // ---- endpoint row editing ----
  const updateEndpoint = (
    id: string,
    field: keyof EndpointPair,
    value: string,
  ) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };
  const updateCleanup = (
    id: string,
    field: keyof CleanupConfig,
    value: string | boolean,
  ) => {
    setEndpoints((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const base: CleanupConfig = e.cleanup ?? {
          enabled: false,
          url: "",
          idPath: "data.id_cart",
          bodyTemplate: '{ "key": {{id}} }',
        };
        return { ...e, cleanup: { ...base, [field]: value } };
      }),
    );
  };
  const addEndpoint = () => {
    setEndpoints((prev) => [
      ...prev,
      pair(`${Date.now()}`, "", "GET", ""),
    ]);
  };
  const removeEndpoint = (id: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
  };

  // ---- aggregate summary across all tested endpoints ----
  const tested = results.filter((r) => r.winner === "go" || r.winner === "laravel");
  const goWins = tested.filter((r) => r.winner === "go").length;
  const laravelWins = tested.filter((r) => r.winner === "laravel").length;
  const avgGo =
    tested.length > 0
      ? tested.reduce((a, r) => a + r.go.avg, 0) / tested.length
      : 0;
  const avgLaravel =
    tested.length > 0
      ? tested.reduce((a, r) => a + r.laravel.avg, 0) / tested.length
      : 0;
  const overallWinner =
    avgGo === 0 || avgLaravel === 0
      ? "n/a"
      : avgGo < avgLaravel
        ? "go"
        : avgGo > avgLaravel
          ? "laravel"
          : "tie";
  const overallDiff =
    overallWinner === "go"
      ? ((avgLaravel - avgGo) / avgLaravel) * 100
      : overallWinner === "laravel"
        ? ((avgGo - avgLaravel) / avgGo) * 100
        : 0;

  const ms = (n: number) => `${n.toFixed(1)} ms`;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 text-[#383838]">
      <div className="max-w-6xl mx-auto my-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Laravel vs Go — Backend Performance
        </h1>
        <p className="text-gray-600 mb-8">
          Each row is one API with a separate, fully editable URL per backend.
          Requests are proxied server-side (no CORS) and the reported time is the
          pure backend round-trip; a warm-up request per side is discarded.
        </p>

        {/* Base URLs (used only to pre-fill new rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-orange-700 uppercase mb-1">
              Server A — Laravel base (template)
            </div>
            <div className="text-sm text-gray-700 break-all">
              {LARAVEL_BASE || "⚠️ NEXT_PUBLIC_BACKEND_URL not set"}
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-sky-700 uppercase mb-1">
              Server B — Go base (template)
            </div>
            <div className="text-sm text-gray-700 break-all">
              {GO_BASE || "⚠️ NEXT_PUBLIC_GO_BACKEND_URL not set"}
            </div>
          </div>
        </div>

        {/* Global settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iterations per backend
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={iterations}
                onChange={(e) =>
                  setIterations(Math.max(1, Math.min(100, +e.target.value || 1)))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={runTest}
                disabled={running}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {running ? "Running…" : "Run the test"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access token (sent as{" "}
              <code className="text-xs">Authorization: Bearer …</code>)
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste MARKET-TOKEN / DEVICE-TOKEN here"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {progress && (
            <div className="mt-3 text-sm text-blue-600">{progress}</div>
          )}
        </div>

        {/* Endpoints editor — two columns, one row per API */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Endpoints to compare</h2>
            <button
              onClick={addEndpoint}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              + Add endpoint
            </button>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid grid-cols-2 gap-4 mb-2 px-1">
            <div className="text-xs font-semibold text-orange-700 uppercase">
              Server A — Laravel URL
            </div>
            <div className="text-xs font-semibold text-sky-700 uppercase">
              Server B — Go URL
            </div>
          </div>

          <div className="space-y-4">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="border border-gray-200 rounded-md p-4 space-y-3"
              >
                {/* Shared meta: name + method, with remove */}
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    value={ep.name}
                    onChange={(e) =>
                      updateEndpoint(ep.id, "name", e.target.value)
                    }
                    placeholder="API name (optional)"
                    className="md:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <select
                    value={ep.method}
                    onChange={(e) =>
                      updateEndpoint(ep.id, "method", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <button
                    onClick={() => removeEndpoint(ep.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm self-start"
                  >
                    Remove
                  </button>
                </div>

                {/* Two columns: left = server A (URL + body), right = server B */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={ep.leftUrl}
                      onChange={(e) =>
                        updateEndpoint(ep.id, "leftUrl", e.target.value)
                      }
                      placeholder="https://laravel.host/full/url"
                      className="w-full px-3 py-2 border border-orange-200 bg-orange-50/40 rounded-md font-mono text-xs"
                    />
                    {["POST", "PUT", "PATCH"].includes(ep.method) && (
                      <textarea
                        value={ep.leftBody}
                        onChange={(e) =>
                          updateEndpoint(ep.id, "leftBody", e.target.value)
                        }
                        placeholder="Server A request body (JSON)"
                        className="w-full h-24 px-3 py-2 border border-orange-200 bg-orange-50/40 rounded-md font-mono text-xs"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={ep.rightUrl}
                      onChange={(e) =>
                        updateEndpoint(ep.id, "rightUrl", e.target.value)
                      }
                      placeholder="https://go.host/full/url"
                      className="w-full px-3 py-2 border border-sky-200 bg-sky-50/40 rounded-md font-mono text-xs"
                    />
                    {["POST", "PUT", "PATCH"].includes(ep.method) && (
                      <textarea
                        value={ep.rightBody}
                        onChange={(e) =>
                          updateEndpoint(ep.id, "rightBody", e.target.value)
                        }
                        placeholder="Server B request body (JSON)"
                        className="w-full h-24 px-3 py-2 border border-sky-200 bg-sky-50/40 rounded-md font-mono text-xs"
                      />
                    )}
                  </div>
                </div>

                {/* Optional unmeasured teardown after each call (e.g. remove
                    the cart item that Cart Add just created). */}
                <div className="border-t border-gray-100 pt-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!ep.cleanup?.enabled}
                      onChange={(e) =>
                        updateCleanup(ep.id, "enabled", e.target.checked)
                      }
                    />
                    Reset after each call (not measured) — runs a teardown
                    request so the call can be repeated cleanly
                  </label>
                  {ep.cleanup?.enabled && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">
                          Teardown URL (POST)
                        </span>
                        <input
                          type="text"
                          value={ep.cleanup.url}
                          onChange={(e) =>
                            updateCleanup(ep.id, "url", e.target.value)
                          }
                          placeholder="https://laravel.host/api/v1/cart/remove"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">
                          Id path in the response
                        </span>
                        <input
                          type="text"
                          value={ep.cleanup.idPath}
                          onChange={(e) =>
                            updateCleanup(ep.id, "idPath", e.target.value)
                          }
                          placeholder="data.id_cart"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-xs text-gray-500 mb-1">
                          Teardown body — <code>{"{{id}}"}</code> is replaced with
                          the extracted id
                        </span>
                        <input
                          type="text"
                          value={ep.cleanup.bodyTemplate}
                          onChange={(e) =>
                            updateCleanup(ep.id, "bodyTemplate", e.target.value)
                          }
                          placeholder='{ "key": {{id}} }'
                          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {endpoints.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-6">
                No endpoints. Click “+ Add endpoint” to start.
              </div>
            )}
          </div>
        </div>

        {/* Overall summary */}
        {tested.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Overall result</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-xs uppercase text-orange-700 font-semibold">
                  Laravel avg
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {ms(avgLaravel)}
                </div>
                <div className="text-sm text-gray-600">{laravelWins} wins</div>
              </div>
              <div
                className={`rounded-lg p-4 ${
                  overallWinner === "go"
                    ? "bg-sky-100 ring-2 ring-sky-400"
                    : overallWinner === "laravel"
                      ? "bg-orange-100 ring-2 ring-orange-400"
                      : "bg-gray-100"
                }`}
              >
                <div className="text-xs uppercase text-gray-700 font-semibold">
                  Winner
                </div>
                <div className="text-2xl font-bold capitalize text-gray-900">
                  {overallWinner === "n/a" ? "—" : overallWinner}
                </div>
                {overallWinner !== "n/a" && overallWinner !== "tie" && (
                  <div className="text-sm text-gray-700">
                    {overallDiff.toFixed(1)}% faster on average
                  </div>
                )}
              </div>
              <div className="bg-sky-50 rounded-lg p-4">
                <div className="text-xs uppercase text-sky-700 font-semibold">
                  Go avg
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {ms(avgGo)}
                </div>
                <div className="text-sm text-gray-600">{goWins} wins</div>
              </div>
            </div>
          </div>
        )}

        {/* Per-endpoint table */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">Per-endpoint results</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4">Endpoint</th>
                  <th className="py-2 px-2 text-orange-700">Laravel (avg / min / max)</th>
                  <th className="py-2 px-2 text-sky-700">Go (avg / min / max)</th>
                  <th className="py-2 px-2">Winner</th>
                  <th className="py-2 pl-2 text-right">Faster by</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.endpoint.id}
                    className="border-b border-gray-100 align-top"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-800">
                        {r.endpoint.name || r.endpoint.leftUrl || r.endpoint.rightUrl}
                      </div>
                      <div className="text-xs text-gray-500 font-mono break-all">
                        {r.endpoint.method}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-black">{ms(r.laravel.avg)}</div>
                      <div className="text-xs text-gray-500">
                        {ms(r.laravel.min)} / {ms(r.laravel.max)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.laravel.successCount}/{iterations} ok · status{" "}
                        {r.laravel.lastStatus}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-black">{ms(r.go.avg)}</div>
                      <div className="text-xs text-gray-500">
                        {ms(r.go.min)} / {ms(r.go.max)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.go.successCount}/{iterations} ok · status{" "}
                        {r.go.lastStatus}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                          r.winner === "go"
                            ? "bg-sky-100 text-sky-800"
                            : r.winner === "laravel"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.winner}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right font-medium text-black">
                      {r.winner === "go" || r.winner === "laravel"
                        ? `${r.diffPercent.toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
