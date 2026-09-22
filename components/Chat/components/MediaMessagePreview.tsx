"use client";

import Image from "next/image";
import React from "react";
import { createPortal } from "react-dom";

import { toDownloadUrl } from "components/Chat/videoSupport";
import { translateFunction } from "utils/functions";

// The full-screen viewer for one chat photo or one chat video.
//
// THE BUG THIS WAS REWRITTEN FOR. The backdrop used to be an absolutely
// positioned SIBLING of the media, and the media was meant to stay on top
// because it carried a bigger `z-index`:
//
//   <div class="fixed …">
//     <div class="absolute … bg-[#585751] opacity-60 z-9999" />
//     <video class="… z-999999" />          <- position: static
//   </div>
//
// `z-index` has no effect on a `position: static` element. So the video's
// z-999999 was thrown away, and CSS paints positioned boxes above in-flow ones
// whatever number they carry. The backdrop therefore covered the video: the
// sender heard the sound and saw a flat light-grey rectangle.
//
// The photo never had the bug. `next/image` with `fill` sets
// `position: absolute` itself, so its z-index did count. That is why the report
// was about video only.
//
// WHY IT LOOKED FINE ON SOME MACHINES. Chrome may hand a playing video to a
// hardware overlay plane, which the GPU draws over the page. Whether it does
// depends on the machine, the GPU and the driver. So the same build was correct
// on one laptop and grey on the next, with nothing in the page different — only
// who was looking.
//
// THE FIX IS STRUCTURAL, NOT A BIGGER NUMBER. There is no backdrop element any
// more: the dark layer is the container's own `background-color`, and an element
// cannot paint over its own content. Both branches also sit in a positioned box
// now, so neither one depends on a static element's z-index.

// WHY THIS PORTALS INTO <body>
//
// The chat is a `position: fixed` widget, and its stylesheets ask for z-index
// values as large as 10^54 (public/styles/chatstyles.css line 5). `z-index` is
// a 32-bit signed integer, so every one of those clamps down to 2147483647 —
// they all land on the SAME layer, and document order picks the winner.
// Rendered inside the chat tree, this viewer can be covered by any chat node
// that comes later in the document. At the end of <body> it comes last, which
// is the only thing that wins reliably. 2147483647 is the value
// components/global/ImageCropWidget.tsx already asks for, so the two agree.
const TOP_LAYER = 2147483647;

/** A round toolbar button, so the download and close buttons cannot drift. */
const TOOLBAR_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70";

type MediaMessagePreviewProps = {
  imgs: string | null;
  vid: string | null;
  setImgs: (value: string | null) => void;
  setVid: (value: string | null) => void;
};

function MediaMessagePreview({
  setImgs,
  setVid,
  vid,
  imgs,
}: MediaMessagePreviewProps) {
  const close = React.useCallback(() => {
    setImgs(null);
    setVid(null);
  }, [setImgs, setVid]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // The page behind must not scroll while the viewer is open. The previous
    // value is put back rather than cleared, so a widget that was already
    // holding the scroll still holds it afterwards.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  // `createPortal` needs a DOM. This only ever renders inside the chat, which
  // is client-only, but the guard costs nothing.
  if (typeof document === "undefined") return null;

  const source = vid || imgs || "";
  const label = translateFunction(vid ? "Video" : "Image");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      // A tap on the backdrop or on the photo closes the viewer. A tap on the
      // VIDEO does not: that click belongs to the player, which uses it to
      // play and pause, so the video branch stops it from bubbling. Escape and
      // the close button always work, for both kinds of media.
      onClick={close}
      style={{ zIndex: TOP_LAYER }}
      className="fixed inset-0 flex flex-col bg-black/90"
    >
      {/* `shrink-0` holds the toolbar at its own height, so the media below
          takes the rest instead of pushing the buttons off the screen. */}
      <div className="flex shrink-0 items-center justify-end gap-2 p-3">
        <a
          href={toDownloadUrl(source)}
          download
          target="_blank"
          rel="noreferrer"
          // Without this the click bubbles to the backdrop and the viewer shuts
          // in the same moment the download starts.
          onClick={(event) => event.stopPropagation()}
          title={translateFunction("Download")}
          aria-label={translateFunction("Download")}
          className={TOOLBAR_BUTTON}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 3.5v11m0 0 4.2-4.2M12 14.5l-4.2-4.2M4.5 19.5h15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <button
          type="button"
          onClick={close}
          title={translateFunction("Close")}
          aria-label={translateFunction("Close")}
          className={TOOLBAR_BUTTON}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* `min-h-0` is what lets this area shrink inside the column. A flex item
          defaults to `min-height: auto`, so a tall video would grow the column
          and push the toolbar out of the viewport.

          The video is centred by FLEX, not by `absolute inset-0 m-auto`. An
          absolutely positioned child sizes and offsets against the PADDING box,
          so `px-3 pb-5` had no effect on it and `max-w-full` let the video reach
          both screen edges. As a flex item it measures against the content box,
          so the spacing is real. `relative` is what keeps the branch below
          working. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-5">
        {vid ? (
          <video
            src={vid}
            controls
            autoPlay
            playsInline
            // `relative` adds no offset, so the layout is the same as static —
            // but the element is POSITIONED, which is the whole point of this
            // rewrite. A static box is painted below every positioned sibling
            // whatever `z-index` it carries, and that is how the backdrop came
            // to cover the video. Keeping it positioned means a sibling added
            // here later cannot bring the bug back.
            //
            // `h-full w-full object-contain` rather than the `max-h-full
            // max-w-full` pair. The max-* form asks the element to grow to the
            // video's own size, and WebKit does not: it keeps the 300x150
            // default that every <video> starts at, so the clip showed as a
            // postage stamp in the middle of the screen on Safari and iOS.
            // Filling the box and letterboxing inside it needs no intrinsic
            // size, so Chromium and WebKit agree — both measure 1256x716 in a
            // 1280x800 window.
            onClick={(event) => event.stopPropagation()}
            className="relative h-full w-full object-contain"
          />
        ) : (
          imgs && (
            // `fill` needs a positioned ancestor and fills it, so the photo gets
            // its own box rather than relying on the stage. `object-contain`
            // keeps the aspect ratio inside it.
            <div className="relative h-full w-full">
              <Image
                src={imgs}
                alt={label}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )
        )}
      </div>
    </div>,
    document.body,
  );
}

export default MediaMessagePreview;
