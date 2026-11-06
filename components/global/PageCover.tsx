"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import ScreenSkeleton from "components/DemoApp1/ScreenSkeleton";
import { appScreenFromPath } from "components/DemoApp1/appScreenPaths";
import { UNDER_BAR } from "components/DemoApp1/demo1Layout";
import { usePageDir } from "components/DemoApp1/rtl";
import ListingPageSkeleton from "components/Listing/ListingPageSkeleton";
import ProductPageSkeleton from "components/Product/ProductPageSkeleton";
import CartSkeleton from "components/skeleton/CartSkeleton";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import SellerDashboardLoader, {
  FormSkeleton,
} from "components/skeleton/loaders/SellerDashboardLoader";
import { pageKindFor } from "components/skeleton/pageKinds";
import {
  ChecklistSkeleton,
  ChoicesSkeleton,
  LoginSkeleton,
  NotificationsSkeleton,
  OrderSkeleton,
  OrdersSkeleton,
  SearchSkeleton,
  SellerShopsSkeleton,
  TextPageSkeleton,
} from "components/skeleton/pageShapes";
import { hidePageCover, showPageCover, usePageCover } from "./pageCoverState";

/** A tap that never arrives must not hold the skeleton for ever. */
const MAX_COVER_MS = 10000;
/** Over the page and its old header. Under the bar and the top strip. */
const COVER_Z = 2147481000;

function Shape({ path }: { path: string }): ReactNode {
  const screen = appScreenFromPath(path);
  if (screen) return <ScreenSkeleton screen={screen} />;
  switch (pageKindFor(path)) {
    case "home":
      return <FullHomeLoader />;
    case "listing":
      return <ListingPageSkeleton />;
    case "product":
      return <ProductPageSkeleton />;
    case "search":
      return <SearchSkeleton />;
    case "cart":
      return <CartSkeleton />;
    case "compare":
      return <CompareSkeleton />;
    case "login":
      return <LoginSkeleton />;
    case "text":
      return <TextPageSkeleton />;
    case "orders":
      return <OrdersSkeleton />;
    case "order":
      return <OrderSkeleton />;
    case "checklist":
      return <ChecklistSkeleton />;
    case "countries":
      return <ChoicesSkeleton />;
    case "languages":
      return <ChoicesSkeleton top={20} title={0} />;
    case "notifications":
      return <NotificationsSkeleton />;
    case "shops":
      return <SellerShopsSkeleton />;
    case "dashboard":
      return <SellerDashboardLoader />;
    case "editor":
      return <FormSkeleton />;
    default:
      return null;
  }
}

/**
 * The skeleton of the page a tap is going to, from the moment of the tap until
 * its address is ready. It covers the page and does not replace it, for a
 * reason: the page keeps its height, so its scroll is still right when the
 * browser saves it for Back.
 *
 * SAFARI 26: THIS BOX MUST STAY IN THE DOCUMENT. It is `absolute` on <body>,
 * at the place the page is scrolled to, as `Layer` in DemoApp1/ui.tsx. Never
 * make it `fixed` or `sticky`, and never put `overflow: hidden` on <html>:
 *  - a fixed box this wide at the bottom edge makes Safari paint a solid block
 *    under its glass bar, and one moment is enough (see EDGE_ANCHOR);
 *  - a fixed box the size of the screen at the top edge makes Safari keep the
 *    old top colour (see DemoApp/topTint.ts);
 *  - Safari draws only document content under its bar, so a fixed box would
 *    end at the window's end. This one runs on under the bar (UNDER_BAR).
 * It stays under the bar and under the top strip, and does nothing on /demo.
 */
export default function PageCover() {
  const path = usePageCover();
  const pathname = usePathname();
  const dir = usePageDir();
  const box = useRef<HTMLDivElement>(null);

  // Every link of the app. React's own listener is on the document too and
  // came first, so `defaultPrevented` says the router took this click, and a
  // card's own loader is already in the store.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!e.defaultPrevented || e.button !== 0) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;
      showPageCover(link.href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The address changed: the page is here. Two frames, because a new screen
  // comes one render after the address (the URL effect in AppScreens).
  const seen = useRef(pathname);
  useEffect(() => {
    if (seen.current === pathname) return;
    seen.current = pathname;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(hidePageCover);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!path) return;
    const id = setTimeout(hidePageCover, MAX_COVER_MS);
    window.addEventListener("pageshow", hidePageCover);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pageshow", hidePageCover);
    };
  }, [path]);

  // The page is not held still, so the cover follows it if a finger moves it.
  useLayoutEffect(() => {
    if (!path) return;
    const follow = () => {
      if (box.current) box.current.style.top = `${window.scrollY}px`;
    };
    follow();
    window.addEventListener("scroll", follow, { passive: true });
    return () => window.removeEventListener("scroll", follow);
  }, [path]);

  if (!path) return null;
  return createPortal(
    <div
      ref={box}
      data-pw="page-cover"
      dir={dir}
      aria-busy="true"
      className="page-cover overflow-hidden bg-white"
      style={{
        position: "absolute",
        insetInline: 0,
        top: window.scrollY,
        // Only a touch device has the bar. With a mouse the tail would make
        // a short page scroll, and the page would move sideways.
        height:
          window.innerHeight + (navigator.maxTouchPoints > 0 ? UNDER_BAR : 0),
        zIndex: COVER_Z,
      }}
    >
      <Shape path={path} />
    </div>,
    document.body,
  );
}
