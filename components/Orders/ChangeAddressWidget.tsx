import React, { useState } from "react";
import ChangeAddressIcon from "public/svg/ChangeAddressIcon.svg";
import { translateFunction } from "utils/functions";
import EditIcon from "public/svg/editAddressIcon.svg";
import AddAddressIcon from "public/svg/cart/AddAddress.svg";
import BackIcon from "public/svg/listing/backIcon.svg";

import { useAppStore } from "store";
import { GetAddressString } from "utils/tinyUtils";
import { MiniDeliveryIcon } from "components/Cart/AddressListContainer";
import SelectRegion from "components/Cart/SelectRegion";
import AddAddressForm from "components/Cart/AddAddressForm";
import ConfirmAddressModal from "./ConfirmAddressModal";
function ChangeAddressWidget({ address_id, close }) {
  const {
    addressLists,
    setAddressDetails,
    setIsActiveAddress,
    initAddressForm,
  } = useAppStore();
  const [openModal, setOpenModal] = useState(false);
  const [selectedAddressId, setAddressId] = useState(address_id);
  const [ConfirmationData, setConfirmationData] = useState({
    enable: false,
    currentAddress: addressLists?.find((s) => s.id === address_id),
    newAddress: addressLists?.find((s) => s.id === selectedAddressId),
  });
  return (
    <>
      <div className="flex-col max-h-[calc(100vh-50px)] overflow-auto w-full pt-[14px] px-[24px] z-[999999999] pb-[27px] absolute bottom-[0px]  left-0 rounded-t-[30px] bg-white">
        <div className="flex-col  items-center w-full justify-center">
          <ChangeAddressIcon />
          <span className="medium text-[#402CDD] text-[14px] mt-[5px] ">
            {translateFunction("Change Delivery Address & Note")}
          </span>
          <span className="text-[12px] regular text-[#8D8D8D] mt-[8px]">
            {translateFunction(
              "You Can Easily Change Your Shipping Address And Delivery Notes"
            )}
          </span>
          <div
            className="w-full h-[1px] mt-[22px]"
            style={{ borderTop: "1px solid #C4C2C280" }}
          />
        </div>
        <div className="flex-col items-center mt-[20px]  bg-[#fff] h-[481px] w-full ">
          <div className="flex-row items-center w-full justify-center">
            <MiniDeliveryIcon />
            <span className="flex regular ml-[6px] text-[#1D1D1D] text-[14px]">
              {translateFunction("Your Address List")}
            </span>
          </div>
          <div className="flex-col justify-start pb-[25px] h-full w-full max-w-[650px]">
            <div className="flex-col  mt-[20px] h-auto max-h-[290px] overflow-auto">
              {addressLists.map((s, i) => (
                <div
                  key={i}
                  onClick={(e) => {
                    // @ts-ignore
                    if (!e.target.closest(".map-element-icon")) {
                      // closeSelect(false);
                      // order.SetDefault({ id: s.id });
                      // updateAddress(s);
                      // setDefaultAddress(s.id);
                      setAddressId(s.id);
                    }
                  }}
                  style={{
                    border:
                      s.id !== selectedAddressId ? "" : "#402CDD80 1px solid",
                  }}
                  className={`flex-col relative ${
                    s.id === selectedAddressId
                      ? "text-[#1D1D1D]"
                      : "text-[#8D8D8D]"
                  }  mt-[10px] rounded-[15px] bg-[#F8F8F8] w-full items-start h-[auto] min-h-[90px] px-[24px]  py-[7px]`}
                  data-cy="Address"
                >
                  <EditIcon
                    className="absolute top-[10px] right-[12px] map-element-icon"
                    onClick={() => {
                      setIsActiveAddress(true);
                      setAddressDetails(s);
                      setOpenModal(true);
                    }}
                    // address={s}
                  />

                  <div className="flex-col">
                    <div className="flex-row items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                      >
                        <path
                          id="home-3"
                          d="M11.677,5.219h0L6.781.324a1.1,1.1,0,0,0-1.563,0L.325,5.216l0,.005A1.1,1.1,0,0,0,1.056,7.1l.034,0h.2v3.6A1.294,1.294,0,0,0,2.578,12H4.493a.352.352,0,0,0,.352-.352V8.824a.591.591,0,0,1,.59-.59h1.13a.591.591,0,0,1,.59.59v2.824A.352.352,0,0,0,7.506,12H9.421a1.294,1.294,0,0,0,1.293-1.293V7.1H10.9a1.1,1.1,0,0,0,.782-1.885Zm0,0"
                          transform="translate(0.001)"
                          fill={
                            s.id === selectedAddressId
                              ? "text-[#1D1D1D]"
                              : "text-[#8D8D8D]"
                          }
                        />
                      </svg>

                      <span
                        className={`regular ml-[4px] text-[12px] ${
                          s.id === selectedAddressId
                            ? "text-[#1D1D1D]"
                            : "text-[#8D8D8D]"
                        }`}
                      >
                        {s.address}
                      </span>
                    </div>
                    <div
                      className={`flex-row mt-[5px]  items-center regular text-[12px] ${
                        s.id === selectedAddressId
                          ? "text-[#1D1D1D]"
                          : "text-[#8D8D8D]"
                      }`}
                    >
                      {GetAddressString(s.region_details)}
                    </div>
                    <div
                      className={`flex-row mt-[5px] items-center regular text-[12px] ${
                        s.id === selectedAddressId
                          ? "text-[#1D1D1D]"
                          : "text-[#8D8D8D]"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                      >
                        <defs>
                          <clipPath id="clip-path1213">
                            <rect
                              id="Rectangle_6097"
                              data-name="Rectangle 6097"
                              width="12"
                              height="12"
                              transform="translate(-0.245)"
                              fill={
                                s.id === selectedAddressId
                                  ? "text-[#1D1D1D]"
                                  : "text-[#8D8D8D]"
                              }
                            />
                          </clipPath>
                        </defs>
                        <g
                          id="Mask_Group_646"
                          data-name="Mask Group 646"
                          transform="translate(0.245)"
                          clipPath="url(#clip-path1213)"
                        >
                          <g id="XMLID_7_" transform="translate(0.202 0.583)">
                            <path
                              id="XMLID_10_"
                              d="M10.461,8.411c-.055-.042-.111-.085-.164-.128-.281-.226-.579-.434-.868-.635l-.18-.125a1.791,1.791,0,0,0-1.016-.386,1.317,1.317,0,0,0-1.1.695.583.583,0,0,1-.5.3.993.993,0,0,1-.4-.1A4.848,4.848,0,0,1,3.7,5.568c-.236-.529-.159-.876.255-1.157A1.171,1.171,0,0,0,4.6,3.383,5.865,5.865,0,0,0,2.534.569a1.172,1.172,0,0,0-.8,0A2.306,2.306,0,0,0,.3,1.747,2.194,2.194,0,0,0,.334,3.518,14.288,14.288,0,0,0,3.469,8.291a15.2,15.2,0,0,0,4.756,3.158,2.634,2.634,0,0,0,.47.14c.044.01.081.018.109.026a.183.183,0,0,0,.046.006h.015a2.7,2.7,0,0,0,2.241-1.705C11.388,9.12,10.874,8.727,10.461,8.411Z"
                              transform="translate(-0.131 -0.498)"
                              fill={
                                s.id === selectedAddressId
                                  ? "text-[#1D1D1D]"
                                  : "text-[#8D8D8D]"
                              }
                            />
                          </g>
                        </g>
                      </svg>

                      <div
                        className={`flex-row ml-[4px]   items-center regular text-[12px] ${
                          s.id === selectedAddressId
                            ? "text-[#1D1D1D]"
                            : "text-[#8D8D8D]"
                        }`}
                      >
                        {s.contact_info.phone}
                      </div>
                      <div className="flex-row ml-[17px]  items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                        >
                          <defs>
                            <clipPath id="clip-path232323">
                              <rect
                                id="Rectangle_6098"
                                data-name="Rectangle 6098"
                                width="12"
                                height="12"
                                fill="none"
                              />
                            </clipPath>
                          </defs>
                          <g
                            id="Mask_Group_647"
                            data-name="Mask Group 647"
                            clipPath="url(#clip-path232323)"
                          >
                            <g
                              id="Group_13"
                              data-name="Group 13"
                              transform="translate(1.162 0)"
                            >
                              <path
                                id="Path_20"
                                data-name="Path 20"
                                d="M651.622,148c.318-.068.611-.331.658-.913.04-.476-.083-.722-.264-.846.5-2.042-.88-2.441-.88-2.441a2.072,2.072,0,0,0-3.047-.522,3.6,3.6,0,0,0-.891.765,3.182,3.182,0,0,0-.681,2.132c-.246.092-.44.331-.391.918.05.609.367.868.7.918a2.435,2.435,0,0,0,4.794-.008Zm-2.4,1.5c-1.218,0-2.2-1.653-2.2-3.025,0-.184.005-.362.017-.523a4.18,4.18,0,0,0,3.411-1.257,4,4,0,0,1,.971,1.736v.044c.008,1.371-.973,3.026-2.192,3.026Z"
                                transform="translate(-644.484 -142.822)"
                                fill={
                                  s.id === selectedAddressId
                                    ? "text-[#1D1D1D]"
                                    : "text-[#8D8D8D]"
                                }
                              />
                              <path
                                id="Path_21"
                                data-name="Path 21"
                                d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                                transform="translate(-639.136 -165.377)"
                                fill={
                                  s.id === selectedAddressId
                                    ? "text-[#1D1D1D]"
                                    : "text-[#8D8D8D]"
                                }
                              />
                              <path
                                id="Path_22"
                                data-name="Path 22"
                                d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                                transform="translate(-655.714 -165.376)"
                                fill={
                                  s.id === selectedAddressId
                                    ? "text-[#1D1D1D]"
                                    : "text-[#8D8D8D]"
                                }
                              />
                            </g>
                          </g>
                        </svg>

                        <div
                          className={`flex-row  ml-[4px]  items-center regular text-[12px] ${
                            s.id === selectedAddressId
                              ? "text-[#1D1D1D]"
                              : "text-[#8D8D8D]"
                          }`}
                        >
                          {s.contact_info.contact_person_name ||
                            // @ts-ignore
                            s.contact_info?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="flex cursor-pointer w-full justify-center h-[40px] mt-[8px] items-center bg-[#E8FFED]"
              data-cy="Add-Shipping-Address"
              style={{
                border: "1px solid rgb(196 194 194 / 51%)",
                borderRadius: "15px",
              }}
              onClick={() => {
                initAddressForm();
                setOpenModal(true);
                setIsActiveAddress(true);
                //   closeSelect();
                //   slideNext();
              }}
            >
              <AddAddressIcon />
              <div className="medium text-[12px] ml-1 text-[#1D1D1D]">
                {translateFunction("Add Shipping Address")}
              </div>
            </div>
          </div>
        </div>
        <div
          className={`w-full h-[53px] items-center justify-center  flex cursor-pointer ${
            selectedAddressId === address_id ? "bg-[#D3D3D3] " : "bg-[#402CDD] "
          } rounded-[20px] text-[16px] text-[#fff] medium`}
          onClick={() => {
            if (address_id === selectedAddressId) {
              close();
            } else {
              setConfirmationData({
                enable: true,
                currentAddress: addressLists?.find((s) => s.id === address_id),
                newAddress: addressLists?.find(
                  (s) => s.id === selectedAddressId
                ),
              });
            }
          }}
        >
          {address_id === selectedAddressId
            ? translateFunction("Close")
            : translateFunction("Change & Close")}
        </div>
      </div>
      {openModal && (
        <div className="absolute z-[99999999999] top-0 left-0 bg-white overflow-auto w-full flex-col ">
          <div className="flex-row h-[50px] w-full px-[20px] items-center">
            <span
              onClick={() => {
                setOpenModal(false);
              }}
            >
              <BackIcon />
            </span>
          </div>
          <AddressModal
            close={() => {
              setOpenModal(false);
              initAddressForm();
            }}
          />
        </div>
      )}
      {ConfirmationData?.enable && (
        <ConfirmAddressModal
          confirmationData={ConfirmationData}
          confirm={() => {
            setConfirmationData({
              enable: false,
              currentAddress: addressLists?.find((s) => s.id === address_id),
              newAddress: addressLists?.find((s) => s.id === selectedAddressId),
            });
            close();
          }}
          close={() => {
            setConfirmationData({
              enable: false,
              currentAddress: addressLists?.find((s) => s.id === address_id),
              newAddress: addressLists?.find((s) => s.id === selectedAddressId),
            });
          }}
        />
      )}
    </>
  );
}

export default ChangeAddressWidget;
export const AddressModal = ({
  id,
  close,
}: {
  id?: any;
  close: () => void;
}) => {
  const { setAddressDetails, isActiveAddress } = useAppStore();

  const [openSelect, setOpenSelect] = useState(false);
  return (
    <>
      {openSelect && (
        <SelectRegion
          closeSelect={() => {
            setOpenSelect(false);
          }}
        />
      )}
      {isActiveAddress && (
        <AddAddressForm
          isInSettings={false}
          activeIndex={true}
          setOpenSelect={() => {
            setOpenSelect(true);
          }}
          slidePrev={() => {
            close();
          }}
          setAddressDetails={(e) => {
            setAddressDetails(e);
          }}
        />
      )}
    </>
  );
};
