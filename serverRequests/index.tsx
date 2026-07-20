import { fetchServerData } from "./ServerFetch";

export * from "./products";
export * from "./currency";
export * from "./stories";

export async function GetStarttingSetting({ language, country }) {
  let response = await fetchServerData({
    url: process.env.GO_BACKEND_URL + "/web/home/startingSettings",
    headers: {
      lang: language,
      country: country,
    },
    local: `${country}-${language}`,
    method: "GET",
  });

  return response?.data?.data?.["starting_setting"];
}
