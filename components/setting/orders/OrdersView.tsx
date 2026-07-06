"use client";
import { useState } from "react";
import BackBar from "components/setting/BackBar";
import OrdersListWrapper from "./OrdersListWrapper";
import HiddenOrdersWidget from "./HiddenOrdersWidget";
import OrdersOptionsMenu from "./OrdersOptionsMenu";
import { translateFunction } from "utils/functions";

// Owns the order-list screen and the in-place swap to the Hidden-Orders view.
// The swap keeps the same URL (no navigation): the "three dots" on the list's
// back bar opens a sheet whose single action flips `view` to "hidden"; the
// Hidden view's back arrow flips it straight back to "list".
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
          // Intercept back: return to the list view in place instead of routing.
          onBackIntercept={() => {
            setView("list");
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
          onOpenHidden={() => {
            setMenuOpen(false);
            setView("hidden");
          }}
        />
      )}
    </div>
  );
}

export default OrdersView;
