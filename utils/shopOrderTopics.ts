import home from "services/home";

/**
 * The shop order push topics this device is subscribed to.
 *
 * A seller who opens the Orders tab is subscribed to `shop_{id}_order` and
 * `shop_{id}_order_detail`, so a new order refreshes the open tab. Firebase
 * keeps that subscription on the device token until something removes it. So
 * a member who left the shop, was removed, or lost order access kept getting
 * the shop's order pushes on that device.
 *
 * The seller ids are kept in localStorage, not only in memory, so the clean-up
 * still works after a reload. Logout clears localStorage and tears down push
 * delivery for the whole device, so nothing is needed there.
 */
const STORAGE_KEY = "SHOP-ORDER-TOPICS";

// Any of these means the member may see the shop's orders, and so may keep the
// push topics. Mirrors `PERMISSION_GROUPS.ORDERS` on the dashboard page.
const ORDER_PERMISSIONS = [
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

export const shopOrderTopics = (sellerId: string | number): string[] => [
  `shop_${sellerId}_order`,
  `shop_${sellerId}_order_detail`,
];

const readIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
};

const writeIds = (ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    if (ids.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage can be full or blocked; the subscription itself still worked.
  }
};

export const subscribedShopOrderIds = (): string[] => readIds();

export const subscribeShopOrderTopics = async (
  sellerId: string | number,
): Promise<void> => {
  const id = String(sellerId);
  await Promise.all(
    shopOrderTopics(id).map((topic) => home.subscribeToTopic({ topic })),
  );
  const ids = readIds();
  if (!ids.includes(id)) writeIds([...ids, id]);
};

export const unsubscribeShopOrderTopics = async (
  sellerId: string | number,
): Promise<void> => {
  const id = String(sellerId);
  await Promise.all(
    shopOrderTopics(id).map((topic) => home.UnsubscripeFromTopic({ topic })),
  );
  writeIds(readIds().filter((x) => x !== id));
};

/**
 * Compare the remembered subscriptions with the shop list the backend just
 * answered. A shop the user no longer belongs to, or one where they lost every
 * order permission, is unsubscribed. Runs on the shop list and on the Settings
 * "Sales" check, so a removed member is cleaned up the next time they open
 * either on this device.
 */
export const reconcileShopOrderTopics = async (
  shops: { seller_id?: string | number; permissions?: string[] }[],
): Promise<void> => {
  const remembered = readIds();
  if (remembered.length === 0) return;
  const allowed = new Set(
    (shops || [])
      .filter((shop) =>
        (shop.permissions || []).some((p) => ORDER_PERMISSIONS.includes(p)),
      )
      .map((shop) => String(shop.seller_id)),
  );
  await Promise.all(
    remembered
      .filter((id) => !allowed.has(id))
      .map((id) => unsubscribeShopOrderTopics(id)),
  );
};
