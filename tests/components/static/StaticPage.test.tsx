// The shared layout of the About / Privacy / Terms / Contact pages.
import { describe, expect, it, vi } from "vitest";

const backBar = vi.hoisted(() => ({ props: null as any }));
vi.mock("components/setting/BackBar", () => ({
  default: (props: any) => {
    backBar.props = props;
    return <span>back bar</span>;
  },
}));
vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `[${language}] ${key}`,
}));

import StaticPage from "components/static/StaticPage";

import { renderWithProviders, screen } from "../../render";

const sections = [{ heading: "Who we are", body: "A shop." }];

describe("the static page", () => {
  it("draws a right-to-left page in Arabic, with the intro and every section translated", async () => {
    await renderWithProviders(
      <StaticPage lang="sy-ar" title="About" intro="Hello" sections={sections} />,
    );

    expect(document.querySelector('[data-pw="static-page"]'), "an Arabic page must be right-to-left").toHaveStyle({
      direction: "rtl",
    });
    expect(screen.getByRole("heading", { level: 1 }), "the title must be translated to the page language").toHaveTextContent(
      "[ar] About",
    );
    expect(screen.getByText("[ar] Hello"), "the intro must be translated").toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 }), "the section heading must be translated").toHaveTextContent(
      "[ar] Who we are",
    );
    expect(screen.getByText("[ar] A shop."), "the section body must be translated").toBeInTheDocument();
    expect(backBar.props?.preivous_page, "the back bar must lead to the settings page of this locale").toBe(
      "/sy-ar/settings",
    );
    expect(backBar.props?.isRtl, "the back bar must know the page is right-to-left").toBe(true);
  });

  it("draws a left-to-right page with no intro in English", async () => {
    await renderWithProviders(<StaticPage lang="sy-en" title="Terms" sections={[]} />);

    expect(document.querySelector('[data-pw="static-page"]'), "an English page must be left-to-right").toHaveStyle({
      direction: "ltr",
    });
    expect(document.querySelector("article p"), "a page with no intro must not draw an empty paragraph").toBeNull();
  });
});
