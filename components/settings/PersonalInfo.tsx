import React from "react";
import SettingTopBar from "./TopBar";
import { translateFunction } from "utils/functions";

import AddressInfo from "public/svg/cart/AddressInfo.svg";
function PersonalInfo({
  swipeToScreen,
  goBack,
}: {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}) {
  return (
    <div className="flex-col">
      <SettingTopBar
        goBack={() => goBack()}
        screenName="Profile | Personal Info"
        Save={() => {
          goBack();
        }}
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
        className="flex-col w-full mt-[30px] px-[12px] pb-[110px]"
        data-cy="container-name-phone"
      >
        <div className="flex-row px-[12px] items-center">
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
                  id="Rectangle_4612"
                  data-name="Rectangle 4612"
                  width="15"
                  height="15"
                  fill="none"
                />
              </clipPath>
            </defs>
            <g
              id="Mask_Group_732"
              data-name="Mask Group 732"
              clip-path="url(#clip-path)"
            >
              <g id="Outline" transform="translate(1.372)">
                <g id="Group_13672" data-name="Group 13672">
                  <path
                    id="Path_23090"
                    data-name="Path 23090"
                    d="M10.132.469A3.088,3.088,0,1,1,7.048,3.557,3.089,3.089,0,0,1,10.132.469m0-.469a3.557,3.557,0,1,0,3.552,3.557A3.555,3.555,0,0,0,10.132,0Z"
                    transform="translate(-4.004)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23091"
                    data-name="Path 23091"
                    d="M10.925,14.595c.172,0,3.149.107,3.149,2.906V20.18H2.756V17.5c0-2.823,3.022-2.9,3.144-2.906Zm0-.469H5.9s-3.613.041-3.613,3.375v3.15H14.542V17.5c0-3.314-3.613-3.375-3.613-3.375Zm3.613,6.523h0Z"
                    transform="translate(-2.287 -5.65)"
                    fill="#1d1d1d"
                  />
                </g>
              </g>
            </g>
          </svg>

          <div
            className="flex ml-[6px] text-[#404040] text-[12px] medium"
            data-cy="contact-info-text"
          >
            {translateFunction("Full Name")}
          </div>
          <AddressInfo
            className="ml-[12px] cursor-pointer"
            data-cy="Address-info-icon"
          />
        </div>
        <div
          className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="name-container"
          style={{
            border: "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="recipient-name-statement"
          >
            {translateFunction("Recipient Name")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-cy="Recipient-Name"
            >
              <input
                data-cy="recipient-name-input"
                placeholder={translateFunction("Enter Full Name")}
                className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
              />
            </div>
          </div>
        </div>
        {/*  */}
        <div
          className="flex-col phone-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="phone-container"
          style={{
            border: "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="phone-statement"
          >
            {translateFunction("Phone")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-cy="Contact-Phone"
            >
              <input
                data-cy="Contact-Phone-input"
                aria-autocomplete="both"
                aria-haspopup="false"
                type="number"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                pattern="[0-9]*"
                autoCorrect="off"
                inputMode="numeric"
                placeholder={translateFunction("Enter Phone")}
                className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
              />
            </div>
          </div>
        </div>
        {/*  */}
        <div
          className="flex-col cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="altarnative-Phone-container"
          style={{
            border: "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="altarnative-Phone-statement"
          >
            {translateFunction("Alternative Phone")}
            <span
              className="text-[#D3D3D3] ml-[4px]"
              data-cy="optional-statement"
            >
              {translateFunction("(Optional)")}
            </span>
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
              <input
                data-cy="optional-input"
                aria-autocomplete="both"
                aria-haspopup="false"
                spellCheck="false"
                autoCapitalize="off"
                pattern="[0-9]*"
                autoComplete="off"
                autoCorrect="off"
                inputMode="numeric"
                type="number"
                placeholder={translateFunction("Enter Alternative Phone")}
                className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
              />
            </div>
          </div>
        </div>
        <div
          className="flex-col phone-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="phone-container"
          style={{
            border: "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="phone-statement"
          >
            {translateFunction("Email")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-cy="Contact-Phone"
            >
              <input
                data-cy="Contact-Phone-input"
                aria-autocomplete="both"
                aria-haspopup="false"
                type="email"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                pattern="[0-9]*"
                autoCorrect="off"
                inputMode="numeric"
                placeholder={translateFunction("Enter Email")}
                className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
              />
            </div>
          </div>
        </div>
        <div
          className="flex-col phone-border h-[85px] cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          style={{
            border: "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="phone-statement"
          >
            {translateFunction("Gender")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div className="medium flex text-[#D3D3D3] text-[14px] w-full h-[50px]">
              <div
                className="flex text-[#1D1D1D] flex-row h-[50px] justify-center items-center rounded-[15px] w-1/3"
                style={{
                  border: "1px solid #402CDDa3",
                }}
              >
                Man
              </div>
              <div
                className="flex ml-[11px] flex-row h-[50px] justify-center items-center rounded-[15px] w-1/3"
                style={{
                  border: "1px solid #E6E6E6a3",
                }}
              >
                Woman
              </div>
              <div
                className="flex ml-[11px] flex-row h-[50px] justify-center items-center rounded-[15px] w-1/3"
                style={{
                  border: "1px solid #E6E6E6a3",
                }}
              >
                Other
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfo;
