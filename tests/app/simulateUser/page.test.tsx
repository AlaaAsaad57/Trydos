// The tester-only "simulate user" page: paste an error payload, it previews
// the payload, asks /api/auth/simulate to set the session cookies, and lists
// the last paths as same-origin links.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookies = vi.hoisted(() => ({ current: null as any }));
vi.mock("utils/cookies/cookie-manager", async () => {
  const { makeCookieManagerMock: make } = await import("../../mocks/cookieManager");
  cookies.current = make();
  return cookies.current;
});
const initializeSessionCheck = vi.fn();
vi.mock("utils/sessionManager", () => ({ initializeSessionCheck: () => initializeSessionCheck() }));
vi.mock("components/Login/SessionTimer", () => ({ default: () => <div data-testid="session-timer" /> }));

import Page from "app/simulateUser/page";
import RootLayout, { metadata } from "app/simulateUser/layout";

const fetchSpy = vi.fn(async () => new Response("{}"));

const paste = (value: string) => {
  fireEvent.change(screen.getByLabelText("Error JSON payload"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Parse And Simulate User" }));
};

/** The body the page sent to /api/auth/simulate. */
const sentBody = () => JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchSpy);
  vi.stubGlobal("alert", vi.fn());
  fetchSpy.mockClear();
  initializeSessionCheck.mockClear();
  cookies.current.setCookie.mockClear();
  for (const key of Object.keys(cookies.current.__jar)) delete cookies.current.__jar[key];
  localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

describe("the simulate-user page", () => {
  it("starts the session check and keeps the button off until something is pasted", () => {
    render(<Page />);

    expect(initializeSessionCheck, "the session check did not start on load").toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Parse And Simulate User" }),
      "the button is on with nothing pasted",
    ).toBeDisabled();
  });

  it("says the JSON is invalid when it cannot be read", () => {
    render(<Page />);

    paste("{not json");

    expect(screen.getByText("Invalid JSON. Please paste a valid JSON string."), "bad JSON was not refused").toBeInTheDocument();
    expect(fetchSpy, "the simulate route was called for bad JSON").not.toHaveBeenCalled();
  });

  it("sends the session to the simulate route, sets the locale cookies and previews everything", () => {
    render(<Page />);

    paste(
      JSON.stringify({
        message: { code: 1 },
        timestamp: "2026-01-01T00:00:00Z",
        scenario: "checkout",
        userIP: "10.0.0.1",
        userData: { id: 3 },
        deviceToken: "device-cred",
        chatToken: "c",
        country: " iq ",
        language: " ar ",
        url: "https://trydos.test/sy-en/cart",
        user_agent: "UA",
        stack: "Error at x",
        flag: true,
        count: 2,
        nothing: null,
        last_paths: ["/sy-en/cart", "sy-en/x", "https://other.test/p?q=1#h", "http://", 5],
      }),
    );

    expect(sentBody(), "the guest device credential was not sent as the market credential").toMatchObject({
      userData: { id: 3 },
      marketToken: "device-cred",
      chatToken: "c",
    });
    expect(cookies.current.__jar, "the locale cookies were not set from the payload").toMatchObject({
      country: "iq",
      lang: "ar",
    });
    expect(localStorage.getItem("sessionExpiry"), "the session expiry was not stored").not.toBeNull();
    expect(screen.getByLabelText("Parsed message").textContent, "an object message was not shown as JSON").toBe(
      '{"code":1}',
    );
    expect(within(screen.getByLabelText("Error metadata")).getByText("checkout"), "the scenario was not shown").toBeInTheDocument();
    expect(screen.getByLabelText("Parsed user IP").textContent, "the user IP was not shown").toContain("10.0.0.1");
    expect(
      within(screen.getByRole("region", { name: "Error Page URL" })).getByText("Error at x"),
      "the stack trace was not shown",
    ).toBeInTheDocument();

    const table = within(screen.getByRole("region", { name: "All Parsed Fields" }));
    expect(table.getByText("true"), "a boolean field was not shown as text").toBeInTheDocument();
    expect(table.getByText("null"), "a null field was not shown as null").toBeInTheDocument();

    const links = within(screen.getByRole("region", { name: "Last Paths" })).getAllByRole("link");
    expect(
      links.map((a) => a.getAttribute("href")),
      "the last paths were not turned into same-origin links",
    ).toEqual([
      `${window.location.origin}/sy-en/cart`,
      `${window.location.origin}/sy-en/x`,
      `${window.location.origin}/p?q=1#h`,
      `${window.location.origin}http://`,
    ]);
  });

  it("shows placeholders and sets no cookie when the payload has none of the optional fields", () => {
    render(<Page />);

    paste(JSON.stringify({ marketToken: "m", message: "plain text", source: "api", undef: undefined }));

    expect(sentBody().marketToken, "the market credential was not sent").toBe("m");
    expect(cookies.current.setCookie, "a locale cookie was set without a locale in the payload").not.toHaveBeenCalled();
    expect(screen.getByLabelText("Parsed message").textContent, "a text message was not shown as it is").toBe("plain text");
    expect(within(screen.getByLabelText("Error metadata")).getByText("api"), "the source was not used as the scenario").toBeInTheDocument();
    expect(screen.queryByLabelText("Parsed user IP"), "an IP was shown for a payload without one").toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Error Page URL" })).getAllByText("—"),
      "the empty page URL and user agent did not show a dash",
    ).toHaveLength(2);
  });

  it("shows no message or metadata block when the payload has neither", () => {
    render(<Page />);

    paste(JSON.stringify({ type: undefined, ip: "1.1.1.1", page: "/x" }));

    expect(screen.queryByLabelText("Parsed message"), "a message block was shown without a message").toBeNull();
    expect(screen.queryByLabelText("Error metadata"), "a metadata block was shown without metadata").toBeNull();
    expect(screen.getByLabelText("Parsed user IP").textContent, "the ip field was not used").toContain("1.1.1.1");
  });

  it("still finishes when reading the cookies back throws", () => {
    render(<Page />);
    cookies.current.getCookie.mockImplementationOnce(() => {
      throw new Error("blocked");
    });

    paste(JSON.stringify({ country: "sy" }));

    expect(window.alert, "the done message was not shown after a cookie read failed").toHaveBeenCalled();
  });
});

describe("the simulate-user layout", () => {
  it("wraps the page in its own html and body", () => {
    const tree = RootLayout({ children: "child" }) as any;

    expect(tree.type, "the layout does not render an html element").toBe("html");
    expect(tree.props.children.type, "the layout does not render a body").toBe("body");
    expect(metadata.title, "the layout lost its title").toBe("Next.js");
  });
});
