"use client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { SlideWidget } from "components/global/SlideNavigation";
import { tabHref } from "components/DemoApp1/appRoutes";
import CartSkeleton from "components/skeleton/CartSkeleton";
import OrdersPageSkeleton from "components/skeleton/OrdersPageSkeleton";
import { useAppStore } from "store";
import { hasSitePageBehind, isCartPath } from "./cartPath";
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

/**
 * The two steps the cart drawer had: the cart, then checkout (`OrdersPage`).
 * The checkout events fire here, the same as in the drawer. On the page it is
 * a box in the page, not a fixed drawer over it, and it puts no `?cart` in the
 * address.
 */
export function CartSteps({ layout }: { layout: "page" }) {
  const [step, setStep] = useState(0);
  const box = useRef<HTMLDivElement>(null);
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

  // The box runs from its own top to the bottom of the screen. Until Task 9
  // the old sticky top nav sits above it; after that the box starts at 0. The
  // checkout bar (OrderButton) is `fixed`, but the slide layer's translate
  // makes the layer its containing block, so it is placed from the box
  // bottom. OrderButton already adds --app-bar-room, so the box must end at
  // the screen bottom, not at the top of the new bar: that would count the
  // room twice. The height is set with "important" because Tailwind
  // utilities win over inline styles here.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.setProperty("height", `calc(100dvh - ${top}px)`, "important");
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div ref={box} data-pw={`cart-${layout}`} className="relative w-full h-dvh bg-[#fafafa]">
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
 *
 * The page acts only while the path is the cart path. A product link from the
 * cart opens the product overlay (@modal/(.)products/[productId]); the cart
 * page is the `children` slot under it, so it stays mounted, only hidden.
 * While hidden it holds the flag false and ignores it. When the path comes
 * back to the cart (the overlay closes), it sets the flag true again.
 */
export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  const pathname = usePathname();
  const onCart = isCartPath(pathname);
  const open = useAppStore((s) => s.cart_enable);
  // True once the flag was true while the page is on screen, so the false
  // before the mount effect runs is not read as a close.
  const wasOpen = useRef(false);

  useEffect(() => {
    useAppStore.getState().enableCart(onCart);
  }, [onCart]);

  useEffect(() => {
    return () => {
      // The page is going. The flag follows it, and the reaction below is
      // already gone, so this does not leave a second time.
      useAppStore.getState().enableCart(false);
    };
  }, []);

  useEffect(() => {
    if (!onCart) {
      wasOpen.current = false;
      return;
    }
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
