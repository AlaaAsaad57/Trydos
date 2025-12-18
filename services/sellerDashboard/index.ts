import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

class SellerDashboardService {
  async getShopes(noMessage = false) {
    try {
      let res = await fetchData({
        url: `/shop/auth/permissions`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.GET_SHOPES_FOR_SELLER,
        noMessage,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getSellerProducts(sellerId: string, page: number = 1) {
    try {
      let res = await fetchData({
        url: `/shop/product/${sellerId}/get-list${
          page > 1 ? `?page=${page}` : ""
        }`,
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
        url: `/shop/boutique/${sellerId}/get-list`,
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
        url: `/shop/auth/permissions`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.GET_SELLER_PERMISSIONS,
        sellerId
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getRoles(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/user/roles`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SHOP_ROLES,
        sellerId
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async addUserToShop(data: { phone: string; role_id: number; seller_id: string }) {
    try {
      let res = await fetchData({
        url: `/shop/user/add`,
        method: "POST",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.ADD_USER_TO_SHOP,
        body: JSON.stringify(data),
        sellerId: data.seller_id
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
}
export default new SellerDashboardService();
