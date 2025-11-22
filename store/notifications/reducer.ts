import { create } from "zustand";
// sad
export interface Notification {
  id: string;
  type: "success" | "error" | "chat";
  message: string;
  duration?: number;
  href?: string;
  href_type?: any;
  image?: string;
  error_code?: number;
  // Chat-specific fields
  chatData?: {
    senderName: string;
    senderPhoto?: string;
    channelId: string;
    channel?: any;
    messagePreview?: string;
    messageImage?: string;
    messageType?: string;
  };
}

export interface NotificationState {
  notifications: Notification[];
}

export interface NotificationActions {
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          duration: notification.duration || 10000,
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));

// Helper functions to show notifications
export const showSuccessNotification = (
  message: string,
  duration?: number,
  href?: string,
  href_type?: any,
  image?: string
) => {
  const { addNotification } = useNotificationStore.getState();
  addNotification({
    type: "success",
    message,
    duration,
    href,
    href_type,
    image,
  });
};

export const showErrorNotification = (
  message: string,
  duration?: number,
  href?: string,
  href_type?: any,
  error_code?: number
) => {
  const { addNotification } = useNotificationStore.getState();
  if (message?.toLowerCase()?.includes("authorized")) {
    return;
  }
  addNotification({
    type: "error",
    message,
    duration,
    href,
    error_code: error_code,
  });
};

// Helper function to show chat notifications
export const showChatNotification = (
  senderName: string,
  messagePreview: string,
  channelId: string,
  channel?: any,
  senderPhoto?: string,
  messageImage?: string,
  messageType?: string,
  duration?: number
) => {
  const { addNotification } = useNotificationStore.getState();
  addNotification({
    type: "chat",
    message: messagePreview,
    duration: 100000000000000,
    chatData: {
      senderName,
      senderPhoto,
      channelId,
      channel,
      messagePreview,
      messageImage,
      messageType,
    },
  });
};
