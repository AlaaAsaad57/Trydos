import { LogServerError } from "utils/serverErrorReporter";

interface FetchOptions {
  url: string;
  revalidate?: number;
  tags?: string[];
  retryAttempts?: number;
  retryDelay?: number;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  local?: string;
  headers?: Record<string, string>;
  body?: any;
  /** Per-request timeout in ms (defaults to DEFAULT_REQUEST_TIMEOUT_MS). */
  requestTimeout?: number;
}

export interface FetchResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  isError?: boolean;
  url?: string;
}

// Hard ceiling on any single backend request so a hung upstream can never
// stall a server render indefinitely. Tunable per-call via `requestTimeout`.
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
// Cap for the retry backoff. The old linear `retryDelay * attempt` could add
// up to 6s (1s+2s+3s) to a blocking render; a capped exponential keeps the
// worst case to ~0.7s while still backing off.
const MAX_BACKOFF_MS = 1000;

const createServerFetch = async <T = any,>({
  url,
  revalidate,
  tags = [],
  retryAttempts = 3,
  retryDelay = 100,
  method = "GET",
  local = "gb-en",
  headers = {},
  body,
  requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS,
}: FetchOptions): Promise<FetchResponse<T>> => {
  const retryableStatusCodes = [502, 503, 504, 429];

  const backoffFor = (attempt: number) =>
    Math.min(retryDelay * 2 ** (attempt - 1), MAX_BACKOFF_MS);

  const [country, lang] = local.split("-");
  const handleRetry = async (attempt: number): Promise<FetchResponse<T>> => {
    try {
      const fetchOptions: RequestInit = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          country: country,
          lang: lang,
          ...headers,
        },
        body: body,
      };
      if (headers.ContentType === "MULTIPART") {
        delete fetchOptions.headers["Content-Type"];
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(requestTimeout),
        next: {
          // Respect the caller's revalidate preference (and any cache tags)
          // instead of forcing `0`, which previously disabled Next's
          // request-level fetch memoization on every call.
          revalidate: revalidate ?? 0,
          ...(tags.length ? { tags } : {}),
        },
      });

      // If response is ok and not a retryable status code, return success
      if (response.ok && !retryableStatusCodes.includes(response.status)) {
        const data = await response.json();
        return {
          data,
          error: null,
          status: response.status,
          url: url,
        };
      }

      // If it's a retryable status code and we have attempts left, retry
      if (
        retryableStatusCodes.includes(response.status) &&
        attempt < retryAttempts
      ) {
        console.warn(
          `Attempt ${attempt} failed with status ${response.status}, retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffFor(attempt)));
        return handleRetry(attempt + 1);
      }

      // If we've exhausted retries or it's not a retryable error, return error
      const errorText = await response.text();
      return {
        data: null,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
        isError: true,
        url: url,
      };
    } catch (error) {
      // Network errors or other exceptions
      const isNetworkError =
        error instanceof TypeError ||
        error instanceof DOMException ||
        (error as any)?.name === "NetworkError" ||
        (error as any)?.message?.includes("fetch");

      if (isNetworkError && attempt < retryAttempts) {
        console.warn(
          `Attempt ${attempt} failed due to network error, retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffFor(attempt)));
        return handleRetry(attempt + 1);
      }
      LogServerError({
        local,
        error: error,
        url,
        scenario: "Error In fetchServerData in serverRequest/ServerFetch",
      });
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: 0,
        url: url,
        isError: true,
      };
    }
  };

  return handleRetry(1);
};

// Example usage function
const fetchServerData = async <T = any,>({
  url,
  revalidate,
  tags = [],
  retryAttempts = 3,
  retryDelay = 100,
  method = "GET",
  local = "gb-en",
  headers = {},
  body,
  requestTimeout,
}: FetchOptions) => {
  return createServerFetch<T>({
    url,
    revalidate,
    tags,
    retryAttempts,
    retryDelay,
    method,
    local,
    headers,
    body,
    requestTimeout,
  });
};

export { fetchServerData };
