import React, { useState, useEffect } from "react";
import { FIREBASE_SETTINGS_URL } from "utils/endpointConfig";
import { LogError, translateFunction } from "utils/functions";
import home from "services/home";
import NotificationsTest from "components/global/NotificationsTest";

import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { useAppStore } from "store";

// App design tokens (see docs/DESIGN-LANGUAGE.md)
const PRIMARY = "#5b3fe0"; // primary action / selected state
const TRACK_OFF = "#d9d9de"; // disabled/off surface

const SettingsModal = ({ onClose, lang }) => {
  const language = Array.isArray(lang) ? lang[0] : lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  // Local translate helper — every label went through this same call before.
  const t = (key: string) => translateFunction(key, language);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">(
    "notifications",
  );
  const [profileData, setProfileData] = useState<any>({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [fbSettings, setFBSetting] = useState<any>(null);
  const [unsubscribedTopics, setUnsubscribedTopics] = useState<string[]>([]);
  const [SelectValue, setSelectValue] = useState("");

  // Handle mounting and localStorage access
  useEffect(() => {
    setMounted(true);
    const User = useAppStore.getState().userProfile;
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
          firebase_settings.unsubscribed_topics.map((s) => s.topic),
        );
      }
    } catch (err) {
      LogError({
        error: err,
        scenario: "InitTopics in SettingModal",
      });
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
            noMessage: true,
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
        LogError({
          error: error,
          scenario: "handleUnsubscribe in SettingModal",
          topic: topic,
        });
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
            noMessage: true,
          });
          // @ts-ignore
          if (!res.success) {
            throw new Error(res.message);
          }
          const updatedTopics = [...topics, topic];
          const updatedUnsubscribedTopics = unsubscribedTopics.filter(
            (t: string) => t !== topic,
          );

          setTopics(updatedTopics);
          setUnsubscribedTopics(updatedUnsubscribedTopics);
        } else {
          console.error("Failed to subscribe to topic");
        }
      } catch (error) {
        LogError({
          error: error,
          scenario: "handleSubscribe in SettingModal",
          topic: topic,
        });
        console.error("Error subscribing to topic:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Functional update so back-to-back toggles never read a stale snapshot,
  // and so reverting after a failed save restores the previous value cleanly.
  const changeNotificationPreferences = (payload) => {
    setFBSetting((prev) => ({ ...(prev || {}), ...payload }));
  };

  // Optimistically flip a channel, persist, and roll back on failure.
  const togglePreference = async (
    key: "email" | "firebase" | "whatsapp",
    url: string,
  ) => {
    if (loading) return;
    const previous = fbSettings?.[key] === 1 ? 1 : 0;
    const next = previous === 1 ? 0 : 1;

    changeNotificationPreferences({ [key]: next });
    setLoading(true);
    const ok = await home.EditNotificationSettings({
      url,
      body: { [key]: next },
    });
    if (!ok) {
      // Save failed — put the toggle back where it was.
      changeNotificationPreferences({ [key]: previous });
    }
    setLoading(false);
  };

  // Same optimistic-with-rollback contract for the frequency select.
  const changeFrequency = async (value: string) => {
    if (loading) return;
    const previous = SelectValue;

    setSelectValue(value);
    setLoading(true);
    const ok = await home.EditNotificationSettings({
      url: "update_notification_frequency",
      body: { notification_frequency: value },
    });
    if (!ok) {
      setSelectValue(previous);
    }
    setLoading(false);
  };

  const SectionLabel = ({ children, ...rest }: any) => (
    <div
      className="text-[12px] medium text-[#707070] px-1 mt-5 mb-2"
      {...rest}
    >
      {children}
    </div>
  );

  const Toggle = ({ on, onClick, dataCy }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={loading}
      onClick={onClick}
      data-cy={dataCy}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait`}
      style={{ backgroundColor: on ? PRIMARY : TRACK_OFF }}
    >
      <span
        className={`absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all duration-200 ${
          on
            ? "ltr:left-[23px] rtl:right-[23px]"
            : "ltr:left-[3px] rtl:right-[3px]"
        }`}
      />
    </button>
  );

  const tabBtn = (tab: "notifications" | "preferences") =>
    `flex-1 h-[38px] px-2 whitespace-nowrap overflow-hidden text-ellipsis rounded-full text-[13px] transition-all duration-200 ${
      activeTab === tab
        ? "bg-white medium shadow-[0_3px_10px_rgba(0,0,0,0.1)]"
        : "text-[#707070]"
    }`;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="w-full font-sans text-[#3c3c3c]"
    >
      <div className="modal-content w-full bg-white rounded-[15px] shadow-[0_3px_10px_rgba(0,0,0,0.1)] p-4 mt-2">
        {/* Segmented tabs */}
        <div className="flex gap-1 bg-[#f2f2f2] rounded-full p-1 mb-1">
          <button
            className={tabBtn("notifications")}
            style={
              activeTab === "notifications" ? { color: PRIMARY } : undefined
            }
            onClick={() => handleTabChange("notifications")}
          >
            {t("Notifications Settings")}
          </button>
          <button
            className={tabBtn("preferences")}
            style={
              activeTab === "preferences" ? { color: PRIMARY } : undefined
            }
            onClick={() => handleTabChange("preferences")}
          >
            {t("Notification Test")}
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {activeTab === "notifications" && (
            <div className="notifications-tab">
              {/* Subscribed topics */}
              {topics?.length > 0 ? (
                <>
                  <SectionLabel data-cy="Notifications-Can-Enabled">
                    {t("Enabled Notifications Topic:")}
                  </SectionLabel>
                  <ul
                    className="space-y-2 max-h-[240px] overflow-y-auto pr-1"
                    data-cy="Children-off-Notifications-Can-Enabled"
                  >
                    {topics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-[#f8f8f8] rounded-[15px] px-4 h-[50px]"
                        data-cy="NotificationsItem-Can-Enabled"
                      >
                        <span
                          className="text-[14px] text-[#3c3c3c]"
                          data-cy="typeof-subscribing"
                        >
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="rounded-full bg-[#fdecec] text-[#f85555] text-[12px] medium px-3 py-[6px] transition-opacity disabled:opacity-50 disabled:cursor-wait"
                          data-cy="ButtonToEnabled-NotificationsItem"
                          disabled={loading}
                          onClick={() => handleUnsubscribe(topic)}
                        >
                          {loading
                            ? t("Unsubscribing...")
                            : t("Unsubscribe")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p
                  className="text-center text-[#929191] text-[14px] py-6"
                  data-cy="NoTopics-Subscribe"
                >
                  {loadingTopics
                    ? t("Loading Topics...")
                    : t("No topics subscribed.")}
                </p>
              )}

              {/* Unsubscribed topics */}
              {unsubscribedTopics?.length > 0 && (
                <div>
                  <SectionLabel data-cy="Notifications-Can-Disenabled">
                    {t("Disabled Notifications Topic:")}
                  </SectionLabel>
                  <ul
                    className="space-y-2 max-h-[240px] overflow-y-auto pr-1"
                    data-cy="Children-off-Notifications-Can-Disenabled"
                  >
                    {unsubscribedTopics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-[#f8f8f8] rounded-[15px] px-4 h-[50px]"
                        data-cy="NotificationsItem-Can-Disenabled"
                      >
                        <span
                          className="text-[14px] text-[#3c3c3c]"
                          data-cy="typeof-unsubscribing"
                        >
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="rounded-full text-[12px] medium px-3 py-[6px] transition-opacity disabled:opacity-50 disabled:cursor-wait"
                          style={{ backgroundColor: "#efecfc", color: PRIMARY }}
                          data-cy="ButtonToDisenabled-NotificationsItem"
                          disabled={loading}
                          onClick={() => handleSubscribe(topic)}
                        >
                          {loading ? t("Subscribing...") : t("Subscribe")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notification channels */}
              <SectionLabel data-cy="notifications-subscription">
                {t("notifications subscription:")}
              </SectionLabel>
              <div className="flex-col w-full space-y-2">
                <div
                  className="flex items-center bg-[#f8f8f8] rounded-[15px] px-4 h-[56px] gap-3"
                  data-cy="notifications-subscription-item"
                >
                  <img
                    src="/icons/mail.svg"
                    className="h-[26px] w-[26px]"
                    data-cy="mail-icon"
                  />
                  <span
                    className="flex-1 text-[14px] text-[#3c3c3c]"
                    data-cy="statement-mail"
                  >
                    {t("Enable Email Notifications")}
                  </span>
                  <Toggle
                    on={fbSettings?.email === 1}
                    dataCy="checkbox-mail"
                    onClick={() => togglePreference("email", "update_email")}
                  />
                </div>

                <div className="flex items-center bg-[#f8f8f8] rounded-[15px] px-4 h-[56px] gap-3">
                  <img
                    src="/icons/FireBase.svg"
                    className="h-[26px] w-[26px]"
                  />
                  <span className="flex-1 text-[14px] text-[#3c3c3c]">
                    {t("Enable FireBase Notifications")}
                  </span>
                  <Toggle
                    on={fbSettings?.firebase === 1}
                    dataCy="checkbox-firebase"
                    onClick={() =>
                      togglePreference("firebase", "update_firebase")
                    }
                  />
                </div>

                <div className="flex items-center bg-[#f8f8f8] rounded-[15px] px-4 h-[56px] gap-3">
                  <img
                    src="/icons/whatsappNotification.svg"
                    className="h-[26px] w-[26px]"
                  />
                  <span className="flex-1 text-[14px] text-[#3c3c3c]">
                    {t("Enable WhatsApp Notifications")}
                  </span>
                  <Toggle
                    on={fbSettings?.whatsapp === 1}
                    dataCy="checkbox-whatsapp"
                    onClick={() =>
                      togglePreference("whatsapp", "update_whatsapp")
                    }
                  />
                </div>

                <div className="flex items-center bg-[#f8f8f8] rounded-[15px] px-4 h-[56px] gap-3">
                  <img
                    src="/icons/CalenderIcon.svg"
                    className="h-[26px] w-[26px]"
                  />
                  <span className="flex-1 text-[14px] text-[#3c3c3c]">
                    {t("notifications Receiving Preference:")}
                  </span>
                  <select
                    className="rounded-full bg-white border border-[#e6e6e6] text-[13px] text-[#3c3c3c] px-3 py-[6px] outline-none focus:border-[#5b3fe0] disabled:opacity-60 disabled:cursor-wait"
                    value={SelectValue}
                    disabled={loading}
                    onChange={(e) => changeFrequency(e.target.value)}
                  >
                    <option value="">{t("Select An Option")}</option>
                    <option value="daily">{t("daily")}</option>
                    <option value="weekly">{t("weekly")}</option>
                    <option value="monthly">{t("monthly")}</option>
                  </select>
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
