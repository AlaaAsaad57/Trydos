// The wrapper around an intercepted route's content.
import { useContext } from "react";
import { describe, expect, it } from "vitest";

import ModalOverlay from "components/ModalRoute/ModalOverlay";
import { ModalRouteContext } from "components/ModalRoute/ModalRouteContext";

import { renderWithProviders, screen } from "../../render";

function WhereAmI() {
  return <span>{useContext(ModalRouteContext) ? "in overlay" : "on page"}</span>;
}

describe("the modal overlay", () => {
  it("tells its content it is inside an overlay", async () => {
    await renderWithProviders(
      <ModalOverlay>
        <WhereAmI />
      </ModalOverlay>,
    );
    expect(
      screen.getByText("in overlay"),
      "content inside the overlay must see the modal-route flag, or its back button acts like a full page",
    ).toBeInTheDocument();
  });
});
