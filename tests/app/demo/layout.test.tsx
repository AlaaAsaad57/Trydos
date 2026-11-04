import React from "react";
import { describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ lang: "sy-en" }));
vi.mock("next/root-params", () => ({ lang: async () => root.lang }));
vi.mock("components/DemoApp1/Demo1Shell", () => ({ default: () => null }));

import Demo1Layout from "app/(client)/[lang]/demo/layout";
import Demo1Shell from "components/DemoApp1/Demo1Shell";

/** The word list the layout hands to the demo shell. */
const dictionaryFor = async (lang: string) => {
  root.lang = lang;
  // The layout gives a fragment: the style that hides the site's navbar, then
  // the Suspense boundary round the shell.
  const tree = (await Demo1Layout({ children: null })) as React.ReactElement<{
    children: React.ReactElement<{
      children: React.ReactElement<{ dictionary: Record<string, string> }>;
    }>[];
  }>;
  const shell = tree.props.children
    .map((child) => child?.props?.children)
    .find((child) => child?.type === Demo1Shell);
  expect(shell, "the layout does not render the demo shell").toBeDefined();
  return shell!.props.dictionary;
};

describe("demo layout", () => {
  it("hands the shell English with a capital letter on every word, as the rest of the app shows it", async () => {
    const english = await dictionaryFor("sy-en");
    expect(
      english["Your cart is empty"],
      "the English demo shows its keys raw, in sentence case",
    ).toBe("Your Cart Is Empty");
    expect(
      english["Items you add to your cart will show here"],
      "the English demo did not capitalise every word of the cart hint",
    ).toBe("Items You Add To Your Cart Will Show Here");
  });

  it("draws the store page's badges in the case the file draws them", async () => {
    const english = await dictionaryFor("sy-en");
    // `Home Page – 47` sets the bag badge's text to title case, so the file
    // shows "1 Item M In Your Bag".
    expect(
      english["{count} item {size} in your bag"],
      "the bag badge is not drawn with a capital on every word, as the file draws it",
    ).toBe("{count} Item {size} In Your Bag");
    // The "best price" badge has no case setting in the file: it stays as written.
    expect(
      english["last {days} days!"],
      "the best-price badge lost the file's sentence case",
    ).toBe("last {days} days!");
  });

  it("hands the shell the Arabic from the translation table", async () => {
    const arabic = await dictionaryFor("sy-ar");
    expect(
      arabic["Your cart is empty"],
      "the Arabic demo did not get the Arabic entry",
    ).toBe("سلتك فارغة");
  });
});
