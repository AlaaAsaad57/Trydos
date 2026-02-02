"use server";
import { FetchResponse, fetchServerData } from "serverRequests/ServerFetch";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { LogError } from "utils/functions";

import {
  BanksApi,
  CalculateFeesApi,
  CreateBankDepositeApi,
  CurrenciesApi,
  GetBankDepositeApi,
  GetJournalEntriesApi,
  GetTransactionsApi,
  GetWalletBalancesApi,
  UploadMediaApi,
} from "./types";

export async function checkWallet({ id, local = "gb-en" }) {
  let res = null;

  res = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/myAcounts?currencySymbol=SAR`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });

  if (!res || res?.length === 0 || !res.success) createWallet({ id });
}
export async function createWallet({ id, local = "gb-en" }) {
  // try {
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
  if (response?.error) {
    LogError({
      error: response?.error,
      scenario: "creating wallet for user",
      user_id: id,
    });
    throw new Error(response?.error);
  }
  return response;
}
export async function getCurrencies({ local = "gb-en" }) {
  try {
    let response = await fetchServerData({
      method: "GET",
      local: local,
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/currencies",
    });
    if (response?.error) {
      throw new Error(response?.error);
    }
    let currencies: CurrenciesApi = response.data;
    return currencies;
  } catch (error) {
    LogError({
      error,
      scenario: "get currencies",
    });
  }
}
export async function GetBanks({ local = "gb-en" }) {
  try {
    let response: FetchResponse<BanksApi> = await fetchServerData({
      method: "GET",
      local: local,
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/banks",
      headers: {
        Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
      },
    });
    if (response?.error) {
      throw new Error(response?.error);
    }
    return response?.data;
  } catch (error) {
    LogError({
      error,
      scenario: "get banks",
    });
  }
}
export async function UploadMedia({
  file,
  local = "gb-en",
}: {
  file: File;
  local?: string;
}) {
  let formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type);
  let response: FetchResponse<UploadMediaApi> = await fetchServerData({
    method: "POST",
    body: formData,
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/media/upload/direct",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}

export async function CreateBankDeposit({
  bankId,
  currencyId,
  amount,
  transferImageUrl,
  transactionReference,
  idempotencyKey,
  local = "gb-en",
}: {
  bankId: string;
  currencyId: string;
  amount: number;
  transferImageUrl: string;
  transactionReference: string;
  idempotencyKey: string;
  local?: string;
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
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}

export async function CalculateFees({
  bankId,
  currencyId,
  amount,
  local = "gb-en",
}: {
  bankId: string;
  currencyId: string;
  amount: number;
  local?: string;
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
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}

export async function GetBankDepostits({
  local = "gb-en",
}: {
  local?: string;
}) {
  let response: FetchResponse<GetBankDepositeApi> = await fetchServerData({
    method: "GET",
    local: local,
    url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/bank-deposits",
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}

export async function GetWalletBalance({
  currencySymbol,
  local = "gb-en",
}: {
  local?: string;
  currencySymbol: string;
}) {
  let response: FetchResponse<GetWalletBalancesApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/myAcounts?currencySymbol=${currencySymbol}&assetType=CURRENCY&accountSubtype=MAIN`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}

export async function GetJournalEntries({
  local = "gb-en",
}: {
  local?: string;
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
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}

export async function GetTransactions({ local = "gb-en" }: { local?: string }) {
  let response: FetchResponse<GetTransactionsApi> = await fetchServerData({
    method: "GET",
    local: local,
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + `/wallets/my/transactions`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });
  if (response?.error) {
    throw new Error(response?.error);
  }
  return response?.data;
}
