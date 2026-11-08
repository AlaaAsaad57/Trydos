"use client";

import { useCallback } from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import {
  NotificationPromptSheet,
  PromptButton,
  PromptText,
} from "./NotificationPromptSheet";

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

  return (
    <NotificationPromptSheet
      label="Notifications not supported prompt"
      title={translateFunction("Notifications Not Supported", language)}
      height={460}
      onClose={handleClose}
      className={className}
    >
      <PromptText>
        {translateFunction(
          "Push notifications are not supported by your current browser or mode. To access features that depend on notifications, such as order updates and live chat, please switch to a supported browser like Chrome, Edge, or Safari.",
          language,
        )}
      </PromptText>
      <PromptButton
        primary
        mt={20}
        label={translateFunction("Got it", language)}
        ariaLabel="Close"
        onClick={handleClose}
      />
    </NotificationPromptSheet>
  );
}
