// @vitest-environment node
//
// What a Seller Product ID is allowed to contain.
//
// The seller types this id by hand and it travels to the backend, into the
// lookups list, and back into the editor as a uniqueness check. A quote
// character in it breaks that round trip in ways that are hard to see from the
// screen: `it's-a-product` and `it’s-a-product` look the same in the box but
// are two different ids, and a backtick or a double quote lands in the middle of
// a value other systems have to quote again.
//
// So the box refuses those characters as they are typed, silently — the
// character simply never appears. There is no message, which is why every test
// here is about the VALUE that comes out, not about an error.
//
// Allowed: letters in ANY script (English, Arabic, Turkish, Kurdish, accented),
// digits in any script, hyphen and underscore. Nothing else.
import { describe, expect, it } from "vitest";

import { sanitizeSellerProductId } from "components/SellerDashboard/productEdit/helpers";

describe("the characters this ticket is about", () => {
  it.each([
    ['a double quote', 'ABC"123', "ABC123"],
    ["a single quote", "it's-a-product", "its-a-product"],
    ["a backtick", "`backtick`", "backtick"],
  ])("removes %s", (_label, typed, expected) => {
    expect(
      sanitizeSellerProductId(typed),
      `a ${_label} survived into the seller product id`,
    ).toBe(expected);
  });

  it("removes all three at once", () => {
    expect(
      sanitizeSellerProductId("a\"b'c`d"),
      "at least one quote character survived when all three were typed together",
    ).toBe("abcd");
  });

  it("removes the curly quotes a phone keyboard produces", () => {
    // A phone keyboard sends U+2018/U+2019/U+201C/U+201D, not the ASCII ones.
    // Blocking only the ASCII quotes would let the same problem straight in.
    expect(
      sanitizeSellerProductId("it’s “nice”"),
      "a curly quote survived, so a phone keyboard can still enter one",
    ).toBe("itsnice");
  });
});

describe("what a seller may still type", () => {
  it("keeps plain letters and digits", () => {
    expect(
      sanitizeSellerProductId("ABC123"),
      "an ordinary seller product id was changed",
    ).toBe("ABC123");
  });

  it("keeps a hyphen and an underscore", () => {
    // The common shapes for this field. Removing these would invalidate ids
    // sellers already use.
    expect(
      sanitizeSellerProductId("ABC-123_45"),
      "the hyphen or the underscore was removed, so an existing seller product id would no longer be accepted",
    ).toBe("ABC-123_45");
  });

  it("keeps Arabic letters and Arabic-Indic digits", () => {
    expect(
      sanitizeSellerProductId("منتج-٧٧"),
      "an Arabic seller product id was stripped, so an Arabic-speaking seller cannot enter one",
    ).toBe("منتج-٧٧");
  });

  it("keeps Turkish and Kurdish letters", () => {
    expect(
      sanitizeSellerProductId("TR-Ürün_Şeğer"),
      "a Turkish or Kurdish letter was stripped, so a seller in those languages cannot enter their own id",
    ).toBe("TR-Ürün_Şeğer");
  });
});

describe("everything else the field must not carry", () => {
  it.each([
    ["a space", "AB CD", "ABCD"],
    ["a slash", "A/B", "AB"],
    ["a dot", "C.D", "CD"],
    ["a comma", "E,F", "EF"],
    ["a backslash", "G\\H", "GH"],
    ["an angle bracket", "<script>", "script"],
    ["a semicolon", "I;J", "IJ"],
    ["a percent sign", "K%J", "KJ"],
  ])("removes %s", (_label, typed, expected) => {
    expect(
      sanitizeSellerProductId(typed),
      `${_label} survived into the seller product id`,
    ).toBe(expected);
  });
});

describe("values that are not text", () => {
  it.each([
    ["nothing typed yet", "", ""],
    ["a value the field never received", undefined, ""],
    ["a value the backend sent as null", null, ""],
  ])("turns %s into an empty id rather than throwing", (_label, input, expected) => {
    expect(
      sanitizeSellerProductId(input as any),
      `${_label} did not come back as an empty seller product id`,
    ).toBe(expected);
  });
});
