"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Illustration from "public/images/notifications.png";
import Image from "next/image";
import { LogError, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import home from "services/home";
interface NotificationWidgetProps {
  onAllow?: () => void;
  onDismiss?: () => void;
  className?: string;
  localStorageKey?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

export default function NotificationWidget(props: NotificationWidgetProps) {
  const {
    onAllow,
    onDismiss,
    className,
    localStorageKey = "notificationWidgetShownDate",
    position = "bottom-right",
  } = props;
  const { language, setNotificationModal } = useAppStore();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") return;
  }, [isClient]);

  const handleClose = useCallback(() => {
    setNotificationModal(false);
  }, []);

  const handleAllowClick = useCallback(async () => {
    // Check if Notification API is available
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      onAllow();
      handleClose();
      return;
    }

    try {
      // Check current permission state first
      const currentPermission = Notification.permission;

      // If already granted, just close and call callback
      if (currentPermission === "granted") {
        onAllow();
        handleClose();
        return;
      }

      // If already denied, show error message
      if (currentPermission === "denied") {
        showErrorNotification(
          translateFunction(
            "Notification is Blocked in This Browser Please Enable Notification premission and refresh",
            language,
          ),
        );
        onDismiss();
        handleClose();
        return;
      }

      // Request permission (only works if permission is "default")
      let result: NotificationPermission;
      try {
        // Edge browser compatibility: requestPermission might return a promise or a string
        const permissionResult = Notification.requestPermission();
        result =
          typeof permissionResult === "string"
            ? permissionResult
            : await permissionResult;
      } catch (error) {
        // Edge browser might throw an error if permission was already requested
        LogError({
          error: error,
          scenario: "handleAllowClick in block 1 Notification Modal",
        });
        result = Notification.permission;
      }

      if (result === "granted") {
        onAllow();
      } else if (result === "denied") {
        showErrorNotification(
          translateFunction(
            "Notification is Blocked in This Browser Please Enable Notification premission and refresh",
            language,
          ),
        );
        onDismiss();
      } else {
        // Permission is still "default" - user dismissed the prompt
        onDismiss();
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "handleAllowClick in block 2 Notification Modal",
      });

      showErrorNotification(
        translateFunction(
          "Notification is Blocked in This Browser Please Enable Notification premission and refresh",
          language,
        ),
      );
      onDismiss();
    } finally {
      handleClose();
    }
  }, [handleClose, language]);

  const handleDismissClick = useCallback(() => {
    onDismiss();
    handleClose();
  }, [handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") handleDismissClick();
    },
    [handleDismissClick],
  );

  if (!isClient) return null;

  const positionClasses =
    position === "bottom-right"
      ? "right-4 sm:right-6"
      : position === "bottom-left"
        ? "left-4 sm:left-6"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      role="dialog"
      aria-label="Notification permission prompt"
      aria-live="polite"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={[
        "fixed flex justify-center items-center top-0 z-9999999999 w-full backdrop-brightness-75 left-0 right-0 mx-auto h-dvh",
        "pointer-events-auto",
      ].join(" ")}
    >
      <div
        className={[
          "group w-[min(92vw,28rem)] sm:w-md regular",
          "rounded-2xl bg-white",
          "shadow-xl ring-1 ring-black/5",
          "border border-zinc-100",
          "px-4 py-4 sm:px-5 sm:py-5",
          "transition-all duration-300",

          className || "",
        ].join(" ")}
      >
        <div className="flex-col items-start gap-4">
          <Image
            src={Illustration.src}
            width={300}
            height={350}
            alt="Illustration"
            quality={100}
          />
          <div className="flex-1">
            <h3 className="text-zinc-900 text-base font-semibold tracking-tight">
              {translateFunction("Stay in the loop", language)}
            </h3>
            <p className="mt-1 text-sm text-zinc-700">
              {translateFunction(
                "Enable notifications for a more effortless shopping experience:",
                language,
              )}
            </p>
            <ul className="mt-2 text-sm text-zinc-700 list-disc pl-5 space-y-1">
              <li>{translateFunction("Chat messages", language)}</li>
              <li>{translateFunction("Order updates", language)}</li>
              <li>
                {translateFunction("New boutiques & categories", language)}
              </li>
              <li>
                {translateFunction(
                  "Back-in-stock and quantity alerts",
                  language,
                )}
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleAllowClick}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-[#1d1d1d] bg-[#ff6464] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
                aria-label="Allow notifications"
              >
                {translateFunction("Allow", language)}
              </button>
              <button
                onClick={handleDismissClick}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
                aria-label="Not now"
              >
                {translateFunction("Not now", language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
