"use client";

// Loading fallback for the lazily-loaded stories viewer (NewStories). Mirrors
// the viewer's opening frame — fullscreen black overlay, top progress strips,
// avatar + name chrome — so the first story tap shows the viewer instantly
// while its chunk (cube carousel + gesture libs) downloads.
//
// The progress bars and the header are absolutely positioned exactly like
// StoryViewer's own chrome (`top-0 left-0 right-0` / `top-[10px] left-2`), so
// the avatar + name sit pinned to the top-left corner instead of being laid
// out by the overlay's flex column.
function StoryViewerSkeleton() {
  return (
    <div
      className="fixed top-0 left-0 w-screen h-full max-w-full max-h-full bg-black z-999999999999999"
      data-cy="story-viewer-skeleton"
    >
      {/* Story surface */}
      <div className="absolute inset-0 bg-neutral-900 animate-pulse" />

      {/* Progress bars — matches StoryViewer's strip row */}
      <div className="absolute top-0 left-0 right-0 pt-1 px-2 z-40 flex gap-1">
        <div className="h-[2px] flex-1 rounded-sm bg-white/60 animate-pulse" />
        <div className="h-[2px] flex-1 rounded-sm bg-white/30 animate-pulse" />
        <div className="h-[2px] flex-1 rounded-sm bg-white/30 animate-pulse" />
      </div>

      {/* Header (avatar + name) — left aligned, same anchor as StoryViewer */}
      <div className="absolute top-[10px] left-2 p-2 z-50 flex items-center justify-start gap-2">
        <div className="w-[30px] h-[30px] rounded-full bg-neutral-700 animate-pulse shrink-0" />
        <div className="flex flex-col gap-[6px]">
          <div className="w-[110px] h-[12px] rounded-full bg-neutral-700 animate-pulse" />
          <div className="w-[64px] h-[10px] rounded-full bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default StoryViewerSkeleton;
