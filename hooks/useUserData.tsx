import { useEffect, useState } from "react";
import { useAppStore } from "store";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";

export const useUserData = ({
  initialUserData,
}: {
  initialUserData: {
    userData: UserData | null;
    userChat: UserData | null;
    userStories: UserData | null;
  };
}) => {
  // Subscribe to store changes for real-time updates
  const userMarketStore = useAppStore((state) => state.userProfile);
  const userChatStore = useAppStore((state) => state.userChat);
  const userStoriesStore = useAppStore((state) => state.userStories);

  // Fallback to cookies if store data is not available
  const [cookieData, setCookieData] = useState<{
    userData: UserData | null;
    userChat: UserData | null;
    userStories: UserData | null;
  }>(initialUserData);

  useEffect(() => {
    // Only fetch from cookies if store data is not available
    if (!userMarketStore || !userChatStore || !userStoriesStore) {
      const userMarketData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
      const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
      const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);

      setCookieData({
        userData: userMarketStore || userMarketData,
        userChat: userChatStore || userChat,
        userStories: userStoriesStore || userStories,
      });
    }
  }, [userMarketStore, userChatStore, userStoriesStore]);

  return {
    userData: userMarketStore || cookieData.userData,
    userChat: userChatStore || cookieData.userChat,
    userStories: userStoriesStore || cookieData.userStories,
  };
};
