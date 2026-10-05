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

  it("hands the shell the Arabic from the translation table", async () => {
    const arabic = await dictionaryFor("sy-ar");
    expect(
      arabic["Your cart is empty"],
      "the Arabic demo did not get the Arabic entry",
    ).toBe("سلتك فارغة");
  });
});
