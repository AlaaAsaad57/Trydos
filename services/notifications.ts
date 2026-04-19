import { fetchData } from "utils/fetchData";

import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";

export const fetchNotifications = async (
  page: number,
  pageSize: number = 10,
): Promise<any> => {
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
    LogServerError({
      error: error,
      scenario: "Error In fetchNotifications in services/notifications",
    });
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
    LogServerError({
      error: error,
      scenario: "Error In getNotificationsTypes in services/notifications",
    });
    // Fallback to mock data if API is not available
  }
};
