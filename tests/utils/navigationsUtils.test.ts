// utils/navigationsUtils.tsx — isSamePage: is this link the page we are on?
import { afterEach, describe, expect, it, vi } from "vitest";

import { isSamePage } from "utils/navigationsUtils";

afterEach(() => vi.unstubAllGlobals());

describe("isSamePage", () => {
  it("matches the current path and query, ignoring trailing slashes", () => {
    window.history.pushState({}, "", "/sy-en/cart?x=1");
    expect(isSamePage("/sy-en/cart?x=1/"), "the same page was not matched").toBe(true);
    expect(isSamePage("/sy-en/cart"), "a page without the query was matched").toBe(false);
  });

  it("treats an empty path and the root as the same", () => {
    window.history.pushState({}, "", "/");
    expect(isSamePage("///"), "the root was not matched").toBe(true);
  });

  it("is never the same page on the server", () => {
    vi.stubGlobal("window", undefined);
    expect(isSamePage("/"), "the server matched a page").toBe(false);
  });
});
