// The "Media & Files" view of an open chat
// (components/Chat/components/MediaContainer.jsx): three tabs — Image, Video,
// File — over a grid of the chat's media.
//
// The lists come in two steps:
//   1. GetChatDetails (store/chat/actions.tsx) fills `message_counts` when the
//      details panel opens: the three counts and `image_messages` for the
//      image strip. It holds no `video_messages` and no `file_messages`.
//   2. getMedia fills one list when its tab opens, after a round trip to the
//      chat backend.
// So a tab shows before its list has arrived. Each tab must cope with a list
// that is not there yet, and fill in when it comes.
import { describe, expect, it, vi } from "vitest";
import React from "react";

import { renderWithProviders, screen, userEvent } from "../../../render";

const media = vi.hoisted(() => ({ getMedia: vi.fn(), downloadFile: vi.fn() }));
vi.mock("components/Chat/downloadFile", () => ({ downloadFile: (...a: any[]) => media.downloadFile(...a) }));
vi.mock("store/chat/actions", () => ({ getMedia: (...a: any[]) => media.getMedia(...a) }));

import MediaContainer from "components/Chat/components/MediaContainer";

/** What GetChatDetails leaves in `message_counts` before any tab has loaded. */
const detailsOnly = {
  image_messages_count: 1,
  video_messages_count: 2,
  file_messages_count: 3,
  image_messages: [{ message_files: [{ file_path: "https://example.com/i.png" }] }],
};

describe("MediaContainer — a tab whose list has not arrived yet", () => {
  it.each(["Video", "File"])("the %s tab opens before its list is loaded", async (tab) => {
    await renderWithProviders(<MediaContainer id={7} mediaFiles={detailsOnly} />);
    await userEvent.click(screen.getByText(tab));

    expect(
      screen.getByText(tab).className,
      `the ${tab} tab did not open: the view broke because the chat backend had not sent the ${tab.toLowerCase()} list yet`,
    ).toContain("active-tab-media");
    expect(
      media.getMedia,
      `opening the ${tab} tab did not ask the chat backend for its list`,
    ).toHaveBeenCalledWith(7, `${tab}Message`);
  });
});

describe("MediaContainer — a tap on an item", () => {
  const lists = {
    ...detailsOnly,
    video_messages: [{ message_files: [{ file_path: "https://example.com/v.mp4" }] }],
    file_messages: [{ message_files: [{ file_path: "https://example.com/f.pdf" }] }],
  };

  it("a photo opens the viewer instead of a new tab", async () => {
    const onOpenImage = vi.fn();
    await renderWithProviders(<MediaContainer id={7} mediaFiles={lists} onOpenImage={onOpenImage} />);
    const link = document.querySelector('[data-pw="media-image"]') as HTMLAnchorElement;
    expect(link.hasAttribute("target"), "the photo link still opens a new tab").toBe(false);
    await userEvent.click(link);
    expect(onOpenImage, "a tap on a photo did not open the viewer with that photo").toHaveBeenCalledWith("https://example.com/i.png");
  });

  it("a video opens the viewer", async () => {
    const onOpenVideo = vi.fn();
    await renderWithProviders(<MediaContainer id={7} mediaFiles={lists} onOpenVideo={onOpenVideo} />);
    await userEvent.click(screen.getByText("Video"));
    await userEvent.click(document.querySelector('[data-pw="media-video"]')!);
    expect(onOpenVideo, "a tap on a video did not open the viewer with that video").toHaveBeenCalledWith("https://example.com/v.mp4");
  });

  it("a file downloads on the user's machine", async () => {
    media.downloadFile.mockClear();
    await renderWithProviders(<MediaContainer id={7} mediaFiles={lists} />);
    await userEvent.click(screen.getByText("File"));
    await userEvent.click(document.querySelector('[data-pw="media-file"]')!);
    expect(media.downloadFile, "a tap on a file did not download it").toHaveBeenCalledWith("https://example.com/f.pdf");
  });
});
