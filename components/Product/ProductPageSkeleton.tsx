import { Skeleton } from "components/Server/Skeleton";
import SkeletonBack from "components/skeleton/SkeletonBack";

/**
 * The product page's shape while its data loads (XD `Home Page – 49`): the
 * header, the gallery, the name and the text. After a tap the card's first
 * photo, name and brand are known, so `ProductLoader` hands them in.
 */
export default function ProductPageSkeleton({
  photo,
  cardPhoto,
  name,
  brand,
  back = false,
}: {
  /** A direct landing: the back mark works now (see SkeletonBack). */
  back?: boolean;
  photo?: string;
  /** The tapped card's photo. The browser has it, so it shows at once. */
  cardPhoto?: string;
  name?: string;
  brand?: { logo: string; name: string };
}) {
  return (
    <div
      data-pw="product-page-skeleton"
      className="relative w-full mx-auto bg-white overflow-hidden"
      style={{ maxWidth: 500 }}
    >
      {back && <SkeletonBack />}
      <div className="flex items-center h-[50px] px-[36px]">
        {brand ? (
          <img src={brand.logo} alt={brand.name} height={15} className="block h-[15px] w-auto" />
        ) : (
          <Skeleton width={80} height={15} borderRadius={4} />
        )}
      </div>
      <div className="flex gap-[2px] h-[464px] mt-[2px] overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={name ?? ""}
            width={319}
            height={464}
            fetchPriority="high"
            className="block shrink-0 w-[319px] h-[464px] object-cover bg-cover bg-center"
            style={cardPhoto ? { backgroundImage: `url("${cardPhoto}")` } : undefined}
          />
        ) : (
          <Skeleton className="shrink-0" width={319} height={464} borderRadius={0} />
        )}
        <Skeleton className="shrink-0" width={319} height={464} borderRadius={0} />
      </div>
      <div className="flex flex-col gap-[8px] px-[14px] mt-[14px]">
        {brand ? (
          // The same logo as in the header: one name for it is enough.
          <img src={brand.logo} alt="" height={15} className="block h-[15px] w-auto self-start" />
        ) : (
          <Skeleton width={80} height={15} borderRadius={4} />
        )}
        {name ? (
          <p
            data-pw="productName_productPage"
            className="m-0 font-normal text-[13px] leading-[16px] text-[#1d1d1d] truncate"
          >
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
