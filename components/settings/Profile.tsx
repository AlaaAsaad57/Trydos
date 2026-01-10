import React from "react";
import SettingTopBar from "./TopBar";
import PersonIcon from "public/svg/PersonIcon";
import AddressIcon from "public/svg/AddressIcon";
import BankIcon from "public/svg/BankIcon";

import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
import Image from "next/image";
function Profile({ swipeToScreen, goBack }: any) {
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
      Icon: (
        <Image
          src={"/svg/SizeIcon.svg"}
          width={25}
          height={25}
          alt="size-icon"
        />
      ),
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
        Save={null}
        DataCy="profile"
      />
      <div className="flex-row justify-center mt-[12px]">
        <ProfilePicture
          photo={GetImageUrl(userProfile?.image)}
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

const SettingOption = ({ name, Icon, callback, dataCy }: any) => {
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
