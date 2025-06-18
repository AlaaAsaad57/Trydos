import ConfirmMobile from "components/Cart/ConfirmMobile";
import CloseIcon from "components/Home/Stories/CloseIcon";
import React, { useEffect } from "react";
import { useAppStore } from "store";

function ConfirmMobilePhoneWidget() {
  const { setShouldAuthinticated } = useAppStore();
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
    return () => {
      document.documentElement.style.overflow = "auto";
      document.documentElement.scrollTop = 0;
    };
  }, []);
  return (
    <>
      <div className="fixed top-0 left-0 w-screen h-screen z-[9999999999] bg-[#00000080] flex items-center justify-center" />
      <div className="absolute top-[100px] right-[20px] p-[10px] z-[99999999999]">
        <CloseIcon
          close={() => {
            setShouldAuthinticated(false);
            window.location.reload();
          }}
        />
      </div>
      <div className="w-auto min-h-[200px] min-w-[350px]  h-auto p-[23px] flex items-center justify-center bg-[#f8f8f8] fixed rounded-[10px]  z-[99999999999] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <ConfirmMobile
          closeWindow={() => {
            setShouldAuthinticated(false);
          }}
          hasMobile={localStorage.getItem("has-phone")?.length > 2}
          goToOrders={() => {
            setShouldAuthinticated(false);
          }}
        />
      </div>
    </>
  );
}

export default ConfirmMobilePhoneWidget;
