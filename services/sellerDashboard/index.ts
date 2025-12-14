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
  async getSellerProducts(sellerId: string, page: number = 1) {
    try {
      let res = await fetchData({
        url: `/shop/get-user-seller-products/${sellerId}${page > 1 ? `?page=${page}` : ""}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_PRODUCTS,
        sellerId,
      });
      console.log("Seller Products Response:", res);
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerBoutiques(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/get-user-seller-boutiques/${sellerId}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_BOUTIQUES,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerPermissions(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/user/permissions`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.GET_SELLER_PERMISSIONS,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
}
export default new SellerDashboardService();
