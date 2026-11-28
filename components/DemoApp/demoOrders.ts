/**
 * The shopper's orders for the demo: XD `Home Page – 53` (list) and
 * `Home Page – 60`, `– 62`, `– 61`, `– 64`, `– 65`, `– 66`, `– 63` (details,
 * pickup QR sheet, and animated order timeline).
 *
 * Plain data with no React in it. Photos reuse the demo's own product assets
 * under `/assets/demo/listing/` so the thumbnails and item rows match the XD
 * artboards identically.
 */

export const ORDER_PHOTO_PAJAMA = "/assets/demo/listing/product-pajama.webp";
export const ORDER_PHOTO_SHIRT = "/assets/demo/listing/product-shirt-pink.webp";

/**
 * Every order detail stage drawn across the XD artboards:
 *  - `preparing`: `Home Page – 60` (2 items preparing, Packing)
 *  - `split`:     `Home Page – 62` (1 preparing + 1 shipped, Packing & Shipping Operations)
 *  - `shipped`:   `Home Page – 61` (both shipped, Remaining 1 Day, truck + QR code)
 *  - `pickup`:    `Home Page – 64` (ready for pickup, Waiting Pickup 30 m + Pickup Now CTA)
 *  - `delivered`: `Home Page – 66` (delivered, Rate & Get Money + item star ratings)
 *  - `showcase`:  `Home Page – 63` (all 6 timeline icons displayed on the track)
 */
export type OrderStage =
  | "preparing"
  | "split"
  | "shipped"
  | "pickup"
  | "delivered"
  | "showcase";

export const ORDER_STAGES: readonly OrderStage[] = [
  "preparing",
  "split",
  "shipped",
  "pickup",
  "delivered",
] as const;

export function parseOrderStage(raw: string | null): OrderStage | null {
  if (
    raw === "preparing" ||
    raw === "split" ||
    raw === "shipped" ||
    raw === "pickup" ||
    raw === "delivered" ||
    raw === "showcase"
  ) {
    return raw;
  }
  return null;
}

export type OrderFilter = "all" | "in_progress" | "delivered" | "returned" | "cancelled";

export type DemoOrder = {
  id: string;
  status: "in_progress" | "delivered";
  defaultStage: OrderStage;
  itemCount: number;
  totalUsd: number;
  dateLabel: string;
  /** Thumbnails shown on the Orders list card (`Home Page – 53`), left to right. */
  listThumbs: readonly string[];
  /** Edge accent strip colour on the Orders list card (`#4A31E7` or `#2BAF0B`). */
  edgeColor: string;
  /** Height of the edge strip on the Orders list card (136 vs 98). */
  edgeHeight: number;
  /** Line items shown on Order Details (`Home Page – 60`..`– 66`). */
  items: readonly {
    id: string;
    photo: string;
    hasBorder: boolean;
    brandSlug: "mango";
    color: string;
    size: string;
    pieces: string;
    priceUsd: number;
  }[];
  pickupCenter: string;
  recipient: string;
  recipientPhone: string;
  recipientPhoneNoPlus: string;
  expectedDate: string;
  expectedDays: string;
  pickedDate: string;
  pickedTime: string;
  pickedTrackTime: string;
};

export const DEMO_ORDERS: readonly DemoOrder[] = [
  {
    id: "TTISA10012",
    status: "in_progress",
    defaultStage: "preparing",
    itemCount: 2,
    totalUsd: 160,
    dateLabel: "13:59:00",
    listThumbs: [ORDER_PHOTO_SHIRT, ORDER_PHOTO_PAJAMA],
    edgeColor: "#4A31E7",
    edgeHeight: 136,
    items: [
      {
        id: "item-1",
        photo: ORDER_PHOTO_PAJAMA,
        hasBorder: true,
        brandSlug: "mango",
        color: "Denim Blue",
        size: "Medium 38",
        pieces: "1 Piece",
        priceUsd: 160,
      },
      {
        id: "item-2",
        photo: ORDER_PHOTO_SHIRT,
        hasBorder: false,
        brandSlug: "mango",
        color: "Denim Blue",
        size: "Medium 38",
        pieces: "1 Piece",
        priceUsd: 160,
      },
    ],
    pickupCenter: "Al Jamilia Trydos Center",
    recipient: "Mohamad Katmawi",
    recipientPhone: "+90 552 800 2000",
    recipientPhoneNoPlus: "90 552 800 2000",
    expectedDate: "2.jun",
    expectedDays: "3 Work Days",
    pickedDate: "2.jun",
    pickedTime: "19:15",
    pickedTrackTime: "19:21",
  },
  {
    id: "TTISA10013",
    status: "delivered",
    defaultStage: "delivered",
    itemCount: 6,
    totalUsd: 160,
    dateLabel: "13:59:00",
    listThumbs: [
      ORDER_PHOTO_SHIRT,
      ORDER_PHOTO_SHIRT,
      ORDER_PHOTO_SHIRT,
      ORDER_PHOTO_SHIRT,
      ORDER_PHOTO_SHIRT,
      ORDER_PHOTO_SHIRT,
    ],
    edgeColor: "#2BAF0B",
    edgeHeight: 98,
    items: [
      {
        id: "item-1",
        photo: ORDER_PHOTO_PAJAMA,
        hasBorder: true,
        brandSlug: "mango",
        color: "Denim Blue",
        size: "Medium 38",
        pieces: "1 Piece",
        priceUsd: 160,
      },
      {
        id: "item-2",
        photo: ORDER_PHOTO_SHIRT,
        hasBorder: false,
        brandSlug: "mango",
        color: "Denim Blue",
        size: "Medium 38",
        pieces: "1 Piece",
        priceUsd: 160,
      },
    ],
    pickupCenter: "Al Jamilia Trydos Center",
    recipient: "Mohamad Katmawi",
    recipientPhone: "+90 552 800 2000",
    recipientPhoneNoPlus: "90 552 800 2000",
    expectedDate: "2.jun",
    expectedDays: "3 Work Days",
    pickedDate: "2.jun",
    pickedTime: "19:15",
    pickedTrackTime: "19:21",
  },
] as const;

export const orderById = (id: string): DemoOrder | undefined =>
  DEMO_ORDERS.find((o) => o.id === id);
