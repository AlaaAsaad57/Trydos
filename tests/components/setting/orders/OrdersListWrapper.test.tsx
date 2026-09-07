import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import OrdersListWrapper from "components/setting/orders/OrdersListWrapper";
import { useAppStore } from "store";
import { renderWithProviders, userEvent } from "../../../render";

vi.mock("components/Orders/OrderItem", () => ({
  default: ({ order }: any) => (
    <div data-testid={`order-group-${order.order_group_id}`}>
      <span>Group ID: {order.order_group_id}</span>
      <span>Total Amount: {order.order_amount}</span>
      <span>Detail Count: {order.details?.length}</span>
    </div>
  ),
}));

vi.mock("components/settings/OrderSkeletons", () => ({
  default: () => <div data-testid="order-skeletons">Skeletons Loading</div>,
}));

const mockFetchOrders = vi.fn();
vi.mock("services/orders", () => ({
  fetchOrders: (...args: any[]) => mockFetchOrders(...args),
}));

const mockTrackOrderMgmt = vi.fn();
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: {
    ORDER_HISTORY_VIEWED: "order_history_viewed",
    ORDER_HISTORY_FILTERED: "order_history_filtered",
  },
  trackOrderMgmt: (...args: any[]) => mockTrackOrderMgmt(...args),
}));

const mockLogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    LogError: (...args: any[]) => mockLogError(...args),
  };
});

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: any) {}
}

const mockStatuses = [
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

describe("OrdersListWrapper (components/setting/orders/OrdersListWrapper.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    useAppStore.setState({ shouldUpdateOrders: 0 });
  });

  describe("Initial Fetch & Rendering", () => {
    it("fetches first page with null status filter and tracks ORDER_HISTORY_VIEWED", async () => {
      mockFetchOrders.mockResolvedValueOnce({
        isSuccessful: true,
        data: {
          total: 1,
          orders: [
            {
              id: 10,
              order_group_id: 100,
              order_amount: 150,
              order_status: { value: "pending" },
              details: [{ id: 1, order_id: 10, product_name: "Dress" }],
            },
          ],
        },
      });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(mockFetchOrders, "should call fetchOrders for page 1 with 10 limit and null status").toHaveBeenCalledWith(
          1,
          10,
          null,
        );
      });

      expect(
        mockTrackOrderMgmt,
        "should track ORDER_HISTORY_VIEWED on initial fetch",
      ).toHaveBeenCalledWith("order_history_viewed", {
        status_filter: "all",
        order_count: 1,
        page: 1,
      });

      expect(
        screen.getByTestId("order-group-100"),
        "should render fetched order item",
      ).toBeInTheDocument();
    });
  });

  describe("Order Processing & Deduplication (processOrders)", () => {
    it("groups multiple orders sharing order_group_id into a single group with combined details and sum of amounts", async () => {
      mockFetchOrders.mockResolvedValueOnce({
        isSuccessful: true,
        data: {
          total: 2,
          orders: [
            {
              id: 10,
              order_group_id: 500,
              order_amount: 100,
              order_status: { value: "processing" },
              details: [
                { id: 1, order_id: 10, product_name: "Item A" },
                { id: 2, order_id: 10, product_name: "Item B" },
              ],
            },
            {
              id: 11,
              order_group_id: 500,
              order_amount: 50,
              order_status: { value: "processing" },
              details: [
                { id: 3, order_id: 11, product_name: "Item C" },
              ],
            },
          ],
        },
      });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("order-group-500")).toBeInTheDocument();
      });

      // 100 + 50 = 150
      expect(
        screen.getByText("Total Amount: 150"),
        "should sum order amounts across grouped orders",
      ).toBeInTheDocument();
      // 2 + 1 = 3 details
      expect(
        screen.getByText("Detail Count: 3"),
        "should merge details across sub-orders",
      ).toBeInTheDocument();
    });
  });

  describe("Status Filtering", () => {
    it("filters orders by status, tracks ORDER_HISTORY_FILTERED, and refetches page 1", async () => {
      mockFetchOrders
        .mockResolvedValueOnce({
          isSuccessful: true,
          data: { total: 1, orders: [{ id: 1, order_group_id: 1, order_amount: 20, details: [] }] },
        })
        .mockResolvedValueOnce({
          isSuccessful: true,
          data: { total: 1, orders: [{ id: 2, order_group_id: 2, order_amount: 30, details: [] }] },
        });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("order-group-1")).toBeInTheDocument();
      });

      const completedTab = screen.getByRole("button", { name: "Completed" });
      await userEvent.click(completedTab);

      expect(
        mockTrackOrderMgmt,
        "should track ORDER_HISTORY_FILTERED with previous and next status",
      ).toHaveBeenCalledWith("order_history_filtered", {
        from_status: "all",
        to_status: "completed",
      });

      await waitFor(() => {
        expect(mockFetchOrders, "should refetch orders with completed status").toHaveBeenCalledWith(
          1,
          10,
          "completed",
        );
      });
    });

    it("does not refetch or track when clicking the currently active status", async () => {
      mockFetchOrders.mockResolvedValueOnce({
        isSuccessful: true,
        data: { total: 0, orders: [] },
      });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(mockFetchOrders).toHaveBeenCalledTimes(1);
      });

      const allTab = screen.getByRole("button", { name: "All" });
      await userEvent.click(allTab);

      expect(
        mockFetchOrders,
        "clicking already active tab should not trigger additional fetch",
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Empty, Skeleton, and End of List States", () => {
    it("displays empty state text when fetch returns no orders", async () => {
      mockFetchOrders.mockResolvedValueOnce({
        isSuccessful: true,
        data: { total: 0, orders: [] },
      });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText("No orders found for this status."),
          "should display empty state message",
        ).toBeInTheDocument();
      });
    });

    it("displays loading skeletons while fetching orders", async () => {
      let resolveFetch: any;
      mockFetchOrders.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      expect(
        screen.getByTestId("order-skeletons"),
        "should display skeleton loader while fetch is pending",
      ).toBeInTheDocument();

      resolveFetch({
        isSuccessful: true,
        data: { total: 0, orders: [] },
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId("order-skeletons"),
          "should hide skeleton loader after fetch completes",
        ).not.toBeInTheDocument();
      });
    });

    it("displays 'No more orders' when hasMore is false and orders exist", async () => {
      mockFetchOrders.mockResolvedValueOnce({
        isSuccessful: true,
        data: {
          total: 1, // 1 * 10 >= total (10 >= 1), so hasMore is false
          orders: [
            {
              id: 9,
              order_group_id: 999,
              order_amount: 80,
              details: [],
            },
          ],
        },
      });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText("No more orders"),
          "should show 'No more orders' when all available orders are loaded",
        ).toBeInTheDocument();
      });
    });
  });

  describe("Store Refresh & Error Handling", () => {
    it("refetches orders and resets shouldUpdateOrders when store flag changes", async () => {
      mockFetchOrders.mockResolvedValue({
        isSuccessful: true,
        data: { total: 0, orders: [] },
      });

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(mockFetchOrders).toHaveBeenCalledTimes(1);
      });

      mockFetchOrders.mockClear();

      // Trigger store update
      useAppStore.setState({ shouldUpdateOrders: 1 });

      await waitFor(() => {
        expect(
          mockFetchOrders.mock.calls.length,
          "should refetch orders when shouldUpdateOrders is set",
        ).toBeGreaterThanOrEqual(1);
        expect(
          useAppStore.getState().shouldUpdateOrders,
          "should reset shouldUpdateOrders to 0",
        ).toBe(0);
      });
    });

    it("handles fetch failure gracefully by logging error and setting hasMore to false", async () => {
      mockFetchOrders.mockRejectedValueOnce(new Error("Network disconnect"));

      await renderWithProviders(
        <OrdersListWrapper
          isRtl={false}
          language="en"
          order_group_statuses={mockStatuses}
          local="gb-en"
        />,
      );

      await waitFor(() => {
        expect(
          mockLogError,
          "should log error on fetch rejection",
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            scenario: "Error In handleFetchOrders in OrderListWrapper",
          }),
        );
      });
    });
  });
});
