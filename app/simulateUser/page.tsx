"use client";
import "styles/globals.css";
import { useCallback, useMemo, useState, useEffect } from "react";
import {
  setCookie,
  getCookie,
  COOKIE_NAMES,
  deleteCookie,
} from "utils/cookies/cookie-manager";
import SessionTimer from "components/Login/SessionTimer";
import { initializeSessionCheck } from "utils/sessionManager";

type ParsedPayload = {
  last_paths?: string[];
  userData?: unknown;
  userChat?: unknown;
  userStories?: unknown;
  [key: string]: unknown;
};

// Normalize value for top-level display: objects/arrays are JSON-stringified
const normalizeTopLevelValue = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const Page = () => {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPayload | null>(null);
  const [cookiesView, setCookiesView] = useState<{ country: any; lang: any }>({
    country: null,
    lang: null,
  });

  // Initialize session check on page load
  useEffect(() => {
    initializeSessionCheck();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setRaw(e.target.value);
    },
    []
  );

  const handleParse = useCallback(() => {
    setError(null);
    setPreview(null);
    try {
      const trimmed = raw.trim();
      if (!trimmed) {
        setError("Paste error JSON first.");
        return;
      }
      const parsed: ParsedPayload = JSON.parse(trimmed);
      setPreview(parsed);

      if (typeof window !== "undefined") {
        // Set session expiry time (30 minutes from now)
        const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000);
        localStorage.setItem("sessionExpiry", sessionExpiry.toISOString());

        // Set cookies with 30-minute expiration
        const cookieOptions = {
          expires: sessionExpiry,
          maxAge: 30 * 60, // 30 minutes in seconds
        };

        if (parsed.userData !== undefined) {
          setCookie(COOKIE_NAMES.USER_DATA, parsed.userData, cookieOptions);
        }
        if (parsed.userChat !== undefined)
          setCookie(COOKIE_NAMES.USER_CHAT, parsed.userChat, cookieOptions);
        else deleteCookie(COOKIE_NAMES.USER_CHAT);
        if (parsed.userStories !== undefined)
          setCookie(
            COOKIE_NAMES.USER_STORIES,
            parsed.userStories,
            cookieOptions
          );
        else deleteCookie(COOKIE_NAMES.USER_STORIES);
        if (parsed.marketToken !== undefined)
          setCookie(
            COOKIE_NAMES.MARKET_TOKEN,
            parsed.marketToken,
            cookieOptions
          );
        else deleteCookie(COOKIE_NAMES.MARKET_TOKEN);
        if (parsed.deviceToken !== undefined)
          setCookie(
            COOKIE_NAMES.DEVICE_TOKEN,
            parsed.deviceToken,
            cookieOptions
          );
        deleteCookie(COOKIE_NAMES.DEVICE_TOKEN);
        // Set country and language cookies if provided in payload
        const countryVal = (parsed as any)?.country;
        const languageVal = (parsed as any)?.language;
        if (typeof countryVal === "string" && countryVal.trim().length > 0) {
          setCookie(COOKIE_NAMES.COUNTRY, countryVal.trim(), cookieOptions);
        }
        if (typeof languageVal === "string" && languageVal.trim().length > 0) {
          setCookie(COOKIE_NAMES.LANG, languageVal.trim(), cookieOptions);
        }

        // Refresh view of cookies after setting
        try {
          setCookiesView({
            country: getCookie(COOKIE_NAMES.COUNTRY),
            lang: getCookie(COOKIE_NAMES.LANG),
          });
        } catch {}
        alert(
          "Done...You Can Now Browse the Site as User ..check Last Page Paths below"
        );
      }
    } catch (err: any) {
      setError("Invalid JSON. Please paste a valid JSON string.");
    }
  }, [raw]);

  const isDisabled = useMemo(() => raw.trim().length === 0, [raw]);

  const keyValueEntries = useMemo(() => {
    if (!preview) return [] as Array<[string, string]>;
    return Object.entries(preview).map(([key, value]) => [
      key,
      normalizeTopLevelValue(value),
    ]);
  }, [preview]);

  return (
    <div className="mx-auto text-[#1d1d1d] flex min-h-[calc(100dvh-4rem)]  w-screen flex-col gap-4 p-4">
      <SessionTimer />
      <h1 className="text-2xl font-semibold">Simulate User</h1>
      <p className="text-sm text-gray-600">
        Paste the error JSON payload captured from backend. On parse, we will
        log userData, userChat, userStories (if present), set country/lang
        cookies, and open the last path.
      </p>
      <textarea
        aria-label="Error JSON payload"
        className="text-[#1d1d1d] min-h-56 w-full resize-y rounded-md border border-gray-300 p-3 font-mono text-sm outline-hidden focus:ring-2 focus:ring-blue-500"
        value={raw}
        onChange={handleChange}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleParse}
          disabled={isDisabled}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Parse And Simulate User
        </button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>

      {preview ? (
        <div className="mt-2 grid gap-4 md:grid-cols-2 text-[#1d1d1d] min-w-0">
          {(() => {
            const msg = (preview as any)?.message;
            if (msg === undefined || msg === null) return null;
            const messageText =
              typeof msg === "string" ? msg : JSON.stringify(msg);
            return (
              <div className="md:col-span-2">
                <span
                  className="block max-w-full wrap-break-word whitespace-pre-wrap items-center rounded-full bg-red-100 px-3 py-1 text-[20px] font-medium text-red-800"
                  aria-label="Parsed message"
                >
                  {messageText}
                </span>
              </div>
            );
          })()}
          {(() => {
            const userIP =
              (preview as any)?.userIP ??
              (preview as any)?.ip ??
              (preview as any)?.ipAddress;
            if (!userIP) return null;
            return (
              <div className="md:col-span-2" aria-label="Parsed user IP">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-base font-medium text-gray-800">
                  IP: {String(userIP)}
                </span>
              </div>
            );
          })()}
          {/* All Parsed Fields */}
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs md:col-span-2 min-w-0"
            role="region"
            aria-label="All Parsed Fields"
            tabIndex={0}
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              All Parsed Fields
            </div>
            <div className="overflow-y-auto overflow-x-hidden rounded-sm border border-gray-100 w-full max-w-full">
              <table className="table-fixed w-full max-w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Key
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {keyValueEntries.map(([key, value]) => (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 focus-within:bg-gray-50"
                    >
                      <td className="px-3 py-2 align-top text-gray-800 font-mono break-all max-w-[90px] w-[90px]">
                        {key}
                      </td>
                      <td className="px-3 py-2 align-top text-gray-900 break-all">
                        <span className="block max-w-full wrap-break-word whitespace-pre-wrap font-mono  break-all">
                          {value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs"
            role="region"
            aria-label="User Data"
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              User Data
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-sm bg-gray-50 p-3 text-xs">
              {JSON.stringify(preview.userData ?? null, null, 2)}
            </pre>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs text-[#1d1d1d]"
            role="region"
            aria-label="User Chat"
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              User Chat
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-sm bg-gray-50 p-3 text-xs">
              {JSON.stringify(preview.userChat ?? null, null, 2)}
            </pre>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs text-[#1d1d1d]"
            role="region"
            aria-label="User Stories"
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              User Stories
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-sm bg-gray-50 p-3 text-xs">
              {JSON.stringify(preview.userStories ?? null, null, 2)}
            </pre>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs text-[#1d1d1d]"
            role="region"
            aria-label="last_request"
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              last_request
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-sm bg-gray-50 p-3 text-xs">
              {JSON.stringify(preview.last_request ?? null, null, 2)}
            </pre>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs text-[#1d1d1d]"
            role="region"
            aria-label="Language and Country"
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              Language & Country
            </div>
            <div className="text-xs text-gray-700">
              <div className="mb-1">
                Language in Error:{" "}
                <span className="font-mono">
                  {String((preview as any)?.language ?? "") || "—"}
                </span>
              </div>
              <div className="mb-1">
                Country in Error:{" "}
                <span className="font-mono">
                  {String((preview as any)?.country ?? "") || "—"}
                </span>
              </div>
            </div>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs md:col-span-2 text-[#1d1d1d]"
            role="region"
            aria-label="Last Paths"
          >
            <div className="mb-2 text-sm font-semibold text-gray-900">
              Last Paths
            </div>
            <div className="flex flex-col gap-2">
              {(Array.isArray(preview.last_paths)
                ? preview.last_paths.filter((p) => typeof p === "string")
                : ([] as string[])
              ).map((p, i) => {
                let href = "#";
                try {
                  const origin =
                    typeof window !== "undefined" ? window.location.origin : "";
                  if (p.startsWith("http")) {
                    try {
                      const u = new URL(p);
                      href = `${origin}${u.pathname}${u.search}${u.hash}`;
                    } catch {
                      href = `${origin}${p}`;
                    }
                  } else {
                    href = `${origin}${p.startsWith("/") ? p : `/${p}`}`;
                  }
                } catch {}
                return (
                  <a
                    key={`${p}-${i}`}
                    href={href}
                    className="text-blue-600 underline underline-offset-2 break-all hover:text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-sm"
                    aria-label={`Open ${p} on same origin`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Page;
