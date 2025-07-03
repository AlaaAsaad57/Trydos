"use client";

import { useGuestSession } from "@/hooks/useGuestSession";
import { getCookie, COOKIE_NAMES } from "@/utils/cookies/cookie-manager";

export function GuestSessionTest() {
  const {
    isLoading,
    hasValidSession,
    userData,
    deviceToken,
    isAuthenticated,
    ensureSession,
  } = useGuestSession();

  const handleEnsureSession = async () => {
    await ensureSession();
  };

  const debugInfo = {
    deviceTokenFromCookie: getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN),
    marketTokenFromCookie: getCookie<string>(COOKIE_NAMES.MARKET_TOKEN),
    userDataFromCookie: getCookie(COOKIE_NAMES.USER_DATA),
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Guest Session Status</h3>

      <div className="space-y-2 mb-4">
        <div>
          <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
        </div>
        <div>
          <strong>Has Valid Session:</strong> {hasValidSession ? "Yes" : "No"}
        </div>
        <div>
          <strong>Is Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
        </div>
        <div>
          <strong>Device Token:</strong>{" "}
          {deviceToken ? "✓ Present" : "✗ Missing"}
        </div>
        <div>
          <strong>User Data:</strong>{" "}
          {userData ? `User ID: ${userData.id}` : "✗ Missing"}
        </div>
      </div>

      <button
        onClick={handleEnsureSession}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? "Creating Session..." : "Ensure Guest Session"}
      </button>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">
          Debug Info
        </summary>
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}
