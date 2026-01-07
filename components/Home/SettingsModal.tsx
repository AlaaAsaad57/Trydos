import React, { useState, useEffect } from "react";
import { FIREBASE_SETTINGS_URL } from "utils/endpointConfig";
import { translateFunction } from "utils/functions";
import FirebasIcon from "public/svg/FireBase";
import MailIcon from "public/svg/mail";
import WhatsIcon from "public/svg/whatsappNotification";
import CalenderIcon from "public/svg/CalenderIcon";
import home from "services/home";
import NotificationsTest from "components/global/NotificationsTest";

import { fetchData } from "utils/fetchData";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { REQUESTS_DATA } from "utils/Requests";

const SettingsModal = ({ onClose, lang }) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">(
    "notifications"
  );
  const [profileData, setProfileData] = useState<any>({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [fbSettings, setFBSetting] = useState(null);
  const [unsubscribedTopics, setUnsubscribedTopics] = useState<string[]>([]);

  // Handle mounting and localStorage access
  useEffect(() => {
    setMounted(true);
    const User = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    // Set initial tab from hash if mounted
    const hash = window.location.hash.slice(1) as
      | "notifications"
      | "preferences";
    if (["notifications", "preferences"].includes(hash)) {
      setActiveTab(hash);
    }

    // Set profile data if user is authenticated
    if (User) {
      const userData = User;
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    }
  }, []);

  // Handle hash changes
  useEffect(() => {
    if (!mounted) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as
        | "notifications"
        | "preferences";
      if (["notifications", "preferences"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [mounted]);

  const handleTabChange = (tab: "notifications" | "preferences") => {
    if (!mounted) return;
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const InitTopics = async () => {
    setLoading(true);
    setLoadingTopics(true);
    try {
      let response = await fetchData({
        url: FIREBASE_SETTINGS_URL,
        reqTitle: REQUESTS_DATA.GET_FIREBASE_SETTINGS_REQUEST,
        server: "market",
        method: "GET",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      let firebase_settings = response?.data?.firebase_settings;
      setFBSetting(firebase_settings);
      setSelectValue(firebase_settings?.notification_frequency || "");
      if (firebase_settings.subscribed_topics) {
        setTopics(firebase_settings.subscribed_topics.map((s) => s.topic));
      }

      if (firebase_settings.unsubscribed_topics) {
        setUnsubscribedTopics(
          firebase_settings.unsubscribed_topics.map((s) => s.topic)
        );
      }
    } catch (err) {
      console.error("the error is :", err);
      setFBSetting(null);
      setSelectValue("");
      setTopics([]);
    } finally {
      setLoading(false);
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    InitTopics();
  }, []);

  const formatTopicName = (topic: string) => {
    const topicName = topic.replace(/_[a-z]{2}_[a-z]{2}$/, "");
    return topicName.replace(/_/g, " ");
  };

  const handleUnsubscribe = async (topic: string) => {
    if (!loading) {
      setLoading(true);
      try {
        let token = localStorage.getItem("FB-DEVICE-TOKEN");

        if (token) {
          let res = await fetchData({
            url: "/firebase_device_tokens/unsubscribe_topic",
            body: JSON.stringify({
              topic: topic.replace(/_[a-z]{2}_[a-z]{2}$/, ""),
            }),
            reqTitle: REQUESTS_DATA.STORE_FIREBASE_UNSUBSCRIBE_TOPIC,
            method: "POST",
            server: "market",
          });
          if (!res.success) {
            throw new Error(res.message);
          }
          const updatedTopics = topics.filter((t) => t !== topic);
          const updatedUnsubscribedTopics = [...unsubscribedTopics, topic];

          setTopics(updatedTopics);
          setUnsubscribedTopics(updatedUnsubscribedTopics);
        } else {
          console.error("Failed to unsubscribe from topic");
        }
      } catch (error) {
        console.error("Error unsubscribing from topic:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubscribe = async (topic: string) => {
    if (!loading) {
      setLoading(true);
      try {
        let token = localStorage.getItem("FB-DEVICE-TOKEN");

        if (token) {
          let res = await fetchData({
            url: "/firebase_device_tokens/subscribe_topic",
            body: JSON.stringify({
              topic: topic.replace(/_[a-z]{2}_[a-z]{2}$/, ""),
            }),
            reqTitle: REQUESTS_DATA.STORE_FIREBASE_SUBSCRIBE_TOPIC,
            method: "POST",
            server: "market",
          });
          // @ts-ignore
          if (!res.success) {
            throw new Error(res.message);
          }
          const updatedTopics = [...topics, topic];
          const updatedUnsubscribedTopics = unsubscribedTopics.filter(
            (t: string) => t !== topic
          );

          setTopics(updatedTopics);
          setUnsubscribedTopics(updatedUnsubscribedTopics);
        } else {
          console.error("Failed to subscribe to topic");
        }
      } catch (error) {
        console.error("Error subscribing to topic:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("modal-overlay")) {
      onClose();
    }
  };

  const changeNotificationPreferences = (payload) => {
    setFBSetting({
      ...fbSettings,
      ...payload,
    });
  };

  const changeSetting = async ({ url, body, past }) => {
    if (!loading) {
      setLoading(true);
      try {
        await home.EditNotificationSettings({ url, body });
      } catch (error) {
        past();
        setLoading(false);
      }
      setLoading(false);
    }
  };

  const [SelectValue, setSelectValue] = useState(
    fbSettings?.notification_frequency || ""
  );

  return (
    <div
      className={`${
        loading && "opacity-30 cursor-wait"
      } bg-opacity-50 flex justify-center items-start px-[20px] w-full pb-[200px]`}
      onClick={handleOutsideClick}
    >
      <div
        className="modal-content bg-white rounded-lg shadow-lg w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="tabs flex justify-between border-b mb-4">
          <button
            className={`tab ${
              activeTab === "notifications"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            } py-2 px-4`}
            onClick={() => handleTabChange("notifications")}
          >
            {translateFunction(
              "Notifications Settings",
              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
            )}
          </button>
          <button
            className={`tab ${
              activeTab === "preferences"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            } py-2 px-4`}
            onClick={() => handleTabChange("preferences")}
          >
            {translateFunction(
              "Notification Test",
              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
            )}
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {activeTab === "notifications" && (
            <div className="notifications-tab mt-2">
              {topics?.length > 0 ? (
                <>
                  <span
                    className="w-full flex text-[#1d1d1d] medium py-3 px-1 bg-gray-100 rounded-md"
                    data-cy="Notifications-Can-Enabled"
                  >
                    {translateFunction(
                      "Enabled Notifications Topic:",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </span>
                  <ul
                    className="space-y-2 max-h-[280px] overflow-scroll p-2"
                    data-cy="Children-off-Notifications-Can-Enabled"
                  >
                    {topics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-2 rounded"
                        data-cy="NotificationsItem-Can-Enabled"
                      >
                        <span
                          className="text-gray-700"
                          data-cy="typeof-subscribing"
                        >
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="text-red-500 hover:text-red-700"
                          data-cy="ButtonToEnabled-NotificationsItem"
                          disabled={loading}
                          onClick={() => handleUnsubscribe(topic)}
                        >
                          {loading
                            ? translateFunction(
                                "Unsubscribing...",
                                Array.isArray(lang)
                                  ? lang[0]
                                  : lang.split("-")[1]
                              )
                            : translateFunction(
                                "Unsubscribe",
                                Array.isArray(lang)
                                  ? lang[0]
                                  : lang.split("-")[1]
                              )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-500" data-cy="NoTopics-Subscribe">
                  {loadingTopics
                    ? translateFunction(
                        "Loading Topics...",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )
                    : translateFunction(
                        "No topics subscribed.",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                </p>
              )}

              {/* Unsubscribed topics */}
              {unsubscribedTopics?.length > 0 && (
                <div className="mt-4">
                  <p
                    className="w-full flex text-[#1d1d1d] medium py-3 px-1 bg-gray-100 rounded-md"
                    data-cy="Notifications-Can-Disenabled"
                  >
                    {translateFunction(
                      "Disabled Notifications Topic:",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </p>
                  <ul
                    className="space-y-2 max-h-[280px] overflow-scroll"
                    data-cy="Children-off-Notifications-Can-Disenabled"
                  >
                    {unsubscribedTopics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-2 rounded"
                        data-cy="NotificationsItem-Can-Disenabled"
                      >
                        <span
                          className="text-gray-700"
                          data-cy="typeof-unsubscribing"
                        >
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          data-cy="ButtonToDisenabled-NotificationsItem"
                          disabled={loading}
                          onClick={() => handleSubscribe(topic)}
                        >
                          {loading
                            ? translateFunction(
                                "Subscribing...",
                                Array.isArray(lang)
                                  ? lang[0]
                                  : lang.split("-")[1]
                              )
                            : translateFunction(
                                "Subscribe",
                                Array.isArray(lang)
                                  ? lang[0]
                                  : lang.split("-")[1]
                              )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="preferences-tab py-2 rounded-md mt-2">
                <div className="flex-col w-full text-[#1d1d1d]">
                  <div
                    className="w-full flex text-[#1d1d1d] medium py-3 px-1 bg-gray-100 rounded-md"
                    data-cy="notifications-subscription"
                  >
                    {translateFunction(
                      "notifications subscription:",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </div>
                  <div
                    className="flex-row my-1 items-center p-2 cursor-pointer bg-gray-100 rounded-md h-[50px]"
                    data-cy="notifications-subscription-item"
                    onClick={() => {
                      if (fbSettings?.email === 0) {
                        changeSetting({
                          url: "update_email",
                          body: { email: 1 },
                          past: changeNotificationPreferences({ email: 0 }),
                        });
                        changeNotificationPreferences({ email: 1 });
                      } else {
                        changeSetting({
                          url: "update_email",
                          body: { email: 0 },
                          past: changeNotificationPreferences({ email: 1 }),
                        });
                        changeNotificationPreferences({ email: 0 });
                      }
                    }}
                  >
                    <MailIcon className="h-[30px]" data-cy="mail-icon" />
                    <span className="ml-2" data-cy="statement-mail">
                      {translateFunction(
                        "Enable Email Notifications",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    </span>
                    <input
                      id="helper-checkbox"
                      data-cy="checkbox-mail"
                      checked={fbSettings?.email === 1}
                      value=""
                      onChange={() => {}}
                      aria-describedby="helper-checkbox-text"
                      type="checkbox"
                      className="ml-3 appearance-auto accent-[#71a4f8] w-5 h-5 text-blue-600 bg-gray-100 rounded-sm"
                    />
                  </div>
                  <div
                    className="flex-row my-1 items-center p-2 cursor-pointer bg-gray-100 rounded-md h-[50px]"
                    onClick={() => {
                      if (fbSettings?.firebase === 0) {
                        changeSetting({
                          url: "update_firebase",
                          body: { firebase: 1 },
                          past: changeNotificationPreferences({ firebase: 0 }),
                        });
                        changeNotificationPreferences({ firebase: 1 });
                      } else {
                        changeSetting({
                          url: "update_firebase",
                          body: { firebase: 0 },
                          past: changeNotificationPreferences({ firebase: 1 }),
                        });
                        changeNotificationPreferences({ firebase: 0 });
                      }
                    }}
                  >
                    <FirebasIcon className="h-[30px]" />
                    <span className="ml-2">
                      {translateFunction(
                        "Enable FireBase Notifications",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    </span>
                    <input
                      id="helper-checkbox"
                      checked={fbSettings?.firebase === 1}
                      value=""
                      onChange={() => {}}
                      aria-describedby="helper-checkbox-text"
                      type="checkbox"
                      className="ml-3 appearance-auto accent-[#71a4f8] w-5 h-5 text-blue-600 bg-gray-100 rounded-sm"
                    />
                  </div>
                  <div
                    className="flex-row my-1 items-center p-2 cursor-pointer bg-gray-100 rounded-md h-[50px]"
                    onClick={() => {
                      if (fbSettings?.whatsapp === 0) {
                        changeSetting({
                          url: "update_whatsapp",
                          body: { whatsapp: 1 },
                          past: changeNotificationPreferences({ whatsapp: 0 }),
                        });
                        changeNotificationPreferences({ whatsapp: 1 });
                      } else {
                        changeSetting({
                          url: "update_whatsapp",
                          body: { whatsapp: 0 },
                          past: changeNotificationPreferences({ whatsapp: 1 }),
                        });
                        changeNotificationPreferences({ whatsapp: 0 });
                      }
                    }}
                  >
                    <WhatsIcon className="h-[30px]" />
                    <span className="ml-2">
                      {translateFunction(
                        "Enable WhatsApp Notifications",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    </span>
                    <input
                      id="helper-checkbox"
                      checked={fbSettings?.whatsapp === 1}
                      onChange={() => {}}
                      value=""
                      aria-describedby="helper-checkbox-text"
                      type="checkbox"
                      className="ml-3 appearance-auto accent-[#71a4f8] w-5 h-5 text-blue-600 bg-gray-100 rounded-sm"
                    />
                  </div>
                  <div className="flex-row items-center bg-gray-100 rounded-md p-3 h-[50px]">
                    <CalenderIcon />
                    <div className="ml-3">
                      {translateFunction(
                        "notifications Receiving Preference:",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                      <select
                        className="ml-2"
                        value={SelectValue}
                        onChange={(e) => {
                          changeSetting({
                            url: "update_notification_frequency",
                            body: { notification_frequency: e.target.value },
                            past: setSelectValue(SelectValue),
                          });
                          setSelectValue(e.target.value);
                        }}
                      >
                        <option value="">
                          {translateFunction(
                            "Select An Option",
                            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                          )}
                        </option>
                        <option value="daily">
                          {translateFunction(
                            "daily",
                            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                          )}
                        </option>
                        <option value="weekly">
                          {translateFunction(
                            "weekly",
                            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                          )}
                        </option>
                        <option value="monthly">
                          {translateFunction(
                            "monthly",
                            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                          )}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "preferences" && <NotificationsTest />}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
