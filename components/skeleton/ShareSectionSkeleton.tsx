"use client";
import "styles/share-options.css";

// Loading fallback for the lazily-loaded product share sheet (react-share).
// Mirrors ShareOptions' footprint: a wrapping row of share tiles, each a
// 70x70 rounded square (the network icons are rendered at size={70} with
// borderRadius={20}) above its name label.
function ShareSectionSkeleton() {
  return (
    <div className="share-options" data-cy="share-section-skeleton">
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="share-avatar" key={i}>
          <div className="w-[70px] h-[70px] rounded-[20px] bg-gray-200 animate-pulse" />
          <div className="share-name">
            <span className="w-[50px] h-[12px] rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShareSectionSkeleton;
