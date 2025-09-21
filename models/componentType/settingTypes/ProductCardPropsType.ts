export interface ProductCardPropsType {
  product: any;
  status: {
    label: string;
    value: string;
  };
  order: any;
  getProductUrl: (e: any) => string;
  getOrderDetails: () => void;
}
