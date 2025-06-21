export interface PlaceOrderButtonsPropsType {
    orderLoading: boolean;
    backToCart: () => void;
    close: () => void;
    successOrder: () => void;
}