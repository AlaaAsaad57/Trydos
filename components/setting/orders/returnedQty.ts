/**
 * Should the "Returned: n" label appear beside an order item?
 *
 * A returned item surfaces its returned quantity beside the "Item: qty" line,
 * but only once the return request is a real request the shopper can act on:
 *  - draft requests are still being composed by the user (same draft check
 *    used in OrderItemReturnConfirmationWindow), and
 *  - a cancelled request no longer returns anything, so the quantity would be
 *    telling the shopper about a return that is not happening.
 */
export const shouldShowReturnedQty = ({
  alreadyReturn,
  requestStatus,
  returnedQty,
}: {
  alreadyReturn?: boolean;
  requestStatus?: { name?: string; value?: string };
  returnedQty: number;
}): boolean =>
  !!alreadyReturn &&
  !!requestStatus?.value &&
  !requestStatus?.name?.toLowerCase()?.includes("draft") &&
  requestStatus?.value !== "cancelled" &&
  returnedQty > 0;
