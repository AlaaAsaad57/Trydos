// A video the browser cannot play offers a download instead of a dead play button.
//
// THE BUG THIS WAS WRITTEN FOR. VideoMessage always drew the play button, no
// matter what the <video> tag did with the file. When the browser could not
// decode the clip — an iPhone HEVC .mov is the everyday case, and Chrome and
// Firefox cannot decode HEVC on Windows or Android — the bubble showed an empty
// grey box with a play button that did nothing when tapped. Users read the
// missing frame as "still loading" and never found out the file was there.
//
// The <video> element is the only honest test available: it reports back
// through `error` when its decoder refuses the file. No check on the file name
// can tell an H.264 .mov from an HEVC .mov, because both are .mov.
//
// The download link carries `?download=1`. Without it the media server serves a
// recognised video with `Content-Disposition: inline` (MediaServing
// src/api/chat.js), so the click would open a new tab that plays nothing — the
// same dead end in a different window. The `download` attribute cannot fix it
// either: the media server is a different origin, and browsers ignore
// `download` cross-origin.
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";

import { renderWithProviders } from "../../render";

vi.mock("store/chat/chatUtils", () => ({
  DeleteMessage: vi.fn(),
  getMessageStatus: () => null,
  getMessageTime: () => "10:00",
}));

vi.mock("components/Chat/components/OptionsMenu", () => ({
  default: () => null,
}));

vi.mock("components/Chat/components/ChatPhoto", () => ({
  default: () => null,
}));

/** Where the media server serves a chat attachment. */
const FILE_PATH = "https://media.example.com/chat/file/6f2a-clip.mov";

async function renderVideoBubble() {
  const VideoMessage = (
    await import("components/Chat/components/messages/Types/VideoMessage")
  ).default;

  return renderWithProviders(
    <VideoMessage
      setOpen={() => {}}
      setDelete={() => {}}
      openMenu={false}
      type="lonely"
      is_forward={0}
      message_content={[{ file_path: FILE_PATH }]}
      isPrivate={null}
      message_status={[]}
      created_at={new Date().toISOString()}
      mid={null}
      id={1}
      DeleteModal={null}
      parent_message={null}
      GetMessage={() => {}}
      parent_message_id={null}
      setVid={() => {}}
      message_files={[{ file_path: FILE_PATH, file_name: "clip.mov" }]}
      channel_id={1}
      channel_member={null}
      is_from_sender={false}
      sender_user_id={2}
    />,
  );
}

// `data-pw` is this repo's hook attribute, the one the browser suite already
// uses, so the bubble carries one attribute rather than two.
const playButton = () =>
  document.querySelector<HTMLElement>('[data-pw="VIDEO-PLAY"]');
const downloadButton = () =>
  document.querySelector<HTMLElement>('[data-pw="VIDEO-DOWNLOAD"]');

describe("a chat video the browser cannot play", () => {
  it("shows the play button while the video has not complained", async () => {
    await renderVideoBubble();

    expect(
      playButton(),
      "a playable video lost its play button, so there is no way to start it",
    ).toBeInTheDocument();
    expect(
      downloadButton(),
      "a video that never reported an error already offers a download, so the fallback shows for clips that play perfectly well",
    ).not.toBeInTheDocument();
  });

  it("swaps the play button for a download when the decoder refuses the file", async () => {
    const { container } = await renderVideoBubble();

    const video = container.querySelector("video");
    expect(
      video,
      "the bubble drew no <video> element, so nothing can report a decode failure",
    ).not.toBeNull();

    fireEvent.error(video!);

    expect(
      downloadButton(),
      "the decoder refused the file and the bubble still did not offer a download, so the sender's video is unreachable",
    ).toBeInTheDocument();
    expect(
      playButton(),
      "the play button is still on screen next to a video that cannot play, which is the dead button this fix removes",
    ).not.toBeInTheDocument();
  });

  it("asks the media server for the file as an attachment, not inline", async () => {
    const { container } = await renderVideoBubble();

    fireEvent.error(container.querySelector("video")!);

    const link = downloadButton()!.closest("a");
    expect(
      link,
      "the download icon is not inside a link, so tapping it does nothing",
    ).not.toBeNull();
    expect(
      link!.getAttribute("href"),
      `the download link points at ${link?.getAttribute("href")}; without ?download=1 the media server serves the clip inline and the tap opens a tab that plays nothing`,
    ).toBe(`${FILE_PATH}?download=1`);
  });

  it("does not open the full-screen video player for a file that cannot play", async () => {
    const setVid = vi.fn();
    const VideoMessage = (
      await import("components/Chat/components/messages/Types/VideoMessage")
    ).default;

    const { container } = await renderWithProviders(
      <VideoMessage
        setOpen={() => {}}
        setDelete={() => {}}
        openMenu={false}
        type="lonely"
        is_forward={0}
        message_content={[{ file_path: FILE_PATH }]}
        isPrivate={null}
        message_status={[]}
        created_at={new Date().toISOString()}
        mid={null}
        id={1}
        DeleteModal={null}
        parent_message={null}
        GetMessage={() => {}}
        parent_message_id={null}
        setVid={setVid}
        message_files={[{ file_path: FILE_PATH, file_name: "clip.mov" }]}
        channel_id={1}
        channel_member={null}
        is_from_sender={false}
        sender_user_id={2}
      />,
    );

    fireEvent.error(container.querySelector("video")!);
    fireEvent.click(downloadButton()!);

    expect(
      setVid,
      "tapping the download icon still opened the full-screen player, which shows the same black frame the bubble already showed",
    ).not.toHaveBeenCalled();
  });
});
