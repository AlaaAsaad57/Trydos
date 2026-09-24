// The two pictures the global error page draws (app/global-error.tsx).
import { describe, expect, it } from "vitest";

import {
  GeneralErrorIllustration,
  NetworkErrorIllustration,
} from "components/global/ErrorIllustrations";

import { renderWithProviders } from "../../render";

describe("the error illustrations", () => {
  it("draws the general error picture, with its default size or a given class", async () => {
    const { container, rerender } = await renderWithProviders(<GeneralErrorIllustration />);
    expect(container.querySelector("svg"), "the general error picture must use its default size").toHaveClass(
      "w-48",
      "h-48",
    );
    expect(
      container.querySelector("#errorGradient"),
      "the general error picture lost its gradient",
    ).toBeInTheDocument();

    rerender(<GeneralErrorIllustration className="small" />);
    expect(container.querySelector("svg"), "the general error picture must take the caller's class").toHaveClass(
      "small",
    );
  });

  it("draws the network error picture, with its default size or a given class", async () => {
    const { container, rerender } = await renderWithProviders(<NetworkErrorIllustration />);
    expect(container.querySelector("svg"), "the network error picture must use its default size").toHaveClass(
      "w-48",
      "h-48",
    );
    expect(
      container.querySelector("#networkGradient"),
      "the network error picture lost its gradient",
    ).toBeInTheDocument();

    rerender(<NetworkErrorIllustration className="small" />);
    expect(container.querySelector("svg"), "the network error picture must take the caller's class").toHaveClass(
      "small",
    );
  });
});
