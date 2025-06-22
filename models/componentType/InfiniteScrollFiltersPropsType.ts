import { BoutiqueData } from "./boutiqueTypes/boutiquePagePropsType";
import { Currency } from "./boutiqueTypes/boutiquePagePropsType";

export interface InfiniteScrollFiltersPropsType {
    filterParams: any,
    isUsingParsedFilters:boolean,
    isFlashDeals: boolean
    term: string;
    isFeatured?: boolean;
    boutique?: BoutiqueData;
    searchParams?: URLSearchParams;
      params: {
        lang: string;
        boutiqueId?: string;
      };
    lang: string;
    currency: Currency;
}