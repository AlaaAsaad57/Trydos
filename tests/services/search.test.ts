import { describe, expect, it, vi, beforeEach } from "vitest";
import searchService from "services/search";
import { fetchData } from "utils/fetchData";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/functions", () => ({
  LogError: vi.fn(),
}));

describe("Search Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTrendingSearch", () => {
    it("fetches popular search terms from /api/products/popular-search", async () => {
      const mockResponse = {
        success: true,
        data: ["Shoes", "Watches", "Bags"],
      };
      vi.mocked(fetchData).mockResolvedValueOnce(mockResponse);

      const result = await searchService.getTrendingSearch();

      expect(fetchData, "should request /api/products/popular-search from local server").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/products/popular-search",
          method: "GET",
          server: "local",
        }),
      );
      expect(result, "should return popular search terms response").toEqual(mockResponse);
    });

    it("returns null and logs error when request fails", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Popular searches unavailable",
      });

      const result = await searchService.getTrendingSearch();
      expect(result, "should return null on failure").toBeNull();
    });
  });
});
