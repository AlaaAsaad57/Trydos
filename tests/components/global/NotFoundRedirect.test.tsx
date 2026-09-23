// Leaves an intercepted route whose product or boutique does not exist.
import { describe, expect, it } from "vitest";

import NotFoundRedirect from "components/global/NotFoundRedirect";

import { routerSpies } from "../../mocks/nextNavigation";
import { renderWithProviders } from "../../render";

describe("the not-found redirect", () => {
  it("replaces the dead address with the one it was given", async () => {
    const { container } = await renderWithProviders(<NotFoundRedirect href="/gb-en" />);

    expect(
      routerSpies.replace,
      "the dead address must be replaced (not pushed), so Back does not return to it",
    ).toHaveBeenCalledWith("/gb-en");
    expect(routerSpies.push, "the redirect must never push a history entry").not.toHaveBeenCalled();
    expect(container.innerHTML, "the redirect must draw nothing").toBe("");
  });
});
