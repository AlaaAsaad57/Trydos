import { BoutiqueData } from "./boutiqueTypes/boutiquePagePropsType";

export interface ListingSkeletonPropsType {
  forProducts?: boolean;
  withBanners?: boolean;
  boutique?: BoutiqueData;
  isForSearch?: boolean;
  justFilters?: boolean;
}
