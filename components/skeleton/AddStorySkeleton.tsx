"use client";

// Loading fallback for the lazily-loaded add-story widget (camera + crop
// stack). Mirrors the widget's opening frame — fullscreen dimmed overlay with
// a centered story-sized panel and a capture-button circle — so tapping "+"
// shows the modal instantly while react-webcam / react-image-crop download.
function AddStorySkeleton() {
  return (
    <div
      className="fixed top-0 left-0 w-screen h-full max-w-full max-h-full bg-black/80 flex flex-col items-center justify-center z-999999999"
      data-pw="add-story-skeleton"
    >
      <div className="w-[300px] h-[430px] max-w-[85vw] max-h-[65vh] rounded-[15px] bg-neutral-800 animate-pulse" />
      <div className="mt-[24px] w-[64px] h-[64px] rounded-full bg-neutral-700 animate-pulse" />
    </div>
  );
}

export default AddStorySkeleton;
