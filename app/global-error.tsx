"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Logo from "../components/Home/Logo";
import { LogError, translateFunction } from "../utils/functions";
import AuthService from "../services/auth";

import {
  GeneralErrorIllustration,
  NetworkErrorIllustration,
} from "../components/global/ErrorIllustrations";
import "styles/globals.css";
export default function GlobalError({ error, reset }) {
  const sendError = async () => {
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    let last_json;
    let token, user_id;
    if (typeof window !== "undefined") {
      last_json = (await localStorage.getItem("LAST_JSON"))
        ? JSON.parse(localStorage.getItem("LAST_JSON"))
        : null;
    }

    user_id = AuthService.UserID();
    const [country, lang] = (
      window.location.pathname.split("/")[1] || ""
    ).split("-");
    let errorObj = {
      type: "front-end-exception",
      scenario: "global-error-boundary",
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      user_id: user_id,

      user_agent: userAgent,
      country: country,
      language: lang,
    };
    LogError(errorObj);
  };
  useEffect(() => {
    // Sentry's built-in error boundary capture
    Sentry.captureException(error);
    sendError();
  }, [error]);
  if (
    error.message?.includes("Connection") ||
    error.message?.includes("chunks")
  ) {
    return (
      <html lang="en" className="">
        <body className="bg-linear-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
          <div className="flex justify-center flex-col items-center p-8 min-h-screen">
            {/* Logo Section */}
            <div className="mb-8">
              <Logo animated={false} style={true} />
            </div>

            {/* Error Illustration */}
            <div className="mb-8">
              <NetworkErrorIllustration className="w-64 h-64" />
            </div>

            {/* Error Content */}
            <div className="text-center max-w-md mx-auto mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {translateFunction("Connection Lost")}
              </h1>
              <div className="bg-white rounded-lg shadow-lg p-6 border border-red-100">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {translateFunction(
                    "We are having trouble connecting to our servers. This might be due to:"
                  )}
                </p>
                <ul className="text-sm text-gray-500 mb-4 list-disc list-inside space-y-1">
                  <li>{translateFunction("Network connectivity issues")}</li>
                  <li>{translateFunction("Temporary server maintenance")}</li>
                  <li>{translateFunction("Slow internet connection")}</li>
                </ul>
                <div className="bg-red-50 rounded-md p-3 mb-4">
                  <p className="text-red-700 text-sm font-medium">
                    {error.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 min-w-[200px]"
                onClick={() => {
                  window.location.reload();
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {translateFunction("Reload Page")}
              </button>
              <button
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 min-w-[200px]"
                onClick={() => (window.location.href = "/")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {translateFunction("Go Home")}
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }
  return (
    <html lang="en" className="">
      <body className="bg-linear-to-br from-red-50 via-white to-pink-50 min-h-screen">
        <div className="flex justify-center flex-col items-center p-8 min-h-screen">
          {/* Logo Section */}
          <div className="mb-8">
            <Logo animated={false} style={true} />
          </div>

          {/* Error Illustration */}
          <div className="mb-8">
            <GeneralErrorIllustration className="w-64 h-64" />
          </div>

          {/* Error Content */}
          <div className="text-center max-w-md mx-auto mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {translateFunction("Oops! Something went wrong")}
            </h1>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-red-100">
              <p className="text-gray-600 mb-4">
                {translateFunction(
                  "We encountered an unexpected error. Dont worry, our team has been notified and is working on it."
                )}
              </p>
              <div className="bg-red-50 rounded-md p-3 mb-4">
                <p className="text-red-700 text-sm font-medium">
                  {error.message}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {translateFunction("Error ID:")} {Sentry.lastEventId() || "—"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 min-w-[200px]"
              onClick={() => window.location.reload()}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {translateFunction("Try Again")}
            </button>
            <button
              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 min-w-[200px]"
              onClick={() => (window.location.href = "/")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {translateFunction("Go Home")}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
