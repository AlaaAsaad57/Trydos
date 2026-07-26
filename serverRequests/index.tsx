import { fetchServerData } from "./ServerFetch";
// This barrel is NOT a "use server" module and is imported by client
// components — it must never reference tokenManager (next/headers) directly.
// resolveMarketFetchBase comes from the "use server" products module, so the
// client graph only ever sees an action proxy.
import { resolveMarketFetchBase } from "./products";
import { resolveStartingSetting } from "utils/startingSettings";

export * from "./products";
export * from "./currency";
export * from "./stories";

export async function GetStarttingSetting({ language, country }) {
  let response = await fetchServerData({
    // Verified users → Laravel, guests → Go (user-based routing)
    url: (await resolveMarketFetchBase()) + "/web/home/startingSettings",
    headers: {
      lang: language,
      country: country,
    },
    local: `${country}-${language}`,
    method: "GET",
  });

  // Both backends' envelope shapes are accepted; returns the inner settings
  // object exactly as before (callers such as getOrderStatues read other fields
  // off this result).
  return resolveStartingSetting(response?.data?.data);
}
