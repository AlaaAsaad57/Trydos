"use client";

import { translateFunction } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import { DisableScroll } from "utils/tinyUtils";
import { getCookie } from "utils/cookies/cookie-manager";

function AddToCartButton({ product }: { product: any }) {
  const { setSelectedProductForCart } = useAppStore();
  const Params = useSearchParams();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const shoulShowRedeem = () => {
    const redeemed_ids = getCookie<any[]>("redemed_ids") ?? [];
    if (product?.is_redeem) {
      return !redeemed_ids.find((s) => s.id === product.product_id);
    }
    return false;
  };
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  const compare = (a: any) => {
    let color_from_url = Params.get("color")?.toLowerCase();
    let text = a?.color_option || a?.color_name || a;
    text = text.toLowerCase();
    if (text === color_from_url) {
      return 1;
    } else {
      return -1;
    }
  };

  return (
    <div
      className={`${
        product ? "h-[68px] absolute" : "h-[63px] static"
      } w-[80px] justify-center bottom-0  left-0 right-0 mx-auto rounded-t-[15px] bg-[#513AAF] text-[13px] medium text-white items-start pt-[11px] shadow-[inset_0px_3px_6px_rgb(255,255,255,0.5)]`}
      data-cy="addToCartButton"
      onClick={(e) => {
        let seconds: any = 0;
        if (product) {
          if (shoulShowRedeem()) {
            seconds = document.querySelector<HTMLSpanElement>(
              "#product-redeem-counter-label",
            )?.innerText;
          }
          DisableScroll();
          setSelectedProductForCart({
            ...product,
            shouldUpdate: 0,
            fromProductPage: true,
            showRedeemPrice: shoulShowRedeem(),
            seconds: Number(seconds),
            sync_color_images: product?.sync_color_images
              ?.slice()
              ?.sort((a, b) => compare(a.color_name)),
          });
        }
      }}
    >
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  flex items-center justify-center gap-[4px]`}
      >
        <svg
          id="Group_14474"
          data-name="Group 14474"
          xmlns="http://www.w3.org/2000/svg"
          width="20.004"
          height="20.004"
          viewBox="0 0 20.004 20.004"
        >
          <g
            id="Path_23609"
            data-name="Path 23609"
            transform="translate(0 0)"
            fill="#fff"
          >
            <path
              d="M 10.001953125 19.65390396118164 C 4.679852962493896 19.65390396118164 0.3500031232833862 15.32405281066895 0.3500031232833862 10.001953125 C 0.3500031232833862 4.679852962493896 4.679852962493896 0.3500031232833862 10.001953125 0.3500031232833862 C 15.32405281066895 0.3500031232833862 19.65390396118164 4.679852962493896 19.65390396118164 10.001953125 C 19.65390396118164 15.32405281066895 15.32405281066895 19.65390396118164 10.001953125 19.65390396118164 Z"
              stroke="none"
            />
            <path
              d="M 10.001953125 0.7000026702880859 C 4.872842788696289 0.7000026702880859 0.7000026702880859 4.872842788696289 0.7000026702880859 10.001953125 C 0.7000026702880859 15.13106346130371 4.872842788696289 19.30390357971191 10.001953125 19.30390357971191 C 15.13106346130371 19.30390357971191 19.30390357971191 15.13106346130371 19.30390357971191 10.001953125 C 19.30390357971191 4.872842788696289 15.13106346130371 0.7000026702880859 10.001953125 0.7000026702880859 M 10.001953125 3.814697265625e-06 C 15.52588272094727 3.814697265625e-06 20.00390243530273 4.478023529052734 20.00390243530273 10.001953125 C 20.00390243530273 15.52588272094727 15.52588272094727 20.00390243530273 10.001953125 20.00390243530273 C 4.478023529052734 20.00390243530273 3.814697265625e-06 15.52588272094727 3.814697265625e-06 10.001953125 C 3.814697265625e-06 4.478023529052734 4.478023529052734 3.814697265625e-06 10.001953125 3.814697265625e-06 Z"
              stroke="none"
              fill="#513aaf"
            />
          </g>
          <path
            id="Path_21462"
            data-name="Path 21462"
            d="M1.343-2.2a.836.836,0,0,1-.617-.247A.839.839,0,0,1,.48-3.064a.789.789,0,0,1,.247-.6A.866.866,0,0,1,1.343-3.9H7.618a.85.85,0,0,1,.617.239.814.814,0,0,1,.247.61.814.814,0,0,1-.247.61.85.85,0,0,1-.617.239ZM4.458.814A.985.985,0,0,1,3.741.536a.949.949,0,0,1-.285-.711V-6.2a.937.937,0,0,1,.293-.711,1.012,1.012,0,0,1,.725-.278.953.953,0,0,1,.717.278.978.978,0,0,1,.27.711V-.175a.963.963,0,0,1-.278.711A.979.979,0,0,1,4.458.814Z"
            transform="translate(5.521 13.189)"
            fill="#513aaf"
          />
        </svg>
        <span>{translate("Buy")}</span>
      </div>
    </div>
  );
}

export default AddToCartButton;
