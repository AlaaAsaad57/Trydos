export interface ChannelMember{
    id: number;
    user_id: number;
    is_allowed_to_chat: any;
    is_admin: number;
    mute: number;
    archived: number;
    pin: number;
    user: {
      id: number;
      name: string;
      username?: string;
      mobile_phone: string;
      photo_path: any;
      created_at: string;
      access_token: any;
      contact_user?: {
        id: number;
        user_id: number;
        name: string;
        mobile_phone: string;
        contact_user_id: number;
      };
    };
    created_at: string;
  }