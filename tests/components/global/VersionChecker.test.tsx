// Checks for a new app version once, when the layout mounts.
import { describe, expect, it, vi } from "vitest";

const version = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock("utils/version-manager", () => ({ checkAndUpdateVersion: version.check }));

import VersionChecker from "components/global/VersionChecker";

import { renderWithProviders } from "../../render";

describe("the version checker", () => {
  it("checks the app version once on mount and draws nothing", async () => {
    const { container } = await renderWithProviders(<VersionChecker />);
    expect(version.check, "the app version must be checked once on mount").toHaveBeenCalledTimes(1);
    expect(container.innerHTML, "the version checker must draw nothing").toBe("");
  });
});
