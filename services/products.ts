import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { PRODUCT_DELIVERY_TIMES } from "utils/endpointConfig";

export interface DeliveredOrder {
  days_count: number;
  orders_count: number;
}

// Fetches the historical delivery distribution for a product.
// Response shape: { data: { delivered_orders: [{ days_count, orders_count }] } }
// Days with no record are simply absent — the UI treats them as zero.
export async function GetProductDeliveryTimes({
  productId,
  signal,
}: {
  productId: number | string;
  signal?: AbortSignal;
}): Promise<DeliveredOrder[]> {
  const response = await fetchData({
    url: `${PRODUCT_DELIVERY_TIMES}/${productId}`,
    method: "GET",
    server: "market",
    reqTitle: REQUESTS_DATA.GET_DELIVERY_TIMES,
    useCached: true,
    noMessage: true,
    signal,
  });

  if (!response?.success) return [];
  return response?.data?.delivered_orders ?? [];
}
