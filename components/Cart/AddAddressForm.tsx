"use client";
import { allCountries } from "country-telephone-data";
import React, { useEffect, useState } from "react";
import { translateFunction } from "utils/functions";
import "leaflet/dist/leaflet.css";
import Map from "./Map";
import axios from "axios";
import { useParams } from "next/navigation";
import Addressicon from "public/svg/cart/AddressIcon.svg";
import AddressInfo from "public/svg/cart/AddressInfo.svg";
import Flag from "react-world-flags";
import TargetIcon from "public/svg/cart/Target.svg";
import ContactInfoIcon from "public/svg/cart/ContactInfoIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import order from "services/order";
import { IpDataApi } from "models/Api";
function AddAddressForm({
  setAddressDetails,
  slidePrev,
  setOpenSelect,
  activeIndex,
}) {
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();
  const center = useSelector((state: StateInterface) => state.cart.center);
  const setCenter = (e) => {
    dispatch({ type: "MAP-CENTER", payload: e });
  };
  useEffect(() => {
    getCenter();
  }, []);
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  const getCenter = async () => {
    let ipData: IpDataApi = await axios.get("http://ip-api.com/json");

    setCenter({ lat: ipData.data?.lat, lng: ipData.data?.lon });
  };
  const isValid = () => {
    let valid = false;
    if (addressDetails.location.latitude && addressDetails.location.longitude) {
      valid = true;
    } else {
      valid = false;
      return;
    }
    if (
      addressDetails.contact_info.contact_person_name?.length > 0 &&
      addressDetails.contact_info.phone?.length > 0
    ) {
      valid = true;
    } else {
      valid = false;
      return;
    }
    if (
      addressDetails?.address_detail?.length > 0 &&
      addressDetails?.address.length > 0
    ) {
      valid = true;
    } else {
      valid = false;
      return;
    }
    if (addressDetails.region?.length > 0) {
      valid = true;
    } else {
      valid = false;
      return;
    }
    return valid;
  };
  const orderLoading = useSelector(
    (state: StateInterface) => state.cart.orderLoading
  );
  return (
    <>
      <div
        className={`${
          orderLoading ? "opacity-50 scale-[.99]" : ""
        } flex-col h-full max-h-full overflow-auto w-full relative pb-[160px]`}
      >
        <div
          className="bg-[#F8F8F8] min-h-[50px] flex-row items-center pl-[24px] pr-[20px] "
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
        >
          <svg
            id="Group_3387"
            data-name="Group 3387"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
          >
            <path
              id="Path_15434"
              data-name="Path 15434"
              d="M177.808,126.993h-.043a1.474,1.474,0,0,0,0,2.948h.043a1.474,1.474,0,0,0,0-2.948Z"
              transform="translate(-170.81 -123.113)"
              fill="#388cff"
            />
            <path
              id="Path_15435"
              data-name="Path 15435"
              d="M178.962,237.18H176.61a.319.319,0,0,0-.319.319v5.833a.319.319,0,0,0,.319.319h2.352a.319.319,0,0,0,.319-.319V237.5A.319.319,0,0,0,178.962,237.18Z"
              transform="translate(-170.81 -229.781)"
              fill="#388cff"
            />
            <path
              id="Path_15436"
              data-name="Path 15436"
              d="M6.933,60.315A6.8,6.8,0,0,0,2.03,62.4a7.262,7.262,0,0,0,.21,10.283l-.111,1.308a.323.323,0,0,0,.118.279.305.305,0,0,0,.293.051L3.9,73.848a6.706,6.706,0,0,0,3.034.717,6.8,6.8,0,0,0,4.9-2.087,7.265,7.265,0,0,0,0-10.076A6.8,6.8,0,0,0,6.933,60.315Zm0,13.611a6.105,6.105,0,0,1-2.869-.708.3.3,0,0,0-.243-.018l-1.03.36.083-.979a.324.324,0,0,0-.1-.267A6.57,6.57,0,0,1,.623,67.44a6.407,6.407,0,0,1,6.311-6.486,6.489,6.489,0,0,1,0,12.973Z"
              transform="translate(0 -58.565)"
              fill="#388cff"
            />
            <path
              id="Path_15437"
              data-name="Path 15437"
              d="M379.84,5.522a.319.319,0,1,0,0,.639,3.281,3.281,0,0,1,3.273,3.281.319.319,0,1,0,.639,0A3.92,3.92,0,0,0,379.84,5.522Z"
              transform="translate(-367.752 -5.522)"
              fill="#388cff"
            />
            <path
              id="Path_15438"
              data-name="Path 15438"
              d="M390.361,56.12a.319.319,0,1,0,0,.639,1.328,1.328,0,0,1,1.325,1.328.319.319,0,1,0,.639,0A1.967,1.967,0,0,0,390.361,56.12Z"
              transform="translate(-377.939 -54.504)"
              fill="#388cff"
            />
          </svg>
          <div className="regular text-[10px] ml-[8px] text-[#8D8D8D]">
            {translateFunction(
              "Entering The Information Below Clearly And Completely Will Ensure That Your Order Arrives Without Problems And Faster."
            )}
          </div>
        </div>

        {activeIndex && (
          <Map
            expanded={expanded}
            setCenter={(e) => setCenter(e)}
            setExpanded={(e) => setExpanded(e)}
            center={
              (addressDetails.location.latitude && {
                lat: addressDetails.location.latitude,
                lng: addressDetails.location.longitude,
              }) ||
              center
            }
            setAddressDetails={(e) => setAddressDetails(e)}
          />
        )}
        <AddressSection
          setOpenSelect={() => {
            setOpenSelect();
          }}
        />
        <ContactInfo />
      </div>
      {!expanded && (
        <AddAddressButtons
          valid={isValid()}
          slidePrev={() => {
            slidePrev();
          }}
        />
      )}
    </>
  );
}

export default AddAddressForm;

const AddressSection = ({ setOpenSelect }) => {
  return (
    <div className="flex-col w-full mt-[30px] px-[12px]">
      <div className="flex-row px-[12px] items-center">
        <Addressicon />
        <div className="flex ml-[6px] text-[#404040] text-[12px] medium">
          {translateFunction("Address Info")}
        </div>
        <AddressInfo className="ml-[12px] cursor-pointer" />
      </div>
      <CountryLabel />
      <SelectRegion
        setOpenSelect={() => {
          setOpenSelect();
        }}
      />
      <DetailsAddress />
      <AddressTitle />
    </div>
  );
};
const CountryLabel = () => {
  const { lang } = useParams();
  // @ts-ignore
  let country = lang.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0]?.name,
    iso: country,
  };
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({
      type: "set-address-details",
      payload: { Country: { name: country?.name, code: country.iso } },
    });
  }, []);
  return (
    <div
      className="flex-col rounded-[15px] w-full mt-[12px] py-[7px] pl-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div className="flex-row regular text-[#505050] text-[12px]">
        {translateFunction("Country | Region")}
      </div>
      <div className="flex-row items-center mt-[3px] ">
        <span className="h-[15px] rounded-[5px] w-[22px]">
          <Flag height={"15"} code={country.iso} />
        </span>
        <div className="medium flex text-[#1D1D1D] text-[14px] ml-[8px]">
          {country?.name}
        </div>
      </div>
    </div>
  );
};

const SelectRegion = ({ setOpenSelect }) => {
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  return (
    <div
      onClick={() => {
        setOpenSelect(true);
      }}
      className="flex-col region-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] pl-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div className="flex-row regular text-[#505050] text-[12px]">
        {translateFunction("Change From List")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] ">
        <TargetIcon className="&>path:fill" />

        <div
          className={`medium flex ${
            addressDetails.region ? "text-[#505050]" : "text-[#D3D3D3] "
          } text-[14px] ml-[8px]`}
        >
          {(addressDetails.region?.length > 0 && addressDetails.region) ??
            translateFunction("Province | District | Town | Street")}
        </div>
      </div>
    </div>
  );
};

const DetailsAddress = () => {
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  const dispatch = useDispatch();
  return (
    <div
      className="flex-col details-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div className="flex-row regular text-[#505050] text-[12px]">
        {translateFunction("Detailed Address & Note")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
        <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
          <textarea
            value={addressDetails.address_detail}
            onChange={(e) => {
              dispatch({
                type: "set-address-details",
                payload: { address_detail: e.target.value },
              });
            }}
            placeholder={translateFunction(
              "Write The Address Clearly, Including The Street Address, Building, Flat, Door, Unit."
            )}
            className="w-full pr-6  min-h-[38px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};

const AddressTitle = () => {
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  const dispatch = useDispatch();
  return (
    <div
      className="flex-col title-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div className="flex-row regular text-[#505050] text-[12px]">
        {translateFunction("Address Title")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
        <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
          <input
            value={addressDetails.address}
            onChange={(e) => {
              dispatch({
                type: "set-address-details",
                payload: { address: e.target.value },
              });
            }}
            placeholder={translateFunction("Ex: Home, My Office, 2 Home Ect.")}
            className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
const ContactInfo = () => {
  const user = useSelector((state: StateInterface) => state.auth.user);
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  const dispatch = useDispatch();
  // useEffect(() => {
  //   if (!addressDetails.id && user) {
  //     dispatch({
  //       type: "set-address-details",
  //       payload: {
  //         contact_info: {
  //           ...addressDetails.contact_info,
  //           contact_person_name: user?.name,
  //           name: user?.name,
  //         },
  //       },
  //     });
  //   }
  // }, [addressDetails?.id, user]);
  return (
    <div className="flex-col w-full mt-[30px] px-[12px] pb-[110px]">
      <div className="flex-row px-[12px] items-center">
        <ContactInfoIcon />
        <div className="flex ml-[6px] text-[#404040] text-[12px] medium">
          {translateFunction("Contact Info")}
        </div>
        <AddressInfo className="ml-[12px] cursor-pointer" />
      </div>
      <div
        className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div className="flex-row regular text-[#505050] text-[12px]">
          {translateFunction("Recipient Name")}
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
            <input
              value={addressDetails.contact_info.contact_person_name}
              onChange={(e) => {
                dispatch({
                  type: "set-address-details",
                  payload: {
                    contact_info: {
                      ...addressDetails.contact_info,
                      contact_person_name: e.target.value,
                    },
                  },
                });
              }}
              placeholder={translateFunction("Enter Full Recipient Name")}
              className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
            />
          </div>
        </div>
      </div>
      {/*  */}
      <div
        className="flex-col phone-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div className="flex-row regular text-[#505050] text-[12px]">
          {translateFunction("Contact Phone")}
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
            <input
              aria-autocomplete="both"
              aria-haspopup="false"
              type="number"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              inputMode="numeric"
              value={addressDetails.contact_info.phone}
              onChange={(e) => {
                dispatch({
                  type: "set-address-details",
                  payload: {
                    contact_info: {
                      ...addressDetails.contact_info,
                      phone: e.target.value,
                    },
                  },
                });
              }}
              placeholder={translateFunction("Enter Recipient Phone")}
              className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
            />
          </div>
        </div>
      </div>
      {/*  */}
      <div
        className="flex-col cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div className="flex-row regular text-[#505050] text-[12px]">
          {translateFunction("Alternative Phone")}
          <span className="text-[#D3D3D3] ml-[4px]">
            {translateFunction("(Optional)")}
          </span>
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
            <input
              aria-autocomplete="both"
              aria-haspopup="false"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              inputMode="numeric"
              type="number"
              value={addressDetails.contact_info.alternative_phone}
              onChange={(e) => {
                dispatch({
                  type: "set-address-details",
                  payload: {
                    contact_info: {
                      ...addressDetails.contact_info,
                      alternative_phone: e.target.value,
                    },
                  },
                });
              }}
              placeholder={translateFunction(
                "Enter Alternative Recipient Phone"
              )}
              className="w-full pr-6  min-h-[21px] h-auto bg-[transparent] text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export const AddAddressButtons = ({ valid, slidePrev }) => {
  const dispatch = useDispatch();
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  const shake = (v) => {
    document.querySelector(`.${v}`).scrollIntoView({ block: "end" });
    document.querySelector(`.${v}`).classList.add("shake-anim");
    setTimeout(() => {
      document.querySelector(`.${v}`).classList.remove("shake-anim");
    }, 1300);
  };
  const validate = () => {
    if (
      !addressDetails.location.latitude &&
      !addressDetails.location.longitude
    ) {
      shake("map-border");
    }
    if (addressDetails.address_detail?.length === 0) {
      shake("details-border");
    }
    if (addressDetails.address?.length === 0) {
      shake("title-border");
    }
    if (addressDetails.region?.length === 0) {
      shake("region-border");
    }
    if (addressDetails.contact_info?.contact_person_name?.length === 0) {
      shake("name-border");
    }
    if (addressDetails.contact_info?.phone?.length === 0) {
      shake("phone-border");
    }
  };
  const orderLoading = useSelector(
    (state: StateInterface) => state.cart.orderLoading
  );
  const { lang } = useParams();
  // @ts-ignore
  let country = lang.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0]?.name,
    iso: country,
  };
  return (
    <div
      style={{
        boxShadow: "0px -3px 20px #0000001a",
      }}
      className={`add-address-button ${
        orderLoading && "opacity-55"
      } absolute text-center  left-0 w-full h-[100px] bg-[#fff] px-[20px] pt-[12px]`}
    >
      <div
        onClick={() => {
          if (valid && !orderLoading) {
            if (addressDetails?.id) {
              order.UpdateAddressList({
                address: { ...addressDetails, Country: country },
                callback: () => {
                  slidePrev();
                },
              });
              dispatch({ type: "UPDATE-ADDRESS", payload: addressDetails });
            } else {
              order.AddAddressList({
                address: addressDetails,
                callback: () => {
                  slidePrev();
                },
              });
              dispatch({ type: "ADD-ADDRESS", payload: addressDetails });
            }

            return;
          }
          validate();
        }}
        className={`w-full text-center flex justify-center items-center h-[70px] ${
          valid ? "bg-[#346BFF]" : "bg-[#C4C2C2]"
        } text-[#FEFEFE] text-[18px] medium rounded-[20px]`}
      >
        {addressDetails?.id
          ? translateFunction("Edit & Save")
          : translateFunction("Add & Save")}
      </div>
    </div>
  );
};
