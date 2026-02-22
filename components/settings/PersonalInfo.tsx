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
        className="w-[20px] absolute z-30 top-[calc(50%-170px)]  right-[30px]  h-[20px] cursor-pointer"
        onClick={closeWindow}
      />
      <div className="fixed z-20 top-0 left-0  w-full h-full bg-black opacity-50" />

      <div className="p-5 flex  w-auto justify-center z-30 h-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[15px]">
        <ConfirmMobileChange
          forVerify={forVerify}
          closeWindow={closeWindow}
          value={value}
          successCallbackFunction={(idToken) => {
            successCallback(idToken);
          }}
        />
      </div>
    </>
  );
};
