import { allCountries } from "country-telephone-data";

/**
 * Format a stored phone number (country code + national number, e.g.
 * "963937288307") into ITU-T E.123 international notation:
 *   Syria:   +963 937 288 307
 *   Turkey:  +90 552 800 2000
 *   Lebanon: +961 70 123 456
 *
 * Falls back to "+<digits>" when the dial code can't be detected.
 */

// E.123 national-number grouping per country (iso2 -> group sizes).
const NATIONAL_GROUPS: Record<string, number[]> = {
  sy: [3, 3, 3], // +963 937 288 307
  tr: [3, 3, 4], // +90 552 800 2000
  lb: [2, 3, 3], // +961 70 123 456
  iq: [3, 3, 4], // +964 7XX XXX XXXX
  ae: [2, 3, 4], // +971 50 123 4567
};

const toDigits = (value: string) => value.replace(/\D/g, "");

// Longest dial code that prefixes the number wins (e.g. 961 over 9).
const matchDialCode = (digits: string): { dialCode: string; iso2: string } | null => {
  let best: { dialCode: string; iso2: string } | null = null;
  for (const country of allCountries) {
    const dialCode = country.dialCode as string;
    if (dialCode && digits.startsWith(dialCode)) {
      if (!best || dialCode.length > best.dialCode.length) {
        best = { dialCode, iso2: country.iso2 };
      }
    }
  }
  return best;
};

const groupNational = (national: string, iso2?: string): string => {
  const pattern = (iso2 && NATIONAL_GROUPS[iso2.toLowerCase()]) || null;
  const groups: string[] = [];
  let rest = national;

  if (pattern) {
    for (const size of pattern) {
      if (!rest) break;
      groups.push(rest.slice(0, size));
      rest = rest.slice(size);
    }
    if (rest) groups.push(rest); // any leftover digits
  } else {
    // Generic E.123: groups of 3, merge a trailing 1–2 digit remainder.
    while (rest.length) {
      groups.push(rest.slice(0, 3));
      rest = rest.slice(3);
    }
    if (groups.length >= 2 && groups[groups.length - 1].length < 3) {
      const last = groups.pop() as string;
      groups[groups.length - 1] += last;
    }
  }

  return groups.filter(Boolean).join(" ");
};

export const formatPhoneInternational = (
  phone?: string | number | null,
): string => {
  if (phone === null || phone === undefined) return "";
  const digits = toDigits(String(phone));
  if (digits.length < 4) return "";

  const match = matchDialCode(digits);
  if (!match) return `+${digits}`;

  const national = digits.slice(match.dialCode.length);
  const grouped = groupNational(national, match.iso2);
  return grouped ? `+${match.dialCode} ${grouped}` : `+${match.dialCode}`;
};
