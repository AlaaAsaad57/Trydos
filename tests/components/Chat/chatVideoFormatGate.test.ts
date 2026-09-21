// The chat only accepts video a browser can really open.
//
// THE BUG THIS WAS WRITTEN FOR. ConversationContainer picked the message type
// from the file NAME, and its list was much wider than anything a browser can
// play: .avi, .mkv, .flv and .wmv were all sent as a VideoMessage.
//
// The media server does not agree. It picks the stored Content-Type from the
// BYTES (MediaServing/src/utils/byteSniffer.js), and it knows exactly three
// video containers: mp4, mov (quicktime) and webm/matroska. An .avi is RIFF but
// not WEBP or WAVE, so it falls past every branch and is stored as
// application/octet-stream with the extension .bin. The download route then
// serves it with `Content-Disposition: attachment`.
//
// So the chat drew a <video> tag pointing at an attachment. It showed no frame,
// played nothing, and did not download either. The user saw an empty grey box
// with a play button that did nothing at all.
//
// .mov stays accepted on purpose. Every iPhone records one, and the H.264 ones
// play everywhere. The HEVC ones do not, and no name check can tell the two
// apart — that is what the download fallback in VideoMessage.tsx is for.
import { describe, expect, it } from "vitest";

import {
  MEDIA_INPUT_ACCEPT,
  isImageOrVideoFile,
  isSupportedVideoFile,
  pickMessageType,
  toDownloadUrl,
} from "components/Chat/videoSupport";

/**
 * A file with a name and a declared type, and no bytes worth allocating.
 *
 * The declared type is the browser's guess from the extension, so it is part of
 * what the code under test sees — an .avi really does arrive as
 * `video/x-msvideo`, which is exactly how it used to slip through.
 */
function fileNamed(name: string, type = ""): File {
  return new File([new Uint8Array(1)], name, { type });
}

/** Containers the media server's byte sniffer stores as a playable video. */
const PLAYABLE = [
  ["clip.mp4", "video/mp4"],
  ["clip.webm", "video/webm"],
  ["clip.mov", "video/quicktime"],
  ["clip.m4v", "video/x-m4v"],
  ["clip.3gp", "video/3gpp"],
] as const;

/** Containers the sniffer does not recognise, so they store as octet-stream. */
const NOT_PLAYABLE = [
  ["clip.avi", "video/x-msvideo"],
  ["clip.mkv", "video/x-matroska"],
  ["clip.flv", "video/x-flv"],
  ["clip.wmv", "video/x-ms-wmv"],
] as const;

describe("which videos the chat accepts", () => {
  it.each(PLAYABLE)(
    "still accepts %s, which the media server stores as a real video",
    (name, type) => {
      expect(
        isSupportedVideoFile(fileNamed(name, type)),
        `${name} was refused, but the media server stores it as a playable video`,
      ).toBe(true);
    },
  );

  it.each(NOT_PLAYABLE)(
    "refuses %s, which the media server can only store as an attachment",
    (name, type) => {
      expect(
        isSupportedVideoFile(fileNamed(name, type)),
        `${name} was accepted as a video, but the media server's byte sniffer does not know this container, so it is stored as application/octet-stream and no <video> tag can ever play it`,
      ).toBe(false);
    },
  );

  it.each(NOT_PLAYABLE)(
    "does not let %s through the media-only picker either",
    (name, type) => {
      expect(
        isImageOrVideoFile(fileNamed(name, type)),
        `${name} passed the media-only picker gate, so the sender was never told the format is not supported`,
      ).toBe(false);
    },
  );

  it.each(NOT_PLAYABLE)(
    "never turns %s into a VideoMessage",
    (name, type) => {
      expect(
        pickMessageType(fileNamed(name, type)),
        `${name} became a VideoMessage, so the chat drew a <video> tag pointing at an attachment the browser will not play`,
      ).not.toBe("VideoMessage");
    },
  );

  it("does not offer an unplayable container in the picker dialog", () => {
    for (const [name] of NOT_PLAYABLE) {
      const extension = name.slice(name.lastIndexOf("."));
      expect(
        MEDIA_INPUT_ACCEPT,
        `the picker still offers ${extension}, so the dialog invites a file the chat will refuse`,
      ).not.toContain(extension);
    }
  });

  it("does not offer every video type through a wildcard, which would undo the list", () => {
    expect(
      MEDIA_INPUT_ACCEPT,
      "the picker accepts video/*, so every container is offered again and the explicit list means nothing",
    ).not.toContain("video/*");
  });

  it("still sends an image to the crop widget rather than the video branch", () => {
    expect(
      pickMessageType(fileNamed("photo.jpg", "image/jpeg")),
      "a JPEG stopped being an ImageMessage",
    ).toBe("ImageMessage");
  });

  it("still sends a voice note to the audio branch", () => {
    expect(
      pickMessageType(fileNamed("note.m4a", "audio/mp4")),
      "a voice note stopped being a VoiceMessage",
    ).toBe("VoiceMessage");
  });

  it("sends a refused container as a plain file, so it can still be downloaded", () => {
    expect(
      pickMessageType(fileNamed("clip.avi", "video/x-msvideo")),
      "a refused .avi did not fall through to FileMessage, so there is no way to get the file at all",
    ).toBe("FileMessage");
  });
});

describe("asking the media server for a download", () => {
  it("adds the download flag to a plain attachment URL", () => {
    expect(
      toDownloadUrl("https://media.example.com/chat/file/abc.mov"),
      "the URL carries no download flag, so the media server still serves it inline and the browser shows an empty player",
    ).toBe("https://media.example.com/chat/file/abc.mov?download=1");
  });

  it("keeps a query string that is already there", () => {
    expect(
      toDownloadUrl("https://media.example.com/chat/file/abc.mov?v=2"),
      "the existing query was overwritten instead of extended",
    ).toBe("https://media.example.com/chat/file/abc.mov?v=2&download=1");
  });
});
