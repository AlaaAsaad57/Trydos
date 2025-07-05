"use client";

import { useState } from "react";
import { reportError } from "@/utils/error-reporter";
import { ErrorBoundary } from "@/components/global/ErrorBoundary";

// Component that throws an error when triggered
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test React Error Boundary - Component rendering failed!");
  }
  return (
    <div className="text-green-600 font-medium">
      ✅ Component rendered successfully
    </div>
  );
}

// Async component that can fail
function AsyncErrorComponent() {
  const [loading, setLoading] = useState(false);

  const triggerAsyncError = async () => {
    setLoading(true);
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Async operation failed - network timeout"));
        }, 1000);
      });
    } catch (error) {
      reportError(error as Error, {
        component: "AsyncErrorComponent",
        action: "triggerAsyncError",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={triggerAsyncError}
        disabled={loading}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors duration-200"
      >
        {loading ? "⏳ Loading..." : "🔄 Trigger Async Error"}
      </button>
    </div>
  );
}

export function ErrorTester() {
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [showTester, setShowTester] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const triggerJavaScriptError = () => {
    // Intentional undefined access
    const obj: any = null;
    obj.nonExistentProperty.someMethod();
  };

  const triggerTypeError = () => {
    const num: any = "not a number";
    num.toFixed();
  };

  const triggerManualError = () => {
    reportError(new Error("Manual error report test"), {
      source: "manual-test",
      component: "ErrorTester",
      severity: "high",
      userAction: "button-click",
      testData: {
        timestamp: new Date().toISOString(),
        randomId: Math.random().toString(36).substr(2, 9),
      },
    });
    alert("Manual error sent! Check your Sentry dashboard.");
  };

  const triggerPromiseRejection = () => {
    // Create an unhandled promise rejection
    Promise.reject(new Error("Unhandled promise rejection test"));
  };

  const triggerNetworkError = async () => {
    try {
      // Try to fetch from a non-existent endpoint
      await fetch("/api/non-existent-endpoint", { method: "POST" });
    } catch (error) {
      reportError(error as Error, {
        source: "network-test",
        component: "ErrorTester",
        action: "fetch-failed",
        url: "/api/non-existent-endpoint",
      });
    }
  };

  if (!showTester) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowTester(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors duration-200 text-sm font-medium"
        >
          🧪 Error Tester
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">🧪 Error Testing</h3>
          <button
            onClick={() => setShowTester(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* React Error Boundary Test */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              React Error Boundary
            </h4>
            <ErrorBoundary
              context={{
                test: "error-boundary",
                component: "ErrorTester",
              }}
              fallback={(error, reset) => (
                <div className="text-red-600 text-sm space-y-2">
                  <p>❌ Error caught: {error.message}</p>
                  <button
                    onClick={reset}
                    className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                  >
                    Reset
                  </button>
                </div>
              )}
            >
              <div className="space-y-2">
                <ErrorThrower shouldThrow={shouldThrowError} />
                <button
                  onClick={() => setShouldThrowError(!shouldThrowError)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors duration-200"
                >
                  💥 Throw React Error
                </button>
              </div>
            </ErrorBoundary>
          </div>

          {/* Async Error Test */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Async Error
            </h4>
            <AsyncErrorComponent />
          </div>

          {/* Manual Error Reporting */}
          <div className="space-y-2">
            <button
              onClick={triggerManualError}
              className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors duration-200"
            >
              📝 Manual Error Report
            </button>

            <button
              onClick={triggerJavaScriptError}
              className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition-colors duration-200"
            >
              ⚡ JavaScript Error
            </button>

            <button
              onClick={triggerTypeError}
              className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition-colors duration-200"
            >
              🔤 Type Error
            </button>

            <button
              onClick={triggerPromiseRejection}
              className="w-full px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded text-sm transition-colors duration-200"
            >
              🚫 Promise Rejection
            </button>

            <button
              onClick={triggerNetworkError}
              className="w-full px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm transition-colors duration-200"
            >
              🌐 Network Error
            </button>
          </div>

          <div className="text-xs text-gray-500 border-t pt-2">
            <p>💡 Open DevTools Network tab to see error reports</p>
            <p>📊 Check Sentry dashboard for captured errors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
