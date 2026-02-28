import { createPortal } from "react-dom";
import ConfirmMobileChange from "./ConfirmMobileChange";

export const ConfirmationModal = ({
  closeWindow,
  value,
  successCallback,
  forVerify,
}: any) => {
  return (
    <>
      <img
        src="/icons/settings/Xicon.svg"
        className="w-[20px] absolute z-[999999999] top-[calc(50%-170px)]  right-[30px]  h-[20px] cursor-pointer"
        onClick={closeWindow}
      />
      {createPortal(
        <>
          <div className="fixed z-[999999998] top-0 left-0  w-full h-full bg-black opacity-50" />

          <div className="p-5 flex  w-auto justify-center z-[999999999] h-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[15px]">
            <ConfirmMobileChange
              forVerify={forVerify}
              closeWindow={closeWindow}
              value={value}
              successCallbackFunction={(idToken) => {
                successCallback(idToken);
              }}
            />
          </div>
        </>,
        document.body,
      )}
    </>
  );
};
