import React, { useState } from "react";
import { translateFunction } from "utils/functions";

import { GetAddressString } from "utils/tinyUtils";
import { CheckBoxElement } from "components/Cart/PlaceOrderButtons";

import { useAppStore } from "store";

function ConfirmAddressModal({ close, confirm, confirmationData }) {
  const [active, setActive] = useState(false);
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="z-9999999999999 px-[24px] pb-[70px] w-full flex-col justify-start items-center h-[calc(100vh)] overflow-auto max-h-[calc(100vh)] absolute top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]">
      <div className="flex-col justify-end items-center h-auto">
        <img src="/icons/OrderCancelConfirm.svg" className="mt-[20px]" />
        <span className="medium text-white text-[40px] mt-[7px] text-center">
          {translateFunction("Clarification")}
        </span>
        <span className="text-white regular text-[16px] mt-[2px] text-center">
          {translateFunction(`change address request`)}
        </span>
        <img src="/icons/LargeAddressChangeIcon.svg" className="mt-[20px]" />
        <span className="mt-[11px] text-[#D3D3D3] text-[16px] medium">
          {translateFunction("Change Below Address")}
        </span>
        <div
          style={{
            border: "#D3D3D380 1px solid",
            direction: isRtl ? "rtl" : "ltr",
          }}
          className={`flex-col px-[24px] relative h-auto max-w-[600px]  min-h-[90px] items-start justify-center  mt-[12px] rounded-[15px] bg-[#f8f8f800] w-full `}
        >
          <div className="flex-col">
            <div className="flex-row items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  id="home-3"
                  d="M11.677,5.219h0L6.781.324a1.1,1.1,0,0,0-1.563,0L.325,5.216l0,.005A1.1,1.1,0,0,0,1.056,7.1l.034,0h.2v3.6A1.294,1.294,0,0,0,2.578,12H4.493a.352.352,0,0,0,.352-.352V8.824a.591.591,0,0,1,.59-.59h1.13a.591.591,0,0,1,.59.59v2.824A.352.352,0,0,0,7.506,12H9.421a1.294,1.294,0,0,0,1.293-1.293V7.1H10.9a1.1,1.1,0,0,0,.782-1.885Zm0,0"
                  transform="translate(0.001)"
                  fill="#D3D3D3"
                />
              </svg>

              <span className="regular mx-[4px] text-[12px] text-[#D3D3D3]">
                {confirmationData?.currentAddress.address}
              </span>
            </div>
            <div className="flex-row mt-[5px]  items-center regular text-[12px] text-[#D3D3D3]">
              {GetAddressString(
                confirmationData?.currentAddress?.region_details
              )}
            </div>
            <div className="flex-row regular text-[12px]">
              {(confirmationData?.currentAddress as any)?.address_detail}
            </div>
            <div className="flex-row mt-[5px] items-center regular text-[12px] text-[#D3D3D3]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <defs>
                  <clipPath id="clip-path1213">
                    <rect
                      id="Rectangle_6097"
                      data-name="Rectangle 6097"
                      width="12"
                      height="12"
                      transform="translate(-0.245)"
                      fill="#8d8d8d"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Mask_Group_646"
                  data-name="Mask Group 646"
                  transform="translate(0.245)"
                  clipPath="url(#clip-path1213)"
                >
                  <g id="XMLID_7_" transform="translate(0.202 0.583)">
                    <path
                      id="XMLID_10_"
                      d="M10.461,8.411c-.055-.042-.111-.085-.164-.128-.281-.226-.579-.434-.868-.635l-.18-.125a1.791,1.791,0,0,0-1.016-.386,1.317,1.317,0,0,0-1.1.695.583.583,0,0,1-.5.3.993.993,0,0,1-.4-.1A4.848,4.848,0,0,1,3.7,5.568c-.236-.529-.159-.876.255-1.157A1.171,1.171,0,0,0,4.6,3.383,5.865,5.865,0,0,0,2.534.569a1.172,1.172,0,0,0-.8,0A2.306,2.306,0,0,0,.3,1.747,2.194,2.194,0,0,0,.334,3.518,14.288,14.288,0,0,0,3.469,8.291a15.2,15.2,0,0,0,4.756,3.158,2.634,2.634,0,0,0,.47.14c.044.01.081.018.109.026a.183.183,0,0,0,.046.006h.015a2.7,2.7,0,0,0,2.241-1.705C11.388,9.12,10.874,8.727,10.461,8.411Z"
                      transform="translate(-0.131 -0.498)"
                      fill="#D3D3D3"
                    />
                  </g>
                </g>
              </svg>

              <div className="flex-row mx-[4px]   items-center regular text-[12px] text-[#D3D3D3]">
                {confirmationData?.currentAddress?.contact_info?.phone}
              </div>

              <div className="flex-row mx-[17px]  items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <defs>
                    <clipPath id="clip-path232323">
                      <rect
                        id="Rectangle_6098"
                        data-name="Rectangle 6098"
                        width="12"
                        height="12"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_647"
                    data-name="Mask Group 647"
                    clipPath="url(#clip-path232323)"
                  >
                    <g
                      id="Group_13"
                      data-name="Group 13"
                      transform="translate(1.162 0)"
                    >
                      <path
                        id="Path_20"
                        data-name="Path 20"
                        d="M651.622,148c.318-.068.611-.331.658-.913.04-.476-.083-.722-.264-.846.5-2.042-.88-2.441-.88-2.441a2.072,2.072,0,0,0-3.047-.522,3.6,3.6,0,0,0-.891.765,3.182,3.182,0,0,0-.681,2.132c-.246.092-.44.331-.391.918.05.609.367.868.7.918a2.435,2.435,0,0,0,4.794-.008Zm-2.4,1.5c-1.218,0-2.2-1.653-2.2-3.025,0-.184.005-.362.017-.523a4.18,4.18,0,0,0,3.411-1.257,4,4,0,0,1,.971,1.736v.044c.008,1.371-.973,3.026-2.192,3.026Z"
                        transform="translate(-644.484 -142.822)"
                        fill="#D3D3D3"
                      />
                      <path
                        id="Path_21"
                        data-name="Path 21"
                        d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                        transform="translate(-639.136 -165.377)"
                        fill="#D3D3D3"
                      />
                      <path
                        id="Path_22"
                        data-name="Path 22"
                        d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                        transform="translate(-655.714 -165.376)"
                        fill="#D3D3D3"
                      />
                    </g>
                  </g>
                </svg>

                <div className="flex-row  mx-[4px]  items-center regular text-[12px] text-[#D3D3D3]">
                  {confirmationData?.currentAddress?.contact_info?.name}
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className="text-white text-[16px] medium mt-[15px]">
          {translateFunction("To New Address")}
        </span>
        <div
          style={{
            border: "#FFFFFF80 1px solid",
            direction: isRtl ? "rtl" : "ltr",
          }}
          className={`flex-col px-[24px] relative h-auto max-w-[600px]  min-h-[90px] items-start justify-center  mt-[12px] rounded-[15px] bg-[#f8f8f800] w-full `}
        >
          <div className="flex-col">
            <div className="flex-row items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  id="home-3"
                  d="M11.677,5.219h0L6.781.324a1.1,1.1,0,0,0-1.563,0L.325,5.216l0,.005A1.1,1.1,0,0,0,1.056,7.1l.034,0h.2v3.6A1.294,1.294,0,0,0,2.578,12H4.493a.352.352,0,0,0,.352-.352V8.824a.591.591,0,0,1,.59-.59h1.13a.591.591,0,0,1,.59.59v2.824A.352.352,0,0,0,7.506,12H9.421a1.294,1.294,0,0,0,1.293-1.293V7.1H10.9a1.1,1.1,0,0,0,.782-1.885Zm0,0"
                  transform="translate(0.001)"
                  fill="#FFFFFF"
                />
              </svg>

              <span className="regular mx-[4px] text-[12px] text-[#FFFFFF]">
                {confirmationData?.newAddress.address}
              </span>
            </div>
            <div className="flex-row mt-[5px]  items-center regular text-[12px] text-[#FFFFFF]">
              {GetAddressString(confirmationData?.newAddress?.region_details)}
            </div>
            <div className="flex-row regular text-[12px]">
              {(confirmationData?.newAddress as any)?.address_detail}
            </div>
            <div className="flex-row mt-[5px] items-center regular text-[12px] text-[#FFFFFF]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <defs>
                  <clipPath id="clip-path1213">
                    <rect
                      id="Rectangle_6097"
                      data-name="Rectangle 6097"
                      width="12"
                      height="12"
                      transform="translate(-0.245)"
                      fill="#8d8d8d"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Mask_Group_646"
                  data-name="Mask Group 646"
                  transform="translate(0.245)"
                  clipPath="url(#clip-path1213)"
                >
                  <g id="XMLID_7_" transform="translate(0.202 0.583)">
                    <path
                      id="XMLID_10_"
                      d="M10.461,8.411c-.055-.042-.111-.085-.164-.128-.281-.226-.579-.434-.868-.635l-.18-.125a1.791,1.791,0,0,0-1.016-.386,1.317,1.317,0,0,0-1.1.695.583.583,0,0,1-.5.3.993.993,0,0,1-.4-.1A4.848,4.848,0,0,1,3.7,5.568c-.236-.529-.159-.876.255-1.157A1.171,1.171,0,0,0,4.6,3.383,5.865,5.865,0,0,0,2.534.569a1.172,1.172,0,0,0-.8,0A2.306,2.306,0,0,0,.3,1.747,2.194,2.194,0,0,0,.334,3.518,14.288,14.288,0,0,0,3.469,8.291a15.2,15.2,0,0,0,4.756,3.158,2.634,2.634,0,0,0,.47.14c.044.01.081.018.109.026a.183.183,0,0,0,.046.006h.015a2.7,2.7,0,0,0,2.241-1.705C11.388,9.12,10.874,8.727,10.461,8.411Z"
                      transform="translate(-0.131 -0.498)"
                      fill="#D3D3D3"
                    />
                  </g>
                </g>
              </svg>

              <div className="flex-row mx-[4px]   items-center regular text-[12px] text-[#FFFFFF]">
                {confirmationData?.newAddress?.contact_info?.phone}
              </div>
              <div className="flex-row mx-[17px]  items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <defs>
                    <clipPath id="clip-path232323">
                      <rect
                        id="Rectangle_6098"
                        data-name="Rectangle 6098"
                        width="12"
                        height="12"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_647"
                    data-name="Mask Group 647"
                    clipPath="url(#clip-path232323)"
                  >
                    <g
                      id="Group_13"
                      data-name="Group 13"
                      transform="translate(1.162 0)"
                    >
                      <path
                        id="Path_20"
                        data-name="Path 20"
                        d="M651.622,148c.318-.068.611-.331.658-.913.04-.476-.083-.722-.264-.846.5-2.042-.88-2.441-.88-2.441a2.072,2.072,0,0,0-3.047-.522,3.6,3.6,0,0,0-.891.765,3.182,3.182,0,0,0-.681,2.132c-.246.092-.44.331-.391.918.05.609.367.868.7.918a2.435,2.435,0,0,0,4.794-.008Zm-2.4,1.5c-1.218,0-2.2-1.653-2.2-3.025,0-.184.005-.362.017-.523a4.18,4.18,0,0,0,3.411-1.257,4,4,0,0,1,.971,1.736v.044c.008,1.371-.973,3.026-2.192,3.026Z"
                        transform="translate(-644.484 -142.822)"
                        fill="#FFFFFF"
                      />
                      <path
                        id="Path_21"
                        data-name="Path 21"
                        d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                        transform="translate(-639.136 -165.377)"
                        fill="#FFFFFF"
                      />
                      <path
                        id="Path_22"
                        data-name="Path 22"
                        d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                        transform="translate(-655.714 -165.376)"
                        fill="#FFFFFF"
                      />
                    </g>
                  </g>
                </svg>

                <div className="flex-row  mx-[4px]  items-center regular text-[12px] text-[#FFFFFF]">
                  {confirmationData?.newAddress?.contact_info?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-white medium mt-[40px] text-center ">
          {translateFunction(
            "We Will Ignore The First Address And Send Your Order To The New Address."
          )}
        </p>
        <img src="/icons/OrderCancelTerms.svg" className="mt-[15px]" />
        <span className="mt-[7px] regular text-white text-[14px]">
          {translateFunction("Terms Of Change Address")}
        </span>
        <p
          className="text-[14px] text-white regular mt-[15px] flex-row  gap-[4px]"
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          onClick={() => {
            setActive(!active);
          }}
        >
          <CheckBoxElement active={active} />
          <span>{translateFunction("I Read And Agree To")}</span>
          <a
            target="_blank"
            href="#"
            className=" medium text-[14px] text-white underline"
          >
            {translateFunction("The Change Addres Terms.")}
          </a>
        </p>
        <div
          className={`${
            !active ? "bg-[#D3D3D3] text-white" : "bg-[#3066CC] text-white"
          } cursor-pointer mt-[10px] w-full h-[50px] rounded-[15px]  text-[16px] bold flex items-center justify-center `}
          style={{
            border: "1px solid #402CDD80",
          }}
          onClick={() => {
            if (!active) return;
            confirm();
          }}
        >
          {translateFunction("Agree & Change")}
        </div>
        <div
          className={`w-full h-[53px] items-center justify-center underline  flex cursor-pointer  rounded-[20px] text-[16px] text-white medium`}
          onClick={() => {
            close();
          }}
        >
          {translateFunction("I Disagree")}
        </div>
      </div>
    </div>
  );
}

export default ConfirmAddressModal;
