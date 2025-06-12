export interface Contact{
    id: number;
    user_id: number;
    name: string;
    mobile_phone: string;
    contact_user_id?: number;
    contact_user?: {
      id: number;
      mobile_phone: string;
      photo_path: any;
      created_at: string;
      updated_at: string;
      deleted_at: any;
      is_locked_by_admin_for_delete: number;
      is_locked_by_admin_for_update: number;
      name: string;
      username?: string;
      original_user_id?: number;
      is_locked_to_call: number;
      last_active_at?: string;
      its_record_in_my_contact: {
        id: number;
        user_id: number;
        name: string;
        mobile_phone: string;
        contact_user_id: number;
      };
    };
  }