import { BoutiqueData } from "./boutiqueTypes/boutiquePagePropsType";
import { Currency } from "./boutiqueTypes/boutiquePagePropsType";
import { FilterData } from "./boutiqueTypes/FilterListPropsType";
export interface ActiveFiltersBarPropsType {
    searchParams: URLSearchParams | {
        [key: string]: string | string[] | undefined;
    };
    params: {
        lang: string;
        boutiqueId?: string;
      };
    filters: FilterData;
    currency: Currency;
    boutique?: BoutiqueData;
}