export interface RegisterGuestApi {
    isSuccessful: boolean;
    message: string;
    data: {
      token: string;
      expires_at: string;
      user: {
        id: number;
        name: string;
        phone: string;
        is_phone_verified: number;
        last_otp_id_token: any;
      };
    };
  }