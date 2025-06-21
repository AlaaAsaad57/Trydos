

export interface CommentBarPropsType {
    CommentsData: any[],
    verifyCommentAction: Function,
    Render: boolean,
    increase_comments: Function,
    setComments: Function,
    setRender: Function,
    product: any,
    ErrorAccure: Function,
}
export interface CommentsData 
    {id: number;
    message: string;
    Left_stock: number;
    price_formatted: string;
    offer_price_formatted: string;
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
}