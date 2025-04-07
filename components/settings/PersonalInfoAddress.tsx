import React from "react";
import { translateFunction } from "utils/functions";
import AddressInfo from "public/svg/cart/AddressInfo.svg";
import SettingTopBar from "./TopBar";

function PersonalInfoAddress({
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
        screenName="Profile | Address Info"
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
        
      </div>
    </div>
  );
}

export default PersonalInfoAddress;
