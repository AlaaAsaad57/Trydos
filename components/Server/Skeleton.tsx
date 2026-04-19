// components/Skeleton.tsx
import "styles/skeleton.css";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: string | number;
  className?: string; // For custom shapes (rounded-full, w-20, h-4, etc.)
}

export function Skeleton({
  className,
  width = "100%",
  height = "100%",
  borderRadius = "0px",
}: SkeletonProps) {
  // We use a base class for the layout and a 'shimmer' class for the effect
  return (
    <div
      className={`skeleton-base ${className}`}
      style={{ width, height, borderRadius }}
    >
      <div className="shimmer-wrapper" />
    </div>
  );
}
