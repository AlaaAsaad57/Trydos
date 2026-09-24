import { describe, expect, it, vi, beforeEach } from "vitest";
import { wishlistService } from "services/wishlist";
import { fetchData } from "utils/fetchData";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

describe("Wishlist Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToWishlist", () => {
    it("posts product_id payload to /checklist endpoint", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await wishlistService.addToWishlist(500);

      expect(fetchData, "should post to /checklist").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/checklist",
          method: "POST",
          body: JSON.stringify({ product_id: 500 }),
          server: "market",
        }),
      );
    });

    it("throws error when API returns success: false", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item already in wishlist",
      });

      await expect(
        wishlistService.addToWishlist(500),
        "should throw when addition fails",
      ).rejects.toThrow("Item already in wishlist");
    });
  });

  describe("removeFromWishlist", () => {
    it("sends DELETE request to /checklist/:productId endpoint", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await wishlistService.removeFromWishlist("500");

      expect(fetchData, "should delete from /checklist/500").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/checklist/500",
          method: "DELETE",
          server: "market",
        }),
      );
    });
  });

  describe("getWishlist", () => {
    // One page of a two-page checklist, in the shape the shop really sends.
    //
    // Both backends answer with a standard Laravel paginator. There is no
    // `has_next`, no `page_size` and no `total_items` — the fixture this file
    // used to carry had `total_items`, which no backend has ever sent, and that
    // invented key is what let the "Load more" defect (BUG-1) sit unnoticed.
    // Keep these keys matching the real answer.
    const pageOneOfTwo = {
      data: [{ id: 1, name: "Watch", slug: "watch-1", image: "" }],
      current_page: 1,
      last_page: 2,
      per_page: 10,
      total: 12,
      next_page_url: "https://example.invalid/checklist?page=2",
      prev_page_url: null,
    };

    it("requests paginated wishlist items", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: pageOneOfTwo,
      });

      const response = await wishlistService.getWishlist(2);

      expect(fetchData, "should request page=2 with page_size=10").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/checklist?page=2&page_size=10",
          method: "GET",
        }),
      );
      expect(
        response.data,
        "should hand the shop's rows back untouched",
      ).toEqual(pageOneOfTwo.data);
    });

    // BUG-1. The shop never sends `has_next`, so the app has to work it out.
    // Both directions are checked: a wrong answer either way is a real fault —
    // `false` on a page that has a next one hides the rest of the checklist,
    // and `true` on the last page leaves a button that fetches nothing.
    it("says there is a next page when the shop says this is not the last one", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: pageOneOfTwo,
      });

      const response = await wishlistService.getWishlist(1);

      expect(
        response.has_next,
        "the shop said page 1 of 2, so there is a next page — reported as if there were none, which is what hides everything past the first ten saved products",
      ).toBe(true);
    });

    it("says there is no next page on the last one", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { ...pageOneOfTwo, current_page: 2, next_page_url: null },
      });

      const response = await wishlistService.getWishlist(2);

      expect(
        response.has_next,
        "the shop said page 2 of 2, so there is nothing after it — reported as if there were, which leaves a Load more button that fetches the same page again",
      ).toBe(false);
    });
  });

  describe("isInWishlist", () => {
    it("returns true when is_exist field is true", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { is_exist: true },
      });

      const inWishlist = await wishlistService.isInWishlist("500");
      expect(inWishlist, "should return true").toBe(true);
    });

    it("returns false when is_exist field is false", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { is_exist: false },
      });

      const inWishlist = await wishlistService.isInWishlist("500");
      expect(inWishlist, "should return false").toBe(false);
    });
  });
});

describe("wishlistService.removeFromWishlist — a refusal", () => {
  it("throws the market backend's message, or its own when there is none", async () => {
    vi.mocked(fetchData)
      .mockResolvedValueOnce({ success: false, message: "not in list" } as any)
      .mockResolvedValueOnce({ success: false } as any);
    await expect(wishlistService.removeFromWishlist("1"), "a refused removal did not throw").rejects.toThrow("not in list");
    await expect(wishlistService.removeFromWishlist("1"), "a bare refusal had no message").rejects.toThrow(
      "Failed to remove product from wishlist",
    );
  });
});
