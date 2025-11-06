import { StaticImageData } from "./CommentsPropsType";

export interface CommentItemPropsType {
  name: string;
  photo: StaticImageData;
  date: string;
  text: string;
  isPending: boolean;
  isError: boolean;

  custmerId: number;
  comment: any;
  isFull?: boolean;
  seller_name: string;
}
