import { ProductInterface } from "models/Genaral/Product";
export interface ExtendedAreaInfoPropsType {
      option: string;
      getComments: () => void;
      setOption: (e: string) => void;
      active: boolean;
      sharedContacts: Array<number>;
      setShareContacts: (e: Array<number>) => void;
      comments: any;
      product: ProductInterface;
      increase_comments: () => void;
      CommentsData: any;
      setComments: Function;
      ErrorAccure: Function;
      Render: boolean;
      setRender: Function;
      resendComment: Function;
      verifyCommentAction: Function;
}