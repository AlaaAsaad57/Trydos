# Search — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Text search, filters, suggestions, history and popular terms work. Image search calls a retired AI model, and a debug message shows to shoppers on every search of two or more words.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
The shopper taps the search icon in the home header (`SearchIcon`, mounted in `components/Home/CategoryHomeView.tsx`). An overlay opens and the store flag `enable_search` turns on.
The shopper types, speaks, or sends a photo. The overlay shows products, brands, categories and boutiques.
The Search button or the Enter key opens the full results page `/[lang]/filters?search=...` (the listing section owns that page).
The mobile app uses the same engine through `GET /api/products/searchInCatalog`.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Shopper taps the search icon → overlay opens, page scroll locks, store flag `enable_search` turns on | none | `components/Home/Search/SearchIcon.tsx` (click handler, `setEnableSearch`) | `tests/components/Home/Search/SearchIcon.test.tsx`; e2e "search finds products" (`tests/e2e/guest.live.spec.ts`) |
| W-2 | Overlay opens → past search words show from the browser (`localStorage` key `search-history`) | none (browser only) | `SearchIcon.tsx` (first effect), `SearchHistory.tsx` | `SearchHistory.test.tsx`, `SearchIcon.test.tsx` |
| W-3 | Shopper taps a past word → the word fills the box and the search runs | Elasticsearch | `SearchHistory.tsx`, `SearchIcon.tsx` | `SearchHistory.test.tsx` |
| W-4 | Shopper removes one past word (X), or taps Clear All → the words leave the screen and the storage | none | `SearchHistory.tsx`, `SearchIcon.tsx` `deleteOption` | `SearchHistory.test.tsx` (BUG-home-3, BUG-home-4 guards) |
| W-5 | Overlay opens → "Popular Search" shows the 10 most searched words with counts | Elasticsearch (`search_logs` index) | `services/search.ts` → `app/api/products/popular-search/route.ts` → `getPopularSearchTerms` (`services/elastic/helpers.ts`) | `SearchTrending.test.tsx`, `tests/app/api/products/popular-search/route.test.ts`, `tests/services/search.test.ts` |
| W-6 | Shopper taps a popular word → the word fills the box and the search runs | Elasticsearch | `SearchTrending.tsx` | `SearchTrending.test.tsx` |
| W-7 | Shopper types → after a 1.5 s pause the overlay shows up to 20 products, plus brands, categories and boutiques | Elasticsearch (`products_catalog` index) | `SearchIcon.tsx` `performSearch` → `GetSearchData` (`serverRequests/Search.tsx`) | `SearchIcon.test.tsx`, `tests/serverRequests/Search.test.ts`; e2e "search finds products" |
| W-8 | Shopper types fast → only the newest answer is shown; a late older answer is dropped | none | `SearchIcon.tsx` (`latestRequestRef`) | `SearchIcon.test.tsx` |
| W-9 | Shopper types → grey "ghost" text completes the product name; Tab or Right Arrow accepts it | Elasticsearch | `SearchIcon.tsx` `fetchSuggestion` → `GetSearchSuggestion` | `SearchIcon.test.tsx`, `tests/serverRequests/Search.test.ts` |
| W-10 | Shopper taps a brand, category or boutique → it becomes a filter (marked with an icon), and results run again with the filter | Elasticsearch | `SearchIcon.tsx` `toggleFilter`. The "Mock implementation" comment at line 578 is an old comment only; the code is real. | `SearchIcon.test.tsx` |
| W-11 | Shopper picks a parent category → its children leave the filter, and the other way round | none | `SearchIcon.tsx` `toggleFilter` | `SearchIcon.test.tsx` |
| W-12 | A category is active → "Related Categories" shows; a tap adds one | Elasticsearch | `SearchIcon.tsx`, `processRelatedCategories` | `SearchIcon.test.tsx` (BUG-home-8 guard) |
| W-13 | Shopper taps Load More on brands, categories or boutiques → 10 more items come, with the same filters | Elasticsearch | `SearchIcon.tsx` `handleLoadMore` | `SearchIcon.test.tsx` (BUG-home-7 guard) |
| W-14 | Shopper taps a product result → product page opens, the word is saved to history, GA `search` event fires | none | `Results/ProductItem.tsx` | `ProductItem.test.tsx`, `SearchIcon.test.tsx` |
| W-15 | The Search button shows "(Total Products: N)" and opens `/[lang]/filters/...?search=` with the filters | none | `SearchIcon.tsx` `pageUrl`, `ActiveSearchFilterBar.tsx` | `SearchIcon.test.tsx`, `ActiveSearchFilterBar.test.tsx` |
| W-16 | Shopper presses Enter → the same filters page opens | none | `SearchIcon.tsx` `handleKeyDown` | `SearchIcon.test.tsx` |
| W-17 | Reset button, or reset in the filter bar → the word and all filters clear | none | `SearchIcon.tsx`, `ActiveSearchFilterBar.tsx` | `SearchIcon.test.tsx`, `ActiveSearchFilterBar.test.tsx` (BUG-home-2 guard) |
| W-18 | X icon clears the word first; a second tap (or the side close icon) closes the overlay and unlocks the scroll | none | `SearchIcon.tsx` `handleClose` | `SearchIcon.test.tsx` |
| W-19 | Search of 2+ words → AI reads colour, size and product name from the text and adds them as filters | Gemini (`GEMINI_SEARCH_MODEL`, default `gemini-2.5-flash-lite`) + Redis (allowed colours and sizes) | `services/elastic/analyzeSearchText.ts`, `serverRequests/Search.tsx` | `tests/services/elastic/analyzeSearchText.test.ts`, `tests/serverRequests/Search.test.ts` |
| W-20 | AI is slow, refused or over quota → the search still runs on the raw text (6 s limit, `SEARCH_ANALYZE_TIMEOUT_MS`) | Gemini | `analyzeSearchText.ts` (deadline, 429 case), `serverRequests/Search.tsx` catch | `analyzeSearchText.test.ts`, `Search.test.ts` |
| W-21 | Shopper taps the mic → records up to 8 s with a countdown → the text fills the box and the search runs | AssemblyAI (`ASSEMBLYAI_API_KEY`, `ASSEMBLYAI_BASE_URL`) | `SearchVoice.tsx` → `app/api/speech-recognition/route.ts` | `SearchVoice.test.tsx`, `tests/app/api/speech-recognition/route.test.ts` |
| W-22 | AssemblyAI hears nothing or fails → the browser's own speech recogniser (en/ar/tr) fills the box | browser Web Speech API | `SearchVoice.tsx` `fallbackOrToast` | `SearchVoice.test.tsx` |
| W-23 | Microphone refused, or the browser cannot record → the shopper sees a translated message | none | `SearchVoice.tsx` | `SearchVoice.test.tsx` |
| W-24 | A search of 3+ characters that finds products is logged once per user / IP / browser | Elasticsearch (`search_logs` index) | `logSearchTerm` (`services/elastic/helpers.ts:2879`) | `Search.test.ts` |
| W-25 | QA test products stay hidden in search, unless the request is in QA mode | Elasticsearch | `serverRequests/Search.tsx` (`qaMode`) | e2e QA-01, QA-02, QA-02b, QA-09 (`tests/e2e/qaLock.live.spec.ts`) |
| W-26 | Mobile app calls `GET /api/products/searchInCatalog` → products, filters and a ghost-text suggestion | Elasticsearch, Gemini | `app/api/products/searchInCatalog/route.ts` | `tests/app/api/products/searchInCatalog/route.test.ts` |
| W-27 | The overlay is translated (en/ar/tr/ku) and right-to-left for ar and ku | none | `SearchIcon.tsx`, `SearchTrending.tsx`, `ProductItem.tsx` | `SearchIcon.test.tsx` (ar, ku cases) |

## ⚠️ Works, with limits
- **L-1** Every pause in typing sends **two** server calls: `GetSearchData` and `GetSearchSuggestion`. Each Load More runs the AI step again for the same text. So AI cost grows with typing, not with real searches.
- **L-2** The first open of the overlay runs a full product search, and the screen throws the products away. `GetSearchData` takes `noProducts` but never uses it (`serverRequests/Search.tsx:149`).
- **L-3** Search history is saved only when the shopper taps a product result or a past word. Enter and the Search button do **not** save the word.
- **L-4** Search history has no size limit. A repeated word does not move to the front (`onClickSearchHistory` in `utils/functions.ts`).
- **L-5** Popular words are the same for every country and every language. There is no time window, so old words stay on top.
- **L-6** Voice search: AssemblyAI does not support Kurdish. A Kurdish speaker is transcribed as the nearest language. The browser fallback has no Kurdish either.
- **L-7** The voice route polls AssemblyAI up to 60 times, once per second. A slow transcript can keep the shopper waiting about 1 minute.
- **L-8** The overlay shows only the first 20 products. More products need the Search button (listing page).
- **L-9** A search with a `%` sign (for example "100% cotton shirt") makes `decodeURIComponent` throw (`analyzeSearchText.ts:91`). The search still runs on the raw text, but without the AI step.
- **L-10** GA gets empty `item_id` and `search_results_ids` on a product tap. `GetSearchData` does not return `product_id`, and it returns `categroy` (typo) instead of `category`.
- **L-11** Elasticsearch lags the backend by a few seconds. A product saved a moment ago may not show yet. This is normal.
- **L-12** `logSearchTerm` is not awaited, and it re-throws on error. A failed log becomes an unhandled promise rejection on the server. The shopper does not see it.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | The raw AI result shows as a success toast on every search of 2+ words. On AI failure, the error text shows as a "success" toast. | A green toast like `{"name":"shirt","color":["#000000"],"analyzeTime":812,"model":"gemini-2.5-flash-lite"}`, or "AI quota reached — not a bug (Gemini rate limit)" | `components/Home/Search/SearchIcon.tsx:183`. The unit test asserts this as wanted (`SearchIcon.test.tsx:191`). | Frontend | Yes — internal debug data, in English, shown to every shopper |
| M-2 | Image search uses the model `gemini-1.5-flash`. Google retired Gemini 1.5 Flash on 24 Sep 2025. | Every photo search fails with "Internal server error" | `app/api/image-search/route.ts:62` | Frontend | Yes — the camera button shows in every search; change the model or hide the button |
| M-3 | `/api/image-search` and `/api/speech-recognition` have no sign-in check, no rate limit and no upload size check in code. Each call costs money (Gemini, AssemblyAI). | Nothing; the risk is cost and abuse | `app/api/image-search/route.ts`, `app/api/speech-recognition/route.ts` | Ops / Frontend | Yes — needs a Vercel Firewall rule or a limiter |
| M-4 | The Elasticsearch index names fall back to the staging names (`_develop`) when the `ELASTIC_*_INDEX` environment values are not set. They are not set anywhere yet. This includes the catalog and the search log. | Production would read and write the development indexes until the values are set | `services/elastic/INDEXES.ts`, `.env.example` (`ELASTIC_CATALOG_INDEX`, `ELASTIC_SEARCH_LOG_INDEX`) | Ops / Backend | Yes — production needs its own indexes |
| M-5 | Popular words have no blocklist. The check is a placeholder (`isBlacklisted = false`). QA and test searches are logged too. | Rude, test or QA words can appear under "Popular Search" for every shopper | `services/elastic/helpers.ts:2891` | Frontend / Product | Yes — public text with no moderation |
| M-6 | The search log stores IP, user agent and user id, with no retention rule | Nothing visible | `services/elastic/helpers.ts` `logSearchTerm` | Product / Ops | Yes — needs a privacy-policy line and a retention period |
| M-7 | Image search asks Gemini for a Turkish answer when the language is Kurdish (`ku`) | Kurdish shoppers get a Turkish search word | `app/api/image-search/route.ts:76` | Frontend | No |
| M-8 | Image search errors from the route ("No product detected", "Internal server error", "Invalid file type") are not in the translation files | English error text for ar/tr/ku shoppers | `app/api/image-search/route.ts`; shown by `SearchImage.tsx:104` | Frontend | No |
| M-9 | The image route sends the raw error message to the browser (`details: error.message`). The voice route does the same. | Provider error text in the response | `app/api/image-search/route.ts:142`, `app/api/speech-recognition/route.ts` | Frontend | No |
| M-10 | "Clear All" in the open Popular Search list only clears the search box, and the box is already empty there | The button does nothing | `SearchIcon.tsx:674` | Frontend | No |
| M-11 | `limit` on `searchInCatalog` has no upper cap. A caller can ask for thousands of full products, and every text call can run the AI. | Slow answers under abuse | `app/api/products/searchInCatalog/route.ts:69` | Frontend | No — add a cap together with M-3 |
| M-12 | Voice polling sends `Authorization: Bearer <key>`. Upload and transcript send the bare key. | If AssemblyAI refuses the Bearer form, every voice search falls back to the browser recogniser | `app/api/speech-recognition/route.ts:127` | Frontend | No — confirm with one live call |
| M-13 | Image search uses the old SDK `@google/generative-ai` 0.21. The text analyser already calls the REST API directly. | Nothing now | `package.json`, `app/api/image-search/route.ts` | Frontend | No |

## 🔒 Must do before launch
- [ ] Remove the debug toast at `SearchIcon.tsx:183`, and change `SearchIcon.test.tsx:191` with it (M-1).
- [ ] Move image search to a live Gemini model (an env value, like `GEMINI_SEARCH_MODEL`), or hide the camera button (M-2).
- [ ] Add a rate limit (Vercel Firewall rule or an edge limiter) and a body size limit for `/api/image-search` and `/api/speech-recognition` (M-3).
- [ ] Set the `ELASTIC_*_INDEX` values in the production environment, and point them at production indexes (M-4).
- [ ] Add a blocklist, and keep QA traffic out of the search log, before "Popular Search" goes public (M-5).
- [ ] Decide how long IP and user agent stay in the search log, and add it to the privacy policy (M-6).
- [ ] Set in production: `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `ASSEMBLYAI_BASE_URL`, and the Elasticsearch connection values. The voice route breaks with no `ASSEMBLYAI_BASE_URL`, because the code checks only the key.

## ❓ Needs confirmation from the backend team
- Which Elasticsearch cluster and which index names will production use? Who creates the production `search_logs` index?
- Does the backend sync product changes into the production catalog index with the same lag as staging (a few seconds)?
- Who owns the Gemini and AssemblyAI billing accounts, and what are the monthly quotas?

## 🧪 Tests that cover this section
- Unit (Vitest):
  - `tests/components/Home/Search/SearchIcon.test.tsx`, `SearchHistory.test.tsx`, `SearchTrending.test.tsx`, `SearchImage.test.tsx`, `SearchVoice.test.tsx`, `ActiveSearchFilterBar.test.tsx`
  - `tests/components/Home/Search/Results/ProductItem.test.tsx`, `BrandItem.test.tsx`, `CategoryItem.test.tsx`, `BoutiqueItem.test.tsx`
  - `tests/serverRequests/Search.test.ts`, `tests/services/elastic/analyzeSearchText.test.ts`, `tests/services/search.test.ts`
  - `tests/app/api/image-search/route.test.ts`, `tests/app/api/speech-recognition/route.test.ts`, `tests/app/api/products/popular-search/route.test.ts`, `tests/app/api/products/searchInCatalog/route.test.ts`
  - Bug guards (plain `it`, green): BUG-home-2, BUG-home-3, BUG-home-4, BUG-home-7, BUG-home-8. There are no `it.fails` markers in this section.
- E2E (Playwright, staging): "search finds products" (`tests/e2e/guest.live.spec.ts`; it searches one word, so the AI step never runs); QA-01, QA-02, QA-02b, QA-09 (`tests/e2e/qaLock.live.spec.ts`).
- **No test** for:
  - image search against the real Gemini model. The unit test mocks the SDK, so it stays green with a retired model;
  - voice search against the real AssemblyAI;
  - the AI step on staging (no e2e search with 2+ words);
  - the content of popular words, and search logging on staging.
- `SearchIcon.test.tsx:184` asserts the debug toast as correct. It must change with M-1.
