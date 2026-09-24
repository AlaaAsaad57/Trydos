// The locale 404 page.
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { routerSpies, setRoute } from "../mocks/nextNavigation";
import { renderWithProviders } from "../render";

import NotFound from "app/(client)/[lang]/not-found";
import { useAppStore } from "store";

beforeEach(() => localStorage.clear());

describe("the locale 404 page", () => {
  it("clears the navigation spinner and links home and to the listings in the locale", async () => {
    useAppStore.setState({ isNavigating: "somewhere" } as any);

    await renderWithProviders(<NotFound />, { country: "sy", language: "en" });

    expect((useAppStore.getState() as any).isNavigating, "the navigation spinner was not cleared").toBeNull();
    expect(screen.getByText("Oops! Page Not Found"), "the English 404 title is missing").toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Home/ }).getAttribute("href"), "the home link is not in the locale").toBe(
      "/sy-en",
    );
    expect(screen.getByRole("link", { name: "Flash Deals" }).getAttribute("href"), "the flash deals link is wrong").toBe(
      "/sy-en/flashDeals",
    );
    expect(routerSpies.replace, "a page with a locale was redirected").not.toHaveBeenCalled();
  });

  it("uses the Arabic text for a locale it has Arabic text for", async () => {
    await renderWithProviders(<NotFound />, { country: "sa", language: "ar" });

    expect(screen.getByText("عذراً! الصفحة غير موجودة"), "the Arabic 404 title is missing").toBeInTheDocument();
    expect(screen.getByText("المنتجات المميزة"), "the Arabic popular links are missing").toBeInTheDocument();
  });

  // The Arabic copy is keyed on "sa-ar" and "ae-ar", which are not regions the
  // app serves. An Arabic shopper in Syria gets the English title with Arabic
  // links next to it.
  it("BUG-app-4: an Arabic shopper in a served region gets the Arabic 404 title", async () => {
    await renderWithProviders(<NotFound />, { country: "sy", language: "ar" });

    expect(screen.getByText("المنتجات المميزة"), "the popular links are Arabic").toBeInTheDocument();
    expect(screen.getByText("عذراً! الصفحة غير موجودة"), "the 404 title is not Arabic for sy-ar").toBeInTheDocument();
  });

  it("sends a visitor with no locale to the stored or default locale", () => {
    setRoute({ params: {} });
    localStorage.setItem("country", "iq");

    render(<NotFound />);

    expect(routerSpies.replace, "a visitor with no locale was not sent to the stored one").toHaveBeenCalledWith("/iq-en");
    expect(screen.getByRole("link", { name: /Back to Home/ }).getAttribute("href"), "the fallback locale is not gb-en").toBe(
      "/gb-en",
    );
  });

  it("uses gb and en when nothing is stored", () => {
    setRoute({ params: {} });
    localStorage.setItem("lang", "tr");

    render(<NotFound />);

    expect(routerSpies.replace, "the default country was not used").toHaveBeenCalledWith("/gb-tr");
  });
});
