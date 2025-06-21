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
        next: {
          tags: ["countries", "home"],
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_COUNTRIES),
        },
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
    return {
      countries: [
        {
          id: 1,
          name: "Turkey",
          code: "TR",
          flag: "https://flagcdn.com/tr.svg",
          currency: "TRY",
        },
        {
          id: 2,
          name: "Syria",
          code: "SY",
          flag: "https://flagcdn.com/sy.svg",
          currency: "SYP",
        },
        {
          id: 3,
          name: "Lebanon",
          code: "LB",
          flag: "https://flagcdn.com/lb.svg",
          currency: "LBP",
        },
        {
          id: 4,
          name: "Iraq",
          code: "IQ",
          flag: "https://flagcdn.com/iq.svg",
          currency: "IQD",
        },
      ],
    };
  }
}
