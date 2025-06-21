import React, { useState } from "react";
import SettingTopBar from "./TopBar";
import SelectRegion from "components/Cart/SelectRegion";

import AddAddressForm from "components/Cart/AddAddressForm";

import { useAppStore } from "store";
import { PersonalInfoAddressModalPropsType } from "models/componentType/settingTypes/PersonalInfoAddressModalPropsType";

function PersonalInfoAddressModal({
  swipeToScreen,
  goBack,
}: PersonalInfoAddressModalPropsType) {
  const { setAddressDetails, isActiveAddress } = useAppStore();

  const [openSelect, setOpenSelect] = useState(false);

  return (
    <div className="flex-col max-h-[calc(100vh-200px)]">
      <SettingTopBar
        goBack={() => goBack()}
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
          slidePrev={() => {
            swipeToScreen(5);
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
