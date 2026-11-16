// One call to the photo search route. Used for the first photo search
// (`SearchImage`) and again each time the shopper changes a filter while photo
// results show (`SearchIcon`). The route keeps the photo's vector for a few
// minutes, so sending the same photo again does not cost another Gemini call.
import type { PhotoSearchFilters } from "services/elastic/similarProducts";

export type SimilarProductsAnswer = {
  ok: boolean;
  status: number;
  products: any[];
  /** English key for the shopper, when the route refused. */
  error?: string;
};

/** Same order every time, so two equal filter sets give the same text. */
export const photoFiltersKey = (filters: PhotoSearchFilters = {}) =>
  JSON.stringify(
    Object.keys(filters)
      .sort()
      .map((name) => [name, filters[name as keyof PhotoSearchFilters]]),
  );

export async function requestSimilarProducts({
  picture,
  language,
  country,
  filters = {},
}: {
  picture: Blob;
  language: string;
  country: string;
  filters?: PhotoSearchFilters;
}): Promise<SimilarProductsAnswer> {
  const formData = new FormData();
  formData.append("file", picture);
  formData.append("language", language);
  formData.append("country", country);
  formData.append("filters", JSON.stringify(filters));
  // The route refuses a call with no session cookie, so the cookie goes.
  const result = await fetch("/api/image-search/similar", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const body = await result.json().catch(() => ({}));
  return {
    ok: result.ok,
    status: result.status,
    products: Array.isArray(body?.products) ? body.products : [],
    error: typeof body?.error === "string" ? body.error : undefined,
  };
}
