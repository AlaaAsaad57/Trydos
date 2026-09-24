import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const SelectStory = vi.fn();
vi.mock("store/homepage/actions", () => ({
  SelectStory: (...a: any[]) => SelectStory(...a),
}));
vi.mock("services/story", () => ({
  default: { configureStory: (s: any) => ({ configured: s.id }) },
}));
vi.mock("components/Home/Stories/StoryCard", () => ({
  default: ({ media, isVideo, Name }: any) => (
    <span data-testid="card" data-media={media} data-video={String(!!isVideo)}>
      {Name}
    </span>
  ),
}));

import Story from "components/Home/Stories/Story";

describe("Story", () => {
  it("shows a video story and opens it when tapped", () => {
    const { container } = render(
      <Story media={{ full_video_path: "v.mp4" }} Name="Ali" index={0} story={{ id: 5 }} />,
    );
    expect(screen.getByTestId("card").dataset.media, "the card should use the video path").toBe("v.mp4");
    expect(screen.getByTestId("card").dataset.video, "a video story should be marked as video").toBe("true");
    fireEvent.click(container.querySelector('[data-pw="story-element"]')!);
    expect(SelectStory, "tapping the tile did not open the configured story").toHaveBeenCalledWith({ configured: 5 });
  });

  it("falls back to the photo path for a picture story", () => {
    render(<Story media={{ photo_path: "p.png" }} Name="Ali" index={0} story={{ id: 6 }} />);
    expect(screen.getByTestId("card").dataset.media, "the card should use the photo path").toBe("p.png");
  });
});
