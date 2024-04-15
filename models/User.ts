export interface UserInterface {
  readonly id?: number;
  auth_token?: string;
  username?: string;
  passowrd?: string;
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
}

export interface VerifyOtpInputInterface {
  code: string;
  verficationID: string;
  Username: string;
  EditPhoneFunc: Function;
}
