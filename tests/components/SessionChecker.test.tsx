// Checks the session on load and every 5 minutes after.
import { afterEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock("utils/sessionManager", () => ({ initializeSessionCheck: session.check }));

import SessionChecker from "components/SessionChecker";

import { renderWithProviders } from "../render";

afterEach(() => {
  vi.useRealTimers();
});

describe("the session checker", () => {
  it("checks at once, again every 5 minutes, and stops when removed", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const { unmount } = await renderWithProviders(<SessionChecker />);
    expect(session.check, "the session must be checked as soon as the app loads").toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(session.check, "the session must be checked again after 5 minutes").toHaveBeenCalledTimes(2);

    unmount();
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(session.check, "the check must stop once the checker is removed").toHaveBeenCalledTimes(2);
  });
});
