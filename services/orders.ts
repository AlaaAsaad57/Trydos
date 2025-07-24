import { useAppStore } from "store";
import { OrdersResponse } from "../types/orders";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

export const fetchOrders = async (
  page: number,
  pageSize: number = 8,
  selectedStatus: string = ""
): Promise<OrdersResponse> => {
  try {
    const response = await fetchData({
      url: `/customer/order/list?offset=${page}&limit=${pageSize}${
        selectedStatus ? `&order_group_status=${selectedStatus}` : ""
      }`,
      reqTitle: REQUESTS_DATA.FETCH_ORDERS,
      method: "GET",
      server: "market",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    const { setTotalOrders } = useAppStore.getState();
    setTotalOrders(response.data.total);
    return response;
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Fallback to mock data if API is not available
  }
};
