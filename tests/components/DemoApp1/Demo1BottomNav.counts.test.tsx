import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/sy-en/demo",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ lang: "sy-en" }),
}));

import Demo1BottomNav from "components/DemoApp1/Demo1BottomNav";

function renderBar(counts: { cart: number; chat: number }) {
  render(
    <Demo1BottomNav
      active={null}
      visible
      photo={null}
      verified={false}
      resetKey="x"
      onSelect={() => {}}
      t={(key) => key}
      counts={counts}
    />,
  );
}

/** The texts of a tab's count (the idle and the active copy show the same text). */
const countTexts = (tab: string) => {
  const button = document.body.querySelector(`[data-pw="demo-tab-${tab}"]`);
  expect(button, `the bar has no "${tab}" tab`).not.toBeNull();
  return [...button!.querySelectorAll(`[data-pw="demo-tab-${tab}-count"]`)].map(
    (el) => el.textContent,
  );
};

describe("Demo1BottomNav counts", () => {
  it("shows the cart and chat counts it is given, and 0 as 0", () => {
    renderBar({ cart: 2, chat: 0 });
    expect(countTexts("cart"), "the cart tab did not show the cart count 2").toEqual(["2", "2"]);
    expect(countTexts("chat"), "the chat tab did not show 0 for no unread chats").toEqual(["0", "0"]);
  });

  it("shows 99+ when a count is over 99", () => {
    renderBar({ cart: 120, chat: 5 });
    expect(countTexts("cart"), "the cart tab did not cap 120 at 99+").toEqual(["99+", "99+"]);
    expect(countTexts("chat"), "the chat tab did not show the chat count 5").toEqual(["5", "5"]);
  });
});
