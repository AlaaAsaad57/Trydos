"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { SlideWidget } from "components/global/SlideNavigation";
import { tabHref } from "components/DemoApp1/appRoutes";
import CartSkeleton from "components/skeleton/CartSkeleton";
import OrdersPageSkeleton from "components/skeleton/OrdersPageSkeleton";
import { useAppStore } from "store";
import { GA_GLOBAL_SCREEN, GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { ORDER_EVENTS, startOrderAttempt, trackOrder } from "utils/orderFunnel";

const CartContainer = dynamic(() => import("."), {
  ssr: false,
  loading: () => <CartSkeleton />,
});
const OrdersPage = dynamic(() => import("./OrdersPage"), {
  ssr: false,
  loading: () => <OrdersPageSkeleton />,
});

// The cart page is /[lang]/cart: the part after the locale is "cart".
export const isCartPath = (pathname: string) =>
  pathname.split("/").filter(Boolean)[1] === "cart";

// Set once this tab has shown a page of this site that is not the cart page.
// sessionStorage belongs to one tab and lives through a reload, as the tab's
// history does. The `last_paths` cookie (utils/history.ts) is not used here:
// it lives 30 days and is shared by every tab, so a cart page opened in a new
// tab (a push notice) would find old paths, go back, and go nowhere.
const SITE_PAGE_KEY = "cart_site_page_behind";

/** CartProvider calls this for every page it sees. */
export function noteSitePage(pathname: string) {
  if (!pathname || isCartPath(pathname)) return;
  try {
    sessionStorage.setItem(SITE_PAGE_KEY, "1");
  } catch {
    // Storage can be turned off. Then the cart page closes to home.
  }
}

function hasSitePageBehind() {
  try {
    return sessionStorage.getItem(SITE_PAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The two steps the cart drawer had: the cart, then checkout (`OrdersPage`).
 * The checkout events fire here, the same as in the drawer. On the page it is
 * a box in the page, not a fixed drawer over it, and it puts no `?cart` in the
 * address.
 */
export function CartSteps({ layout }: { layout: "page" }) {
  const [step, setStep] = useState(0);
  const enableCart = useAppStore((s) => s.enableCart);
  const disableAddToCartOption = useAppStore((s) => s.disableAddToCartOption);

  const handleToOrders = () => {
    // Click-handler-only reads — no subscription needed.
    const { cart, total_cash } = useAppStore.getState();
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.CHECKOUT_SCREEN,
        screen_path: window.location.pathname,
      },
    });
    GAevent({
      action: GA_EVENT_NAMES.BEGIN_CHECKOUT,
      params: {
        value: total_cash,
        items: cart.map((item) => ({
          item_id: item.product_id,
          item_name: item.name,
          price: item.offer_price,
          quantity: item.quantity,
          item_variant: item.variant ?? "N/A",
        })),
      },
    });
    // Funnel anchor: mint the attempt id BEFORE the begin_checkout event so it
    // carries the correlation id, then every later step shares it.
    startOrderAttempt();
    trackOrder(ORDER_EVENTS.BEGIN_CHECKOUT, {
      value: total_cash,
      item_count: cart.length,
    });
    setStep(1);
  };

  const handleBackToCart = () => {
    setStep(0);
  };

  // Closing goes through the store, as before. CartPage sees the flag go
  // false and leaves the page.
  const handleClose = () => {
    disableAddToCartOption();
    enableCart(false);
  };

  return (
    <div data-pw={`cart-${layout}`} className="relative w-full h-screen bg-[#fafafa]">
      <SlideWidget step={step} duration={400}>
        <div className="w-full h-full cart-widget">
          <CartContainer toOrders={handleToOrders} close={handleClose} />
        </div>
        <div className="w-full h-full cart-widget">
          <OrdersPage setStep={handleBackToCart} close={handleClose} />
        </div>
      </SlideWidget>
    </div>
  );
}

/**
 * The cart page /[lang]/cart (Stage 3, D-18 / S3-7).
 *
 * `cart_enable` is true while this page is on screen. Every old caller still
 * closes the cart with `enableCart(false)`: the back arrow, a finished order,
 * a product link. When the flag goes false here, the page leaves: back to the
 * page before it when this tab has shown a page of this site, else to home.
 */
export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  const open = useAppStore((s) => s.cart_enable);
  // True once the flag was true while the page is on screen, so the false
  // before the mount effect runs is not read as a close.
  const wasOpen = useRef(false);

  useEffect(() => {
    useAppStore.getState().enableCart(true);
    return () => {
      // The page is going. The flag follows it, and the reaction below is
      // already gone, so this does not leave a second time.
      useAppStore.getState().enableCart(false);
    };
  }, []);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    // A link is moving the shopper on (a product card in the cart, the "Back
    // To HomePage" link after an order). It sets isNavigating before it closes
    // the cart. Leaving as well would fight that move.
    if (useAppStore.getState().isNavigating) return;
    if (hasSitePageBehind()) router.back();
    else router.replace(tabHref(locale, "home"));
  }, [open]);

  return <CartSteps layout="page" />;
}
