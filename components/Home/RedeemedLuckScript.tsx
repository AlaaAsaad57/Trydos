import { REDEEMED_LUCK_SCRIPT } from "utils/luck/redeemedScript";

/**
 * A raw <script>, not next/script, and placed high in the document on purpose.
 *
 * A plain element sits exactly where it is written; `next/script` lets the
 * framework decide, which is too late — the badge would be painted before it
 * was hidden, and that flash is the whole thing this script exists to prevent.
 * `dangerouslySetInnerHTML` is required because React escapes a text child of
 * <script>.
 *
 * Costs the client bundle nothing: this is a Server Component, so
 * utils/luck/redeemedScript.ts is rendered to a string here and never sent to
 * the browser as JavaScript. Same pattern as the image fallback script beside
 * it in the layout.
 */
export default function RedeemedLuckScript() {
  return (
    <script
      id="redeemed-luck"
      dangerouslySetInnerHTML={{ __html: REDEEMED_LUCK_SCRIPT }}
    />
  );
}
