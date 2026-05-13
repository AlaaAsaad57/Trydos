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
        url: `/shop/products${page > 1 ? `?page=${page}` : ""}`,
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
        url: `/shop/boutiques`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_BOUTIQUES,
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to fetch seller boutiques");
      }
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
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to fetch seller permissions");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerOrders(sellerId: string, page: number = 1, status?: string) {
    try {
      const params: string[] = [];
      if (page > 1) params.push(`page=${page}`);
      if (status) params.push(`status=${encodeURIComponent(status)}`);
      const queryString = params.length ? `?${params.join("&")}` : "";

      let res = await fetchData({
        url: `/shop/orders${queryString}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_ORDERS,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async updateOrderStatus(
    sellerId: string,
    data: { id: number | string; status: string },
  ) {
    try {
      let res = await fetchData({
        url: `/shop/orders/status`,
        method: "PATCH",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SELLER_ORDER_STATUS,
        body: JSON.stringify(data),
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async confirmOrderDetailStatus(
    sellerId: string,
    data: { order_detail_id: number },
  ) {
    try {
      let res = await fetchData({
        url: `/shop/orders/details/status/confirmed`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SELLER_ORDER_DETAIL_STATUS,
        body: JSON.stringify(data),
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async packOrderDetailStatus(
    sellerId: string,
    data: { order_detail_id: number },
  ) {
    try {
      let res = await fetchData({
        url: `/shop/orders/details/status/packed`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SELLER_ORDER_DETAIL_STATUS,
        body: JSON.stringify(data),
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async cancelOrderDetail(
    sellerId: string,
    data: { detail_id: number; order_id: number; qty: number },
  ) {
    try {
      let res = await fetchData({
        url: `/api/v1/shop/orders/details/cancel`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.CANCEL_SELLER_ORDER_DETAIL,
        body: JSON.stringify(data),
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getRoles(sellerId: string, page: number = 1, search: string = "") {
    try {
      const params: string[] = [];
      if (page > 1) params.push(`page=${page}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      const queryString = params.length ? `?${params.join("&")}` : "";

      let res = await fetchData({
        url: `/shop/users/roles${queryString}`,
        method: "GET",
        server: "market-dashboard",

        reqTitle: REQUESTS_DATA.GET_SHOP_ROLES,
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async addUserToShop(data: {
    phone: string;
    role_id: number;
    seller_id: string;
  }) {
    try {
      let res = await fetchData({
        url: `/shop/users/add`,
        method: "POST",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.ADD_USER_TO_SHOP,
        body: JSON.stringify(data),
        sellerId: data.seller_id,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getUsers(sellerId: string, page: number = 1, lang?: string) {
    try {
      const pageQuery = page > 1 ? `?page=${page}` : "";
      const langQuery = lang ? `${pageQuery ? "&" : "?"}lang=${lang}` : "";
      let res = await fetchData({
        url: `/shop/users${pageQuery}${langQuery}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SHOP_USERS,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(userId: number | string, sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/users/${userId}/delete`,
        method: "DELETE",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.DELETE_SHOP_USER,
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(
    data: { user_id: number; role_id: number },
    sellerId: string,
  ) {
    try {
      let res = await fetchData({
        url: `/shop/users/role/update`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_USER_ROLE,
        body: JSON.stringify(data),
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async leaveShop(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/users/leave`,
        method: "DELETE",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.LEAVE_SHOP,
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
}
export default new SellerDashboardService();
