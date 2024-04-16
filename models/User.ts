export interface avatarInterface {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}
export interface UserInterface {
  readonly id?: number;
  auth_token?: string;
  username?: string;
  name: string;
  avatar: string | null | avatarInterface;
  idToken: string;
  passowrd?: string;
  already_exists: boolean;
}

export interface CheckPhoneInputInterface {
  value?: string | number;
  step?: (num: number) => void;
  newAccount?: boolean;
}

export interface SendOtpInputInterface {
  mobilePhone: string;
  is_via_whatsapp: number | string;
  step: Function;
  errorCallback: Function;
  successCallback: Function;
}

export interface VerifyOtpInputInterface {
  code: string;
  verificationID: string;
  Username: string;
  EditPhoneFunc: Function;
  errorCallback: Function;
  successCallback: Function;
}
