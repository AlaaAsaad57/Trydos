import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import OrdersPage, { DeleteModalComponent } from "components/Cart/OrdersPage";
import { useAppStore } from "store";
import { renderWithProviders, userEvent } from "../../render";

// Mock child components to isolate OrdersPage and OrderButtons
vi.mock("components/Cart/ShippingAddressContainer", () => ({
  default: ({ openAddressList, slideNext, slidePrev }: any) => (
    <div data-testid="shipping-address-container">
      <button
        data-testid="mock-open-address-list"
        onClick={() => openAddressList(true)}
      >
        Open Address List
      </button>
      <button data-testid="mock-slide-next" onClick={slideNext}>
        Slide Next
      </button>
      <button data-testid="mock-slide-prev" onClick={slidePrev}>
        Slide Prev
      </button>
    </div>
  ),
}));

vi.mock("components/global/SlideNavigation", () => ({
  SlideWidget: ({ children }: any) => (
    <div data-testid="slide-widget">{children}</div>
  ),
}));

vi.mock("components/Cart/PaymentMethod", () => ({
  default: () => <div data-testid="payment-method">Payment Method Mock</div>,
}));

vi.mock("components/Cart/AddressListContainer", () => ({
  default: ({ Delete, slideNext, closeSelect }: any) => (
    <div data-testid="address-list-container">
      <button
        data-testid="mock-trigger-delete"
        onClick={() =>
          Delete({
            id: 99,
            address: "Office",
            region_details: {
              province: "Damascus",
              city: "Old City",
              town: "Souq",
              street: "Straight St",
              building: "B12",
            },
            contact_info: { phone: "+963999999", name: "Kareem" },
          })
        }
      >
        Trigger Delete
      </button>
      <button data-testid="mock-addr-next" onClick={slideNext}>
        Addr Next
      </button>
      <button data-testid="mock-addr-close" onClick={closeSelect}>
        Addr Close
      </button>
    </div>
  ),
}));

vi.mock("components/Cart/SelectRegion", () => ({
  default: ({ closeSelect }: any) => (
    <div data-testid="select-region">
      <button data-testid="mock-region-close" onClick={closeSelect}>
        Close Region
      </button>
    </div>
  ),
}));

vi.mock("components/Cart/PlaceOrderWidget", () => ({
  default: () => (
    <div data-testid="place-order-widget">Place Order Widget Mock</div>
  ),
}));

vi.mock("components/Cart/PlaceOrderButtons", () => ({
  default: ({ backToCart, close, successOrder }: any) => (
    <div data-testid="place-order-buttons">
      <button data-testid="mock-place-order-back" onClick={backToCart}>
        Back to Cart
      </button>
      <button data-testid="mock-place-order-close" onClick={close}>
        Close
      </button>
      <button data-testid="mock-place-order-submit" onClick={successOrder}>
        Submit Order
      </button>
    </div>
  ),
}));

vi.mock("components/Cart/AddAddressForm", () => ({
  default: ({ setOpenSelect, slidePrev }: any) => (
    <div data-testid="add-address-form">
      <button data-testid="mock-form-open-select" onClick={setOpenSelect}>
        Open Select
      </button>
      <button data-testid="mock-form-slide-prev" onClick={() => slidePrev(0)}>
        Form Prev
      </button>
    </div>
  ),
}));

const mockTrackOrder = vi.fn();
vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: {
    CHECKOUT_ADDRESS_SCREEN_VIEWED: "checkout_address_screen_viewed",
    ADDRESS_DELETED: "address_deleted",
    CHECKOUT_CONFIRM_CLICKED: "checkout_confirm_clicked",
    CHECKOUT_BLOCKED_ADDRESS_MISSING: "checkout_blocked_address_missing",
    CHECKOUT_BLOCKED_PAYMENT_MISSING: "checkout_blocked_payment_missing",
    CHECKOUT_BLOCKED_BALANCE_INSUFFICIENT:
      "checkout_blocked_balance_insufficient",
    CHECKOUT_BLOCKED_PHONE_UNVERIFIED: "checkout_blocked_phone_unverified",
    CHECKOUT_BLOCKED_CART_UNAVAILABLE: "checkout_blocked_cart_unavailable",
    CHECKOUT_EMPTY_CART: "checkout_empty_cart",
    ORDER_SUBMIT_ATTEMPT: "order_submit_attempt",
    ORDER_PLACE_FAILED: "order_place_failed",
  },
  trackOrder: (...args: any[]) => mockTrackOrder(...args),
}));

const mockLogError = vi.fn();
const mockGetCart = vi.fn();
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    LogError: (...args: any[]) => mockLogError(...args),
    getCart: (...args: any[]) => mockGetCart(...args),
  };
});

const mockShowErrorNotification = vi.fn();
vi.mock("@/store/notifications/reducer", () => ({
  showErrorNotification: (...args: any[]) => mockShowErrorNotification(...args),
}));

const mockPlaceOrder = vi.fn();
const mockDeleteAddressList = vi.fn();
vi.mock("services/order", () => ({
  default: {
    PlaceOrder: (...args: any[]) => mockPlaceOrder(...args),
    DeleteAddressList: (...args: any[]) => mockDeleteAddressList(...args),
  },
}));

const mockGetCustomerInfo = vi.fn();
vi.mock("services/home", () => ({
  default: {
    getCustomerInfo: (...args: any[]) => mockGetCustomerInfo(...args),
  },
}));

const defaultStoreState = {
  addressDetails: {
    id: 1,
    address: "Main Street",
    address_detail: "Apt 4B",
    region_details: {
      province: "Damascus",
      city: "Old City",
      town: "Bab Touma",
      street: "Straight St",
      building: "Bldg 5",
    },
    contact_info: {
      phone: "+963911111111",
      name: "Sami",
    },
  },
  addressLists: [
    {
      id: 1,
      address: "Main Street",
      is_default: 1,
    },
  ],
  orderData: {
    payment: [
      {
        id: 0,
        balance: 100,
      },
    ],
    loading: false,
    success: false,
  },
  user: { name: "Sami" },
  userProfile: { is_phone_verified: 1 },
  cart: [
    {
      id: 101,
      quantity: 2,
      check_availability: true,
      is_country_restricted: false,
      is_active: true,
    },
  ],
  total: 50,
  total_cash: 55,
  currency: {
    symbol: "$",
    decimal_digits: 2,
  },
};

describe("OrdersPage (components/Cart/OrdersPage.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(defaultStoreState);
    if (typeof window !== "undefined") {
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    }
  });

  describe("Screen entry & telemetry", () => {
    it("tracks CHECKOUT_ADDRESS_SCREEN_VIEWED with has_saved_address: true when address exists", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      expect(
        mockTrackOrder,
        "should track checkout_address_screen_viewed with saved address true",
      ).toHaveBeenCalledWith("checkout_address_screen_viewed", {
        has_saved_address: true,
      });
    });

    it("tracks CHECKOUT_ADDRESS_SCREEN_VIEWED with has_saved_address: false when addressDetails has no id", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            addressDetails: { id: null },
          },
        },
      );

      expect(
        mockTrackOrder,
        "should track checkout_address_screen_viewed with saved address false",
      ).toHaveBeenCalledWith("checkout_address_screen_viewed", {
        has_saved_address: false,
      });
    });
  });

  describe("Navigation & Header Back", () => {
    it("calls setStep(0) when clicking back button", async () => {
      const mockSetStep = vi.fn();
      await renderWithProviders(
        <OrdersPage setStep={mockSetStep} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      const backIcon = document.querySelector(
        '[data-pw="swiperSlide-backIcon"]',
      );
      expect(backIcon, "back icon should exist").toBeTruthy();

      await userEvent.click(backIcon!);
      expect(mockSetStep, "clicking back icon should return to step 0").toHaveBeenCalledWith(
        0,
      );
    });
  });

  describe("Validation & Checkout Gating (OrderButtons)", () => {
    it("blocks checkout and shows notification when default address is missing", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            addressLists: [],
          },
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      expect(confirmBtn, "confirm button should exist").toBeTruthy();

      await userEvent.click(confirmBtn!);

      expect(
        mockShowErrorNotification,
        "should notify user to select an address",
      ).toHaveBeenCalledWith("Please Select an Address");
      expect(
        mockTrackOrder,
        "should track checkout_blocked_address_missing",
      ).toHaveBeenCalledWith("checkout_blocked_address_missing");
    });

    it("blocks checkout when payment method is not selected", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            orderData: { payment: [], loading: false, success: false },
          },
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      expect(
        mockTrackOrder,
        "should track checkout_blocked_payment_missing",
      ).toHaveBeenCalledWith("checkout_blocked_payment_missing");
    });

    it("blocks checkout when balance is less than total price", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            orderData: {
              payment: [{ id: 0, balance: 10 }],
              loading: false,
              success: false,
            },
            total_cash: 55,
          },
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      expect(
        mockShowErrorNotification,
        "should notify insufficient balance",
      ).toHaveBeenCalledWith("Your Balance Not meet purchase value");
      expect(
        mockTrackOrder,
        "should track checkout_blocked_balance_insufficient with figures",
      ).toHaveBeenCalledWith("checkout_blocked_balance_insufficient", {
        balance: 10,
        required: 55,
      });
    });

    it("calculates price using total_cash when payment method is cash on delivery", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            total_cash: 75,
            total: 50,
            orderData: { payment: [{ id: 0, balance: 200 }], loading: false, success: false },
          },
        },
      );

      const priceSpan = document.querySelector(
        '[data-pw="Number-Of-Products-Required"]',
      );
      expect(
        priceSpan?.textContent,
        "should show total_cash (75) for cash on delivery",
      ).toContain("75");
    });

    it("calculates price using total when payment method is card or crypto", async () => {
      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            total_cash: 75,
            total: 50,
            orderData: { payment: [{ id: 2, balance: 200 }], loading: false, success: false },
          },
        },
      );

      const priceSpan = document.querySelector(
        '[data-pw="Number-Of-Products-Required"]',
      );
      expect(
        priceSpan?.textContent,
        "should show total (50) for non-cash payment",
      ).toContain("50");
    });
  });

  describe("VerifyCart flow", () => {
    it("blocks checkout when user phone is unverified", async () => {
      const mockSetStep = vi.fn();
      mockGetCart.mockResolvedValueOnce({
        cart: [{ id: 101, check_availability: true, is_active: true }],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});

      await renderWithProviders(
        <OrdersPage setStep={mockSetStep} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            userProfile: { is_phone_verified: 0 },
          },
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(
          mockTrackOrder,
          "should track checkout_confirm_clicked",
        ).toHaveBeenCalledWith("checkout_confirm_clicked");
        expect(
          mockTrackOrder,
          "should track checkout_blocked_phone_unverified",
        ).toHaveBeenCalledWith("checkout_blocked_phone_unverified");
        expect(
          mockShowErrorNotification,
          "should display verify phone error notification",
        ).toHaveBeenCalledWith("Please Verify Your Phone Number");
      });
    });

    it("blocks checkout and tracks CHECKOUT_EMPTY_CART when getCart returns empty", async () => {
      mockGetCart.mockResolvedValueOnce({ cart: [] });
      mockGetCustomerInfo.mockResolvedValueOnce({});

      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(
          mockTrackOrder,
          "should track checkout_empty_cart when bag is empty",
        ).toHaveBeenCalledWith("checkout_empty_cart");
      });
    });

    it("blocks checkout when an item is unavailable or restricted", async () => {
      mockGetCart.mockResolvedValueOnce({
        cart: [
          {
            id: 101,
            check_availability: false,
            is_country_restricted: false,
            is_active: true,
          },
        ],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});

      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(
          mockShowErrorNotification,
          "should notify that some products are not available",
        ).toHaveBeenCalledWith(
          "Please Review Your Cart Some Products Not Available",
        );
        expect(
          mockTrackOrder,
          "should track checkout_blocked_cart_unavailable",
        ).toHaveBeenCalledWith("checkout_blocked_cart_unavailable");
      });
    });

    it("advances to nextStep when all items in cart are available and valid", async () => {
      mockGetCart.mockResolvedValueOnce({
        cart: [
          {
            id: 101,
            check_availability: true,
            is_country_restricted: false,
            is_active: true,
          },
        ],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});

      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(
          screen.getByTestId("place-order-buttons"),
          "should advance and render place order buttons",
        ).toBeInTheDocument();
      });
    });
  });

  describe("Order submission (setOrderSuccess)", () => {
    it("submits order with cash_on_delivery when payment method id is 0", async () => {
      mockGetCart.mockResolvedValueOnce({
        cart: [{ id: 101, check_availability: true, is_active: true }],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});
      mockPlaceOrder.mockResolvedValueOnce({ success: true });

      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      // Advance to nextStep
      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(screen.getByTestId("mock-place-order-submit")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("mock-place-order-submit"));

      expect(
        mockTrackOrder,
        "should track order_submit_attempt with cash_on_delivery",
      ).toHaveBeenCalledWith("order_submit_attempt", {
        payment_method: "cash_on_delivery",
      });
      expect(
        mockPlaceOrder,
        "should call order.PlaceOrder with cash_on_delivery",
      ).toHaveBeenCalledWith({
        payment_method: "cash_on_delivery",
        pay_by_wallet: false,
      });
    });

    it("submits order with card when payment method id is 2", async () => {
      mockGetCart.mockResolvedValueOnce({
        cart: [{ id: 101, check_availability: true, is_active: true }],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});
      mockPlaceOrder.mockResolvedValueOnce({ success: true });

      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            orderData: {
              payment: [{ id: 2, balance: 200 }],
              loading: false,
              success: false,
            },
          },
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(screen.getByTestId("mock-place-order-submit")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("mock-place-order-submit"));

      expect(
        mockTrackOrder,
        "should track order_submit_attempt with card",
      ).toHaveBeenCalledWith("order_submit_attempt", {
        payment_method: "card",
      });
      expect(
        mockPlaceOrder,
        "should call order.PlaceOrder with card",
      ).toHaveBeenCalledWith({
        payment_method: "card",
        pay_by_wallet: false,
      });
    });

    it("skips PlaceOrder when payment method is wallet (id: 1)", async () => {
      mockGetCart.mockResolvedValueOnce({
        cart: [{ id: 101, check_availability: true, is_active: true }],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});

      await renderWithProviders(
        <OrdersPage setStep={vi.fn()} close={vi.fn()} />,
        {
          store: {
            ...defaultStoreState,
            orderData: {
              payment: [{ id: 1, balance: 200 }],
              loading: false,
              success: false,
            },
          },
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(screen.getByTestId("mock-place-order-submit")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("mock-place-order-submit"));

      expect(
        mockPlaceOrder,
        "wallet payment should not trigger order.PlaceOrder directly from OrdersPage",
      ).not.toHaveBeenCalled();
    });

    it("handles order placement failure by logging error, tracking failure, and reverting step", async () => {
      const mockSetStep = vi.fn();
      mockGetCart.mockResolvedValueOnce({
        cart: [{ id: 101, check_availability: true, is_active: true }],
      });
      mockGetCustomerInfo.mockResolvedValueOnce({});
      mockPlaceOrder.mockRejectedValueOnce(new Error("Gateway timeout"));

      await renderWithProviders(
        <OrdersPage setStep={mockSetStep} close={vi.fn()} />,
        {
          store: defaultStoreState,
        },
      );

      const confirmBtn = document.querySelector(
        '[data-pw="Confirm-shipping-and-payment"]',
      );
      await userEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(screen.getByTestId("mock-place-order-submit")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("mock-place-order-submit"));

      await waitFor(() => {
        expect(
          mockLogError,
          "should log error on placement failure",
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            scenario: "create  order function - cart widget",
          }),
        );
        expect(
          mockTrackOrder,
          "should track order_place_failed",
        ).toHaveBeenCalledWith("order_place_failed", {
          reason: "Gateway timeout",
          stage: "place_order_setOrderSuccess",
        });
        expect(
          mockSetStep,
          "should return to step 0 on error",
        ).toHaveBeenCalledWith(0);
      });
    });
  });

  describe("DeleteModalComponent", () => {
    const mockAddressToDelete = {
      id: 77,
      address: "Home Villa",
      address_detail: "Near Mosque",
      region_details: {
        province: "Damascus",
        city: "Old City",
        town: "Midan",
        street: "Main St",
        building: "Villa 3",
      },
      contact_info: {
        phone: "+963988888888",
        name: "Youssef",
      },
    };

    it("renders address details and formatted region string", async () => {
      await renderWithProviders(
        <DeleteModalComponent
          closeModal={vi.fn()}
          deletedAddress={mockAddressToDelete}
          slidePrev={vi.fn()}
        />,
        { store: defaultStoreState },
      );

      expect(
        screen.getByText("Home Villa"),
        "should render address title",
      ).toBeInTheDocument();
      expect(
        screen.getByText("Damascus | Old City | Midan | Main St | Villa 3"),
        "should format region string correctly",
      ).toBeInTheDocument();
      expect(
        screen.getByText("+963988888888"),
        "should display contact phone",
      ).toBeInTheDocument();
      expect(
        screen.getByText("Youssef"),
        "should display contact name",
      ).toBeInTheDocument();
    });

    it("deletes address and notifies store and service when confirming", async () => {
      const mockCloseModal = vi.fn();
      const mockSlidePrev = vi.fn();

      await renderWithProviders(
        <DeleteModalComponent
          closeModal={mockCloseModal}
          deletedAddress={mockAddressToDelete}
          slidePrev={mockSlidePrev}
        />,
        { store: defaultStoreState },
      );

      const yesBtn = document.querySelector('[data-pw="Yes-Delete-Address"]');
      expect(yesBtn, "Yes-Delete-Address button should exist").toBeTruthy();
      await userEvent.click(yesBtn!);

      expect(
        mockSlidePrev,
        "should slide prev on address delete",
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCloseModal,
        "should close modal on address delete",
      ).toHaveBeenCalledTimes(1);
      expect(
        mockTrackOrder,
        "should track address_deleted event",
      ).toHaveBeenCalledWith("address_deleted", { address_id: 77 });
      expect(
        mockDeleteAddressList,
        "should call order.DeleteAddressList with address id",
      ).toHaveBeenCalledWith({ address: 77 });
    });

    it("closes modal on cancel click", async () => {
      const mockCloseModal = vi.fn();

      await renderWithProviders(
        <DeleteModalComponent
          closeModal={mockCloseModal}
          deletedAddress={mockAddressToDelete}
          slidePrev={vi.fn()}
        />,
        { store: defaultStoreState },
      );

      const cancelBtn = screen.getByText("Cancel");
      await userEvent.click(cancelBtn);

      expect(mockCloseModal, "should close modal on Cancel").toHaveBeenCalledTimes(1);
    });
  });
});
