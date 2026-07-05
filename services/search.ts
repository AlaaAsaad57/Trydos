import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";

class SearchService {
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
