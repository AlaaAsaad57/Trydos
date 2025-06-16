import { OrderItem } from "./ModifyOrderWidgetPropsType";
export interface ModifyOrderItemModalPropsType {
    orderItemData: OrderItem[];
    editOrderItem: (e: any) => void;
    orderItem: OrderItem;
    setConfirmationData: (e: any) => void;
    type: string;
    confirmationData: any;
    getProductDetails: () => void;
}
