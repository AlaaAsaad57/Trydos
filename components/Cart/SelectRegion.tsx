import { useState } from "react";
import { getLang, translateFunction } from "utils/functions";
import TargetIcon from "public/svg/cart/Target.svg";
import { useParams } from "next/navigation";
import { allCountries } from "country-telephone-data";
import Flag from "react-world-flags";
import { useDispatch, useSelector } from "react-redux";
import { DebounceInput } from "react-debounce-input";
import Spinner from "components/global/Spinner";
import { GetAddressByTextApi } from "models/Api";
import Cookies from "js-cookie";
function SelectRegion({ closeSelect }) {
  const { lang } = useParams();
  // @ts-ignore
  let country = lang.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0].name,
    iso: country,
  };
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );
  const showRegion = () => {
    return (
      <>
        <div className={`flex text-[#1D1D1D] text-[14px] regular`}>
          {country.name}
        </div>

        <div
          className={`flex ${
            !addressDetails.region_details.province
              ? "text-[#D3D3D3]"
              : "text-[#1D1D1D]"
          }  text-[14px] regular`}
        >
          <span className="px-1">|</span>
          {addressDetails.region_details.province || "Province"}
        </div>
        <div
          className={`flex ${
            !addressDetails.region_details.city
              ? "text-[#D3D3D3]"
              : "text-[#1D1D1D]"
          }  text-[14px] regular`}
        >
          <span className="px-1">|</span>
          {addressDetails.region_details.city || "Town"}
        </div>
        <div
          className={`flex ${
            !addressDetails.region_details.town
              ? "text-[#D3D3D3]"
              : "text-[#1D1D1D]"
          }  text-[14px] regular`}
        >
          <span className="px-1">|</span>
          {addressDetails.region_details.town || "Suburb"}
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className="absolute top-[50px]  left-0 min-w-[100vw] z-[999999998] min-h-[100vh] opacity-40 bg-[black]"
        onClick={() => {
          closeSelect();
        }}
      />
      <div className="flex-col items-center px-[12px] bottom-0  absolute z-[999999999] rounded-t-[30px] bg-[#fff] h-[441px] w-full pt-[19px]">
        <div className="flex-row items-center w-full justify-center">
          <TargetIcon />
          <span className="flex regular ml-[6px] text-[#1D1D1D] text-[14px]">
            {translateFunction("Select From List")}
          </span>
        </div>
        <div className="flex-row items-center w-full justify-center mt-[11px]">
          <span className="min-h-[16px] w-[23px]">
            <Flag height={"15"} code={country.iso} />
          </span>

          <div className="flex-row ml-[8px]">{showRegion()}</div>
        </div>
        <SearchLocations
          closeSelect={() => {
            closeSelect();
          }}
        />
      </div>
    </>
  );
}

export default SelectRegion;

const SearchLocations = ({ closeSelect }) => {
  const { lang } = useParams();
  // @ts-ignore
  const [country, language] = lang.split("-");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const getHeader = () => {
    let [countryUrl, languageUrl] = window.location.pathname
      .split("/")[1]
      .split("-");
    return {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
      },
      headers: {
        Authorization: `Bearer ${
          localStorage.getItem("MARKET-TOKEN") ||
          localStorage.getItem("DEVICE-TOKEN")
        }`,
        lang: getLang(languageUrl, Cookies.get("language")),
        country: countryUrl || Cookies.get("country"),
        accept: "application/json",
      },
    };
  };
  const searchAction = async (val) => {
    setLoading(true);
    await fetch(
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
        `/api/addresses/get-address-by-text`,
      {
        method: "POST",
        headers: {
          ...getHeader().headers,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query: val }),
      }
    ).then(async (data) => {
      let repo: GetAddressByTextApi = await data.json();
      setSearchResults(repo.results || []);
    });
    setLoading(false);
  };
  return (
    <>
      <div className="relative flex w-full mt-[21px]">
        <svg
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
            <clipPath id="clip-path">
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
            clipPath="url(#clip-path)"
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
          minLength={2}
          onChange={(e) => {
            searchAction(e.target.value);
          }}
          onInput={(e) => {}}
          placeholder={translateFunction(
            "Search Province | District | Town | Street"
          )}
          className="pl-[47px] pr-[15px] border-none outline-none flex rounded-[12px] bg-[#F8F8F8] regular text-[#1D1D1D] w-full h-[40px]"
          debounceTimeout={400}
        />
      </div>
      <SearchResults
        closeSelect={() => {
          closeSelect();
        }}
        searchResults={searchResults}
      />
    </>
  );
};

const SearchResults = ({ searchResults, closeSelect }) => {
  const showLocationText = (location) => {
    let str = "";
    if (location.country) str += location.country;
    if (location.province) str += ` | ${location.province}`;
    if (location.city) str += ` | ${location.city}`;
    if (location.town) str += ` | ${location.town}`;
    if (location.street) str += ` | ${location.street}`;
    if (location.building) str += ` | ${location.building}`;
    return str;
  };
  const dispatch = useDispatch();
  const select = (s) => {
    let a = { lat: s.coordinates?.lat, lng: s.coordinates?.lon };
    if (a.lat && a.lng) dispatch({ type: "MAP-CENTER", payload: a });
    dispatch({
      type: "set-address-details",
      payload: {
        region_details: {
          city: s.city,
          province: s.province,
          town: s.town,
          street: s.street,
          building: s.building,
        },
        region: showLocationText(s),
      },
    });
    closeSelect();
  };
  return (
    <div className="flex-col w-full h-auto max-h-[290px] overflow-auto mt-[2px]">
      {searchResults.map((s, i) => (
        <div
          key={i}
          className="flex text-[#1D1D1D] min-h-[50px] mt-[2px] text-center items-center regual h-[50px] bg-[#F8F8F8] rounded-[12px] pl-[37px]"
          onClick={() => {
            select(s);
          }}
        >
          {showLocationText(s)}
        </div>
      ))}
    </div>
  );
};
