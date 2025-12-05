import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

class SellerDashboardService {
  async getShopes() {
    try {
      let res = await fetchData({
        url: `/shop/user/permissions`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.GET_SHOPES_FOR_SELLER,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerProducts(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/get-user-seller-products/${sellerId}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SHOPES_FOR_SELLER,
      });
      console.log("Seller Products Response:", res);
      return res;
    } catch (error) {
      throw error;
    }
  }
}
export default new SellerDashboardService();
