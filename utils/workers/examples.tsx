/**
 * Example: Optimized Component Using Web Worker
 *
 * This example demonstrates best practices for using the Web Worker
 * in a Next.js client component to maintain fast hydration.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useInitWorker } from "utils/workers/useInitWorker";

export function OptimizedWorkerExample() {
  // State for worker results
  const [currency, setCurrency] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [loginStatus, setLoginStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize worker with all callbacks
  const worker = useInitWorker({
    onCurrencyResult: useCallback((currency: any) => {
      console.log("Currency received from worker:", currency);
      setCurrency(currency);
    }, []),

    onCountriesResult: useCallback((countries: any[]) => {
      console.log("Countries received from worker:", countries.length);
      setCountries(countries);
    }, []),

    onLoginCheckResult: useCallback((result: any) => {
      console.log("Login check result:", result.success);
      setLoginStatus(result);
      setIsLoading(false);
    }, []),

    onError: useCallback((error: string, type: string) => {
      console.error(`Worker error [${type}]:`, error);
      setIsLoading(false);
    }, []),
  });

  // Effect 1: Trigger worker operations when ready
  useEffect(() => {
    if (!worker.isReady) return;

    console.log("Worker is ready, starting background tasks...");

    // Start all async operations in parallel
    worker.checkLogin();
    worker.getCurrency();
    worker.fetchCountries("tr", "en");
  }, [worker.isReady]);

  // Effect 2: Handle route-based logic (still on main thread)
  useEffect(() => {
    // Quick, synchronous operations stay on main thread
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;

    // Offload computation to worker
    if (referrer && worker.isReady) {
      worker.getReferralSource(referrer);
    }
  }, [worker.isReady]);

  /**
   * The component renders immediately on hydration.
   * Worker results update state asynchronously via callbacks.
   * This keeps the main thread free for user interactions.
   */
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Web Worker Example</h1>

      {/* UI renders immediately, even before worker results */}
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Worker Status</h2>
          <p>Ready: {worker.isReady ? "✅" : "⏳"}</p>
          <p>Loading: {isLoading ? "⏳" : "✅"}</p>
        </div>

        {/* Currency data */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Currency</h2>
          {currency ? (
            <pre>{JSON.stringify(currency, null, 2)}</pre>
          ) : (
            <p className="text-gray-500">Loading from worker...</p>
          )}
        </div>

        {/* Countries data */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Countries</h2>
          {countries.length > 0 ? (
            <ul className="list-disc pl-4">
              {countries.map((country) => (
                <li key={country.iso}>
                  {country.name} ({country.iso})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Loading from worker...</p>
          )}
        </div>

        {/* Login status */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Login Status</h2>
          {loginStatus ? (
            <p>
              Status:{" "}
              {loginStatus.success ? "✅ Logged in" : "❌ Not logged in"}
            </p>
          ) : (
            <p className="text-gray-500">Checking from worker...</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Manual Worker Control
 *
 * For cases where you need fine-grained control over worker operations.
 */
export function ManualWorkerControl() {
  const [result, setResult] = useState<string>("No operations yet");

  const worker = useInitWorker({
    onCurrencyResult: (currency) => {
      setResult(`Currency fetched: ${JSON.stringify(currency)}`);
    },
    onCountriesResult: (countries) => {
      setResult(`Fetched ${countries.length} countries`);
    },
  });

  // Manual triggers
  const handleFetchCurrency = () => {
    if (worker.isReady) {
      setResult("Fetching currency...");
      worker.getCurrency();
    } else {
      setResult("Worker not ready yet");
    }
  };

  const handleFetchCountries = () => {
    if (worker.isReady) {
      setResult("Fetching countries...");
      worker.fetchCountries("tr", "en");
    } else {
      setResult("Worker not ready yet");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Manual Worker Control</h1>

      <div className="space-x-2">
        <button
          onClick={handleFetchCurrency}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!worker.isReady}
        >
          Fetch Currency
        </button>

        <button
          onClick={handleFetchCountries}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!worker.isReady}
        >
          Fetch Countries
        </button>
      </div>

      <div className="border p-4 rounded">
        <h2 className="font-semibold">Result:</h2>
        <p>{result}</p>
      </div>

      <div className="text-sm text-gray-600">
        <p>Worker ready: {worker.isReady ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}

/**
 * Example: Conditional Worker Usage
 *
 * Shows how to use worker only when certain conditions are met.
 */
export function ConditionalWorkerUsage({
  shouldFetch,
}: {
  shouldFetch: boolean;
}) {
  const [data, setData] = useState<any>(null);

  const worker = useInitWorker({
    onCurrencyResult: (currency) => setData(currency),
  });

  useEffect(() => {
    // Only fetch if condition is met AND worker is ready
    if (shouldFetch && worker.isReady) {
      worker.getCurrency();
    }
  }, [shouldFetch, worker.isReady]);

  if (!shouldFetch) {
    return <p>Fetch disabled</p>;
  }

  return (
    <div>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}

/**
 * Example: SessionStorage Integration
 *
 * Shows the recommended pattern for working with sessionStorage.
 */
export function SessionStorageCaching() {
  const [countries, setCountries] = useState<any[]>([]);
  const [source, setSource] = useState<"cache" | "worker" | null>(null);

  const worker = useInitWorker({
    onCountriesResult: (countries) => {
      setCountries(countries);
      setSource("worker");
    },
  });

  useEffect(() => {
    if (!worker.isReady) return;

    const country = "tr";
    const language = "en";
    const cacheKey = `countries-${country}-${language}`;

    // 1. Check sessionStorage first (synchronous, fast)
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsedCountries = JSON.parse(cached);
        setCountries(parsedCountries);
        setSource("cache");
        console.log("✅ Loaded from sessionStorage cache");
      } catch (error) {
        console.error("Failed to parse cache:", error);
        // Fallback to worker
        worker.fetchCountries(country, language);
      }
    } else {
      // 2. Not cached, fetch via worker
      console.log("⏳ Fetching from worker...");
      worker.fetchCountries(country, language);
    }
  }, [worker.isReady]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Countries</h2>
      <p className="text-sm text-gray-600 mb-4">
        Source: {source || "Loading..."}
        {source === "cache" && " (instant!)"}
      </p>
      <ul className="list-disc pl-4">
        {countries.map((c) => (
          <li key={c.iso}>{c.name}</li>
        ))}
      </ul>
    </div>
  );
}
