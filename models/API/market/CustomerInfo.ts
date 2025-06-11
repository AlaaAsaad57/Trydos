
export interface CustomerInfoResponse {
  customer_info: {
    id: number;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    is_phone_verified?: number;
    last_otp_id_token?: string | null;
    image?: string | null;
    tall?: number | string | null;
    weight?: number | string | null;
    gender: {
      value: number;
      name: string;
    };
    alternative_phone?: number | string | null;
  };
  }