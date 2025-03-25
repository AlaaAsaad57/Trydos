export interface NotificationItem {
  title: string;
  description: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface NotificationData {
  current_page: number;
  data: NotificationItem[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface NotificationResponse {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: string;
  detailed_error: string | null;
  data: NotificationData;
}
