export interface ProductCardPropsType {
  product: any;
  status: {
    label: string;
    value: string;
  };
  order: any;
  getOrderDetails: () => void;
}
