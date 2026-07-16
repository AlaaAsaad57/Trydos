import { useEffect, useState } from "react";
import { useAppStore } from "store";
import { UserData } from "utils/cookies/cookie-manager";

export const useUserData = ({
  initialUserData,
}: {
  initialUserData: {
    userData: UserData | null;
    userChat: UserData | null;
    userStories: UserData | null;
    userWallet: {
      firstName: string;
      lastName: string;
      phone: string;
    } | null;
  };
}) => {
  const userMarketStore = useAppStore((state) => state.userProfile);
  const userChatStore = useAppStore((state) => state.userChat);
  const userStoriesStore = useAppStore((state) => state.userStories);
  const userWalletStore = useAppStore((state) => state.userWallet);

  const [serverData, setServerData] = useState<{
    userData: UserData | null;
    userChat: UserData | null;
    userStories: UserData | null;
    userWallet: {
      firstName: string;
      lastName: string;
      phone: string;
    } | null;
  }>(initialUserData);

  useEffect(() => {
    // Fetch from /api/auth/me if store data is not available
    if (
      !userMarketStore ||
      !userChatStore ||
      !userStoriesStore ||
      !userWalletStore
    ) {
      fetch("/api/auth/me", { credentials: "include", method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setServerData({
              userData: data.user ?? null,
              userChat: data.chatUser ?? null,
              userStories: data.storiesUser ?? null,
              userWallet: data.walletUser ?? null,
            });
          }
        })
        .catch(() => {});
    }
  }, [userMarketStore, userChatStore, userStoriesStore, userWalletStore]);

  return {
    userData: userMarketStore ?? serverData.userData,
    userChat: userChatStore ?? serverData.userChat,
    userStories: userStoriesStore ?? serverData.userStories,
    userWallet: userWalletStore ?? serverData.userWallet,
  };
};
