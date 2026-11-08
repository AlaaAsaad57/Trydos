"use client";

import { useCallback, useEffect, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { C, CTA, ROW, lineBox } from "components/DemoApp1/demo1Layout";
import {
  NotificationPromptSheet,
  PromptButton,
  PromptText,
} from "./NotificationPromptSheet";
import NotSupportedNotificationsWidget from "./NotSupportedNotificationsWidget";

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
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;
    const checkSupport = async () => {
      if (
        typeof window === "undefined" ||
        typeof Notification === "undefined" ||
        typeof navigator === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (isMounted) setIsSupported(false);
        return;
      }

      try {
        const { isSupported: checkFirebaseSupported } = await import(
          "firebase/messaging"
        );
        const supported = await checkFirebaseSupported();
        if (isMounted) setIsSupported(supported);
      } catch (err) {
        if (isMounted) setIsSupported(false);
      }
    };

    checkSupport();

    return () => {
      isMounted = false;
    };
  }, [isClient]);

  const handleClose = useCallback(() => {
    setNotificationModal(false);
  }, [setNotificationModal]);

  const handleAllowClick = useCallback(async () => {
    // Check if Notification API is available
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      onAllow?.();
      handleClose();
      return;
    }

    try {
      // Check current permission state first
      const currentPermission = Notification.permission;

      // If already granted, just close and call callback
      if (currentPermission === "granted") {
        onAllow?.();
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
        onDismiss?.();
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
        onAllow?.();
      } else if (result === "denied") {
        showErrorNotification(
          translateFunction(
            "Notification is Blocked in This Browser Please Enable Notification premission and refresh",
            language,
          ),
        );
        onDismiss?.();
      } else {
        // Permission is still "default" - user dismissed the prompt
        onDismiss?.();
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
      onDismiss?.();
    } finally {
      handleClose();
    }
  }, [handleClose, language, onAllow, onDismiss]);

  const handleDismissClick = useCallback(() => {
    onDismiss?.();
    handleClose();
  }, [handleClose, onDismiss]);

  if (!isClient || isSupported === null) return null;

  if (!isSupported) {
    return (
      <NotSupportedNotificationsWidget
        onDismiss={onDismiss}
        className={className}
      />
    );
  }

  return (
    <NotificationPromptSheet
      label="Notification permission prompt"
      title={translateFunction("Stay in the loop", language)}
      height={580}
      onClose={handleDismissClick}
      className={className}
      testId="notification-permission-widget"
    >
      <PromptText>
        {translateFunction(
          "Enable notifications for a more effortless shopping experience:",
          language,
        )}
      </PromptText>
      <ul
        className="regular shrink-0 list-disc"
        style={{
          marginTop: 14,
          marginInline: CTA.x,
          paddingBlock: 12,
          paddingInline: "30px 12px",
          borderRadius: ROW.radius,
          background: C.card,
          fontSize: 14,
          lineHeight: `${lineBox(14)}px`,
          color: C.ink,
        }}
      >
        <li>{translateFunction("Chat messages", language)}</li>
        <li>{translateFunction("Order updates", language)}</li>
        <li>{translateFunction("New boutiques & categories", language)}</li>
        <li>
          {translateFunction("Back-in-stock and quantity alerts", language)}
        </li>
      </ul>
      <PromptButton
        primary
        mt={20}
        label={translateFunction("Allow", language)}
        ariaLabel="Allow notifications"
        onClick={handleAllowClick}
      />
      <PromptButton
        mt={8}
        label={translateFunction("Not now", language)}
        ariaLabel="Not now"
        onClick={handleDismissClick}
      />
    </NotificationPromptSheet>
  );
}
