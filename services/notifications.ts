import { NotificationResponse } from "../types/notifications";

export const fetchNotifications = async (
  page: number,
  pageSize: number = 8
): Promise<NotificationResponse> => {
  try {
    // Replace this URL with your actual API endpoint
    const response = await fetch(
      `/api/notifications?page=${page}&pageSize=${pageSize}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Fallback to mock data if API is not available
    return {
      notifications: [
        {
          id: `${page * pageSize + 1}`,
          title: "New message from John",
          time: "2 hours ago",
        },
        {
          id: `${page * pageSize + 2}`,
          title: "System update available",
          time: "5 hours ago",
        },
        {
          id: `${page * pageSize + 3}`,
          title: "Your order has been shipped",
          time: "1 day ago",
        },
        {
          id: `${page * pageSize + 4}`,
          title: "New feature announcement",
          time: "2 days ago",
        },
        {
          id: `${page * pageSize + 5}`,
          title: "Meeting reminder",
          time: "3 days ago",
        },
        {
          id: `${page * pageSize + 6}`,
          title: "Document shared with you",
          time: "4 days ago",
        },
        {
          id: `${page * pageSize + 7}`,
          title: "Profile update required",
          time: "5 days ago",
        },
        {
          id: `${page * pageSize + 8}`,
          title: "New comment on your post",
          time: "6 days ago",
        },
      ],
      hasMore: page < 10,
      nextPage: page + 1,
    };
  }
};
