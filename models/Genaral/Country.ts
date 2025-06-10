export interface Country{
    id: number;
    parent_id: number;
    position: number;
    iso: string;
    name: any;
    nicename: string;
    iso3: string;
    numcode?: number;
    phonecode: number;
    flat_photo_path: any;
    outline_photo_path: any;
    flag_photo_path: any;
    map_photo_path: any;
    status: number;
    isAccess: number;
    otp_by_whatsapp: number;
    otp_by_sms: number;
    created_at: any;
    updated_at: string;
    longitude: string;
    latitude: string;
  }