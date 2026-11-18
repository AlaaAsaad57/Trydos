// The pack facts of a product: how many it holds (`count_of_pieces`) and its
// sale unit (`unit`). Both come from the market `qtyPriceDetails` answer. The
// backend may send neither, one, or both. This file is pure (no translation
// table, no hooks), so server and client components can both use it.

/**
 * The fixed unit codes the backend sends, and the English translation key of
 * each one. The key is the full word ("Kilo", not "kg") in every language.
 * The English key is also the English text.
 */
const UNIT_KEYS: Record<string, string> = {
  pc: "Piece",
  kg: "Kilo",
  gms: "Gram",
  l: "Liter",
};

/**
 * The translation key for a unit code. A missing unit gives `fallback`
 * ("Piece" by default), so "12" reads "12 Piece" as it did before units.
 * An unknown code is returned as it is, so the shopper still sees it.
 */
export function unitKey(unit: unknown, fallback = "Piece"): string {
  if (typeof unit !== "string" || unit.trim() === "") return fallback;
  const code = unit.trim();
  return UNIT_KEYS[code.toLowerCase()] ?? code;
}

export type PackInfo = {
  /** The count, or null when the backend sent no usable number. */
  count: number | null;
  /** The unit code (pc, kg, gms, l), or null when it is missing. */
  unit: string | null;
};

/**
 * Reads `count_of_pieces` and `unit` from a qtyPriceDetails product.
 * Returns null when both are missing, so the caller shows nothing.
 *
 * - A count must be a number above 0. A numeric string such as "12" counts.
 * - A unit must be a string with text after trimming.
 */
export function getPackInfo(product: any): PackInfo | null {
  const rawCount = product?.count_of_pieces;
  const rawUnit = product?.unit;

  let count: number | null = null;
  if (rawCount !== null && rawCount !== undefined && rawCount !== "") {
    const n = Number(rawCount);
    if (Number.isFinite(n) && n > 0) count = n;
  }

  const unit =
    typeof rawUnit === "string" && rawUnit.trim() !== "" ? rawUnit.trim() : null;

  if (count === null && unit === null) return null;
  return { count, unit };
}

/**
 * A small label with the pack facts:
 * - count and unit: "Composed Of: 2 Kilo"
 * - count only:     "Composed Of: 12 Piece"
 * - unit only:      "Unit: Kilo"
 * The caller passes its own translate function, because the server and the
 * client translate in different ways.
 */
export function PackInfoLabel({
  info,
  t,
  isRtl,
  className = "",
}: {
  info: PackInfo | null;
  t: (key: string) => string;
  isRtl: boolean;
  className?: string;
}) {
  if (!info) return null;
  const hasCount = info.count !== null;
  return (
    <div
      data-pw="product-pack-info"
      dir={isRtl ? "rtl" : "ltr"}
      className={`flex flex-row items-center regular text-[#505050] ${className}`}
    >
      <span className="rounded-[8px] bg-[#F4F4F4] px-[8px] py-[2px]">
        <span className="text-[#8D8D8D]">
          {hasCount ? t("Composed Of:") : `${t("Unit")}:`}
        </span>{" "}
        <span data-pw="product-pack-value" className="medium text-[#1D1D1D]">
          {hasCount
            ? `${info.count} ${t(unitKey(info.unit))}`
            : t(unitKey(info.unit))}
        </span>
      </span>
    </div>
  );
}
