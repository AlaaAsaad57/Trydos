import { describe, expect, it } from "vitest";

import { MAX_STORY_LINK_LENGTH, checkStoryLink } from "utils/storyLink";

// The one set of link rules for a new story, used by the shopper's Add Story
// widget and by the seller dashboard. The two rules are judged apart, so the
// form can say "bad AND too long" instead of hiding one behind the other.

// "https://shop.example.com/" is 25 characters; the rest pads to the length.
const linkOf = (length: number) => `https://shop.example.com/${"a".repeat(length - 25)}`;

describe("checkStoryLink", () => {
  it("treats an empty link as fine, because the link is optional", () => {
    const check = checkStoryLink("");
    expect(check.empty, "an empty field was not seen as empty").toBe(true);
    expect(check.valid, "an empty link blocked the story").toBe(true);
  });

  it("passes a bare domain on both rules", () => {
    const check = checkStoryLink("example.com");
    expect(check.isUrl, "example.com was called not a link").toBe(true);
    expect(check.isShort, "example.com was called too long").toBe(true);
    expect(check.valid, "example.com was refused").toBe(true);
  });

  it("fails only the link rule for a word with no dot, or a host with a space", () => {
    for (const bad of ["localhost", "https://a b.com"]) {
      const check = checkStoryLink(bad);
      expect(check.isUrl, `"${bad}" was called a link`).toBe(false);
      expect(check.isShort, `"${bad}" was called too long`).toBe(true);
      expect(check.valid, `"${bad}" was accepted`).toBe(false);
    }
  });

  it("fails only the length rule for a correct link over the limit", () => {
    const check = checkStoryLink(linkOf(MAX_STORY_LINK_LENGTH + 1));
    expect(check.isUrl, "a correct but long link was called not a link").toBe(true);
    expect(check.isShort, "a link over the limit was called short enough").toBe(false);
    expect(check.valid, "a link over the limit was accepted").toBe(false);
  });

  it("accepts a link of exactly the limit", () => {
    const check = checkStoryLink(linkOf(MAX_STORY_LINK_LENGTH));
    expect(check.isShort, "a link of exactly the limit was called too long").toBe(true);
    expect(check.valid, "a link of exactly the limit was refused").toBe(true);
  });

  it("fails both rules for a link that is bad and too long", () => {
    const check = checkStoryLink(`https://a b.com/${"a".repeat(MAX_STORY_LINK_LENGTH)}`);
    expect(check.isUrl, "a bad long link was called a link").toBe(false);
    expect(check.isShort, "a bad long link hid that it is also too long").toBe(false);
  });

  it("counts the https:// it adds, because that is the link it sends", () => {
    const typed = "a".repeat(MAX_STORY_LINK_LENGTH - "https://.com".length + 1) + ".com";
    const check = checkStoryLink(typed);
    expect(check.link, "the link to send did not get https://").toBe(`https://${typed}`);
    expect(check.length, "the count left out the https:// it adds").toBe(MAX_STORY_LINK_LENGTH + 1);
    expect(check.isShort, "a link that is over the limit once sent was called short enough").toBe(false);
  });

  it("keeps a link that already has http:// or https:// as typed", () => {
    expect(checkStoryLink("http://ok.example.com").link, "an http link was changed").toBe("http://ok.example.com");
    expect(checkStoryLink("https://ok.example.com").link, "an https link was changed").toBe("https://ok.example.com");
  });
});
