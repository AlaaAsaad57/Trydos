import { ProductInterface } from "models/Genaral/Product";
export interface ExtendedAreaInfoPropsType {
  option: string;
  getComments: () => void;
  active: boolean;
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;

  product: ProductInterface;

  CommentsData: any;
}
