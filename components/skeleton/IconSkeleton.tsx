"use client";

// Icon-sized loading fallback for lazily-loaded icon-trigger widgets (image /
// voice search). Matches the footprint of the SVG icons it stands in for so
// the row doesn't shift when the real component swaps in.
function IconSkeleton({ size = 24 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-gray-200 animate-pulse shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export default IconSkeleton;
