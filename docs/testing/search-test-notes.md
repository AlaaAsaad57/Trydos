# Search - notes for testing

Quick notes on how search works, so you know what to try. The code is in
`services/elastic/helpers.ts` (the query), `services/elastic/analyzeSearchText.ts`
(the color/size analyzer) and `serverRequests/Search.tsx` (the search box).

## What we search in

The text you type is matched against these fields, in English and Arabic:

- product name (strongest match)
- product slug
- product descriptors and labels
- product "similar words" (extra words the admin added to the product)
- product details / description (weak match)
- category name
- brand name
- color "similar words" (so "red" or "احمر" can find red products)

Search only shows products that are active and approved, not deleted, and allowed in
your country. The brand, category and boutique of the product must be active too.

## The color / size analyzer

It runs only when the text has more than one word. One word = no analyzer.

How it works:
1. We get the list of allowed colors and sizes from the backend.
2. We send the text plus these lists to Gemini. Gemini gives back
   `{ name, color, size }`.
3. `name` replaces the search text. `color` and `size` are added as filters, on top
   of any filters you already picked.
4. A size that is not in the allowed list is dropped, so the search does not come
   back empty because of a wrong size.

Example: "black shirt xxl" -> search "shirt", color black, size XXL.

If the analyzer fails or is slow (more than 6 seconds), the search still runs with
the text as you typed it, and a red toast shows: "We could not read the color and
size from your search. Showing results for your words." (in the 4 languages).

## Trending and history

When you open the search box (before you type), you see two rows:

- **Trending:** the top 10 most searched words for all users. Tap the trending icon
  to open the full list, each word shows how many times it was searched. Tap a word
  and it goes into the box and searches.
- **History:** your own recent searches. A word is added when you run a search or tap
  a product in the results. The newest is first. The same word is not added twice
  (case does not matter). Each word has an × to delete it, and "Clear All" deletes
  all. Tap a word and it searches again.

History is saved in the browser only. It is not linked to your account, so another
device or another browser has a different history. Clearing browser data clears it.

## Search by image

The camera icon shows when the search box is empty.

- on desktop you get a small menu: "From Camera" or "From Files"
- on mobile it opens the phone camera / file picker
- after you pick a photo you crop it, then it is searched
- we send the photo to Gemini, it describes the product in max 5 words
  (like "T-shirt black xxl")
- that text goes into the search box and the search runs. Because the text has more
  than one word, the color/size analyzer also runs on it
- formats: jpeg, png, jpg, webp, svg, avif
- if there is no product in the photo, or the format is wrong, you see a message

## Search by voice

The mic icon also shows when the search box is empty.

- tap the mic, it records up to 8 seconds with a countdown ring. Tap again to stop early
- the recording is turned into text (English, Arabic, Turkish). Kurdish is not supported
- the text goes into the search box and the search runs
- the browser also listens at the same time. If the main service fails, the app uses
  the browser text
- if you block the mic you see a message. If the browser does not support recording,
  the mic icon is grey
- if nothing was understood you see "try again with clear voice"

## Other things in the search box

- results show about 1.5 seconds after you stop typing
- max 90 characters
- grey autocomplete after the cursor with a product name. Tab, or right arrow at the
  end, accepts it
- results are grouped: products, brands, categories, boutiques
- brands / categories / boutiques load 10 at a time with "Load More"
- tap a brand / category / boutique in the results and it becomes a filter
- Enter or the "Search" button (shows the total count) opens the full results page
- Reset clears the text and filters
- when the box is empty you see the image search and voice search icons

## Cases to test

Basic search
- search a product by its full name -> the product shows first
- search a product by its Arabic name -> it shows
- search a brand name ("Nike") -> products of that brand show, and the brand shows in the brands row
- search a category name ("dresses") -> products of that category show
- search a color word ("red", "احمر") -> red products show
- search something that does not exist -> "no results" shows

Color / size from the text
- "black shirt" -> black shirts show, black is picked as a color filter
- "black shirt xxl" -> black + XXL filters are picked, results match both
- "red dress medium" -> size M is picked
- "قميص اسود" -> black is picked
- pick a color filter first, then search "white shirt" -> both colors are kept
- "علبة بنسلين 100 ملجم" -> results still show (no wrong size filter)
- "black shirt" works normally -> no toast
- one word ("shirt") -> no toast

Products that must not show
- a new product that is not approved yet
- a product whose brand is disabled
- a product whose category is disabled
- a product whose boutique is disabled
- a deleted product
- a product that is not sold in your country

Filters with text
- pick a category, then type text -> only products from that category show
- pick a brand, then type text -> only that brand
- set a price range, then type text -> all prices are inside the range
- tap a brand in the results -> it becomes a filter and results update
- Reset -> text and filters are cleared

Search box
- autocomplete: type "sh", grey text shows a product name, press Tab -> the box gets the full name
- paste a very long text -> the box stops at 90 characters
- type fast and change the word -> the results are for the last word only
- "Load More" on brands -> 10 more show, the button is gone when there are no more
- press Enter -> the full results page opens with the same text and filters
- the count on the "Search" button = the number of products on the results page

Image search
- take a photo of a shoe -> crop shows, then "shoe" products show
- upload a photo of a black t-shirt from files -> the box gets a text like "black t-shirt", black products show
- upload a png and a webp -> both work
- upload a photo with no product (a wall, the sky) -> a "no product" message shows
- upload a pdf or a video -> a wrong format message shows
- type something in the box -> the camera and mic icons hide

Voice search
- tap the mic and say "black shoes" -> the text shows in the box and results show
- say a product name in Arabic -> Arabic text shows and results show
- tap the mic, then tap again after 2 seconds -> recording stops and it searches
- tap the mic and say nothing -> after 8 seconds, "try again with clear voice" shows
- block the mic in the browser, then tap the mic -> a permission message shows

Trending
- open the search box -> the trending row shows
- tap the trending icon -> the "Popular Search" list opens, and each word has a number with a small search icon next to it (how many times people searched that word)
- tap the trending icon again -> the list closes back to one row
- tap a trending word -> it goes into the box and results show

History
- search "shoes" -> "shoes" is first in history
- search "Shoes" again -> no second "shoes" in history
- tap a product in the results -> that search is saved in history
- tap × on one word -> only that word is removed
- "Clear All" -> history is empty
- tap a history word -> it searches again
- close and open the browser -> history is still there
- open the site in another browser -> history is different
