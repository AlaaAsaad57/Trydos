import { ProductInterface } from "models/product";

export interface ComparePageComponentPropsType {
    showInstantLoading?: boolean;
}

export interface SelectedOption {
    label: string;
    value: string;
    images?: { file_path: string };
    price?: number;
  }

  export interface compareFields {
    key: string;
    label: string;
    render?: (product: ProductInterface) => React.ReactNode;
  }