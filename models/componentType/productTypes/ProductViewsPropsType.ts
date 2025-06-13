import { Category } from "./productPagePropsType"
export interface ProductViewsPropsType {
    product : {
        id: number,
        name: string,
        categories: Category[]
    }
}