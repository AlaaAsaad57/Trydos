// One form for a contact's phone number, in every country.
//
// A phone book keeps local numbers ("0937288307", "0770 123 4567"); the chat
// backend keeps full ones ("963937288307"). Comparing the last N digits does
// not work: how many digits a local number has, and whether it starts with a
// trunk "0", changes from country to country. libphonenumber-js knows those
// rules, so every number goes through it before two numbers are compared.
import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/** Where a local number (one with no country code) belongs. */
export type PhoneRegion = {
  defaultCountry?: CountryCode;
  defaultCallingCode?: string;
};

const digitsOf = (phone?: string | null) => String(phone ?? "").replace(/\D/g, "");

/** The region for local numbers: the country of the shopper's own phone first,
 *  because their phone book is local to their own phone; then the app region
 *  (`sy`, `iq`, …). Empty when neither is known. */
export const phoneRegion = (
  ownPhone?: string | null,
  appCountry?: string | null,
): PhoneRegion => {
  const own = digitsOf(ownPhone);
  const parsed = own ? parsePhoneNumberFromString(`+${own}`) : undefined;
  if (parsed?.isValid()) {
    // +1 and +7 are shared by several countries; the calling code still reads
    // a local number correctly when the exact country is not known.
    return parsed.country
      ? { defaultCountry: parsed.country }
      : { defaultCallingCode: parsed.countryCallingCode };
  }
  const code = String(appCountry ?? "").toUpperCase();
  return isSupportedCountry(code) ? { defaultCountry: code } : {};
};

/** The full international number, digits only, no "+" — the form the chat
 *  backend keeps its users' phones in (app/api/auth/login/route.ts).
 *
 *  A number with "+" or "00" is read as international. Any other number is
 *  read as local to `region` first, then as international without the "+"
 *  (the backend's own "963937288307"). A number that is valid in neither way
 *  keeps its digits as they are. Returns "" when there are no digits. */
export const canonicalPhone = (
  phone?: string | null,
  region: PhoneRegion = {},
): string => {
  const text = String(phone ?? "").replace(/[^\d+]/g, "");
  const digits = digitsOf(text);
  if (!digits) return "";

  if (text.startsWith("+") || text.startsWith("00")) {
    const international = text.startsWith("+") ? digits : digits.slice(2);
    const parsed = parsePhoneNumberFromString(`+${international}`);
    return parsed?.isValid() ? parsed.number.slice(1) : international;
  }

  const local = parsePhoneNumberFromString(digits, region);
  if (local?.isValid()) return local.number.slice(1);
  const international = parsePhoneNumberFromString(`+${digits}`);
  if (international?.isValid()) return international.number.slice(1);
  return digits;
};

/** A number typed as a dial code ("+963") and a local part ("0937288307"),
 *  in the same form as `canonicalPhone`. The local part may keep its trunk
 *  "0". A number that is not valid keeps the dial code and the digits. */
export const phoneWithDialCode = (dialCode: string, localPhone: string): string => {
  const code = digitsOf(dialCode);
  const local = digitsOf(localPhone);
  if (!local) return "";
  const parsed = parsePhoneNumberFromString(local, { defaultCallingCode: code });
  return parsed?.isValid() ? parsed.number.slice(1) : `${code}${local}`;
};
