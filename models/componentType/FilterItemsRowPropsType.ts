import { BoutiqueData } from "./boutiqueTypes/boutiquePagePropsType";
import { Currency } from "./boutiqueTypes/boutiquePagePropsType";
import { FilterData } from "./boutiqueTypes/FilterListPropsType";
export interface FilterItemsRowPropsType {
  filters?: any;
  isFlashDeals?: boolean;
  parsedFilters?: any;
  index?: number;
  boutique?: BoutiqueData;
  isFeatured?: boolean;
  params: {
    lang: string;
    boutiqueId?: string;
  };
  currency: any;
  searchParams?: URLSearchParams;
  items?: FilterData[];
  term?: string;
}
