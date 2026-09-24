// The app-wide error boundary: reports the error to Sentry and the error log,
// then shows either the "connection lost" screen or the general error screen.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ LogError: vi.fn(), UserID: vi.fn(() => 42), lastEventId: vi.fn(() => "evt-1") }));

vi.mock("@sentry/nextjs", async () => {
  const { makeSentryMock } = await import("../mocks/sentry");
  const mock = makeSentryMock();
  return { ...mock, lastEventId: () => spies.lastEventId() };
});
vi.mock("components/Home/Logo", () => ({ default: () => <div data-testid="logo" /> }));
vi.mock("components/global/ErrorIllustrations", () => ({
  GeneralErrorIllustration: () => <div data-testid="general-illustration" />,
  NetworkErrorIllustration: () => <div data-testid="network-illustration" />,
}));
vi.mock("utils/functions", () => ({
  LogError: (...a: unknown[]) => spies.LogError(...a),
  translateFunction: (key: string) => key,
}));
vi.mock("services/auth", () => ({ default: { UserID: () => spies.UserID() } }));

import * as Sentry from "@sentry/nextjs";
import GlobalError from "app/global-error";

const reload = vi.fn();
let hrefSet: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  hrefSet = undefined;
  window.history.pushState({}, "", "/iq-ar/cart");
  localStorage.clear();
  vi.spyOn(window, "location", "get").mockReturnValue({
    pathname: "/iq-ar/cart",
    reload,
    get href() {
      return "http://localhost/iq-ar/cart";
    },
    set href(v: string) {
      hrefSet = v;
    },
  } as any);
});
afterEach(() => vi.restoreAllMocks());

describe("the app-wide error boundary", () => {
  it("reports the error to Sentry and to the error log with the shopper and locale", async () => {
    localStorage.setItem("LAST_JSON", JSON.stringify({ a: 1 }));
    const error = new Error("boom");

    render(<GlobalError error={error} retry={() => {}} />);

    expect(Sentry.captureException, "the error was not sent to Sentry").toHaveBeenCalledWith(error);
    await waitFor(() => expect(spies.LogError, "the error was not written to the error log").toHaveBeenCalled());
    expect(spies.LogError.mock.calls[0][0], "the error log entry lacks the shopper or the locale").toMatchObject({
      type: "front-end-exception",
      scenario: "global-error-boundary",
      message: "boom",
      user_id: 42,
      country: "iq",
      language: "ar",
    });
  });

  it("shows the general error screen with the Sentry event id, and its buttons work", async () => {
    render(<GlobalError error={new Error("boom")} retry={() => {}} />);

    expect(screen.getByText("Oops! Something went wrong"), "the general error title is missing").toBeInTheDocument();
    expect(screen.getByText(/evt-1/), "the Sentry event id is not shown").toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Try Again/ }));
    expect(reload, "Try Again did not reload the page").toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Go Home/ }));
    expect(hrefSet, "Go Home did not go to the root").toBe("/");
  });

  it("shows a dash when Sentry has no event id", () => {
    spies.lastEventId.mockReturnValueOnce(undefined as any);

    render(<GlobalError error={new Error("boom")} retry={() => {}} />);

    expect(screen.getByText(/Error ID:/).textContent, "no dash was shown without an event id").toContain("—");
  });

  it.each(["Connection refused", "Loading chunks failed"])(
    "shows the connection-lost screen for %s, and its buttons work",
    (message) => {
      render(<GlobalError error={new Error(message)} retry={() => {}} />);

      expect(screen.getByText("Connection Lost"), `"${message}" did not show the connection-lost screen`).toBeInTheDocument();
      expect(screen.getByTestId("network-illustration"), "the network illustration is missing").toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Reload Page/ }));
      expect(reload, "Reload Page did not reload").toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: /Go Home/ }));
      expect(hrefSet, "Go Home did not go to the root").toBe("/");
    },
  );
});
