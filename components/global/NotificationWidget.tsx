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
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
interface NotificationWidgetProps {
  onAllow?: () => void;
  onDismiss?: () => void;
  className?: string;
  localStorageKey?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

const TODAY_KEY_FORMAT = "yyyy-mm-dd";

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function NotificationWidget(props: NotificationWidgetProps) {
  const {
    onAllow,
    onDismiss,
    className,
    localStorageKey = "notificationWidgetShownDate",
    position = "bottom-right",
  } = props;
  const { language } = useAppStore();
  const allowCallbackRef = useRef(onAllow);
  const dismissCallbackRef = useRef(onDismiss);
  useEffect(() => {
    allowCallbackRef.current = onAllow;
    dismissCallbackRef.current = onDismiss;
  }, [onAllow, onDismiss]);

  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const isNotificationGranted = useMemo(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return false;
    }
    return Notification.permission === "granted";
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") return;

    try {
      const lastShown = localStorage.getItem(localStorageKey);
      const today = formatDate(new Date());
      if (lastShown === today) return;
    } catch {}

    const timer = setTimeout(() => {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    }, 3000);

    return () => clearTimeout(timer);
  }, [isClient, localStorageKey]);

  const setShownToday = useCallback(() => {
    try {
      localStorage.setItem(localStorageKey, formatDate(new Date()));
    } catch {}
  }, [localStorageKey]);
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setShouldRender(false), 250);
  }, []);

  const handleAllowClick = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setShownToday();
      allowCallbackRef.current && allowCallbackRef.current();
      handleClose();
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setShownToday();
      if (result === "granted") {
        allowCallbackRef.current && allowCallbackRef.current();
      } else {
        showErrorNotification(
          translateFunction(
            "Notification is Blocked in This Browser Please Enable Notification premission and refresh"
          )
        );
        dismissCallbackRef.current && dismissCallbackRef.current();
      }
    } finally {
      handleClose();
    }
  }, [handleClose, setShownToday]);

  const handleDismissClick = useCallback(() => {
    setShownToday();
    dismissCallbackRef.current && dismissCallbackRef.current();
    handleClose();
  }, [handleClose, setShownToday]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") handleDismissClick();
    },
    [handleDismissClick]
  );

  if (!isClient) return null;
  if (isNotificationGranted) return null;
  if (!shouldRender) return null;

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
        "fixed flex justify-center items-center top-0 z-[9999999999] w-full backdrop-brightness-75 left-0 right-0 mx-auto h-[100dvh]",
        "pointer-events-auto",
      ].join(" ")}
    >
      <div
        className={[
          "group w-[min(92vw,28rem)] sm:w-[28rem] regular",
          "rounded-2xl bg-white",
          "shadow-xl ring-1 ring-black/5",
          "border border-zinc-100",
          "px-4 py-4 sm:px-5 sm:py-5",
          "transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
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
                language
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
                  language
                )}
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleAllowClick}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-[#1d1d1d] bg-[#ff6464] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
                aria-label="Allow notifications"
              >
                {translateFunction("Allow", language)}
              </button>
              <button
                onClick={handleDismissClick}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
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
