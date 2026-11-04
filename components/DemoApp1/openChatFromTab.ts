"use client";

import { useAppStore } from "store";
import { LogError, translateFunction } from "utils/functions";
import { ChatConroller } from "utils/tinyUtils";
import home from "services/home";
import { showErrorNotification } from "store/notifications/reducer";
import { loginHref } from "utils/loginPath";

// The Chat tab of the bottom bar opens the chat with these gates: a chat
// account opens the chat (after the notification check), a shopper with a
// phone on record is asked to confirm it, and a guest goes to the login page
// with this page as the way back.
export async function openChatFromTab(
  lang: string,
  push: (href: string) => void,
): Promise<void> {
  const state = useAppStore.getState();
  try {
    const userChatCookie: any = state.userChat;
    const userDataCookie: any = state.userProfile;
    if (userChatCookie && userChatCookie?.id) {
      let num = home.getNotificationPermissionStatus();

      if (num === -1) {
        state.setNotificationModal(true);
        return;
      }
      if (num === 0) {
        showErrorNotification(
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
        );
        return;
      }
      if (num === 1) {
        state.setChatOpen(true);
        ChatConroller(true);
        state.setMain("main");
        await home.AllowNotifications();
      }
      state.setChatOpen(true);
      ChatConroller(true);
    } else {
      if (userDataCookie && userDataCookie?.phone !== "0") {
        state.setShouldAuthinticated("open chat");
      } else {
        const { pathname, search, hash } = window.location;
        push(loginHref(lang, `${pathname}${search}${hash}`));
      }
    }
  } catch (error) {
    LogError({
      error: error,
      scenario: "error in openChatFromTab",
    });
  }
}
