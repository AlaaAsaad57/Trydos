// The small route files that only render one thing or redirect:
// the root landing page, the two login demo pages and the empty modal slot.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { navigationSpies } from "../mocks/nextNavigation";

vi.mock("NewLoginDesign/NewLoginWidget", () => ({ default: () => <div data-testid="new-login-widget" /> }));

import ModalDefault from "app/(client)/[lang]/@modal/default";
import LangLoginDemoPage, { metadata as loginDemoMeta } from "app/(client)/[lang]/loginDemo/page";
import LoginDemoRedirectPage from "app/loginDemo/page";
import LandingPage from "app/page";

describe("the small routes", () => {
  it("the root landing page shows the logo", () => {
    render(<LandingPage />);

    expect(screen.getByAltText("Trydos Logo"), "the landing page logo is missing").toBeInTheDocument();
  });

  it("the root login demo sends the visitor to the locale login demo", () => {
    expect(() => LoginDemoRedirectPage(), "the login demo did not redirect").toThrow();
    expect(navigationSpies.redirect, "the login demo went to the wrong place").toHaveBeenCalledWith("/gb-en/loginDemo");
  });

  it("the locale login demo shows the new login widget", () => {
    render(<LangLoginDemoPage />);

    expect(screen.getByTestId("new-login-widget"), "the login widget is missing").toBeInTheDocument();
    expect(loginDemoMeta.title, "the login demo lost its title").toContain("Login & Registration Demo");
  });

  it("the empty modal slot renders nothing", () => {
    expect(ModalDefault(), "the empty modal slot rendered something").toBeNull();
  });
});
