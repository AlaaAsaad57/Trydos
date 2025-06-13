
export interface PersonalInfoPropsType {
    swipeToScreen: (index: number) => void;
    goBack: () => void;
}

export interface userProfileDataType {
    alternative_phone: string
    created_at?: string
    email: string
    gender: Gender
    id?: number
    image?: string
    is_phone_verified?: number
    last_otp_id_token?: string
    name: string
    phone: string
    tall?: number
    weight?: number
  }
  
  export interface Gender {
    value?: number
    name?: string
  }