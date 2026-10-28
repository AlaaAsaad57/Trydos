import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

// next/dynamic is replaced by a stand-in that starts the real loader (so the
// import line runs) and shows the loading screen, which is what a shopper sees
// first.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    const Dyn = () => {
      loader();
      return options.loading();
    };
    return Dyn;
  },
}));
vi.mock("components/Chat/pages/CallContainer", () => ({ default: () => null }));
vi.mock("components/Chat/ChatModal", () => ({ default: () => null }));

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

  it("shows the chat and call loaders when each is open", async () => {
    const { container } = await renderWithProviders(<AuthSections />, {
      store: { chatVar: true, call: { id: 1 } },
    });
    expect(
      container.querySelectorAll("#landing").length,
      "the chat and the call should each show a loading panel",
    ).toBe(2);
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
