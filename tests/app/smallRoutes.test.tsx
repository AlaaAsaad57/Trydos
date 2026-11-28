// The small route files that only render one thing or redirect:
// the root landing page, the login page, the two login demo pages and the
// empty modal slot.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { navigationSpies } from "../mocks/nextNavigation";

vi.mock("NewLoginDesign/NewLoginWidget", () => ({
  default: ({ initialStep, exitTo }: { initialStep?: string; exitTo?: string }) => (
    <div data-testid="new-login-widget" data-step={initialStep ?? ""} data-exit={exitTo ?? ""} />
  ),
}));
// The locale segment the login page's title is read for.
const root = vi.hoisted(() => ({ lang: "sy-ar" }));
vi.mock("next/root-params", () => ({ lang: async () => root.lang }));

/** The page's props, as the router gives them: the locale, and the query. */
const loginDemoProps = (query: Record<string, string> = {}) => ({
  params: Promise.resolve({ lang: "sy-en" }),
  searchParams: Promise.resolve(query),
});

import ModalDefault from "app/(client)/[lang]/@modal/default";
import LangLoginDemoPage, { metadata as loginDemoMeta } from "app/(client)/[lang]/loginDemo/page";
import LoginDemoRedirectPage from "app/loginDemo/page";
import LoginPage, { generateMetadata as loginMetadata } from "app/(client)/[lang]/login/page";
import LandingPage from "app/(landing)/page";

describe("the small routes", () => {
  it("the root landing page shows the logo", () => {
    render(<LandingPage />);

    expect(screen.getByAltText("Trydos Logo"), "the landing page logo is missing").toBeInTheDocument();
  });

  it("the root login demo sends the visitor to the locale login demo", () => {
    expect(() => LoginDemoRedirectPage(), "the login demo did not redirect").toThrow();
    expect(navigationSpies.redirect, "the login demo went to the wrong place").toHaveBeenCalledWith("/gb-en/loginDemo");
  });

  it("the locale login demo shows the new login widget", async () => {
    render(await LangLoginDemoPage(loginDemoProps()));

    const widget = screen.getByTestId("new-login-widget");
    expect(widget, "the login widget is missing").toBeInTheDocument();
    expect(widget.dataset.exit, "the login demo on its own must not send the visitor anywhere at its end").toBe("");
    expect(loginDemoMeta.title, "the login demo lost its title").toContain("Login & Registration Demo");
  });

  it("the login page shows the new login widget and is kept out of search engines (A-24)", async () => {
    render(<LoginPage />);
    expect(screen.getByTestId("new-login-widget"), "the login page does not show the login widget").toBeInTheDocument();

    const meta = await loginMetadata();
    expect(meta.robots, "search engines may index the login page").toEqual({ index: false, follow: false });
    expect(meta.title, "the Arabic login page's title is not in Arabic").toBe("تسجيل الدخول");
  });

  it("the login demo opened from the demo starts on Get Started and goes back to the demo", async () => {
    render(await LangLoginDemoPage(loginDemoProps({ from: "demo" })));

    const widget = screen.getByTestId("new-login-widget");
    expect(widget.dataset.step, "the login from the demo's sign-in request must open on Get Started").toBe("get-started");
    expect(widget.dataset.exit, "the login from the demo must end on the demo of the same locale").toBe("/sy-en/demo");
  });

  it("the empty modal slot renders nothing", () => {
    expect(ModalDefault(), "the empty modal slot rendered something").toBeNull();
  });
});
