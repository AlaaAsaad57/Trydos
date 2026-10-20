// The story bubble on the home page (components/Home/Stories/StoryElement.tsx).
//
// M-1 (stories readiness): when the author had no name, the bubble showed the
// author's phone number to every shopper. The name must fall back to
// "Unknown", never to the phone.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("components/Home/Stories/Story", () => ({
  default: ({ Name }: any) => <span data-testid="story-name">{Name}</span>,
}));
vi.mock("components/Home/Stories/StoryAvatar", () => ({ default: () => null }));
vi.mock("store/homepage/actions", () => ({ GetUnviewedStory: () => 0 }));

import StoryElement from "components/Home/Stories/StoryElement";

const PHONE = "+963900000000";
const nameless = { id: 7, name: null, mobile_phone: PHONE, stories: [{ id: 1, is_seen: false }] };

describe("the home story bubble, when the author has no name", () => {
  it("shows 'Unknown', not the phone, on another shopper's story", () => {
    render(<StoryElement index={0} story={nameless} userData={{ id: 1 }} />);
    expect(
      screen.getByTestId("story-name").textContent,
      "another shopper's story bubble shows the author's phone number",
    ).toBe("Unknown");
  });

  it("shows 'Unknown', not the phone, on the shopper's own story", () => {
    render(<StoryElement index={0} story={nameless} userData={{ id: 7 }} />);
    expect(
      screen.getByTestId("story-name").textContent,
      "the shopper's own story bubble shows their phone number",
    ).toBe("Unknown");
  });
});
