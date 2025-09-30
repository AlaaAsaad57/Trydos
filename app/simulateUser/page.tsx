"use client";
import "styles/globals.css";
import { useCallback, useMemo, useState } from "react";
import {
  setCookie,
  getCookie,
  COOKIE_NAMES,
} from "utils/cookies/cookie-manager";

type ParsedPayload = {
  last_paths?: string[];
  userData?: unknown;
  userChat?: unknown;
  userStories?: unknown;
  [key: string]: unknown;
};

const Page = () => {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPayload | null>(null);
  const [cookiesView, setCookiesView] = useState<{ country: any; lang: any }>({
    country: null,
    lang: null,
  });

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
        if (parsed.userData !== undefined)
          setCookie("userData", parsed.userData);
        if (parsed.userChat !== undefined)
          setCookie("userChat", parsed.userChat);
        if (parsed.userStories !== undefined)
          setCookie("userStories", parsed.userStories);

        // Set country and language cookies if provided in payload
        const countryVal = (parsed as any)?.country;
        const languageVal = (parsed as any)?.language;
        if (typeof countryVal === "string" && countryVal.trim().length > 0) {
          setCookie(COOKIE_NAMES.COUNTRY, countryVal.trim());
        }
        if (typeof languageVal === "string" && languageVal.trim().length > 0) {
          setCookie(COOKIE_NAMES.LANG, languageVal.trim());
        }

        // Refresh view of cookies after setting
        try {
          setCookiesView({
            country: getCookie(COOKIE_NAMES.COUNTRY),
            lang: getCookie(COOKIE_NAMES.LANG),
          });
        } catch {}

        const lastPaths = Array.isArray(parsed.last_paths)
          ? parsed.last_paths.filter((p) => typeof p === "string")
          : [];
        const last =
          lastPaths.length > 0 ? lastPaths[lastPaths.length - 1] : undefined;
        if (last && typeof last === "string") {
          try {
            const url = last.startsWith("http")
              ? last
              : `${window.location.origin}${
                  last.startsWith("/") ? last : `/${last}`
                }`;
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {}
        }
      }
    } catch (err: any) {
      setError("Invalid JSON. Please paste a valid JSON string.");
    }
  }, [raw]);

  const isDisabled = useMemo(() => raw.trim().length === 0, [raw]);

  return (
    <div className="mx-auto text-[#1d1d1d] flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Simulate User</h1>
      <p className="text-sm text-gray-600">
        Paste the error JSON payload captured from backend. On parse, we will
        log userData, userChat, userStories (if present), set country/lang
        cookies, and open the last path.
      </p>
      <textarea
        aria-label="Error JSON payload"
        className="text-[#1d1d1d] min-h-56 w-full resize-y rounded-md border border-gray-300 p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
        value={raw}
        onChange={handleChange}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleParse}
          disabled={isDisabled}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Parse & Open Last Path
        </button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>

      {preview ? (
        <div className="mt-2 grid gap-4 md:grid-cols-2 text-[#1d1d1d]">
          <div className="rounded-md border border-gray-200 p-3">
            <div className="mb-2 text-sm font-medium">User Data</div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(preview.userData ?? null, null, 2)}
            </pre>
          </div>
          <div className="rounded-md border border-gray-200 p-3 text-[#1d1d1d]">
            <div className="mb-2 text-sm font-medium">User Chat</div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(preview.userChat ?? null, null, 2)}
            </pre>
          </div>
          <div className="rounded-md border border-gray-200 p-3 text-[#1d1d1d]">
            <div className="mb-2 text-sm font-medium">User Stories</div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(preview.userStories ?? null, null, 2)}
            </pre>
          </div>
          <div className="rounded-md border border-gray-200 p-3 text-[#1d1d1d]">
            <div className="mb-2 text-sm font-medium">Language & Cookies</div>
            <div className="text-xs text-gray-700">
              <div className="mb-1">
                Language in payload:{" "}
                <span className="font-mono">
                  {String((preview as any)?.language ?? "") || "—"}
                </span>
              </div>
              <div className="mb-1">
                Country cookie:{" "}
                <span className="font-mono">
                  {String(cookiesView.country ?? "") || "—"}
                </span>
              </div>
              <div>
                Language cookie:{" "}
                <span className="font-mono">
                  {String(cookiesView.lang ?? "") || "—"}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-gray-200 p-3 md:col-span-2 text-[#1d1d1d]">
            <div className="mb-2 text-sm font-medium">Last Paths</div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(
                Array.isArray(preview.last_paths) ? preview.last_paths : [],
                null,
                2
              )}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Page;
