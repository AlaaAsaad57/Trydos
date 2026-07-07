"use client";
import { useEffect, useState } from "react";
import BackBar from "components/setting/BackBar";
import OrdersListWrapper from "./OrdersListWrapper";
import HiddenOrdersWidget from "./HiddenOrdersWidget";
import OrdersOptionsMenu from "./OrdersOptionsMenu";
import { translateFunction } from "utils/functions";

// Owns the order-list screen and the in-place swap to the Hidden-Orders view.
// Opening the Hidden view pushes a `?view=hidden` entry via the History API
// (no route navigation, so no RSC refetch); the browser back button — and the
// in-place back arrow, which just calls history.back() — pop that entry and
// `popstate` flips the view back to the list.
function OrdersView({
  isRtl,
  language,
  local,
  order_group_statuses,
}: {
  isRtl: boolean;
  language: string;
  local: string;
  order_group_statuses: any;
}) {
  const [view, setView] = useState<"list" | "hidden">("list");
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the view in sync with the `?view=hidden` search key so the browser
  // back button returns to the list. Runs on mount (covers a reload while the
  // Hidden view is open) and on every history pop.
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setView(params.get("view") === "hidden" ? "hidden" : "list");
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const openHidden = () => {
    setMenuOpen(false);
    setView("hidden");
    window.history.pushState(
      { hiddenOrders: true },
      "",
      `${window.location.pathname}?view=hidden`,
    );
  };

  // Pop the pushed entry; `popstate` resets both the view and the URL.
  const closeHidden = () => window.history.back();

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen max-h-full"
      key="orders-setting-page"
    >
      {view === "list" ? (
        <BackBar
          isRtl={isRtl}
          local={local}
          DataCy="order-list-screen"
          preivous_page={`/${local}/settings`}
          options={() => setMenuOpen(true)}
        />
      ) : (
        <BackBar
          isRtl={isRtl}
          local={local}
          DataCy="hidden-orders-screen"
          name={translateFunction("Hidden Orders", language)}
          Icon={"/icons/EyeIcon.svg"}
          // Intercept back: pop the `?view=hidden` entry instead of routing.
          onBackIntercept={() => {
            closeHidden();
            return true;
          }}
        />
      )}

      {view === "list" ? (
        <OrdersListWrapper
          isRtl={isRtl}
          language={language}
          local={local}
          order_group_statuses={order_group_statuses}
        />
      ) : (
        <HiddenOrdersWidget isRtl={isRtl} />
      )}

      {menuOpen && (
        <OrdersOptionsMenu
          isRtl={isRtl}
          language={language}
          close={() => setMenuOpen(false)}
          onOpenHidden={openHidden}
        />
      )}
    </div>
  );
}

export default OrdersView;
