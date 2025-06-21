import { Product } from "./ProductOptionsPropsType";

export interface CommentSectionPropsType {
    getComments: () => void;
    increase_comments: () => void;
    product: any;
    Render: boolean;
    setRender: (s: boolean) => void;
    comments: {id: number; message: string; mid: number; name: string; profile_image: string; time: string; type: string; user_id: number; user_name: string; user_type: string; user_type_id: number , is_verfied: boolean, isError: boolean}[];
    CommentsData: 
    {id: number;
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
    setComments: (s: {id: number; message: string; mid: number; name: string; profile_image: string; time: string; type: string; user_id: number; user_name: string; user_type: string; user_type_id: number , is_verfied: boolean, isError: boolean}[]) => void;
    ErrorAccure: Function;
    resendComment: Function;
    verifyCommentAction: Function
}
