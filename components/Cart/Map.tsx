"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { translateFunction } from "utils/functions";

import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import { ConfirmLocationPropsType } from "models/componentType/ConfirmLocationPropsType";
import { MapPropsType } from "models/componentType/MapPropsType";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
const MapElement = dynamic(
  () => import("./MapElement").then((mod) => mod.MapElement),
  { ssr: false }
);

const Map = ({
  setAddressDetails,
  center,
  expanded,
  setExpanded,
}: MapPropsType) => {
  const { lang } = useParams();
  const { addressDetails } = useAppStore();
  const [cordinates, setCordinates] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCountryBoundries = async () => {
    // @ts-ignore
    let country = lang.split("-")[0].toUpperCase();

    try {
      setLoading(true);
      let res = await fetchData({
        url: `/api/addresses/CountryBoundaryByIso/${country}`,
        reqTitle: REQUESTS_DATA.COUNTRY_MAP_BORDERS,
        server: "elastic",
        method: "GET",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      setCordinates(res.country.boundary.coordinates);
      setLoading(false);
    } catch (e) {
      setCordinates(null);
      setLoading(false);
    }
  };
  useEffect(() => {
    getCountryBoundries();
  }, []);
  return (
    <>
      <div
        data-cy="map-container"
        className={`${!expanded && "h-[120px]"} flex-col pl-[12px] pr-[12px]`}
      >
        <div
          data-cy="map-toggle"
          onClick={() => {
            if (!expanded) {
              setExpanded(true);
            }
          }}
          className={`flex-col map-border max-h-[calc(100vh-234px)] relative pt-[12px] pb-[7px]  pl-[12px] pr-[12px] items-center mt-[12px] justify-center  w-full ${
            expanded ? "h-[calc(100vh-396px)]" : " h-[120px]"
          } rounded-[15px]`}
          style={{
            border: "1px solid rgb(211 211 211 / 51%)",
          }}
        >
          <>
            {loading && <Spinner />}
            {!loading && (
              <>
                {!expanded && (
                  <div
                    data-cy="expand-map"
                    onClick={() => {
                      setExpanded(true);
                    }}
                    style={{
                      zIndex: "99999",
                      backgroundColor: " #f4f4f400 ",
                      backdropFilter: "blur(2px) brightness(0.48)",
                      color: "#fafafa",
                      cursor: "pointer",
                      top: "35px",
                    }}
                    className="absolute regular left-0 right-0 mx-auto my-0 h-[31px] min-w-[214px] w-fit flex-row justify-between items-center pl-[12px] pr-[12px] rounded-[10px]"
                  >
                    <span className="whitespace-nowrap">
                      {translateFunction("Locate Your Location On Map")}
                    </span>
                    <svg
                      className="ml-[10px]"
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                    >
                      <path
                        id="navigation"
                        d="M14.432.57A2.446,2.446,0,0,0,12.32.032,35.207,35.207,0,0,0,5.991,1.683C4.417,2.23,1.631,3.293.65,4.274A1.7,1.7,0,0,0,.633,6.927,12.076,12.076,0,0,0,4.926,8.921a1.707,1.707,0,0,1,1.153,1.152c.566,1.734,1.461,4.87,3.3,4.927a1.92,1.92,0,0,0,1.35-.649c2.033-2.4,3.867-9.009,4.242-11.67A2.446,2.446,0,0,0,14.432.57Zm-.626,1.973c-.353,2.977-2.632,9.7-3.907,10.979-.427.427-.644.363-.942.071A10.418,10.418,0,0,1,7.2,9.74,2.875,2.875,0,0,0,5.26,7.8,10.85,10.85,0,0,1,1.444,6.081a.759.759,0,0,1-.271-.453C1.424,4.042,9.888,1.492,12.458,1.2a1.487,1.487,0,0,1,1.145.2,1.487,1.487,0,0,1,.2,1.145Zm-6.158,5.4a.587.587,0,0,1-.414-1l4.072-4.072a.586.586,0,0,1,.829.829L8.062,7.768A.584.584,0,0,1,7.648,7.939Z"
                        transform="translate(-0.002 0)"
                        fill="#f4f4f4"
                      />
                    </svg>
                  </div>
                )}

                <MapElement
                  data-cy="map-element"
                  cordinates={cordinates}
                  setLocation={(e) => {
                    setAddressDetails({
                      location: e,
                    });
                  }}
                  expanded={expanded}
                  center={center}
                />

                {!expanded && (
                  <div
                    data-cy="location-accuracy"
                    className="medium whitespace-nowrap  text-[12px] mt-[10px] flex"
                  >
                    {translateFunction(
                      "Location Is Accurate, Making It Easy To Receive Shipments"
                    )}
                  </div>
                )}
              </>
            )}
          </>
        </div>
      </div>
      {expanded && (
        <ConfirmLocation
          closeMap={() => {
            setExpanded(false);
            setAddressDetails({
              location: { latitude: null, longitude: null },
            });
          }}
          locationSelected={
            addressDetails.location.latitude &&
            addressDetails.location.latitude !== "null" &&
            addressDetails.location.longitude &&
            addressDetails.location.longitude !== "null"
          }
          selectLocation={() => {
            setExpanded(false);
          }}
        />
      )}
    </>
  );
};

export default Map;

const ConfirmLocation = ({
  locationSelected,
  selectLocation,
  closeMap,
}: ConfirmLocationPropsType) => {
  return (
    <div
      data-cy="confirm-location"
      className="bg-[#FFFFFF] flex-row justify-between pr-[20px] h-[100px] w-full pt-[12px] pl-[20px] "
    >
      <div
        data-cy="confirm-button"
        onClick={() => {
          selectLocation();
        }}
        className={`${
          locationSelected ? "bg-[#346BFF] cursor-pointer" : "bg-[#7C7C7C]"
        }  w-[285px] rounded-[20px] h-[70px] text-[18px] text-[#FEFEFE] text-center flex justify-center items-center medium`}
      >
        {translateFunction("Select")}
      </div>
      <div
        onClick={() => {
          closeMap();
        }}
        className="text-[#1D1D1D] w-[124px] cursor-pointer text-[18px] h-[70px] text-center flex justify-center items-center medium "
        data-cy="cancel-button"
      >
        {translateFunction("Cancel")}
      </div>
    </div>
  );
};
