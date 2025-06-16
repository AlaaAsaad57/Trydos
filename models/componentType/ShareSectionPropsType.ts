import { ProductInterface } from "models/Genaral/Product";

export interface ShareSectionPropsType {
    sharedContacts: Array<number>;
    product: ProductInterface;
    setShareContacts: (e: Array<number>) => void;
}