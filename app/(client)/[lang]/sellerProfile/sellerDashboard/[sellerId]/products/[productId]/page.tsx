"use client";
import { useParams } from "next/navigation";
import BackBar from "components/setting/BackBar";
import { translateFunction } from "utils/functions";
import ProductEditor from "components/SellerDashboard/productEdit/ProductEditor";
import { useDashboardDetailBack } from "components/SellerDashboard/useDashboardDetailBack";

export default function SellerProductEditPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const productId = params.productId as string;
  const local = params.lang?.toString() || "";
  const [, language] = local.split("-");
  const isRtl = language === "ar" || language === "ku";
  const onBackIntercept = useDashboardDetailBack(sellerId);

  return (
    <div className="w-full max-w-[1366px] mx-auto setting-screen pb-10">
      <div className="mb-3 bg-white">
        <BackBar
          isRtl={isRtl}
          local={local}
          name={translateFunction("Product", language)}
          preivous_page={`/${local}/sellerProfile/sellerDashboard/${sellerId}`}
          onBackIntercept={onBackIntercept}
          DataCy="seller-product-edit-screen"
        />
      </div>

      <div className="px-3 lg:px-0">
        <ProductEditor sellerId={sellerId} productId={productId} local={local} />
      </div>
    </div>
  );
}
