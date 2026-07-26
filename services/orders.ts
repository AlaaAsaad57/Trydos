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

// Orders-count for the settings link card. Asks for a single row (`limit=1`) —
// only the `total_order_group` envelope value is used, never the rows — so the
// card can render its badge without the settings page fetching orders on the
// server.
export const fetchOrdersCount = async (): Promise<number | null> => {
  try {
    const response = await fetchData({
      url: `/customer/order/list?offset=1&limit=1`,
      reqTitle: REQUESTS_DATA.FETCH_ORDERS,
      method: "GET",
      server: "market",
      noMessage: true,
    });
    if (!response?.success) {
      throw new Error(response?.message);
    }
    return response?.data?.total_order_group ?? 0;
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "Error In fetchOrdersCount in services/orders",
    });
    return null;
  }
};

// Fetches every order the shopper has hidden — both fully-hidden packs
// (`order.is_hidden`) and otherwise-visible packs that contain a hidden product
// line (`detail.is_hidden`). Unlike `/order/list`, this endpoint returns a flat
// `data: OrderInterface[]` (no pagination envelope), so we fetch it in one shot.
export const fetchHiddenOrders = async (): Promise<any> => {
  try {
    const response = await fetchData({
      url: `/customer/order/getHiddenOrders`,
      reqTitle: REQUESTS_DATA.FETCH_HIDDEN_ORDERS,
      method: "GET",
      server: "market",
    });
    if (!response?.success) {
      throw new Error(response?.message);
    }
    return response;
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "Error In fetchHiddenOrders in services/orders",
    });
  }
};
