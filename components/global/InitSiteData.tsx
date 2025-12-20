"use client";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import HomeService from "services/home";
import PopupCountry from "utils/PopupCountry";
import home from "services/home";
import { DetectScreen, EnableScroll, getReferralSource } from "utils/tinyUtils";

import Smartlook from "smartlook-client";

import { expandView, normalizeView, translateFunction } from "utils/functions";
import { showErrorNotification } from "@/store/notifications/reducer";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import NotificationWidget from "components/global/NotificationWidget";
import { useAppStore } from "store";
import InitFunction from "components/Home/InitFunction";
import AuthSections from "components/Home/AuthSections";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";
import StoriesContainer from "components/Home/Stories/NewStories";
import AddToCartComponent from "components/Cart/AddToCart/AddToCartComponent";
import { StepSlider } from "components/Cart/CartProvider";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import auth from "services/auth";
import { useInitWorker } from "utils/workers/useInitWorker";

function InitSiteData() {
  const { lang } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const {
    isNotificationModal,
    setNotificationModal,
    shouldAuthinticated,
    setSelectedProductForCart,
    selectedStory,
    cart_enable: enable,
    selected_product_for_add_to_cart,
    disableAddToCartOption,
    enableCart,
    setCurrency,
    setSelectedStory,
    setLoginOpen,
    setChatOpen,
    setEnableSearch,
    filterEnabled,
    setAddStory,
  } = useAppStore();
  // @ts-ignore
  const [country, language] = lang?.split("-");
  const searchParams = useSearchParams();
  const [dataCountries, setCountriesData] = useState([]);
  const [workerInitialized, setWorkerInitialized] = useState(false);

  // Initialize the Web Worker with callbacks
  const worker = useInitWorker({
    onCountriesResult: useCallback(
      (countries: any[]) => {
        setCountriesData(countries);
        // Also store in sessionStorage for consistency
        if (country && language) {
          sessionStorage.setItem(
            `countries-${country}-${language}`,
            JSON.stringify(countries)
          );
        }
      },
      [country, language]
    ),

    onCurrencyResult: useCallback(
      (currency: any) => {
        if (currency) {
          setCurrency(currency);
        }
      },
      [setCurrency]
    ),

    onLoginCheckResult: useCallback((result: any) => {
      // Login check is now handled by the worker, but we still call
      // HomeService for side effects like cookie management
      if (result.success) {
        HomeService.CheckLogin();
      }
    }, []),

    onClientDataResult: useCallback((data: any) => {
      // Client data received from worker
      console.log("Client data loaded:", data);
    }, []),

    onError: useCallback((error: string, type: string) => {
      console.error(`Worker error (${type}):`, error);
    }, []),
  });

  // Check if we need to fetch countries based on session storage
  const getCountriesIfNeeded = useCallback(() => {
    if (!country || !language) return;

    // Check sessionStorage first (fast, synchronous check)
    const cached = sessionStorage.getItem(`countries-${country}-${language}`);
    if (cached) {
      try {
        setCountriesData(JSON.parse(cached));
      } catch (error) {
        console.error("Failed to parse cached countries:", error);
        // Fallback to worker fetch
        worker.fetchCountries(country, language);
      }
    } else {
      // Not in cache, fetch via worker
      worker.fetchCountries(country, language);
    }
  }, [country, language, worker]);

  // Initialize login check once (offloaded to worker)
  useEffect(() => {
    if (worker.isReady && !workerInitialized) {
      setWorkerInitialized(true);
      worker.checkLogin();
    }
  }, [worker.isReady, workerInitialized, worker]);

  const shouldShowBluredInfo = useCallback(() => {
    // Check if we need to show country popup
    const needsCountrySelection =
      lang?.includes("gb-") ||
      searchParams.get("changed-country") ||
      searchParams.get("no-country");

    if (needsCountrySelection) {
      // Clean up cart parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cart");

      if (
        typeof window !== "undefined" &&
        params.toString() !== searchParams.toString()
      ) {
        window.history.replaceState(
          {},
          "",
          params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname
        );
      }
      return true;
    }

    // Clean up navigation parameters if they exist
    const hasNavigationParams =
      searchParams.get("_bypass") || searchParams.get("_t");
    if (hasNavigationParams && typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("_bypass");
      params.delete("_t");

      window.history.replaceState(
        {},
        "",
        params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname
      );
    }

    return false;
  }, [lang, searchParams]);

  // Fetch countries when needed
  useEffect(() => {
    if (shouldShowBluredInfo()) {
      getCountriesIfNeeded();
    }
  }, [shouldShowBluredInfo, getCountriesIfNeeded]);

  // Smartlook initialization and cookie check (keeping synchronous for immediate execution)
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.cookieEnabled) {
      showErrorNotification(translateFunction("Cookies Is Not Enabled"));
    }

    try {
      if (process.env.NODE_ENV === "production") {
        Smartlook.init(process.env.NEXT_PUBLIC_SMARTLOOK_KEY);
      }
      const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);

      if (user) {
        if (process.env.NODE_ENV === "production") {
          Smartlook.identify(user.id, {
            name: user?.name || "Guest",
            phone: user?.mobilePhone || "null",
            // other custom properties
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  // Notification initialization (async work deferred)
  const initPageLoad = useCallback(async () => {
    const permission = Notification.permission;

    if (permission !== "granted") {
      return null;
    }

    if (!shouldShowBluredInfo() && Notification.permission === "granted") {
      const handlePageRefresh = async () => {
        try {
          await home.AllowNotifications();
        } catch (error) {
          console.error("Error handling topics on page refresh:", error);
        }
      };

      handlePageRefresh(); // Run the function on initial load
    }
  }, [shouldShowBluredInfo]);

  useEffect(() => {
    if (typeof Notification !== "undefined") initPageLoad();
  }, [initPageLoad]); // Runs once when the app initializes
  const onAllow = useCallback(async () => {
    try {
      await home.AllowNotifications();
    } catch (error) {
      console.error("Error allowing notifications:", error);
    }
  }, []);

  const onDismiss = useCallback(() => {
    setNotificationModal(false);
  }, [setNotificationModal]);

  const enableCartAction = useCallback(
    (s) => {
      disableAddToCartOption();
      enableCart(s);
    },
    [disableAddToCartOption, enableCart]
  );

  // Main initialization effect - offload heavy work to worker
  useEffect(() => {
    // Quick timeout to allow hydration to complete first
    const timer = setTimeout(() => {
      if (
        !searchParams.get("changed-country") &&
        !searchParams.get("no-country")
      ) {
        // Offload to worker for client data
        if (worker.isReady) {
          worker.getClientData();
          worker.getCurrency(
            country,
            language,
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/home/currency`
          );
        }
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [searchParams, worker]);

  // Event listeners (keeping on main thread as they require DOM access)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.isPopup) {
        let params = new URLSearchParams(searchParams);
        params.delete("cart");
        params.delete("modal");
        params.delete("story");
        params.delete("search");
        // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
        router.push(`${pathname}?${params.toString()}`, { shallow: true });
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

    const handleScroll = () => {
      if (!filterEnabled) {
        if (window.scrollY > 80) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    searchParams,
    pathname,
    router,
    filterEnabled,
    setSelectedStory,
    enableCart,
    setLoginOpen,
    setChatOpen,
    setEnableSearch,
    setSelectedProductForCart,
    setAddStory,
  ]);

  // Cart and coupon handling (deferred with timeout to not block hydration)
  useEffect(() => {
    // Open cart if cart parameter is present
    if (searchParams.get("cart")) {
      enableCartAction(true);
    }

    const couponUrlVar = searchParams.get("coupon");
    const selectedUrlVar = searchParams.get("selected");

    // Defer GA events and parameter cleanup
    const timer = setTimeout(() => {
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

    return () => clearTimeout(timer);
  }, [searchParams, pathname, router, enableCartAction]);

  return (
    <>
      {shouldShowBluredInfo() && (
        <PopupCountry
          forChanged={searchParams.get("changed-country")}
          noCountry={searchParams.get("no-country") || lang?.includes("gb-")}
          countries={dataCountries.map((s) => s.iso)}
          options={dataCountries.map((s) => {
            return { label: s.name, value: s.iso };
          })}
        />
      )}
      {isNotificationModal && (
        <NotificationWidget
          onAllow={onAllow}
          onDismiss={() => {
            onDismiss();
          }}
        />
      )}
      <InitFunction init={lang} />

      <AuthSections />
      {shouldAuthinticated && <ConfirmMobilePhoneWidget />}
      {selectedStory?.id && <StoriesContainer selectedStory={selectedStory} />}
      {enable ? <StepSlider enableCart={(e) => enableCartAction(e)} /> : <></>}
      {selected_product_for_add_to_cart && (
        <AddToCartComponent
          enableCartAction={enableCartAction}
          close={() => {
            setSelectedProductForCart(null);
          }}
          product={selected_product_for_add_to_cart}
          slug={selected_product_for_add_to_cart?.slug}
        />
      )}
    </>
  );
}

export default InitSiteData;
