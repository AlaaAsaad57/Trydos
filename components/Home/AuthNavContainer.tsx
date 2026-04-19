import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import UserNavTopSection from "./UserNavTopSection";

async function AuthNavContainer() {
  const [userData, userChat, userStories, userWallet] = await Promise.all([
    getCookieServer<UserData>(COOKIE_NAMES.USER_DATA),
    getCookieServer<UserData>(COOKIE_NAMES.USER_CHAT),
    getCookieServer<UserData>(COOKIE_NAMES.USER_STORIES),
    getCookieServer<{
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
    } | null>(COOKIE_NAMES.WALLET_USER),
  ]);
  return (
    <UserNavTopSection
      initialUserData={{ userData, userChat, userStories, userWallet }}
    />
  );
}

export default AuthNavContainer;
