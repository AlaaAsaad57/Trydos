import { ProductInterface } from "models/Genaral/Product";
export interface ExtendedAreaInfoPropsType {
  option: string;
  active: boolean;
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
}
