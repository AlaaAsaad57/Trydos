"use client";
import { getLocalizedCountryName } from "utils/countryData";
import { useEffect, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import Map from "./Map";
import { useParams } from "next/navigation";
import order from "services/order";
import { useAppStore } from "store";
import { FlagIcon, sanitizePhone } from "utils/tinyUtils";

import { pollinateInput } from "@/utils/tinyUtils";
import auth from "services/auth";

function AddAddressForm({
  setAddressDetails,
  slidePrev,
  setOpenSelect,
  activeIndex,
  isInSettings = false,
  userName = null,
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
    // let ipData: IpDataApi = await fetchData("http://ip-api.com/json");
    // @ts-ignore
    let UserCountries = countries.filter(
      // @ts-ignore

      (s) => s.iso.toLowerCase() === lang.split("-")[0].toLowerCase(),
    )[0];

    setCenter({
      lat: parseFloat(UserCountries?.latitude),
      lng: parseFloat(UserCountries?.longitude),
    });
  };
  const isValid = () => {
    let addressValid = false,
      valid = false,
      regionValid = false,
      usereValid = false;
    if (userName === "") {
      if (addressDetails?.user_name?.length > 0) usereValid = true;
      else usereValid = false;
    } else if (userName === null || userName === undefined) {
      usereValid = true;
    }

    if (
      (addressDetails?.contact_info?.contact_person_name?.length > 0 ||
        // @ts-ignore
        addressDetails?.contact_info?.name?.length > 0) &&
      addressDetails?.contact_info?.phone?.length > 5
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
      addressValid = true;
    } else {
      addressValid = false;
      return;
    }
    if (addressDetails.region?.length > 0) {
      regionValid = true;
    } else {
      regionValid = false;
      return;
    }
    return valid && regionValid && addressValid && usereValid;
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
        className={`${orderLoading ? "opacity-50 scale-[.99]" : ""}${
          isInSettings ? "max-h-[calc(100vh-200px)]" : "max-h-full"
        } flex-col h-full  overflow-auto w-full relative pb-[160px] add-address-form-container`}
        data-pw="add-address-form" // Added data-pw
      >
        <div
          className="bg-[#F8F8F8] min-h-[50px] flex-row items-center pl-[24px] pr-[20px] "
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
          data-pw="address-info-header" // Added data-pw
        >
          <svg
            id="Group_3387"
            data-name="Group 3387"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            data-pw="info-icon" // Added data-pw
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
            data-pw="info-text"
          >
            {translateFunction(
              "Entering The Information Below Clearly And Completely Will Ensure That Your Order Arrives Without Problems And Faster.",
            )}
          </div>
        </div>

        {activeIndex && countries.length > 0 && (
          <Map
            expanded={expanded}
            setExpanded={(e) => {
              setExpanded(e);
            }}
            center={
              (addressDetails.location.latitude && {
                lat: addressDetails.location.latitude,
                lng: addressDetails.location.longitude,
              }) ||
              center
            }
            setAddressDetails={(e) => setAddressDetails(e)}
            data-pw="map-component" // Added data-pw
          />
        )}
        <AddressSection
          setOpenSelect={() => {
            setOpenSelect();
          }}
        />
        <ContactInfo userName={userName} />
      </div>
      {!expanded && (
        <AddAddressButtons
          isInSettings={isInSettings}
          valid={isValid()}
          userName={userName}
          slidePrev={(id) => {
            slidePrev(id);
          }}
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
      data-pw="address-section"
    >
      <div className="flex-row px-[12px] items-center">
        <img src="/icons/AddressIcon.svg" data-pw="address-icon" />
        <div
          className="flex mx-[6px] text-[#404040] text-[12px] medium"
          data-pw="address-info-text"
        >
          {translateFunction("Address Info")}
        </div>
        <img
          src="/icons/AddressInfo.svg"
          className="ml-[12px] cursor-pointer"
          data-pw="address-info-icon"
        />
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
  const { setAddressDetails } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [countryIso, language] = lang.split("-");
  const country = {
    name: getLocalizedCountryName(countryIso, language),
    iso: countryIso,
  };

  useEffect(() => {
    setAddressDetails({ Country: { name: country?.name, code: country.iso } });
  }, []);
  return (
    <div
      data-pw="country-label" // Added data-pw
      className="flex-col rounded-[15px] w-full mt-[12px] py-[7px] pl-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-pw="country-region-div"
      >
        {translateFunction("Country | Region")}
      </div>
      <div className="flex-row items-center mt-[3px] ">
        <span
          className="h-[20px] rounded-[5px] w-[30px]"
          data-pw="country-flag"
        >
          <span className="w-[30px] h-[20px]">
            <FlagIcon iso={country.iso} />
          </span>
        </span>
        <div
          className="medium flex text-[#1D1D1D] text-[14px] ml-[8px]"
          data-pw="country-name"
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
      data-pw="Change-From-List"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-pw="change-list-statement"
      >
        {translateFunction("Change From List")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] ">
        <img src="/icons/Target.svg" data-pw="point-icon" />

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
      data-pw="Detailed-Address-field"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-pw="Detailed-Address-statement"
      >
        {translateFunction("Detailed Address & Note")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
        <div
          className="medium flex text-[#D3D3D3] text-[14px] w-full"
          data-pw="Detailed-Address-Note"
        >
          <textarea
            data-pw="text-area-placeholder"
            value={addressDetails.address_detail}
            onChange={(e) => {
              setAddressDetails({ address_detail: e.target.value });
            }}
            placeholder={translateFunction(
              "Write The Address Clearly, Including The Street Address, Building, Flat, Door, Unit.",
            )}
            className="w-full pr-6  min-h-[38px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
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
      data-pw="address-title" // Added data-pw
      className="flex-col title-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
      style={{
        border: "#d3d3d3a3 1px solid",
      }}
    >
      <div
        className="flex-row regular text-[#505050] text-[12px]"
        data-pw="add-Address-statement"
      >
        {translateFunction("Address Title")}
      </div>
      <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
        <div
          className="medium flex text-[#D3D3D3] text-[14px] w-full"
          data-pw="Address-Title"
        >
          <input
            data-pw="add-address-input"
            value={addressDetails.address}
            onChange={(e) => {
              setAddressDetails({ address: pollinateInput(e.target.value) });
            }}
            placeholder={translateFunction("Ex: Home, My Office, 2 Home Ect.")}
            className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
          />
        </div>
      </div>
    </div>
  );
};
const ContactInfo = ({ userName = null }) => {
  const { setAddressDetails, addressDetails } = useAppStore();
  useEffect(() => {
    if (userName === "") {
      setAddressDetails({ ...addressDetails, user_name: "" });
    }
  }, []);

  return (
    <div
      className="flex-col w-full mt-[30px] px-[12px] pb-[110px]"
      data-pw="container-name-phone"
    >
      <div className="flex-row px-[12px] items-center">
        <img src="/icons/ContactInfoIcon.svg" data-pw="contact-info-icon" />
        <div
          className="flex mx-[6px] text-[#404040] text-[12px] medium"
          data-pw="contact-info-text"
        >
          {translateFunction("Contact Info")}
        </div>
        <img
          src="/icons/AddressInfo.svg"
          className="ml-[12px] cursor-pointer"
          data-pw="Address-info-icon"
        />
      </div>
      {userName !== null && userName !== undefined && (
        <div
          className="flex-col username-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-pw="name-container"
          style={{
            border: "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-pw="recipient-name-statement"
          >
            {translateFunction("User Name")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-pw="Recipient-Name"
            >
              <input
                data-pw="user-name-input"
                value={addressDetails?.user_name}
                onChange={(e) => {
                  const sanitized = pollinateInput(e.target.value);
                  setAddressDetails({
                    ...addressDetails,
                    user_name: sanitized,
                  });
                }}
                placeholder={translateFunction("Enter Full User Name")}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
        </div>
      )}
      <div
        className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        data-pw="name-container"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div
          className="flex-row regular text-[#505050] text-[12px]"
          data-pw="recipient-name-statement"
        >
          {translateFunction("Recipient Name")}
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div
            className="medium flex text-[#D3D3D3] text-[14px] w-full"
            data-pw="Recipient-Name"
          >
            <input
              data-pw="recipient-name-input"
              value={
                addressDetails?.contact_info?.contact_person_name ||
                // @ts-ignore
                addressDetails?.contact_info?.name
              }
              onChange={(e) => {
                const sanitized = pollinateInput(e.target.value);
                setAddressDetails({
                  contact_info: {
                    ...addressDetails.contact_info,
                    contact_person_name: sanitized,
                    name: sanitized,
                  },
                });
              }}
              placeholder={translateFunction("Enter Full Recipient Name")}
              className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
            />
          </div>
        </div>
      </div>
      {/*  */}
      <div
        className="flex-col phone-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        data-pw="phone-container"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div
          className="flex-row regular text-[#505050] text-[12px]"
          data-pw="phone-statement"
        >
          {translateFunction("Contact Phone")}
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div
            className="medium flex text-[#D3D3D3] text-[14px] w-full"
            data-pw="Contact-Phone"
          >
            <input
              data-pw="Contact-Phone-input"
              aria-autocomplete="both"
              aria-haspopup="false"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              inputMode="tel"
              type="text"
              value={addressDetails?.contact_info?.phone}
              onChange={(e) => {
                const sanitized = sanitizePhone(e.target.value);
                setAddressDetails({
                  contact_info: {
                    ...addressDetails.contact_info,
                    phone: sanitized,
                  },
                });
              }}
              placeholder={translateFunction("Enter Recipient Phone")}
              className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
            />
          </div>
        </div>
      </div>
      {/*  */}
      <div
        className="flex-col cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
        data-pw="altarnative-Phone-container"
        style={{
          border: "#d3d3d3a3 1px solid",
        }}
      >
        <div
          className="flex-row regular text-[#505050] text-[12px]"
          data-pw="altarnative-Phone-statement"
        >
          {translateFunction("Alternative Phone")}
          <span
            className="text-[#D3D3D3] ml-[4px]"
            data-pw="optional-statement"
          >
            {translateFunction("(Optional)")}
          </span>
        </div>
        <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
          <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
            <input
              data-pw="optional-input"
              aria-autocomplete="both"
              aria-haspopup="false"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              inputMode="tel"
              value={addressDetails?.contact_info?.alternative_phone}
              onChange={(e) => {
                const sanitized = sanitizePhone(e.target.value);
                setAddressDetails({
                  contact_info: {
                    ...addressDetails.contact_info,
                    alternative_phone: sanitized,
                  },
                });
              }}
              placeholder={translateFunction(
                "Enter Alternative Recipient Phone",
              )}
              className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
const AddAddressButtons = ({
  valid,
  slidePrev,
  isInSettings,
  userName = null,
}) => {
  const {
    addAddress,
    updateAddress,
    addressDetails,
    orderLoading,
    setOrderLoading,
  } = useAppStore();

  const shake = (v) => {
    if (document.querySelector(`.${v}`)) {
      let index = document.querySelectorAll(`.${v}`).length;

      document
        .querySelectorAll(`.${v}`)
        ?.[index - 1]?.scrollIntoView({ block: "end" });
      document
        .querySelectorAll(`.${v}`)
        ?.[index - 1]?.classList.add("shake-anim");
      setTimeout(() => {
        document
          .querySelectorAll(`.${v}`)
          ?.[index - 1]?.classList.remove("shake-anim");
      }, 1300);
    }
    return;
  };
  const validate = () => {
    if (userName === "" && addressDetails.user_name?.length === 0)
      return shake("username-border");
    if (addressDetails.address_detail?.length === 0) {
      return shake("details-border");
    }
    if (addressDetails.address?.length === 0) {
      return shake("title-border");
    }
    if (addressDetails.region?.length === 0) {
      return shake("region-border");
    }
    if (addressDetails.contact_info?.contact_person_name?.length === 0) {
      return shake("name-border");
    }
    if (addressDetails.contact_info?.phone?.length < 5) {
      return shake("phone-border");
    }
  };

  const { lang } = useParams();
  // @ts-ignore
  const [countryIso, language] = lang.split("-");
  const country = {
    name: getLocalizedCountryName(countryIso, language),
    code: countryIso,
  };
  const handleAddressAction = async () => {
    try {
      if (addressDetails?.id) {
        await order.UpdateAddressList({
          address: { ...addressDetails, Country: country },
          callback: () => {
            slidePrev();
          },
        });
        updateAddress(addressDetails);
      } else {
        await order.AddAddressList({
          address: addressDetails,
          callback: (id) => {
            slidePrev(id);
          },
        });
        addAddress();
      }
      if (addressDetails.user_name && userName === "") {
        auth.UpdateName(addressDetails.user_name);
      }
    } catch (error) {
      setOrderLoading(false);
      LogError({ error, scenario: "Add Address", addressDetails });
    }
  };
  return (
    <div
      style={{
        boxShadow: "0px -3px 20px #0000001a",
      }}
      className={`${"add-address-button"} ${
        orderLoading && "opacity-55"
      } absolute text-center  left-0 w-full h-[100px] bg-white px-[20px] pt-[12px]`}
      data-pw="add-address-buttons-container" // Added data-pw
    >
      <div
        onClick={() => {
          if (valid && !orderLoading) {
            // @ts-ignore
            handleAddressAction();
            return;
          }
          validate();
        }}
        className={`w-full text-center flex justify-center items-center h-[70px] ${
          valid ? "bg-[#346BFF]" : "bg-[#C4C2C2]"
        } text-[#FEFEFE] text-[18px] medium rounded-[20px]`}
        data-pw="AddSaveButton"
      >
        {/* @ts-ignore */}
        {addressDetails?.id
          ? translateFunction("Edit & Save")
          : translateFunction("Add & Save")}
      </div>
    </div>
  );
};
