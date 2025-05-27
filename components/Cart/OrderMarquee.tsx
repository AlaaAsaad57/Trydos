import { useParams } from "next/navigation";
import React from "react";
import { translateFunction } from "utils/functions";

function OrderMarquee({ shippingCost }) {
  const { lang } = useParams();
  // @ts-ignore
  const languageVariable = lang.split("-")[1];
  const translate = (key) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <div
      data-cy="horizontal-tape-container"
      className="flex flex-row pl-3 items-center marquee-slide mt-2"
    >
      <div data-cy="firstItem-onHorizontalTape" className="flex items-center">
        <DeleiveryIcon />
        <div
          data-cy="deleivery-text"
          className="ml-1 whitespace-nowrap regular  text-[11px] text-[#505050]"
        >
          {translate("Delivery")}
          <span data-cy="text-name" className="bold ml-1">
            2 June
          </span>
        </div>
      </div>
      {shippingCost === 0 && (
        <div
          data-cy="secondItem-onHorizontalTape"
          className="flex items-center ml-2"
        >
          <FreeShippingIcon />
          <div
            data-cy="FreeShipping-text"
            className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
          >
            {translate("Free Shipping")}
          </div>
        </div>
      )}
      <div
        data-cy="thirdItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <FreeReturnIcon />
        <div
          data-cy="FreeReturn-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Free Return")}
        </div>
      </div>
      <div
        data-cy="fourthItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <DeleiveryGuaranteeIcon />
        <div
          data-cy="DeliveryGuarantee-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Delivery Guarantee")}
        </div>
      </div>
      <div
        data-cy="fifthItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <ReturnGuranteeIcon />
        <div
          data-cy="ReturnGurantee-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Return Guarantee")}
        </div>
      </div>
      <div
        data-cy="sixtyItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <SecurePaymentIcon />
        <div
          data-cy="SecurePayment-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Secure Privacy")}
        </div>
      </div>
      <div
        data-cy="seventyItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <SafePaymentIcon />
        <div
          data-cy="SafePayment-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Safe & Easy Payment")}
        </div>
      </div>
      <div
        data-cy="eightyItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <PurchaseProtectionIcon />
        <div
          data-cy="PurchaseProtection-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Purshase Protection")}
        </div>
      </div>
      <div
        data-cy="nintyItem-onHorizontalTape"
        className="flex items-center ml-2"
      >
        <MoneyIcon />
        <div
          data-cy="Money-text"
          className="ml-1 whitespace-nowrap regular text-[11px] text-[#505050]"
        >
          {translate("Earn Money With This Order")}
        </div>
      </div>
    </div>
  );
}

export default OrderMarquee;
const DeleiveryIcon = () => {
  return (
    <svg
      data-cy="deleivery-icon"
      id="Group_3138"
      data-name="Group 3138"
      xmlns="http://www.w3.org/2000/svg"
      width="9.333"
      height="14"
      viewBox="0 0 9.333 14"
    >
      <g id="delivery-man">
        <path
          id="Path_15213"
          data-name="Path 15213"
          d="M91.345,117.029a.492.492,0,0,0-.46-.459l-1.556-.025a.219.219,0,0,1-.2-.181l-.343-2.316a.473.473,0,0,0-.488-.426l-1.934.09a.448.448,0,0,0-.462.513s-.008,5.148-.018,5.335l-.068,1.274a2.215,2.215,0,0,1-.136.6l-.783,1.884a.471.471,0,0,0,0,.377.425.425,0,0,0,.279.233l.261.069a.472.472,0,0,0,.121.015.562.562,0,0,0,.5-.323l.744-1.613a4.079,4.079,0,0,0,.228-.673l.42-1.86,1.016,1.652a1.645,1.645,0,0,1,.19.559l.2,1.85a.531.531,0,0,0,.5.478h.3a.424.424,0,0,0,.327-.152.482.482,0,0,0,.109-.361l-.205-2.2a3.37,3.37,0,0,0-.156-.7l-.911-2.529-.006-.533,2.117-.083a.414.414,0,0,0,.3-.151.469.469,0,0,0,.106-.339Zm-1.982,6.9Z"
          transform="translate(-84.864 -110.083)"
          fill="#3c3c3c"
        />
        <path
          id="Path_15214"
          data-name="Path 15214"
          d="M109.883,3.05A1.525,1.525,0,0,0,111.4,1.359l.511-.058a.541.541,0,0,0,.42-.33L112.5.5a.3.3,0,0,0-.026-.277.286.286,0,0,0-.24-.117l-.036,0-1.478.141a1.525,1.525,0,1,0-.838,2.8Z"
          transform="translate(-107.626)"
          fill="#3c3c3c"
        />
      </g>
      <path
        id="_007-gift"
        data-name="007-gift"
        d="M1.756,4.1V2.235a.067.067,0,0,1,.064-.07h.32a.067.067,0,0,1,.064.07V4.1a.067.067,0,0,1-.064.07H1.82A.067.067,0,0,1,1.756,4.1ZM1.564,2.165.4,2.163a.067.067,0,0,0-.064.07V3.825a.335.335,0,0,0,.32.348h.912a.067.067,0,0,0,.064-.07V2.235a.067.067,0,0,0-.064-.07Zm2,0-1.167,0a.067.067,0,0,0-.064.07V4.1a.067.067,0,0,0,.064.07h.912a.335.335,0,0,0,.32-.348V2.233a.067.067,0,0,0-.064-.07ZM1.532,2.026h.9a.067.067,0,0,0,.064-.07V1.042a.067.067,0,0,0-.064-.07h-.9a.067.067,0,0,0-.064.07v.915A.067.067,0,0,0,1.532,2.026ZM3.579.972h-.9a.067.067,0,0,0-.064.07v.915a.067.067,0,0,0,.064.07h.9a.335.335,0,0,0,.32-.348V1.32A.335.335,0,0,0,3.579.972Zm-2.3,0H.38a.335.335,0,0,0-.32.348v.358a.335.335,0,0,0,.32.348h.9a.067.067,0,0,0,.064-.07V1.042A.067.067,0,0,0,1.276.972ZM2.427,0A.482.482,0,0,0,2.11.12a.074.074,0,0,0-.011.1.061.061,0,0,0,.09.012.361.361,0,0,1,.238-.09.417.417,0,0,1,.347.6.068.068,0,0,0,.059.1A.063.063,0,0,0,2.89.794.556.556,0,0,0,2.427,0ZM1.54,0a.555.555,0,0,0-.471.794.063.063,0,0,0,.059.039.068.068,0,0,0,.056-.1.416.416,0,0,1,.354-.6.407.407,0,0,1,.377.424v.2a.064.064,0,1,0,.128,0v-.2A.542.542,0,0,0,1.54,0Z"
        transform="translate(5.434 1.183)"
        fill="#ff7272"
      />
    </svg>
  );
};
const FreeShippingIcon = () => {
  return (
    <svg
      data-cy="free-shipping-icon"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="14"
      height="14"
      viewBox="0 0 14 14"
    >
      <defs>
        <clipPath id="clip-path121">
          <rect
            id="Rectangle_5776"
            data-name="Rectangle 5776"
            width="14"
            height="14"
            transform="translate(0)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Group_12953"
        data-name="Group 12953"
        transform="translate(-103 -283)"
      >
        <g
          id="Mask_Group_540"
          data-name="Mask Group 540"
          transform="translate(103 283)"
          clipPath="url(#clip-path121)"
        >
          <g id="fast" transform="translate(0.231 3.086)">
            <path
              id="Path_22070"
              data-name="Path 22070"
              d="M3.431,11.712H1.712l-.068.347a.426.426,0,0,0,.421.506h1.3a1.557,1.557,0,0,1-.023-.284,1.887,1.887,0,0,1,.085-.569ZM9.507,5.9a.413.413,0,0,0-.33-.159H3.2a.432.432,0,0,0-.421.347l-.04.222H4.057a.993.993,0,0,1,.506,1.849.989.989,0,0,1,0,1.707,1.027,1.027,0,0,1,.4.461,1.991,1.991,0,0,1,2.361,1.957,1.557,1.557,0,0,1-.023.284H7.9a.426.426,0,0,0,.415-.336l1.28-5.974A.412.412,0,0,0,9.507,5.9Z"
              transform="translate(-0.501 -5.738)"
              fill="#bef4cd"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22071"
              data-name="Path 22071"
              d="M14.651,8.2H13.434a.433.433,0,0,0-.421.336L12.1,12.8a.428.428,0,0,0,.415.518h.307a1.557,1.557,0,0,1-.023-.284,1.991,1.991,0,0,1,3.983,0,.979.979,0,0,1-.011.182.372.372,0,0,0,.142-.233l.427-1.991a.5.5,0,0,0,.011-.091,2.7,2.7,0,0,0-2.7-2.7Z"
              transform="translate(-3.699 -6.49)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22072"
              data-name="Path 22072"
              d="M4.057,8.231H2.066a.427.427,0,1,1,0-.853H4.057a.427.427,0,0,1,0,.853Z"
              transform="translate(-0.501 -6.239)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22073"
              data-name="Path 22073"
              d="M3.807,10.69H1.246a.427.427,0,1,1,0-.853h2.56a.427.427,0,1,1,0,.853Z"
              transform="translate(-0.251 -6.991)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22074"
              data-name="Path 22074"
              d="M3.556,13.149H.427a.427.427,0,1,1,0-.853H3.556a.427.427,0,1,1,0,.853Z"
              transform="translate(0 -7.743)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22075"
              data-name="Path 22075"
              d="M15.357,15.96a1.422,1.422,0,1,1,1.422-1.422,1.422,1.422,0,0,1-1.422,1.422Z"
              transform="translate(-4.262 -7.994)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22076"
              data-name="Path 22076"
              d="M6.34,15.96a1.422,1.422,0,1,1,1.422-1.422A1.422,1.422,0,0,1,6.34,15.96Z"
              transform="translate(-1.504 -7.994)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
const FreeReturnIcon = () => {
  return (
    <svg
      data-cy="free-return-icon"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="14"
      height="14"
      viewBox="0 0 14 14"
    >
      <defs>
        <clipPath id="clip-path1221">
          <rect
            id="Rectangle_5775"
            data-name="Rectangle 5775"
            width="14"
            height="14"
            transform="translate(0)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Group_12951"
        data-name="Group 12951"
        transform="translate(-103 -251)"
      >
        <g
          id="Mask_Group_539"
          data-name="Mask Group 539"
          transform="translate(103 251)"
          clipPath="url(#clip-path1221)"
        >
          <g id="fast" transform="translate(0.231 2.959)">
            <path
              id="Path_22070"
              data-name="Path 22070"
              d="M7.809,11.712H9.528l.068.347a.426.426,0,0,1-.421.506h-1.3a1.557,1.557,0,0,0,.023-.284A1.887,1.887,0,0,0,7.809,11.712ZM1.733,5.9a.413.413,0,0,1,.33-.159H8.037a.432.432,0,0,1,.421.347l.04.222H7.184a.993.993,0,0,0-.506,1.849.989.989,0,0,0,0,1.707,1.027,1.027,0,0,0-.4.461,1.991,1.991,0,0,0-2.361,1.957,1.557,1.557,0,0,0,.023.284H3.343a.426.426,0,0,1-.415-.336L1.647,6.255A.412.412,0,0,1,1.733,5.9Z"
              transform="translate(2.916 -5.738)"
              fill="#ffa7a8"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22071"
              data-name="Path 22071"
              d="M14.8,8.2h1.218a.433.433,0,0,1,.421.336l.91,4.267a.428.428,0,0,1-.415.518h-.307a1.558,1.558,0,0,0,.023-.284,1.991,1.991,0,0,0-3.983,0,.979.979,0,0,0,.011.182.372.372,0,0,1-.142-.233L12.1,10.99a.5.5,0,0,1-.011-.091,2.7,2.7,0,0,1,2.7-2.7Z"
              transform="translate(-12.093 -6.49)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22072"
              data-name="Path 22072"
              d="M2.066,8.231H4.057a.427.427,0,0,0,0-.853H2.066a.427.427,0,0,0,0,.853Z"
              transform="translate(8.033 -6.239)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22073"
              data-name="Path 22073"
              d="M1.246,10.69h2.56a.427.427,0,1,0,0-.853H1.246a.427.427,0,1,0,0,.853Z"
              transform="translate(8.853 -6.991)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22074"
              data-name="Path 22074"
              d="M.427,13.149H3.556a.427.427,0,1,0,0-.853H.427a.427.427,0,1,0,0,.853Z"
              transform="translate(9.673 -7.743)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22075"
              data-name="Path 22075"
              d="M15.357,15.96a1.422,1.422,0,1,0-1.422-1.422,1.422,1.422,0,0,0,1.422,1.422Z"
              transform="translate(-12.796 -7.994)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
            <path
              id="Path_22076"
              data-name="Path 22076"
              d="M6.34,15.96a1.422,1.422,0,1,0-1.422-1.422A1.422,1.422,0,0,0,6.34,15.96Z"
              transform="translate(2.479 -7.994)"
              fill="#e8ffed"
              stroke="#1d1d1d"
              strokeWidth="0.328"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
const DeleiveryGuaranteeIcon = () => {
  return (
    <svg
      data-cy="deleiveryuaranteeIcon"
      xmlns="http://www.w3.org/2000/svg"
      width="13.999"
      height="14"
      viewBox="0 0 13.999 14"
    >
      <g id="Group_12949" data-name="Group 12949" transform="translate(0 0)">
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
  );
};
const ReturnGuranteeIcon = () => {
  return (
    <svg
      data-cy="Return-Gurantee-Icon"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="13.999"
      viewBox="0 0 14 13.999"
    >
      <g id="Group_12947" data-name="Group 12947" transform="translate(0 0)">
        <path
          id="refund"
          d="M14.5,5c-.2-.229-.389-.87-.779-.643-.308.3.231.63.338.917A.259.259,0,1,0,14.5,5Zm.67,1.707c-.136-.275-.151-.94-.586-.823a.26.26,0,0,0-.139.34c.172.255.127.883.551.807a.26.26,0,0,0,.173-.324Zm.206,1.823c-.06-.3.1-.95-.353-.947a.259.259,0,0,0-.222.292c.1.291-.1.872.316.923a.26.26,0,0,0,.259-.268ZM15.1,10.343c.02-.308.339-.89-.1-1.006-.433,0-.28.6-.408.888a.259.259,0,0,0,.5.118Zm-.96,1.82c.339-.052.384-.543.537-.8a.259.259,0,1,0-.48-.2C14.124,11.471,13.586,12.063,14.144,12.163Zm-1.29.943a.262.262,0,0,0,.189.437c.3-.059.456-.431.657-.638a.259.259,0,1,0-.413-.314,6.506,6.506,0,0,1-.433.515ZM11.623,14.59a2.465,2.465,0,0,0,.732-.455.26.26,0,0,0,.046-.365c-.3-.308-.629.231-.915.339a.261.261,0,0,0,.137.48Zm-1.643.644c.271-.093,1.045-.192.9-.6-.214-.376-.665.06-.972.09a.261.261,0,0,0,.075.508ZM1.376,8.4a7.229,7.229,0,0,0,7.26,7,.26.26,0,0,0,0-.519A6.7,6.7,0,0,1,1.894,8.4,6.462,6.462,0,0,1,12.752,3.65H11.726a.26.26,0,0,0,0,.52h1.644a.269.269,0,0,0,.259-.276V2.348a.259.259,0,1,0-.519,0v.926A6.98,6.98,0,0,0,1.376,8.4Z"
          transform="translate(-1.376 -1.403)"
          fill="#ff7600"
        />
        <g id="box" transform="translate(4.133 3.79)">
          <path
            id="Path_22816"
            data-name="Path 22816"
            d="M6.92,1.071H2.563a.689.689,0,0,0-.688.688V6.8a.689.689,0,0,0,.688.688H6.92A.689.689,0,0,0,7.608,6.8V1.759A.689.689,0,0,0,6.92,1.071ZM7.379,6.8a.459.459,0,0,1-.459.459H2.563A.459.459,0,0,1,2.1,6.8V1.759A.459.459,0,0,1,2.563,1.3H3.71V3.053a.346.346,0,0,0,.5.308l.484-.242a.115.115,0,0,1,.1,0l.484.24a.343.343,0,0,0,.5-.307V1.3H6.92a.459.459,0,0,1,.459.459Z"
            transform="translate(-1.875 -1.071)"
            fill="#1d1d1d"
          />
          <path
            id="Path_22817"
            data-name="Path 22817"
            d="M5.738,10.446H4.362a.345.345,0,0,0-.344.344v1.072a.344.344,0,0,0,.344.344H5.738a.344.344,0,0,0,.344-.344V10.79A.345.345,0,0,0,5.738,10.446Zm-1.261,1.11a.114.114,0,0,1,.115-.115h.917a.115.115,0,1,1,0,.229H4.591A.115.115,0,0,1,4.477,11.556Zm1.032-.344H4.591a.115.115,0,1,1,0-.229h.917a.115.115,0,1,1,0,.229Z"
            transform="translate(-3.101 -6.433)"
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
  );
};
const SecurePaymentIcon = () => {
  return (
    <svg
      data-cy="Secure-Payment-Icon"
      xmlns="http://www.w3.org/2000/svg"
      width="13.999"
      height="13.999"
      viewBox="0 0 13.999 13.999"
    >
      <g id="Group_12945" data-name="Group 12945" transform="translate(0 0)">
        <g id="Group_12944" data-name="Group 12944" transform="translate(0 0)">
          <g
            id="Group_12942"
            data-name="Group 12942"
            transform="translate(0 0)"
          >
            <path
              id="Path_22811"
              data-name="Path 22811"
              d="M21.543,48.013a.165.165,0,0,0-.122.2,6.794,6.794,0,0,1,.181,1.553,6.68,6.68,0,0,1-6.671,6.674,6.59,6.59,0,0,1-4.021-1.351,1.1,1.1,0,1,0-.223.243,6.915,6.915,0,0,0,4.244,1.437,7.01,7.01,0,0,0,6.81-8.631.164.164,0,0,0-.2-.123Z"
              transform="translate(-7.932 -42.768)"
              fill="#26c13f"
            />
            <path
              id="Path_22812"
              data-name="Path 22812"
              d="M.479,7.163A6.671,6.671,0,0,1,10.643,1.477a.983.983,0,1,0,.187-.271A7,7,0,0,0,.266,8.437a.163.163,0,0,0,.161.135.136.136,0,0,0,.03,0A.165.165,0,0,0,.59,8.378,6.682,6.682,0,0,1,.479,7.163Z"
              transform="translate(-0.15 -0.16)"
              fill="#26c13f"
            />
          </g>
          <g
            id="Group_12943"
            data-name="Group 12943"
            transform="translate(3.5 3.5)"
          >
            <path
              id="Path_22813"
              data-name="Path 22813"
              d="M55,45.671v.068h1.363v-.068A.682.682,0,1,0,55,45.671Z"
              transform="translate(-52.182 -42.988)"
              fill="#1d1d1d"
            />
            <path
              id="Path_22814"
              data-name="Path 22814"
              d="M24.125,18.36a5.577,5.577,0,0,1-2.958-1.066.348.348,0,0,0-.394,0,5.612,5.612,0,0,1-2.958,1.066.349.349,0,0,0-.243.094.321.321,0,0,0-.1.232A5.579,5.579,0,0,0,20.817,24.2a.349.349,0,0,0,.305,0,5.579,5.579,0,0,0,3.347-5.511A.336.336,0,0,0,24.125,18.36Zm-1.914,3.3a.553.553,0,0,1-.564.542H20.293a.553.553,0,0,1-.564-.542V20.5a.541.541,0,0,1,.338-.5v-.112a.9.9,0,0,1,1.805,0v.112a.541.541,0,0,1,.338.5Z"
              transform="translate(-17.47 -17.233)"
              fill="#1d1d1d"
            />
            <path
              id="Path_22815"
              data-name="Path 22815"
              d="M60.618,63.391a.073.073,0,0,1,.015-.058.244.244,0,1,0-.4,0,.072.072,0,0,1,.015.057c-.018.089-.068.342-.1.518a.151.151,0,0,0,.149.181h.282a.151.151,0,0,0,.149-.181Z"
              transform="translate(-56.932 -59.678)"
              fill="#1d1d1d"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
const SafePaymentIcon = () => {
  return (
    <svg
      data-cy="Safe-Payment-Icon"
      xmlns="http://www.w3.org/2000/svg"
      width="13.999"
      height="14"
      viewBox="0 0 13.999 14"
    >
      <g id="Group_12940" data-name="Group 12940" transform="translate(0 0)">
        <g id="Group_12939" data-name="Group 12939" transform="translate(0 0)">
          <path
            id="Path_22809"
            data-name="Path 22809"
            d="M21.543,48.013a.165.165,0,0,0-.122.2,6.794,6.794,0,0,1,.181,1.553,6.68,6.68,0,0,1-6.671,6.674,6.59,6.59,0,0,1-4.021-1.351,1.1,1.1,0,1,0-.223.243,6.915,6.915,0,0,0,4.244,1.437,7.01,7.01,0,0,0,6.81-8.631.164.164,0,0,0-.2-.123Z"
            transform="translate(-7.932 -42.767)"
            fill="#1d1d1d"
          />
          <path
            id="Path_22810"
            data-name="Path 22810"
            d="M.479,7.163A6.671,6.671,0,0,1,10.643,1.477a.983.983,0,1,0,.187-.271A7,7,0,0,0,.266,8.437a.163.163,0,0,0,.161.135.136.136,0,0,0,.03,0A.165.165,0,0,0,.59,8.378,6.682,6.682,0,0,1,.479,7.163Z"
            transform="translate(-0.15 -0.16)"
            fill="#1d1d1d"
          />
        </g>
        <path
          id="credit-card"
          d="M2,6.75A.75.75,0,0,1,2.75,6h5.5A.75.75,0,0,1,9,6.75V7H2ZM2,7.5H9v2.751a.75.75,0,0,1-.75.75H2.75a.75.75,0,0,1-.75-.75ZM6,9.251a.25.25,0,1,0,0,.5H7.5a.25.25,0,1,0,0-.5Z"
          transform="translate(1.498 -1.5)"
          fill="#1d1d1d"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
};
const PurchaseProtectionIcon = () => {
  return (
    <svg
      data-cy="Purchase-Protection-Icon"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
    >
      <g id="Group_12937" data-name="Group 12937" transform="translate(0)">
        <g id="Group_12936" data-name="Group 12936" transform="translate(0 0)">
          <g id="Group_12935" data-name="Group 12935" transform="translate(0)">
            <path
              id="Path_22807"
              data-name="Path 22807"
              d="M21.543,48.013a.165.165,0,0,0-.122.2,6.794,6.794,0,0,1,.181,1.553,6.68,6.68,0,0,1-6.671,6.674,6.59,6.59,0,0,1-4.021-1.351,1.1,1.1,0,1,0-.223.243,6.915,6.915,0,0,0,4.244,1.437,7.01,7.01,0,0,0,6.81-8.631.164.164,0,0,0-.2-.123Z"
              transform="translate(-7.932 -42.767)"
              fill="#0259ff"
            />
            <path
              id="Path_22808"
              data-name="Path 22808"
              d="M.479,7.163A6.671,6.671,0,0,1,10.643,1.477a.983.983,0,1,0,.187-.271A7,7,0,0,0,.266,8.437a.163.163,0,0,0,.161.135.136.136,0,0,0,.03,0A.165.165,0,0,0,.59,8.378,6.682,6.682,0,0,1,.479,7.163Z"
              transform="translate(-0.15 -0.16)"
              fill="#0259ff"
            />
          </g>
          <g
            id="Group_4033"
            data-name="Group 4033"
            transform="translate(4.152 3.87)"
          >
            <g id="Group_4032" data-name="Group 4032">
              <path
                id="Path_15859"
                data-name="Path 15859"
                d="M-1.547-.921H2.248l.717,3.957s-.359.55-.565.55a40,40,0,0,1-4.193-.069c-.343-.042-.463-.481-.463-.481Z"
                transform="translate(2.372 2.678)"
                fill="#1d1d1d"
              />
              <g id="bag-5">
                <g id="Group_2946" data-name="Group 2946">
                  <path
                    id="Path_15168"
                    data-name="Path 15168"
                    d="M30.762,19.725h3.906a.763.763,0,0,0,.762-.762.081.081,0,0,0,0-.014l-.634-3.58a.421.421,0,0,0-.417-.356H33.92V14.58a1.206,1.206,0,0,0-2.411,0v.433h-.457a.421.421,0,0,0-.418.357L30,18.949a.082.082,0,0,0,0,.014A.763.763,0,0,0,30.762,19.725Zm.913-5.146a1.039,1.039,0,0,1,2.079,0v.433H31.675ZM30.8,15.4h0a.255.255,0,0,1,.254-.217h.457v.658a.083.083,0,1,0,.166,0v-.658h2.079v.658a.083.083,0,1,0,.166,0v-.658h.457a.255.255,0,0,1,.254.217v0l.633,3.573a.6.6,0,0,1-.6.589H30.762a.6.6,0,0,1-.6-.589Z"
                    transform="translate(-30 -13.374)"
                    fill="#1d1d1d"
                  />
                </g>
              </g>
            </g>
            <path
              id="Path_15172"
              data-name="Path 15172"
              d="M1.335.628A2.571,2.571,0,0,1-.113.035.1.1,0,0,1-.125-.113.1.1,0,0,1,.023-.125h0A2.4,2.4,0,0,0,1.335.418,2.9,2.9,0,0,0,2.749-.129.105.105,0,0,1,2.9-.108a.1.1,0,0,1-.021.147A3.059,3.059,0,0,1,1.335.628Z"
              transform="translate(1.332 4.195)"
              fill="#1d1d1d"
            />
          </g>
          <rect
            id="Rectangle_5774"
            data-name="Rectangle 5774"
            width="6"
            height="6"
            transform="translate(3.999 4)"
            fill="none"
          />
        </g>
      </g>
    </svg>
  );
};
const MoneyIcon = () => {
  return (
    <svg
      data-cy="Money-Icon"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="14"
      height="14"
      viewBox="0 0 14 14"
    >
      <defs>
        <clipPath id="clip-path647">
          <rect
            id="Rectangle_4612"
            data-name="Rectangle 4612"
            width="14"
            height="14"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_504"
        data-name="Mask Group 504"
        clipPath="url(#clip-path647)"
      >
        <g id="money-10" transform="translate(0 0.986)">
          <g id="Group_12240" data-name="Group 12240">
            <g
              id="Group_12209"
              data-name="Group 12209"
              transform="translate(0 2.022)"
            >
              <g
                id="Group_12196"
                data-name="Group 12196"
                transform="translate(0.005)"
              >
                <path
                  id="Path_22070"
                  data-name="Path 22070"
                  d="M14.418,7.947,2.677,10.675.424,7.443,12.166,4.715Z"
                  transform="translate(-0.424 -4.715)"
                  fill="#47a047"
                />
              </g>
              <g
                id="Group_12197"
                data-name="Group 12197"
                transform="translate(6.699 0.696)"
              >
                <path
                  id="Path_22071"
                  data-name="Path 22071"
                  d="M15.985,7.974,11.552,9a.9.9,0,0,0,.362-1.387,1.8,1.8,0,0,0-.574-.509,2.708,2.708,0,0,0-1.354-.346l4.436-1.031a.819.819,0,0,1,.558.065.393.393,0,0,1,.114.1l1.178,1.687C16.378,7.739,16.251,7.912,15.985,7.974Z"
                  transform="translate(-9.986 -5.71)"
                  fill="#96d696"
                />
              </g>
              <g
                id="Group_12198"
                data-name="Group 12198"
                transform="translate(10.802 0.927)"
              >
                <path
                  id="Path_22072"
                  data-name="Path 22072"
                  d="M16.371,6.091a.211.211,0,0,1,.067.058c.063.091-.012.194-.17.23a.476.476,0,0,1-.329-.038.2.2,0,0,1-.068-.06c-.065-.091.012-.194.166-.23A.484.484,0,0,1,16.371,6.091Z"
                  transform="translate(-15.849 -6.039)"
                  fill="#47a047"
                />
              </g>
              <g
                id="Group_12199"
                data-name="Group 12199"
                transform="translate(11.19 2.644)"
              >
                <path
                  id="Path_22073"
                  data-name="Path 22073"
                  d="M17.059,8.823c-.021.049-.08.085-.175.108a.446.446,0,0,1-.257-.008.4.4,0,0,1-.06-.028.369.369,0,0,1-.118-.109.177.177,0,0,1-.037-.171c.023-.05.08-.085.177-.107a.433.433,0,0,1,.255.007.377.377,0,0,1,.064.029.352.352,0,0,1,.116.109A.174.174,0,0,1,17.059,8.823Zm-.217.048c.059-.013.093-.037.1-.071a.144.144,0,0,0-.037-.12.277.277,0,0,0-.094-.09l-.023-.012a.244.244,0,0,0-.158-.011c-.059.013-.092.038-.1.072a.157.157,0,0,0,.035.121.3.3,0,0,0,.1.089l.023.012a.237.237,0,0,0,.16.01"
                  transform="translate(-16.402 -8.492)"
                  fill="#414a61"
                />
              </g>
              <g
                id="Group_12200"
                data-name="Group 12200"
                transform="translate(10.682 2.773)"
              >
                <path
                  id="Path_22074"
                  data-name="Path 22074"
                  d="M15.932,8.676l.283.409L16.1,9.11l-.24-.348-.143.033-.043-.061Z"
                  transform="translate(-15.676 -8.676)"
                  fill="#414a61"
                />
              </g>
              <g
                id="Group_12201"
                data-name="Group 12201"
                transform="translate(2.248 3.119)"
              >
                <path
                  id="Path_22075"
                  data-name="Path 22075"
                  d="M5.658,9.373a.815.815,0,0,1,.264.231c.247.353-.047.755-.658.9a1.865,1.865,0,0,1-1.285-.152.808.808,0,0,1-.264-.232c-.247-.353.048-.754.658-.9A1.864,1.864,0,0,1,5.658,9.373Z"
                  transform="translate(-3.628 -9.171)"
                  fill="#47a047"
                />
              </g>
              <g
                id="Group_12202"
                data-name="Group 12202"
                transform="translate(9.131 1.314)"
              >
                <path
                  id="Path_22076"
                  data-name="Path 22076"
                  d="M13.982,6.645a.208.208,0,0,1,.068.06c.063.091-.012.194-.17.23a.476.476,0,0,1-.329-.038.2.2,0,0,1-.068-.06c-.065-.091.012-.194.168-.231A.48.48,0,0,1,13.982,6.645Z"
                  transform="translate(-13.461 -6.593)"
                  fill="#47a047"
                />
              </g>
              <g
                id="Group_12203"
                data-name="Group 12203"
                transform="translate(9.966 1.121)"
              >
                <path
                  id="Path_22077"
                  data-name="Path 22077"
                  d="M15.175,6.368a.209.209,0,0,1,.069.06c.065.09-.012.194-.17.23a.485.485,0,0,1-.331-.04.213.213,0,0,1-.068-.059c-.063-.091.012-.194.17-.23A.476.476,0,0,1,15.175,6.368Z"
                  transform="translate(-14.653 -6.316)"
                  fill="#47a047"
                />
              </g>
              <g
                id="Group_12204"
                data-name="Group 12204"
                transform="translate(11.884 2.482)"
              >
                <path
                  id="Path_22078"
                  data-name="Path 22078"
                  d="M18.051,8.593c-.021.049-.08.085-.175.108a.446.446,0,0,1-.257-.008.4.4,0,0,1-.06-.028.381.381,0,0,1-.12-.11.178.178,0,0,1-.035-.17.238.238,0,0,1,.175-.108.446.446,0,0,1,.257.008.412.412,0,0,1,.063.029.343.343,0,0,1,.116.108A.173.173,0,0,1,18.051,8.593Zm-.217.048c.059-.013.093-.037.1-.071a.151.151,0,0,0-.037-.12.284.284,0,0,0-.094-.09l-.023-.012a.238.238,0,0,0-.158-.011c-.059.013-.1.038-.1.072a.145.145,0,0,0,.034.12.314.314,0,0,0,.1.089l.023.012a.241.241,0,0,0,.161.011"
                  transform="translate(-17.394 -8.262)"
                  fill="#414a61"
                />
              </g>
              <g
                id="Group_12205"
                data-name="Group 12205"
                transform="translate(0.984 1.97)"
              >
                <path
                  id="Path_22079"
                  data-name="Path 22079"
                  d="M6.789,9.425a2.722,2.722,0,0,0,1.355.348L3.71,10.8a.809.809,0,0,1-.558-.066.356.356,0,0,1-.115-.1L1.86,8.949c-.106-.154.021-.328.285-.389L6.58,7.529a.9.9,0,0,0-.366,1.388A1.776,1.776,0,0,0,6.789,9.425Zm-2.066.583c.611-.141.9-.543.658-.9a.815.815,0,0,0-.264-.231,1.864,1.864,0,0,0-1.285-.153c-.609.142-.9.543-.658.9a.808.808,0,0,0,.264.232,1.865,1.865,0,0,0,1.285.152"
                  transform="translate(-1.822 -7.529)"
                  fill="#96d696"
                />
              </g>
              <g
                id="Group_12206"
                data-name="Group 12206"
                transform="translate(2.254 3.233)"
              >
                <path
                  id="Path_22080"
                  data-name="Path 22080"
                  d="M15.383,9.333l0,1.685L3.637,13.746l0-1.685Z"
                  transform="translate(-3.637 -9.333)"
                  fill="#47a047"
                />
              </g>
              <g
                id="Group_12207"
                data-name="Group 12207"
                transform="translate(2.254 3.3)"
              >
                <path
                  id="Path_22081"
                  data-name="Path 22081"
                  d="M15.38,10.951,3.639,13.657v.121L15.38,11.072Z"
                  transform="translate(-3.637 -9.886)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22082"
                  data-name="Path 22082"
                  d="M15.381,10.646,3.64,13.353v.121l11.741-2.707Z"
                  transform="translate(-3.638 -9.794)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22083"
                  data-name="Path 22083"
                  d="M15.384,9.429,3.643,12.136v.121L15.384,9.55Z"
                  transform="translate(-3.639 -9.429)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22084"
                  data-name="Path 22084"
                  d="M15.383,10.038,3.642,12.744v.121l11.741-2.707Z"
                  transform="translate(-3.638 -9.612)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22085"
                  data-name="Path 22085"
                  d="M15.382,10.342,3.641,13.049v.121l11.741-2.707Z"
                  transform="translate(-3.638 -9.703)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22086"
                  data-name="Path 22086"
                  d="M15.378,11.559,3.637,14.266v.121L15.378,11.68Z"
                  transform="translate(-3.637 -10.068)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22087"
                  data-name="Path 22087"
                  d="M15.384,9.733,3.642,12.44v.121L15.383,9.854Z"
                  transform="translate(-3.638 -9.52)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22088"
                  data-name="Path 22088"
                  d="M15.379,11.255,3.638,13.962v.121l11.741-2.707Z"
                  transform="translate(-3.637 -9.977)"
                  fill="#5faf5f"
                />
              </g>
              <path
                id="Path_22089"
                data-name="Path 22089"
                d="M9.881,11.613l0,1.685,1.684-.391,0-1.685Z"
                transform="translate(-3.255 -6.667)"
                fill="#ed5d71"
              />
              <path
                id="Path_22090"
                data-name="Path 22090"
                d="M10.187,11.542l0,1.685,1.684-.391,0-1.685Z"
                transform="translate(-3.346 -6.646)"
                fill="#e3e7f0"
              />
              <g
                id="Group_12208"
                data-name="Group 12208"
                transform="translate(0 2.729)"
              >
                <path
                  id="Path_22091"
                  data-name="Path 22091"
                  d="M2.676,11.846l0,1.685L.417,10.3l0-1.685Z"
                  transform="translate(-0.417 -8.614)"
                  fill="#5faf5f"
                />
              </g>
            </g>
            <g
              id="Group_12238"
              data-name="Group 12238"
              transform="translate(0.496)"
            >
              <g id="Group_12236" data-name="Group 12236">
                <g id="Group_12217" data-name="Group 12217">
                  <g id="Group_12216" data-name="Group 12216">
                    <g
                      id="Group_12210"
                      data-name="Group 12210"
                      transform="translate(8.424 4.863)"
                    >
                      <path
                        id="Path_22092"
                        data-name="Path 22092"
                        d="M17.136,8.774l-.005,1.777-3.972,2.308.005-1.777Z"
                        transform="translate(-13.159 -8.774)"
                        fill="#47a047"
                      />
                    </g>
                    <g
                      id="Group_12211"
                      data-name="Group 12211"
                      transform="translate(0 2.308)"
                    >
                      <path
                        id="Path_22093"
                        data-name="Path 22093"
                        d="M9.554,9.987l-.005,1.777L1.126,6.9l.005-1.777Z"
                        transform="translate(-1.126 -5.123)"
                        fill="#47a047"
                      />
                    </g>
                    <g
                      id="Group_12212"
                      data-name="Group 12212"
                      transform="translate(0 2.308)"
                    >
                      <path
                        id="Path_22094"
                        data-name="Path 22094"
                        d="M1.129,6.448l8.424,4.861v-.091L1.129,6.357Z"
                        transform="translate(-1.127 -5.493)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22095"
                        data-name="Path 22095"
                        d="M1.13,6.147l8.424,4.861v-.091L1.13,6.056Z"
                        transform="translate(-1.127 -5.403)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22096"
                        data-name="Path 22096"
                        d="M9.556,9.987,1.133,5.123v.113L9.556,10.1Z"
                        transform="translate(-1.128 -5.123)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22097"
                        data-name="Path 22097"
                        d="M1.126,7.631l8.424,4.863V12.42L1.126,7.559Z"
                        transform="translate(-1.126 -5.854)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22098"
                        data-name="Path 22098"
                        d="M1.127,7.049,9.551,11.91v-.091L1.127,6.958Z"
                        transform="translate(-1.126 -5.674)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22099"
                        data-name="Path 22099"
                        d="M1.126,7.349,9.55,12.21v-.091L1.127,7.258Z"
                        transform="translate(-1.126 -5.764)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22100"
                        data-name="Path 22100"
                        d="M1.128,6.748l8.424,4.861v-.091L1.128,6.657Z"
                        transform="translate(-1.126 -5.583)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22101"
                        data-name="Path 22101"
                        d="M9.555,10.316,1.132,5.455v.091l8.424,4.861Z"
                        transform="translate(-1.127 -5.223)"
                        fill="#77cb77"
                      />
                      <path
                        id="Path_22102"
                        data-name="Path 22102"
                        d="M1.131,5.756v.091l8.424,4.861v-.091Z"
                        transform="translate(-1.127 -5.313)"
                        fill="#77cb77"
                      />
                    </g>
                    <g
                      id="Group_12213"
                      data-name="Group 12213"
                      transform="translate(3.705 4.447)"
                    >
                      <path
                        id="Path_22103"
                        data-name="Path 22103"
                        d="M7.92,9.043,7.915,10.82l-1.5-.864.005-1.777Z"
                        transform="translate(-6.418 -8.179)"
                        fill="#d3dbea"
                      />
                    </g>
                    <g
                      id="Group_12214"
                      data-name="Group 12214"
                      transform="translate(3.546 4.355)"
                    >
                      <path
                        id="Path_22104"
                        data-name="Path 22104"
                        d="M6.2,8.048,6.191,9.825l.159.092L6.355,8.14Z"
                        transform="translate(-6.191 -8.048)"
                        fill="#e34454"
                      />
                      <path
                        id="Path_22105"
                        data-name="Path 22105"
                        d="M8.563,9.414l-.005,1.777.159.092.005-1.777Z"
                        transform="translate(-6.901 -8.458)"
                        fill="#e34454"
                      />
                    </g>
                    <g
                      id="Group_12215"
                      data-name="Group 12215"
                      transform="translate(0.005)"
                    >
                      <path
                        id="Path_22106"
                        data-name="Path 22106"
                        d="M13.528,6.689,9.556,9,1.133,4.134,5.1,1.826Z"
                        transform="translate(-1.133 -1.826)"
                        fill="#47a047"
                      />
                    </g>
                  </g>
                </g>
                <g
                  id="Group_12232"
                  data-name="Group 12232"
                  transform="translate(1.154 0.646)"
                >
                  <g
                    id="Group_12222"
                    data-name="Group 12222"
                    transform="translate(6.544 4.934)"
                  >
                    <g
                      id="Group_12218"
                      data-name="Group 12218"
                      transform="translate(0.112 0.065)"
                    >
                      <path
                        id="Path_22107"
                        data-name="Path 22107"
                        d="M12.7,9.917c.043.025.057.053.041.084a.243.243,0,0,1-.106.1.472.472,0,0,1-.166.062.208.208,0,0,1-.144-.024q-.063-.036-.042-.083a.249.249,0,0,1,.106-.1.474.474,0,0,1,.166-.061A.213.213,0,0,1,12.7,9.917Z"
                        transform="translate(-12.283 -9.89)"
                        fill="#96d696"
                      />
                    </g>
                    <g id="Group_12219" data-name="Group 12219">
                      <path
                        id="Path_22108"
                        data-name="Path 22108"
                        d="M12.813,9.977a.269.269,0,0,1-.136.14.583.583,0,0,1-.242.079.37.37,0,0,1-.227-.047c-.068-.039-.1-.084-.082-.131s.058-.093.138-.139a.59.59,0,0,1,.24-.08.369.369,0,0,1,.225.048C12.8,9.887,12.826,9.93,12.813,9.977Zm-.388.154a.472.472,0,0,0,.166-.062.243.243,0,0,0,.106-.1c.017-.031,0-.059-.041-.084a.213.213,0,0,0-.145-.023.474.474,0,0,0-.166.061.249.249,0,0,0-.106.1q-.021.047.042.083a.208.208,0,0,0,.144.024"
                        transform="translate(-12.122 -9.797)"
                        fill="#4c5671"
                      />
                    </g>
                    <g
                      id="Group_12220"
                      data-name="Group 12220"
                      transform="translate(0.611 0.353)"
                    >
                      <path
                        id="Path_22109"
                        data-name="Path 22109"
                        d="M13.416,10.328c.095.055.029.125-.065.179a.316.316,0,0,1-.31.038c-.094-.054-.031-.125.064-.18a.474.474,0,0,1,.166-.061A.213.213,0,0,1,13.416,10.328Z"
                        transform="translate(-12.995 -10.301)"
                        fill="#96d696"
                      />
                    </g>
                    <g
                      id="Group_12221"
                      data-name="Group 12221"
                      transform="translate(0.498 0.287)"
                    >
                      <path
                        id="Path_22110"
                        data-name="Path 22110"
                        d="M13.388,10.528a.471.471,0,0,1-.468.032c-.146-.084-.09-.186.055-.271a.59.59,0,0,1,.24-.08.369.369,0,0,1,.225.048C13.586,10.342,13.533,10.444,13.388,10.528Zm-.251.013a.472.472,0,0,0,.166-.062c.094-.055.16-.125.065-.179a.213.213,0,0,0-.145-.023.474.474,0,0,0-.166.061c-.095.055-.158.126-.064.18a.208.208,0,0,0,.144.024"
                        transform="translate(-12.834 -10.208)"
                        fill="#4c5671"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_12223"
                    data-name="Group 12223"
                    transform="translate(9.076 4.114)"
                  >
                    <path
                      id="Path_22111"
                      data-name="Path 22111"
                      d="M16.231,8.675a.125.125,0,0,1,0,.236.448.448,0,0,1-.407,0,.124.124,0,0,1,0-.236A.448.448,0,0,1,16.231,8.675Z"
                      transform="translate(-15.741 -8.626)"
                      fill="#47a047"
                    />
                  </g>
                  <g
                    id="Group_12224"
                    data-name="Group 12224"
                    transform="translate(7.878 3.422)"
                  >
                    <path
                      id="Path_22112"
                      data-name="Path 22112"
                      d="M14.519,7.687a.124.124,0,0,1,0,.235.447.447,0,0,1-.405,0,.124.124,0,0,1,0-.236A.448.448,0,0,1,14.519,7.687Z"
                      transform="translate(-14.028 -7.638)"
                      fill="#5faf5f"
                    />
                  </g>
                  <g
                    id="Group_12225"
                    data-name="Group 12225"
                    transform="translate(8.478 3.769)"
                  >
                    <path
                      id="Path_22113"
                      data-name="Path 22113"
                      d="M15.375,8.181a.125.125,0,0,1,0,.236.448.448,0,0,1-.407,0,.124.124,0,0,1,0-.235A.447.447,0,0,1,15.375,8.181Z"
                      transform="translate(-14.885 -8.133)"
                      fill="#47a047"
                    />
                  </g>
                  <g
                    id="Group_12226"
                    data-name="Group 12226"
                    transform="translate(6.235 4.701)"
                  >
                    <path
                      id="Path_22114"
                      data-name="Path 22114"
                      d="M12.266,9.57l-.5.292-.082-.047.427-.248-.1-.059.075-.044Z"
                      transform="translate(-11.681 -9.464)"
                      fill="#4c5671"
                    />
                  </g>
                  <g id="Group_12231" data-name="Group 12231">
                    <g id="Group_12227" data-name="Group 12227">
                      <path
                        id="Path_22115"
                        data-name="Path 22115"
                        d="M8.852,4.666a3.149,3.149,0,0,0-2.2.328c-.648.377-.852.894-.559,1.274L2.917,4.433a.21.21,0,0,1,0-.4L4.989,2.831a.755.755,0,0,1,.684,0ZM4.477,4.648a1.738,1.738,0,0,0,1.578,0,.483.483,0,0,0-.005-.914,1.738,1.738,0,0,0-1.578,0,.483.483,0,0,0,.005.914"
                        transform="translate(-2.774 -2.749)"
                        fill="#96d696"
                      />
                    </g>
                    <g
                      id="Group_12228"
                      data-name="Group 12228"
                      transform="translate(1.373 0.795)"
                    >
                      <path
                        id="Path_22116"
                        data-name="Path 22116"
                        d="M6.638,4.074a.483.483,0,0,1,.005.914,1.738,1.738,0,0,1-1.578,0,.483.483,0,0,1-.005-.914A1.738,1.738,0,0,1,6.638,4.074Z"
                        transform="translate(-4.735 -3.885)"
                        fill="#47a047"
                      />
                    </g>
                    <g
                      id="Group_12229"
                      data-name="Group 12229"
                      transform="translate(3.191 1.843)"
                    >
                      <path
                        id="Path_22117"
                        data-name="Path 22117"
                        d="M10.63,5.618a.948.948,0,0,1,.281.237c.293.381.089.9-.558,1.274a3.144,3.144,0,0,1-2.2.328,1.633,1.633,0,0,1-.411-.162.946.946,0,0,1-.281-.237c-.292-.38-.089-.9.559-1.274a3.149,3.149,0,0,1,2.2-.328A1.625,1.625,0,0,1,10.63,5.618Z"
                        transform="translate(-7.333 -5.382)"
                        fill="#47a047"
                      />
                    </g>
                    <g
                      id="Group_12230"
                      data-name="Group 12230"
                      transform="translate(4.013 2.317)"
                    >
                      <path
                        id="Path_22118"
                        data-name="Path 22118"
                        d="M14.442,7.893c.19.11.193.288,0,.4L12.372,9.5a.755.755,0,0,1-.686,0L8.508,7.66a3.144,3.144,0,0,0,2.2-.328c.647-.376.851-.894.558-1.274Zm-2.594,1.47a.583.583,0,0,0,.242-.079c.145-.084.2-.186.052-.271a.369.369,0,0,0-.225-.048.59.59,0,0,0-.24.08c-.146.085-.2.186-.055.271a.37.37,0,0,0,.227.047m-.5-.287A.583.583,0,0,0,11.592,9a.269.269,0,0,0,.136-.14c.014-.047-.014-.09-.084-.13a.369.369,0,0,0-.225-.048.59.59,0,0,0-.24.08q-.12.07-.138.139c-.014.047.014.092.082.131a.37.37,0,0,0,.227.047m2.305-.935a.448.448,0,0,0,.407,0,.125.125,0,0,0,0-.236.448.448,0,0,0-.407,0,.124.124,0,0,0,0,.236m-1.2-.692a.447.447,0,0,0,.405,0,.124.124,0,0,0,0-.235.448.448,0,0,0-.407,0,.124.124,0,0,0,0,.236m.6.111a.124.124,0,0,0,0,.235.448.448,0,0,0,.407,0,.125.125,0,0,0,0-.236.447.447,0,0,0-.405,0M10.811,8.841l.5-.292-.184-.106-.075.044.1.059-.427.248Z"
                        transform="translate(-8.508 -6.058)"
                        fill="#96d696"
                      />
                    </g>
                  </g>
                </g>
                <g
                  id="Group_12235"
                  data-name="Group 12235"
                  transform="translate(3.551 2.047)"
                >
                  <g
                    id="Group_12233"
                    data-name="Group 12233"
                    transform="translate(0.159 0.091)"
                  >
                    <path
                      id="Path_22119"
                      data-name="Path 22119"
                      d="M11.894,5.746,7.923,8.054l-1.5-.864L10.4,4.881Z"
                      transform="translate(-6.425 -4.881)"
                      fill="#e3e7f0"
                    />
                  </g>
                  <g id="Group_12234" data-name="Group 12234">
                    <path
                      id="Path_22120"
                      data-name="Path 22120"
                      d="M10.17,4.751,6.2,7.059l.159.092,3.97-2.309Z"
                      transform="translate(-6.199 -4.751)"
                      fill="#ed5d71"
                    />
                    <path
                      id="Path_22121"
                      data-name="Path 22121"
                      d="M12.692,6.207l-.156-.09L8.564,8.425l.159.092Z"
                      transform="translate(-6.908 -5.161)"
                      fill="#ed5d71"
                    />
                  </g>
                </g>
              </g>
              <g
                id="Group_12237"
                data-name="Group 12237"
                transform="translate(8.429 4.863)"
              >
                <path
                  id="Path_22122"
                  data-name="Path 22122"
                  d="M17.142,10.1,13.17,12.4v-.091l3.972-2.306Z"
                  transform="translate(-13.167 -9.144)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22123"
                  data-name="Path 22123"
                  d="M17.141,9.8,13.169,12.1v-.091l3.972-2.306Z"
                  transform="translate(-13.167 -9.054)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22124"
                  data-name="Path 22124"
                  d="M13.166,11.082l3.972-2.308v.113l-3.972,2.306Z"
                  transform="translate(-13.166 -8.774)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22125"
                  data-name="Path 22125"
                  d="M17.145,11.281l-3.972,2.308v-.074l3.972-2.306Z"
                  transform="translate(-13.168 -9.504)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22126"
                  data-name="Path 22126"
                  d="M17.143,10.7,13.172,13v-.091l3.972-2.306Z"
                  transform="translate(-13.168 -9.324)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22127"
                  data-name="Path 22127"
                  d="M17.144,11l-3.972,2.306v-.091l3.972-2.306Z"
                  transform="translate(-13.168 -9.414)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22128"
                  data-name="Path 22128"
                  d="M17.143,10.4,13.171,12.7v-.091l3.972-2.306Z"
                  transform="translate(-13.168 -9.234)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22129"
                  data-name="Path 22129"
                  d="M13.167,11.411l3.972-2.306V9.2L13.168,11.5Z"
                  transform="translate(-13.167 -8.873)"
                  fill="#5faf5f"
                />
                <path
                  id="Path_22130"
                  data-name="Path 22130"
                  d="M17.14,9.406V9.5L13.168,11.8v-.091Z"
                  transform="translate(-13.167 -8.963)"
                  fill="#5faf5f"
                />
              </g>
            </g>
            <g
              id="Group_12239"
              data-name="Group 12239"
              transform="translate(0 4.751)"
            >
              <path
                id="Path_22131"
                data-name="Path 22131"
                d="M2.672,13.7.418,10.473V10.6l2.254,3.227Z"
                transform="translate(-0.417 -9.171)"
                fill="#47a047"
              />
              <path
                id="Path_22132"
                data-name="Path 22132"
                d="M2.677,12.113.423,8.886v.126l2.254,3.227Z"
                transform="translate(-0.418 -8.695)"
                fill="#47a047"
              />
              <path
                id="Path_22133"
                data-name="Path 22133"
                d="M2.673,13.382.419,10.155v.126l2.254,3.227Z"
                transform="translate(-0.417 -9.076)"
                fill="#47a047"
              />
              <path
                id="Path_22134"
                data-name="Path 22134"
                d="M2.677,11.846.423,8.613v.095l2.254,3.227Z"
                transform="translate(-0.419 -8.613)"
                fill="#47a047"
              />
              <path
                id="Path_22135"
                data-name="Path 22135"
                d="M2.674,13.065.42,9.838v.126l2.254,3.227Z"
                transform="translate(-0.418 -8.981)"
                fill="#47a047"
              />
              <path
                id="Path_22136"
                data-name="Path 22136"
                d="M2.675,12.747.421,9.521v.126l2.254,3.227Z"
                transform="translate(-0.418 -8.886)"
                fill="#47a047"
              />
              <path
                id="Path_22137"
                data-name="Path 22137"
                d="M2.676,12.43.422,9.2V9.33l2.254,3.227Z"
                transform="translate(-0.418 -8.79)"
                fill="#47a047"
              />
              <path
                id="Path_22138"
                data-name="Path 22138"
                d="M2.671,14.017.417,10.79v.126l2.254,3.227Z"
                transform="translate(-0.417 -9.266)"
                fill="#47a047"
              />
            </g>
          </g>
          <g
            id="Group_12254"
            data-name="Group 12254"
            transform="translate(5.437 9.378)"
          >
            <g id="Group_12246" data-name="Group 12246">
              <g id="Group_12245" data-name="Group 12245">
                <g
                  id="Group_12241"
                  data-name="Group 12241"
                  transform="translate(0.278 0.152)"
                >
                  <path
                    id="Path_22139"
                    data-name="Path 22139"
                    d="M11.37,16.252v.3a.7.7,0,0,0-.411-.574,2.013,2.013,0,0,0-.987-.236,1.991,1.991,0,0,0-.985.236.692.692,0,0,0-.4.567v-.3a.691.691,0,0,1,.4-.567,2,2,0,0,1,.985-.237,2.024,2.024,0,0,1,.987.237A.7.7,0,0,1,11.37,16.252Z"
                    transform="translate(-8.581 -15.44)"
                    fill="#efa143"
                  />
                </g>
                <g
                  id="Group_12242"
                  data-name="Group 12242"
                  transform="translate(0.278 0.282)"
                >
                  <path
                    id="Path_22140"
                    data-name="Path 22140"
                    d="M10.959,15.863A.6.6,0,0,1,10.965,17a2.173,2.173,0,0,1-1.972,0,.6.6,0,0,1-.006-1.142A2.173,2.173,0,0,1,10.959,15.863Z"
                    transform="translate(-8.582 -15.626)"
                    fill="#ffdd94"
                  />
                </g>
                <g
                  id="Group_12243"
                  data-name="Group 12243"
                  transform="translate(0 0.963)"
                >
                  <path
                    id="Path_22141"
                    data-name="Path 22141"
                    d="M11.529,16.609v.231a.83.83,0,0,1-.486.68,2.605,2.605,0,0,1-2.364,0,.838.838,0,0,1-.494-.69V16.6a.838.838,0,0,0,.494.69,2.605,2.605,0,0,0,2.364,0A.83.83,0,0,0,11.529,16.609Z"
                    transform="translate(-8.184 -16.599)"
                    fill="#efa143"
                  />
                </g>
                <g
                  id="Group_12244"
                  data-name="Group 12244"
                  transform="translate(0.001)"
                >
                  <path
                    id="Path_22142"
                    data-name="Path 22142"
                    d="M11.036,15.507a.724.724,0,0,1,.008,1.369,2.605,2.605,0,0,1-2.364,0,.724.724,0,0,1-.008-1.37A2.606,2.606,0,0,1,11.036,15.507ZM8.874,16.754a2.173,2.173,0,0,0,1.972,0,.6.6,0,0,0-.006-1.142,2.173,2.173,0,0,0-1.972,0A.6.6,0,0,0,8.874,16.754Z"
                    transform="translate(-8.185 -15.223)"
                    fill="#febb61"
                  />
                </g>
              </g>
            </g>
            <g
              id="Group_12253"
              data-name="Group 12253"
              transform="translate(0.918 0.417)"
            >
              <g
                id="Group_12247"
                data-name="Group 12247"
                transform="translate(0.001 0.116)"
              >
                <path
                  id="Path_22143"
                  data-name="Path 22143"
                  d="M10.081,17.027l.487-.284v.11l-.487.284-.112-.067-.008-.238a.506.506,0,0,0-.013-.11.086.086,0,0,0-.045-.056.156.156,0,0,0-.08-.019.173.173,0,0,0-.083.019.1.1,0,0,0-.029.027v.1l-.2.029a.186.186,0,0,1-.016-.08v-.11a.215.215,0,0,0,.016.08l.182-.024v-.059a.084.084,0,0,1,.043-.072.171.171,0,0,1,.083-.019.154.154,0,0,1,.08.019.113.113,0,0,1,.048.059.74.74,0,0,1,.011.107l.008.238Z"
                  transform="translate(-9.497 -16.151)"
                  fill="#efa143"
                />
                <path
                  id="Path_22144"
                  data-name="Path 22144"
                  d="M10.69,16.184v-.11c0-.021.016-.043.048-.062a.228.228,0,0,1,.166-.021.608.608,0,0,1,.2.078.33.33,0,0,1,.134.115.065.065,0,0,1,.011.035v.11a.059.059,0,0,0-.011-.035.33.33,0,0,0-.134-.115.606.606,0,0,0-.2-.078.228.228,0,0,0-.166.021A.072.072,0,0,0,10.69,16.184Z"
                  transform="translate(-9.855 -15.985)"
                  fill="#efa143"
                />
                <path
                  id="Path_22145"
                  data-name="Path 22145"
                  d="M11.364,16.247v.11c0,.053-.04.1-.12.15a.531.531,0,0,1-.313.07.825.825,0,0,1-.332-.11.378.378,0,0,1-.19-.193.134.134,0,0,1-.005-.032v-.11a.134.134,0,0,0,.005.032.378.378,0,0,0,.19.193.824.824,0,0,0,.332.11.507.507,0,0,0,.313-.07C11.324,16.351,11.364,16.3,11.364,16.247Z"
                  transform="translate(-9.769 -16.029)"
                  fill="#efa143"
                />
              </g>
              <g id="Group_12252" data-name="Group 12252">
                <g
                  id="Group_12249"
                  data-name="Group 12249"
                  transform="translate(0.636)"
                >
                  <g id="Group_12248" data-name="Group 12248">
                    <path
                      id="Path_22146"
                      data-name="Path 22146"
                      d="M11.36,16.124q.026.1-.116.181a.515.515,0,0,1-.311.068.815.815,0,0,1-.333-.11.367.367,0,0,1-.19-.192c-.019-.066.02-.126.115-.182a.51.51,0,0,1,.313-.067.8.8,0,0,1,.333.11A.374.374,0,0,1,11.36,16.124Zm-.41.129a.239.239,0,0,0,.167-.022c.046-.027.058-.059.037-.1a.35.35,0,0,0-.135-.115.616.616,0,0,0-.2-.078.239.239,0,0,0-.167.022c-.046.027-.058.059-.037.1a.344.344,0,0,0,.135.115.622.622,0,0,0,.2.078"
                      transform="translate(-10.405 -15.819)"
                      fill="#febb61"
                    />
                  </g>
                </g>
                <g
                  id="Group_12251"
                  data-name="Group 12251"
                  transform="translate(0 0.383)"
                >
                  <g id="Group_12250" data-name="Group 12250">
                    <path
                      id="Path_22147"
                      data-name="Path 22147"
                      d="M10.569,16.692l-.487.283-.115-.066-.006-.238a.524.524,0,0,0-.013-.109.094.094,0,0,0-.046-.056.155.155,0,0,0-.08-.021.166.166,0,0,0-.083.021c-.042.025-.054.067-.03.126l-.2.029a.187.187,0,0,1-.009-.127.228.228,0,0,1,.108-.109.466.466,0,0,1,.216-.058.4.4,0,0,1,.223.05.173.173,0,0,1,.074.076.31.31,0,0,1,.026.131l.006.147.273-.159Z"
                      transform="translate(-9.496 -16.366)"
                      fill="#febb61"
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
          <g
            id="Group_12268"
            data-name="Group 12268"
            transform="translate(3.036 9.859)"
          >
            <g id="Group_12260" data-name="Group 12260">
              <g id="Group_12259" data-name="Group 12259">
                <g
                  id="Group_12255"
                  data-name="Group 12255"
                  transform="translate(0.278 0.152)"
                >
                  <path
                    id="Path_22148"
                    data-name="Path 22148"
                    d="M7.939,16.94v.3a.7.7,0,0,0-.411-.574,2.013,2.013,0,0,0-.987-.236,1.991,1.991,0,0,0-.985.236.692.692,0,0,0-.4.567v-.3a.691.691,0,0,1,.4-.567,2,2,0,0,1,.985-.237,2.024,2.024,0,0,1,.987.237A.7.7,0,0,1,7.939,16.94Z"
                    transform="translate(-5.15 -16.128)"
                    fill="#efa143"
                  />
                </g>
                <g
                  id="Group_12256"
                  data-name="Group 12256"
                  transform="translate(0.278 0.282)"
                >
                  <path
                    id="Path_22149"
                    data-name="Path 22149"
                    d="M7.528,16.551a.6.6,0,0,1,.006,1.142,2.173,2.173,0,0,1-1.972,0,.6.6,0,0,1-.006-1.142A2.173,2.173,0,0,1,7.528,16.551Z"
                    transform="translate(-5.151 -16.314)"
                    fill="#ffdd94"
                  />
                </g>
                <g
                  id="Group_12257"
                  data-name="Group 12257"
                  transform="translate(0 0.963)"
                >
                  <path
                    id="Path_22150"
                    data-name="Path 22150"
                    d="M8.1,17.3v.231a.83.83,0,0,1-.486.68,2.605,2.605,0,0,1-2.364,0,.838.838,0,0,1-.494-.69v-.231a.837.837,0,0,0,.494.69,2.605,2.605,0,0,0,2.364,0A.83.83,0,0,0,8.1,17.3Z"
                    transform="translate(-4.753 -17.287)"
                    fill="#efa143"
                  />
                </g>
                <g
                  id="Group_12258"
                  data-name="Group 12258"
                  transform="translate(0.001)"
                >
                  <path
                    id="Path_22151"
                    data-name="Path 22151"
                    d="M7.605,16.195a.724.724,0,0,1,.008,1.369,2.605,2.605,0,0,1-2.364,0,.724.724,0,0,1-.008-1.37A2.606,2.606,0,0,1,7.605,16.195ZM5.444,17.442a2.173,2.173,0,0,0,1.972,0A.6.6,0,0,0,7.409,16.3a2.173,2.173,0,0,0-1.972,0A.6.6,0,0,0,5.444,17.442Z"
                    transform="translate(-4.755 -15.911)"
                    fill="#febb61"
                  />
                </g>
              </g>
            </g>
            <g
              id="Group_12267"
              data-name="Group 12267"
              transform="translate(0.87 0.524)"
            >
              <g
                id="Group_12261"
                data-name="Group 12261"
                transform="translate(0.001 0.117)"
              >
                <path
                  id="Path_22152"
                  data-name="Path 22152"
                  d="M6.821,17.688l.15-.086v.107l-.15.088-.562-.326-.131.078L6,17.471v-.107l.131.075.131-.075Z"
                  transform="translate(-5.997 -16.988)"
                  fill="#efa143"
                />
                <path
                  id="Path_22153"
                  data-name="Path 22153"
                  d="M7.652,17.35a.526.526,0,0,1-.313.07.836.836,0,0,1-.332-.11c-.11-.064-.174-.128-.19-.193a.134.134,0,0,1-.005-.032v-.107a.138.138,0,0,0,.005.029c.016.064.08.128.19.193a.836.836,0,0,0,.332.11.544.544,0,0,0,.313-.067c.083-.048.12-.1.12-.153v.11C7.772,17.253,7.734,17.3,7.652,17.35Z"
                  transform="translate(-6.241 -16.872)"
                  fill="#efa143"
                />
                <path
                  id="Path_22154"
                  data-name="Path 22154"
                  d="M7.1,17.026v-.107c0-.024.019-.046.048-.064a.232.232,0,0,1,.166-.021.637.637,0,0,1,.2.075.365.365,0,0,1,.137.118.065.065,0,0,1,.011.035v.107a.076.076,0,0,0-.011-.032.365.365,0,0,0-.137-.118.649.649,0,0,0-.2-.078.245.245,0,0,0-.166.024C7.114,16.983,7.1,17,7.1,17.026Z"
                  transform="translate(-6.327 -16.827)"
                  fill="#efa143"
                />
              </g>
              <g id="Group_12266" data-name="Group 12266">
                <g
                  id="Group_12263"
                  data-name="Group 12263"
                  transform="translate(0.572)"
                >
                  <g id="Group_12262" data-name="Group 12262">
                    <path
                      id="Path_22155"
                      data-name="Path 22155"
                      d="M7.769,16.964c.017.065-.02.126-.117.183a.52.52,0,0,1-.313.067.8.8,0,0,1-.333-.11.367.367,0,0,1-.19-.192q-.026-.1.117-.181a.517.517,0,0,1,.313-.069.8.8,0,0,1,.333.11A.367.367,0,0,1,7.769,16.964Zm-.41.131a.234.234,0,0,0,.165-.023c.048-.028.061-.059.039-.1a.352.352,0,0,0-.135-.117.636.636,0,0,0-.2-.077.227.227,0,0,0-.165.023c-.046.027-.059.058-.039.1a.378.378,0,0,0,.135.115.676.676,0,0,0,.2.079"
                      transform="translate(-6.813 -16.66)"
                      fill="#febb61"
                    />
                  </g>
                </g>
                <g
                  id="Group_12265"
                  data-name="Group 12265"
                  transform="translate(0 0.329)"
                >
                  <g id="Group_12264" data-name="Group 12264">
                    <path
                      id="Path_22156"
                      data-name="Path 22156"
                      d="M6.971,17.531l-.149.087-.564-.326-.131.076L6,17.292l.28-.163Z"
                      transform="translate(-5.996 -17.13)"
                      fill="#febb61"
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
