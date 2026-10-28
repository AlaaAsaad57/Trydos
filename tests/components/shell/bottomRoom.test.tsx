// Old bottom bars and overlays make room for the new bottom nav (S3-6).
//
// While the new bar shows, AppShell sets `--app-bar-room` on <html>. A page bar
// that is fixed at the bottom of the screen must add that room to its bottom
// offset, so it sits on top of the bar. With no bar the variable is unset and
// the `0px` fallback keeps today's place.
//
// jsdom has no layout, so each case reads the offset the component wrote
// (its class or its inline style) and checks that it uses the variable.
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

// ---- Search (market backend reads) ------------------------------------------
vi.mock("serverRequests/Search", () => ({
  GetSearchData: async () => ({ brands: [], categories: [], boutiques: [], products: [], total_size: 0 }),
  GetSearchSuggestion: async () => ({ suggestion: "" }),
}));
vi.mock("services/search", () => ({ default: { getTrendingSearch: async () => ({ popular_search_terms: [] }) } }));
vi.mock("services/auth", () => ({
  default: { UserID: () => "u-1", NotifyForProducts: vi.fn(), getUser: vi.fn() },
}));
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    loader();
    return () => <span>{options?.loading?.()}</span>;
  },
}));
vi.mock("components/Home/Search/SearchVoice", () => ({ default: () => null }));
vi.mock("components/Home/Search/SearchImage", () => ({ default: () => null }));
vi.mock("components/skeleton/IconSkeleton", () => ({ default: () => <i /> }));
vi.mock("components/Home/Search/SearchHistory", () => ({ default: () => null }));
vi.mock("components/Home/Search/SearchTrending", () => ({ default: () => null }));
vi.mock("components/Home/Search/ActiveSearchFilterBar", () => ({
  default: () => <div data-testid="filter-bar" />,
}));
vi.mock("components/global/HortiznalScrollBar", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// ---- Add to cart sheet ------------------------------------------------------
const { stub } = vi.hoisted(() => ({
  stub: (name: string): any => ({ default: () => <div data-testid={name} /> }),
}));
vi.mock("components/Cart/AddToCart/Card", () => stub("Card"));
vi.mock("components/Cart/AddToCart/ColorSelect", () => stub("ColorSelect"));
vi.mock("components/Cart/AddToCart/SizeSelect", () => stub("SizeSelect"));
vi.mock("components/Cart/AddToCart/PricesRow", () => stub("PricesRow"));
vi.mock("components/Cart/AddToCart/ExtraInfoArea", () => stub("ExtraInfoArea"));
vi.mock("components/Cart/AddToCart/Button", () => stub("Button"));
vi.mock("components/Cart/AddToCart/NotifyButton", () => stub("NotifyButton"));
vi.mock("serverRequests", () => ({ getProductDataForAddToCart: async () => ({}) }));
vi.mock("services/home", () => ({
  default: { AllowNotifications: vi.fn(), GetFireBaseSettings: vi.fn(), getCustomerInfo: vi.fn() },
}));
vi.mock("hooks/useLuckTimer", () => ({ useLuckTimer: () => ({ luckActive: false, secondsLeft: 0 }) }));
vi.mock("utils/fetchData", () => ({ fetchData: vi.fn(), abortInFlightForLogout: vi.fn() }));
vi.mock("utils/gtag", () => ({ GAevent: vi.fn() }));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getCart: vi.fn(),
  LogError: vi.fn(),
  onClickSearchHistory: (v: string) => [v],
}));
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DisableScroll: vi.fn(),
  EnableScroll: vi.fn(),
}));
vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackOrder: vi.fn(),
  trackOrderMgmt: vi.fn(),
}));
vi.mock("components/global/AddToCartMessage", () => ({
  showErrorMessage: vi.fn(),
  showSuccessMessage: vi.fn(),
}));

// ---- Chat, orders, notifications --------------------------------------------
vi.mock("components/Chat/pages/ChatWindow", () => stub("ChatWindow"));
vi.mock("components/Chat/pages/ConversationContainer", () => stub("Conversation"));
vi.mock("components/Chat/components/NewChatsSide", () => stub("NewChatsSide"));
vi.mock("components/settings/cards/RatingStars", () => stub("stars"));
vi.mock("react-webcam", () => ({
  default: forwardRef((props: any, ref) => {
    useImperativeHandle(ref, () => ({ getScreenshot: () => "data:image/webp;base64,AAAA", stream: null }));
    useEffect(() => {
      props.onUserMedia?.({ getTracks: () => [] });
    }, []);
    return <div data-testid="webcam" />;
  }),
}));
vi.mock("components/global/ImageCropWidget", () => ({ ImageCropWidget: () => null }));
vi.mock("components/Login/Enhanced/InlineVerifyPanel", () => ({ default: () => null }));
vi.mock("services/order", () => ({
  default: { RateOrderWithhComment: vi.fn(), UploadImageForRating: vi.fn(), UploadImageForOrderReturn: vi.fn() },
}));
vi.mock("services/notifications", () => ({
  fetchNotifications: async () => ({
    isSuccessful: true,
    hasContent: true,
    success: true,
    data: { data: [], next_page_url: null },
  }),
}));
vi.mock("components/Notifications/NotificationItem", () => stub("NotificationItem"));
vi.mock("utils/firebaseInitv1", () => ({ requestFirebaseNotificationPermission: vi.fn() }));
vi.mock("firebase/messaging", () => ({ isSupported: async () => false }));

import AddToCartComponent from "components/Cart/AddToCart/AddToCartComponent";
import OrderButton from "components/Cart/OrderButton";
import Chat from "components/Chat/ChatWindowModal";
import SearchIcon from "components/Home/Search/SearchIcon";
import FiltersButton from "components/ListingPage/filterComponents/FiltersWindow/FiltersButton";
import NotificationsPanel from "components/Notifications/NotificationsPanel";
import RatingOrderItem from "components/Orders/RatingOrderItem";
import UploadImageComponent from "components/Orders/UploadImageComponent";
import NotificationSkeleton from "components/skeleton/NotificationSkeleton";

const ROOM = "var(--app-bar-room";

/** What the component wrote for its place on screen: its class and its inline style. */
const placement = (el: Element | null | undefined) =>
  el ? `${el.getAttribute("class") ?? ""} | ${el.getAttribute("style") ?? ""}` : "(element not found)";

const marked = (pw: string) => document.querySelector(`[data-pw="${pw}"]`);

beforeEach(() => {
  // What AppShell does while the bar shows.
  document.documentElement.style.setProperty("--app-bar-room", "64px");
  window.scrollTo = vi.fn() as any;
});
afterEach(() => {
  document.documentElement.style.removeProperty("--app-bar-room");
  vi.unstubAllGlobals();
});

describe("old bottom bars sit above the new bar", () => {
  it("the add-to-cart sheet takes no room, because BottomSheet covers the bar", async () => {
    const product = { id: 7, slug: "shirt", name: "Shirt", available_quantity: 50, packed_after_ordering: 0 };
    await renderWithProviders(<AddToCartComponent product={product} slug="shirt" />, {
      country: "sy",
      store: { localCart: [], currency: { code: "USD" }, selected_product_for_add_to_cart: null },
    });
    await act(async () => {});
    const bar = screen.getByTestId("PricesRow").parentElement;
    expect(bar, "the add-to-cart bottom row was not drawn inside the real BottomSheet").toBeTruthy();
    expect(
      placement(bar),
      "the add-to-cart sheet sits inside BottomSheet, which covers the bar, so it takes no room",
    ).not.toContain(ROOM);
  });

  it("the filter window button row adds the room to its bottom offset", async () => {
    await renderWithProviders(
      <FiltersButton
        filters={{ categories: [], brands: [], colors: [], sizes: [], boutiques: [], prices: [], search_text: "" }}
        isChanged
        loading={false}
        total_size={42}
        isFeatured={false}
        isFlashDeal={false}
        onReset={vi.fn()}
      />,
      { path: "/filters", store: { filterEnabled: true } },
    );
    expect(placement(marked("searchResult")), "the filter button row has no room in its bottom offset").toMatch(/bottom-\[calc\(50px\+var\(--app-bar-room,0px\)\)\]/);
  });

  it("the old chat window leaves the room at the bottom of its height", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    await renderWithProviders(<Chat close={vi.fn()} open callInProgress={false} />, {
      store: { NotificationPremission: true, main: "chat", activeChat: { id: 7 }, data: [] },
    });
    expect(placement(marked("chat-window")), "the old chat window height does not leave the room").toMatch(/xs:h-\[calc\(100vh-var\(--app-bar-room,0px\)\)\]/);
  });

  it("the search filter bar adds the room to its bottom offset", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await renderWithProviders(<SearchIcon language="en" country="sy" />, {
        store: { setIsNavigating: vi.fn(), setEnableSearch: vi.fn() },
      });
      await act(async () => fireEvent.click(document.querySelector('[data-pw="searchIcon_mainPage"]')!));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1600);
      });
      const bar = screen.getByTestId("filter-bar").parentElement;
      expect(placement(bar), "the search filter bar has no room in its bottom offset").toMatch(/bottom-\[calc\(40px\+var\(--app-bar-room,0px\)\)\]/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("the rating sheet on the orders page adds the room to its bottom offset", async () => {
    await renderWithProviders(
      <RatingOrderItem
        productId={5}
        order_detail_id={50}
        isRated={false}
        initialRating={0}
        refresh={vi.fn()}
        variant="Red-M"
        owner_id={3}
        owner_type="shop"
        setShowCommentModal={vi.fn()}
        loading={false}
        setLoading={vi.fn()}
      />,
    );
    expect(placement(screen.getByRole("dialog")), "the rating sheet has no room in its bottom offset").toMatch(/bottom-\[var\(--app-bar-room,0px\)\]/);
  });

  it("the camera buttons of the photo picker add the room to their bottom offset", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { enumerateDevices: async () => [{ kind: "videoinput" }] },
    });
    function Picker() {
      const [images, setImages] = useState<string[]>([]);
      const [loading, setLoading] = useState(false);
      return (
        <UploadImageComponent
          images={images}
          setImages={setImages}
          loading={loading}
          setLoading={setLoading}
          removeImageAction={async () => {}}
          isForRating={false}
        />
      );
    }
    await renderWithProviders(<Picker />);
    fireEvent.click(screen.getByText("Add Photo"));
    fireEvent.click(screen.getByText("Camera"));
    const camera = await screen.findByTestId("webcam");
    const buttons = camera.parentElement?.querySelector(".fixed");
    expect(placement(buttons), "the camera buttons have no room in their bottom offset").toMatch(/bottom-\[calc\(20px\+var\(--app-bar-room,0px\)\)\]/);
  });

  it("the cart order button row adds the room to its bottom offset", async () => {
    await renderWithProviders(<OrderButton close={() => {}} toOrders={() => {}} />, {
      country: "sy",
      path: "/cart",
      store: {
        cart: [{ id: "row-1", product_id: 101, name: "Shirt", price: 100, offer_price: 80, quantity: 1 }],
        localCart: [{ id: 101, item_id: "row-1", quantity: 1 }],
        currency: { symbol: "$", exchange_rate: 1, decimal_digits: 2 },
        total: 80,
        total_cash: 80,
        total_discount: 0,
        total_shipping_cost: 0,
        sub_total: 80,
        orderData: null,
        cart_loading: false,
        cartShippingSuccess: null,
      },
    });
    const bottom = (marked("order-bottom-button") as HTMLElement).style.bottom;
    expect(bottom, "the cart order button row lost its 40px offset").toContain("40px");
    expect(bottom, "the cart order button row has no room in its bottom offset").toContain(ROOM);
    expect(bottom.split(ROOM).length - 1, "the cart order button row adds the room more than once").toBe(1);
  });

  it("the notifications panel stops above the bar", async () => {
    await renderWithProviders(<NotificationsPanel onClose={vi.fn()} closeWindow={vi.fn()} />, { country: "sy" });
    await waitFor(() =>
      expect(
        (marked("notification-container") as HTMLElement).style.bottom,
        "the notifications panel has no room in its bottom offset",
      ).toContain(ROOM),
    );
  });

  it("the notifications loading panel stops above the bar", async () => {
    await renderWithProviders(<NotificationSkeleton />);
    expect(
      (marked("notification-container") as HTMLElement).style.bottom,
      "the notifications skeleton has no room in its bottom offset",
    ).toContain(ROOM);
  });
});
