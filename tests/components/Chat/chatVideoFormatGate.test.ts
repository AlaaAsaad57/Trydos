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
//
// THE SECOND BUG. The first fix drew the line in the wrong place: it asked
// "does the sniffer store this as a video?" and treated a yes as "a browser can
// play it". That holds for mp4 and webm. It does not hold for .3gp. A .3gp
// opens with the ISO brand 3gp4, which the sniffer does not list, so it takes
// the unknown-ISO-brand fallback and is stored as video/mp4. The container is
// fine; the codecs are not. A phone .3gp carries H.263 video and AMR audio, and
// no browser decodes either. Testers saw a bubble that only ever offered a
// download. So the question the gate asks is now "can a browser decode this?",
// and .3gp is refused at the picker like .avi.
import { describe, expect, it } from "vitest";

import {
  MEDIA_INPUT_ACCEPT,
  isImageOrVideoFile,
  isSupportedVideoFile,
  isUnsupportedVideoFile,
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

/** Containers the chat can really show: the media server stores them as a
 *  video, and a browser can decode what is inside. */
const PLAYABLE = [
  ["clip.mp4", "video/mp4"],
  ["clip.webm", "video/webm"],
  ["clip.mov", "video/quicktime"],
  ["clip.m4v", "video/x-m4v"],
] as const;

/**
 * Every container the chat must refuse, and why it can never play.
 *
 * The reason travels with the row so a failure names it. Two different faults
 * sit in this list, and telling them apart is the point:
 *
 *   - the byte sniffer does not know the container, so the file is stored as
 *     application/octet-stream and served as an attachment;
 *   - the sniffer does know the container, so the file is stored as a video,
 *     but the codecs inside it are ones no browser decodes.
 *
 * Both end the same way for the sender: a bubble that never plays. Only the
 * picker gate can stop either one, because neither is visible from the name
 * alone once the file is already uploaded.
 */
const REFUSED = [
  [
    "clip.avi",
    "video/x-msvideo",
    "RIFF/AVI is not WEBP and not WAVE, so it falls past every branch of the sniffer and is stored as application/octet-stream",
  ],
  [
    "clip.mkv",
    "video/x-matroska",
    "Matroska shares its magic bytes with WebM, so it is stored as video/webm, but an .mkv normally carries H.265 or AC-3 and no browser decodes those",
  ],
  [
    "clip.flv",
    "video/x-flv",
    "the sniffer has no branch for the FLV magic, so it is stored as application/octet-stream",
  ],
  [
    "clip.wmv",
    "video/x-ms-wmv",
    "the sniffer has no branch for the ASF magic, so it is stored as application/octet-stream",
  ],
  [
    "clip.3gp",
    "video/3gpp",
    "a .3gp opens with ftyp3gp4, a brand missing from the sniffer's ISO_VIDEO_BRANDS, so it takes the unknown-ISO-brand fallback and is stored as video/mp4 — but it carries H.263 video and AMR audio, which no browser decodes",
  ],
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

  it.each(REFUSED)(
    "refuses %s, which the chat can never show",
    (name, type, reason) => {
      expect(
        isSupportedVideoFile(fileNamed(name, type)),
        `${name} was accepted as a video, but ${reason}`,
      ).toBe(false);
    },
  );

  it.each(REFUSED)(
    "does not let %s through the media-only picker either",
    (name, type, reason) => {
      expect(
        isImageOrVideoFile(fileNamed(name, type)),
        `${name} passed the media-only picker gate, so the sender was never told the format is not supported — ${reason}`,
      ).toBe(false);
    },
  );

  it.each(REFUSED)(
    "never turns %s into a VideoMessage",
    (name, type, reason) => {
      expect(
        pickMessageType(fileNamed(name, type)),
        `${name} became a VideoMessage, so the chat drew a <video> tag the browser will not play — ${reason}`,
      ).not.toBe("VideoMessage");
    },
  );

  it("does not offer an unplayable container in the picker dialog", () => {
    for (const [name] of REFUSED) {
      const extension = name.slice(name.lastIndexOf("."));
      expect(
        MEDIA_INPUT_ACCEPT,
        `the picker still offers ${extension}, so the dialog invites a file the chat will refuse`,
      ).not.toContain(extension);
    }
  });

  it("does not offer a refused container by its declared type either", () => {
    // The dialog filters on BOTH forms, and they are separate entries in the
    // string. Dropping ".3gp" while leaving "video/3gpp" still offers the file.
    expect(
      MEDIA_INPUT_ACCEPT,
      "the picker still offers video/3gpp, so a .3gp is still shown in the dialog even though the gate refuses it",
    ).not.toContain("video/3gpp");
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

describe("choosing the refusal wording for a video the chat cannot show", () => {
  it("does not call a playable video unsupported", () => {
    expect(isUnsupportedVideoFile(fileNamed("clip.mp4")), "a playable .mp4 was called an unsupported video").toBe(false);
  });

  it("names a known unplayable container by its file name", () => {
    expect(isUnsupportedVideoFile(fileNamed("clip.avi")), "an .avi was not called an unsupported video").toBe(true);
  });

  it("names an unknown video by its declared video type", () => {
    expect(isUnsupportedVideoFile(fileNamed("clip.xyz", "video/x-foo")), "a file declared as an unknown video type was not called a video").toBe(true);
  });

  it("does not call a plain document a video", () => {
    expect(isUnsupportedVideoFile(fileNamed("notes.pdf", "application/pdf")), "a PDF was called an unsupported video").toBe(false);
    expect(isUnsupportedVideoFile(fileNamed("notes")), "a file with no type was called an unsupported video").toBe(false);
  });
});
