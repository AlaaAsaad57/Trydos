export interface ShareAvatarPropsType {
    active: boolean;
    setActive: () => void;
    contact: Contact;
    disable: boolean;
}
export interface Contact {
    contact_user: ContactUser
    last_active_at: string
    mobile_phone: string
    name: string
    original_user_id: number
    photo_path?: string
    updated_at: string
    username: any
  }
  
  export interface ContactUser {
    photo_path: string
    name: string
    created_at: string
    deleted_at: any
    delivery_user_id: number
    id: number
    is_locked_by_admin_for_delete: number
    is_locked_by_admin_for_update: number
    is_locked_to_call: number
    its_record_in_my_contact: ItsRecordInMyContact
  }
  
  export interface ItsRecordInMyContact {
    contact_user_id: number
    id: number
    mobile_phone: string
    name: string
    user_id: number
  }
  