import { translateFunction } from "utils/server";
async function FreeShippingOption({ lang, qtyPricePromise }) {
  let productData = await qtyPricePromise;
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  if (Number(productData.shipping_cost) === 0)
    return (
      <div
        className={`product-colors h-auto p-0 product-sizes flex-col align-start relative py-[8px]  rounded-none`}
        style={{
          borderBottom: "#D3D3D37f 1px solid",
        }}
      >
        <div
          className={`${isRtl && "items-end"} w-full flex-col`}
          data-cy="FreeShipping"
        >
          <img src="/icons/FreeShipping.svg" className="w-[30px] h-[30px]" />
          <div
            className={`flex-col text-[#1d1d1d] medium text-[11px] ${
              isRtl && "items-end"
            }`}
          >
            <span>{translate("Free Shipping")}</span>
            <span className="text-[#1d1d1d] regular text-[9px]">
              {translate("Shipping Is Completely Free Without Any Extras")}
            </span>
            <div
              className={`flex-row gap-[4px] items-start justify-start mt-[8px] ${
                isRtl && "dir-rtl"
              }`}
            >
              <span>
                <svg
                  data-cy="deleiveryuaranteeIcon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="13.999"
                  height="14"
                  viewBox="0 0 13.999 14"
                >
                  <g
                    id="Group_12949"
                    data-name="Group 12949"
                    transform="translate(0 0)"
                  >
                    <path
                      id="refund"
                      d="M2.252,5c.2-.229.389-.87.779-.643.308.3-.231.63-.338.917A.259.259,0,1,1,2.252,5Zm-.67,1.707c.136-.275.151-.94.586-.823a.26.26,0,0,1,.139.34c-.172.255-.127.883-.551.807a.26.26,0,0,1-.173-.324ZM1.376,8.529c.06-.3-.1-.95.353-.947a.259.259,0,0,1,.222.292c-.1.291.1.872-.316.923a.26.26,0,0,1-.259-.268Zm.271,1.814c-.02-.308-.339-.89.1-1.006.433,0,.28.6.408.888a.259.259,0,0,1-.5.118Zm.96,1.82c-.339-.052-.384-.543-.537-.8a.259.259,0,1,1,.48-.2C2.627,11.471,3.165,12.063,2.607,12.163Zm1.29.943a.262.262,0,0,1-.189.437c-.3-.059-.456-.431-.657-.638a.259.259,0,1,1,.413-.314,6.507,6.507,0,0,0,.433.515ZM5.128,14.59a2.465,2.465,0,0,1-.732-.455.26.26,0,0,1-.046-.365c.3-.308.629.231.915.339a.261.261,0,0,1-.137.48Zm1.643.644c-.271-.093-1.045-.192-.9-.6.214-.376.665.06.972.09a.261.261,0,0,1-.075.508Zm8.6-6.831a7.229,7.229,0,0,1-7.26,7,.26.26,0,0,1,0-.519A6.7,6.7,0,0,0,14.857,8.4,6.462,6.462,0,0,0,4,3.65H5.025a.26.26,0,0,1,0,.52H3.382a.269.269,0,0,1-.259-.276V2.348a.259.259,0,1,1,.519,0v.926A6.98,6.98,0,0,1,15.375,8.4Z"
                      transform="translate(-1.376 -1.403)"
                      fill="#26c13f"
                    />
                    <g id="box" transform="translate(4.122 3.777)">
                      <path
                        id="Path_22820"
                        data-name="Path 22820"
                        d="M6.94,1.071H2.566a.691.691,0,0,0-.691.691V6.827a.691.691,0,0,0,.691.691H6.94a.691.691,0,0,0,.691-.691V1.762A.691.691,0,0,0,6.94,1.071ZM7.4,6.827a.46.46,0,0,1-.46.46H2.566a.46.46,0,0,1-.46-.46V1.762a.46.46,0,0,1,.46-.46H3.717V3.06a.347.347,0,0,0,.5.31L4.7,3.127a.116.116,0,0,1,.1,0l.486.241a.344.344,0,0,0,.5-.308V1.3H6.94a.46.46,0,0,1,.46.46Z"
                        transform="translate(-1.875 -1.071)"
                        fill="#1d1d1d"
                      />
                      <path
                        id="Path_22821"
                        data-name="Path 22821"
                        d="M5.744,10.446H4.363a.346.346,0,0,0-.345.345v1.076a.346.346,0,0,0,.345.345H5.744a.346.346,0,0,0,.345-.345V10.792A.346.346,0,0,0,5.744,10.446ZM4.478,11.561a.115.115,0,0,1,.115-.115h.921a.115.115,0,1,1,0,.23H4.593A.115.115,0,0,1,4.478,11.561Zm1.036-.345H4.593a.115.115,0,1,1,0-.23h.921a.115.115,0,1,1,0,.23Z"
                        transform="translate(-3.097 -6.418)"
                        fill="#1d1d1d"
                      />
                      <path
                        id="Path_22822"
                        data-name="Path 22822"
                        d="M11.008,14.023H9.729a.115.115,0,1,0,0,.23h1.278a.115.115,0,1,0,0-.23Z"
                        transform="translate(-6.289 -8.457)"
                        fill="#1d1d1d"
                      />
                      <path
                        id="Path_22823"
                        data-name="Path 22823"
                        d="M11.482,12.77h-.921a.115.115,0,1,0,0,.23h.921a.115.115,0,1,0,0-.23Z"
                        transform="translate(-6.763 -7.743)"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                </svg>
              </span>
              <div className="flex-col text-[#1d1d1d] medium text-[11px]">
                <span>{translate("Delivery Guarantee")}</span>

                <span className="text-[#1d1d1d] regular text-[9px]">
                  {translate("You Will Get A")}
                  <span className="text-[#388CFF]"> 25% </span>{" "}
                  <span className="text-[#388CFF]">{translate("Refund")}</span>{" "}
                  {translate("Of The Product Price If Shipping Is Delayed")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  else return <></>;
}

export default FreeShippingOption;
