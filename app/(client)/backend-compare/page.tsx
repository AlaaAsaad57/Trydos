"use client";

import { useState } from "react";
import "styles/globals.css";
/**
 * Laravel vs Go backend performance comparison.
 *
 * Hits the SAME path on both backends (NEXT_PUBLIC_BACKEND_URL = Laravel,
 * NEXT_PUBLIC_GO_BACKEND_URL = Go) with identical method / body / headers,
 * runs N iterations each, and reports avg/min/max latency plus which backend
 * is faster and by what percentage.
 *
 * Requests go straight from the browser to each backend (same approach as the
 * existing /api-test page). You supply the access token, language and country;
 * those are sent as the Authorization / lang / country headers the backends
 * expect.
 */

const LARAVEL_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const GO_BASE = process.env.NEXT_PUBLIC_GO_BACKEND_URL || "";

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

interface EndpointConfig {
  id: string;
  name: string;
  path: string;
  method: string;
  body: string;
}

// Endpoints that have already been migrated to Go (mirrors GO_APIS in
// utils/server/tokenManager.ts). These make good comparison defaults.
const DEFAULT_ENDPOINTS: EndpointConfig[] = [
  {
    id: "1",
    name: "Starting Settings",
    path: "/web/home/startingSettings",
    method: "GET",
    body: "",
  },
  {
    id: "2",
    name: "Currency",
    path: "/home/currency",
    method: "GET",
    body: "",
  },
  {
    id: "3",
    name: "Register Guest",
    path: "/auth/register-guest",
    method: "POST",
    body: "{}",
  },
  {
    id: "4",
    name: "Checklist",
    path: "/checklist",
    method: "GET",
    body: "",
  },
  {
    id: "5",
    name: "Cart Add",
    path: "/cart/add",
    method: "POST",
    body: '{\n  "product_id": 1,\n  "quantity": 1\n}',
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
  endpoint: EndpointConfig;
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

export default function BackendComparePage() {
  const [token, setToken] = useState("");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("gb");
  const [iterations, setIterations] = useState(10);
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>(DEFAULT_ENDPOINTS);
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

  // Run one HTTP call and measure wall-clock time.
  const runOnce = async (
    base: string,
    ep: EndpointConfig,
  ): Promise<SingleRun & { body?: string }> => {
    const headers = buildHeaders();
    const options: RequestInit = {
      method: ep.method,
      headers,
      credentials: "omit",
      cache: "no-store",
    };
    if (["POST", "PUT", "PATCH"].includes(ep.method) && ep.body.trim()) {
      options.body = ep.body;
      headers["Content-Type"] = "application/json";
    }

    const url = base.replace(/\/$/, "") + ep.path;
    const start = performance.now();
    try {
      const res = await fetch(url, options);
      const time = performance.now() - start;
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        /* ignore body read errors */
      }
      return {
        ok: res.ok,
        status: res.status,
        time,
        body: bodyText.slice(0, 2000),
      };
    } catch (err) {
      const time = performance.now() - start;
      return {
        ok: false,
        status: 0,
        time,
        error: err instanceof Error ? err.message : "Network error",
        body: "",
      };
    }
  };

  const runBackend = async (
    base: string,
    ep: EndpointConfig,
  ): Promise<BackendResult> => {
    const runs: SingleRun[] = [];
    let lastStatus = 0;
    let lastBody = "";
    for (let i = 0; i < iterations; i++) {
      const r = await runOnce(base, ep);
      runs.push({ ok: r.ok, status: r.status, time: r.time, error: r.error });
      lastStatus = r.status;
      if (r.body) lastBody = r.body;
    }
    return summarize(runs, lastStatus, lastBody);
  };

  const runTest = async () => {
    if (!LARAVEL_BASE || !GO_BASE) {
      alert(
        "Backend URLs are not configured. Check NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_GO_BACKEND_URL.",
      );
      return;
    }
    setRunning(true);
    setResults([]);
    const out: ComparisonResult[] = [];

    for (const ep of endpoints) {
      if (!ep.path.trim()) continue;
      setProgress(`Testing "${ep.name || ep.path}" …`);

      // Warm-up call to each backend (excluded from stats) so the first-request
      // connection/TLS cost doesn't unfairly skew one side.
      await runOnce(LARAVEL_BASE, ep);
      await runOnce(GO_BASE, ep);

      const laravel = await runBackend(LARAVEL_BASE, ep);
      const go = await runBackend(GO_BASE, ep);

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
    field: keyof EndpointConfig,
    value: string,
  ) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };
  const addEndpoint = () => {
    setEndpoints((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: "",
        path: "",
        method: "GET",
        body: "",
      },
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
          Same path, method, body and headers fired at both backends. Times are
          wall-clock latency measured in the browser (a warm-up request per
          backend is discarded).
        </p>

        {/* Base URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-orange-700 uppercase mb-1">
              Laravel base URL
            </div>
            <div className="text-sm text-gray-700 break-all">
              {LARAVEL_BASE || "⚠️ NEXT_PUBLIC_BACKEND_URL not set"}
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-sky-700 uppercase mb-1">
              Go base URL
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

        {/* Endpoints editor */}
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
          <div className="space-y-4">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="border border-gray-200 rounded-md p-4 space-y-2"
              >
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    value={ep.name}
                    onChange={(e) =>
                      updateEndpoint(ep.id, "name", e.target.value)
                    }
                    placeholder="Name"
                    className="md:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  <input
                    type="text"
                    value={ep.path}
                    onChange={(e) =>
                      updateEndpoint(ep.id, "path", e.target.value)
                    }
                    placeholder="/path/on/both/backends"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => removeEndpoint(ep.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm"
                  >
                    Remove
                  </button>
                </div>
                {["POST", "PUT", "PATCH"].includes(ep.method) && (
                  <textarea
                    value={ep.body}
                    onChange={(e) =>
                      updateEndpoint(ep.id, "body", e.target.value)
                    }
                    placeholder="Request body (JSON)"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                  />
                )}
              </div>
            ))}
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
                        {r.endpoint.name || r.endpoint.path}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {r.endpoint.method} {r.endpoint.path}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold">{ms(r.laravel.avg)}</div>
                      <div className="text-xs text-gray-500">
                        {ms(r.laravel.min)} / {ms(r.laravel.max)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.laravel.successCount}/{iterations} ok · status{" "}
                        {r.laravel.lastStatus}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold">{ms(r.go.avg)}</div>
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
                    <td className="py-3 pl-2 text-right font-medium">
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
