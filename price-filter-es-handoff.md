# Price Filter — What We Changed in Elasticsearch

_For the ES backend dev. Only the search/query part._

## The problem

The price slider and the price cards were built from just the **10 products on the current page**, because the search had **no price aggregation**. So:

- The slider couldn't reach the real lowest/highest price.
- Some price cards showed ranges with **no real products** (or wrong counts).

## What we did

We now ask Elasticsearch for the prices of **all matching products** (not one page), using normal **aggregations — no scripts**.

The price we filter by is the **offer price for the user's country**:

- use `country_offer_prices[country].offer_price` if the product has one for that country,
- otherwise use `offered_price` (or `unit_price`).

That price sits in two places (a nested per-country field and a normal field), so we read both and combine them in code to get:

- the slider's **min/max**,
- a **histogram** for the curve,
- **5 cards** that each hold about the same number of products (and never 0).

It's behind a flag (`LISTING_PRICE_AGG_ENABLED`); off = old behavior.

## How we did it — step by step

All of this is in `services/elastic/helpers.ts` (the query pieces) and
`services/elastic/elasticSearch.ts` (running them).

1. **Add a flag.** New env flag `LISTING_PRICE_AGG_ENABLED`. When it's off, nothing
   changes — the old page-based code runs. This is our safe on/off switch.

2. **Write the price aggregations.** We added small builder functions that ask ES
   two things about the price, each split in two parts (because the price lives in
   two fields):
   - **Stats** = lowest price, highest price, and count.
   - **Histogram** = how many products fall in each small price slice.
   - Part A reads the **nested** `country_offer_prices[country].offer_price`.
   - Part B reads the normal `offered_price` (for products with no country entry).

3. **Attach the stats to the main search.** When the filter panel asks for filters,
   we add the stats aggregation to that same search. ES then returns the price
   min/max/count for **all matching products** in one go. (For the panel we also set
   `size: 0` so it doesn't waste time fetching product rows it won't use.)

4. **Merge the two parts → slider bounds.** After the search, we read part A and
   part B and combine them: smallest of the two mins, largest of the two maxes, and
   add the counts. That gives the slider's real **min/max** and the **total**.

5. **Get the cards with a second small call.** A histogram needs to know the
   min/max first (to size its slices), so we make one more tiny `size: 0` search
   for the histogram. We merge its two parts by price slice → that's the **curve**.
   Then we walk the slices and cut them into **5 groups with roughly equal product
   counts** (splitting inside a slice when one slice is very crowded), and those
   become the **cards**.

6. **Send it to the UI.** We return one object — `{ min_price, max_price,
   priceRanges (cards), histogram (curve), total }` — which the slider, the curve,
   and the cards read directly. No more counting from the page.

(One more detail: all of the above is measured **within the user's current filters**
— including the price they picked — so the slider, curve, and cards always match
what they're looking at.)

## What we gained

- Slider shows the **real** lowest/highest price.
- Every card has **at least 1 product**, counts are correct.
- Works fast even with ~100k products (no scripts).

## What it affects

- When the filter panel is open, the search does one extra small aggregation call. Normal product scrolling is not affected.
- The filter uses the **offer price only**. Flashdeal and luck prices are **not** included (see below).

## Luck price — we ignore it (on purpose)

The luck price is **different for each user** (it depends on what they already redeemed). The price filter is **shared by everyone**, so we can't put a per-user price in it — it would be wrong for other users. So luck is left out.

## Flashdeal price — left out for now, but you can help us add it

Flashdeal price is the same for everyone (just time-limited), so it **could** be included. We couldn't do it from the query alone because, to get the real price per product per country, we'd need:

```
price = (flash active ? flash_deal_price : offered_price) + country extra
```

and the country data is stored in a way the query can't safely read for products that have **many countries**.

**What would let us add it:** please **save a ready-made price per country at index time**, so we can just read one field. Suggested:

- On each `country_offer_prices` entry, also store:
  - `effective_offer_price` = offer price **with** the country extra already added,
  - `effective_flash_price` = `flash_deal_price + country extra`.
- Add the same two as a default at the top level (for countries that have no entry).
- Keep the flash window fields (`flash_deal_status`, `start_date`, `end_date`) so we can decide "is the deal active right now?" at search time.

Then we read one field, pick flash-or-offer by the dates, and aggregate — fast, no scripts, and **no need to re-index** when a deal starts or ends.

**Please keep per-country prices in the nested `country_offer_prices`** — that's the part the query can read correctly. The flat `extra_price_for_country` can't be read reliably when a product has several countries, which is the main reason flashdeal + extra isn't possible today.
