// The layout's after-hydration clients, loaded late on purpose.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/global/VersionChecker", () => ({ default: () => <span>version checker</span> }));
vi.mock("components/SessionChecker", () => ({ default: () => <span>session checker</span> }));
vi.mock("components/Login/SessionTimer", () => ({ default: () => <span>session timer</span> }));
vi.mock("components/global/NotificationsContainer", () => ({
  default: () => <span>notifications container</span>,
}));

import DeferredLayoutClients from "components/global/DeferredLayoutClients";

import { renderWithProviders, screen } from "../../render";

describe("the deferred layout clients", () => {
  it("loads all four late clients", async () => {
    await renderWithProviders(<DeferredLayoutClients />);

    for (const name of ["version checker", "session checker", "session timer", "notifications container"]) {
      expect(await screen.findByText(name), `the ${name} was never loaded into the layout`).toBeInTheDocument();
    }
  });
});
