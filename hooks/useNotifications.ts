import { useEffect, useCallback } from "react";
import { foregroundNotificationHandler } from "utils/NotificationHandler";

interface UseNotificationsOptions {
  onChatMessage?: (data: any) => void;
  onMarketUpdate?: (data: any) => void;
  onOrderUpdate?: (data: any) => void;
  onGenericNotification?: (data: any) => void;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  // Register notification handlers

  // Utility function to trigger test notification

  return {
    notificationHandler: foregroundNotificationHandler,
  };
};
