import React, { useState, useEffect } from "react";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { FIREBASE_SETTINGS_URL } from "utils/endpointConfig";
import { translateFunction } from "utils/functions";

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">(
    "notifications"
  );

  const [topics, setTopics] = useState<string[]>([]);
  const [fbSettings, setFBSetting] = useState(null);
  const [unsubscribedTopics, setUnsubscribedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const InitTopics = async () => {
    setLoadingTopics(true);
    let { firebase_settings } = await AxiosGet({
      url: process.env.NEXT_PUBLIC_BACKEND_URL + FIREBASE_SETTINGS_URL,
      title: "get firebase settings request",
    });
    setFBSetting(firebase_settings);

    if (firebase_settings.subscribed_topics) {
      setTopics(firebase_settings.subscribed_topics.map((s) => s.topic));
    }

    if (firebase_settings.unsubscribed_topics) {
      setUnsubscribedTopics(
        firebase_settings.unsubscribed_topics.map((s) => s.topic)
      );
    }
    setLoadingTopics(false);
  };
  useEffect(() => {
    InitTopics();
  }, []);

  const formatTopicName = (topic: string) => {
    // Remove the last part (country and language code, e.g., '_sy_en')
    const topicName = topic.replace(/_[a-z]{2}_[a-z]{2}$/, "");
    // Replace underscores with spaces
    return topicName.replace(/_/g, " ");
  };

  const handleUnsubscribe = async (topic: string) => {
    setLoading(true);
    try {
      let token = localStorage.getItem("FB-DEVICE-TOKEN");

      if (token) {
        await AxiosPost({
          url:
            process.env.NEXT_PUBLIC_BACKEND_URL +
            "/firebase_device_tokens/unsubscribe_topic",
          body: {
            topic: topic.replace(/_[a-z]{2}_[a-z]{2}$/, ""),
          },
          title: "store firebase unsubscribe topic",
        });
        // Remove topic from localStorage after unsubscribing
        const updatedTopics = topics.filter((t) => t !== topic);
        const updatedUnsubscribedTopics = [...unsubscribedTopics, topic];

        setTopics(updatedTopics); // Update the state
        setUnsubscribedTopics(updatedUnsubscribedTopics); // Update unsubscribed topics state
      } else {
        console.error("Failed to unsubscribe from topic");
      }
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (topic: string) => {
    setLoading(true);
    try {
      let token = localStorage.getItem("FB-DEVICE-TOKEN");

      if (token) {
        await AxiosPost({
          url:
            process.env.NEXT_PUBLIC_BACKEND_URL +
            "/firebase_device_tokens/subscribe_topic",
          body: {
            topic: topic.replace(/_[a-z]{2}_[a-z]{2}$/, ""),
          },
          title: "store firebase topic",
        });
        // Add the topic back to the subscribed list
        const updatedTopics = [...topics, topic];
        const updatedUnsubscribedTopics = unsubscribedTopics.filter(
          (t: string) => t !== topic
        );

        setTopics(updatedTopics); // Update the state
        setUnsubscribedTopics(updatedUnsubscribedTopics); // Update unsubscribed topics state
      } else {
        console.error("Failed to subscribe to topic");
      }
    } catch (error) {
      console.error("Error subscribing to topic:", error);
    } finally {
      setLoading(false);
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
  const [SelectValue, setSelectValue] = useState("");
  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-[50px]"
      onClick={handleOutsideClick}
    >
      <div
        className="modal-content bg-white rounded-lg shadow-lg w-[288] p-4"
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
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </button>
          <button
            className={`tab ${
              activeTab === "preferences"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            } py-2 px-4`}
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {activeTab === "notifications" && (
            <div className="notifications-tab">
              {topics?.length > 0 ? (
                <ul className="space-y-2 max-h-[200px] overflow-scroll">
                  {topics.map((topic, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-gray-100 p-2 rounded"
                    >
                      <span className="text-gray-700">
                        {formatTopicName(topic)}
                      </span>
                      <button
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                        onClick={() => handleUnsubscribe(topic)}
                      >
                        {loading ? "Unsubscribing..." : "Unsubscribe"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">
                  {loadingTopics
                    ? "Loading Topics..."
                    : "No topics subscribed."}
                </p>
              )}

              {/* Unsubscribed topics */}
              {unsubscribedTopics?.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-500">Unsubscribed Topics:</p>
                  <ul className="space-y-2 max-h-[200px] overflow-scroll">
                    {unsubscribedTopics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-gray-100 p-2 rounded"
                      >
                        <span className="text-gray-700">
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          disabled={loading}
                          onClick={() => handleSubscribe(topic)}
                        >
                          {loading ? "Subscribing..." : "Subscribe"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {activeTab === "preferences" && (
            <div className="preferences-tab">
              <div className="flex-col w-full text-[#1d1d1d]">
                <div className="flex">
                  {translateFunction("notifications subscription:")}
                </div>
                <div
                  className="flex-row items-center p-2 cursor-pointer"
                  onClick={() => {
                    if (fbSettings?.email === 0) {
                      changeNotificationPreferences({ email: 1 });
                    } else {
                      changeNotificationPreferences({ email: 0 });
                    }
                  }}
                >
                  <input
                    defaultChecked={fbSettings?.email === 1}
                    checked={fbSettings?.email === 1}
                    value=""
                    id="helper-checkbox"
                    aria-describedby="helper-checkbox-text"
                    type="checkbox"
                    className="appearance-auto accent-[#71a4f8] w-5 h-5 text-blue-600 bg-gray-100 rounded-sm"
                  />
                  <span className="ml-2">
                    {translateFunction("Enable Email Notifications")}
                  </span>
                </div>
                <div
                  className="flex-row items-center p-2 cursor-pointer"
                  onClick={() => {
                    if (fbSettings?.firebase === 0) {
                      changeNotificationPreferences({ firebase: 1 });
                    } else {
                      changeNotificationPreferences({ firebase: 0 });
                    }
                  }}
                >
                  <label>
                    <input
                      id="helper-checkbox"
                      defaultChecked={fbSettings?.firebase === 1}
                      checked={fbSettings?.firebase === 1}
                      value=""
                      aria-describedby="helper-checkbox-text"
                      type="checkbox"
                      className="appearance-auto accent-[#71a4f8] w-5 h-5 text-blue-600 bg-gray-100  rounded-sm "
                    />
                  </label>
                  <span className="ml-2">
                    {translateFunction("Enable FireBase Notifications")}
                  </span>
                </div>
                <div
                  className="flex-row items-center p-2 cursor-pointer"
                  onClick={() => {
                    if (fbSettings?.whatsapp === 0) {
                      changeNotificationPreferences({ whatsapp: 1 });
                    } else {
                      changeNotificationPreferences({ whatsapp: 0 });
                    }
                  }}
                >
                  <input
                    id="helper-checkbox"
                    defaultChecked={fbSettings?.whatsapp === 1}
                    checked={fbSettings?.whatsapp === 1}
                    aria-describedby="helper-checkbox-text"
                    value=""
                    type="checkbox"
                    className="appearance-auto accent-[#71a4f8] w-5 h-5 text-blue-600 bg-gray-100  rounded-sm  "
                  />
                  <span className="ml-2">
                    {translateFunction("Enable WhatsApp Notifications")}
                  </span>
                </div>
                <div className="flex-row items-center">
                  {translateFunction("notifications Receiving Preference:")}
                  <div className="ml-2">
                    <select
                      className=""
                      value={SelectValue}
                      onChange={(e) => {
                        setSelectValue(e.target.value);
                      }}
                    >
                      <option className="">
                        {translateFunction("Select An Option")}
                      </option>
                      <option className="" value={"daily"}>
                        {translateFunction("daily")}
                      </option>
                      <option className="" value={"weekly"}>
                        {translateFunction("weekly")}
                      </option>
                      <option className="" value={"monthly"}>
                        {translateFunction("monthly")}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
