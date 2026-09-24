import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Logo from "components/Home/Logo";

describe("Logo", () => {
  it("shows the TryDos logo image", () => {
    render(<Logo animated={false} style={{}} />);
    expect(screen.getByAltText("TryDos Logo").getAttribute("src"), "the logo points at the wrong file").toBe("/icons/Logo.svg");
  });
});
