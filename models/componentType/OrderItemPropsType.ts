import { OrderItem as OrderItemType } from "../../types/orders";

export interface OrderItemPropsType {
    order: OrderItemType,
    key: string,
    showDetails: Function,
}
