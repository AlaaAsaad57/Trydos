"use server";
import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";

interface Country {
  [key: string]: any;
}

interface CountriesResponse {
  countries: Country[];
}

export async function fetchCountries(
  country = "tr",
  language = "en"
): Promise<CountriesResponse> {
  try {
    // const response = await fetchServerData({
    //   url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/countries?lang=${language}&country=${country}`,
    //   method: "GET",
    //   tags: ["countries", "home"],
    //   revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_COUNTRIES),
    //   local: `${country}-${language}`,
    // });

    // if (response.isError) {
    //   console.error(`Countries Error: ${response.status}`);
    //   reportError(
    //     new Error(`Countries Error: ${response.status}-${response.error}`),
    //     {
    //       source: "countries",
    //       page: "countries",
    //       country: country,
    //       language: language,
    //       response: JSON.stringify(response),
    //     }
    //   );
    //   return {
    //     countries: [
    //       {
    //         id: 103,
    //         phonecode: 964,
    //         iso: "IQ",
    //         name: "Iraq",
    //         longitude: "43.6848",
    //         latitude: "33.2209",
    //       },
    //       {
    //         id: 119,
    //         phonecode: 961,
    //         iso: "LB",
    //         name: "lebanon",
    //         longitude: "35.4954",
    //         latitude: "33.8886",
    //       },
    //       {
    //         id: 208,
    //         phonecode: 963,
    //         iso: "SY",
    //         name: "syria",
    //         longitude: "36.2783",
    //         latitude: "33.5104",
    //       },
    //       {
    //         id: 219,
    //         phonecode: 90,
    //         iso: "TR",
    //         name: "Turkey",
    //         longitude: "35.6667",
    //         latitude: "39.1667",
    //       },
    //     ],
    //   };
    // }

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
          name: "lebanon",
          longitude: "35.4954",
          latitude: "33.8886",
        },
        {
          id: 208,
          phonecode: 963,
          iso: "SY",
          name: "syria",
          longitude: "36.2783",
          latitude: "33.5104",
        },
        {
          id: 219,
          phonecode: 90,
          iso: "TR",
          name: "Turkey",
          longitude: "35.6667",
          latitude: "39.1667",
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching countries:", error);
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
          name: "lebanon",
          longitude: "35.4954",
          latitude: "33.8886",
        },
        {
          id: 208,
          phonecode: 963,
          iso: "SY",
          name: "syria",
          longitude: "36.2783",
          latitude: "33.5104",
        },
        {
          id: 219,
          phonecode: 90,
          iso: "TR",
          name: "Turkey",
          longitude: "35.6667",
          latitude: "39.1667",
        },
      ],
    };
  }
}
export async function fetchLanguages(
  country = "tr",
  language = "en"
): Promise<string[]> {
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/languages?lang=${language}&country=${country}`,
      method: "GET",
      tags: ["languages", "home"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LANGUAGES),
      local: `${country}-${language}`,
    });
    if (response.isError) {
      console.error(`Languages Error: ${response.status}`);
      reportError(new Error(`Languages Error: ${response.status}`), {
        source: "languages",
        page: "languages",
        country: country,
        language: language,
        response: JSON.stringify(response),
      });
      return [];
    }
    return response.data.languages;
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
}
