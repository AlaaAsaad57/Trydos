import ConfirmMobile from "components/Cart/ConfirmMobile";

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
      <div className="fixed top-0 left-0 w-screen h-screen z-[99999999999998] bg-[#00000080] flex items-center justify-center" />

      <div className="w-auto  min-h-[200px] min-w-[350px]  h-auto p-[23px] flex-col items-end justify-center bg-[#f8f8f8] fixed rounded-[10px]  z-[99999999999999] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div
          onClick={() => {
            setShouldAuthinticated(false);
            window.location.reload();
          }}
          className="flex-row cursor-pointer justify-end items-center p-[10px] z-[99999999999] rounded-full  bg-[#0000004d]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16.411"
            height="16.411"
            viewBox="0 0 16.411 16.411"
          >
            <g
              id="Group_10735"
              data-name="Group 10735"
              transform="translate(-1293.141 -97.641)"
            >
              <line
                id="Line_792"
                data-name="Line 792"
                x2="20.848"
                transform="matrix(0.695, -0.719, 0.719, 0.695, 1294.105, 113.345)"
                fill="none"
                stroke="#f3f3f3"
                strokeLinecap="round"
                strokeWidth="1"
              />
              <line
                id="Line_793"
                data-name="Line 793"
                x2="20.848"
                transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)"
                fill="none"
                stroke="#f3f3f3"
                strokeLinecap="round"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>
        <ConfirmMobile
          closeWindow={() => {
            setShouldAuthinticated(false);
          }}
          hasMobile={localStorage.getItem("has-phone")?.length > 2}
          goToOrders={() => {
            // equal to success flag when goToOrders trigrred then it means the verification success
            setShouldAuthinticated(false);
          }}
        />
      </div>
    </>
  );
}

export default ConfirmMobilePhoneWidget;
