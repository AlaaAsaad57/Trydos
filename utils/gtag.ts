import { useAppStore } from "store";
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
  { name: "arabic", iso: "ar" },
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
    const { session_id, previous_event_button_name } = useAppStore.getState();

    // @ts-ignore
    window.gtag?.("event", action, {
      debug_mode: true,
      ...params,
      country_name: country?.name,
      device_language: language?.name,

      session_id: session_id,

      timestamp: new Date().toISOString(),
    });
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") {
      let bool = confirm(
        `window.gtag.("event", ${action}, {
        debug_mode: true,
        ${Object.entries(params || {})
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(",\n")},
        country_name: ${country?.name},
        device_language: ${language?.name},
        session_id: ${session_id},
        timestamp: ${new Date().toISOString()},
      })`
      );
      if (bool) {
        navigator.clipboard.writeText(
          `window?.gtag?.("event", ${action}, {
        debug_mode: true,
        ${Object.entries(params || {})
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(",\n")},
        country_name: ${country?.name},
        device_language: ${language?.name},
        session_id: ${session_id},
        timestamp: ${new Date().toISOString()},
      })`
        );
      }
    }
    console.log(`window?.gtag?.("event", ${action}, {
        debug_mode: true,
        ${Object.entries(params || {})
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(",\n")},
        country_name: ${country?.name},
        device_language: ${language?.name},
        session_id: ${session_id},
        timestamp: ${new Date().toISOString()},`);
  } catch (error) {
    console.log(error);
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
