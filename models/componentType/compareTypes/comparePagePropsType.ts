import { ProductInterface } from "models/Genaral/Product";

export interface ComparePagePropsType {
  params: {
    lang: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}
