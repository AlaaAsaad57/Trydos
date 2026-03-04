import { allCountries } from "country-telephone-data";

// Find country name by iso2 code — common pattern in the codebase
export const getCountryNameByIso2 = (iso2: string): string => {
  const countries = allCountries();
  console.log("countries", countries);
  return countries.find((s) => s.iso2 === iso2)?.name || iso2;
};
