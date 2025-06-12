export interface Message {
  id: string;
  sender_user_id: number;
  sender_mobile_phone: any;
  receiver_user_id: number;
  channel_id: string;
  message_description: any;
  extra_fields: any;
  parent_message_id: string;
  is_forward: number;
  call_status: any;
  created_at: string;
  duration_in_seconds: any;
  message_content: {
    message_id: number;
    content: string;
  };
  message_type: {
    name: string;
    event_name: string;
    created_at: any;
  };
  deleted_by_user_id: any;
  sender_user: {
    id: number;
    name: string;
    username: any;
    mobile_phone: string;
    photo_path: string;
    created_at: string;
    access_token: any;
    contact_user: any;
  };
  auth_message_status: {
    id: number;
    user_id: number;
    is_sent: any;
    is_received: number;
    is_watched: boolean;
    is_deleted: number;
    delete_for_all: boolean;
    message_deleted_at: any;
    watched_at: string;
    received_at: string;
    created_at: string;
  };
  channel: {
    id: string;
    channel_name: string;
    mobile_phone: string;
    photo_path: any;
    total_unread_message_count: any;
    created_at: string;
    is_mute: number;
    updated_at: string;
  };
  parent_message: any;
  message_status: Array<{
    id: number;
    user_id: number;
    is_sent: any;
    is_received: number;
    is_watched: boolean;
    is_deleted: number;
    delete_for_all: boolean;
    message_deleted_at: any;
    watched_at?: string;
    received_at?: string;
    created_at: string;
  }>;
  message_files: Array<any>;
}
