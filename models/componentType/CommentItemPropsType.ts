import { StaticImageData } from "./CommentsPropsType";

export interface CommentItemPropsType {
    name: string;
    photo: StaticImageData;
    date: string;
    text: string;
    isPending: boolean;
    isError: boolean;
    resendComment: Function;
    custmerId: number,
}