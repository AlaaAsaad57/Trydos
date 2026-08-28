import { describe, expect, it, beforeEach } from "vitest";
import {
  SSRDetect,
  translateFunction,
  getUserChat,
  getUserStories,
  _isStoreLastJson,
  getConfiguredImage,
  RoundPrice,
  onClickSearchHistory,
} from "utils/functions";
import { useAppStore } from "store";
import { setCookie, COOKIE_NAMES } from "utils/cookies/cookie-manager";

describe("utils/functions.tsx module", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      userChat: null,
      userStories: null,
      currency: { exchange_rate: 1, decimal_digits: 2 } as any,
      language: "en",
    });
  });

  describe("SSRDetect", () => {
    it("returns true in jsdom environment", () => {
      expect(SSRDetect(), "SSRDetect should evaluate window availability").toBe(true);
    });
  });

  describe("translateFunction", () => {
    it("returns key directly when language is English or undefined", () => {
      expect(translateFunction("Cart"), "English key should return as is").toBe("Cart");
    });
  });

  describe("getUserChat & getUserStories", () => {
    it("getUserChat returns state userChat or empty object", () => {
      expect(getUserChat(), "default userChat should be {}").toEqual({});

      useAppStore.setState({ userChat: { id: "chat-1" } });
      expect(getUserChat(), "configured userChat should be returned").toEqual({ id: "chat-1" });
    });

    it("getUserStories returns store state or cookie fallback", () => {
      setCookie(COOKIE_NAMES.USER_DATA, { story_user_id: "story-123" });
      expect(getUserStories(), "cookie fallback should extract story_user_id").toEqual({ id: "story-123" });

      useAppStore.setState({ userStories: { id: "story-store" } });
      expect(getUserStories(), "store userStories should take precedence").toEqual({ id: "story-store" });
    });
  });

  describe("_isStoreLastJson", () => {
    it("returns boolean according to env variable", () => {
      expect(typeof _isStoreLastJson(), "_isStoreLastJson should return boolean").toBe("boolean");
    });
  });

  describe("getConfiguredImage", () => {
    it("replaces /upload with Cloudinary quality/format parameters on string URL", () => {
      const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      const result = getConfiguredImage({ src: url, height: 100, width: 100 });
      expect(result, "should inject height and width parameters into upload path").toContain("/upload/h_100,w_100");
    });

    it("handles image object with file_path", () => {
      const imgObj = { file_path: "https://media_server.com/image/upload/item.jpg" };
      const result = getConfiguredImage({ src: imgObj, height: 200, width: 200 });
      expect(result, "should process file_path from object").toContain("/upload/h_200,w_200");
    });

    it("returns empty string for invalid image src", () => {
      expect(getConfiguredImage({ src: null }), "null src should return empty string").toBe("");
    });
  });

  describe("RoundPrice", () => {
    it("rounds price with rate and decimal points", () => {
      useAppStore.setState({
        currency: { exchange_rate: 2, decimal_digits: 2 } as any,
      });

      const num = RoundPrice({ num: 50, returnNumber: true });
      expect(num, "50 * exchange_rate 2 should equal 100").toBe(100);
    });

    it("formats large numbers with K or M suffix", () => {
      const kPrice = RoundPrice({ num: 150000, rate: 1, returnNumber: false, language: "en" });
      expect(kPrice, "150,000 should format with K suffix").toBe("150K");

      const mPrice = RoundPrice({ num: 2500000, rate: 1, returnNumber: false, language: "en" });
      expect(mPrice, "2,500,000 should format with M suffix").toBe("2.5M");
    });
  });

  describe("onClickSearchHistory", () => {
    it("stores new search value into localStorage search-history without duplicates", () => {
      const res1 = onClickSearchHistory("shirts");
      expect(res1, "should add 'shirts' to history").toEqual(["shirts"]);

      const res2 = onClickSearchHistory("pants");
      expect(res2, "should prepend 'pants'").toEqual(["pants", "shirts"]);

      const res3 = onClickSearchHistory("SHIRTS");
      expect(res3, "duplicate 'SHIRTS' case-insensitive should not add duplicate entry").toEqual(["pants", "shirts"]);
    });
  });
});
