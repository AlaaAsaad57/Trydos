"use server";

interface CurrencyResponse {
  [key: string]: any;
}

export async function fetchCurrency(
  language: string,
  country: string
): Promise<CurrencyResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/home/currency?lang=${language}&country=${country}`,
      {
        method: "GET",
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: { tags: ["currency-api", "home", "listing", "product-details"] },
      }
    );

    if (!response.ok) {
      throw new Error(`Currency Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching currency:", error);
    throw error;
  }
}
