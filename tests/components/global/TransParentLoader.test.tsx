// The transparent "trydos" loader drawn while a story loads (StoryHolder).
import { describe, expect, it } from "vitest";

import TransParentLoader from "components/global/TransParentLoader";

import { renderWithProviders } from "../../render";

describe("the transparent loader", () => {
  it("draws the brand logo over a transparent background", async () => {
    const { container } = await renderWithProviders(<TransParentLoader />);

    expect(
      container.querySelector(".bg-transparent svg"),
      "the loader must draw its logo inside a transparent box, so the story behind it stays visible",
    ).toBeInTheDocument();
    expect(
      container.querySelector("#linear-gradient4"),
      "the red gradient of the logo dot is missing",
    ).toBeInTheDocument();
  });
});
