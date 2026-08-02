"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import Illustration from "public/images/notifications.png";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";

interface NotSupportedNotificationsWidgetProps {
  onDismiss?: () => void;
  className?: string;
}

export default function NotSupportedNotificationsWidget(
  props: NotSupportedNotificationsWidgetProps,
) {
  const { onDismiss, className } = props;
  const { language, setNotificationModal } = useAppStore();

  const handleClose = useCallback(() => {
    setNotificationModal(false);
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss, setNotificationModal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  return (
    <div
      role="dialog"
      aria-label="Notifications not supported prompt"
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
              {translateFunction("Notifications Not Supported", language)}
            </h3>
            <p className="mt-2 text-sm text-zinc-700 leading-relaxed">
              {translateFunction(
                "Push notifications are not supported by your current browser or mode. To access features that depend on notifications, such as order updates and live chat, please switch to a supported browser like Chrome, Edge, or Safari.",
                language,
              )}
            </p>
            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition cursor-pointer"
                aria-label="Close"
              >
                {translateFunction("Got it", language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
