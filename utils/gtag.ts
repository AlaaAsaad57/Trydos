import auth from "services/auth";
import { useAppStore } from "store";
import { COOKIE_NAMES, getCookie, UserData } from "./cookies/cookie-manager";
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; // replace with your ID
let countries = [
  { name: "Syria", iso: "sy" },
  { name: "Turkey", iso: "tr" },
  { name: "Iraq", iso: "iq" },
  { name: "Lebanon", iso: "lb" },
];
let languages = [
  { name: "English", iso: "en" },
  { name: "Turkish", iso: "tr" },
  { name: "Arabic" , iso: "ar" },
  { name: "  "     , iso: "kd"},
];
let countryCode =
  typeof document !== "undefined" &&
  window.location.pathname.split("/")[1].split("-")[0];
let LangCode =
  typeof document !== "undefined" &&
  window.location.pathname.split("/")[1].split("-")[1];
let country =
  countryCode &&
  countries.find((s) => s.iso?.toLowerCase() === countryCode?.toLowerCase());
let language =
  LangCode &&
  languages.find((s) => s.iso?.toLowerCase() === LangCode?.toLowerCase());

export const GAevent = ({
  action,
  params,
}: {
  action: string;
  params?: any;
}) => {
  try {
    let event_id = new Date().getTime();
    const { session_id, previous_event_button_name } = useAppStore.getState();
    const userData = getCookie(COOKIE_NAMES.USER_DATA);
    if (userData) {
      SetGAUser(userData, false);
    }
    let user_param = getUserParam();
    // @ts-ignore
    window.gtag?.("event", action, {
      debug_mode: true,
      ...params,
      country_name: country?.name,
      device_language: language?.name,
      event_id: event_id,
      session_id: session_id,
      device_type: getDeviceCategory(),
      operating_system: getOperatingSystem(),
      timestamp_now: new Date().toISOString(),
      platform_source: "WEB",
      ...user_param,
    });

    console.log(`window?.gtag?.("event", ${action}, {
        debug_mode: true,
        ${Object.entries(params || {})
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(",\n")},
      country_name: ${country?.name},
      device_language: ${language?.name},
      event_id:${event_id},
      session_id: ${session_id},
      device_type: ${getDeviceCategory()},
      operating_system: ${getOperatingSystem()},
      timestamp_now: ${new Date().toISOString()},
      platform_source: WEB,
      ${Object.entries(user_param || {})
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(",\n")},`);
  } catch (error) {
    console.log(error);
  }
};
const getUserParam = () => {
  const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
  if (
    userData.phone === "0" ||
    !userData.phone ||
    userData.is_phone_verified === 0
  ) {
    return {
      user_id_guest: userData.id,
    };
  } else {
    return {
      user_id_verify: userData.id,
    };
  }
};
export const SetGAUser = (user, isNewUser = false) => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") {
    let bool = confirm(
      `window?.gtag?.("set", {
      user_id: ${user.id},
      user_type: ${
        user.phone === "0" ? "guest" : isNewUser ? "new" : "registered"
      },
      user_location: ${country?.name},
      days_age_account: ${getAccountAge(user)},
    gender: ${user?.gender?.name === "Man" ? "male" : "female"},

    })`
    );
    if (bool) {
      navigator.clipboard.writeText(
        `window?.gtag?.("set", {
        user_id: ${user.id},
        user_type: ${
          user.phone === "0" ? "guest" : isNewUser ? "new" : "registered"
        },
        user_location: ${country?.name},
        days_age_account: ${getAccountAge(user)},
    gender: ${user?.gender?.name === "Man" ? "male" : "female"},
        
      })`
      );
    }
  }
  // @ts-ignore
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    user_id: user.id,
  });
  // @ts-ignore
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    user_id: user.id,
    user_type: user.phone === "0" ? "guest" : isNewUser ? "new" : "registered",
    user_location: country?.name,
    days_age_account: getAccountAge(user),
    gender: user?.gender?.name === "Man" ? "male" : "female",
  });
  // @ts-ignore
  window.gtag?.("set", {
    user_id: user.id,
  });

  // @ts-ignore
  window?.gtag?.("set", "user_properties", {
    user_type: user.phone === "0" ? "guest" : isNewUser ? "new" : "registered",
    user_location: country?.name,
    days_age_account: getAccountAge(user),
    gender: user?.gender?.name === "Man" ? "male" : "female",
  });
};
const getAccountAge = (user) => {
  const now = new Date();
  const accountCreatedAt = new Date(user.created_at);
  const diffTime = Math.abs(now.getTime() - accountCreatedAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
const getDeviceCategory = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for tablet first (more specific)
  if (
    userAgent.includes("ipad") ||
    userAgent.includes("tablet") ||
    (userAgent.includes("android") && !userAgent.includes("mobile")) ||
    userAgent.includes("kindle") ||
    userAgent.includes("silk") ||
    userAgent.includes("playbook") ||
    userAgent.includes("bb10") ||
    userAgent.includes("rim tablet")
  ) {
    return "tablet";
  }

  // Check for mobile devices
  if (
    userAgent.includes("mobile") ||
    userAgent.includes("iphone") ||
    userAgent.includes("ipod") ||
    userAgent.includes("android") ||
    userAgent.includes("blackberry") ||
    userAgent.includes("windows phone") ||
    userAgent.includes("palm") ||
    userAgent.includes("webos") ||
    userAgent.includes("symbian") ||
    userAgent.includes("fennec") ||
    userAgent.includes("maemo") ||
    userAgent.includes("minimo") ||
    userAgent.includes("plucker") ||
    userAgent.includes("xiino")
  ) {
    return "mobile";
  }

  // Default to desktop
  return "desktop";
};

const getOperatingSystem = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for mobile operating systems first
  if (userAgent.includes("android")) {
    return "Android";
  }

  if (
    userAgent.includes("iphone") ||
    userAgent.includes("ipad") ||
    userAgent.includes("ipod") ||
    userAgent.includes("ios")
  ) {
    return "iOS";
  }

  // Check for desktop operating systems
  if (userAgent.includes("windows")) {
    return "Windows";
  }

  if (
    userAgent.includes("mac os x") ||
    userAgent.includes("macos") ||
    userAgent.includes("macintosh")
  ) {
    return "Macintosh";
  }

  if (
    userAgent.includes("linux") ||
    userAgent.includes("ubuntu") ||
    userAgent.includes("debian") ||
    userAgent.includes("fedora") ||
    userAgent.includes("centos") ||
    userAgent.includes("unix")
  ) {
    return "Linux";
  }

  // Check for other mobile/tablet OS
  if (
    userAgent.includes("blackberry") ||
    userAgent.includes("webos") ||
    userAgent.includes("palm") ||
    userAgent.includes("symbian") ||
    userAgent.includes("windows phone") ||
    userAgent.includes("windows mobile")
  ) {
    return "Other Mobile";
  }

  // Default fallback
  return "Unknown";
};
