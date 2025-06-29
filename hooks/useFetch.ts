import { useState, useEffect, useCallback, useRef } from "react";

// Types
export type ServerType = "chat" | "market" | "stories";

export type FetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface UseFetchParams {
  url: string;
  method: FetchMethod;
  body?: object | null;
  useCached?: boolean;
  reqTitle?: string;
  server: ServerType;
}

export interface UseFetchReturn<T = any> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

// Cache structure
const requestCache = new Map<string, any>();

// Token fetching functions based on server type
const getChatToken = async (): Promise<string> => {
  const userChat = localStorage.getItem("USER-CHAT");
  if (userChat) {
    const parsedUser = JSON.parse(userChat);
    if (parsedUser?.access_token) {
      return parsedUser.access_token;
    }
  }
  throw new Error("Chat token not found");
};

const getMarketToken = async (): Promise<string> => {
  const marketToken =
    localStorage.getItem("MARKET-TOKEN") ||
    localStorage.getItem("DEVICE-TOKEN");
  if (marketToken) {
    return marketToken;
  }
  throw new Error("Market token not found");
};

const getStoriesToken = async (): Promise<string> => {
  const userStories = localStorage.getItem("USER-STORIES");
  if (userStories) {
    const parsedUser = JSON.parse(userStories);
    if (parsedUser?.access_token) {
      return parsedUser.access_token;
    }
  }
  throw new Error("Stories token not found");
};

// Handle unauthorized - refresh tokens based on server type
const handleUnauthorized = async (server: ServerType): Promise<boolean> => {
  console.log(`Handling 401 Unauthorized for ${server} server...`);

  try {
    switch (server) {
      case "market":
        // For market server, call ExpiredUser to get new token
        const authService = await import("../services/auth");
        await authService.default.ExpiredUser();
        // After ExpiredUser, a new token should be available
        // Return true to indicate retry should happen
        return true;

      case "chat":
      case "stories":
        // For chat/stories servers, show the phone verification widget
        const { useAppStore } = await import("../store");
        const { setShouldAuthinticated } = useAppStore.getState();

        // Show the verification widget
        setShouldAuthinticated(true);

        // Wait for user to complete verification or close the widget
        // We'll use a promise that resolves when verification is complete
        return new Promise((resolve) => {
          // Poll to check if the widget is still open
          const checkInterval = setInterval(() => {
            const currentState = useAppStore.getState();
            // Check if widget was closed (shouldAuthinticated is false)
            if (!currentState.shouldAuthinticated) {
              clearInterval(checkInterval);
              // If user closed the widget, the page will reload automatically
              // as configured in ConfirmMobilePhoneWidget
              resolve(false);
            }

            // Check if verification was successful by looking for updated tokens
            const hasNewToken =
              server === "chat"
                ? localStorage.getItem("USER-CHAT") &&
                  JSON.parse(localStorage.getItem("USER-CHAT") || "{}")
                    ?.access_token
                : localStorage.getItem("USER-STORIES") &&
                  JSON.parse(localStorage.getItem("USER-STORIES") || "{}")
                    ?.access_token;

            if (hasNewToken) {
              clearInterval(checkInterval);
              // Verification successful, allow retry
              resolve(true);
            }
          }, 500); // Check every 500ms

          // Set a timeout to prevent infinite waiting
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 300000); // 5 minutes timeout
        });

      default:
        throw new Error(`Unknown server type: ${server}`);
    }
  } catch (error) {
    console.error(`Failed to handle unauthorized for ${server}:`, error);
    return false;
  }
};

// Generate cache key from request configuration
const generateCacheKey = (params: UseFetchParams): string => {
  const { url, method, body, server } = params;
  return JSON.stringify({ url, method, body, server });
};

// Main hook
export const useFetch = <T = any>({
  url,
  method,
  body = null,
  useCached = false,
  reqTitle,
  server,
}: UseFetchParams): UseFetchReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Use refs to track component mount status and abort controller
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track if we're currently fetching to prevent duplicate requests
  const fetchingRef = useRef<boolean>(false);

  // Get token based on server type
  const getToken = useCallback(async (): Promise<string> => {
    switch (server) {
      case "chat":
        return getChatToken();
      case "market":
        return getMarketToken();
      case "stories":
        return getStoriesToken();
      default:
        throw new Error(`Unknown server type: ${server}`);
    }
  }, [server]);

  // Main fetch function with retry logic
  const fetchData = useCallback(
    async (isRetryAfterUnauthorized = false) => {
      // Prevent duplicate fetches
      if (fetchingRef.current && !isRetryAfterUnauthorized) {
        return;
      }

      fetchingRef.current = true;

      // Check cache first
      const cacheKey = generateCacheKey({ url, method, body, server });
      if (
        useCached &&
        !isRetryAfterUnauthorized &&
        requestCache.has(cacheKey)
      ) {
        const cachedData = requestCache.get(cacheKey);
        setData(cachedData);
        setError(null);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      // Create new abort controller
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      let retryCount = 0;
      const maxRetries = 3;

      const attemptFetch = async (): Promise<void> => {
        try {
          // Get token
          const token = await getToken();

          // Prepare request options
          const requestOptions: RequestInit = {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: abortControllerRef.current!.signal,
          };

          // Add body for non-GET requests
          if (body && method !== "GET") {
            requestOptions.body = JSON.stringify(body);
          }

          // Log request if title provided
          if (reqTitle) {
            console.log(`[${reqTitle}] Fetching ${method} ${url}`);
          }

          // Make the request
          const response = await fetch(url, requestOptions);

          // Handle 401 Unauthorized
          if (response.status === 401 && !isRetryAfterUnauthorized) {
            const shouldRetry = await handleUnauthorized(server);
            // Only retry if handleUnauthorized indicates success
            if (shouldRetry && isMountedRef.current) {
              return fetchData(true);
            }
            // If shouldRetry is false, the error will be set below
            if (!shouldRetry) {
              throw new Error("Authentication required");
            }
            return;
          }

          // Check if response is ok
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Parse response
          const responseData = await response.json();

          // Update state if component is still mounted
          if (isMountedRef.current) {
            setData(responseData);
            setError(null);
            setLoading(false);

            // Cache the result
            requestCache.set(cacheKey, responseData);
          }
        } catch (err) {
          // Handle abort errors
          if (err instanceof Error && err.name === "AbortError") {
            console.log("Fetch aborted");
            return;
          }

          // Network error - retry logic
          if (err instanceof TypeError && err.message.includes("fetch")) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(
                `Network error, retrying... (${retryCount}/${maxRetries})`
              );
              // Wait a bit before retrying
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              );
              return attemptFetch();
            }
          }

          // Set error if component is still mounted
          if (isMountedRef.current) {
            setError(
              err instanceof Error ? err : new Error("Unknown error occurred")
            );
            setData(null);
            setLoading(false);
          }
        } finally {
          fetchingRef.current = false;
        }
      };

      await attemptFetch();
    },
    [url, method, body, server, useCached, reqTitle, getToken]
  );

  // Refetch function - clears cache and fetches again
  const refetch = useCallback(() => {
    // Clear cache for this request
    const cacheKey = generateCacheKey({ url, method, body, server });
    requestCache.delete(cacheKey);

    // Fetch data
    fetchData();
  }, [url, method, body, server, fetchData]);

  // Effect to trigger initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, use refetch for subsequent fetches

  return {
    data,
    error,
    loading,
    refetch,
  };
};

// Optional: Export cache utilities for testing or manual cache management
export const clearFetchCache = () => {
  requestCache.clear();
};

export const removeCacheEntry = (params: UseFetchParams) => {
  const cacheKey = generateCacheKey(params);
  requestCache.delete(cacheKey);
};
