// utils/posthogEvents.ts — trackPosthog sends a PostHog-only event with the
// same shared properties GA events carry, and never throws.
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogCapture = vi.hoisted(() => vi.fn());
vi.mock("utils/posthog", () => ({ posthogCapture }));
const globalProps = vi.hoisted(() => vi.fn(() => ({ screen_name: "home", platform_source: "WEB" })));
vi.mock("utils/gtag", () => ({ globalProps }));

import { STORY_EVENTS, trackPosthog } from "utils/posthogEvents";

beforeEach(() => vi.clearAllMocks());

describe("trackPosthog", () => {
  it("sends the event with the shared properties, and the call's own win", () => {
    trackPosthog(STORY_EVENTS.STORY_UPLOADED, { screen_name: "story" });
    expect(posthogCapture, "the event was not sent with merged properties").toHaveBeenCalledWith("story_uploaded", {
      screen_name: "story",
      platform_source: "WEB",
    });
  });

  it("never throws when building the properties fails", () => {
    globalProps.mockImplementationOnce(() => {
      throw new Error("no store");
    });
    expect(() => trackPosthog("x"), "an analytics failure escaped").not.toThrow();
  });
});
