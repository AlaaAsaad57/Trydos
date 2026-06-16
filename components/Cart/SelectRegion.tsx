import { useState } from "react";
import { LogError, translateFunction } from "utils/functions";

import { useParams } from "next/navigation";
import { getLocalizedCountryName } from "utils/countryData";
import { DebounceInput } from "react-debounce-input";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { FlagIcon } from "utils/tinyUtils";

import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
function SelectRegion({ closeSelect }) {
  const { addressDetails } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [countryIso, language] = lang.split("-");
  const country = {
    name: getLocalizedCountryName(countryIso, language),
    iso: countryIso,
  };
  const showRegion = () => {
    return (
      <>
        <div
          className={`flex text-[#1D1D1D] text-[14px] regular`}
          data-cy="country-extend"
        >
          {country.name}
        </div>

        {addressDetails.region_details?.province && (
          <div
            className={`flex ${
              !addressDetails.region_details?.province
                ? "text-[#D3D3D3]"
                : "text-[#1D1D1D]"
            }  text-[14px] regular`}
            data-cy="Province-extend"
          >
            <span className="px-1">|</span>
            {addressDetails.region_details?.province || "Province"}
          </div>
        )}
        {addressDetails.region_details?.city && (
          <div
            className={`flex ${
              !addressDetails.region_details?.city
                ? "text-[#D3D3D3]"
                : "text-[#1D1D1D]"
            }  text-[14px] regular`}
            data-cy="Town-extend"
          >
            <span className="px-1">|</span>
            {addressDetails.region_details?.city || "Town"}
          </div>
        )}
        {addressDetails.region_details?.town && (
          <div
            className={`flex ${
              !addressDetails.region_details?.town
                ? "text-[#D3D3D3]"
                : "text-[#1D1D1D]"
            }  text-[14px] regular`}
            data-cy="Suburb-extend"
          >
            <span className="px-1">|</span>
            {addressDetails.region_details?.town || "Suburb"}
          </div>
        )}
      </>
    );
  };
  const [focused, setFocused] = useState(false);
  return (
    <>
      <div
        className="absolute top-[50px]  left-0 min-w-screen z-999999998 min-h-screen opacity-40 bg-[black]"
        onClick={() => {
          if (focused) {
            setFocused(false);
          } else {
            closeSelect();
          }
        }}
      />
      <div
        className="flex-col items-center px-[12px] bottom-0  absolute z-999999999 rounded-t-[30px] bg-white h-[441px] w-full pt-[19px]"
        data-cy="Extended-Choose-Area"
      >
        <div className="flex-row items-center w-full justify-center">
          <img src="/icons/Target.svg" data-cy="target-icon" />
          <span
            className="flex regular ml-[6px] text-[#1D1D1D] text-[14px]"
            data-cy="Select-From-List"
          >
            {translateFunction("Select From List")}
          </span>
        </div>
        <div className="flex-row items-center w-full justify-center mt-[11px]">
          <span className="w-[30px] h-[20px]">
            {" "}
            <FlagIcon iso={country.iso} />
          </span>

          <div className="flex-row ml-[8px]" data-cy="region-div">
            {showRegion()}
          </div>
        </div>
        <SearchLocations
          setFocused={setFocused}
          closeSelect={() => {
            closeSelect();
          }}
        />
      </div>
    </>
  );
}

export default SelectRegion;

const SearchLocations = ({ closeSelect, setFocused }) => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [search, setSearch] = useState("");
  const searchAction = async (val) => {
    setLoading(true);

    try {
      let response = await fetchData({
        url: `/api/addresses/get-address-by-text`,
        method: "POST",
        body: JSON.stringify({ query: val }),
        server: "elastic",
        reqTitle: REQUESTS_DATA.GET_ADDRESS_BY_TEXT,
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      setSearchResults(response.results || []);
    } catch (err) {
      LogError({
        error: err,
        scenario: "search for address by text - cart widget",
        search_text: val,
      });
    }

    setLoading(false);
  };
  return (
    <>
      <div className="relative flex w-full mt-[21px]">
        <svg
          data-cy="search-svg"
          className="absolute top-[11px] left-[12px] z-20"
          id="_15x15_photo_back"
          data-name="15x15 photo back"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="18"
          height="18"
          viewBox="0 0 18 18"
        >
          <defs>
            <clipPath id="clipPath">
              <rect
                id="Rectangle_4561"
                data-name="Rectangle 4561"
                width="18"
                height="18"
                fill="none"
              />
            </clipPath>
          </defs>
          <g
            id="Mask_Group_165"
            data-name="Mask Group 165"
            clipPath="url(#clipPath)"
          >
            <g id="_x32_-Magnifying_Glass">
              <path
                id="Path_19050"
                data-name="Path 19050"
                d="M3.123,20.075l4.09-4.09a7.872,7.872,0,1,1,.74.74l-4.09,4.09a.523.523,0,1,1-.74-.74Zm14.806-4.442a6.8,6.8,0,1,0-4.812,1.993A6.761,6.761,0,0,0,17.929,15.633Z"
                transform="translate(-2.97 -2.97)"
                fill="#388cff"
              />
            </g>
          </g>
        </svg>
        {loading && (
          <span className="absolute right-[20px] top-[12px]">
            <Spinner />
          </span>
        )}
        <DebounceInput
          onFocus={() => {
            setFocused(true);
          }}
          minLength={2}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.length > 0) searchAction(e.target.value);
          }}
          onInput={(e) => {}}
          value={search}
          placeholder={translateFunction(
            "Search Province | District | Town | Street",
          )}
          className="pl-[47px] pr-[15px] border-none outline-hidden flex rounded-[12px] bg-[#F8F8F8] regular text-[#1D1D1D] w-full h-[40px]"
          data-cy="SearchProvince-District-Town-Street"
          debounceTimeout={400}
        />
      </div>
      <SearchResults
        closeSelect={() => {
          closeSelect();
        }}
        searchAction={(e) => {
          setSearch(e);
          searchAction(e);
        }}
        shouldShowProvinces={search.length === 0}
        searchResults={searchResults}
      />
    </>
  );
};

const SearchResults = ({
  searchResults,
  closeSelect,
  shouldShowProvinces,
  searchAction,
}) => {
  const { setMapCenter, setAddressDetails, provinces } = useAppStore();
  const showLocationText = (location) => {
    let str = "";
    if (location.country) str += location.country;
    if (location?.province && location.province !== "null")
      str += ` | ${location.province}`;
    if (location?.city && location.city !== "null")
      str += ` | ${location.city}`;
    if (location?.town && location.town !== "null")
      str += ` | ${location.town}`;
    if (location?.street && location.street !== "null")
      str += ` | ${location.street}`;
    if (location?.building && location.building !== "null")
      str += ` | ${location.building}`;
    return str;
  };

  const select = (s) => {
    let a = { lat: s.coordinates[0]?.lat, lng: s.coordinates[0]?.lon };
    if (a.lat && a.lng) setMapCenter(a);
    setAddressDetails({
      region_details: {
        city: s.city,
        province: s?.province,
        town: s.town,
        street: s.street,
        building: s.building,
      },
      region: showLocationText(s),
    });
    closeSelect();
  };
  return (
    <div className="flex-col w-full h-auto max-h-[290px] overflow-auto mt-[2px]">
      {shouldShowProvinces ? (
        <>
          {provinces.map((s, i) => (
            <div
              key={i}
              className="flex text-[#1D1D1D] min-h-[50px] mt-[2px] text-center items-center regual h-[50px] bg-[#F8F8F8] rounded-[12px] pl-[37px]"
              data-cy="Firstly-Search-Result"
              onClick={() => {
                searchAction(s);
              }}
            >
              {s}
            </div>
          ))}
        </>
      ) : (
        searchResults.map((s, i) => (
          <div
            key={i}
            className="flex text-[#1D1D1D] min-h-[50px] mt-[2px] text-center items-center regual h-[50px] bg-[#F8F8F8] rounded-[12px] pl-[37px]"
            data-cy="Firstly-Search-Result"
            onClick={() => {
              select(s);
            }}
          >
            {showLocationText(s)}
          </div>
        ))
      )}
    </div>
  );
};
