import { BoutiqueData } from "./boutiqueTypes/boutiquePagePropsType";
import { Currency } from "./boutiqueTypes/boutiquePagePropsType";
import { FilterData } from "./boutiqueTypes/FilterListPropsType";
export interface FilterItemsRowPropsType {
    index: number;
    boutique?: BoutiqueData;
    isFeatured?: boolean;
    params: {
        lang: string;
        boutiqueId?: string;
    };
    currency: Currency;
    searchParams: URLSearchParams;
    items: FilterData[];
    term: string;
}