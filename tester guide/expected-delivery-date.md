# Expected Delivery Date — Tester Guide

## How the Date Is Calculated

Every delivery date is the sum of two numbers:

| Part                                                 | Where it comes from                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Product shipping days** (`shipping_days`)          | Stored per product from the seller                                                                                                   |
| **Country shipping days** (`shipping_duration_days`) | A single global value from app settings (`starting-setting`) — represents how many extra days it takes to ship to the user's country |

**Formula:**  
`Expected Delivery Date = Today + product_shipping_days + country_shipping_days`

---

## Cart

### The rule: use the MAX, not the sum

A cart can hold items from **multiple different sellers**, each with their own `shipping_days`.

- ✅ **Correct:** take the **longest (max) shipping_days** across all cart items, then add `country_shipping_days` **once**
- ❌ **Wrong:** add `country_shipping_days` to each item's `shipping_days` and then sum or display them separately

**Why?**  
Country shipping days represent the transit time for the shipment to reach the country — it applies to the whole order, not per item. Because even if item A has 3 days and item B has 7 days, the shipment can't arrive before the slowest item is ready (7 days), and then we add the country transit time once.

### Example

| Item        | Seller   | `shipping_days` |
| ----------- | -------- | --------------- |
| Red Dress   | Seller A | 3               |
| Blue Bag    | Seller B | 7               |
| White Shoes | Seller C | 5               |

`country_shipping_days` = 2 (Saudi Arabia for example)

✅ Correct expected delivery: `Today + max(3, 7, 5) + 2 = Today + 9 days`  
❌ Wrong: `Today + (3+2) + (7+2) + (5+2) = Today + 21 days`

### Where to test

- **Cart page → `ShippingAddressContainer`** — shows "Expected Delivery" date using the correct MAX logic
- **Add-to-Cart slide-up card** — shows shipping date for that specific product
- **Properties marquee (scrolling banner)** — shows a "Ship accepted on [date]" badge using that product's `shipping_days`

---

## Orders

### Each order = one seller

Unlike the cart, each placed order is fulfilled by **one seller**. This means:

- All items in the order belong to the same seller
- It is valid to use MAX `shipping_days` across items in that order + `country_shipping_days`
- The base date is **the order's `created_at` timestamp** (when the order was placed), not "today"

**Formula:**  
`Expected Delivery = order.created_at + max(item.shipping_days) + country_shipping_days`

### Example

| Item    | `shipping_days` |
| ------- | --------------- |
| T-Shirt | 4               |
| Shorts  | 6               |

`country_shipping_days` = 2  
Order placed on **April 1**

✅ Correct expected delivery: `April 1 + max(4, 6) + 2 = April 9`

### Where to test

- **Order details page** — shows `OrderExpectedDeliveryCard` with the calculated date
- **Order list** — same component is shown per order pack

---

## Key Difference: Cart vs Order

|                               | Cart                    | Order                    |
| ----------------------------- | ----------------------- | ------------------------ |
| Sellers                       | Multiple                | One                      |
| Base date                     | Today (now)             | `order.created_at`       |
| `country_shipping_days` added | Once (to the final max) | Once (to the final max)  |
| Shipping days used            | Max across all items    | Max across order's items |

---

## Where `country_shipping_days` Comes From

It is stored in app settings under `starting-setting.shipping_duration_days`.

On the **client side**, this value is read from the Zustand store (`settings["starting-setting"].shipping_duration_days`).  
On the **server side**, it is fetched via `starttingSetting.shipping_duration_days`.

If this value is `0` or missing, only the product's `shipping_days` is used.

---

## Quick Checklist for Testers

- [ ] Add multiple products from different sellers to cart → expected delivery = longest `shipping_days` + country days
- [ ] Place an order → expected delivery is calculated from the order creation date, not re-calculated from today
- [ ] Check the "Ship accepted on [date]" label in the product marquee banner matches the product's own shipping days + country days
- [ ] Change country in settings → `country_shipping_days` should update and reflect in delivery dates
- [ ] If `shipping_days` is 0 for a product, the expected delivery = today + country days only
