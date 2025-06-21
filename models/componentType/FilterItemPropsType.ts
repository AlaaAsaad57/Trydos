import { BoutiqueData } from "./boutiqueTypes/boutiquePagePropsType";
import { Currency } from "./boutiqueTypes/boutiquePagePropsType";
import { FilterData } from "./boutiqueTypes/FilterListPropsType";
export interface FilterItemPropsType {
    term: string;
    item: FilterData;
    searchParams: URLSearchParams;
    currency: Currency;
    params: {
        lang: string;
        boutiqueId?: string;
      };
    boutique?: BoutiqueData;
}