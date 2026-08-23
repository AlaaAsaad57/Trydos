"use client";
import React, { useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import auth from "services/auth";

import { pollinateInput } from "utils/tinyUtils";
import BackBar from "components/setting/BackBar";

function ProfileSizeInfo({ local, initialData, isRtl }) {
  const [, language] = local.split("-");
  const isArabic = language === "ar";

  const toArabicNumerals = (val: string | number) =>
    String(val).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);

  const toWesternNumerals = (val: string) =>
    val.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  const formatNum = (val: number | undefined | null) => {
    if (!val && val !== 0) return "";
    return isArabic ? toArabicNumerals(val) : String(val);
  };

  const [userProfileData, setUserProfileData] = useState({
   
    tall: initialData?.tall,
    weight: initialData?.weight,
  });
  const [validationErrors, setValidationErrors] = useState({
    tall: "",
    weight: "",
  });
  const [showValidation, setShowValidation] = useState(false);

  const [loading, setLoading] = useState(false);
  const updateUserProfile = async (payload) => {
    try {
      setLoading(true);
      await auth.UpdateProfile(payload, initialData);

      setLoading(false);
      window.location.href = `/${local}/settings/profile`;
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In updateUserProfile in ProfileSizeInfo",
      });
      setLoading(false);
    }
  };

  const validateFunction = () => {
    const errors = {
      tall: "",
      weight: "",
    };

    if (!userProfileData.tall) {
      errors.tall = translateFunction("Height is required");
    } else if (userProfileData.tall < 110 || userProfileData.tall > 250) {
      errors.tall = translateFunction("Height must be between 110 and 250 cm");
    }

    if (!userProfileData.weight) {
      errors.weight = translateFunction("Weight is required");
    } else if (userProfileData.weight < 40 || userProfileData.weight > 180) {
      errors.weight = translateFunction("Weight must be between 40 and 180 kg");
    }

    setValidationErrors(errors);
    setShowValidation(true);

    return !errors.tall && !errors.weight;
  };

  const handleSave = () => {
    if (!validateFunction()) return;
    updateUserProfile(userProfileData);
  };

  return (
    <div
      className={`flex-col w-full  setting-screen ${
        loading ? "opacity-50 scale-95" : ""
      }`}
      key="size-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        DataCy="personal-size-save-button"
        local={local}
        Save={handleSave}
        Icon={""}
        name={translateFunction("Profile", language)}
        preivous_page={`/${local}/settings/profile`}
      />
      <div
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
        className={`flex-row justify-center mt-[12px] w-full`}
      >
        <div
          className="bg-[#F8F8F8] min-h-[50px] gap-[12px] w-full flex-row items-center pl-[24px] pr-[20px] "
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
          data-pw="address-info-header" // Added data-pw
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
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
        className="flex-col w-full mt-[30px] px-[12px] pb-[110px]"
        data-pw="container-name-phone"
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
              id="Mask_Group_731"
              data-name="Mask Group 731"
              clipPath="url(#clipPath)"
            >
              <g id="measuring-tape-2" transform="translate(0.04 0.692)">
                <path
                  id="Line_1001"
                  data-name="Line 1001"
                  d="M.026.723A.18.18,0,0,1-.15.582L-.3-.081A.18.18,0,0,1-.159-.3a.18.18,0,0,1,.214.137L.2.5A.18.18,0,0,1,.026.723Z"
                  transform="translate(2.656 11.162)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1002"
                  data-name="Line 1002"
                  d="M.021.7A.18.18,0,0,1-.154.563L-.3-.081A.18.18,0,0,1-.159-.3a.18.18,0,0,1,.214.137L.2.486A.18.18,0,0,1,.06.7.181.181,0,0,1,.021.7Z"
                  transform="translate(4.67 10.719)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1003"
                  data-name="Line 1003"
                  d="M.027.727A.18.18,0,0,1-.149.586L-.3-.081A.18.18,0,0,1-.159-.3a.18.18,0,0,1,.214.137L.2.509A.18.18,0,0,1,.027.727Z"
                  transform="translate(6.684 10.275)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1004"
                  data-name="Line 1004"
                  d="M.024.715A.18.18,0,0,1-.152.573L-.3-.081A.18.18,0,0,1-.159-.3a.18.18,0,0,1,.214.137L.2.5A.18.18,0,0,1,.062.711.181.181,0,0,1,.024.715Z"
                  transform="translate(8.698 9.831)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1005"
                  data-name="Line 1005"
                  d="M.03.737A.18.18,0,0,1-.146.6L-.3-.081A.18.18,0,0,1-.159-.3a.18.18,0,0,1,.215.137l.15.677A.18.18,0,0,1,.03.737Z"
                  transform="translate(10.701 9.347)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1006"
                  data-name="Line 1006"
                  d="M.021.7A.18.18,0,0,1-.155.558L-.3-.081A.18.18,0,0,1-.159-.3a.18.18,0,0,1,.215.137L.2.48A.18.18,0,0,1,.06.694.181.181,0,0,1,.021.7Z"
                  transform="translate(12.641 8.468)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1007"
                  data-name="Line 1007"
                  d="M-.12.766A.18.18,0,0,1-.3.586V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.586A.18.18,0,0,1-.12.766Z"
                  transform="translate(7.58 0.3)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1008"
                  data-name="Line 1008"
                  d="M-.12.82A.18.18,0,0,1-.3.64V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.64A.18.18,0,0,1-.12.82Z"
                  transform="translate(9.546 0.476)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1009"
                  data-name="Line 1009"
                  d="M-.12.9A.18.18,0,0,1-.3.717V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.717A.18.18,0,0,1-.12.9Z"
                  transform="translate(11.512 1.052)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1010"
                  data-name="Line 1010"
                  d="M-.12.868A.18.18,0,0,1-.3.688V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.688A.18.18,0,0,1-.12.868Z"
                  transform="translate(13.478 2.265)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1011"
                  data-name="Line 1011"
                  d="M-.12.82A.18.18,0,0,1-.3.64V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.64A.18.18,0,0,1-.12.82Z"
                  transform="translate(5.614 0.476)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1012"
                  data-name="Line 1012"
                  d="M-.12.9A.18.18,0,0,1-.3.717V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.717A.18.18,0,0,1-.12.9Z"
                  transform="translate(3.648 1.052)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1013"
                  data-name="Line 1013"
                  d="M-.12.868A.18.18,0,0,1-.3.688V-.12A.18.18,0,0,1-.12-.3a.18.18,0,0,1,.18.18V.688A.18.18,0,0,1-.12.868Z"
                  transform="translate(1.682 2.265)"
                  fill="#1d1d1d"
                />
                <path
                  id="Path_23084"
                  data-name="Path 23084"
                  d="M14.592,7.428h0a.18.18,0,0,1-.168-.116,4.967,4.967,0,0,0-2.462-2.481,9.691,9.691,0,0,0-4.434-1,10.533,10.533,0,0,0-2.635.327A.18.18,0,0,1,4.8,3.8a10.893,10.893,0,0,1,2.725-.338c3.188,0,5.986,1.325,7.03,3.273a2.987,2.987,0,0,0,.07-.642c0-2.521-3.185-4.572-7.1-4.572S.426,3.576.426,6.1A2.987,2.987,0,0,0,.5,6.74,6.154,6.154,0,0,1,3.8,4.12a.18.18,0,1,1,.128.337A5.451,5.451,0,0,0,.63,7.312a.18.18,0,0,1-.336,0A3.4,3.4,0,0,1,.066,6.1,4.287,4.287,0,0,1,2.28,2.586,9.693,9.693,0,0,1,7.527,1.165a9.692,9.692,0,0,1,5.246,1.421A4.287,4.287,0,0,1,14.987,6.1a3.4,3.4,0,0,1-.227,1.215A.18.18,0,0,1,14.592,7.428Z"
                  transform="translate(-0.066 -1.165)"
                  fill="#1d1d1d"
                />
                <path
                  id="Path_23085"
                  data-name="Path 23085"
                  d="M6.792,17.5a.18.18,0,0,1-.039-.356l5.619-1.238a7.829,7.829,0,0,0,3.518-1.66,3.6,3.6,0,0,0,1.355-2.681v-2.3a.18.18,0,1,1,.36,0v2.3c0,2.148-2.072,4.034-5.156,4.693L6.831,17.5A.181.181,0,0,1,6.792,17.5Z"
                  transform="translate(-2.685 -4.333)"
                  fill="#1d1d1d"
                />
                <path
                  id="Path_23086"
                  data-name="Path 23086"
                  d="M2.777,18.7a.875.875,0,0,1-.865-.69l-.18-.815a.882.882,0,0,1,.671-1.05l8.031-1.778a8.249,8.249,0,0,0,2.98-1.249,4.47,4.47,0,0,0,1.668-2,.18.18,0,1,1,.336.128,4.826,4.826,0,0,1-1.8,2.168,8.609,8.609,0,0,1-3.11,1.306L2.481,16.5a.522.522,0,0,0-.4.621l.18.815a.527.527,0,0,0,.642.393l.887-.2a.18.18,0,1,1,.077.352l-.887.2A.959.959,0,0,1,2.777,18.7Z"
                  transform="translate(-0.724 -5.1)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1014"
                  data-name="Line 1014"
                  d="M-.12.572a.181.181,0,0,1-.039,0A.18.18,0,0,1-.3.354l.113-.512A.18.18,0,0,1,.031-.3a.18.18,0,0,1,.137.214L.056.431A.18.18,0,0,1-.12.572Z"
                  transform="translate(12.392 11.162)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1015"
                  data-name="Line 1015"
                  d="M-.12.619a.181.181,0,0,1-.039,0A.18.18,0,0,1-.3.4l.124-.559A.18.18,0,0,1,.043-.3a.18.18,0,0,1,.137.215L.056.478A.18.18,0,0,1-.12.619Z"
                  transform="translate(4.336 9.347)"
                  fill="#1d1d1d"
                />
                <path
                  id="Line_1016"
                  data-name="Line 1016"
                  d="M-.12.626a.181.181,0,0,1-.039,0A.18.18,0,0,1-.3.407l.125-.566A.18.18,0,0,1,.044-.3a.18.18,0,0,1,.137.215L.056.485A.18.18,0,0,1-.12.626Z"
                  transform="translate(2.394 8.468)"
                  fill="#1d1d1d"
                />
                <path
                  id="Path_23087"
                  data-name="Path 23087"
                  d="M17.788,21.95a.957.957,0,0,1-.205-.022l-5.241-1.155a.18.18,0,0,1,.077-.352l5.241,1.155a.527.527,0,0,0,.641-.393l.18-.815a.522.522,0,0,0-.4-.621l-1.215-.269a.18.18,0,0,1,.078-.351l1.215.269a.882.882,0,0,1,.671,1.05l-.18.815A.876.876,0,0,1,17.788,21.95Z"
                  transform="translate(-4.92 -8.347)"
                  fill="#1d1d1d"
                />
                <path
                  id="Path_23088"
                  data-name="Path 23088"
                  d="M3,15.467a.179.179,0,0,1-.083-.02C1.1,14.506.066,13.092.066,11.566v-2.3a.18.18,0,1,1,.36,0v2.3c0,1.387.968,2.685,2.655,3.561a.18.18,0,0,1-.083.34Z"
                  transform="translate(-0.066 -4.333)"
                  fill="#1d1d1d"
                />
                <path
                  id="Path_23089"
                  data-name="Path 23089"
                  d="M7.67,15.231a.181.181,0,0,1-.039,0L5.342,14.72a8.607,8.607,0,0,1-3.109-1.306,4.826,4.826,0,0,1-1.8-2.168.18.18,0,0,1,.336-.128,4.47,4.47,0,0,0,1.668,2,8.247,8.247,0,0,0,2.979,1.249l2.29.507a.18.18,0,0,1-.039.356Z"
                  transform="translate(-0.21 -5.1)"
                  fill="#1d1d1d"
                />
              </g>
            </g>
          </svg>

          <div
            className="flex mx-[6px] text-[#404040] text-[12px] medium"
            data-pw="contact-info-text"
          >
            {translateFunction("Your Size Info")}
          </div>
          <img
            src="/icons/AddressInfo.svg"
            className="ml-[12px] cursor-pointer"
            data-pw="Address-info-icon"
          />
        </div>
        <div
          className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          style={{
            border:
              showValidation && validationErrors.tall
                ? "#ff0000a3 1px solid"
                : "#d3d3d3a3 1px solid",
          }}
        >
          <div className="flex-row regular text-[#505050] text-[12px]">
            {translateFunction("How Tall Are You?")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
              <input
                data-pw="personal-size-tall-input"
                placeholder={
                  isArabic
                    ? toArabicNumerals(translateFunction("000 CM"))
                    : translateFunction("000 CM")
                }
                value={formatNum(userProfileData.tall)}
                maxLength={3}
                type="text"
                inputMode="numeric"
                onChange={(e) => {
                  const westernValue = toWesternNumerals(e.target.value);
                  setUserProfileData({
                    ...userProfileData,
                    tall: parseInt(pollinateInput(westernValue)),
                  });
                  if (showValidation && validationErrors.tall) {
                    setValidationErrors({
                      ...validationErrors,
                      tall: "",
                    });
                  }
                }}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
          {showValidation && validationErrors.tall && (
            <div className="text-red-500 text-[10px] mt-1 px-2">
              {validationErrors.tall}
            </div>
          )}
        </div>
        <div
          className="flex-col name-border cursor-pointer rounded-[15px] w-full mt-[8px] py-[7px] px-[12px] items-start justify-center"
          style={{
            border:
              showValidation && validationErrors.weight
                ? "#ff0000a3 1px solid"
                : "#d3d3d3a3 1px solid",
          }}
        >
          <div className="flex-row regular text-[#505050] text-[12px]">
            {translateFunction("What Is Your Weight?")}
          </div>
          <div className="[&>path]:fill-[#D3D3D3] flex-row items-center mt-[3px] w-full ">
            <div className="medium flex text-[#D3D3D3] text-[14px] w-full">
              <input
                data-pw="personal-size-weight-input"
                placeholder={
                  isArabic
                    ? toArabicNumerals(translateFunction("000 KG"))
                    : translateFunction("000 KG")
                }
                value={formatNum(userProfileData.weight)}
                maxLength={3}
                type="text"
                inputMode="numeric"
                onChange={(e) => {
                  const westernValue = toWesternNumerals(e.target.value);
                  setUserProfileData({
                    ...userProfileData,
                    weight: parseInt(pollinateInput(westernValue)),
                  });
                  if (showValidation && validationErrors.weight) {
                    setValidationErrors({
                      ...validationErrors,
                      weight: "",
                    });
                  }
                }}
                className="w-full pr-6  min-h-[21px] h-auto bg-transparent text-[#1D1D1D] medium  text-[14px] placeholder-[#D3D3D3]  border-none outline-hidden resize-none"
              />
            </div>
          </div>
          {showValidation && validationErrors.weight && (
            <div className="text-red-500 text-[10px] mt-1 px-2">
              {validationErrors.weight}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileSizeInfo;
