export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  avatar?: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  hasMore: boolean;
  nextPage: number;
}
