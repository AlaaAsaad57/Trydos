import Skeleton from "react-loading-skeleton";

/**
 * The product page's shape while its data loads (XD `Home Page – 49`): the
 * header, the gallery, the name and the text. After a tap the card's first
 * photo and name are known, so `ProductLoader` hands them in.
 */
export default function ProductPageSkeleton({
  photo,
  name,
}: {
  photo?: string;
  name?: string;
}) {
  return (
    <div
      data-pw="product-page-skeleton"
      className="relative w-full mx-auto bg-white overflow-hidden"
      style={{ maxWidth: 500 }}
    >
      <div className="flex items-center h-[50px] px-[36px]">
        <Skeleton width={80} height={15} borderRadius={4} />
      </div>
      <div className="flex gap-[2px] h-[464px] mt-[2px] overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={name ?? ""}
            width={319}
            height={464}
            fetchPriority="high"
            className="block shrink-0 w-[319px] h-[464px] object-cover"
          />
        ) : (
          <Skeleton width={319} height={464} borderRadius={0} />
        )}
        <Skeleton width={319} height={464} borderRadius={0} />
      </div>
      <div className="flex flex-col gap-[8px] px-[14px] mt-[14px]">
        <Skeleton width={80} height={15} borderRadius={4} />
        {name ? (
          <p className="m-0 font-normal text-[13px] leading-[16px] text-[#1d1d1d] truncate">
            {name}
          </p>
        ) : (
          <Skeleton width="70%" height={13} borderRadius={4} />
        )}
        <Skeleton width="90%" height={11} borderRadius={4} />
        <Skeleton width="60%" height={14} borderRadius={4} />
      </div>
    </div>
  );
}
