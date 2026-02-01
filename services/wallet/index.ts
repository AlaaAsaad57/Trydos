"use server";
import { fetchServerData } from "serverRequests/ServerFetch";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";

import { LogError } from "utils/functions";
import { Currencies } from "utils/types/wallet";

export async function checkWallet({ id }) {
  let res = null;

  res = await fetchServerData({
    method: "GET",
    url:
      process.env.NEXT_PUBLIC_WALLET_BACKEND_URL +
      `/wallets/myAcounts?currencySymbol=SAR`,
    headers: {
      Authorization: `Bearer ${getCookie(COOKIE_NAMES.WALLET_TOKEN)}`,
    },
  });
  console.log(res);

  if (!res || res?.length === 0 || !res.success) createWallet({ id });
}
export async function createWallet({ id }) {
  // try {
  let response = await fetchServerData({
    method: "POST",
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
  console.log(response);
  return response;
  // } catch (error) {
  //   LogError({
  //     error,
  //     scenario: "creating wallet for user",
  //     user_id: id,
  //   });
  // }
}
export async function getCurrencies({ language }) {
  try {
    let response = await fetchServerData({
      method: "GET",
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + "/currencies",
    });
    let currencies: Currencies = response.data;
  } catch (error) {
    LogError({
      error,
      scenario: "get currencies",
    });
  }
}
