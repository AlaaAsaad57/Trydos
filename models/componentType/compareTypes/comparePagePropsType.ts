import { ProductInterface } from "models/product";

export interface ComparePagePropsType {
    params: {
        lang: string;
      };
      searchParams: {
        [key: string]: string | string[] | undefined;
      };
}