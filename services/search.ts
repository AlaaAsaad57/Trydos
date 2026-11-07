import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";

class SearchService {
  /** The shopper's words, or null when they could not be read. */
  async getSearchHistory(): Promise<string[] | null> {
    const response: any = await fetchData({
      url: "/api/search/history",
      reqTitle: REQUESTS_DATA.GET_SEARCH_HISTORY,
      method: "GET",
      server: "local",
      noMessage: true,
    });
    return response.success ? (response.data?.terms ?? []) : null;
  }

  /** Add a word the shopper settled on to the search log. */
  async logSearch(term: string, productsCount: number): Promise<void> {
    await fetchData({
      url: "/api/search/history",
      reqTitle: REQUESTS_DATA.LOG_SEARCH,
      method: "POST",
      server: "local",
      body: JSON.stringify({ term, products_count: productsCount }),
      noMessage: true,
    });
  }

  /** Remove one word, or every word. False when the server did not do it. */
  async removeSearchHistory(
    removal: { term: string } | { all: true },
  ): Promise<boolean> {
    const response: any = await fetchData({
      url: "/api/search/history",
      reqTitle: REQUESTS_DATA.REMOVE_SEARCH_HISTORY,
      method: "DELETE",
      server: "local",
      body: JSON.stringify(removal),
      noMessage: true,
    });
    return Boolean(response.success);
  }

  async getTrendingSearch() {
    try {
      let response = await fetchData({
        url: "/api/products/popular-search",
        reqTitle: REQUESTS_DATA.GET_TRENDING_SEARCH,
        method: "GET",
        server: "local",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    } catch (error) {
      LogError({
        error,
        scenario: "Error in GetTrendingSearch in services/search",
      });
      return null;
    }
  }
}
export default new SearchService();
