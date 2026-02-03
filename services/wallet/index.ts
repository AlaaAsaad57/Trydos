// "use server";

import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { LogError } from "utils/functions";

import {
  BanksApi,
  CalculateFeesApi,
  CheckoutOrderApi,
  CreateBankDepositeApi,
  CurrenciesApi,
  FetchResponse,
  GetBankDepositeApi,
  GetJournalEntriesApi,
  GetTransactionsApi,
  GetWalletBalancesApi,
  UploadMediaApi,
} from "./types";

export async function fetchServerData<T>({
  url,
  method = "GET",
  body,
  headers = {},
  local = "en-gb",
}: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  local?: string;
}): Promise<FetchResponse<T> & { status: number }> {
  try {
    // 1. Prepare dynamic headers
    const finalHeaders: Record<string, string> = {
      "Accept-Language": local,
      ...headers,
    };

    // 2. Handle Content-Type Logic
    if (finalHeaders["ContentType"] === "MULTIPART") {
      // IMPORTANT: Remove it entirely so the browser/runtime
      // generates the correct multipart boundary automatically.
      delete finalHeaders["ContentType"];
      delete finalHeaders["Content-Type"];
    } else if (!finalHeaders["Content-Type"] && !(body instanceof FormData)) {
      // Default to JSON for standard objects
      finalHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body,
      // Prevents caching for sensitive wallet data
      cache: "no-store",
    });

    // 3. Handle Empty Responses (204 No Content)
    if (response.status === 204) {
      return {
        error: null,
        success: true,
        data: null as any,
        status: 204,
      };
    }

    const result = await response.json();

    // 4. Standardize the response format
    return {
      success: response.ok,
      data: result.data || result, // Adjust based on your backend structure
      error: !response.ok
        ? result.message || result.error || "Unknown Error"
        : null,
      status: response.status, // Crucial for your 401 check
    };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return {
      success: false,
      data: null as any,
      error: error.message || "Network Request Failed",
      status: 500,
    };
  }
}
// --- SMART HELPER: Centralized Response Handler ---
/**
 * Checks for 401 status and errors.
 * Returns the data if successful, or null/throws if there's an issue.
 */
function processResponse<T>(
  response: any,
  handleUnauthenticated: () => void,
  logContext?: { scenario: string; userId?: string },
): T {
  // 1. Priority Check: Authentication
  if (response?.status === 401) {
    if (handleUnauthenticated) {
      handleUnauthenticated();
    }
    // Return null or undefined to stop flow without crashing,
    // assuming the handleUnauthenticated (e.g. redirect) takes over.
    // @ts-ignore - casting to T to satisfy return type in failure case
    return null;
  }

  // 2. Error Handling & Logging
  if (response?.error) {
    if (logContext) {
      LogError({
        error: response.error,
        scenario: logContext.scenario,
        user_id: logContext.userId,
      });
    }
    throw new Error(response.error);
  }

  // 3. Success: Return Data
  return response?.data;
}

// --- EXPORTED ACTIONS ---

export async function checkWallet({
  id,
  local = "gb-en",
  handleUnauthenticated,
}: {
  id: string;
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let res = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/myAcounts?currencySymbol=SAR`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  // Specific logic for checkWallet: 401 check first
  if (res?.status === 401) {
    handleUnauthenticated();
    return;
  }

  if (!res || !res.data) {
    // Pass the handler down to the creation function if needed
    await createWallet({ id, local, handleUnauthenticated });
  }
}

export async function createWallet({
  id,
  local = "gb-en",
  handleUnauthenticated,
}: {
  id: string;
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let response = await fetchServerData({
    method: "POST",
    local: local,
    body: JSON.stringify({
      userId: id,
      subtype: "MAIN",
      name: "Primary Funding Wallet",
    }),
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/wallets?subtype=MAIN",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  // Use helper with specific logging context for creation
  processResponse(response, handleUnauthenticated, {
    scenario: "creating wallet for user",
    userId: id,
  });

  return response;
}

export async function getCurrencies({
  local = "gb-en",
  handleUnauthenticated,
}: {
  local?: string;
  handleUnauthenticated: () => void;
}) {
  try {
    let response = await fetchServerData({
      method: "GET",
      local: local,
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/currencies",
      headers: {
        Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
      },
    });

    return processResponse<CurrenciesApi>(response, handleUnauthenticated);
  } catch (error) {
    // processResponse throws errors, which are caught here for logging if needed
    // But since processResponse doesn't log for this case, we keep the outer catch
    LogError({ error, scenario: "get currencies" });
  }
}

export async function GetBanks({
  local = "gb-en",
  handleUnauthenticated,
}: {
  local?: string;
  handleUnauthenticated: () => void;
}) {
  try {
    let response: FetchResponse<BanksApi> = await fetchServerData({
      method: "GET",
      local: local,
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/banks",
      headers: {
        Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
      },
    });

    return processResponse<BanksApi>(response, handleUnauthenticated);
  } catch (error) {
    LogError({ error, scenario: "get banks" });
  }
}

export async function UploadMedia({
  file,
  local = "gb-en",
  handleUnauthenticated,
}: {
  file: File;
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type?.split("/")[0]);

  let response: FetchResponse<UploadMediaApi> = await fetchServerData({
    method: "POST",
    body: formData,
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/media/upload/direct",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
      // Using "MULTIPART" flag so your fetch wrapper knows to DELETE the content-type header
      ContentType: "MULTIPART",
    },
  });

  return processResponse<UploadMediaApi>(response, handleUnauthenticated);
}

export async function CreateBankDeposit({
  bankId,
  currencyId,
  amount,
  transferImageUrl,
  transactionReference,
  idempotencyKey,
  local = "gb-en",
  handleUnauthenticated,
}: {
  bankId: string;
  currencyId: string;
  amount: number;
  transferImageUrl: string;
  transactionReference: string;
  idempotencyKey: string;
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let response: FetchResponse<CreateBankDepositeApi> = await fetchServerData({
    method: "POST",
    local: local,
    body: JSON.stringify({
      bankId,
      currencyId,
      amount,
      transferImageUrl,
      transactionReference,
      idempotencyKey,
    }),
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/bank-deposits",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<CreateBankDepositeApi>(
    response,
    handleUnauthenticated,
  );
}

export async function CalculateFees({
  bankId,
  currencyId,
  amount,
  local = "gb-en",
  handleUnauthenticated,
}: {
  bankId: string;
  currencyId: string;
  amount: number;
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let response: FetchResponse<CalculateFeesApi> = await fetchServerData({
    method: "POST",
    local: local,
    body: JSON.stringify({
      bankId,
      currencyId,
      amount,
    }),
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      "/bank-deposits/calculate-fees",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<CalculateFeesApi>(response, handleUnauthenticated);
}

export async function GetBankDepostits({
  local = "gb-en",
  handleUnauthenticated,
}: {
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let response: FetchResponse<GetBankDepositeApi> = await fetchServerData({
    method: "GET",
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/bank-deposits",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<GetBankDepositeApi>(response, handleUnauthenticated);
}

export async function GetWalletBalance({
  currencySymbol,
  local = "gb-en",
  handleUnauthenticated,
}: {
  local?: string;
  currencySymbol: string;
  handleUnauthenticated: () => void;
}) {
  let params = new URLSearchParams();
  if (currencySymbol?.length > 0) {
    params.append("currencySymbol", currencySymbol);
  }
  params.append("assetType", "CURRENCY");
  params.append("accountSubtype", "MAIN");

  let response: FetchResponse<GetWalletBalancesApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/myAcounts?${params.toString()}`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<GetWalletBalancesApi>(response, handleUnauthenticated);
}

export async function GetJournalEntries({
  local = "gb-en",
  handleUnauthenticated,
}: {
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let response: FetchResponse<GetJournalEntriesApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/my/journal-entries`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<GetJournalEntriesApi>(response, handleUnauthenticated);
}

export async function GetTransactions({
  local = "gb-en",
  handleUnauthenticated,
}: {
  local?: string;
  handleUnauthenticated: () => void;
}) {
  let response: FetchResponse<GetTransactionsApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/wallets/my/transactions`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<GetTransactionsApi>(response, handleUnauthenticated);
}

export async function CheckoutOrder({
  storeKey = "trydos",
  cartId,
  amount,
  idempotencyKey,
  local = "gb-en",
  currencyId,
  handleUnauthenticated,
}: {
  cartId: string;
  amount: number;
  idempotencyKey: string;
  local?: string;
  currencyId: string;
  storeKey?: "trydos";
  handleUnauthenticated: () => void;
}) {
  let response: FetchResponse<CheckoutOrderApi> = await fetchServerData({
    method: "POST",
    local: local,
    body: JSON.stringify({
      currencyId: currencyId,
      carts: [
        {
          cartId: cartId,
          amount: amount,
        },
      ],
      idempotencyKey: idempotencyKey,
    }),
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/${storeKey}/checkout`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  return processResponse<CheckoutOrderApi>(response, handleUnauthenticated);
}
