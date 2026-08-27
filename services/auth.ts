import { useAppStore } from "store";
import { posthogIdentify } from "utils/posthog";
import { _isStoreLastJson, LogError, translateFunction } from "utils/functions";
import { sendOtpAction } from "serverActions/sendOtp";
import { lockNumber, recordSessionNumber } from "utils/otpLocks";

import StoryService from "services/story";
import home from "./home";
import { GAevent, SetGAUser } from "utils/gtag";
import {
  ORDER_EVENTS,
  resolveVerifyFlowSource,
  trackOrder,
} from "utils/orderFunnel";

import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { fetchAuthMe } from "utils/authMe";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";
import { checkWallet } from "./wallet";
import { GetTicket } from "utils/UploadUtils";

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

/**
 * Result of an expire cycle.
 * - `renewed`: the server's last-chance refresh saved the session — no nuke.
 * - `wasVerified`: the session that WAS nuked belonged to a phone-verified
 *   shopper, so the caller should wait for an immediate re-verification rather
 *   than let them continue as an anonymous guest.
 */
export interface ExpireOutcome {
  renewed: boolean;
  wasVerified: boolean;
}

let _expirePromise: Promise<ExpireOutcome> | null = null;
// Deduplicate concurrent refresh calls (mirrors _expirePromise): parallel 401s
// on one page load share a single /api/auth/refresh round trip (AC-12).
//
// Keyed BY SERVICE. Each service owns a separate token pair (MARKET / CHAT /
// STORIES) and /api/auth/refresh exchanges only the pair named in the body, so
// one shared promise made the losers of a race inherit a rotation that never
// touched their cookie: a stories 401 arriving just after a market 401 got
// `{eligible: true}` back without a stories exchange, retried with the same
// dead token and fell through to the OTP prompt. Market and market-dashboard
// share the MARKET pair, so they legitimately share one key.
type RefreshResult = { refreshed: boolean; eligible: boolean };
const _refreshPromises = new Map<string, Promise<RefreshResult>>();
const refreshKeyFor = (server?: string) =>
  server === "chat" || server === "stories" || server === "comments"
    ? server
    : "market";
class AuthService {
  private async getServiceUsersFromCookies() {
    const data = await fetchAuthMe();
    return {
      chatUser: data?.chatUser ?? null,
      storiesUser: data?.storiesUser ?? null,
    };
  }

  async SendOtp(
    mobilePhone: string,
    is_via_whatsapp: number | string,

    errorCallback: Function,
  ) {
    let msg = "";
    const { setVerificationId, setWrongNumber } = useAppStore.getState();
    try {
      // Routed through a Server Action (serverActions/sendOtp): the OTP endpoint
      // never appears in the Network tab, and the Redis rate limit + same-origin
      // checks run server-side before the backend is ever called.
      const response = await sendOtpAction({
        phone: mobilePhone,
        isWhatsapp: is_via_whatsapp,
      });

      msg = response.message;

      if (response.success && response.verificationId) {
        setVerificationId(response.verificationId);
        // Mirror the server lock client-side so the button stays disabled and
        // the cooldown survives back/forward navigation.
        //
        // Unless the number is on the server's test-number allowlist: the
        // server counted nothing and locked nothing for it, so mirroring a lock
        // here would be the browser inventing a limit of its own — and the
        // exemption would look broken to the tester it exists for.
        if (!response.allowlisted) {
          lockNumber(mobilePhone, response.lockSeconds || 120);
          recordSessionNumber(mobilePhone);
        }
        return response.verificationId;
      }

      // Blocked by our limiter or rejected by the backend.
      if (response.lockSeconds) {
        lockNumber(mobilePhone, response.lockSeconds);
      }
      const refusal = msg || translateFunction("Failed to send verification code");
      setWrongNumber(refusal);
      throw new Error(refusal);
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In SendOtp in services/auth",
      });
      errorCallback();
      // Keep whatever reason we already have. `msg` is still the empty string
      // when the action threw before replying, and overwriting with it left the
      // screen with no reason at all.
      setWrongNumber(msg || translateFunction("Failed to send verification code"));

      throw e;
    }
  }
  async VerifyOtp(code: string, verficationID: string) {
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
          `?verificationId=${encodeURIComponent(verficationID)}` +
          `&otp=${encodeURIComponent(code)}`,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.VERIFY_OTP_FROM_GUEST,
      });

      if (response.code === 501 && !response.success) {
        showErrorNotification(response?.message);
        throw new Error("Wrong Code", { cause: response?.message });
      }
      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }
      if (response?.isSuccessful === false && !response.success) {
        throw new Error("Wrong Code", { cause: response?.message });
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
        posthogIdentify(user.id, {
          name: user.name,
          phone: user.mobilePhone,
        });
      }
      try {
        home.getNotificationPermissionStatus();
        home.getClientData();
        // On /seller, do NOT reload: setReAuthResult("success") above lets the
        // pending fetchData re-auth poll retry the original request so the seller
        // continues in place (mirrors the chat/stories flow).
      } catch (error) {}
      // not exist and has no name
      // return [false, ""];
      // // not exist and has no name
      // return [true, ""];

      return [response.data.already_exists, user.name];
    } catch (e) {
      if (e.message === "user not found") {
        setWrongNumber("user not found");
      } else {
        loginFailed();
      }
      // PostHog: OTP verification failed. Tag with the flow it was opened from so
      // checkout-driven verification drop-off is separable from login elsewhere.
      trackOrder(ORDER_EVENTS.VERIFY_OTP_FAILED, {
        flow_source: resolveVerifyFlowSource(
          useAppStore.getState().shouldAuthinticated,
        ),
        reason: e instanceof Error ? e.message : String(e),
      });
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
          `?verificationId=${encodeURIComponent(verficationID)}` +
          `&otp=${encodeURIComponent(code)}`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.VERIFY_OTP,
      });

      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }
      if (response?.isSuccessful === false && !response.success) {
        throw new Error("Wrong Code", { cause: response?.message });
      }
      // No token means the server did not confirm the number, so nothing below
      // may run: marking the phone verified on an unconfirmed reply is what this
      // check exists to prevent. Keep it an explicit check — an incidental
      // property read here is one "cleanup" away from disappearing.
      const idToken = response?.data?.id_token;
      if (!idToken) {
        throw new Error(translateFunction("Something went wrong"));
      }
      updateUserIsVerified({ is_phone_verified: 1 });
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: { is_phone_verified: 1 } },
      ]);
      return idToken;
    } catch (error) {
      // Only ever our own wording: the raw text of an unexpected error is not
      // something a shopper should be shown, and it is never translated.
      setWrongNumber(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : translateFunction("Something went wrong"),
      );
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
    // Kept so the optimistic write below can be undone. Without it a refused
    // rename stayed on screen and in three stored copies, and nobody was told.
    const previousName = userProfile?.name ?? "";
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
      // Put the old name back — on screen and in the stored copies — and say so.
      // A rename that the backend refused must not look like it worked.
      updateName(previousName);
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: { name: previousName } },
        { name: COOKIE_NAMES.USER_CHAT, value: { name: previousName } },
        { name: COOKIE_NAMES.USER_STORIES, value: { name: previousName } },
      ]);
      showErrorNotification(translateFunction("Failed to update name"));
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
      await home.subscribeToTopicInventory({
        topic: `product_availability_${id}`,
      });
    else
      await home.subscribeToTopicInventory({
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
          firebase_token_id: parseInt(localStorage.getItem("FBID")),
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
  /**
   * Exchange the HttpOnly refresh cookie for a fresh token pair via
   * /api/auth/refresh (the gateway's auth contract). Reactive callers pass the
   * failed request's {url, server} — eligibility is decided SERVER-SIDE with the
   * same routing helpers the proxy uses; the proactive on-load call passes
   * nothing (fast no-op while the access token is valid).
   * Returns {refreshed, eligible}; on failure/ineligibility the caller falls
   * through to the existing expiry flow.
   */
  async RefreshSession(url?: string, server?: string) {
    const { LoggingOut } = useAppStore.getState();
    if (LoggingOut) return { refreshed: false, eligible: false };

    const key = refreshKeyFor(server);
    const pending = _refreshPromises.get(key);
    if (pending) return pending;

    const request = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            url !== undefined || server !== undefined ? { url, server } : {},
          ),
          credentials: "include",
        });
        const repo = await response.json().catch(() => ({}));
        if (repo?.eligible === false)
          return { refreshed: false, eligible: false };
        return { refreshed: response.ok && repo?.refreshed === true, eligible: true };
      } catch {
        return { refreshed: false, eligible: true };
      }
    })();
    _refreshPromises.set(key, request);

    try {
      return await request;
    } finally {
      _refreshPromises.delete(key);
    }
  }

  async ExpiredUser(noReq = false): Promise<ExpireOutcome> {
    const { LoggingOut } = useAppStore.getState();
    if (LoggingOut) return { renewed: false, wasVerified: false };

    // Deduplicate concurrent 401 handlers — reuse in-flight expire. Waiters
    // share the same outcome, so a parallel 401 also learns `wasVerified`.
    if (_expirePromise) return _expirePromise;

    _expirePromise = this._doExpire(noReq);
    try {
      return await _expirePromise;
    } finally {
      _expirePromise = null;
    }
  }

  private async _doExpire(noReq: boolean): Promise<ExpireOutcome> {
    const { setReAuthResult, setIsRegisteringReady, setShouldAuthinticated } =
      useAppStore.getState();

    // Read at the point of use, never here: the expire request below is awaited,
    // and a concurrent 401 (chat/stories) can arm a re-auth flow in the
    // meantime — a marker captured now would be stale by the time it is read.
    const armedFlow = () => useAppStore.getState().shouldAuthinticated;

    setIsRegisteringReady(false);
    let wasVerified = false;

    try {
      if (!noReq) {
        const { country, language } = this._getLocale();
        const response = await fetch("/api/auth/expire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-country": country,
            "x-language": language,
          },
          credentials: "include",
        });

        // Last-chance renewal succeeded server-side (a race loser carrying
        // the winner's rotated refresh cookie): the session survived — do
        // NOT cancel/downgrade the client state the winner just renewed.
        // Re-sync happens through the callers' own retries (single re-sync
        // mechanism); the "success" signal is scoped to expire-waiters only —
        // never release an armed phone re-verification wait without an OTP.
        const repo = await response.json().catch(() => ({}));
        if (repo?.renewed === true) {
          if (!armedFlow()) setReAuthResult("success");
          return { renewed: true, wasVerified: false };
        }
        // The nuked session belonged to a phone-verified shopper (captured
        // server-side before the guest re-register overwrote User-Data).
        wasVerified = repo?.wasVerified === true;
      }

      // Preserve the outgoing shopper's phone before anything can lose it —
      // cancelAuth(true) keeps the profile, but a later guest customer-info
      // sync overwrites userProfile before the user reaches the verify widget.
      const expiredPhone = useAppStore.getState().userProfile?.phone;

      this.cancelAuth(true);

      // A verified shopper is never left silently downgraded to an anonymous
      // guest: arm the session-expired prompt ("please login again", styled
      // like the notification-allowance widget) so they choose between logging
      // back into their real account (opens the OTP widget) or continuing as
      // the fresh guest minted above. Guests keep the silent path.
      //
      // Unless a re-auth is already on screen: a concurrent chat/stories 401 can
      // arm the verify widget while the expire request above is in flight, and
      // swapping it for this prompt would yank the OTP form away mid-entry.
      // That armed flow re-authenticates the user anyway and owns the outcome
      // (its own `reAuthResult`), so leave it — same rule the 401 handlers
      // follow: whoever armed first keeps the screen until it resolves.
      if (wasVerified && !armedFlow()) {
        if (expiredPhone && expiredPhone !== "0") {
          useAppStore
            .getState()
            .setExpiredSessionPhone(String(expiredPhone));
        }
        setReAuthResult("pending");
        setShouldAuthinticated("expired");
      } else if (!wasVerified) {
        setReAuthResult("cancelled");
      }

      return { renewed: false, wasVerified };
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
      // --- Wallet profile update DISABLED (under development) ---
      // The wallet `/users/me` PATCH is temporarily commented out. `wallet_done`
      // stays false, so the wallet rollback block in the catch below is inert.
      // NOTE: when re-enabling, fix `profilePictureURL` for the gateway's bare sub_path
      // (needs a slash between the media base and "customers/profile/..").
      /*
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
        ? `${process.env.NEXT_PUBLIC_BASE_MEDIA_URL}${imagePath}`
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
      */

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
            photo_path: this.ConfigurePhoto(
              userObj?.image ?? userProfile?.image,
              "story",
            ),
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        stories_done = true;
        const storiesUpdate = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(
            userObj?.image ?? userProfile?.image,
            "story",
          ),
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
            photo_path: this.ConfigurePhoto(
              userObj?.image ?? userProfile?.image,
              "chat",
            ),
          }),
        });
        if (!chat_update.success) {
          throw new Error(chat_update.message);
        }
        chat_done = true;
        const chatUpdate = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(
            userObj?.image ?? userProfile?.image,
            "chat",
          ),
        };
        loginSuccessChat(chatUpdate);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_CHAT, value: chatUpdate },
        ]);
      }
      // Send only the fields the caller passed. `image` is added just when it
      // actually changed — otherwise omitted so the backend doesn't validate it.
      const marketBody: any = { ...userObj };
      if (userObj?.image != null) {
        marketBody.image = this.ConfigurePhoto(userObj.image, "market");
      }
      let res = await fetchData({
        url: "/customer/update-profile",
        body: JSON.stringify(marketBody),
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
        method: "POST",
        server: "market",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      market_done = true;
      // Every field that was just saved has to be mirrored here, not only some
      // of them. The settings screens render from this stored copy — the form
      // reads it as `initialData` (the User-Data cookie) and as `userProfile`
      // (the store) — so a field left out of this object goes back to its old
      // value on screen the moment the shopper returns, even though the backends
      // all took the change. `gender`, `email` and `alternative_phone` were
      // missing, which made a saved change look like it had been ignored.
      const marketUpdate = {
        weight: userObj?.weight ?? userProfile?.weight,
        tall: userObj?.tall ?? userProfile?.tall,
        name: userObj?.name ?? userProfile?.name,
        phone: userObj?.phone ?? userProfile?.phone,
        gender: userObj?.gender ?? userProfile?.gender,
        email: userObj?.email ?? userProfile?.email,
        alternative_phone:
          userObj?.alternative_phone ?? userProfile?.alternative_phone,
        // `??` here would read a deliberate clear as "not supplied". Removing a
        // picture sends `image: null` (UploadProfilePhoto), and null would fall
        // back to the old picture — so every backend drops it while the app goes
        // on showing it. Only an ABSENT field may fall back; null is a value the
        // shopper chose. The other fields above are safe on `??` because the
        // form clears a text field to "", which `??` already passes through.
        image: this.getImageForCookie(
          userObj?.image !== undefined ? userObj.image : userProfile?.image,
        ),
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
          body: JSON.stringify(userProfile),
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
          ? `${process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL}${prevImagePath}`
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
        // The old profile, not the new one. The request just above puts the
        // old name back on the chat backend, so writing `userObj` here would
        // leave the app's own copy holding the value it had just undone — the
        // shopper is told the save failed and is still shown the new name.
        const revertChat = {
          name: userProfile?.name,
          mobile_phone: userProfile?.phone,
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
    let ticket=await GetTicket("customers/profile",false,1);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "customers/profile");

    const uploadUrl = `${MEDIA_SERVER_BASE_URL}/gated/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "x-api-key": MEDIA_API_KEY,
        "X-Upload-Ticket":ticket
      },

      body: form,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok || !data?.url) {
      // `data` is null when the reply could not be read at all, so this must not
      // reach into it — it used to throw here instead of reporting the failure.
      return { error: data?.error ?? "Upload failed", data: null };
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
}
export default new AuthService();
