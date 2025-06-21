import { ProductInterface } from "models/Genaral/Product";

export interface ShareOptionsPropsType {
    setShareContacts: (e: Array<number>) => void;
    sharedContacts: Array<number>;
    product: ProductInterface;
}