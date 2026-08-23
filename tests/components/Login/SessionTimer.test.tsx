// The countdown on a simulated-tester session.
//
// It is mounted in the global layout, so it is on every page for every shopper.
// That makes its most important behaviour the one nobody thinks to check: for
// an ordinary visitor it must render nothing at all. The rest is what a tester
// sees, and what happens when their borrowed session runs out.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SessionTimer from "components/Login/SessionTimer";

import {
  restoreLocation,
  stubLocation,
  type LocationStub,
} from "../../mocks/location";
import { renderWithProviders, screen, waitFor } from "../../render";

let location: LocationStub;
let alerted: ReturnType<typeof vi.fn>;
let fetched: ReturnType<typeof vi.fn>;

/** Put a session expiry in storage, `seconds` from now (negative = past). */
const storeExpiry = (seconds: number) =>
  window.localStorage.setItem(
    "sessionExpiry",
    new Date(Date.now() + seconds * 1000).toISOString(),
  );

beforeEach(() => {
  window.localStorage.clear();
  location = stubLocation();
  // jsdom has no `alert`, and the expiry path calls it before reloading.
  alerted = vi.fn();
  vi.stubGlobal("alert", alerted);
  // Ending the session logs the borrowed account out. The request is behaviour
  // worth asserting, so it is recorded rather than made.
  fetched = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetched);
});

afterEach(() => {
  vi.unstubAllGlobals();
  restoreLocation();
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("an ordinary shopper", () => {
  it("never sees it", async () => {
    const { container } = await renderWithProviders(<SessionTimer />);

    expect(
      container,
      "this is mounted on every page — a tester's clock showing up over a " +
        "real shopper's screen is the app leaking its own tooling",
    ).toBeEmptyDOMElement();
  });

  it("is not woken by an unrelated value in storage", async () => {
    window.localStorage.setItem("language", "ar");
    const { container } = await renderWithProviders(<SessionTimer />);

    expect(
      container,
      "only a stored session expiry may bring it up, or any page that writes " +
        "to storage could put a tester's clock on a shopper's screen",
    ).toBeEmptyDOMElement();
  });
});

describe("a tester borrowing a session", () => {
  it("shows how long is left", async () => {
    storeExpiry(5 * 60);

    await renderWithProviders(<SessionTimer />);

    expect(
      screen.getByText("Session:"),
      "a borrowed session ends without warning — the tester needs to see it " +
        "coming, not discover it mid-check",
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("Simulated User Session Timer"),
      "and it must say what the clock is counting, since it sits over the app",
    ).toBeInTheDocument();
  });

  it("counts the real time left, not a fixed two minutes", async () => {
    storeExpiry(5 * 60 + 7);

    const { container } = await renderWithProviders(<SessionTimer />);

    expect(
      container.textContent,
      "the clock has to read the stored expiry — a default countdown would " +
        "tell every tester the same wrong number",
    ).toMatch(/00:0[45]:\d\d/);
  });
});

describe("a stored expiry the app will not trust", () => {
  it("shows nothing once the expiry is in the past", async () => {
    storeExpiry(-60);

    const { container } = await renderWithProviders(<SessionTimer />);

    expect(
      container,
      "an expired session has no time left to show",
    ).toBeEmptyDOMElement();
  });

  it("clears that expiry out of storage", async () => {
    storeExpiry(-60);

    await renderWithProviders(<SessionTimer />);

    await waitFor(() => {
      expect(
        window.localStorage.getItem("sessionExpiry"),
        "leaving it there means every later page load starts by finding a " +
          "dead session again",
      ).toBeNull();
    });
  });

  it("signs the borrowed account out", async () => {
    storeExpiry(-60);

    await renderWithProviders(<SessionTimer />);

    await waitFor(() => {
      expect(
        fetched,
        "the tester is still carrying the borrowed account's cookies — only " +
          "the logout route can take them away",
      ).toHaveBeenCalledWith("/api/auth/logout", expect.anything());
    });
  });

  it("will not trust an expiry more than half an hour away either", async () => {
    // A simulated session is capped at 30 minutes, so a longer one did not
    // come from the app.
    storeExpiry(45 * 60);

    const { container } = await renderWithProviders(<SessionTimer />);

    expect(
      container,
      "an expiry the app could not have written must be refused, not counted " +
        "down — otherwise anything that can write storage can hand itself a " +
        "session of any length",
    ).toBeEmptyDOMElement();
  });
});

describe("when the session runs out while the tester is watching", () => {
  it("says so, and reloads onto whatever session is left", async () => {
    storeExpiry(1);

    await renderWithProviders(<SessionTimer />);

    await waitFor(
      () => {
        expect(
          alerted,
          "the session ended under the tester — carrying on silently leaves " +
            "them filing bugs against an account that is no longer theirs",
        ).toHaveBeenCalledWith("Session for simulate user has ended");
      },
      { timeout: 4000 },
    );
    expect(
      location.reload,
      "and the page is still rendering the borrowed account — only a reload " +
        "puts the real one back",
    ).toHaveBeenCalled();
  });
});
