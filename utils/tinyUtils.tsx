import { useAppStore } from "store";
import { AxiosGet } from "./AxiosApi";
import { translateFunction } from "./functions";
import dynamic from "next/dynamic";

import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { changeToken } from "store/homepage/cachedActions";

export const CielNumber = (price) => {
  return Math.ceil(price * 1000) / 1000;
};
export const getPrice = (num, lang, currency, decimal = 0) => {
  let rateVariable = currency?.exchange_rate;
  let price = parseFloat(num);
  price = parseFloat((price * rateVariable).toFixed(decimal));

  if (price >= 1000000) {
    return CielNumber(price / 1000000) + translateFunction("M", lang); // For millions
  } else if (price >= 100000) {
    return CielNumber(price / 1000) + translateFunction("K", lang); // For thousands
  } else {
    return price; // For prices under 1000
  }
};
export const configureSearchParams = ({
  searchParams,
  noFilters,
  noProducts,
  lang,
  offset,
  boutiqueId,
  filters_offset = null,
}): URLSearchParams => {
  let params = new URLSearchParams();
  params.set("lang", lang);
  params.set("limit", "10");
  if (filters_offset && filters_offset !== "") {
    params.set("filters_offset", filters_offset);
  }
  if (offset && offset !== "false") {
    params.set("offset", `[${offset}]`);
  }
  if (noProducts && noProducts !== "false") {
    params.set("with_products", "false");
  }
  if (noFilters && noFilters !== "false") {
    params.set("with_filters", "false");
  }
  if (searchParams.search_text) {
    params.set("search_text", searchParams.search_text);
  }
  if (searchParams.categories) {
    params.set("category_slugs", decodeURIComponent(searchParams.categories));
  }
  if (searchParams.prices) {
    params.set("price", decodeURIComponent(searchParams.prices));
  }
  if (searchParams.sizes) {
    params.set(
      "attributes",
      JSON.stringify([
        {
          id: 1,
          options: JSON.parse(decodeURIComponent(searchParams.sizes)),
          name: "Size",
        },
      ])
    );
  }
  if (searchParams.colors) {
    params.set("colors", decodeURIComponent(searchParams.colors));
  }
  if (searchParams.brands) {
    params.set("brand_slugs", decodeURI(searchParams.brands));
  }
  if (searchParams.boutiques && searchParams.boutiques !== "null") {
    params.set("boutique_slugs", decodeURIComponent(searchParams.boutiques));
  }
  if (boutiqueId && boutiqueId !== "listing" && boutiqueId !== "null") {
    params.set("boutique_slugs", `["${decodeURIComponent(boutiqueId)}"]`);
  }
  if (searchParams.tags_names && searchParams.tags_names !== "null") {
    params.set("tags_names", decodeURIComponent(searchParams.tags_names));
  }
  // console.log(
  //   `params: ${decodeURIComponent(params.toString())} ${JSON.stringify(
  //     searchParams
  //   )}`
  // );

  return params;
};
export const GetFilterUrlParams = ({
  boutiqueId,
  searchParams: filtersSearchParams,
}) => {
  let searchFilters, searchFiltersEdit;
  if (filtersSearchParams?.get("categories")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      categories: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("categories"))
      )?.map((s) => ({ slug: s })),
    };
  }
  if (filtersSearchParams?.get("brands")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      brands: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("brands"))
      ).map((s) => ({ slug: s })),
    };
  }
  if (filtersSearchParams?.get("colors")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      colors: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("colors"))
      ),
    };
  }
  if (filtersSearchParams?.get("sizes")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      sizes: JSON.parse(decodeURIComponent(filtersSearchParams?.get("sizes"))),
    };
  }
  if (filtersSearchParams?.get("prices")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      prices: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("prices"))
      ),
    };
  }
  if (
    boutiqueId === "listing" &&
    filtersSearchParams?.get("boutiques")?.length > 0
  ) {
    searchFilters = {
      ...searchFilters,
      boutiques: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("boutiques"))
      ).map((s) => ({ slug: s })),
    };
  }
  if (boutiqueId !== "listing") {
    searchFilters = {
      ...searchFilters,
      boutiques: JSON.parse(decodeURIComponent(`["${boutiqueId}"]`)).map(
        (s) => ({
          slug: s,
        })
      ),
    };
  }
  if (filtersSearchParams?.search_text?.length > 0) {
    searchFilters = {
      ...searchFilters,
      search_text: filtersSearchParams?.search_text,
    };
  }

  if (searchFilters?.categories && searchFilters.categories.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      categories: JSON.stringify(searchFilters.categories.map((s) => s.slug)),
    };
  }
  if (searchFilters?.brands && searchFilters.brands.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      brands: JSON.stringify(searchFilters.brands.map((s) => s.slug)),
    };
  }
  if (searchFilters?.boutiques && searchFilters.boutiques.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      boutiques: JSON.stringify(searchFilters.boutiques.map((s) => s.slug)),
    };
  }
  if (searchFilters?.colors && searchFilters.colors.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      colors: JSON.stringify(searchFilters.colors.map((s) => s)),
    };
  }
  if (searchFilters?.sizes && searchFilters.sizes.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      sizes: JSON.stringify(searchFilters.sizes.map((s) => s)),
    };
  }
  if (searchFilters?.prices?.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      prices: JSON.stringify(searchFilters?.prices?.map((s) => s)),
    };
  }
  if (searchFilters?.search_text?.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      search_text: searchFilters?.search_text,
    };
  }
  let requestSearchParams = new URLSearchParams();
  if (searchFiltersEdit && Object.keys(searchFiltersEdit)?.length > 0) {
    requestSearchParams.set("searchParams", JSON.stringify(searchFiltersEdit));
  }
  requestSearchParams.set("noProducts", "true");
  return requestSearchParams;
};
export const ChatConroller = (payload) => {
  const { openChat, setChatOpen } = useAppStore.getState();
  if (payload) document.documentElement.style.overflow = "hidden";
  else document.documentElement.style.overflow = "initial";
  window.history.pushState({ isPopup: true }, "open Chat");
  openChat(payload);
  setChatOpen(payload);
};
export const getCurrency = async ({ callback }) => {
  let currency = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile/home/currency",
    title: "Currency Request",
  });
  //
  callback({ currency: currency?.currency, res: {} });
  return currency?.currency;
};
export const FlagIcon = ({ iso }) => {
  let FlagSy = dynamic(() => import(`public/svg/sy.svg`));
  if (iso.toLowerCase() === "sy") return <FlagSy />;

  return <img src={`/svg/flag/${iso?.toLowerCase()}.svg`} alt={iso} />;
};
export const formatTime = (timeString: string) => {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(timeString + "Z");

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const timeFormat = `${hours}:${minutes}:${seconds}`;

  if (date.toDateString() === today.toDateString()) {
    return `Today | ${timeFormat}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday | ${timeFormat}`;
  }

  const isSameYear = date.getFullYear() === today.getFullYear();
  const isNewerThanToday = date > today;

  if (isSameYear && isNewerThanToday) {
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    return `${day} ${monthName}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year} | ${timeFormat}`;
};
export const UnAuthintacetedAction = () => {
  const { setAddStory } = useAppStore.getState();
  changeToken({ key: "token", deleteOption: true });
  changeToken({ key: "MARKET-TOKEN", deleteOption: true });
  changeToken({ key: "DEVICE-TOKEN", deleteOption: true });
  localStorage.removeItem("USER-STORIES");
  localStorage.removeItem("USER-CHAT");
  localStorage.setItem("guest-user", localStorage.getItem("USER"));
  localStorage.removeItem("USER");
  localStorage.removeItem("STORIES-TOKEN");
  localStorage.removeItem("CHAT-TOKEN");
  setAddStory(false);
  Cookies.remove("token");
  ChatConroller(false);
  toast.info(
    translateFunction("Session Expired..please Login again..Reloading...")
  );
  setTimeout(() => {
    window.location.reload();
  }, 5000);
};
