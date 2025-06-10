import {Country} from '../Genaral/Country'
export interface CountriesApi {
    data: {
      countries: Array<Country>;
    };
  }