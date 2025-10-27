export interface CommentsPropsType {
  comments: any[];
  productId: number;
  CommentsData: any[];
  setComments: Function;
  shouldShowMore: boolean;
  comment_offset: any;
  loading: boolean;
}
export interface CommentsData {
  customer: {
    name: string;
    image: StaticImageData;
  };
  created_at: string;
  comment: string;
  id: number;
  mid: number;
  user_id: number;
  user_name: string;
  user_type: string;
  user_type_id: number;
  is_verfied: boolean;
  isError: boolean;
}
export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}
