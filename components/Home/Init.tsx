"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import HomeService from "services/home";
import PopupCountry from "utils/PopupCountry";
import home from "services/home";

import { LogError, translateFunction } from "utils/functions";
import { installGlobalErrorListeners } from "utils/globalErrorListeners";
import { posthogInit, posthogIdentify } from "utils/posthog";
import { showErrorNotification } from "@/store/notifications/reducer";
import NotificationWidget from "components/global/NotificationWidget";
import { useAppStore } from "store";
import { GetCountries } from "serverRequests/product";
import auth from "services/auth";

function Init() {
  const { lang } = useParams();
  const router = useRouter();
  const isNotificationModal = useAppStore((s) => s.isNotificationModal);
  const setNotificationModal = useAppStore((s) => s.setNotificationModal);
  // Reactive user id so the posthog/FCM effect re-runs on login/logout.
  // Previously this relied on the whole-store subscription re-rendering Init
  // so the `auth.UserID()` in the dep array got re-evaluated.
  const userId = useAppStore((s) => s.userProfile?.id || s.user?.id);
  // @ts-ignore
  const [country, language] = lang?.split("-");
  const searchParams = useSearchParams();
  const [dataCountries, setCountriesData] = useState([]);

  // Initialize login check once. CheckLogin's proactive refresh returns true
  // when it rotated an expired session's token pair — server components were
  // rendered with the dead token, so refetch them with the fresh one
  // (self-heal for expired-session page loads; ticket go-refresh-token).
  useEffect(() => {
    void (async () => {
      const sessionRefreshed = await HomeService.CheckLogin();
      if (sessionRefreshed) router.refresh();
    })();
  }, []);

  // Capture uncaught client errors / promise rejections so they reach both
  // Sentry and the backend mobile_error_log (and become simulatable). Idempotent.
  useEffect(() => {
    installGlobalErrorListeners();
  }, []);

  const getCountries = async () => {
    if (sessionStorage.getItem(`countries-${country}-${language}`)) {
      const data = sessionStorage.getItem(`countries-${country}-${language}`);
      setCountriesData(JSON.parse(data));
    } else {
      try {
        const data = await GetCountries({ country, language });
        sessionStorage.setItem(
          `countries-${country}-${language}`,
          JSON.stringify(data),
        );
        setCountriesData(data);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    }
  };

  const shouldShowBluredInfo = () => {
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
            : window.location.pathname,
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
          : window.location.pathname,
      );
    }

    return false;
  };

  useEffect(() => {
    if (shouldShowBluredInfo()) {
      getCountries();
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.cookieEnabled) {
      showErrorNotification(translateFunction("Cookies Is Not Enabled"));
    }

    try {
      // Start the session recorder for EVERY visitor (guests included) —
      // session-replay is meant to capture all traffic, not just logged-in
      // users. init() guards against re-entry, so re-running it on auth
      // changes is safe.
      // Must await: posthogIdentify no-ops until init() has finished
      // (it guards on _inited). For an already-logged-in user this effect
      // runs init + identify back-to-back, so without awaiting, identify
      // fires before init completes and the user stays an anonymous uuid.
      void (async () => {
        await posthogInit(process.env.NEXT_PUBLIC_POSTHOG_KEY);

        if (auth.UserID()) {
          if (typeof Notification !== "undefined") initPageLoad();

          const user = useAppStore.getState().userProfile;

          if (user) {
            posthogIdentify(user.id, {
              name: user?.name || "Guest",
              phone: user?.mobilePhone || "null",
            });
          }
        }
      })();
    } catch (error) {
      LogError({
        error: error,
        scenario: "Init PostHog in Init",
      });
    }
  }, [userId]);
  const initPageLoad = async () => {
    const permission = Notification.permission;

    if (permission !== "granted") {
      return null;
    }

    if (!shouldShowBluredInfo() && Notification.permission === "granted") {
      const handlePageRefresh = async () => {
        try {
          await home.AllowNotifications();
        } catch (error) {
          LogError({
            error: error,
            scenario: "initPageLoad in Init",
          });
        }
      };
      handlePageRefresh(); // Run the function on initial load
    }
  };
  // Runs once when the app initializes
  const onAllow = async () => {
    try {
      await home.AllowNotifications();
    } catch (error) {
      LogError({
        error: error,
        scenario: "onAllow in Init",
      });
    }
  };
  const onDismiss = () => {
    setNotificationModal(false);
  };
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
      {/* <AppProgressBar
        color="#f53d3d"
        height="4px"
        options={{ showSpinner: false }}
      /> */}
    </>
  );
}

export default Init;
