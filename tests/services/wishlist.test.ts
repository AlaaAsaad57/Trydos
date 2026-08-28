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
    it("requests paginated wishlist items", async () => {
      const mockData = {
        data: [{ id: 1, name: "Watch" }],
        current_page: 1,
        total_items: 1,
      };
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: mockData,
      });

      const response = await wishlistService.getWishlist(2);

      expect(fetchData, "should request page=2 with page_size=10").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/checklist?page=2&page_size=10",
          method: "GET",
        }),
      );
      expect(response, "should return wishlist data object").toEqual(mockData);
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
