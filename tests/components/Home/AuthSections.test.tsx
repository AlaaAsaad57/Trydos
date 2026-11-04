import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

import AuthSections from "components/Home/AuthSections";
import { useAppStore } from "store";
import { routerSpies } from "../../mocks/nextNavigation";

// Clearing the login flag scrolls the page to its top (setLoginOpen(false));
// jsdom has no scrolling.
beforeEach(() => {
  document.documentElement.scrollTo = vi.fn() as never;
});

describe("AuthSections", () => {
  it("shows nothing when chat, login and call are all closed", async () => {
    const { container } = await renderWithProviders(<AuthSections />, {
      store: { loginOpen: false, chatVar: false, call: null },
    });
    expect(container.innerHTML, "a closed section was drawn").toBe("");
  });

  // D-11 in UI-MIGRATION-PLAN.md: the login is a page, not an overlay.
  it("a login request goes to the login page with this page as the way back", async () => {
    const { container } = await renderWithProviders(<AuthSections />, {
      country: "sy",
      path: "/products/12",
      search: "color=red",
      store: { loginOpen: true },
    });
    expect(
      routerSpies.push,
      "a login request did not go to /sy-en/login with this page in ?next=",
    ).toHaveBeenCalledWith("/sy-en/login?next=%2Fsy-en%2Fproducts%2F12%3Fcolor%3Dred");
    expect(useAppStore.getState().loginOpen, "the login flag stayed on after the shopper was sent to the login page").toBe(false);
    expect(container.innerHTML, "a login overlay was still drawn over the page").toBe("");
  });

  it("a login request on the login page itself goes nowhere", async () => {
    await renderWithProviders(<AuthSections />, {
      country: "sy",
      path: "/login",
      store: { loginOpen: true },
    });
    expect(routerSpies.push, "the login page sent the shopper to the login page again").not.toHaveBeenCalled();
    expect(useAppStore.getState().loginOpen, "the login flag stayed on").toBe(false);
  });
});
