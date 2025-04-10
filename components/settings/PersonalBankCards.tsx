import React from "react";
import SettingTopBar from "./TopBar";
import AddressInfo from "public/svg/cart/AddressInfo.svg";
import { translateFunction } from "utils/functions";

function PersonalBankCards({
  swipeToScreen,
  goBack,
}: {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}) {
  return (
    <div className="flex-col max-h-[calc(100vh-200px)]">
      <SettingTopBar
        goBack={() => goBack()}
        screenName="Profile | Bank Cards"
        Save={null}
      />
      <div className="flex-row justify-center mt-[12px] w-full">
        <div
          className="bg-[#F8F8F8] min-h-[50px] w-full flex-row items-center pl-[24px] pr-[20px] "
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
          data-cy="address-info-header" // Added data-cy
        >
          <svg
            id="Group_3387"
            data-name="Group 3387"
            xmlns="http://www.w3.org/2000/svg"
            width="24.997"
            height="24.997"
            viewBox="0 0 24.997 24.997"
          >
            <path
              id="Path_15434"
              data-name="Path 15434"
              d="M178.661,126.993h-.067a2.3,2.3,0,0,0,0,4.605h.067a2.3,2.3,0,0,0,0-4.605Z"
              transform="translate(-167.728 -120.932)"
              fill="#402cdd"
            />
            <path
              id="Path_15435"
              data-name="Path 15435"
              d="M180.465,237.18H176.79a.5.5,0,0,0-.5.5v9.113a.5.5,0,0,0,.5.5h3.675a.5.5,0,0,0,.5-.5v-9.113A.5.5,0,0,0,180.465,237.18Z"
              transform="translate(-167.728 -225.62)"
              fill="#402cdd"
            />
            <path
              id="Path_15436"
              data-name="Path 15436"
              d="M10.832,60.315a10.616,10.616,0,0,0-7.66,3.261A11.346,11.346,0,0,0,3.5,79.641l-.174,2.044a.5.5,0,0,0,.185.436.477.477,0,0,0,.457.08l2.124-.742a10.477,10.477,0,0,0,4.74,1.12,10.617,10.617,0,0,0,7.66-3.261,11.35,11.35,0,0,0,0-15.741A10.617,10.617,0,0,0,10.832,60.315Zm0,21.265A9.539,9.539,0,0,1,6.35,80.475a.476.476,0,0,0-.379-.028l-1.61.563.13-1.529a.506.506,0,0,0-.163-.418A10.264,10.264,0,0,1,.973,71.446a10.01,10.01,0,0,1,9.859-10.133,10.137,10.137,0,0,1,0,20.267Z"
              transform="translate(0 -57.581)"
              fill="#402cdd"
            />
            <path
              id="Path_15437"
              data-name="Path 15437"
              d="M380.02,5.522a.5.5,0,1,0,0,1,5.126,5.126,0,0,1,5.114,5.126.5.5,0,1,0,1,0A6.125,6.125,0,0,0,380.02,5.522Z"
              transform="translate(-361.135 -5.522)"
              fill="#402cdd"
            />
            <path
              id="Path_15438"
              data-name="Path 15438"
              d="M390.541,56.12a.5.5,0,0,0,0,1,2.075,2.075,0,0,1,2.07,2.075.5.5,0,1,0,1,0A3.073,3.073,0,0,0,390.541,56.12Z"
              transform="translate(-371.134 -53.595)"
              fill="#402cdd"
            />
          </svg>

          <div className="regular text-[10px] ml-[12px] text-[#8D8D8D]">
            {translateFunction(
              "Entering The Information Below Clearly And Completely Will Ensure That Your Order Arrives Without Problems And Faster."
            )}
          </div>
        </div>
      </div>
      <div
        className="flex-col w-full px-[12px] "
        data-cy="container-name-phone"
      >
        <div className="flex flex-col w-full px-[12px] mt-[19px] items-start">
          <div className="flex flex-row items-stretch">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="15"
              height="15"
              viewBox="0 0 15 15"
            >
              <defs>
                <clipPath id="clip-path">
                  <rect
                    id="Rectangle_4601"
                    data-name="Rectangle 4601"
                    width="15"
                    height="15"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <g
                id="Mask_Group_728"
                data-name="Mask Group 728"
                clip-path="url(#clip-path)"
              >
                <g id="credit-card-2" transform="translate(0.04 1.795)">
                  <path
                    id="Path_23075"
                    data-name="Path 23075"
                    d="M12.474,16.126H1.187A1.122,1.122,0,0,1,.066,15.005V8.421A1.122,1.122,0,0,1,1.187,7.3H12.474a1.122,1.122,0,0,1,1.121,1.121v3.527a.18.18,0,1,1-.36,0V8.421a.761.761,0,0,0-.761-.761H1.187a.761.761,0,0,0-.761.761v6.584a.761.761,0,0,0,.761.761H12.474a.761.761,0,0,0,.761-.761V12.889a.18.18,0,1,1,.36,0v2.116A1.122,1.122,0,0,1,12.474,16.126Z"
                    transform="translate(-0.066 -4.714)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23076"
                    data-name="Path 23076"
                    d="M14.029,11.829a.18.18,0,0,1-.021-.359l.56-.065a.761.761,0,0,0,.668-.843l-.762-6.54a.761.761,0,0,0-.843-.668L2.419,4.66a.757.757,0,0,0-.5.27.18.18,0,0,1-.277-.23,1.115,1.115,0,0,1,.733-.4L13.589,3a1.121,1.121,0,0,1,1.243.983l.762,6.54a1.121,1.121,0,0,1-.983,1.243l-.56.065Z"
                    transform="translate(-0.681 -2.989)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Line_995"
                    data-name="Line 995"
                    d="M1.761.06H-.12A.18.18,0,0,1-.3-.12.18.18,0,0,1-.12-.3H1.761a.18.18,0,0,1,.18.18A.18.18,0,0,1,1.761.06Z"
                    transform="translate(1.711 8.53)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Line_996"
                    data-name="Line 996"
                    d="M4.583.06H-.12A.18.18,0,0,1-.3-.12.18.18,0,0,1-.12-.3h4.7a.18.18,0,0,1,.18.18A.18.18,0,0,1,4.583.06Z"
                    transform="translate(1.711 9.706)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Line_997"
                    data-name="Line 997"
                    d="M1.761.06H-.12A.18.18,0,0,1-.3-.12.18.18,0,0,1-.12-.3H1.761a.18.18,0,0,1,.18.18A.18.18,0,0,1,1.761.06Z"
                    transform="translate(4.533 8.53)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Line_998"
                    data-name="Line 998"
                    d="M1.761.06H-.12A.18.18,0,0,1-.3-.12.18.18,0,0,1-.12-.3H1.761a.18.18,0,0,1,.18.18A.18.18,0,0,1,1.761.06Z"
                    transform="translate(7.354 8.53)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Line_999"
                    data-name="Line 999"
                    d="M1.761.06H-.12A.18.18,0,0,1-.3-.12.18.18,0,0,1-.12-.3H1.761a.18.18,0,0,1,.18.18A.18.18,0,0,1,1.761.06Z"
                    transform="translate(10.176 8.53)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23077"
                    data-name="Path 23077"
                    d="M4.479,13.853H3.068a.651.651,0,0,1-.65-.65v-.941a.651.651,0,0,1,.65-.65H4.479a.651.651,0,0,1,.65.65V13.2A.651.651,0,0,1,4.479,13.853ZM3.068,11.971a.291.291,0,0,0-.29.29V13.2a.291.291,0,0,0,.29.29H4.479a.291.291,0,0,0,.29-.29v-.941a.291.291,0,0,0-.29-.29Z"
                    transform="translate(-1.007 -6.438)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Line_1000"
                    data-name="Line 1000"
                    d="M.35.06H-.12A.18.18,0,0,1-.3-.12.18.18,0,0,1-.12-.3H.35a.18.18,0,0,1,.18.18A.18.18,0,0,1,.35.06Z"
                    transform="translate(2.651 6.414)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23078"
                    data-name="Path 23078"
                    d="M18.641,12.52a.18.18,0,0,1-.161-.26,2.184,2.184,0,0,0,0-1.956.18.18,0,0,1,.322-.16,2.544,2.544,0,0,1,0,2.277A.18.18,0,0,1,18.641,12.52Z"
                    transform="translate(-7.424 -5.811)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23079"
                    data-name="Path 23079"
                    d="M17.236,12.379a.18.18,0,0,1-.161-.26,1.21,1.21,0,0,0,0-1.106.18.18,0,0,1,.322-.161,1.57,1.57,0,0,1,0,1.428A.18.18,0,0,1,17.236,12.379Z"
                    transform="translate(-6.862 -6.094)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23080"
                    data-name="Path 23080"
                    d="M15.836,12.238a.18.18,0,0,1-.16-.262.272.272,0,0,0,0-.258A.18.18,0,0,1,16,11.555a.632.632,0,0,1,0,.585A.18.18,0,0,1,15.836,12.238Z"
                    transform="translate(-6.302 -6.376)"
                    fill="#1d1d1d"
                  />
                </g>
              </g>
            </svg>

            <span className="ml-[6px] medium text-[#404040] text-[12px]">
              {translateFunction("Your Bank Cards Info")}
            </span>
            <AddressInfo className="ml-[19px] cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalBankCards;
