"use client";
import { allCountries } from "country-telephone-data";
import React, { useEffect, useState } from "react";
import { translateFunction } from "utils/functions";
import Map from "./Map";
import SyFlage from "public/svg/sy.svg";
import { useParams } from "next/navigation";
import Addressicon from "public/svg/cart/AddressIcon.svg";
import AddressInfo from "public/svg/cart/AddressInfo.svg";
import TargetIcon from "public/svg/cart/Target.svg";
import ContactInfoIcon from "public/svg/cart/ContactInfoIcon.svg";

import order from "services/order";
import { useAppStore } from "store";
import { FlagIcon } from "utils/tinyUtils";

function AddAddressForm({
  setAddressDetails,
  slidePrev,
  setOpenSelect,
  activeIndex,
}) {
  const { setMapCenter, center, addressDetails, countries, orderLoading } =
    useAppStore();
  const { lang } = useParams();
  const [expanded, setExpanded] = useState(false);

  const setCenter = (e) => {
    setMapCenter(e);
  };

  const getCenter = async () => {
    // to do
    // let ipData: IpDataApi = await axios.get("http://ip-api.com/json");
    // @ts-ignore
    let UserCountries = countries.filter(
      // @ts-ignore

      (s) => s.iso.toLowerCase() === lang.split("-")[0].toLowerCase()
    )[0];

    setCenter({
      lat: parseFloat(UserCountries?.latitude),
      lng: parseFloat(UserCountries?.longitude),
    });
  };
  const isValid = () => {
    let valid = false;

    if (
      (addressDetails.contact_info.contact_person_name?.length > 0 ||
        // @ts-ignore
        addressDetails.contact_info.name?.length > 0) &&
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

  useEffect(() => {
    if (countries.length > 0) {
      getCenter();
    } else {
    }
  }, [countries]);
  return (
    <>
      <div
        className={`${
          orderLoading ? "opacity-50 scale-[.99]" : ""
        } flex-col h-full max-h-full overflow-auto w-full relative pb-[160px]`}
        data-cy="add-address-form" // Added data-cy
      >
        <div
          className="bg-[#F8F8F8] min-h-[50px] flex-row items-center pl-[24px] pr-[20px] "
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
          data-cy="address-info-header" // Added data-cy
        >
          <svg
            id="Group_3387"
            data-name="Group 3387"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            data-cy="info-icon" // Added data-cy
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
          <div
            className="regular text-[10px] ml-[8px] text-[#8D8D8D]"
            data-cy="info-text"
          >
            {translateFunction(
              "Entering The Information Below Clearly And Completely Will Ensure That Your Order Arrives Without Problems And Faster."
            )}
          </div>
        </div>

        {activeIndex && countries.length > 0 && (
          <Map
            expanded={expanded}
            setExpanded={(e) => setExpanded(e)}
            center={
              (addressDetails.location.latitude && {
                lat: addressDetails.location.latitude,
                lng: addressDetails.location.longitude,
              }) ||
              center
            }
            setAddressDetails={(e) => setAddressDetails(e)}
            data-cy="map-component" // Added data-cy
          />
        )}
        <AddressSection
          setOpenSelect={() => {
            setOpenSelect();
          }}
        />
        <ContactInfo data-cy="contact-info" />
      </div>
      {!expanded && (
        <AddAddressButtons
          valid={isValid()}
          slidePrev={() => {
            slidePrev();
          }}
          data-cy="add-address-buttons" // Added data-cy
        />
      )}
    </>
  );
}

export default AddAddressForm;

const AddressSection = ({ setOpenSelect }) => {
  return (
    <div
      className="flex-col w-full mt-[30px] px-[12px]"
      data-cy="address-section"
    >
      <div className="flex-row px-[12px] items-center">
        <Addressicon data-cy="address-icon" />
        <div
          className="flex ml-[6px] text-[#404040] text-[12px] medium"
          data-cy="address-info-text"
        >
          {translateFunction("Address Info")}
        </div>
        <AddressInfo
          className="ml-[12px] cursor-pointer"
          data-cy="address-info-icon"
        />
      </div>
      <CountryLabel />
      <SelectRegion
        data-cy="select-region"
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
  const { setAddressDetails } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  let country = lang.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0]?.name,
    iso: country,
  };

  useEffect(() => {
    setAddressDetails({ Country: { name: country?.name, code: country.iso } });
  }, []);
  return (
    <div
      data-cy="country-label" // Added data-cy
      className="flex-col rounded-[15px] w-full mt-[12px] py-[7px] pl-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-cy="country-region-div"
      >
        {translateFunction("Country | Region")}
      </div>
      <div className="flex-row items-center mt-[3px] ">
        <span
          className="h-[20px] rounded-[5px] w-[30px]"
          data-cy="country-flag"
        >
          <span className="w-[30px] h-[20px]">
            <FlagIcon iso={country.iso} />
          </span>
        </span>
        <div
          className="medium flex text-[#1D1D1D] text-[14px] ml-[8px]"
          data-cy="country-name"
        >
          {country?.name}
        </div>
      </div>
    </div>
  );
};

const SelectRegion = ({ setOpenSelect }) => {
  const { addressDetails } = useAppStore();

  return (
    <div
      onClick={() => {
        setOpenSelect(true);
      }}
      className="flex-col region-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] pl-[12px] items-start justify-center"
      data-cy="Change-From-List"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-cy="change-list-statement"
      >
        {translateFunction("Change From List")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] ">
        <TargetIcon className="&>path:fill" data-cy="point-icon" />

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
  const { setAddressDetails, addressDetails } = useAppStore();

  return (
    <div
      className="flex-col details-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
      data-cy="Detailed-Address-field"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-cy="Detailed-Address-statement"
      >
        {translateFunction("Detailed Address & Note")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
        <div
          className="medium flex text-[#D3D3D3] text-[14px] w-full"
          data-cy="Detailed-Address-Note"
        >
          <textarea
            data-cy="text-area-placeholder"
            value={addressDetails.address_detail}
            onChange={(e) => {
              setAddressDetails({ address_detail: e.target.value });
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
  const { setAddressDetails, addressDetails } = useAppStore();
  return (
    <div
      data-cy="address-title" // Added data-cy
      className="flex-col title-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-cy="add-Address-statement"
      >
        {translateFunction("Address Title")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
        <div
          className="medium flex text-[#D3D3D3] text-[14px] w-full"
          data-cy="Address-Title"
        >
          <input
            data-cy="add-address-input"
            value={addressDetails.address}
            onChange={(e) => {
              setAddressDetails({ address: e.target.value });
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
  const { setAddressDetails, addressDetails } = useAppStore();

  return (
    <div
      className="flex-col w-full mt-[30px] px-[12px] pb-[110px]"
      data-cy="container-name-phone"
    >
      <div className="flex-row px-[12px] items-center">
        <ContactInfoIcon data-cy="contact-info-icon" />
        <div
          className="flex ml-[6px] text-[#404040] text-[12px] medium"
          data-cy="contact-info-text"
        >
          {translateFunction("Contact Info")}
        </div>
        <AddressInfo
          className="ml-[12px] cursor-pointer"
          data-cy="Address-info-icon"
        />
      </div>
      <div
        className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        data-cy="name-container"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div
          className="flex-row regular text-[#505050] text-[12px]"
          data-cy="recipient-name-statement"
        >
          {translateFunction("Recipient Name")}
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div
            className="medium flex text-[#D3D3D3] text-[14px] w-full"
            data-cy="Recipient-Name"
          >
            <input
              data-cy="recipient-name-input"
              value={
                addressDetails.contact_info.contact_person_name ||
                // @ts-ignore
                addressDetails.contact_info.name
              }
              onChange={(e) => {
                setAddressDetails({
                  contact_info: {
                    ...addressDetails.contact_info,
                    contact_person_name: e.target.value,
                    name: e.target.value,
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
        data-cy="phone-container"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div
          className="flex-row regular text-[#505050] text-[12px]"
          data-cy="phone-statement"
        >
          {translateFunction("Contact Phone")}
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div
            className="medium flex text-[#D3D3D3] text-[14px] w-full"
            data-cy="Contact-Phone"
          >
            <input
              data-cy="Contact-Phone-input"
              aria-autocomplete="both"
              aria-haspopup="false"
              type="number"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              pattern="[0-9]*"
              autoCorrect="off"
              inputMode="numeric"
              value={addressDetails.contact_info.phone}
              onChange={(e) => {
                setAddressDetails({
                  contact_info: {
                    ...addressDetails.contact_info,
                    phone: e.target.value,
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
        data-cy="altarnative-Phone-container"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div
          className="flex-row regular text-[#505050] text-[12px]"
          data-cy="altarnative-Phone-statement"
        >
          {translateFunction("Alternative Phone")}
          <span
            className="text-[#D3D3D3] ml-[4px]"
            data-cy="optional-statement"
          >
            {translateFunction("(Optional)")}
          </span>
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
            <input
              data-cy="optional-input"
              aria-autocomplete="both"
              aria-haspopup="false"
              spellCheck="false"
              autoCapitalize="off"
              pattern="[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              inputMode="numeric"
              type="number"
              value={addressDetails.contact_info.alternative_phone}
              onChange={(e) => {
                setAddressDetails({
                  contact_info: {
                    ...addressDetails.contact_info,
                    alternative_phone: e.target.value,
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
  const { addAddress, updateAddress, addressDetails, orderLoading } =
    useAppStore();

  const shake = (v) => {
    if (document.querySelector(`.${v}`)) {
      document.querySelector(`.${v}`)?.scrollIntoView({ block: "end" });
      document.querySelector(`.${v}`)?.classList.add("shake-anim");
      setTimeout(() => {
        document.querySelector(`.${v}`)?.classList.remove("shake-anim");
      }, 1300);
    }
  };
  const validate = () => {
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

  const { lang } = useParams();
  // @ts-ignore
  let country = lang.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0]?.name,
    code: country,
  };
  return (
    <div
      style={{
        boxShadow: "0px -3px 20px #0000001a",
      }}
      className={`add-address-button ${
        orderLoading && "opacity-55"
      } absolute text-center  left-0 w-full h-[100px] bg-[#fff] px-[20px] pt-[12px]`}
      data-cy="add-address-buttons-container" // Added data-cy
    >
      <div
        onClick={() => {
          if (valid && !orderLoading) {
            // @ts-ignore
            if (addressDetails?.id) {
              order.UpdateAddressList({
                address: { ...addressDetails, Country: country },
                callback: () => {
                  slidePrev();
                },
              });
              updateAddress(addressDetails);
            } else {
              order.AddAddressList({
                address: addressDetails,
                callback: () => {
                  slidePrev();
                },
              });
              addAddress();
            }

            return;
          }
          validate();
        }}
        className={`w-full text-center flex justify-center items-center h-[70px] ${
          valid ? "bg-[#346BFF]" : "bg-[#C4C2C2]"
        } text-[#FEFEFE] text-[18px] medium rounded-[20px]`}
        data-cy="AddSaveButton"
      >
        {/* @ts-ignore */}
        {addressDetails?.id
          ? translateFunction("Edit & Save")
          : translateFunction("Add & Save")}
      </div>
    </div>
  );
};
