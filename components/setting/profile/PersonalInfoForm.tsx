"use client";
import { useEffect, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import { isGuestName } from "utils/tinyUtils";
import { useAppStore } from "store";

import auth from "services/auth";

import { pollinateInput } from "utils/tinyUtils";
import BackBar from "../BackBar";
import { usePhoneInput } from "utils/usePhoneInput";
import { allCountries } from "country-telephone-data";
import AuthOverlay from "components/Login/Enhanced/AuthOverlay";
import VerifyPhoneFlow from "components/Login/Enhanced/VerifyPhoneFlow";

// Validation helpers
const isValidEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional if user starts typing we validate
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const getCountry = (val: string) => {
  const matches = allCountries.filter((countryItem) =>
    val?.startsWith(countryItem.dialCode),
  );
  return matches.length > 0 ? matches[0] : allCountries[0];
};

// Phone numbers are compared with the leading "+" stripped so that "+9639…"
// and "9639…" count as the same value (used for both phones).
const normalizePhone = (phone: unknown): string =>
  String(phone ?? "").replace(/^\+/, "");

function PersonalInfoForm({ initialData, isRtl, language, local }) {
  // Per-field selectors: a whole-store destructure would re-render this form
  // on any unrelated store write. `loginOpen` / `shouldAuthinticated` are read
  // so this settings overlay can stand down when one of the global auth
  // surfaces is active (see isPhoneShouldChange below).
  const clientUser = useAppStore((s) => s.userProfile);
  const setLoginOpen = useAppStore((s) => s.setLoginOpen);
  const loginOpen = useAppStore((s) => s.loginOpen);
  const shouldAuthinticated = useAppStore((s) => s.shouldAuthinticated);
  const user = clientUser || initialData;

  const isNotLoggedIn = !user || 
    user.phone === "0" || 
    user.phone === 0 || 
    user.phone === null || 
    user.phone === undefined || 
    String(user.phone).trim() === "" ||
    String(user.phone).length < 3;

  const phoneInput = usePhoneInput({
    initial: user?.phone === "0" ? "" : user?.phone || "",
    getCountry: getCountry,
  });

  const alternativePhoneInput = usePhoneInput({
    initial:
      user?.alternative_phone === 0
        ? ""
        : user?.alternative_phone || "",
    getCountry: getCountry,
  });

  const [userProfileData, setUserProfileData] = useState({
    name: isGuestName(user?.name) ? "" : (user?.name || ""),
    email: user?.email?.includes("@guest.com") ? "" : user?.email,
    gender: user?.gender?.value || user?.gender,
    image: user?.image,
  });

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
  });
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(false);

  // Original, server-provided values — normalized the same way the form fields
  // are seeded — so we can diff against them and send ONLY what the user changed.
  const baseline = {
    name: isGuestName(initialData?.name) ? "" : initialData?.name || "",
    email: initialData?.email?.includes("@guest.com")
      ? ""
      : initialData?.email || "",
    gender: initialData?.gender?.value || initialData?.gender,
    phone: initialData?.phone === "0" ? "" : initialData?.phone || "",
    alternative_phone:
      initialData?.alternative_phone === 0
        ? ""
        : initialData?.alternative_phone || "",
  };

  const isPhoneEdited = () =>
    normalizePhone(phoneInput.modifiedValue) !== normalizePhone(baseline.phone);

  // Keep only the fields the user actually changed. Sending unchanged fields
  // (e.g. an empty email or alternative phone) makes the backend validate — and
  // reject — values the user never touched. Image is never editable here, so it
  // is never sent.
  const buildChangedFields = (payload) => {
    const changed: any = {};
    if ((payload.name || "") !== baseline.name) changed.name = payload.name;
    if ((payload.email || "") !== baseline.email) changed.email = payload.email;
    if (payload.gender !== baseline.gender) changed.gender = payload.gender;
    if (isPhoneEdited()) changed.phone = payload.phone;
    if (
      normalizePhone(payload.alternative_phone) !==
      normalizePhone(baseline.alternative_phone)
    )
      changed.alternative_phone = payload.alternative_phone;
    if (payload.id_token) changed.id_token = payload.id_token;
    return changed;
  };

  const updateUserProfile = async (payload) => {
    try {
      setLoading(true);
      await auth.UpdateProfile(buildChangedFields(payload), initialData);
      setLoading(false);
      window.location.href = `/${local}/settings/profile`;
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In updateUserProfile in PersonalInfoForm",
      });
      setLoading(false);
      // Reset to initial values on error
      phoneInput.setValue(baseline.phone);
      alternativePhoneInput.setValue(baseline.alternative_phone);
      setUserProfileData({
        name: baseline.name,
        email: baseline.email,
        gender: baseline.gender,
        image: initialData?.image,
      });
    }
  };

  const [isPhoneShouldChange, setIsPhoneShouldChange] = useState(false);

  // The overlay below stands down while a global auth surface is active (see
  // the comment near it), but that alone leaves `isPhoneShouldChange` true.
  // Left alone, the overlay would pop back the moment the global surface
  // clears — mid-flow state gone, at a moment the user never asked for it.
  // Reset the flag as soon as the gate closes it, so it stays closed after.
  useEffect(() => {
    if (loginOpen || shouldAuthinticated) {
      setIsPhoneShouldChange(false);
    }
  }, [loginOpen, shouldAuthinticated]);

  const updateField = (field: string, value: any) => {
    setUserProfileData({ ...userProfileData, [field]: value });
    if (showValidation && validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const validateFunction = () => {
    const errors = {
      name: "",
      phone: "",
      email: "",
      gender: "",
    };

    if (!userProfileData.name?.trim()) {
      errors.name = translateFunction("Full name is required", language);
    }
    if (userProfileData.name?.trim()?.length < 8) {
      errors.name = translateFunction(
        "Name Should be atleast 8 characters",
        language,
      );
    }

    if (!phoneInput.value?.trim()) {
      errors.phone = translateFunction("Phone number is required", language);
    } else if (!phoneInput.valid) {
      errors.phone = translateFunction(
        "Please enter a valid phone number",
        language,
      );
    }

    if (userProfileData.email && !isValidEmail(userProfileData.email)) {
      errors.email = translateFunction(
        "Please enter a valid email address",
        language,
      );
    }

    if (!userProfileData.gender) {
      errors.gender = translateFunction("Please select your gender", language);
    }

    setValidationErrors(errors);
    setShowValidation(true);

    return !errors.name && !errors.phone && !errors.email && !errors.gender;
  };

  const handleSave = () => {
    if (isNotLoggedIn) {
      setLoginOpen(true);
      return;
    }
    if (!validateFunction()) return;

    const payload = {
      ...userProfileData,
      phone: phoneInput.modifiedValue,
      alternative_phone: alternativePhoneInput.modifiedValue || "",
    };

    if (isPhoneEdited()) {
      setIsPhoneShouldChange(true);
    } else {
      updateUserProfile(payload);
    }
  };

  const handleFormClick = (e: React.MouseEvent) => {
    if (isNotLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      setLoginOpen(true);
    }
  };

  return (
    <div
      style={{
        direction: isRtl ? "rtl" : "ltr",
      }}
      onClickCapture={handleFormClick}
      className={`flex-col setting-screen relative flex w-full ${
        loading ? "opacity-50 scale-95" : ""
      } ${isNotLoggedIn ? "opacity-65" : ""}`}
      key="personal-info-setting-page"
    >
      {/* AppScaler (the overlay's scaled canvas) is single-instance-only —
          it hardcodes #app-outer/#master-canvas and :root vars, so a second
          mounted instance corrupts both. The global auth surface wins:
          if the token just died (session expired / re-verify needed), the
          phone change can't complete anyway, so this overlay stands down. */}
      {isPhoneShouldChange && !loginOpen && !shouldAuthinticated && (
        <AuthOverlay>
          <VerifyPhoneFlow
            initialPhone={phoneInput.value}
            phoneLocked
            // A NEW number the shopper just typed — the screens say "Change
            // Your Number !", not "Verify Your Number !".
            authType="changePhone"
            // A NEW number: verify it against the phone-update endpoint, which
            // returns the id_token the profile save must carry.
            verify={(code, verificationId) =>
              auth.VerifyOtpForUpdatePhone(code, verificationId)
            }
            onSuccess={(idToken) => {
              updateUserProfile({
                ...userProfileData,
                phone: phoneInput.modifiedValue?.includes("+")
                  ? phoneInput.modifiedValue
                  : `+${phoneInput.modifiedValue}`,
                alternative_phone: alternativePhoneInput.modifiedValue || "",
                id_token: idToken,
              });
              setIsPhoneShouldChange(false);
            }}
            onClose={() => setIsPhoneShouldChange(false)}
            lang={language}
          />
        </AuthOverlay>
      )}
      <BackBar
        name={translateFunction("Profile | Personal Info", language)}
        isRtl={isRtl}
        local={local}
        preivous_page={`/${local}/settings/profile`}
        Save={handleSave}
        DataCy="personal-info-save-button"
      />
      <div className="flex-row justify-center mt-[12px] w-full">
        <div
          className="bg-[#F8F8F8] min-h-[50px] gap-[12px] w-full flex-row items-center pl-[24px] pr-[20px] "
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

          <div className="regular text-[10px]  text-[#8D8D8D]">
            {translateFunction(
              "Entering The Information Below Clearly And Completely Will Ensure That Your Order Arrives Without Problems And Faster.",
            )}
          </div>
        </div>
      </div>
      <div
        className="flex-col w-full mt-[30px] px-[12px] pb-[110px]"
        data-cy="container-name-phone"
      >
        <div className="flex-row px-[12px] items-center">
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
                  id="Rectangle_4612"
                  data-name="Rectangle 4612"
                  width="15"
                  height="15"
                  fill="none"
                />
              </clipPath>
            </defs>
            <g
              id="Mask_Group_732"
              data-name="Mask Group 732"
              clipPath="url(#clipPath)"
            >
              <g id="Outline" transform="translate(1.372)">
                <g id="Group_13672" data-name="Group 13672">
                  <path
                    id="Path_23090"
                    data-name="Path 23090"
                    d="M10.132.469A3.088,3.088,0,1,1,7.048,3.557,3.089,3.089,0,0,1,10.132.469m0-.469a3.557,3.557,0,1,0,3.552,3.557A3.555,3.555,0,0,0,10.132,0Z"
                    transform="translate(-4.004)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_23091"
                    data-name="Path 23091"
                    d="M10.925,14.595c.172,0,3.149.107,3.149,2.906V20.18H2.756V17.5c0-2.823,3.022-2.9,3.144-2.906Zm0-.469H5.9s-3.613.041-3.613,3.375v3.15H14.542V17.5c0-3.314-3.613-3.375-3.613-3.375Zm3.613,6.523h0Z"
                    transform="translate(-2.287 -5.65)"
                    fill="#1d1d1d"
                  />
                </g>
              </g>
            </g>
          </svg>

          <div
            className="flex mx-[6px] text-[#404040] text-[12px] medium"
            data-cy="contact-info-text"
          >
            {translateFunction("Full Name", language)}
          </div>
          <img
            src="/icons/AddressInfo.svg"
            className="ml-[12px] cursor-pointer w-[15px] h-[15px]"
          />
        </div>
        <div
          className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="name-container"
          style={{
            border:
              showValidation && validationErrors.name
                ? "#ff0000a3 1px solid"
                : "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="recipient-name-statement"
          >
            {translateFunction("Recipient Name", language)}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-cy="Recipient-Name"
            >
              <input
                value={userProfileData?.name}
                onChange={(e) =>
                  updateField("name", pollinateInput(e.target.value))
                }
                data-cy="personal-info-recipient-name-input"
                placeholder={translateFunction("Enter Full Name", language)}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
          {showValidation && validationErrors.name && (
            <div className="text-red-500 text-[10px] mt-1 px-2">
              {validationErrors.name}
            </div>
          )}
        </div>
        {/*  */}
        <div
          className="flex-col phone-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="phone-container"
          style={{
            border:
              showValidation && validationErrors.phone
                ? "#ff0000a3 1px solid"
                : "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="phone-statement"
          >
            {translateFunction("Phone", language)}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-cy="Contact-Phone"
            >
              <input
                data-cy="personal-info-phone-number-input"
                type="tel"
                value={phoneInput.value}
                onChange={(e) => {
                  phoneInput.setValue(e.target.value);
                  if (showValidation && validationErrors.phone) {
                    setValidationErrors({ ...validationErrors, phone: "" });
                  }
                }}
                inputMode="tel"
                autoComplete="tel"
                placeholder={translateFunction("Enter Phone", language)}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
          {showValidation && validationErrors.phone && (
            <div className="text-red-500 text-[10px] mt-1 px-2">
              {validationErrors.phone}
            </div>
          )}
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
            {translateFunction("Alternative Phone", language)}
            <span
              className="text-[#D3D3D3] ml-[4px]"
              data-cy="optional-statement"
            >
              {translateFunction("(Optional)", language)}
            </span>
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
              <input
                data-cy="personal-info-alternative-phone-number-input"
                type="tel"
                value={alternativePhoneInput.value}
                onChange={(e) => alternativePhoneInput.setValue(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder={translateFunction(
                  "Enter Alternative Phone",
                  language,
                )}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
        </div>
        <div
          className="flex-col phone-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          data-cy="phone-container"
          style={{
            border:
              showValidation && validationErrors.email
                ? "#ff0000a3 1px solid"
                : "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="phone-statement"
          >
            {translateFunction("Email", language)}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div
              className="medium flex text-[#D3D3D3] text-[14px] w-full"
              data-cy="Contact-Phone"
            >
              <input
                data-cy="personal-info-Contact-email-input"
                type="email"
                value={userProfileData?.email}
                onChange={(e) =>
                  updateField("email", pollinateInput(e.target.value))
                }
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                placeholder={translateFunction("Enter Email", language)}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
          {showValidation && validationErrors.email && (
            <div className="text-red-500 text-[10px] mt-1 px-2">
              {validationErrors.email}
            </div>
          )}
        </div>
        <div
          className="flex-col phone-border h-[85px] cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          style={{
            border:
              showValidation && validationErrors.gender
                ? "#ff0000a3 1px solid"
                : "#d3d3d3a3 1px solid",
          }}
        >
          <div
            className="flex-row regular text-[#505050] text-[12px]"
            data-cy="phone-statement"
          >
            {translateFunction("Gender", language)}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div className="medium flex text-[#D3D3D3] text-[14px] w-full h-[50px]">
              <div
                onClick={() => updateField("gender", 1)}
                className={`flex ${
                  userProfileData.gender === 1 ? "text-[#1D1D1D]" : ""
                } flex-row h-[50px] justify-center items-center rounded-[15px] w-1/3`}
                style={{
                  border: userProfileData.gender === 1 && "1px solid #402CDDa3",
                }}
                data-cy={
                  userProfileData.gender === 1
                    ? "active-gender-input"
                    : "gender-input"
                }
              >
                {translateFunction("Man", language)}
              </div>
              <div
                onClick={() => updateField("gender", 2)}
                className={`flex ml-[11px] ${
                  userProfileData.gender === 2 ? "text-[#1D1D1D]" : ""
                } flex-row h-[50px] justify-center items-center rounded-[15px] w-1/3`}
                style={{
                  border: userProfileData.gender === 2 && "1px solid #402CDDa3",
                }}
                data-cy={
                  userProfileData.gender === 2
                    ? "active-gender-input"
                    : "gender-input"
                }
              >
                {translateFunction("Woman", language)}
              </div>
              <div
                onClick={() => updateField("gender", 3)}
                className={`flex ml-[11px] ${
                  userProfileData.gender === 3 ? "text-[#1D1D1D]" : ""
                } flex-row h-[50px] justify-center items-center rounded-[15px] w-1/3`}
                style={{
                  border: userProfileData.gender === 3 && "1px solid #402CDDa3",
                }}
                data-cy={
                  userProfileData.gender === 3
                    ? "active-gender-input"
                    : "gender-input"
                }
              >
                {translateFunction("Other", language)}
              </div>
            </div>
          </div>
          {showValidation && validationErrors.gender && (
            <div className="text-red-500 text-[10px] mt-1 px-2">
              {validationErrors.gender}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoForm;
