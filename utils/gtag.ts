import auth from "services/auth";
import Cookies from "js-cookie";
import { useAppStore } from "store";
export const GA_MEASUREMENT_ID = "G-N8LNVEWJSJ"; // replace with your ID
let countries = [
  { name: "Syria", iso: "sy" },
  { name: "Turkey", iso: "tr" },
  { name: "Iraq", iso: "iq" },
  { name: "Lebanon", iso: "lb" },
];
let countryCode =
  typeof document !== "undefined" &&
  window.location.pathname.split("/")[1].split("-")[0];
let country =
  countryCode &&
  countries.find((s) => s.iso?.toLowerCase() === countryCode?.toLowerCase());
// Track pageview
export const pageview = (url: string) => {
  const { session_id, previous_event_button_name } = useAppStore.getState();
  let userId = auth.UserID() || "empty";

  let bool = confirm(
    `window?.gtag?.("event", "pageview", {
        debug_mode: true,
        page_path: ${url},
        country_name: ${country?.name},
        device_language: ${Cookies.get("language")},
        userID: ${userId},
        session_id: ${session_id},
        previous_event_button_name: ${previous_event_button_name},
        time_stamp: ${new Date().toISOString()},
      })`
  );
  if (bool) {
    navigator.clipboard.writeText(
      `window?.gtag?.("event", "pageview", {
        debug_mode: true,
        page_path: ${url},
        country_name: ${country?.name},
        device_language: ${Cookies.get("language")},
        userID: ${userId},
        session_id: ${session_id},
        previous_event_button_name: ${previous_event_button_name},
        time_stamp: ${new Date().toISOString()},
      })`
    );
  }
  // @ts-ignore
  window?.gtag?.("event", "pageview", {
    debug_mode: true,
    page_path: url,
    country_name: country?.name,
    device_language: Cookies.get("language"),
    userID: userId,
    session_id: session_id,
    previous_event_button_name: previous_event_button_name,
    time_stamp: new Date().toISOString(),
  });
};

// Track custom event
export const event = ({
  action,
  params,
}: {
  action: string;
  params?: Record<string, any>;
}) => {
  const { session_id, previous_event_button_name } = useAppStore.getState();
  let userId = auth.UserID() || "empty";

  let bool = confirm(
    `window?.gtag?.("event", ${action}, {
      debug_mode: true,
      executed_event_name: ${params.value},
      country_name: ${country?.name},
      device_language: ${Cookies.get("language")},
      userID: ${userId},
      session_id: ${session_id},
      previous_event_button_name: ${previous_event_button_name},
      time_stamp:${new Date().toISOString()},
    })`
  );
  if (bool) {
    navigator.clipboard.writeText(
      `window?.gtag?.("event", ${action}, {
        debug_mode: true,
        executed_event_name: ${params.value},
        country_name: ${country?.name},
        device_language: ${Cookies.get("language")},
        userID: ${userId},
        session_id: ${session_id},
        previous_event_button_name: ${previous_event_button_name},
        time_stamp:${new Date().toISOString()},
      })`
    );
  }
  // @ts-ignore
  window?.gtag?.("event", action, {
    debug_mode: true,
    executed_event_name: params.value,
    country_name: country?.name,
    device_language: Cookies.get("language"),
    userID: userId,
    session_id: session_id,
    previous_event_button_name: previous_event_button_name,
    time_stamp: new Date().toISOString(),
  });
};
export const GAevent = ({
  action,
  params,
}: {
  action: string;
  params?: any;
}) => {
  const { session_id, previous_event_button_name } = useAppStore.getState();
  let userId = auth.UserID() || "empty";

  let bool = confirm(
    `window?.gtag?.("event", ${action}, {
        debug_mode: true,
        ${Object.entries(params || {})
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(",\n")},
        country_name: ${country?.name},
        device_language: ${Cookies.get("language")},
        userID: ${userId},
        session_id: ${session_id},
        previous_event_button_name: ${previous_event_button_name},
        time_stamp: ${new Date().toISOString()},
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
        device_language: ${Cookies.get("language")},
        userID: ${userId},
        session_id: ${session_id},
        previous_event_button_name: ${previous_event_button_name},
        time_stamp: ${new Date().toISOString()},
      })`
    );
  }
  // @ts-ignore
  window?.gtag?.("event", action, {
    debug_mode: true,
    ...params,
    country_name: country?.name,
    device_language: Cookies.get("language"),
    userID: userId,
    session_id: session_id,
    previous_event_button_name: previous_event_button_name,
    time_stamp: new Date().toISOString(),
  });
};
export const SetGAUser = (user) => {
  let bool = confirm(
    `window?.gtag?.("set", {
      user_id: ${user.id},
      user_type: ${user.phone === "0" ? "guest" : "registered"},
      user_location: ${country?.name},
      days_age_account: ${user.days_age_account},
    })`
  );
  if (bool) {
    navigator.clipboard.writeText(
      `window?.gtag?.("set", {
        user_id: ${user.id},
        user_type: ${user.phone === "0" ? "guest" : "registered"},
        user_location: ${country?.name},
        days_age_account: ${user.days_age_account},
      })`
    );
  }
  // @ts-ignore
  window?.gtag?.("set", {
    user_id: user.id,
    user_type: user.phone === "0" ? "guest" : "registered",
    user_location: country?.name,
    days_age_account: user.days_age_account,
    gender: user?.gender?.name === "Man" ? "male" : "female",
  });
};
