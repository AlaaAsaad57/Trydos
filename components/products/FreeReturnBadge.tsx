import { translateFunction } from "utils/server";

async function FreeReturnBadge({ qtyPricePromise, language, isRtl }) {
  const productData = await qtyPricePromise;
  const allowReturnInDays = Number(productData?.allow_return_in_days) || 0;

  // Backend signals "no returns" with 0 — hide the whole badge in that case.
  if (allowReturnInDays <= 0) {
    return null;
  }

  return (
    <div className="product-shipping h-auto rounded-none p-0 py-[8px] justify-start product-colors flex-col align-start relative">
      <div
        className={`${isRtl && "items-end"} colors-label w-full flex-col`}
        data-cy="FreeReturn"
      >
        <img
          src="/icons/FreeReturnIcon.svg"
          className="w-[30px] h-[30px]"
          alt=""
        />
        <div
          className={`${isRtl && "dir-rtl"} flex-col text-[#1d1d1d] medium text-[11px]`}
        >
          <span>{translateFunction("Free Return", language)}</span>
          <span className="label-description text-[#1d1d1d] regular text-[9px]">
            {translateFunction(
              "Return Is Completely Free Without Any Extras",
              language,
            )}
          </span>
          <div
            className={`${isRtl && "dir-rtl"} flex-row gap-[4px] items-start justify-start mt-[8px]`}
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
              >
                <g
                  id="Group_12947"
                  data-name="Group 12947"
                  transform="translate(0)"
                >
                  <path
                    id="refund"
                    d="M14.5,5c-.2-.229-.389-.87-.779-.643-.308.3.231.63.338.917A.259.259,0,1,0,14.5,5Zm.67,1.707c-.136-.275-.151-.94-.586-.823a.26.26,0,0,0-.139.34c.172.255.127.883.551.807a.26.26,0,0,0,.173-.324Zm.206,1.823c-.06-.3.1-.95-.353-.947a.259.259,0,0,0-.222.292c.1.291-.1.872.316.923a.26.26,0,0,0,.259-.268ZM15.1,10.344c.02-.308.339-.89-.1-1.006-.433,0-.28.6-.408.888a.259.259,0,0,0,.5.118Zm-.96,1.82c.339-.052.384-.543.537-.8a.259.259,0,1,0-.48-.2C14.125,11.472,13.586,12.063,14.144,12.163Zm-1.291.943a.262.262,0,0,0,.189.437c.3-.059.456-.431.657-.639a.259.259,0,1,0-.413-.314,6.507,6.507,0,0,1-.433.515Zm-1.231,1.485a2.465,2.465,0,0,0,.732-.455.26.26,0,0,0,.046-.365c-.3-.308-.629.231-.915.339a.261.261,0,0,0,.137.48Zm-1.643.644c.271-.093,1.045-.192.9-.6-.214-.376-.665.06-.972.09a.261.261,0,0,0,.075.508ZM1.376,8.4a7.229,7.229,0,0,0,7.261,7,.26.26,0,0,0,0-.52A6.7,6.7,0,0,1,1.894,8.4,6.463,6.463,0,0,1,12.753,3.65H11.726a.26.26,0,0,0,0,.52H13.37a.269.269,0,0,0,.259-.276V2.348a.259.259,0,1,0-.519,0v.926A6.98,6.98,0,0,0,1.376,8.4Z"
                    transform="translate(-1.376 -1.403)"
                    fill="#ff7600"
                  />
                  <g id="box" transform="translate(4.133 3.79)">
                    <path
                      id="Path_22816"
                      data-name="Path 22816"
                      d="M6.921,1.071H2.563a.689.689,0,0,0-.688.688V6.805a.689.689,0,0,0,.688.688H6.921a.689.689,0,0,0,.688-.688V1.759A.689.689,0,0,0,6.921,1.071Zm.459,5.734a.459.459,0,0,1-.459.459H2.563A.459.459,0,0,1,2.1,6.805V1.759A.459.459,0,0,1,2.563,1.3H3.71V3.053a.346.346,0,0,0,.5.308l.484-.242a.115.115,0,0,1,.1,0l.484.24a.343.343,0,0,0,.5-.307V1.3H6.921a.459.459,0,0,1,.459.459Z"
                      transform="translate(-1.875 -1.071)"
                      fill="#1d1d1d"
                    />
                    <path
                      id="Path_22817"
                      data-name="Path 22817"
                      d="M5.738,10.446H4.362a.345.345,0,0,0-.344.344v1.072a.344.344,0,0,0,.344.344H5.738a.344.344,0,0,0,.344-.344V10.79A.345.345,0,0,0,5.738,10.446Zm-1.261,1.11a.114.114,0,0,1,.115-.115h.917a.115.115,0,0,1,0,.229H4.591A.115.115,0,0,1,4.477,11.556Zm1.032-.344H4.591a.115.115,0,1,1,0-.229h.917a.115.115,0,1,1,0,.229Z"
                      transform="translate(-3.1 -6.433)"
                      fill="#1d1d1d"
                    />
                    <path
                      id="Path_22818"
                      data-name="Path 22818"
                      d="M11,14.023H9.729a.115.115,0,1,0,0,.229H11a.115.115,0,1,0,0-.229Z"
                      transform="translate(-6.301 -8.478)"
                      fill="#1d1d1d"
                    />
                    <path
                      id="Path_22819"
                      data-name="Path 22819"
                      d="M11.478,12.77h-.917a.115.115,0,1,0,0,.229h.917a.115.115,0,1,0,0-.229Z"
                      transform="translate(-6.777 -7.762)"
                      fill="#1d1d1d"
                    />
                  </g>
                </g>
              </svg>
            </span>
            <div className="flex-col text-[#1d1d1d] medium text-[11px]">
              <span>{translateFunction("Return Guarantee", language)}</span>
              <span className="text-[#1d1d1d] regular text-[9px]">
                {translateFunction("within", language)}
               <span className="medium m-1">
                 {allowReturnInDays}
               </span>
                {translateFunction(
                  "Days After Receiving The Product, You Can Return It Without Conditions Or Reasons With Complete Ease And",
                  language,
                )}
                <span className="meduim text-[#388CFF] px-[4px]">
                  {translateFunction("get the Amount back", language)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FreeReturnBadge;
