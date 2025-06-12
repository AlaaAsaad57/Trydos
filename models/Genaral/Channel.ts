import { ChannelMember } from "./ChannelMember";
import { Message } from "./Message";

export interface Channel {
  id?: string;
  channel_name?: string;
  mobile_phone?: string;
  photo_path?: any;
  total_unread_message_count?: number;
  mid?: any;
  created_at?: string;
  is_mute?: number;
  updated_at?: string;
  channel_members?: Array<ChannelMember>;
  messages?: Array<Message>;
  channel_type?: {
    id?: number;
    is_default?: number;
    slug?: number;
    created_at?: string;
  };
}
