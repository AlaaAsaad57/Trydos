"use client";

// Loading fallback for the lazily-loaded product share sheet (react-share).
// A row of circular placeholders matching the share buttons' footprint.
function ShareSectionSkeleton() {
  return (
    <div className="flex-row items-center gap-[14px] py-[10px] px-[6px]">
      <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse" />
      <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse" />
      <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse" />
      <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse" />
      <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse" />
    </div>
  );
}

export default ShareSectionSkeleton;
