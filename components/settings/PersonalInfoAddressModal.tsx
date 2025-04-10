import React, { useState } from "react";
import SettingTopBar from "./TopBar";
import SelectRegion from "components/Cart/SelectRegion";
import { DeleteModalComponent } from "components/Cart/OrdersPage";
import AddAddressForm from "components/Cart/AddAddressForm";
import { useDispatch } from "node_modules/react-redux/es";

function PersonalInfoAddressModal({
  swipeToScreen,
  goBack,
}: {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}) {
  const dispatch = useDispatch();
  const setAddressDetails = (e) => {
    dispatch({ type: "set-address-details", payload: e });
  };
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
      <AddAddressForm
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
    </div>
  );
}

export default PersonalInfoAddressModal;
