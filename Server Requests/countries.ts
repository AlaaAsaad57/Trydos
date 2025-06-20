"use server";

interface Country {
  [key: string]: any;
}

interface CountriesResponse {
  countries: Country[];
}

export async function fetchCountries(): Promise<CountriesResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/countries`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: { tags: ["countries", "home"] },
      }
    );

    if (!response.ok) {
      throw new Error(`Countries Error: ${response.status}`);
    }

    const data = await response.json();

    return {
      countries: data.data.countries,
    };
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
}
