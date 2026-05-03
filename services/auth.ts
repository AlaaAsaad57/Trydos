import { useAppStore } from "store";
import { smartlookIdentify } from "utils/smartlook";
import { _isStoreLastJson, LogError, translateFunction } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";

import StoryService from "services/story";
import home from "./home";
import { GAevent, SetGAUser } from "utils/gtag";

import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";
import { checkWallet } from "./wallet";

// Helper to update user metadata in HttpOnly cookies via server route
async function updateSecureUserData(
  updates: Array<{ name: string; value: unknown }>,
) {
  try {
    await fetch("/api/auth/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
      credentials: "include",
    });
  } catch (err) {
    // Non-critical — store state is the source of truth for client
  }
}

let _expirePromise: Promise<void> | null = null;
let normalizePhone = (phone: string) => {
  return phone.replaceAll("+", "");
};
class AuthService {
  private async getServiceUsersFromCookies() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return { chatUser: null, storiesUser: null };
      }

      const data = await response.json();
      return {
        chatUser: data?.chatUser ?? null,
        storiesUser: data?.storiesUser ?? null,
      };
    } catch (error) {
      return { chatUser: null, storiesUser: null };
    }
  }

  async SendOtp(
    mobilePhone: string,
    is_via_whatsapp: number | string,

    errorCallback: Function,
  ) {
    let msg = "";
    const { setVerificationId, setWrongNumber } = useAppStore.getState();
    try {
      let response = await fetchData({
        url: SEND_OTP,
        method: "POST",
        body: {
          phone: `+${normalizePhone(mobilePhone)}`,
          is_via_whatsapp: is_via_whatsapp,
        },
        server: "market",
        reqTitle: REQUESTS_DATA.SEND_OTP,
      });

      msg = response.message;
      if (!response.success) {
        throw new Error(response.message);
      }
      if (response.data?.verificationId) {
        setVerificationId(response.data.verificationId);
        return response.data.verificationId;
      } else {
        setWrongNumber(msg);
        throw new Error(msg);
      }
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In SendOtp in services/auth",
      });
      errorCallback();
      setWrongNumber(msg);

      throw e;
    }
  }
  async VerifyOtp(
    code: string,
    verficationID: string,
    Username: string,
    EditPhoneFunc: Function,
  ) {
    const { userProfile } = useAppStore.getState();
    let old_geust_id = userProfile?.id;
    const {
      setTempUser,
      setWrongNumber,
      loginFailed,
      loginSuccess,
      loginSuccessChat,
      loginSuccessStories,
      loginSuccessWallet,
      setReAuthResult,
      setShouldAuthinticated,
    } = useAppStore.getState();
    try {
      let response = await fetchData({
        url:
          "/api/auth/login" +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.VERIFY_OTP_FROM_GUEST,
      });

      if (response.code === 501 && !response.success) {
        showErrorNotification(response?.message);
        throw new Error("Wrong Code", response?.message);
      }
      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }
      if (response?.isSuccessful === false && !response.success) {
        throw new Error("Wrong Code", response?.message);
      }
      if (response?.is_failed) {
        LogError({
          source: "login server api",
          userId: response.data?.user?.id,
          error: response.is_failed,
          page: window.location.href,
          url: "/auth/login",
          method: "POST",
          body: response.is_failed,
        });
      }

      // Tokens are now set as HttpOnly cookies by the server route.
      // Only store non-sensitive user data in Zustand.
      checkWallet({
        id: response?.WalletUser?.id,
        handleUnauthenticated: () => {},
      });

      const user = response.data.user;
      if (old_geust_id !== user.id) {
        GAevent({
          action: GA_EVENT_NAMES.CUSTOM_USER_MAPPING,
          params: {
            user_id_guest: old_geust_id,
            user_id_verify: user.id,
          },
        });
      }
      localStorage.removeItem("FBID");
      SetGAUser(user, !response.data.already_exists);
      setTempUser({
        ...user,
        already_exists: response.data.already_exists,
        is_verified: false,
      });

      let userChat = { ...response.ChatUser, need_auth: false };
      let userStories = { ...response.StoriesUser, need_auth: false };
      let userWallet = { ...response.WalletUser, need_auth: false };

      localStorage.setItem("LAST-VERIFY", new Date().toISOString());
      loginSuccess({
        id: user.id,
        idToken: user.id_token,
        name: user.name,
        phone: user.phone,
        image: user.image,
        already_exists: response.data.already_exists,
        is_verified: 1,
        is_phone_verified: 1,
      });
      loginSuccessChat({
        ...userChat,
        is_verified: 1,
        is_phone_verified: 1,
      });
      loginSuccessStories({
        ...userStories,
        is_verified: 1,
        is_phone_verified: 1,
      });
      loginSuccessWallet({
        ...userWallet,
        is_verified: 1,
        is_phone_verified: 1,
      });

      // Signal re-auth completed (used by handleUnauthorized polling)
      setReAuthResult("success");
      setShouldAuthinticated(false);
      if (user) {
        smartlookIdentify(user.id, {
          name: user.name,
          phone: user.mobilePhone,
        });
      }
      try {
        home.getNotificationPermissionStatus();
        home.getClientData();
        if (window.location.pathname.includes("/seller")) {
          window.location.reload();
        }
        // await this.CheckUserName();
      } catch (error) {}
      return [response.data.already_exists, user.name];
    } catch (e) {
      if (e.message === "user not found") {
        setWrongNumber("user not found");
      } else {
        loginFailed();
      }
      LogServerError({
        error: e,
        scenario: "Error In VerifyOtp in services/auth",
      });
      throw e;
    }
  }
  async VerifyOtpForUpdatePhone(code: string, verficationID: string) {
    const { updateUserIsVerified, setWrongNumber } = useAppStore.getState();
    try {
      let response = await fetchData({
        url:
          "/auth/phone/verify_otp" +
          `?verificationId=${verficationID}&otp=${code}`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.VERIFY_OTP,
      });

      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }
      if (response?.isSuccessful === false && !response.success) {
        throw new Error("Wrong Code", response?.message);
      }
      localStorage.setItem("ID-TOKEN", response.data.id_token);
      updateUserIsVerified({ is_phone_verified: 1 });
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: { is_phone_verified: 1 } },
      ]);
      return response.data.id_token;
    } catch (error) {
      setWrongNumber(error.message);
      LogServerError({
        error: error,
        scenario: "Error In VerifyOtpForUpdatePhone in services/auth",
      });
      throw error;
    }
  }
  async UpdateName(name: string) {
    const { updateName, userChat, userStories, userProfile } =
      useAppStore.getState();
    try {
      // Update store immediately for responsive UI
      updateName(name);

      // Update server-side HttpOnly cookies
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: { name } },
        { name: COOKIE_NAMES.USER_CHAT, value: { name } },
        { name: COOKIE_NAMES.USER_STORIES, value: { name } },
      ]);

      let res = await fetchData({
        url: "/customer/update-name",
        body: JSON.stringify({ name }),
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_MARKET,
        method: "POST",
        server: "market",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      let chat_update = await fetchData({
        url: `/api/v1/users/${this.UserID()}`,
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_CHAT,
        method: "PUT",
        server: "chat",
        body: JSON.stringify({ name }),
      });
      if (!chat_update.success) {
        throw new Error(chat_update.message);
      }
      await home.getCustomerInfo();
      let response = await fetchData({
        url: "/api/v1/users/update",
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
        method: "POST",
        server: "stories",
        body: JSON.stringify({ name }),
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      StoryService.getStories();
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In UpdateName in services/auth",
      });
    }
  }

  async cancelAuth(isForExpired?) {
    const { userProfile } = useAppStore.getState();
    if (!userProfile) {
      home.registerForExpire();
    }

    const { cancelAuth } = useAppStore.getState();
    cancelAuth(isForExpired);
  }
  async NotifyForProducts({ id, variant }) {
    if (!variant || variant?.includes("N/A"))
      await home.subscribeToTopic({
        topic: `product_availability_${id}`,
      });
    else
      await home.subscribeToTopic({
        topic: `product_availability_${id}`,
        variant: variant,
      });
  }

  getUser() {
    return useAppStore.getState().userProfile;
  }
  async validateFCMToken() {
    if (!localStorage.getItem("FBID")) return;
    try {
      let res = await fetchData({
        server: "market",
        url: "/firebase_device_tokens/validate_token",
        method: "POST",
        body: JSON.stringify({
          firebase_token_id: localStorage.getItem("FBID"),
        }),
        reqTitle: REQUESTS_DATA.VALIDATE_FCM_TOKEN,
        noMessage: true,
      });
      return res;
    } catch (error) {
      console.log(error);
    }
  }
  UserID() {
    return (
      useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id
    );
  }
  User() {
    return useAppStore.getState().userProfile || useAppStore.getState().user;
  }
  ConfigurePhoto(imageVar, serverVar) {
    if (serverVar === "market") {
      if (imageVar?.includes("customers")) {
        return imageVar.replace("/customers/profile/", "");
      } else {
        return imageVar;
      }
    } else {
      if (imageVar?.includes("customers")) {
        return imageVar;
      } else {
        if (imageVar) return "/customers/profile/" + imageVar;
        else return null;
      }
    }
  }
  async ExpiredUser(noReq = false) {
    const { LoggingOut } = useAppStore.getState();
    if (LoggingOut) return;

    // Deduplicate concurrent 401 handlers — reuse in-flight expire
    if (_expirePromise) return _expirePromise;

    _expirePromise = this._doExpire(noReq);
    try {
      await _expirePromise;
    } finally {
      _expirePromise = null;
    }
  }

  private async _doExpire(noReq: boolean) {
    const { setReAuthResult, setIsRegisteringReady } = useAppStore.getState();

    setIsRegisteringReady(false);

    try {
      if (!noReq) {
        const { country, language } = this._getLocale();
        await fetch("/api/auth/expire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-country": country,
            "x-language": language,
          },
          body: JSON.stringify({ old_user_id: this.UserID() }),
          credentials: "include",
        });
      }

      this.cancelAuth(true);
      setReAuthResult("cancelled");
    } finally {
      setIsRegisteringReady(true);
    }
  }

  _getLocale() {
    const [country, lang] = (
      window.location.pathname.split("/")[1] || ""
    ).split("-");
    return { country: country || "sy", language: lang || "en" };
  }
  async UpdateProfile(userObj, previousUserObj) {
    const {
      userProfile,
      userChat,
      userStories,
      userWallet,
      editUserInfo,
      loginSuccessChat,
      loginSuccessStories,
      loginSuccessWallet,
      language,
    } = useAppStore.getState();
    let market_done = false,
      chat_done = false,
      stories_done = false,
      wallet_done = false;

    try {
      // Update wallet user info
      const nameParts = (userObj?.name ?? userProfile?.name)?.split(" ") || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const phoneNumber = userObj?.phone ?? userProfile?.phone;
      const formattedPhone = phoneNumber?.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      const imagePath = this.getImageForCookie(
        userObj?.image ?? userProfile?.image,
      );
      const profilePictureURL = imagePath
        ? `${process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL}${imagePath}`
        : null;

      let wallet_update = await fetchData({
        url: "/users/me",
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
        method: "PATCH",
        server: "wallet",
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber: formattedPhone,
          profilePictureURL,
          language: language || "en",
        }),
      });

      if (!wallet_update?.success) {
        throw new Error(wallet_update?.message || "Wallet update failed");
      }
      wallet_done = true;

      const walletUpdate = {
        firstName,
        lastName,
        phoneNumber: formattedPhone,
        profilePictureURL,
        language: language || "en",
      };
      loginSuccessWallet(walletUpdate);
      updateSecureUserData([
        { name: COOKIE_NAMES.WALLET_USER, value: walletUpdate },
      ]);

      const {
        chatUser: chatUserFromCookies,
        storiesUser: storiesUserFromCookies,
      } = await this.getServiceUsersFromCookies();
      const effectiveUserStories = userStories ?? storiesUserFromCookies;
      const effectiveUserChat = userChat ?? chatUserFromCookies;

      if (effectiveUserStories) {
        let res = await fetchData({
          url: "/api/v1/users/update",
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
          method: "POST",
          server: "stories",
          body: JSON.stringify({
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "story"),
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        stories_done = true;
        const storiesUpdate = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userObj?.image, "story"),
        };
        loginSuccessStories(storiesUpdate);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_STORIES, value: storiesUpdate },
        ]);
      }

      if (effectiveUserChat) {
        let chat_update = await fetchData({
          url: `/api/v1/users/${this.UserID()}`,
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_CHAT,
          method: "PUT",
          server: "chat",
          body: JSON.stringify({
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
          }),
        });
        if (!chat_update.success) {
          throw new Error(chat_update.message);
        }
        chat_done = true;
        const chatUpdate = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
        };
        loginSuccessChat(chatUpdate);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_CHAT, value: chatUpdate },
        ]);
      }
      let res = await fetchData({
        url: "/customer/update-profile",
        body: JSON.stringify({
          ...userObj,
          image: this.ConfigurePhoto(userObj?.image, "market"),
        }),
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
        method: "POST",
        server: "market",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      market_done = true;
      const marketUpdate = {
        weight: userObj?.weight ?? userProfile?.weight,
        tall: userObj?.tall ?? userProfile?.tall,
        name: userObj?.name ?? userProfile?.name,
        phone: userObj?.phone ?? userProfile?.phone,
        image: this.getImageForCookie(userObj?.image),
      };
      editUserInfo(marketUpdate);
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: marketUpdate },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      return res;
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In UpdateProfile in services/auth",
      });
      if (market_done) {
        let res = await fetchData({
          url: "/customer/update-profile",
          body: userProfile,
          reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
          method: "POST",
          server: "market",
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        const revertMarket = {
          name: userObj?.name ?? userProfile?.name,
          phone: userObj?.phone ?? userProfile?.phone,
          image: this.getImageForCookie(userProfile?.image),
        };
        editUserInfo(revertMarket);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_DATA, value: revertMarket },
        ]);
      }
      // Rollback wallet update
      if (wallet_done) {
        const prevNameParts =
          (previousUserObj?.name ?? userProfile?.name)?.split(" ") || [];
        const prevFirstName = prevNameParts[0] || "";
        const prevLastName = prevNameParts.slice(1).join(" ") || "";

        const prevPhone = previousUserObj?.phone ?? userProfile?.phone;
        const prevFormattedPhone = prevPhone?.startsWith("+")
          ? prevPhone
          : `+${prevPhone}`;

        const prevImagePath = this.getImageForCookie(
          previousUserObj?.image ?? userProfile?.image,
        );
        const prevProfilePictureURL = prevImagePath
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${prevImagePath}`
          : null;

        try {
          await fetchData({
            url: "/users/me",
            reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
            method: "PATCH",
            server: "wallet",
            body: JSON.stringify({
              firstName: prevFirstName,
              lastName: prevLastName,
              phoneNumber: prevFormattedPhone,
              profilePictureURL: prevProfilePictureURL,
              language: useAppStore.getState().language || "en",
            }),
          });

          // Revert wallet state and cookies
          const revertWallet = {
            firstName: prevFirstName,
            lastName: prevLastName,
            phoneNumber: prevFormattedPhone,
            profilePictureURL: prevProfilePictureURL,
            language: useAppStore.getState().language || "en",
          };
          loginSuccessWallet(revertWallet);
          updateSecureUserData([
            { name: COOKIE_NAMES.WALLET_USER, value: revertWallet },
          ]);
        } catch (walletRollbackError) {
          LogServerError({
            error: walletRollbackError,
            scenario: "Error rolling back wallet update in UpdateProfile",
          });
        }
      }

      if (stories_done) {
        let res = await fetchData({
          url: "/api/v1/users/update",
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
          method: "POST",
          server: "stories",
          body: JSON.stringify({
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        const revertStories = {
          name: userProfile?.name,
          mobile_phone: userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "story"),
        };
        loginSuccessStories(revertStories);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_STORIES, value: revertStories },
        ]);
      }
      if (chat_done) {
        let res = await fetchData({
          url: `/api/v1/users/${this.UserID()}`,
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_CHAT,
          method: "PUT",
          server: "chat",
          body: JSON.stringify({
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        const revertChat = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "chat"),
        };
        loginSuccessChat(revertChat);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_CHAT, value: revertChat },
        ]);
      }
      showErrorNotification(translateFunction("Failed to update profile Info"));
      throw error;
    }
  }
  getImageForCookie(image) {
    if (!image?.includes("customers") && image?.length) {
      return "/customers/profile/" + image;
    } else {
      return image;
    }
  }

  async uploadToMediaServer(file: File) {
    const MEDIA_SERVER_BASE_URL =
      process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL?.replace(/\/$/, "") ?? "";
    const MEDIA_API_KEY = process.env.NEXT_PUBLIC_MEDIA_API_KEY ?? "";
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server upload is not configured");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("folder", "customers/profile");

    const uploadUrl = `${MEDIA_SERVER_BASE_URL}/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "x-api-key": MEDIA_API_KEY,
      },
      body: form,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    console.log(data);
    if (!response.ok || !data?.url) {
      return { error: data.error, data: null };
    }

    return {
      url: data.url as string,
      durationSeconds: data?.durationSeconds as number | undefined,
    };
  }
  async UpdateProfileImage(image) {
    try {
      let response = await this.uploadToMediaServer(image);
      if (!response.url) {
        throw new Error("Image upload failed");
      }
      // @ts-ignores
      if (!response.success && response.error) {
        throw new Error(response.error);
      }
      return { sub_path: response.url };
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In UpdateProfileImage in services/auth",
      });
      return null;
    }
  }
  // async CheckUserName() {
  //   const { userChat, userStories, userProfile, userWallet, language } =
  //     useAppStore.getState();

  //   // Skip for guest users
  //   if (userProfile?.name === "verified_guest") return null;

  //   // Helper to normalize phone (remove +, keep only digits)
  //   const normalizePhone = (phone: string | undefined) => {
  //     if (!phone) return "";
  //     return phone.replace(/^\+/, "").replace(/\D/g, "");
  //   };

  //   try {
  //     // Get market data (source of truth)
  //     const marketName = userProfile?.name || "";
  //     const marketPhone = normalizePhone(userProfile?.phone);

  //     let needsUpdate = false;
  //     const updates: {
  //       wallet?: boolean;
  //       chat?: boolean;
  //       stories?: boolean;
  //     } = {};

  //     // Check wallet
  //     if (userWallet) {
  //       const walletName =
  //         `${userWallet.firstName || ""} ${userWallet.lastName || ""}`.trim();
  //       const walletPhone = normalizePhone(userWallet.phoneNumber);

  //       if (walletName !== marketName) {
  //         needsUpdate = true;
  //         updates.wallet = true;
  //       }
  //     }

  //     // Check chat
  //     if (userChat?.id) {
  //       const chatName = userChat?.name || "";
  //       const chatPhone = normalizePhone(userChat?.mobile_phone);

  //       if (chatName !== marketName || chatPhone !== marketPhone) {
  //         needsUpdate = true;
  //         updates.chat = true;
  //       }
  //     }

  //     // Check stories
  //     if (userStories?.id) {
  //       const storiesName = userStories?.name || "";
  //       const storiesPhone = normalizePhone(userStories?.mobile_phone);

  //       if (storiesName !== marketName || storiesPhone !== marketPhone) {
  //         needsUpdate = true;
  //         updates.stories = true;
  //       }
  //     }

  //     // Update if needed
  //     if (needsUpdate) {
  //       const { loginSuccessChat, loginSuccessStories, loginSuccessWallet } =
  //         useAppStore.getState();

  //       // Update local state first for instant UI feedback
  //       if (updates.chat) {
  //         loginSuccessChat({
  //           name: marketName,
  //           mobile_phone: userProfile?.phone,
  //         });
  //       }
  //       if (updates.stories) {
  //         loginSuccessStories({
  //           name: marketName,
  //           mobile_phone: userProfile?.phone,
  //         });
  //       }
  //       if (updates.wallet) {
  //         const nameParts = marketName?.split(" ") || [];
  //         loginSuccessWallet({
  //           firstName: nameParts[0] || "",
  //           lastName: nameParts.slice(1).join(" ") || "",
  //           phoneNumber: userProfile?.phone,
  //         });
  //       }

  //       // Update server-side cookies
  //       const cookieUpdates: Array<{ name: string; value: any }> = [];
  //       if (updates.chat) {
  //         cookieUpdates.push({
  //           name: COOKIE_NAMES.USER_CHAT,
  //           value: { name: marketName, mobile_phone: userProfile?.phone },
  //         });
  //       }
  //       if (updates.stories) {
  //         cookieUpdates.push({
  //           name: COOKIE_NAMES.USER_STORIES,
  //           value: { name: marketName, mobile_phone: userProfile?.phone },
  //         });
  //       }
  //       if (updates.wallet) {
  //         const nameParts = marketName?.split(" ") || [];
  //         cookieUpdates.push({
  //           name: COOKIE_NAMES.WALLET_USER,
  //           value: {
  //             firstName: nameParts[0] || "",
  //             lastName: nameParts.slice(1).join(" ") || "",
  //             phoneNumber: userProfile?.phone,
  //           },
  //         });
  //       }
  //       if (cookieUpdates.length > 0) {
  //         updateSecureUserData(cookieUpdates);
  //       }

  //       // Update all services via UpdateProfile
  //       try {
  //         await this.UpdateProfile(
  //           {
  //             name: marketName,
  //             image: userProfile?.image,
  //           },
  //           {
  //             name: marketName,
  //             image: userProfile?.image,
  //           },
  //         );
  //       } catch (error) {
  //         LogServerError({
  //           error: error,
  //           scenario: "Error In CheckUserName UpdateProfile",
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     LogServerError({
  //       error: error,
  //       scenario: "Error In CheckUserName in services/auth",
  //     });
  //   }
  // }
}
export default new AuthService();
