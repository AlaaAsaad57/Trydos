export interface User {
  id: number;
  name: string;
  username: string | null;
  mobile_phone: string;
  photo_path: string | null;
  created_at: string;
  contact_user: any | null;
}

export interface Member {
  id: number;
  user_id: number;
  is_allowed_to_chat: boolean | null;
  is_admin: number; // 0 or 1
  mute: number;
  archived: number;
  pin: number;
  is_blocked: number;
  user: User;
  created_at: string | null;
}

export interface MessageFile {
  id: string | number;
  file_path: string;
  file_name: string;
  message_id?: string;
  caption: string | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  is_locked_by_admin_for_delete?: number;
  is_locked_by_admin_for_update?: number;
}

export interface MessageStatus {
  id: number;
  user_id: number;
  is_sent: boolean | null;
  is_received: number;
  is_watched: boolean;
  is_deleted: number;
  delete_for_all: boolean;
  message_deleted_at: string | null;
  watched_at: string | null;
  received_at: string | null;
  created_at: string;
}

export interface MessageContent {
  message_id: string;
  content: string;
  is_locked_by_admin_for_delete: number;
  is_locked_by_admin_for_update: number;
}

export interface Message {
  id: string;
  mid?: string;
  sender_user_id: number;
  sender_mobile_phone: string | null;
  receiver_user_id: number;
  channel_id: string;
  message_description: string;
  extra_fields: any | null;
  parent_message_id: string;
  is_forward: number;
  call_status: any | null;
  created_at: string;
  duration_in_seconds: number | null;
  message_content: MessageFile[] | MessageContent; // Can be string or object based on your JSON
  message_type: {
    name: string;
    event_name: string;
    created_at: string | null;
  };
  deleted_by_user_id: number | null;
  sender_user: User;
  auth_message_status?: MessageStatus;
  message_status: MessageStatus[];
  parent_message?: Message | null;
  message_files: any[];
}

export interface Channel {
  id: string;
  channel_name: string;
  mobile_phone: string;
  photo_path: string | null;
  total_unread_message_count: number;
  created_at: string;
  is_mute: number;
  updated_at: string;
  channel_members: Member[];
  messages: Message[];
  channel_type: any | null;
}
