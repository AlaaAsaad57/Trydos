import { ProductDetails } from "./ProductOptionsPropsType";

export interface OrderItemCardPropsType {
    ConfirmationData: ConfirmationData;
    setConfirmationData: (e: ConfirmationData) => void;
    item: OrderItem;
    editOrderItem: (e: OrderItem[]) => void;
    orderItemData: OrderItem[];
}
export interface OrderItem {
    id: string;
    product_slug: string;
    image: string;
    variation: {
        color: string;
        Size: string;
    };
    price: number;
    price_after_discount: number;
    quantity: number;
    order_status: string;
    product_details: {
        name: string;
    };
    brand: {
        image: string;
    };
}
export interface ConfirmationData {
    enable: boolean;
    type: string;
    loading: boolean;
    currentColor: string;
    currentSize: string;
    newColor: string;
    newSize: string;
    productDetails: ProductDetails;
    item: OrderItem;
}
