import { UserToken } from "utils/functions";
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
