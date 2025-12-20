/* eslint-disable no-restricted-globals */
// Web Worker for handling heavy computations and API calls
// This runs off the main thread to keep UI responsive during hydration

import type { WorkerRequest, WorkerResponse } from "./types";

// Cache for storing fetch results
const cache = new Map<string, any>();

// Helper function to fetch with caching
async function cachedFetch(
  cacheKey: string,
  fetcher: () => Promise<any>
): Promise<any> {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await fetcher();
  cache.set(cacheKey, result);
  return result;
}

// Pure function: Get referral source from referer string
function getReferralSource(referer: string | null): string {
  if (!referer) return "direct";

  const url = referer.toLowerCase();

  if (url.includes("facebook")) return "facebook";
  if (url.includes("instagram")) return "instagram";
  if (url.includes("twitter") || url.includes("x")) return "twitter/X";
  if (url.includes("t.co")) return "twitter-shortlink";
  if (url.includes("whatsapp")) return "whatsapp";
  if (url.includes("linkedin")) return "linkedin";
  if (url.includes("tiktok")) return "tiktok";
  if (url.includes("snapchat")) return "snapchat";

  return "other";
}

// Fetch countries data (hardcoded or from API)
async function fetchCountries(
  country: string = "tr",
  language: string = "en"
): Promise<{ countries: any[] }> {
  const cacheKey = `countries-${country}-${language}`;

  return cachedFetch(cacheKey, async () => {
    // For now, returning hardcoded data as in the original implementation
    // You can replace this with actual API call if needed
    return {
      countries: [
        {
          id: 103,
          phonecode: 964,
          iso: "IQ",
          name: "Iraq",
          longitude: "43.6848",
          latitude: "33.2209",
        },
        {
          id: 119,
          phonecode: 961,
          iso: "LB",
          name: "Lebanon",
          longitude: "35.4954",
          latitude: "33.8886",
        },
        {
          id: 208,
          phonecode: 963,
          iso: "SY",
          name: "Syria",
          longitude: "38.9968",
          latitude: "34.8021",
        },
        {
          id: 223,
          phonecode: 90,
          iso: "TR",
          name: "Turkey",
          longitude: "35.2433",
          latitude: "38.9637",
        },
      ],
    };
  });
}

// Fetch currency data from API
async function getCurrency(): Promise<any> {
  const cacheKey = "currency";

  return cachedFetch(cacheKey, async () => {
    try {
      const baseUrl = self.location.origin;
      const response = await fetch(`${baseUrl}/api/market/home/currency`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Currency fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.currency || null;
    } catch (error) {
      console.error("Worker: Currency fetch error:", error);
      return null;
    }
  });
}

// Check login status
async function checkLogin(): Promise<any> {
  try {
    const baseUrl = self.location.origin;
    const response = await fetch(`${baseUrl}/api/check-login`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Login check failed: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Worker: Login check error:", error);
    return { success: false, error: String(error) };
  }
}

// Get client data
async function getClientData(): Promise<any> {
  try {
    const baseUrl = self.location.origin;
    const response = await fetch(`${baseUrl}/api/market/home/client-data`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Client data fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Worker: Client data fetch error:", error);
    return null;
  }
}

// Message handler
self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case "FETCH_COUNTRIES": {
        const { country, language } = payload;
        const result = await fetchCountries(country, language);

        const response: WorkerResponse = {
          type: "COUNTRIES_RESULT",
          payload: result,
        };
        self.postMessage(response);
        break;
      }

      case "GET_CURRENCY": {
        const currency = await getCurrency();

        const response: WorkerResponse = {
          type: "CURRENCY_RESULT",
          payload: { currency },
        };
        self.postMessage(response);
        break;
      }

      case "CHECK_LOGIN": {
        const result = await checkLogin();

        const response: WorkerResponse = {
          type: "LOGIN_CHECK_RESULT",
          payload: result,
        };
        self.postMessage(response);
        break;
      }

      case "GET_REFERRAL_SOURCE": {
        const { referer } = payload;
        const source = getReferralSource(referer);

        const response: WorkerResponse = {
          type: "REFERRAL_SOURCE_RESULT",
          payload: { source },
        };
        self.postMessage(response);
        break;
      }

      case "GET_CLIENT_DATA": {
        const data = await getClientData();

        const response: WorkerResponse = {
          type: "CLIENT_DATA_RESULT",
          payload: data,
        };
        self.postMessage(response);
        break;
      }

      case "CLEANUP": {
        // Clear cache on cleanup
        cache.clear();
        break;
      }

      default: {
        const response: WorkerResponse = {
          type: "ERROR",
          payload: {
            message: `Unknown message type: ${type}`,
            type: "UNKNOWN_TYPE",
          },
        };
        self.postMessage(response);
      }
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: "ERROR",
      payload: {
        message: error instanceof Error ? error.message : String(error),
        type: type,
      },
    };
    self.postMessage(response);
  }
});

// Let the main thread know the worker is ready
self.postMessage({ type: "WORKER_READY" });

export {};
