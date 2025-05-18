import React, { useEffect, useState } from "react";
import SettingTopBar from "./TopBar";
import AddressInfo from "public/svg/cart/AddressInfo.svg";
import { translateFunction } from "utils/functions";

import { useParams } from "next/navigation";
import { changeAppCountry } from "store/homepage/actions";
import { changeAppCountryServer } from "store/homepage/cachedActions";
import { useAppStore } from "store";
import { FlagIcon } from "utils/tinyUtils";

function PersonalInfoCountries({
  swipeToScreen,
  goBack,
}: {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}) {
  const { countries } = useAppStore();

  const { lang } = useParams();
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find(
      // @ts-ignore

      (s) => s.iso.toLowerCase() === lang?.split("-")[0].toLowerCase()
    )
  );
  useEffect(() => {
    if (countries)
      setSelectedCountry(
        countries.find(
          // @ts-ignore
          (s) => s.iso.toLowerCase() === lang?.split("-")[0].toLowerCase()
        )
      );
  }, [countries]);
  const [isSettingCountry, setIsSettingCountry] = useState(false);

  const changeCountry = async (country: any) => {
    setIsSettingCountry(true);
    const current = window.location.pathname;
    const newPath = current.replace(
      // @ts-ignore
      `/${lang?.split("-")[0]}`,
      `/${country.iso.toLowerCase()}`
    );

    if (current !== newPath) {
      window.history.replaceState(null, "", newPath);
    }

    await changeAppCountry(country.iso.toLowerCase());
    await changeAppCountryServer(country.iso.toLowerCase());

    setSelectedCountry(country);
    setIsSettingCountry(false);
  };
  return (
    <div className="flex-col max-h-[calc(100vh-200px)]">
      <SettingTopBar
        goBack={() => goBack()}
        screenName="Profile | Countries"
        DataCy="personal-info-countries"
        Save={null}
      />
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
      <div className="flex-col w-full px-[12px] ">
        <div className="flex flex-col w-full  mt-[19px] items-start">
          <div className="flex flex-row items-stretch px-[12px]">
            <svg
              id="_15x15_photo_back"
              data-name="15x15 photo back"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="15"
              height="15"
              viewBox="0 0 15 15"
            >
              <defs>
                <clipPath id="clip-path">
                  <rect
                    id="Rectangle_4561"
                    data-name="Rectangle 4561"
                    width="15"
                    height="15"
                    fill="none"
                  />
                </clipPath>
                <clipPath id="clip-path-2">
                  <path id="path1173" d="M0-15H15V0H0Z" />
                </clipPath>
              </defs>
              <g
                id="Mask_Group_735"
                data-name="Mask Group 735"
                clipPath="url(#clip-path)"
              >
                <g id="g1167" transform="translate(0 15)">
                  <g id="g1169">
                    <g id="g1171" clipPath="url(#clip-path-2)">
                      <g id="g1177" transform="translate(5.995 -13.273)">
                        <path
                          id="path1179"
                          d="M0,0A.552.552,0,0,1-.552.552.552.552,0,0,1-1.1,0,.552.552,0,0,1-.552-.552.552.552,0,0,1,0,0Z"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                      <g id="g1181" transform="translate(11.52 -5.728)">
                        <path
                          id="path1183"
                          d="M0,0A.552.552,0,0,1-.552.552.552.552,0,0,1-1.1,0,.552.552,0,0,1-.552-.552.552.552,0,0,1,0,0Z"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                      <g id="g1185" transform="translate(3.081 -1.8)">
                        <path
                          id="path1187"
                          d="M0,0A6.943,6.943,0,0,0,4.42,1.58q.19,0,.379-.01l-.181-.44A.655.655,0,0,1,4.843.348a.653.653,0,0,0,.275-.533.871.871,0,0,0-.177-.67L4.6-1.219a.654.654,0,0,1-.063-.816l.092-.134a.654.654,0,0,0-.336-.99L3.3-3.484a.389.389,0,0,1-.216-.175L2.4-4.828a.39.39,0,0,0-.669-.009l-.163.264a.39.39,0,0,1-.332.185.39.39,0,0,1-.378-.489l.352-1.347a.39.39,0,0,1,.2-.249l.717-.369a.39.39,0,0,0,.2-.431.755.755,0,0,0-.61-.581,2.457,2.457,0,0,1-.894-.238L-.212-8.724a1.2,1.2,0,0,1-.531-.692l-.145-.5A6.943,6.943,0,0,0-2.552-5.392,6.947,6.947,0,0,0-.643-.6"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                      <g id="g1189" transform="translate(5.449 -14.78)">
                        <path
                          id="path1191"
                          d="M0,0A1.529,1.529,0,0,0-1.509,1.636,3.815,3.815,0,0,0-.436,3.8a.581.581,0,0,0,.859,0A3.694,3.694,0,0,0,1.5,1.507,1.507,1.507,0,0,0,0,0Z"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                      <g id="g1193" transform="translate(12.839 -11.674)">
                        <path
                          id="path1195"
                          d="M0,0-.283.5A.68.68,0,0,1-.822.848a.68.68,0,0,0-.545.356l-.259.484a.68.68,0,0,1-.648.357c-.162-.011-.193-.016-.27-.016a1.262,1.262,0,0,0-.93.409c-.474.517-.246,1.066-.636,1.584l-.591.789a.412.412,0,0,0,.088.58l.513.372a.412.412,0,0,0,.345.065c.168-.042.3-.076.4-.1a1.518,1.518,0,0,1,1.49-1.285,1.507,1.507,0,0,1,1.5,1.507,2.321,2.321,0,0,1-.06.515l.016.012L.942,7.511a6.942,6.942,0,0,0,.69-3.028A6.944,6.944,0,0,0,0,0Z"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                      <g id="g1197" transform="translate(10.31 -13.573)">
                        <path
                          id="path1199"
                          d="M0,0A6.946,6.946,0,0,0-2.81-.59a7.048,7.048,0,0,0-.808.047A1.5,1.5,0,0,1-3.36.3,3.694,3.694,0,0,1-4.438,2.6a.581.581,0,0,1-.859,0A3.815,3.815,0,0,1-6.37.429c0-.014,0-.027,0-.041A7.007,7.007,0,0,0-8.116,1.86h0l.145.5a1.2,1.2,0,0,0,.531.692l1.041.632a2.456,2.456,0,0,0,.894.238A.755.755,0,0,1-4.9,4.5a.39.39,0,0,1-.2.432l-.717.369a.39.39,0,0,0-.2.249L-6.366,6.9a.39.39,0,0,0,.378.489A.39.39,0,0,0-5.656,7.2l.163-.264a.39.39,0,0,1,.669.009l.68,1.169a.39.39,0,0,0,.216.175l.991.325A.654.654,0,0,1-2.6,9.6l-.092.134a.654.654,0,0,0,.063.816l.341.364a.871.871,0,0,1,.177.67.653.653,0,0,1-.275.533.655.655,0,0,0-.225.782l.181.44a6.973,6.973,0,0,0,5.9-3.933L2.121,8.372,2.105,8.36a4.207,4.207,0,0,1-1.018,1.784.581.581,0,0,1-.859,0A3.815,3.815,0,0,1-.845,7.974a1.571,1.571,0,0,1,.019-.351c-.1.027-.233.061-.4.1a.412.412,0,0,1-.345-.065l-.513-.372a.411.411,0,0,1-.088-.58l.591-.789c.39-.518.162-1.067.636-1.584a1.262,1.262,0,0,1,.93-.409c.077,0,.108.005.27.016A.68.68,0,0,0,.9,3.587L1.162,3.1a.68.68,0,0,1,.545-.356A.68.68,0,0,0,2.246,2.4l.283-.5A7,7,0,0,0,.816.427"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                      <g id="g1201" transform="translate(10.974 -7.235)">
                        <path
                          id="path1203"
                          d="M0,0A1.529,1.529,0,0,0-1.509,1.636,3.816,3.816,0,0,0-.436,3.8a.581.581,0,0,0,.859,0A3.694,3.694,0,0,0,1.5,1.507,1.507,1.507,0,0,0,0,0Z"
                          fill="none"
                          stroke="#000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeMiterlimit="10"
                          strokeWidth="0.439"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
            <span className="ml-[6px] medium text-[#404040] text-[12px]">
              {translateFunction("Available Countries")}
            </span>
            <AddressInfo className="ml-[19px] cursor-pointer" />
          </div>
          <div
            className={`flex flex-col w-full ${
              isSettingCountry ? "opacity-50" : ""
            }`}
          >
            {countries.map((country) => {
              return (
                <div
                  key={country.iso}
                  data-cy={`personal-info-countries-${country.iso}`}
                  onClick={() => {
                    if (!isSettingCountry) {
                      changeCountry(country);
                    }
                  }}
                  style={{
                    border:
                      selectedCountry?.id === country?.id
                        ? "1px solid #402CDD7f"
                        : "1px solid #D3D3D37f",
                  }}
                  className={`w-full flex-row cursor-pointer mt-[12px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center`}
                >
                  <span className="w-[30px] h-[20px]">
                    <FlagIcon iso={country.iso} />
                  </span>

                  <span className="text-[14px] regular text-[#1d1d1d] ml-[12px] ">
                    {country.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoCountries;
