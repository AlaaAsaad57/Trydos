import { describe, expect, it } from "vitest";
import { nameStyle, sentenceStyle, titleStyle } from "components/DemoApp1/demoCase";

// The capital rule of Home, the store page and the product page (Apple's
// title and sentence styles). Each case is one line the pages show.
describe("demo capitals — title style", () => {
  const cases: [string, string][] = [
    ["made in turkey", "Made in Turkey"],
    ["all {name} collection now !", "All {name} Collection Now !"],
    ["{count} item {size} in your bag", "{count} Item {size} in Your Bag"],
    ["<m>recommend it by</m> {count} buyer", "<m>Recommend It by</m> {count} Buyer"],
    ["<m>just {days} days</m> In your hands", "<m>Just {days} Days</m> in Your Hands"],
    ["<b>in {hours} hours</b> shipping If buy in <m>{minutes} minute</m>", "<b>In {hours} Hours</b> Shipping If Buy in <m>{minutes} Minute</m>"],
    ["<b>2.jun</b> in lebanon", "<b>2.Jun</b> in Lebanon"],
    ["Monday <m>2.jun </m>| <m>3</m> work days in your hands in <m>Lebanon</m>", "Monday <m>2.Jun </m>| <m>3</m> Work Days in Your Hands in <m>Lebanon</m>"],
    ["<m>AI</m> analysis & summary of all reviews", "<m>AI</m> Analysis & Summary of All Reviews"],
    ["<b>a</b> {name}", "<b>A</b> {name}"],
    ["Watch. Shop. Share. See it. Tag It !", "Watch. Shop. Share. See It. Tag It !"],
    ["comment . Video . Photo . May help you !", "Comment . Video . Photo . May Help You !"],
    ["Need help ? Start Chat about this product !", "Need Help ? Start Chat About This Product !"],
    ["Good quality | Ture size", "Good Quality | Ture Size"],
    ["18 feb", "18 Feb"],
    ["{n}d", "{n}d"],
    ["don’t recommend it", "Don’t Recommend It"],
    ["Product FAQ Buyer & Seller", "Product FAQ Buyer & Seller"],
    ["Expected Shipping & delivery Date", "Expected Shipping & Delivery Date"],
  ];
  for (const [key, shown] of cases) {
    it(`writes "${key}" as "${shown}"`, () => {
      expect(titleStyle(key), `title style of "${key}"`).toBe(shown);
    });
  }
});

describe("demo capitals — sentence style", () => {
  const cases: [string, string][] = [
    ["get a <c>25% Cash refund</c> to your wallet of the product price if shipping is delayed", "Get a <c>25% cash refund</c> to your wallet of the product price if shipping is delayed"],
    ["Within <m>3 days</m> after receiving the product, you can return it without conditions or reasons with complete ease and \n<a>get the amount back </a>to your wallet", "Within <m>3 days</m> after receiving the product, you can return it without conditions or reasons with complete ease and \n<a>get the amount back </a>to your wallet"],
    ["Amazing product I buy it. and it is good", "Amazing product I buy it. And it is good"],
    ["made in turkey", "Made in Turkey"],
  ];
  for (const [key, shown] of cases) {
    it(`writes "${key.slice(0, 30)}…" as a sentence`, () => {
      expect(sentenceStyle(key), `sentence style of "${key}"`).toBe(shown);
    });
  }
});

describe("demo capitals — names", () => {
  it("puts a capital on a brand the data writes in small letters", () => {
    expect(nameStyle("boyner"), "the brand boyner").toBe("Boyner");
    expect(nameStyle("stradivarius"), "the brand stradivarius").toBe("Stradivarius");
    expect(nameStyle("Zara"), "the brand Zara").toBe("Zara");
  });
});
