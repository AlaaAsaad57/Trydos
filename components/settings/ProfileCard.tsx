import React, { useState } from "react";
import Qr from "public/svg/Userqr.svg";

import { translateFunction } from "utils/functions";
import { ConfirmationModal } from "./PersonalInfo";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
import { ProfileCardPropsType } from "models/componentType/settingTypes/MainSettingPropsType";
function ProfileCard({
  goToProfile,
  goToProfileSize,
  goToProfilePicture,
}: ProfileCardPropsType) {
  const { userProfile, language } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      <div
        className={`w-full h-[138px] rounded-[15px] bg-[#F8F8F8] p-[12px] ${
          isRtl ? "flex-row-reverse" : "flex-row"
        } justify-between cursor-pointer`}
        data-cy="profile-card"
        onClick={(e) => {
          // @ts-ignore
          if (e.target.closest(".self-navigate")) {
          } else {
            goToProfile();
          }
        }}
      >
        <div className={`flex-col ${isRtl && "items-end"}`}>
          <Qr />
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } items-end gap-[10px]`}
          >
            <div className="flex-col mt-[5px]">
              <span className="medium text-[#1D1D1D] text-[14px]">
                {userProfile?.name}
              </span>
              <span className="regular text-[#8D8D8D] text-[12px] mt-[2px]">
                + {userProfile?.phone?.replace("+", "")}
              </span>
            </div>
            <div
              className="flex-col items-center cursor-pointer justify-center h-full self-navigate"
              onClick={() => {
                if (userProfile?.is_phone_verified === 0) {
                  setIsModalOpen(true);
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16.413"
                height="16.412"
                viewBox="0 0 16.413 16.412"
              >
                <g
                  id="Group_3290"
                  data-name="Group 3290"
                  transform="translate(-37.223 -62.334)"
                >
                  <g
                    id="Group_3166"
                    data-name="Group 3166"
                    transform="translate(42.657 68.141)"
                  >
                    <g
                      id="Group_3165"
                      data-name="Group 3165"
                      transform="translate(0 0)"
                    >
                      <path
                        id="Path_15412"
                        data-name="Path 15412"
                        d="M34.744,30.414a.684.684,0,0,0-.968,0l-2.939,2.939-1.228-1.228a.685.685,0,1,0-.968.968l1.71,1.712a.684.684,0,0,0,.968,0l3.425-3.423a.684.684,0,0,0,0-.968Z"
                        transform="translate(-28.418 -30.213)"
                        fill="#707070"
                        stroke="#3c3c3c"
                        strokeWidth="0.111"
                      />
                    </g>
                  </g>
                  <path
                    id="Path_15413"
                    data-name="Path 15413"
                    d="M15.332,7.332A.667.667,0,0,0,14.665,8a6.668,6.668,0,1,1-1.936-4.7.667.667,0,1,0,.945-.94A8,8,0,1,0,16,8a.667.667,0,0,0-.667-.667Z"
                    transform="translate(37.438 62.538)"
                    fill={
                      userProfile?.is_phone_verified === 1 ? "#4cff79" : "none"
                    }
                    stroke="#707070"
                    strokeWidth="0.4"
                  />
                </g>
              </svg>
              <span
                className={`text-[10px] regular ${
                  userProfile?.is_phone_verified === 1
                    ? "text-[#1d1d1d]"
                    : "text-[#FF5F61] cursor-pointer"
                } mt-[4px]`}
              >
                {userProfile?.is_phone_verified === 1
                  ? translateFunction("Verified")
                  : translateFunction("Verify Now")}
              </span>
            </div>
          </div>
          <span
            className="cursor-pointer whitespace-nowrap w-[50px] regular text-[12px] text-[#8D8D8D] self-navigate"
            onClick={() => goToProfileSize()}
          >
            {translateFunction("Add Size")}
          </span>
        </div>
        <div
          className="flex w-[70px] h-[70px] self-navigate rounded-[12px] justify-center items-center cursor-pointer"
          style={{
            border: "1px solid #1D1D1D",
          }}
          onClick={() => goToProfilePicture()}
        >
          {userProfile?.image ? (
            <img
              className="w-full h-full rounded-[12px] object-cover"
              src={GetImageUrl(userProfile?.image)}
              alt="user"
            />
          ) : (
            <span className="bold text-[20px] text-[#1D1D1D]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="18"
                viewBox="0 0 30 18"
              >
                <path
                  id="Path_23092"
                  data-name="Path 23092"
                  d="M8.144-50.9a.744.744,0,0,1,.563.286,1.091,1.091,0,0,1,.254.752,1.128,1.128,0,0,1-.651.964,2.788,2.788,0,0,1-1.467.392,4.416,4.416,0,0,1-2.305-.561A2.568,2.568,0,0,1,3.6-51.449v-5.845H2.585a1.224,1.224,0,0,1-.882-.339,1.126,1.126,0,0,1-.353-.847,1.068,1.068,0,0,1,.353-.815,1.246,1.246,0,0,1,.882-.328H3.6v-1.355a1.225,1.225,0,0,1,.386-.921,1.331,1.331,0,0,1,.96-.371,1.266,1.266,0,0,1,.926.371,1.243,1.243,0,0,1,.375.921v1.355H7.813a1.224,1.224,0,0,1,.882.339,1.126,1.126,0,0,1,.353.847,1.068,1.068,0,0,1-.353.815,1.246,1.246,0,0,1-.882.328H6.247v5.739a.793.793,0,0,0,.243.646,1.006,1.006,0,0,0,.662.2,1.964,1.964,0,0,0,.485-.085A1.365,1.365,0,0,1,8.144-50.9Zm9.574-9.148a1.732,1.732,0,0,1,1.114.36,1.06,1.06,0,0,1,.452.847,1.281,1.281,0,0,1-.353.985,1.189,1.189,0,0,1-.838.328,2.281,2.281,0,0,1-.75-.148q-.066-.021-.3-.085a1.87,1.87,0,0,0-.5-.064,2.017,2.017,0,0,0-1.1.339,2.5,2.5,0,0,0-.871,1.027,3.652,3.652,0,0,0-.342,1.641V-49.8a1.243,1.243,0,0,1-.375.921,1.294,1.294,0,0,1-.949.371,1.294,1.294,0,0,1-.949-.371,1.243,1.243,0,0,1-.375-.921v-8.746a1.243,1.243,0,0,1,.375-.921,1.294,1.294,0,0,1,.949-.371,1.294,1.294,0,0,1,.949.371,1.243,1.243,0,0,1,.375.921v.275a3.289,3.289,0,0,1,1.456-1.324A4.63,4.63,0,0,1,17.718-60.047Zm12.309.212a1.294,1.294,0,0,1,.949.371,1.243,1.243,0,0,1,.375.921v9a4.882,4.882,0,0,1-1.544,4.013,6.327,6.327,0,0,1-4.125,1.26,10.414,10.414,0,0,1-1.533-.116,5.945,5.945,0,0,1-1.268-.307Q21.8-45.138,21.8-45.922a1.049,1.049,0,0,1,.066-.339,1.306,1.306,0,0,1,.452-.709,1.123,1.123,0,0,1,.695-.244,1.367,1.367,0,0,1,.419.064q.154.064.54.212a5.732,5.732,0,0,0,.816.244,4.119,4.119,0,0,0,.893.1,3.442,3.442,0,0,0,2.305-.646,2.819,2.819,0,0,0,.739-2.213v-.212a4.39,4.39,0,0,1-3.574,1.376,3.928,3.928,0,0,1-2.029-.519,3.561,3.561,0,0,1-1.368-1.44,4.453,4.453,0,0,1-.485-2.107v-6.184a1.243,1.243,0,0,1,.375-.921,1.294,1.294,0,0,1,.949-.371,1.294,1.294,0,0,1,.949.371,1.243,1.243,0,0,1,.375.921v5.421a2.569,2.569,0,0,0,.607,1.916,2.468,2.468,0,0,0,1.776.582,2.364,2.364,0,0,0,1.776-.646,2.549,2.549,0,0,0,.629-1.853v-5.421a1.243,1.243,0,0,1,.375-.921A1.294,1.294,0,0,1,30.026-59.835Z"
                  transform="translate(-1.35 62.27)"
                  fill="#1d1d1d"
                />
              </svg>
            </span>
          )}
        </div>
      </div>
      {isModalOpen && (
        <ConfirmationModal
          forVerify={true}
          closeWindow={() => {
            setIsModalOpen(false);
          }}
          value={userProfile?.phone}
          successCallback={(idToken) => {
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}

export default ProfileCard;
