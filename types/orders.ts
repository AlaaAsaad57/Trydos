export interface OrderItem {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  total: number;
  items: number;
  trackingNumber?: string;
}

export interface OrderResponse {
  orders: OrderItem[];
  hasMore: boolean;
  nextPage: number;
}
