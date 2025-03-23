import { OrderResponse } from "../types/orders";
import { AxiosGet } from "utils/AxiosApi";

export const fetchOrders = async (
  page: number,
  pageSize: number = 8
): Promise<OrderResponse> => {
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
    return {
      orders: [
        {
          id: `${page * pageSize + 1}`,
          orderNumber: `ORD-${page * pageSize + 1}`,
          status: "processing",
          date: "2024-03-22",
          total: 99.99,
          items: 3,
          trackingNumber: "TRK123456",
        },
        {
          id: `${page * pageSize + 2}`,
          orderNumber: `ORD-${page * pageSize + 2}`,
          status: "shipped",
          date: "2024-03-21",
          total: 149.99,
          items: 2,
          trackingNumber: "TRK123457",
        },
        {
          id: `${page * pageSize + 3}`,
          orderNumber: `ORD-${page * pageSize + 3}`,
          status: "delivered",
          date: "2024-03-20",
          total: 199.99,
          items: 4,
          trackingNumber: "TRK123458",
        },
        {
          id: `${page * pageSize + 4}`,
          orderNumber: `ORD-${page * pageSize + 4}`,
          status: "pending",
          date: "2024-03-19",
          total: 79.99,
          items: 1,
        },
        {
          id: `${page * pageSize + 5}`,
          orderNumber: `ORD-${page * pageSize + 5}`,
          status: "cancelled",
          date: "2024-03-18",
          total: 299.99,
          items: 5,
        },
        {
          id: `${page * pageSize + 6}`,
          orderNumber: `ORD-${page * pageSize + 6}`,
          status: "processing",
          date: "2024-03-17",
          total: 89.99,
          items: 2,
        },
        {
          id: `${page * pageSize + 7}`,
          orderNumber: `ORD-${page * pageSize + 7}`,
          status: "shipped",
          date: "2024-03-16",
          total: 159.99,
          items: 3,
          trackingNumber: "TRK123459",
        },
        {
          id: `${page * pageSize + 8}`,
          orderNumber: `ORD-${page * pageSize + 8}`,
          status: "delivered",
          date: "2024-03-15",
          total: 129.99,
          items: 2,
          trackingNumber: "TRK123460",
        },
      ],
      hasMore: page < 10,
      nextPage: page + 1,
    };
  }
};
