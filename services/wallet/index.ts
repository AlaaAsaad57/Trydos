"use server";

import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";

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
import { getCurrency } from "serverRequests";
import { LogServerError } from "utils/serverErrorReporter";

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
  logContext?: { scenario: string; userId?: string } & Partial<
    Record<string, any>
  >,
): T {
  // 1. Priority Check: Authentication
  if (response?.status === 401) {
    if (handleUnauthenticated) {
      handleUnauthenticated();
    }
    // Return null or undefined to stop flow without crashing,
    // assuming the handleUnauthenticated (e.g. redirect) takes over.
    // @ts-ignore - casting to T to satisfy return type in failure case
    return {
      error: response.error || "Unauthorized",
      status: 401,
      success: false,
      data: null,
    };
  }

  // 2. Error Handling & Logging
  if (response?.error) {
    if (logContext) {
      LogServerError({
        error: response.error,
        response: response,
        scenario: logContext?.scenario,
        user_id: logContext?.userId,
        ...(logContext ?? {}),
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
  handleUnauthenticated = () => {},
}: {
  id: string;
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  let res = await fetchServerData({
    method: "GET",
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/wallets/myAcounts`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Specific logic for checkWallet: 401 check first
  if (res?.status === 401) {
    handleUnauthenticated?.();
    return;
  }

  if (!res || !res.success) {
    // Pass the handler down to the creation function if needed
    await createWallet({ id, local, handleUnauthenticated });
  }
}

export async function createWallet({
  id,
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  id: string;
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
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
      Authorization: `Bearer ${token}`,
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
  handleUnauthenticated = () => {},
}: {
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  try {
    let response = await fetchServerData({
      method: "GET",
      local: local,
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/currencies",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return processResponse<CurrenciesApi>(response, handleUnauthenticated, {
      scenario: "Get Currencies from wallet system",
      userId: "server",
    });
  } catch (error) {}
}

export async function GetBanks({
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  try {
    let response: FetchResponse<BanksApi> = await fetchServerData({
      method: "GET",
      local: local,
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/banks",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return processResponse<BanksApi>(response, handleUnauthenticated, {
      scenario: "Get Banks from wallet system",
      userId: "server",
    });
  } catch (error) {}
}

export async function UploadMedia({
  file,
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  file: File;
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  let formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type?.split("/")[0]);

  let response: FetchResponse<UploadMediaApi> = await fetchServerData({
    method: "POST",
    body: formData,
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/media/upload/direct",
    headers: {
      Authorization: `Bearer ${token}`,
      // Using "MULTIPART" flag so your fetch wrapper knows to DELETE the content-type header
      ContentType: "MULTIPART",
    },
  });
  console.log(response);
  return processResponse<UploadMediaApi>(response, handleUnauthenticated, {
    scenario: "UploadMedia from wallet system",
    userId: "server",
  });
}

export async function CreateBankDeposit({
  bankId,
  currencyId,
  amount,
  transferImageUrl,
  transactionReference,
  idempotencyKey,
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  bankId: string;
  currencyId: string;
  amount: number;
  transferImageUrl: string;
  transactionReference: string;
  idempotencyKey: string;
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
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
      Authorization: `Bearer ${token}`,
    },
  });

  return processResponse<CreateBankDepositeApi>(
    response,
    handleUnauthenticated,
    {
      scenario: "CreateBankDeposit from wallet system",
      userId: "server",
    },
  );
}

export async function CalculateFees({
  bankId,
  currencyId,
  amount,
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  bankId: string;
  currencyId: string;
  amount: number;
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
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
      Authorization: `Bearer ${token}`,
    },
  });

  return processResponse<CalculateFeesApi>(response, handleUnauthenticated, {
    scenario: "CalculateFeess from wallet system",
    userId: "server",
  });
}

export async function GetBankDepostits({
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  let response: FetchResponse<GetBankDepositeApi> = await fetchServerData({
    method: "GET",
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/bank-deposits",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return processResponse<GetBankDepositeApi>(response, handleUnauthenticated, {
    scenario: "GetBankDepostits from wallet system",
    userId: "server",
  });
}

export async function GetWalletBalanceInCurrency({
  currencyId,
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  local?: string;
  currencyId: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  let params = new URLSearchParams();

  params.append("assetType", "CURRENCY");
  params.append("accountSubtype", "MAIN");

  let response: FetchResponse<GetWalletBalancesApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/my/balances/${currencyId}?${params.toString()}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return processResponse<GetWalletBalancesApi>(
    response,
    handleUnauthenticated,
    {
      scenario: "GetWalletBalance from wallet system",
      userId: "server",
      params: params.toString(),
    },
  );
}

export async function GetJournalEntries({
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  let response: FetchResponse<GetJournalEntriesApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/my/journal-entries`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return processResponse<GetJournalEntriesApi>(
    response,
    handleUnauthenticated,
    {
      scenario: "GetJournalEntries in wallet system",
      userId: "server",
    },
  );
}

export async function GetTransactions({
  local = "gb-en",
  handleUnauthenticated = () => {},
}: {
  local?: string;
  handleUnauthenticated?: () => void;
}) {
  let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);
  let response: FetchResponse<GetTransactionsApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/wallets/my/transactions`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return processResponse<GetTransactionsApi>(response, handleUnauthenticated, {
    scenario: "get transactions",
    userId: "server",
  });
}

export async function CheckoutOrder({
  cartId,
  amount,
  idempotencyKey,
  local = "gb-en",
  currencyId,
  handleUnauthenticated = () => {},
}: {
  cartId: string;
  amount: number;
  idempotencyKey: string;
  local?: string;
  currencyId: string;
  storeKey?: "trydos";
  handleUnauthenticated?: () => void;
}) {
  try {
    let user = await getCookieServer<any>(COOKIE_NAMES.USER_DATA);
    let userId = user?.id as string;
    let token = await getCookieServer<string>(COOKIE_NAMES.WALLET_TOKEN);

    // Prepare checkout payload
    const checkoutPayload = {
      currencyId: currencyId,
      store_user_id: Number(userId),
      amount: amount,
      cart_group_ids: [cartId],
      idempotencyKey: idempotencyKey,
    };

    // Sign payload and add headers
    const crypto = require("crypto");
    const timestamp = Date.now().toString();
    const bodyObject = JSON.stringify(checkoutPayload);

    const message = `${timestamp}.${bodyObject}`;
    const digest = crypto
      .createHmac("sha256", process.env.WALLET_SECRET_KEY)
      .update(message, "utf8")
      .digest("hex");
    const signature = `sha256=${digest}`;
    let response: FetchResponse<CheckoutOrderApi> = await fetchServerData({
      method: "POST",
      local: local,
      body: JSON.stringify(checkoutPayload),
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/merchant/checkout`,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Merchant-Api-Key": process.env.WALLET_PUBLIC_API_KEY,
        "X-Signature": signature,
        "X-Timestamp": timestamp,
      },
    });
    console.log({
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/merchant/checkout`,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Merchant-Api-Key": process.env.WALLET_PUBLIC_API_KEY,
        "X-Signature": signature,
        "X-Timestamp": timestamp,
      },
      message: message,
      digest: digest,
      body: checkoutPayload,
      timestamp: timestamp,
      signature: signature,
      response: response,
    });
    if (!response.success) {
      return {
        url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/merchant/checkout`,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Merchant-Api-Key": process.env.WALLET_PUBLIC_API_KEY,
          "X-Signature": signature,
          "X-Timestamp": timestamp,
        },
        message: message,
        digest: digest,
        body: checkoutPayload,
        timestamp: timestamp,
        signature: signature,
        response: response,
      };
    }
    return processResponse<CheckoutOrderApi>(response, handleUnauthenticated, {
      scenario: "CheckoutOrder in wallet system",
      userId: String(userId),
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/merchant/checkout`,
      currencyId: currencyId,
      amount: amount,
      cart_groub_ids: [cartId],
      store_user_id: userId,
      idempotencyKey: idempotencyKey,
    });
  } catch (e) {
    console.log(e);
  }
}

export async function GetWalletBalanceForCountryCurrency({ country }) {
  let [currency, currencies] = await Promise.all([
    getCurrency(country, "en"),
    getCurrencies({ local: `${country}-en` }),
  ]);
  if (!currency) {
    throw new Error("Currency not found for country: " + country);
  }
  let selected_currency = currencies.items.find(
    (c) => c.symbol === currency.code,
  );
  let balances = await GetWalletBalanceInCurrency({
    currencyId: selected_currency.id,
    local: "gb-en",
    handleUnauthenticated: () => {},
  });

  return {
    totalAvailable: balances.available,
    symbol: currency.symbol,
    decimal_digits: currency.decimal_digits,
  };
}
