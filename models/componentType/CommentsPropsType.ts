export interface CommentsPropsType {
    comments: CommentsData[],
    Render: boolean,
    resendComment: (mid: number) => void,
    productId: number,
    ErrorAccure: (s: Error) => void,
    CommentsData: CommentsData[],
    setComments: (s: CommentsData[]) => void,
    increase_comments: () => void,
    setRender: (s: boolean) => void,
    verifyCommentAction: (mid: number) => void,
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
export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurWidth?: number;
    blurHeight?: number;
}