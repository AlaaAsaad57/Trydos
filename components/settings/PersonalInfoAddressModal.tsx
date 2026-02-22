import React, { useState } from "react";
import SettingTopBar from "./TopBar";
import SelectRegion from "components/Cart/SelectRegion";

import AddAddressForm from "components/Cart/AddAddressForm";

import { useAppStore } from "store";

function PersonalInfoAddressModal({ goBack }: any) {
  const { setAddressDetails, isActiveAddress } = useAppStore();

  const [openSelect, setOpenSelect] = useState(false);

  return (
    <div className="flex-col w-full flex">
      <SettingTopBar
        goBack={() => goBack()}
        DataCy="profile-info-screen"
        screenName="Profile | Address Info"
        Save={null}
      />

      {openSelect && (
        <SelectRegion
          closeSelect={() => {
            setOpenSelect(false);
          }}
        />
      )}
      {isActiveAddress && (
        <AddAddressForm
          isInSettings={true}
          activeIndex={true}
          setOpenSelect={() => {
            setOpenSelect(true);
          }}
          slidePrev={(value) => {
            goBack();
          }}
          setAddressDetails={(e) => {
            setAddressDetails(e);
          }}
        />
      )}
    </div>
  );
}

export default PersonalInfoAddressModal;
