import { ProductCart } from "models/Genaral/ProductCart";
import { Product } from "./ProductOptionsPropsType";
export interface QuantutyInputPropsType {
  value: string;
  deleteFunction: () => void;
  id: string;
  updateData: () => void;
  product: ProductCart;
  maxAllowed: number;
  isCollectedAfterOrdering: boolean;
  isHurry: boolean;
  disabled: boolean;
  max: number;
  setValue: () => void;
}
