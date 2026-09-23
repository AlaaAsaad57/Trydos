// The route error boundary under [lang]: logs the error and offers a retry,
// in the page language.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setRoute } from "../mocks/nextNavigation";

const spies = vi.hoisted(() => ({ LogError: vi.fn() }));
vi.mock("utils/functions", () => ({
  LogError: (...a: unknown[]) => spies.LogError(...a),
  translateFunction: (key: string, language: string) => `${language}:${key}`,
}));

import LocaleRouteError from "app/(client)/[lang]/error";

beforeEach(() => vi.clearAllMocks());

describe("the locale route error boundary", () => {
  it("logs the error with its digest and offers a retry in the page language", () => {
    setRoute({ params: { lang: "iq-ar" } });
    const reset = vi.fn();
    const error = Object.assign(new Error("es down"), { digest: "d1" });

    render(<LocaleRouteError error={error} reset={reset} />);

    expect(spies.LogError, "the error was not logged with its digest").toHaveBeenCalledWith({
      scenario: "Route error boundary under [lang]",
      error: "es down",
      digest: "d1",
    });
    expect(screen.getByRole("alert").textContent, "the message is not in the page language").toContain(
      "ar:Something went wrong",
    );
    fireEvent.click(screen.getByRole("button", { name: "ar:Try again" }));
    expect(reset, "the retry button did not reset the boundary").toHaveBeenCalled();
  });

  it("uses English and the thrown value when there is no locale or message", () => {
    setRoute({ params: {} });

    render(<LocaleRouteError error={"plain" as any} reset={() => {}} />);

    expect(spies.LogError.mock.calls[0][0].error, "a thrown string was not logged as text").toBe("plain");
    expect(screen.getByRole("button").textContent, "the fallback language is not English").toBe("en:Try again");
  });
});
