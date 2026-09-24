// The (special) routes: the call screens (callInProg, call_direct, endCall),
// the bottom-navigation demo, and their own layouts and error boundaries.
// Each carries its own <html>, because there is no root app/layout.tsx.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ LogError: vi.fn(), UserID: vi.fn(() => 42) }));

vi.mock("components/Home/Logo", () => ({ default: () => <div data-testid="logo" /> }));
vi.mock("utils/functions", () => ({
  LogError: (...a: unknown[]) => spies.LogError(...a),
  translateFunction: (key: string) => key,
}));
vi.mock("services/auth", () => ({ default: { UserID: () => spies.UserID() } }));
vi.mock("components/global/WebviewCall", () => ({ default: () => <div data-testid="webview-call" /> }));
vi.mock("components/NavigationDemo/NavigationDemo", () => ({ default: () => <div data-testid="navigation-demo" /> }));

import CallInProgError from "app/(special)/callInProg/error";
import CallInProgLayout, { metadata as callInProgMeta } from "app/(special)/callInProg/layout";
import CallInProgPage from "app/(special)/callInProg/page";
import CallDirectError from "app/(special)/call_direct/error";
import CallDirectLayout from "app/(special)/call_direct/layout";
import CallDirectPage from "app/(special)/call_direct/page";
import EndCallError from "app/(special)/endCall/error";
import EndCallLayout, { metadata as endCallMeta } from "app/(special)/endCall/layout";
import EndCallPage from "app/(special)/endCall/page";
import NavigationLayout, { metadata as navigationMeta } from "app/(special)/navigation/layout";
import NavigationPage from "app/(special)/navigation/page";

let hrefSet: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  hrefSet = undefined;
  localStorage.clear();
  vi.spyOn(window, "location", "get").mockReturnValue({
    get href() {
      return "http://localhost/callInProg";
    },
    set href(v: string) {
      hrefSet = v;
    },
  } as any);
});
afterEach(() => vi.restoreAllMocks());

describe.each([
  ["callInProg", CallInProgError],
  ["call_direct", CallDirectError],
  ["endCall", EndCallError],
] as const)("the %s error boundary", (name, ErrorPage) => {
  it("logs the error with the shopper and shows it with a way home", async () => {
    localStorage.setItem("LAST_JSON", JSON.stringify({ a: 1 }));

    render(<ErrorPage error={new Error("call broke")} retry={() => {}} />);

    await waitFor(() => expect(spies.LogError, `the ${name} error was not logged`).toHaveBeenCalled());
    expect(spies.LogError.mock.calls[0][0], `the ${name} error log entry lacks the message or shopper`).toMatchObject({
      type: "front-end-exception",
      message: "call broke",
      user_id: 42,
    });
    expect(screen.getByText("call broke"), `the ${name} error message is not shown`).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go Back" }));
    expect(hrefSet, `the ${name} Go Back button did not go to the root`).toBe("/");
  });

  it("still logs when nothing was stored before the error", async () => {
    render(<ErrorPage error={new Error("x")} retry={() => {}} />);

    await waitFor(() => expect(spies.LogError, `the ${name} error was not logged`).toHaveBeenCalled());
  });
});

describe("the call screens", () => {
  it("says the call was answered on another account", () => {
    render(<CallInProgPage />);

    expect(screen.getByText("Call Answered from another Account"), "the call-in-progress text is missing").toBeInTheDocument();
  });

  it("says the call ended", () => {
    render(<EndCallPage />);

    expect(screen.getByText("Call Ended."), "the call-ended text is missing").toBeInTheDocument();
  });

  it("loads the web call screen on the direct-call page", async () => {
    render(<CallDirectPage />);

    expect(await screen.findByTestId("webview-call"), "the web call screen was not loaded").toBeInTheDocument();
  });

  it("shows the navigation demo", () => {
    render(<NavigationPage />);

    expect(screen.getByTestId("navigation-demo"), "the navigation demo is missing").toBeInTheDocument();
  });
});

describe.each([
  ["callInProg", CallInProgLayout],
  ["call_direct", CallDirectLayout],
  ["endCall", EndCallLayout],
  ["navigation", NavigationLayout],
] as const)("the %s layout", (name, Layout) => {
  it("wraps the page in its own html and body", () => {
    const tree: any = Layout({ children: "child" });

    expect(tree.type, `the ${name} layout does not render an html element`).toBe("html");
    const children = [tree.props.children].flat();
    const body = children.find((c: any) => c?.type === "body");
    expect(body?.props.children, `the ${name} layout does not put the page in its body`).toBe("child");
  });
});

describe("the special layouts' titles", () => {
  it("names the call screens and the demo", () => {
    expect(callInProgMeta.title, "the call-in-progress layout lost its title").toBe("TryDos");
    expect(endCallMeta.title, "the call-ended layout lost its title").toBe("TryDos");
    expect(navigationMeta.title, "the navigation demo lost its title").toContain("Bottom Navigation Demo");
  });
});
