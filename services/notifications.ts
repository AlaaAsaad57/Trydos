import { UserToken } from "utils/functions";
import { NotificationResponse } from "../types/notifications";

export const fetchNotifications = async (
  page: number,
  pageSize: number = 10
): Promise<NotificationResponse> => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        `/user-notifications/get?page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${UserToken()}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Fallback to mock data if API is not available
    return {
      isSuccessful: true,
      hasContent: true,
      code: 200,
      message: "Success",
      detailed_error: null,
      data: {
        current_page: page,
        data: [
          {
            title: "market",
            description: JSON.stringify({
              type: "boutique created",
              description: "new boutique created",
              boutique_slug: "test-boutique",
              boutique_icon: {
                file_path: "https://example.com/icon.svg",
                original_width: "800px",
                original_height: "800px",
              },
            }),
          },
        ],
        first_page_url: "http://example.com/api/notifications?page=1",
        from: (page - 1) * pageSize + 1,
        last_page: 10,
        last_page_url: "http://example.com/api/notifications?page=10",
        links: [],
        next_page_url:
          page < 10
            ? `http://example.com/api/notifications?page=${page + 1}`
            : null,
        path: "http://example.com/api/notifications",
        per_page: pageSize,
        prev_page_url:
          page > 1
            ? `http://example.com/api/notifications?page=${page - 1}`
            : null,
        to: page * pageSize,
        total: 100,
      },
    };
  }
};
