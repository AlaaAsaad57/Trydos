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

  it("does not add a second https:// to a link typed with a capital HTTPS://", () => {
    const check = checkStoryLink("HTTPS://example.com");
    expect(check.link, "a capital HTTPS:// link got a second https:// in front").toBe("HTTPS://example.com");
    expect(check.valid, "a capital HTTPS:// link was refused").toBe(true);
  });

  it("drops spaces before and after the link, so the sent link has none", () => {
    const check = checkStoryLink("  example.com  ");
    expect(check.link, "the sent link kept the spaces around it").toBe("https://example.com");
    expect(check.valid, "a link with spaces around it was refused").toBe(true);
    expect(checkStoryLink("   ").empty, "a field of only spaces was not seen as empty").toBe(true);
  });

  // Each one was accepted before: the browser's URL parser takes all of them,
  // but none is a shop link a shopper can open.
  it.each([
    ["example.", "a host that ends in a dot with no ending after it"],
    ["example.com.", "a host that ends in a dot"],
    [".com", "a host that is only an ending"],
    ["example..com", "a host with an empty part"],
    ["-shop.com", "a host part that starts with a dash"],
    ["shop-.com", "a host part that ends with a dash"],
    ["sh_op.com", "a host with an underscore"],
    ["example.c", "an ending of one letter"],
    ["example.c0m", "an ending with a digit"],
    ["1.2", "a number, read as an IP address"],
    ["192.168.1.1", "an IP address"],
    ["https://[::1]/x.y", "an IPv6 address"],
    [`${"a".repeat(64)}.com`, "a host part over 63 characters"],
    ["http:/example.com", "http: with one slash"],
    ["https:/example.com", "https: with one slash"],
    ["ftp://example.com", "a scheme other than http or https"],
    ["mailto:a@b.com", "an email link"],
    ["trydos.com@evil.com", "a link with a user name before the host"],
    ["user:pw@example.com", "a link with a user name and password"],
    ["example.com/a b", "a link with a space inside"],
    ["example.com/a\tb", "a link with a tab inside"],
  ])('fails the link rule for "%s" (%s)', (bad, what) => {
    const check = checkStoryLink(bad);
    expect(check.isUrl, `${what} was called a link: "${bad}"`).toBe(false);
    expect(check.valid, `${what} was accepted: "${bad}"`).toBe(false);
  });

  it.each([
    ["example.com"],
    ["www.example.com/path?q=1"],
    ["shop.example.co.uk/sale"],
    ["https://example.com:8080/x"],
    ["http://ok.example.com"],
    ["مثال.com"],
    ["xn--mgbh0fb.com"],
    ["shop.example"],
  ])('still accepts the correct link "%s"', (good) => {
    const check = checkStoryLink(good);
    expect(check.isUrl, `a correct link was called not a link: "${good}"`).toBe(true);
    expect(check.valid, `a correct link was refused: "${good}"`).toBe(true);
  });
});
