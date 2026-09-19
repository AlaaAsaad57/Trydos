// BUG-1 — "Load more" never appeared, so a shopper never saw past their first
// ten saved products. Fixed; this file is what keeps it fixed.
//
// ---------------------------------------------------------------------------
// What is wrong
//
// `ChecklistView.tsx:41` decides whether to offer "Load more" like this:
//
//     setHasNext(result?.has_next ?? false);
//
// and `services/wishlist.ts` declares the answer as carrying `has_next`,
// `page_size` and `total_pages`. **No backend sends any of those three.** Both
// backends answer with a standard Laravel paginator:
//
//     current_page, first_page_url, from, last_page, last_page_url,
//     next_page_url, per_page, prev_page_url, to, total
//
// So `result.has_next` is always `undefined`, `?? false` turns that into
// `false`, and the button is never rendered. A shopper with eleven saved
// products can reach ten of them. Nothing throws and nothing is logged.
//
// ---------------------------------------------------------------------------
// How that was established — both backends, more than one page
//
// Checked on 2026-09-19 against staging, with twelve products saved so that a
// second page genuinely exists:
//
//   gateway (trydosv2)        last_page 2, next_page_url set, no `has_next`
//   core    (trydos_develop)  last_page 2, next_page_url set, no `has_next`
//
// The two-page part matters. An earlier reading was taken with a single page,
// where an absent `has_next` could equally have meant "false is omitted". With
// a real next page present and the key still absent, that explanation is gone.
//
// Both were asked because `/checklist` is served by two different servers
// depending on who is asking (`utils/server/tokenManager.ts:178-190`): the
// gateway for a guest, core for a verified shopper. A defect that only one of
// them had would be a different, smaller problem.
//
// ---------------------------------------------------------------------------
// Why the answer below is the real one, not a convenient one
//
// `answerFromTheShop` is the staging response with its rows replaced by
// generated ones. Its key set is copied exactly — including the absence of
// `has_next` — because the absence IS the defect. A fixture written from
// `services/wishlist.ts`'s type would contain `has_next` and this test would
// pass while the app stayed broken.
//
// ---------------------------------------------------------------------------
// The fix, and how this file was shown to cover it
//
// The fix is in `services/wishlist.ts`: `getWishlist` now works `has_next` out
// from `current_page` and `last_page` instead of reading a key that is never
// there. `ChecklistView` is unchanged, which is why one calculation fixes both
// places that ask — the first load and "Load more" itself.
//
// Seen red before the fix and green after it, in that order. The control case
// below stayed green throughout, which is what rules out the test and leaves
// the app: the screen drew all ten rows either way, and only the button was
// missing. Putting the old line back makes this file red again.
//
// **It is faked at `fetchData`, not at `wishlistService`.** An earlier version
// replaced the whole service, which stepped over the exact code the fix is in —
// it would have stayed red after a correct fix, for a reason that had nothing
// to do with the app. The boundary a test fakes has to sit outside the code it
// is judging.

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChecklistView from "components/setting/checklist/ChecklistView";
import { fetchData } from "utils/fetchData";

// Faked at `fetchData`, not at `wishlistService`.
//
// The defect lives across two files — the shop's answer has no `has_next`, and
// `getWishlist` hands the answer straight on — so a test that replaced
// `wishlistService` would have skipped over the very code that has to change.
// It would then have stayed red after a correct fix, and red for a reason that
// had nothing to do with the app. Faking the request instead means the real
// service runs on the real answer.
vi.mock("utils/fetchData", () => ({ fetchData: vi.fn() }));

/** Ten rows, which is one full page. The rows themselves are not the point —
 *  what they prove is that the screen has something to draw, so an absent
 *  "Load more" cannot be explained by an empty list. */
const tenRows = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: `Saved product ${index + 1}`,
  slug: `saved-product-${index + 1}`,
  image: "",
}));

/** Page one of a two-page checklist, exactly as staging answers it.
 *
 *  Twelve saved products, ten on this page, a second page waiting. Every key
 *  here came off the real response; nothing has been added, and — the point of
 *  the whole file — nothing that was missing has been filled in. */
const answerFromTheShop = {
  current_page: 1,
  data: tenRows,
  first_page_url: "https://example.invalid/api/v1/checklist?page=1",
  next_page_url: "https://example.invalid/api/v1/checklist?page=2",
  prev_page_url: null,
  last_page_url: "https://example.invalid/api/v1/checklist?page=2",
  last_page: 2,
  per_page: 10,
  from: 1,
  to: 10,
  total: 12,
};

/** Rows on screen.
 *
 *  Read with a plain query rather than `getByTestId`, because this suite's
 *  testing-library is not pointed at `data-pw` — it looks for `data-testid`,
 *  which this app does not use. The browser suite is pointed at `data-pw` in
 *  `playwright.config.ts`; this one is not, and a `getByTestId` here silently
 *  finds nothing and reports it as "the screen drew no rows". */
const rowsOnScreen = (): Element[] =>
  Array.from(document.querySelectorAll('[data-pw="checklist-item"]'));

/** The "Load more" button, or `null` when the screen is not offering one. */
const loadMoreButton = (): Element | null =>
  document.querySelector('[data-pw="checklist-load-more"]');

describe("the checklist screen, when the shopper has more than one page saved", () => {
  beforeEach(() => {
    vi.mocked(fetchData).mockReset();
    // The envelope `fetchData` resolves to: the backend body, with the
    // paginator under `data`. `getWishlist` reads `data?.data`.
    vi.mocked(fetchData).mockResolvedValue({
      success: true,
      data: answerFromTheShop,
    } as never);
  });

  it("draws the first page, so an absent button is not an empty list", async () => {
    render(<ChecklistView isRtl={false} language="en" local="sy-en" />);

    await waitFor(() =>
      expect(
        rowsOnScreen(),
        "the checklist screen drew none of the ten saved products the shop sent, so nothing below is about pagination",
      ).toHaveLength(10),
    );
  });

  // BUG-1. Red before the fix, green after it.
  it(
    "offers Load more, although the shop's answer has no has_next key",
    async () => {
      render(<ChecklistView isRtl={false} language="en" local="sy-en" />);

      await waitFor(() =>
        expect(rowsOnScreen()).toHaveLength(10),
      );

      expect(
        loadMoreButton(),
        "the checklist screen offers no way to reach page 2, although the shop " +
          "said there are 12 saved products over 2 pages and sent a " +
          "next_page_url — ChecklistView.tsx:41 reads `has_next`, which neither " +
          "the gateway nor core sends, so the button is never rendered",
      ).not.toBeNull();
    },
  );
});
