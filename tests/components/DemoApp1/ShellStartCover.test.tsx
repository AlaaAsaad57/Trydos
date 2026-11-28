// The start flow's white in the first HTML (components/DemoApp1/ShellStartCover.tsx,
// Stage 7e part 2, AC-3): drawn by the [lang] layout on a gb address, gone
// once the flow's login layer is up, and never there for a crawler.
import React from "react";
import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "../../render";
import ShellStartCover from "components/DemoApp1/ShellStartCover";
import { useAppStore } from "store";

const cover = () => document.querySelector('[data-pw="start-cover"]');
const agent =
  Object.getOwnPropertyDescriptor(navigator, "userAgent") ??
  Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");

describe("ShellStartCover", () => {
  afterEach(() => {
    if (agent) Object.defineProperty(navigator, "userAgent", agent);
  });

  it("covers the page until the flow's login layer is up", async () => {
    await renderWithProviders(<ShellStartCover />, { store: { loginLayerOpen: false } });
    expect(cover(), "the page is not covered before the start flow shows").not.toBeNull();
    act(() => useAppStore.getState().setLoginLayerOpen(true));
    expect(cover(), "the white stayed over the start flow's login layer").toBeNull();
  });

  it("a crawler gets no cover", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      configurable: true,
    });
    await renderWithProviders(<ShellStartCover />, { store: { loginLayerOpen: false } });
    expect(cover(), "a crawler's page stays covered by the start flow's white").toBeNull();
  });
});
