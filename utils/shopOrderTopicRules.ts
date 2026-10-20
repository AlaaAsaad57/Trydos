// The rules a push topic must meet before this app subscribes a device to it.
//
// No imports on purpose. The browser helper (`utils/shopOrderTopics.ts`) and
// the server routes (`app/api/subscribe`, `app/api/unsubscribe`) both read
// this file, and a route handler must not pull the client graph in.

// Any of these means the member may see the shop's orders, and so may keep the
// order push topics. Mirrors `PERMISSION_GROUPS.ORDERS` on the dashboard page.
export const ORDER_PERMISSIONS = [
  "SUPER_ADMIN",
  "READ_ORDERS",
  "UPDATE_ORDER_INFO",
  "CHANGE_ORDER_STATUS",
  "READ_ORDER_PAYMENTS",
  "CONFIRM_ORDER_PAYMENT",
  "REFUND_ORDER_PAYMENT",
  "CANCEL_ORDER",
  "ASSIGN_SHIPPING",
  "UPDATE_TRACKING",
  "CHANGE_ORDER_STATUS_PACKAGED",
  "CHANGE_ORDER_STATUS_CANCELED",
];

// `shop_{sellerId}_order` and `shop_{sellerId}_order_detail` — the only topics
// the app subscribes a device to through its own routes.
const SHOP_ORDER_TOPIC = /^shop_(\d+)_order(_detail)?$/;

/** The seller id a shop order topic names, or null when the topic is not one. */
export const shopOrderTopicSellerId = (topic: unknown): string | null => {
  if (typeof topic !== "string") return null;
  const match = SHOP_ORDER_TOPIC.exec(topic);
  return match ? match[1] : null;
};

/** Does this permission list let a member see the shop's orders? */
export const hasOrderPermission = (permissions: unknown): boolean =>
  Array.isArray(permissions) &&
  permissions.some((p) => ORDER_PERMISSIONS.includes(p));
