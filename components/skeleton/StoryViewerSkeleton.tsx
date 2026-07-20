"use client";

// Loading fallback for the lazily-loaded stories viewer (NewStories). Mirrors
// the viewer's opening frame — fullscreen black overlay, top progress strips,
// avatar + name chrome — so the first story tap shows the viewer instantly
// while its chunk (cube carousel + gesture libs) downloads.
function StoryViewerSkeleton() {
  return (
    <div
      className="fixed top-0 left-0 w-screen h-full max-w-full max-h-full bg-black flex flex-col z-999999999999999"
      data-cy="story-viewer-skeleton"
    >
      <div className="flex-row gap-[4px] w-full px-[8px] pt-[10px]">
        <div className="h-[3px] flex-1 rounded-full bg-neutral-600 animate-pulse" />
        <div className="h-[3px] flex-1 rounded-full bg-neutral-700 animate-pulse" />
        <div className="h-[3px] flex-1 rounded-full bg-neutral-700 animate-pulse" />
      </div>
      <div className="flex-row items-center gap-[10px] px-[12px] pt-[12px]">
        <div className="w-[36px] h-[36px] rounded-full bg-neutral-700 animate-pulse" />
        <div className="w-[120px] h-[12px] rounded-full bg-neutral-700 animate-pulse" />
      </div>
      <div className="flex-1 mx-[10px] my-[12px] rounded-[12px] bg-neutral-900 animate-pulse" />
    </div>
  );
}

export default StoryViewerSkeleton;
