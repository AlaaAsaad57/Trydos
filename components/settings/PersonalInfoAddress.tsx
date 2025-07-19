import React, { useEffect, useState } from "react";
import { translateFunction } from "utils/functions";
import AddressInfo from "public/svg/cart/AddressInfo.svg";
import SettingTopBar from "./TopBar";
import AddAddressIcon from "public/svg/cart/AddAddress.svg";

import order from "services/order";
import { DeleteModalComponent } from "components/Cart/OrdersPage";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import { GetAddressString } from "utils/tinyUtils";
import { fetchCountries } from "Server Requests";
import { PersonalInfoAddressPropsType } from "models/componentType/settingTypes/PersonalInfoAddressPropsType";
function PersonalInfoAddress({
  swipeToScreen,
  goBack,
  setIsActive,
}: PersonalInfoAddressPropsType) {
  const { setCountries, addressLists } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [country, language] = lang?.split("-");
  const getAdditionData = async () => {
    order.GetAddressList();
    if (sessionStorage.getItem(`countries-${country}-${language}`)) {
      let data = sessionStorage.getItem(`countries-${country}-${language}`);
      setCountries(JSON.parse(data));
    } else {
      try {
        const data = await fetchCountries(country, language);
        sessionStorage.setItem(
          `countries-${country}-${language}`,
          JSON.stringify(data.countries)
        );
        setCountries(data.countries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    }
  };
  useEffect(() => {
    getAdditionData();
  }, []);
  const [deleteModal, setDeleteModal] = useState<any>(false);

  const { initAddressForm, setAddressDetails } = useAppStore();
  return (
    <div className="flex-col ">
      <SettingTopBar
        goBack={() => goBack()}
        screenName="Profile | Address Info"
        Save={null}
      />
      {deleteModal && (
        <DeleteModalComponent
          slidePrev={() => {
            swipeToScreen(5);
          }}
          deletedAddress={deleteModal}
          closeModal={() => setDeleteModal(false)}
        />
      )}
      <div className="flex-row justify-center mt-[12px] w-full">
        <div
          className="bg-[#F8F8F8] min-h-[50px] w-full flex-row items-center pl-[24px] pr-[20px] "
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
          data-cy="address-info-header" // Added data-cy
        >
          <svg
            id="Group_3387"
            data-name="Group 3387"
            xmlns="http://www.w3.org/2000/svg"
            width="24.997"
            height="24.997"
            viewBox="0 0 24.997 24.997"
          >
            <path
              id="Path_15434"
              data-name="Path 15434"
              d="M178.661,126.993h-.067a2.3,2.3,0,0,0,0,4.605h.067a2.3,2.3,0,0,0,0-4.605Z"
              transform="translate(-167.728 -120.932)"
              fill="#402cdd"
            />
            <path
              id="Path_15435"
              data-name="Path 15435"
              d="M180.465,237.18H176.79a.5.5,0,0,0-.5.5v9.113a.5.5,0,0,0,.5.5h3.675a.5.5,0,0,0,.5-.5v-9.113A.5.5,0,0,0,180.465,237.18Z"
              transform="translate(-167.728 -225.62)"
              fill="#402cdd"
            />
            <path
              id="Path_15436"
              data-name="Path 15436"
              d="M10.832,60.315a10.616,10.616,0,0,0-7.66,3.261A11.346,11.346,0,0,0,3.5,79.641l-.174,2.044a.5.5,0,0,0,.185.436.477.477,0,0,0,.457.08l2.124-.742a10.477,10.477,0,0,0,4.74,1.12,10.617,10.617,0,0,0,7.66-3.261,11.35,11.35,0,0,0,0-15.741A10.617,10.617,0,0,0,10.832,60.315Zm0,21.265A9.539,9.539,0,0,1,6.35,80.475a.476.476,0,0,0-.379-.028l-1.61.563.13-1.529a.506.506,0,0,0-.163-.418A10.264,10.264,0,0,1,.973,71.446a10.01,10.01,0,0,1,9.859-10.133,10.137,10.137,0,0,1,0,20.267Z"
              transform="translate(0 -57.581)"
              fill="#402cdd"
            />
            <path
              id="Path_15437"
              data-name="Path 15437"
              d="M380.02,5.522a.5.5,0,1,0,0,1,5.126,5.126,0,0,1,5.114,5.126.5.5,0,1,0,1,0A6.125,6.125,0,0,0,380.02,5.522Z"
              transform="translate(-361.135 -5.522)"
              fill="#402cdd"
            />
            <path
              id="Path_15438"
              data-name="Path 15438"
              d="M390.541,56.12a.5.5,0,0,0,0,1,2.075,2.075,0,0,1,2.07,2.075.5.5,0,1,0,1,0A3.073,3.073,0,0,0,390.541,56.12Z"
              transform="translate(-371.134 -53.595)"
              fill="#402cdd"
            />
          </svg>

          <div className="regular text-[10px] ml-[12px] text-[#8D8D8D]">
            {translateFunction(
              "Entering The Information Below Clearly And Completely Will Ensure That Your Order Arrives Without Problems And Faster."
            )}
          </div>
        </div>
      </div>
      <div
        className="flex-col w-full px-[12px] "
        data-cy="container-name-phone"
      >
        <div className="flex flex-col w-full px-[12px] mt-[19px] items-start">
          <div className="flex flex-row items-stretch">
            <MiniAddressInfo />
            <span className="ml-[6px] medium text-[#404040] text-[12px]">
              {translateFunction("Your Address Info")}
            </span>
            <AddressInfo className="ml-[19px] cursor-pointer" />
          </div>
          {addressLists.length === 0 ? (
            <div className="w-full cursor-pointer py-[12px] h-[84px] mt-[12px] bg-[#F8F8F8] justify-start rounded-[15px] flex-col items-center">
              <AddressInfo />
              <span className="medium text-[12px] text-[#C4C2C2] mt-[11px]">
                {translateFunction("Your Address List Is Empty")}
              </span>
              <span className="medium text-[12px] text-[#C4C2C2] mt-[3px]">
                {translateFunction(
                  "You Can Also Create Multiple Addresses To Use"
                )}
              </span>
            </div>
          ) : (
            <>
              <div className="flex-col  mt-[20px] h-auto max-h-[290px] overflow-auto w-full">
                {addressLists.map((s, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      // @ts-ignore
                      if (!e.target.closest(".map-element-icon")) {
                        // closeSelect(false);
                        // order.SetDefault({ id: s.id });
                      }
                    }}
                    style={{
                      border: s.is_default === 0 ? "" : "#388bff8c 1px solid",
                    }}
                    className={`flex-col relative  
                       items-start h-[auto] min-h-[90px] px-[24px]  py-[7px]
                      
                    
                     mt-[10px] rounded-[15px] bg-[#F8F8F8] w-full `}
                    data-cy="Address"
                  >
                    <EditIcon
                      data-cy="EditAddress"
                      onClick={() => {
                        // closeSelect();
                        // slideNext();
                        setIsActive(true);
                        setAddressDetails(s);
                        swipeToScreen(6);
                      }}
                      address={s}
                    />
                    <DeleteIcon
                      data-cy="DeleteAddress"
                      address={s}
                      onClick={() => {
                        setDeleteModal(s);
                      }}
                    />
                    <div
                      className={`flex-col ${
                        s.is_default === 1 &&
                        " [&_*]:!text-[#1D1D1D]   [&_svg_path]:!fill-[#1D1D1D]"
                      }`}
                    >
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
                            fill="#8d8d8d"
                          />
                        </svg>

                        <span className="regular ml-[4px] text-[12px] text-[#8D8D8D]">
                          {s.address}
                        </span>
                      </div>
                      <div className="flex-row mt-[5px]  items-center regular text-[12px] text-[#8D8D8D]">
                        {GetAddressString(s.region_details)}
                      </div>
                      <div className="flex-row mt-[5px] items-center regular text-[12px] text-[#8D8D8D]">
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
                                fill="#8d8d8d"
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
                                fill="#8d8d8d"
                              />
                            </g>
                          </g>
                        </svg>

                        <div className="flex-row ml-[4px]   items-center regular text-[12px] text-[#8D8D8D]">
                          {s?.contact_info?.phone}
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
                                  fill="#8d8d8d"
                                />
                                <path
                                  id="Path_21"
                                  data-name="Path 21"
                                  d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                                  transform="translate(-639.136 -165.377)"
                                  fill="#8d8d8d"
                                />
                                <path
                                  id="Path_22"
                                  data-name="Path 22"
                                  d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                                  transform="translate(-655.714 -165.376)"
                                  fill="#8d8d8d"
                                />
                              </g>
                            </g>
                          </svg>

                          <div className="flex-row  ml-[4px]  items-center regular text-[12px] text-[#8D8D8D]">
                            {s.contact_info.contact_person_name ||
                              // @ts-ignore
                              s?.contact_info?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div
            className="flex cursor-pointer w-full justify-center h-[40px] mt-[8px] items-center bg-[#E8FFED]"
            data-cy="AddAddres"
            style={{
              border: "1px solid rgb(196 194 194 / 51%)",
              borderRadius: "15px",
            }}
            onClick={() => {
              setIsActive(true);
              initAddressForm();
              swipeToScreen(6);
              // onClick();
            }}
          >
            <AddAddressIcon />
            <div className="medium text-[12px] ml-1 text-[#1D1D1D]">
              {translateFunction("Add Shipping Address")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoAddress;
export const MiniAddressInfo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
    >
      <defs>
        <clipPath id="clipPath">
          <rect
            id="Rectangle_4601"
            data-name="Rectangle 4601"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Group_13675"
        data-name="Group 13675"
        transform="translate(-24 -170)"
      >
        <g
          id="Mask_Group_730"
          data-name="Mask Group 730"
          transform="translate(24 170)"
          clipPath="url(#clipPath)"
        >
          <g id="Layer_x0020_1" transform="translate(1.165 0)">
            <g id="Group_13671" data-name="Group 13671">
              <path
                id="Path_23083"
                data-name="Path 23083"
                d="M10.373,8.588v0c0-.009.009-.018.018-.026C15.523-.025,6.066-1.809,4.792,2.9c-.369,1.353-.079,3.234,1.362,5.66a.088.088,0,0,1,.035.044A23.5,23.5,0,0,0,8.272,11.48,22.074,22.074,0,0,0,10.373,8.588Zm3.779,4.271H11.3l.483,1.793h1.643a.809.809,0,0,0,.835-.817ZM9.485,14.652,9,12.859H2.4l-.114,1.046a.822.822,0,0,0,.844.747ZM2.068,12.666,2.278,10.8H2.27L2.4,9.669a1.216,1.216,0,0,1,1.178-1.16H5.724C.635-.359,10.7-2.354,12.1,2.814c.369,1.38.105,3.278-1.274,5.7h2.144a1.229,1.229,0,0,1,1.178,1.16c.053.51.457,4.043.457,4.236A1.165,1.165,0,0,1,13.423,15H3.131a1.159,1.159,0,0,1-1.186-1.2Zm.58-2.021H7.156c-.431-.571-.861-1.2-1.23-1.784H3.579a.885.885,0,0,0-.835.844Zm6.75,0h4.509L13.8,9.7a.871.871,0,0,0-.826-.844H10.619A21.03,21.03,0,0,1,9.4,10.645ZM13.941,11H9.125a7.6,7.6,0,0,1-.738.888c-.053.053-.211.053-.246-.018-.237-.281-.483-.571-.712-.87H2.6l-.158,1.512H9.134a.179.179,0,0,1,.176.132l.536,2.013H11.41l-.519-1.969a.176.176,0,0,1,.176-.176h3.041ZM8.272,2.032A1.55,1.55,0,1,1,6.726,3.579,1.551,1.551,0,0,1,8.272,2.032Zm.853.7a1.2,1.2,0,1,0,0,1.687A1.2,1.2,0,0,0,9.125,2.735Z"
                transform="translate(-1.939 -0.004)"
                fill="#1d1d1d"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
export const EditIcon = ({ address, onClick }) => {
  const { startUpdateAddress } = useAppStore();
  return (
    <span
      onClick={() => {
        startUpdateAddress(address);
        onClick();
      }}
      className="map-element-icon p-1 cursor-pointer flex justify-center absolute z-[10] right-[32px] top-[8px]"
      data-cy="Edit-Addres-Icon"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path884477">
            <rect
              id="Rectangle_4561"
              data-name="Rectangle 4561"
              width="12"
              height="12"
              transform="translate(-0.131)"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Group_13364"
          data-name="Group 13364"
          transform="translate(-363 -240)"
        >
          <g
            id="Mask_Group_64"
            data-name="Mask Group 64"
            transform="translate(363.131 240)"
            clipPath="url(#clip-path884477)"
          >
            <g
              id="Group_4665"
              data-name="Group 4665"
              transform="translate(0 0.449)"
            >
              <g id="drawing" transform="translate(0.831)">
                <path
                  id="Path_16019"
                  data-name="Path 16019"
                  d="M12.884,2.113,10.857.086a.291.291,0,0,0-.411,0L5.4,5.128a.291.291,0,0,0-.079.149l-.5,2.531a.291.291,0,0,0,.342.342l2.53-.5a.291.291,0,0,0,.149-.08l5.042-5.042a.291.291,0,0,0,0-.411ZM5.593,6.9,5.856,5.58,7.39,7.114l-1.323.262Z"
                  transform="translate(-2.742 0)"
                  fill="#8e8e8e"
                />
                <path
                  id="Path_16020"
                  data-name="Path 16020"
                  d="M8.341,16.772c-2.78-1.164-4.59.761-5.127,1.053-.69.373-1.664.813-1.89.053-.137-.459.6-.949,1.09-1.1.356-.111.2-.673-.155-.561-.762.241-1.667.877-1.507,1.779.118.669.956,1.282,2.572.427C4.5,17.806,5.3,16.529,7.767,17.191a2.451,2.451,0,0,1,1.751,1.553c.123.351.684.2.561-.155a3,3,0,0,0-1.738-1.817Z"
                  transform="translate(-0.733 -7.972)"
                  fill="#8e8e8e"
                />
              </g>
              <rect
                id="Rectangle_4536"
                data-name="Rectangle 4536"
                width="11.869"
                height="10.88"
                transform="translate(0 0.091)"
                fill="none"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
};
export const DeleteIcon = ({ address, onClick }) => {
  return (
    <span
      onClick={() => {
        onClick();
      }}
      className="map-element-icon p-1 cursor-pointer flex justify-center absolute z-[10] right-[8px] top-[8px]"
      data-cy="Delete-Address-Icon"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path883763">
            <rect
              id="Rectangle_4561"
              data-name="Rectangle 4561"
              width="12"
              height="12"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Group_13363"
          data-name="Group 13363"
          transform="translate(-386 -240)"
        >
          <g
            id="Mask_Group_510"
            data-name="Mask Group 510"
            transform="translate(386 240)"
            clipPath="url(#clip-path883763)"
          >
            <g id="trash-can" transform="translate(1.348 -0.001)">
              <path
                id="Path_22129"
                data-name="Path 22129"
                d="M8.839,13.723H6.231a2.347,2.347,0,0,1-2.337-2.1L3.117,4.363a.276.276,0,0,1,.275-.306h8.286a.276.276,0,0,1,.275.306l-.777,7.261A2.346,2.346,0,0,1,8.839,13.723ZM3.7,4.61l.744,6.955A1.8,1.8,0,0,0,6.232,13.17H8.839a1.8,1.8,0,0,0,1.788-1.606L11.37,4.61Z"
                transform="translate(-2.883 -1.723)"
                fill="#f85555"
              />
              <path
                id="Path_22130"
                data-name="Path 22130"
                d="M11.852,3.072H3.1a.276.276,0,1,1,0-.553h8.75a.276.276,0,0,1,0,.553Z"
                transform="translate(-2.825 -1.416)"
                fill="#f85555"
              />
              <path
                id="Path_22131"
                data-name="Path 22131"
                d="M8.571,11.221a.277.277,0,0,1-.276-.276V7.63a.276.276,0,0,1,.553,0v3.314A.276.276,0,0,1,8.571,11.221Z"
                transform="translate(-3.919 -2.383)"
                fill="#f85555"
              />
              <path
                id="Path_22132"
                data-name="Path 22132"
                d="M10.642,11.221a.277.277,0,0,1-.276-.276V7.63a.276.276,0,0,1,.553,0v3.314A.276.276,0,0,1,10.642,11.221Z"
                transform="translate(-4.333 -2.383)"
                fill="#f85555"
              />
              <path
                id="Path_22133"
                data-name="Path 22133"
                d="M9.4,2.8H7.192a.277.277,0,0,1-.276-.276,1.38,1.38,0,0,1,2.759-.044.286.286,0,0,1,0,.044A.276.276,0,0,1,9.4,2.8ZM7.516,2.243H9.074a.827.827,0,0,0-1.558,0Z"
                transform="translate(-3.643 -1.14)"
                fill="#f85555"
              />
              <path
                id="Path_22134"
                data-name="Path 22134"
                d="M6.5,11.221a.277.277,0,0,1-.276-.276V7.63a.276.276,0,0,1,.553,0v3.314A.276.276,0,0,1,6.5,11.221Z"
                transform="translate(-3.505 -2.383)"
                fill="#f85555"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
};
