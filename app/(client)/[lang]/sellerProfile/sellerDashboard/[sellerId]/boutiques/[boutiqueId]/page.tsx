"use client";
import { useParams } from "next/navigation";
import BackBar from "components/setting/BackBar";
import { translateFunction } from "utils/functions";
import BoutiqueEditor from "components/SellerDashboard/boutiqueEdit/BoutiqueEditor";

export default function SellerBoutiqueEditPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const boutiqueId = params.boutiqueId as string;
  const local = params.lang?.toString() || "";
  const [, language] = local.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="w-full max-w-[1366px] mx-auto setting-screen pb-10">
      <div className="mb-3 bg-white">
        <BackBar
          isRtl={isRtl}
          local={local}
          name={translateFunction("Boutique", language)}
          preivous_page={`/${local}/sellerProfile/sellerDashboard/${sellerId}`}
          DataCy="seller-boutique-edit-screen"
        />
      </div>

      <div className="px-3 lg:px-0">
        <BoutiqueEditor sellerId={sellerId} boutiqueId={boutiqueId} local={local} />
      </div>
    </div>
  );
}
