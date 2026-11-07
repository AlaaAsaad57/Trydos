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

  describe("getSearchHistory", () => {
    it("reads the words from the local route, with no toast", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true, data: { terms: ["shoes"] } });

      const result = await searchService.getSearchHistory();

      expect(fetchData, "should read /api/search/history quietly").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/search/history",
          method: "GET",
          server: "local",
          noMessage: true,
        }),
      );
      expect(result, "should return the words").toEqual(["shoes"]);
    });

    it("answers null, not an empty list, when the read fails", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: false });

      expect(await searchService.getSearchHistory(), "a failed read looked like an empty history").toBeNull();
    });
  });

  describe("logSearch", () => {
    it("sends the settled word and its count, with no toast", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await searchService.logSearch("shoes", 4);

      expect(fetchData, "should send POST with the word and the count").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/search/history",
          method: "POST",
          server: "local",
          body: JSON.stringify({ term: "shoes", products_count: 4 }),
          noMessage: true,
        }),
      );
    });
  });

  describe("removeSearchHistory", () => {
    it("sends the removal in the body and reports that it worked", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      const result = await searchService.removeSearchHistory({ term: "shoes" });

      expect(fetchData, "should send DELETE with the word").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/search/history",
          method: "DELETE",
          server: "local",
          body: JSON.stringify({ term: "shoes" }),
        }),
      );
      expect(result, "a removal that worked did not answer true").toBe(true);
    });

    it("answers false when the server did not remove the word", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: false });

      expect(await searchService.removeSearchHistory({ all: true }), "a failed removal looked done").toBe(false);
    });
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
