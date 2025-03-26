import React, { useState, useEffect } from "react";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { FIREBASE_SETTINGS_URL } from "utils/endpointConfig";
import { translateFunction } from "utils/functions";
import FirebasIcon from "public/svg/FireBase.svg";
import MailIcon from "public/svg/mail.svg";
import WhatsIcon from "public/svg/whatsappNotification.svg";
import CalenderIcon from "public/svg/CalenderIcon.svg";
import UserIcon from "public/svg/user.svg";
import PlusIcon from "public/svg/chatplus.svg";
import profilePng from "public/images/profileNo.png";

import PhoneIcon from "public/svg/phone.svg";
import EditIcon from "public/svg/edit.svg";

import home from "services/home";
import NotificationsTest from "components/global/NotificationsTest";

interface SettingsModalProps {
  onClose: () => void;
  lang: string | string[];
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  photo?: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, lang }) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "notifications" | "preferences" | "profile"
  >("notifications");
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
  });
  const [isEditing, setIsEditing] = useState<keyof ProfileData | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [fbSettings, setFBSetting] = useState(null);
  const [unsubscribedTopics, setUnsubscribedTopics] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle mounting and localStorage access
  useEffect(() => {
    setMounted(true);
    const guestUser = localStorage.getItem("guest-user");
    const authenticatedUser = localStorage.getItem("USER");
    setIsGuestUser(!!guestUser);
    setIsAuthenticatedUser(!!authenticatedUser);

    // Set initial tab from hash if mounted
    const hash = window.location.hash.slice(1) as
      | "notifications"
      | "preferences"
      | "profile";
    if (["notifications", "preferences", "profile"].includes(hash)) {
      setActiveTab(hash);
    }

    // Set profile data if user is authenticated
    if (guestUser || authenticatedUser) {
      const userDataString = guestUser || authenticatedUser || "{}";
      const userData = JSON.parse(userDataString) as ProfileData;
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
      setProfilePhoto(userData.photo || null);
    }
  }, []);

  // Handle hash changes
  useEffect(() => {
    if (!mounted) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as
        | "notifications"
        | "preferences"
        | "profile";
      if (["notifications", "preferences", "profile"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [mounted]);

  const handleTabChange = (
    tab: "notifications" | "preferences" | "profile"
  ) => {
    if (!mounted) return;
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const validateField = (field: keyof ProfileData, value: string): string => {
    switch (field) {
      case "name":
        if (!value.trim())
          return translateFunction(
            "Name is required",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        if (value.length < 2)
          return translateFunction(
            "Name must be at least 2 characters",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        if (value.length > 50)
          return translateFunction(
            "Name must be less than 50 characters",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        return "";

      case "email":
        if (!value.trim())
          return translateFunction(
            "Email is required",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value))
          return translateFunction(
            "Please enter a valid email address",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        return "";

      case "phone":
        if (!value.trim())
          return translateFunction(
            "Phone number is required",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(value))
          return translateFunction(
            "Please enter a valid phone number",
            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
          );
        return "";

      default:
        return "";
    }
  };

  const handleEdit = (field: keyof ProfileData) => {
    setIsEditing(field);
    setEditValue(profileData[field]);
    setValidationErrors({}); // Clear errors when starting to edit
  };

  const handleSave = async (field: keyof ProfileData) => {
    const error = validateField(field, editValue);
    if (error) {
      setValidationErrors({ [field]: error });
      return;
    }

    if (!loading) {
      setLoading(true);
      try {
        const endpoint = "/customer/update-profile";
        await AxiosPost({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + `/${endpoint}`,
          body: { [field]: editValue },
          title: `Update ${field}`,
        });

        // Update local storage
        // @ts-ignore
        const userData = JSON.parse(isGuestUser || isAuthenticatedUser || "{}");
        userData[field] = editValue;
        localStorage.setItem(
          isGuestUser ? "guest-user" : "user",
          JSON.stringify(userData)
        );

        // Update state
        setProfileData((prev) => ({ ...prev, [field]: editValue }));
        setIsEditing(null);
        setValidationErrors({}); // Clear errors on successful save
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        setValidationErrors({ [field]: "Failed to update. Please try again." });
      } finally {
        setLoading(false);
      }
    }
  };

  const InitTopics = async () => {
    setLoading(true);
    setLoadingTopics(true);
    let { firebase_settings } = await AxiosGet({
      url: process.env.NEXT_PUBLIC_BACKEND_URL + FIREBASE_SETTINGS_URL,
      title: "get firebase settings request",
    });
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
    setLoadingTopics(false);
    setLoading(false);
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
          await AxiosPost({
            url:
              process.env.NEXT_PUBLIC_BACKEND_URL +
              "/firebase_device_tokens/unsubscribe_topic",
            body: {
              topic: topic.replace(/_[a-z]{2}_[a-z]{2}$/, ""),
            },
            title: "store firebase unsubscribe topic",
          });
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
          await AxiosPost({
            url:
              process.env.NEXT_PUBLIC_BACKEND_URL +
              "/firebase_device_tokens/subscribe_topic",
            body: {
              topic: topic.replace(/_[a-z]{2}_[a-z]{2}$/, ""),
            },
            title: "store firebase topic",
          });
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

  const getFieldIcon = (field: keyof ProfileData) => {
    switch (field) {
      case "name":
        return <UserIcon className="h-5 w-5" />;
      case "email":
        return <MailIcon className="h-5 w-5" />;
      case "phone":
        return <PhoneIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert(
        translateFunction(
          "Please upload an image file",
          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
        )
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(
        translateFunction(
          "File size should be less than 5MB",
          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
        )
      );
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);

        // Update local storage
        const userData = JSON.parse(
          isGuestUser
            ? localStorage.getItem("guest-user") || "{}"
            : localStorage.getItem("USER") || "{}"
        );
        userData.photo = base64String;
        localStorage.setItem(
          isGuestUser ? "guest-user" : "USER",
          JSON.stringify(userData)
        );
      };
      reader.readAsDataURL(file);

      // Here you would typically upload the file to your server
      // await uploadPhotoToServer(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert(
        translateFunction(
          "Failed to upload photo",
          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    const userData = JSON.parse(
      isGuestUser
        ? localStorage.getItem("guest-user") || "{}"
        : localStorage.getItem("USER") || "{}"
    );
    delete userData.photo;
    localStorage.setItem(
      isGuestUser ? "guest-user" : "USER",
      JSON.stringify(userData)
    );
  };

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
          <button
            className={`tab ${
              activeTab === "profile"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            } ${
              !isGuestUser && !isAuthenticatedUser
                ? "opacity-50 cursor-not-allowed"
                : ""
            } py-2 px-4`}
            onClick={() =>
              (isGuestUser || isAuthenticatedUser) && handleTabChange("profile")
            }
            disabled={!isGuestUser && !isAuthenticatedUser}
          >
            {translateFunction(
              "Profile",
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
                  <span className="w-full flex text-[#1d1d1d] medium py-3 px-1 bg-gray-100 rounded-md">
                    {translateFunction(
                      "Enabled Notifications Topic:",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </span>
                  <ul className="space-y-2 max-h-[280px] overflow-scroll p-2">
                    {topics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-2 rounded"
                      >
                        <span className="text-gray-700">
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="text-red-500 hover:text-red-700"
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
                <p className="text-gray-500">
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
                  <p className="w-full flex text-[#1d1d1d] medium py-3 px-1 bg-gray-100 rounded-md">
                    {translateFunction(
                      "Disabled Notifications Topic:",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </p>
                  <ul className="space-y-2 max-h-[280px] overflow-scroll">
                    {unsubscribedTopics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-2 rounded"
                      >
                        <span className="text-gray-700">
                          {formatTopicName(topic)}
                        </span>
                        <button
                          className="text-blue-500 hover:text-blue-700"
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
                  <div className="w-full flex text-[#1d1d1d] medium py-3 px-1 bg-gray-100 rounded-md">
                    {translateFunction(
                      "notifications subscription:",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </div>
                  <div
                    className="flex-row my-1 items-center p-2 cursor-pointer bg-gray-100 rounded-md h-[50px]"
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
                    <MailIcon className="h-[30px]" />
                    <span className="ml-2">
                      {translateFunction(
                        "Enable Email Notifications",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    </span>
                    <input
                      id="helper-checkbox"
                      checked={fbSettings?.email === 1}
                      defaultChecked={fbSettings?.email === 1}
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
          {activeTab === "profile" && (
            <div className="profile-tab mt-4 px-4">
              {isGuestUser || isAuthenticatedUser ? (
                <div className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50  shadow-lg transition-all duration-300 hover:shadow-xl">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt={translateFunction(
                              "Profile Photo",
                              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                            )}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50">
                            <img
                              src={profilePng.src}
                              width={100}
                              height={100}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-[20px] w-[50px] h-[50px]  right-[10px] transform translate-x-1/4 translate-y-1/4 text-white p-1 flex items-center justify-center rounded-full  transition-colors     rtl:left-0 rtl:right-auto rtl:-translate-x-1/4"
                        title={translateFunction(
                          "Change Profile Photo",
                          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                        )}
                        aria-label={translateFunction(
                          "Change Profile Photo",
                          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                        )}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                      {profilePhoto && (
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rtl:left-0 rtl:right-auto rtl:-translate-x-1/2"
                          title={translateFunction(
                            "Remove Photo",
                            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                          )}
                          aria-label={translateFunction(
                            "Remove Photo",
                            Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                          )}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      aria-label={translateFunction(
                        "Upload Profile Photo",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    />
                    <p className="mt-4 text-sm text-gray-500 font-medium">
                      {translateFunction(
                        profilePhoto ? "Change Photo" : "Upload Photo",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {translateFunction(
                        "JPG, PNG or GIF (max. 5MB)",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}
                    </p>
                  </div>

                  {/* Existing profile fields */}
                  {Object.entries(profileData).map(([field, value]) => (
                    <div
                      key={field}
                      className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg">
                          {getFieldIcon(field as keyof ProfileData)}
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block mb-1.5">
                            {translateFunction(
                              field,
                              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                            )}
                          </span>
                          {isEditing === field ? (
                            <div className="w-full">
                              <input
                                type={field === "email" ? "email" : "text"}
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value);
                                  const error = validateField(
                                    field as keyof ProfileData,
                                    e.target.value
                                  );
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [field]: error,
                                  }));
                                }}
                                className={`w-full px-4 py-2 border ${
                                  validationErrors[field as keyof ProfileData]
                                    ? "border-red-500"
                                    : "border-gray-200"
                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                placeholder={translateFunction(
                                  `Enter ${field}`,
                                  Array.isArray(lang)
                                    ? lang[0]
                                    : lang.split("-")[1]
                                )}
                              />
                              {validationErrors[field as keyof ProfileData] && (
                                <p className="text-red-500 text-sm mt-1">
                                  {validationErrors[field as keyof ProfileData]}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-900 font-medium">
                              {value ||
                                translateFunction(
                                  "Not set",
                                  Array.isArray(lang)
                                    ? lang[0]
                                    : lang.split("-")[1]
                                )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-[16px]">
                        {isEditing === field ? (
                          <>
                            <button
                              onClick={() =>
                                handleSave(field as keyof ProfileData)
                              }
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading}
                            >
                              {loading
                                ? translateFunction(
                                    "Saving...",
                                    Array.isArray(lang)
                                      ? lang[0]
                                      : lang.split("-")[1]
                                  )
                                : translateFunction(
                                    "Save",
                                    Array.isArray(lang)
                                      ? lang[0]
                                      : lang.split("-")[1]
                                  )}
                            </button>
                            <button
                              onClick={() => setIsEditing(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {translateFunction(
                                "Cancel",
                                Array.isArray(lang)
                                  ? lang[0]
                                  : lang.split("-")[1]
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              handleEdit(field as keyof ProfileData)
                            }
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title={translateFunction(
                              "Edit",
                              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                            )}
                          >
                            <EditIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {translateFunction(
                      "Please sign in or continue as guest to view and edit your profile",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
