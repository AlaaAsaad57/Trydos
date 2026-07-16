/**
 * A user's phone counts as "verified" for display purposes when it is a real,
 * well-formed number.
 *
 * We deliberately do NOT rely on the backend `is_phone_verified` flag here: it is
 * reset to 0 whenever the same user id hits `/auth/register-guest`, even though the
 * phone on record is still intact and was verified before. Checkout gating still
 * uses `is_phone_verified` on purpose — this helper is only for UI status (icon/label).
 */
export const isValidPhone = (phone?: string | number | null): boolean => {
  if (phone === undefined || phone === null) return false;
  // Keep digits only — drops "+", spaces, dashes and the "0" / "00" sentinels.
  const digits = String(phone).replace(/\D/g, "");
  if (!digits || /^0+$/.test(digits)) return false;
  // E.164: a real number (with or without country code) is 10–15 digits.
  return digits.length >= 10 && digits.length <= 15;
};
