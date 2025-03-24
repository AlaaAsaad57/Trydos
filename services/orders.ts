import { OrdersResponse } from "../types/orders";
import { AxiosGet } from "utils/AxiosApi";

export const fetchOrders = async (
  page: number,
  pageSize: number = 8
): Promise<OrdersResponse> => {
  try {
    const response = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        `/customer/order/list?offset=${page}&limit=${pageSize}`,
      title: "Fetch Orders",
    });
    return response;
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Fallback to mock data if API is not available
  }
};
