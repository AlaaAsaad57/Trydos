import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "components/Home/LandingPage";

describe("LandingPage", () => {
  it("draws the loading landing panel", () => {
    const { container } = render(<LandingPage afterLoad />);
    expect(container.querySelector("#landing svg"), "the landing panel has no logo drawing").not.toBeNull();
  });
});
