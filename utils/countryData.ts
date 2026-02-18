import type { allCountries as CountryData } from "country-telephone-data";

let _countries: typeof CountryData | null = null;

export const getAllCountries = async () => {
  if (_countries) return _countries;
  const mod = await import("country-telephone-data");
  _countries = mod.allCountries;
  return _countries;
};

// Synchronous access — returns cached data or empty array
export const getCountriesSync = (): typeof CountryData => {
  if (_countries) return _countries;
  // Kick off load for next call
  getAllCountries();
  return [] as unknown as typeof CountryData;
};

// Find country name by iso2 code — common pattern in the codebase
export const getCountryNameByIso2 = (iso2: string): string => {
  const countries = getCountriesSync();
  return countries.find((s) => s.iso2 === iso2)?.name || iso2;
};
