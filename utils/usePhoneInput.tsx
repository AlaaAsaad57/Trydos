import { useState, useMemo, useEffect, useCallback } from "react";

const normalizePhone = (value: string) => {
  // strip all non-digits
  let raw = value.replace(/\D/g, "");
  // remove leading international style zeros
  if (raw.startsWith("00")) raw = raw.slice(2);
  else if (raw.startsWith("0")) raw = raw.slice(1);
  return raw;
};

const getMaxLenByIso = (iso?: string) => {
  switch (iso?.toLowerCase()) {
    case "sy":
      return 12;
    case "lb":
      return 12;
    case "iq":
      return 13;
    case "tr":
      return 12;
    default:
      return 13;
  }
};

const validatePhone = (
  raw: string,
  getCountry: (v: string) => any
): { data: string; valid: boolean; country: any } => {
  const country = getCountry(raw);
  const maxLen = getMaxLenByIso(country?.iso2);
  let data = raw.slice(0, maxLen);
  let valid: boolean;

  switch (country?.iso2?.toLowerCase()) {
    case "sy":
      valid = data.length === 12;
      break;
    case "lb":
      valid = data.length > 9 && data.length <= 12;
      break;
    case "iq":
      valid = data.length === 13;
      break;
    case "tr":
      valid = data.length === 12;
      break;
    default:
      valid = data.length > 9 && data.length <= 13;
      break;
  }

  return { data, valid, country };
};

export const usePhoneInput = ({
  initial = "",
  getCountry,
}: {
  initial?: string;
  getCountry: (raw: string) => any;
}) => {
  const [value, setValue] = useState(initial); // raw (may include + / leading 0 / 00)

  // Sync external initial changes
  useEffect(() => {
    if (initial !== value) {
      setValue(limitRawByCountry(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  /**
   * Apply country length limit WITHOUT counting leading + / 0 / 00.
   * Keeps original prefix, only truncates the numeric body segment.
   */
  const limitRawByCountry = useCallback(
    (rawInput: string) => {
      const prefixMatch = rawInput.match(/^(?:\+|0{1,2})?/);
      const prefix = prefixMatch ? prefixMatch[0] : "";
      // Body digits only
      const bodyDigits = rawInput.slice(prefix.length).replace(/\D/g, "");
      // Determine country using normalized (digits-only) value
      const normalized = normalizePhone(rawInput);
      const country = getCountry(normalized);
      const maxLen = getMaxLenByIso(country?.iso2);
      const limitedBody = bodyDigits.slice(0, maxLen);
      return prefix + limitedBody;
    },
    [getCountry]
  );

  const onChange = useCallback(
    (next: string) => {
      setValue(limitRawByCountry(next));
    },
    [limitRawByCountry]
  );

  const modifiedValue = useMemo(() => normalizePhone(value), [value]);

  const check = useMemo(
    () => validatePhone(modifiedValue, getCountry),
    [modifiedValue, getCountry]
  );

  return {
    value, // raw user visible (prefix preserved)
    modifiedValue, // normalized (prefix removed)
    setValue: onChange, // accepts raw, constrains by country length excluding prefix
    valid: check.valid,
    country: check.country,
    data: check.data, // truncated normalized digits
    maxLen: getMaxLenByIso(check.country?.iso2),
  };
};
