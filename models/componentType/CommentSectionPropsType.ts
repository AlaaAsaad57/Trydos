import { Product } from "./ProductOptionsPropsType";

export interface CommentSectionPropsType {
  getComments: () => void;
  product: any;
  CommentsData: {
    id: number;
    message: string;
    mid: number;
    name: string;
    profile_image: string;
    time: string;
    type: string;
    user_id: number;
    user_name: string;
    user_type: string;
    user_type_id: number;
    is_verfied: boolean;
    isError: boolean;
  }[];
}
