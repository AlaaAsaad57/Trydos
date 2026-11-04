"use client";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";

import home from "services/home";

import ModalIframe from "./ModalIframe";
import { isCartPath, noteSitePage } from "./cartPath";
import { tabHref } from "components/DemoApp1/appRoutes";
import { useAppStore } from "store";
import {
  DetectScreen,
  EnableScroll,
  getCurrency,
  getReferralSource,
} from "utils/tinyUtils";
import AddToCartComponent from "./AddToCart/AddToCartComponent";
import { GA_EVENT_NAMES } from "utils/GAEvents";

import { GAevent } from "utils/gtag";
import auth from "services/auth";
import { getCookie } from "utils/cookies/cookie-manager";
import { markBackClosing, takeSelfConsume } from "utils/popupHistory";

const CartProvider = ({ language, country }) => {
  // Per-field selectors: this component is mounted on every page and the boot
  // fetch chain writes to the store many times in the first second — a
  // whole-store subscription re-rendered it on each write. Action references
  // are stable, so selecting them never triggers a re-render.
  const enableCart = useAppStore((s) => s.enableCart);
  const disableAddToCartOption = useAppStore((s) => s.disableAddToCartOption);
  const setEnableSearch = useAppStore((s) => s.setEnableSearch);
  const setLoginOpen = useAppStore((s) => s.setLoginOpen);
  const setSelectedStory = useAppStore((s) => s.setSelectedStory);
  const setAppLanguage = useAppStore((s) => s.setAppLanguage);
  const setAppCountry = useAppStore((s) => s.setAppCountry);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const openPayIframe = useAppStore((s) => s.openPayIframe);
  const payIframeURL = useAppStore((s) => s.payIframeURL);
  const enable = useAppStore((s) => s.cart_enable);
  const selected_product_for_add_to_cart = useAppStore(
    (s) => s.selected_product_for_add_to_cart,
  );
  const setSelectedProductForCart = useAppStore(
    (s) => s.setSelectedProductForCart,
  );
  const setAddStory = useAppStore((s) => s.setAddStory);

  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  // @ts-ignore
  const searchParams = useSearchParams();
  useEffect(() => {
    setTimeout(() => {
      if (
        !searchParams.get("changed-country") &&
        !searchParams.get("no-country")
      ) {
        home.getClientData();
        getCurrency({
          callback: (data) => {
            setCurrency(data.currency);
          },
        });
      }
    }, 10);
    const handlePopState = (event: PopStateEvent) => {
      // A popup closing via React state consumes its own history entry with
      // history.back(); that lands here on the entry underneath. Leave any
      // popup still open below it alone (e.g. the cart during checkout→login).
      if (takeSelfConsume()) return;

      const storeState = useAppStore.getState();
      // The cart is not in this list: it is a page now (/[lang]/cart), and a
      // back-press leaves it as it leaves any page.
      const isAnyPopupOpen =
        storeState.loginOpen ||
        Boolean(storeState.selectedStory) ||
        Boolean(storeState.addStoryEnable) ||
        storeState.chatVar ||
        storeState.enable_search ||
        Boolean(storeState.selected_product_for_add_to_cart);

      if (event.state?.isPopup || isAnyPopupOpen) {
        // A real user back-press: tell the unmount cleanups it triggers not to
        // history.back() again.
        markBackClosing();

        // Read the LIVE location, not the pathname/searchParams captured when
        // this listener was registered. CartProvider lives in the persistent
        // layout, so the closure would otherwise always point at the page the
        // app first loaded (usually home) and yank the user there from any
        // other route (e.g. /settings) when an orphaned `isPopup` history
        // entry — pushed by a popup that was closed via React state instead of
        // history.back() — is traversed.
        const params = new URLSearchParams(window.location.search);
        const popupKeys = [
          "login",
          "modal",
          "story",
          "stories",
          "StoryModal",
          "search",
        ];
        let hasPopupKey = false;
        for (const key of popupKeys) {
          if (params.has(key)) {
            params.delete(key);
            hasPopupKey = true;
          }
        }

        if (hasPopupKey) {
          const query = params.toString();
          router.push(
            query
              ? `${window.location.pathname}?${query}`
              : window.location.pathname,
            // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
            { shallow: true },
          );
        }
        setSelectedStory(null);
        enableCart(false);
        setLoginOpen(false);
        setChatOpen(false);
        setEnableSearch(false);
        EnableScroll();
        setSelectedProductForCart(null);
        setAddStory(null);
        // @ts-ignore
        document.querySelector(`#search-element`)?.blur();
      }
    };
    window.addEventListener("popstate", handlePopState);
    setAppLanguage(language);
    setAppCountry(country);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // The cart is a page now (Stage 3, S3-7). An old `?cart` link (a push
  // notice, an old bookmark) goes there, with any value.
  const hasCartParam = searchParams.has("cart");
  useEffect(() => {
    if (!hasCartParam) return;
    disableAddToCartOption();
    router.replace(tabHref(locale, "cart"));
  }, [hasCartParam]);

  // Every caller still opens the cart with enableCart(true). On any page but
  // the cart page, that is a move to the cart page. The flag is put back at
  // once: the cart page sets it again when it is on screen, and a move that
  // is cut short must not leave it stuck, or the next open would change
  // nothing and go nowhere.
  useEffect(() => {
    if (!enable || isCartPath(pathname)) return;
    router.push(tabHref(locale, "cart"));
    enableCart(false);
  }, [enable]);

  // The cart page reads this when it closes: back when a page of this site is
  // behind it, else home. A page with ?cart is not noted: it is replaced by
  // the cart page above, so it never stays in the history (a push notice
  // opens a fresh tab on /[lang]?cart=true).
  useEffect(() => {
    if (hasCartParam) return;
    noteSitePage(pathname);
  }, [pathname, hasCartParam]);

  useEffect(() => {
    let couponUrlVar = searchParams.get("coupon");
    let selectedUrlVar = searchParams.get("selected");
    setTimeout(() => {
      if (couponUrlVar?.length > 0) {
        let reffere = getCookie("referer");
        GAevent({
          action: GA_EVENT_NAMES.COUPON_VIEWED,
          params: {
            user_id_custom: auth?.UserID(),
            coupon_id: couponUrlVar,
            coupon_code: couponUrlVar,
            screen_name: DetectScreen(),
            screen_path: window.location.pathname,
            referral_source: getReferralSource(reffere),
          },
        });
        localStorage.setItem("coupon-number", couponUrlVar);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("coupon");
        router.replace(newParams.size ? `${pathname}?${newParams}` : pathname);
      }
      if (selectedUrlVar) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("selected");
        router.replace(newParams.size ? `${pathname}?${newParams}` : pathname);
      }
    }, 1000);
  }, []);
  useEffect(() => {
    if (openPayIframe) {
      _openIframe(payIframeURL);
    }
  }, [openPayIframe, payIframeURL]);
  const [openIframe, setOpenIframe] = useState({ isShow: false, url: "" });
  const [isLoading, setIsLoading] = useState(false);
  const modalIframeRef = useRef<HTMLDivElement>(null);
  const _openIframe = (url: string) => {
    setIsLoading(true);
    setOpenIframe({ isShow: true, url: url });
  };
  const _closeIframe = () => {
    setOpenIframe({ isShow: false, url: "" });
  };
  const handleIframeLoad = () => {
    setIsLoading(false);
    // init();
  };
  const Search_Params = useSearchParams();
  return (
    <>
      {selected_product_for_add_to_cart && (
        <AddToCartComponent
          color={
            selected_product_for_add_to_cart?.active_color ??
            Search_Params?.get("color") ??
            selected_product_for_add_to_cart?.sync_color_images?.[0]
              ?.color_option ??
            selected_product_for_add_to_cart?.sync_color_images?.[0]?.color_name
          }
          product={selected_product_for_add_to_cart}
          slug={selected_product_for_add_to_cart?.slug}
        />
      )}
      {openIframe.isShow && (
        <div
          ref={modalIframeRef}
          className={` ${
            openIframe?.isShow ? "z-9999999999" : "z-0"
          } flex fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[12px] gap-[10px] p-px text-[#5D5D5D] items-center justify-start rounded-[10px] h-[90vh] w-[90vw] bg-[#FCFCFC] border border-dashed border-[#006AFF5b]`}
        >
          <ModalIframe
            _closeIframe={_closeIframe}
            handleIframeLoad={handleIframeLoad}
            isLoading={isLoading}
            openIframe={openIframe}
          />{" "}
        </div>
      )}
    </>
  );
};
export default CartProvider;
