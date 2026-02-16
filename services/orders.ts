import { useAppStore } from "store";

import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";

export const fetchOrders = async (
  page: number,
  pageSize: number = 8,
  selectedStatus: string = "",
): Promise<any> => {
  try {
    const response = await fetchData({
      url: `/customer/order/list?offset=${page}&limit=${pageSize}${
        selectedStatus ? `&order_group_status=${selectedStatus}` : ""
      }`,
      reqTitle: REQUESTS_DATA.FETCH_ORDERS,
      method: "GET",
      server: "market",
    });
    if (!response?.success) {
      throw new Error(response?.message);
    }
    const { setTotalOrders } = useAppStore.getState();
    setTotalOrders(response?.data?.total ?? 0);
    return response;
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "Error In fetchOrders in services/orders",
    });
    // Fallback to mock data if API is not available
  }
};
