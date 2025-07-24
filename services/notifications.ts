import { fetchData } from "utils/fetchData";
import { NotificationResponse } from "../types/notifications";
import { REQUESTS_DATA } from "utils/Requests";

export const fetchNotifications = async (
  page: number,
  pageSize: number = 10
): Promise<NotificationResponse> => {
  try {
    const response = await fetchData({
      url: `/user-notifications/get?page=${page}`,
      reqTitle: REQUESTS_DATA.FETCH_NOTIFICATIONS,
      method: "GET",
      server: "market",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
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
      reqTitle: REQUESTS_DATA.FETCH_NOTIFICATIONS_TYPES,
      method: "GET",
      server: "market",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    return response;
  } catch (error) {
    console.error("Error fetching notifications Types:", error);
    // Fallback to mock data if API is not available
  }
};
