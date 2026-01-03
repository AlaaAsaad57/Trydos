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
}

interface FetchResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  isError?: boolean;
}

const createServerFetch = async <T = any,>({
  url,
  revalidate,
  tags = [],
  retryAttempts = 3,
  retryDelay = 1000,
  method = "GET",
  local = "gb-en",
  headers = {},
  body,
}: FetchOptions): Promise<FetchResponse<T>> => {
  const retryableStatusCodes = [502, 503, 504, 429];

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

      const response = await fetch(url, {
        ...fetchOptions,
        next: {
          tags: tags,
          revalidate: revalidate,
        },
      });

      // If response is ok and not a retryable status code, return success
      if (response.ok && !retryableStatusCodes.includes(response.status)) {
        const data = await response.json();
        return {
          data,
          error: null,
          status: response.status,
        };
      }

      // If it's a retryable status code and we have attempts left, retry
      if (
        retryableStatusCodes.includes(response.status) &&
        attempt < retryAttempts
      ) {
        console.warn(
          `Attempt ${attempt} failed with status ${response.status}, retrying...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt)
        );
        return handleRetry(attempt + 1);
      }

      // If we've exhausted retries or it's not a retryable error, return error
      const errorText = await response.text();
      return {
        data: null,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
        isError: true,
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
          `Attempt ${attempt} failed due to network error, retrying...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt)
        );
        return handleRetry(attempt + 1);
      }

      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: 0,
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
  retryDelay = 1000,
  method = "GET",
  local = "gb-en",
  headers = {},
  body,
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
  });
};

export { fetchServerData };
