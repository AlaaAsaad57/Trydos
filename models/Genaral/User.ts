export interface UserInterface {
  readonly id?: number;
  auth_token?: string;
  username?: string;
  name: string;
  image?: string | null;
  idToken: string;
  passowrd?: string;
  already_exists?: boolean;
}
