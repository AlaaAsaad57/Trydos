
import { SearchResults } from "store/search/reducer";

export interface ShowFilterRowPropsType<T extends keyof SearchResults> {
  term: T;
  values: SearchResults[T];
}

