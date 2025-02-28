import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { store } from "store";

class SearchService {
  async getTrendingSearch() {
    let data = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
        "/api/products/popular-search",
      title: "Get Trending Search",
    });
    store.dispatch({ type: "TRENDING-SEARCH", payload: data });
  }
}
export default new SearchService();
