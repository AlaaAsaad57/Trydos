import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UploadVideo from "components/Home/UploadVideo";

describe("UploadVideo", () => {
  it("plays the given video with controls", () => {
    const { container } = render(<UploadVideo vidUrl="https://example.com/a.mp4" />);
    const video = container.querySelector("video")!;
    expect(video.getAttribute("src"), "the video source is wrong").toBe("https://example.com/a.mp4");
    expect(video.hasAttribute("controls"), "the video has no controls").toBe(true);
  });
});
