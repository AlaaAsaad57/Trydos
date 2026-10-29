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

const media = vi.hoisted(() => ({ getMedia: vi.fn() }));
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
