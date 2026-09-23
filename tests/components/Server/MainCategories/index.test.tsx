// The main-category tabs in the navbar. The active category moves to the front;
// an unknown category slug must not break the bar.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCachedCategories = vi.fn();
const navbar = vi.fn();
const tab = vi.fn();

vi.mock("serverRequests/cached/home", () => ({
  getCachedCategories: (...args: any[]) => getCachedCategories(...args),
}));
vi.mock("components/Server/Navbar", () => ({
  default: (props: any) => {
    navbar(props);
    return <nav>{props.children}</nav>;
  },
}));
vi.mock("components/Home/CategoryNavMobile", () => ({
  default: (props: any) => {
    tab(props);
    return <span>{props.name}</span>;
  },
}));

import MainCategoriesNavbar from "components/Server/MainCategories";

import { render } from "@testing-library/react";

const CATEGORIES = [
  { slug: "men", name: "Men", flat_photo_path: { file_path: "m.svg" }, outline_photo_path: { file_path: "mo.svg" } },
  { slug: "women", name: "Women" },
];

describe("the main-category tabs", () => {
  beforeEach(() => {
    getCachedCategories.mockReset().mockResolvedValue(CATEGORIES);
    tab.mockClear();
  });

  it("keeps the backend order and marks nothing active on the home page", async () => {
    render(await MainCategoriesNavbar({ lang: "sy-en", mainCategory: null }));
    expect(getCachedCategories, "the categories must be read for this country and language").toHaveBeenCalledWith("sy", "en");
    expect(tab.mock.calls.map(([p]) => p.name), "the backend order should be kept").toEqual(["Men", "Women"]);
    expect(tab.mock.calls.some(([p]) => p.active), "no tab should be active on the home page").toBe(false);
    expect(tab.mock.calls[0][0].icon, "the tab icon should come from the flat photo").toBe("m.svg");
  });

  it("moves the active category to the front and marks it active", async () => {
    render(await MainCategoriesNavbar({ lang: "sy-en", mainCategory: "women" }));
    expect(tab.mock.calls.map(([p]) => p.name), "the active category should be first").toEqual(["Women", "Men"]);
    expect(tab.mock.calls[0][0].active, "the active category should be marked active").toBe(true);
  });

  it("draws the known categories when the slug is unknown", async () => {
    render(await MainCategoriesNavbar({ lang: "sy-en", mainCategory: "ghost" }));
    expect(tab.mock.calls.map(([p]) => p.name), "an unknown slug must not add an empty tab").toEqual(["Men", "Women"]);
  });
});
