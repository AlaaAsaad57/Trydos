import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import UserNavTopSection from "./UserNavTopSection";

async function AuthNavContainer() {
  const [userData, userChat, userStories] = await Promise.all([
    getCookieServer<UserData>(COOKIE_NAMES.USER_DATA),
    getCookieServer<UserData>(COOKIE_NAMES.USER_CHAT),
    getCookieServer<UserData>(COOKIE_NAMES.USER_STORIES),
  ]);
  return (
    <UserNavTopSection initialUserData={{ userData, userChat, userStories }} />
  );
}

export default AuthNavContainer;
