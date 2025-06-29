import { fetchData } from "utils/fetchData";
import { NotificationResponse } from "../types/notifications";

export const fetchNotifications = async (
  page: number,
  pageSize: number = 10
): Promise<NotificationResponse> => {
  try {
    const response = await fetchData({
      url: `/user-notifications/get?page=${page}`,
      reqTitle: "Fetch Notifications",
      method: "GET",
      server: "market",
    });
    return response;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Fallback to mock data if API is not available
  }
};
export const getNotificationsTypes = async () => {
  try {
    const response = await fetchData({
      url: "/web/notification_types/customer-notification-to-choose",
      reqTitle: "Fetch Notifications Types",
      method: "GET",
      server: "market",
    });
    return response;
  } catch (error) {
    console.error("Error fetching notifications Types:", error);
    // Fallback to mock data if API is not available
  }
};
