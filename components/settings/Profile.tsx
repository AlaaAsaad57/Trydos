import React from "react";
import SettingTopBar from "./TopBar";
import PersonIcon from "public/svg/PersonIcon.svg";
import SizeIcon from "public/svg/SizeIcon.svg";
import AddressIcon from "public/svg/AddressIcon.svg";
import BankIcon from "public/svg/BankIcon.svg";

import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
function Profile({
  swipeToScreen,
  goBack,
}: {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}) {
  const { userProfile } = useAppStore();

  const options = [
    {
      name: "Personal Info",
      dataCy: "personal-info-button",
      Icon: <PersonIcon />,
      callback: () => swipeToScreen(3),
    },
    {
      name: "Size",
      dataCy: "personal-size-button",
      Icon: <SizeIcon />,
      callback: () => {
        swipeToScreen(4);
      },
    },
    {
      name: "Address",
      dataCy: "personal-address-button",
      Icon: <AddressIcon />,
      callback: () => {
        swipeToScreen(5);
      },
    },
    {
      name: "Bank Cards",
      dataCy: "personal-bank-button",
      Icon: <BankIcon />,
      callback: () => {
        swipeToScreen(7);
      },
    },
  ];
  return (
    <div className="flex-col">
      <SettingTopBar
        goBack={() => goBack()}
        screenName="Profile"
        DataCy="profile"
      />
      <div className="flex-row justify-center mt-[12px]">
        <ProfilePicture
          photo={GetImageUrl(userProfile.image)}
          GoToProfilePhotoScreen={() => {
            swipeToScreen(2);
          }}
        />
      </div>
      <div className="flex flex-col mt-[30px]">
        {options.map((option) => (
          <SettingOption {...option} key={option.name} />
        ))}
      </div>
    </div>
  );
}

export default Profile;
const ProfilePicture = ({
  photo,
  GoToProfilePhotoScreen,
}: {
  GoToProfilePhotoScreen: () => void;
  photo?: string;
}) => {
  if (photo)
    return (
      <div
        onClick={() => GoToProfilePhotoScreen()}
        data-cy="go-to-update-photo-screen"
        className="relative w-[128px] h-[128px] flex justify-center items-center object-cover cursor-pointer"
        style={{
          filter: "drop-shadow(0px 3px 6px #0000002a)",
        }}
      >
        <div className="regular text-[12px] text-[#FFFFFF] rounded-b-[22px] h-[39px] absolute bottom-0 left-0 w-full bg-[#404040] opacity-70 z-10" />
        <div className="flex justify-center  items-center regular text-[12px] text-[#FFFFFF] rounded-b-[22px] h-[39px] absolute bottom-0 left-0 w-full bg-transparent z-20">
          {translateFunction("Change Photo")}
        </div>
        <img
          width={128}
          src={GetImageUrl(photo)}
          height={128}
          className="rounded-[22px] object-cover h-[128px] w-[128px]"
        />
      </div>
    );
  else
    return (
      <div
        onClick={() => GoToProfilePhotoScreen()}
        data-cy="go-to-update-photo-screen"
        className="relative w-[128px] h-[128px] flex justify-center items-center object-cover cursor-pointer"
        style={{
          filter: "drop-shadow(0px 3px 6px #0000002a)",
        }}
      >
        <div className="regular text-[12px] text-[#FFFFFF] rounded-b-[22px] h-[39px] absolute bottom-0 left-0 w-full bg-[#404040] z-10 opacity-70"></div>
        <div className="flex pl-[12px]  items-center regular text-[12px] text-[#FFFFFF] rounded-b-[22px] h-[39px] absolute bottom-0 left-0 w-full bg-transparent z-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <g
              id="Group_13682"
              data-name="Group 13682"
              transform="translate(-123 -214)"
            >
              <g id="image-add" transform="translate(123 215.249)">
                <path
                  id="Path_22042"
                  data-name="Path 22042"
                  d="M18.719,13.867a2.7,2.7,0,1,0,2.7,2.7A2.706,2.706,0,0,0,18.719,13.867Zm1.058,2.938h-.823v.823a.235.235,0,1,1-.47,0v-.823h-.823a.235.235,0,1,1,0-.47h.823v-.823a.235.235,0,1,1,.47,0v.823h.823a.235.235,0,1,1,0,.47Z"
                  transform="translate(-6.422 -6.815)"
                  fill="#fff"
                />
                <path
                  id="Path_22043"
                  data-name="Path 22043"
                  d="M11.576,8.814a.235.235,0,0,0,.122-.383L9.406,5.807a.936.936,0,0,0-.7-.321h0a.936.936,0,0,0-.7.321L4.883,9.38,3.44,7.728a.936.936,0,0,0-.7-.321h0a.935.935,0,0,0-.7.321L.469,9.521V3.853A1.232,1.232,0,0,1,1.7,2.619h9.722a1.232,1.232,0,0,1,1.23,1.234v4.7a.232.232,0,0,0,.192.229h0a.232.232,0,0,0,.272-.229v-4.7a1.7,1.7,0,0,0-1.7-1.7H1.7A1.7,1.7,0,0,0,0,3.853v6.582a1.7,1.7,0,0,0,1.7,1.7H8.9a.233.233,0,0,0,.232-.233v0a3.177,3.177,0,0,1,2.439-3.09Z"
                  transform="translate(0 -2.148)"
                  fill="#fff"
                />
                <circle
                  id="Ellipse_331"
                  data-name="Ellipse 331"
                  cx="1.156"
                  cy="1.156"
                  r="1.156"
                  transform="translate(3.515 1.617) rotate(-8.568)"
                  fill="#fff"
                />
              </g>
              <rect
                id="Rectangle_4718"
                data-name="Rectangle 4718"
                width="14.955"
                height="15"
                transform="translate(123 214)"
                fill="none"
              />
            </g>
          </svg>

          <span className="ml-[8px]"> Add Photo</span>
        </div>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="128"
            height="128"
            viewBox="0 0 128 128"
          >
            <rect
              id="Rectangle_4305"
              data-name="Rectangle 4305"
              width="128"
              height="128"
              rx="22"
              fill="#f8f8f8"
            />
            <path
              id="Path_23092"
              data-name="Path 23092"
              d="M12.675-42.525a1.223,1.223,0,0,1,.938.5,1.944,1.944,0,0,1,.423,1.305,1.965,1.965,0,0,1-1.085,1.673,4.507,4.507,0,0,1-2.445.68,7.128,7.128,0,0,1-3.842-.974Q5.1-40.318,5.1-43.481V-53.629H3.409a2,2,0,0,1-1.471-.588,2,2,0,0,1-.588-1.471A1.891,1.891,0,0,1,1.938-57.1a2.03,2.03,0,0,1,1.471-.57H5.1v-2.353a2.171,2.171,0,0,1,.643-1.6,2.171,2.171,0,0,1,1.6-.643,2.068,2.068,0,0,1,1.544.643,2.205,2.205,0,0,1,.625,1.6v2.353h2.611a2,2,0,0,1,1.471.588,2,2,0,0,1,.588,1.471,1.891,1.891,0,0,1-.588,1.416,2.03,2.03,0,0,1-1.471.57H9.513v9.965a1.407,1.407,0,0,0,.4,1.121,1.631,1.631,0,0,0,1.1.349,3.155,3.155,0,0,0,.809-.147A2.2,2.2,0,0,1,12.675-42.525ZM28.634-58.409a2.812,2.812,0,0,1,1.857.625,1.864,1.864,0,0,1,.754,1.471,2.278,2.278,0,0,1-.588,1.71,1.94,1.94,0,0,1-1.4.57,3.669,3.669,0,0,1-1.25-.257q-.11-.037-.5-.147a3,3,0,0,0-.827-.11,3.268,3.268,0,0,0-1.839.588,4.293,4.293,0,0,0-1.452,1.783,6.566,6.566,0,0,0-.57,2.85v8.715a2.205,2.205,0,0,1-.625,1.6,2.111,2.111,0,0,1-1.581.643,2.111,2.111,0,0,1-1.581-.643,2.205,2.205,0,0,1-.625-1.6V-55.8a2.205,2.205,0,0,1,.625-1.6,2.111,2.111,0,0,1,1.581-.643A2.111,2.111,0,0,1,22.2-57.4a2.205,2.205,0,0,1,.625,1.6v.478a5.571,5.571,0,0,1,2.427-2.3A7.461,7.461,0,0,1,28.634-58.409Zm20.518.368a2.111,2.111,0,0,1,1.581.643,2.205,2.205,0,0,1,.625,1.6v15.627q0,4.78-2.574,6.968a10.262,10.262,0,0,1-6.876,2.188,16.679,16.679,0,0,1-2.556-.2,9.586,9.586,0,0,1-2.114-.533q-1.8-.772-1.8-2.133a1.889,1.889,0,0,1,.11-.588A2.279,2.279,0,0,1,36.3-35.7a1.826,1.826,0,0,1,1.158-.423,2.195,2.195,0,0,1,.7.11q.257.11.9.368a9.271,9.271,0,0,0,1.36.423,6.6,6.6,0,0,0,1.489.165,5.578,5.578,0,0,0,3.842-1.121q1.232-1.121,1.232-3.842v-.368Q45.07-38,41.025-38a6.345,6.345,0,0,1-3.383-.9,6.084,6.084,0,0,1-2.28-2.5,8,8,0,0,1-.809-3.659V-55.8a2.205,2.205,0,0,1,.625-1.6,2.111,2.111,0,0,1,1.581-.643,2.111,2.111,0,0,1,1.581.643,2.205,2.205,0,0,1,.625,1.6v9.413a4.58,4.58,0,0,0,1.011,3.328,4.011,4.011,0,0,0,2.96,1.011,3.853,3.853,0,0,0,2.96-1.121,4.54,4.54,0,0,0,1.048-3.217V-55.8a2.205,2.205,0,0,1,.625-1.6A2.111,2.111,0,0,1,49.151-58.042Z"
              transform="translate(37.646 99.27)"
              fill="#d3d3d3"
            />
          </svg>
        </span>
      </div>
    );
};
const SettingOption = ({
  name,
  Icon,
  callback,
  dataCy,
}: {
  name: string;
  Icon: React.ReactNode;
  callback: () => void;
  dataCy;
}) => {
  return (
    <div
      onClick={() => callback()}
      data-cy={dataCy}
      className="w-full cursor-pointer flex-row mt-[4px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center"
    >
      {Icon}
      <span className="text-[14px] regular text-[#1d1d1d] ml-[12px] ">
        {translateFunction(name)}
      </span>
    </div>
  );
};
