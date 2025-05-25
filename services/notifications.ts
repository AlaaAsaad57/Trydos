import { NotificationResponse } from "../types/notifications";
import { AxiosGet } from "utils/AxiosApi";

export const fetchNotifications = async (
  page: number,
  pageSize: number = 10
): Promise<NotificationResponse> => {
  try {
    const response = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        `/user-notifications/get?page=${page}`,
      title: "Fetch Notifications",
    });
    return response;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Fallback to mock data if API is not available
  }
};
export const getNotificationsTypes = async () => {
  try {
    const response = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        "/web/notification_types/customer-notification-to-choose",
      title: "Fetch Notifications Types",
    });
    return response;
  } catch (error) {
    console.error("Error fetching notifications Types:", error);
    // Fallback to mock data if API is not available
  }
};
