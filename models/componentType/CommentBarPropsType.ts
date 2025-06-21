import { ProductInterface } from "models/Genaral/Product";
import { StaticImageData } from "./CommentsPropsType";

export interface CommentBarPropsType {
    CommentsData: CommentsData[],
    verifyCommentAction: (mid: number) => void,
    Render: boolean,
    increase_comments: () => void,
    setComments: (s: CommentsData[]) => void,
    setRender: (s: boolean) => void,
    product: ProductInterface,
    ErrorAccure: (s: Error) => void,
}
export interface CommentsData {
    customer: {
        name: string;
        image: StaticImageData
    }
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