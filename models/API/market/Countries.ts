import { Country } from "models/Genaral/Country";

export interface CountriesApi {
    data: {
      countries: Array<Country>;
    };
  }