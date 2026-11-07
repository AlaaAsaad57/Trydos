import { Skeleton } from "components/Server/Skeleton";
import { C, PAGE_MAX } from "components/DemoApp1/demo1Layout";
import SkeletonBack from "components/skeleton/SkeletonBack";

/** The card's shape in the file: a 214 x 311 photo and an 86 px footer. */
const PHOTO_RATIO = "214 / 311";
const FOOTER_H = 397 - 311;

/**
 * A listing while its first page loads (Stage 7b): the shape of the store
 * page (XD `Home Page – 47`), so nothing jumps when the page arrives. The
 * 50 px white header with the back mark, the title and the four marks, the
 * row of category tiles, and two rows of product cards. Every x is from the
 * start edge, so it mirrors on an Arabic or Kurdish page like the page does.
 */
export default function ListingPageSkeleton({
  back = false,
}: {
  /** A direct landing: the back mark works now (see SkeletonBack). */
  back?: boolean;
}) {
  return (
    <div
      data-pw="listing-loader"
      aria-hidden={back ? undefined : "true"}
      className="relative w-full flex flex-col mx-auto overflow-hidden"
      style={{ maxWidth: PAGE_MAX, background: C.white, minHeight: "100dvh" }}
    >
      <div
        className="flex items-center shrink-0"
        style={{ height: 50, paddingInline: 15, gap: 12 }}
      >
        {back ? (
          <span className="shrink-0" style={{ width: 12 }} />
        ) : (
          <Skeleton width={12} height={21} borderRadius={4} />
        )}
        <Skeleton width={80} height={15} borderRadius={4} />
        <div
          className="flex items-center"
          style={{ marginInlineStart: "auto", gap: 30 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={20} height={20} borderRadius={6} />
          ))}
        </div>
      </div>
      {back && <SkeletonBack />}
      <div
        className="flex shrink-0 overflow-hidden"
        style={{ gap: 2, marginTop: 2 }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="shrink-0">
            <Skeleton width={100} height={140} borderRadius={0} />
          </div>
        ))}
      </div>
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: "1fr 1fr", gap: 2, marginTop: 2 }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col min-w-0">
            <div style={{ aspectRatio: PHOTO_RATIO }}>
              <Skeleton width="100%" height="100%" borderRadius={0} />
            </div>
            <div
              className="flex flex-col"
              style={{ height: FOOTER_H, padding: "8px 12px 0", gap: 6 }}
            >
              <Skeleton width={40} height={11} borderRadius={4} />
              <Skeleton width="60%" height={11} borderRadius={4} />
              <Skeleton width={50} height={18} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
