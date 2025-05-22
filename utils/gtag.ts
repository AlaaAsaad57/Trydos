import auth from "services/auth";
import Cookies from "js-cookie";
import { useAppStore } from "store";
export const GA_MEASUREMENT_ID = "G-N8LNVEWJSJ"; // replace with your ID

// Track pageview
export const pageview = (url: string) => {
  const { session_id, previous_event_button_name } = useAppStore.getState();
  let userId = auth.UserID() || "empty";

  //   let bool = confirm(
  //     JSON.stringify({
  //       event: "pageview",
  //       page_path: url,
  //       country_name: Cookies.get("country"),
  //       device_language: Cookies.get("language"),
  //       userID: userId,
  //       session_id: session_id,
  //       previous_event_button_name: previous_event_button_name,
  //       time_stamp: new Date().toISOString(),
  //     })
  //   );
  //   if (bool) {
  //     navigator.clipboard.writeText(
  //       JSON.stringify({
  //         event: "pageview",
  //         page_path: url,
  //         country_name: Cookies.get("country"),
  //         device_language: Cookies.get("language"),
  //         userID: userId,
  //         session_id: session_id,
  //         previous_event_button_name: previous_event_button_name,
  //         time_stamp: new Date().toISOString(),
  //       })
  //     );
  //   }
  // @ts-ignore
  window?.gtag?.("event", "pageview", {
    debug_mode: true,
    page_path: url,
    country_name: Cookies.get("country"),
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

  //   let bool = confirm(
  //     JSON.stringify({
  //       event: params.event,
  //       executed_event_name: params.value,
  //       country_name: Cookies.get("country"),
  //       device_language: Cookies.get("language"),
  //       userID: userId,
  //       session_id: session_id,
  //       previous_event_button_name: previous_event_button_name,
  //       time_stamp: new Date().toISOString(),
  //     })
  //   );
  //   if (bool) {
  //     navigator.clipboard.writeText(
  //       JSON.stringify({
  //         event: params.event,
  //         executed_event_name: params.value,
  //         country_name: Cookies.get("country"),
  //         device_language: Cookies.get("language"),
  //         userID: userId,
  //         session_id: session_id,
  //         previous_event_button_name: previous_event_button_name,
  //         time_stamp: new Date().toISOString(),
  //       })
  //     );
  //   }
  // @ts-ignore
  window?.gtag?.("event", action, {
    debug_mode: true,
    executed_event_name: params.value,
    country_name: Cookies.get("country"),
    device_language: Cookies.get("language"),
    userID: userId,
    session_id: session_id,
    previous_event_button_name: previous_event_button_name,
    time_stamp: new Date().toISOString(),
  });
};
