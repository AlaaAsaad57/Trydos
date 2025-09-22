import React, { useState } from "react";

import { translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import NotificationSkeleton from "components/skeleton/NotificationSkeleton";

import { useParams, usePathname } from "next/navigation";

const NotificationsPanel = dynamic(
  () => import("../Notifications/NotificationsPanel"),
  {
    ssr: false,
    loading: () => <NotificationSkeleton />,
  }
);
import WishListPanel from "../WishList/WishListPanel";
import Spinner from "components/global/Spinner";
import auth from "services/auth";
import {
  COOKIE_NAMES,
  deleteCookie,
  getCookie,
  setCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { getReferralSource } from "utils/tinyUtils";
import dynamic from "next/dynamic";

interface MenuProps {
  user: any;
  setMenuOpen: (open: boolean) => void;
}

const MenuIcon = ({ children }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "8px" }}
  >
    {children}
  </svg>
);

const MenuItem = ({
  onClick = () => {},
  href = null,
  children,
  dataCy = "",
  icon,
}) => {
  const style = {
    padding: "10px 15px",
    cursor: "pointer",
    color: "#333",
    display: "flex",
    alignItems: "center",
  };
  const pathname = usePathname();

  if (href && !pathname.includes(href)) {
    return (
      <NextLink
        data={{
          is_settings: true,
          href,
        }}
        ariaLabel={`Menu Item ${href}`}
        data-cy={dataCy}
        style={style}
        href={href}
        onClick={() => {
          if (onClick) onClick();
        }}
      >
        {icon}
        {children}
      </NextLink>
    );
  }

  return (
    <div
      data-cy={dataCy}
      style={style}
      onClick={() => {
        onClick();
      }}
    >
      {icon}
      {children}
    </div>
  );
};

const Menu = ({ user, setMenuOpen }) => {
  const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
  const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWishList, setShowWishList] = useState(false);
  const { lang } = useParams();
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.LOGOUT_BUTTON,
    // });
    // localStorage.clear();
    if (loading) return;
    setLoading(true);
    deleteCookie(COOKIE_NAMES.USER_CHAT);
    deleteCookie(COOKIE_NAMES.USER_STORIES);
    deleteCookie(COOKIE_NAMES.CHAT_TOKEN);
    deleteCookie(COOKIE_NAMES.STORIES_TOKEN);
    deleteCookie(COOKIE_NAMES.MARKET_TOKEN);
    deleteCookie(COOKIE_NAMES.DEVICE_TOKEN);
    deleteCookie(COOKIE_NAMES.USER_DATA);
    const { messaging } = await import("utils/firebaseInitv1");
    const { deleteToken } = await import("firebase/messaging");
    try {
      await deleteToken(messaging);
    } catch (error) {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
    window.location.reload();
  };
  const shouldShowLogout = () => {
    if (loading) return true;
    if (auth.getUser()) {
      if (auth.getUser().phone === "0" || !auth.getUser().phone) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };

  return (
    <>
      <div
        onClick={() => {
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.CLSOE_SIDE_MENU,
          // });
          setMenuOpen(false);
        }}
        className=" w-full h-full fixed top-0 left-0 z-50"
      />
      <div
        style={{
          position: "absolute",
          top: "50px",
          right: "10px",
          background: "#fff",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
          padding: "10px",
          zIndex: 1000,
        }}
      >
        <>
          <MenuItem
            dataCy="Settings-Icon"
            href={`/${lang}/setting?tab=main`}
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.PERSONAL_SETTING,
              // });
              setMenuOpen(false);
            }}
            icon={
              <MenuIcon>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </MenuIcon>
            }
          >
            {translateFunction("Settings")}
          </MenuItem>
          <MenuItem
            dataCy="WishList-Icon"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.WISHLIST_BUTTON,
              // });
              setShowWishList(!showWishList);
            }}
            icon={
              <MenuIcon>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </MenuIcon>
            }
          >
            {translateFunction("Wishlist")}
          </MenuItem>
          <MenuItem
            dataCy="Notifications-Icon"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.NOTIFICATIONS_BUTTON,
              // });
              setShowNotifications(!showNotifications);
            }}
            icon={
              <MenuIcon data-cy="Notifications-svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </MenuIcon>
            }
          >
            {translateFunction("Notifications")}
          </MenuItem>
          {/* <MenuItem
            dataCy="Orders-Icon"
            onClick={() => setShowOrders(!showOrders)}
            icon={
              <MenuIcon>
                <path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" />
              </MenuIcon>
            }
          >
            {translateFunction("Orders")}
          </MenuItem> */}
          <MenuItem
            dataCy="Compare-Icon"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.COMPARE_BUTTON,
              // });
            }}
            href={`/${lang}/compare`}
            icon={
              <MenuIcon>
                <g
                  id="Mask_Group_364"
                  data-name="Mask Group 364"
                  clipPath="url(#clipPath)"
                >
                  <g
                    id="Group_3489"
                    data-name="Group 3489"
                    transform="translate(3.75 0)"
                  >
                    <g id="Group_3488" data-name="Group 3488">
                      <g
                        id="Rectangle_4149"
                        data-name="Rectangle 4149"
                        fill="none"
                        stroke="#404040"
                        strokeWidth="0.625"
                      >
                        <rect
                          width="17.5"
                          height="12.5"
                          rx="2.5"
                          stroke="none"
                        />
                        <rect
                          x="0.313"
                          y="0.313"
                          width="16.875"
                          height="11.875"
                          rx="2.188"
                          fill="none"
                        />
                      </g>
                      <rect
                        id="Rectangle_4150"
                        data-name="Rectangle 4150"
                        width="5"
                        height="7.5"
                        rx="1.25"
                        transform="translate(6.25 2.5)"
                        fill="#8e8e8e"
                      />
                    </g>
                    <g
                      id="Group_3486"
                      data-name="Group 3486"
                      transform="translate(0 12.5)"
                    >
                      <g
                        id="Rectangle_4148"
                        data-name="Rectangle 4148"
                        fill="none"
                        stroke="#404040"
                        strokeWidth="0.625"
                      >
                        <rect
                          width="17.5"
                          height="12.5"
                          rx="2.5"
                          stroke="none"
                        />
                        <rect
                          x="0.313"
                          y="0.313"
                          width="16.875"
                          height="11.875"
                          rx="2.188"
                          fill="none"
                        />
                      </g>
                      <rect
                        id="Rectangle_4151"
                        data-name="Rectangle 4151"
                        width="5"
                        height="7.5"
                        rx="1.25"
                        transform="translate(6.25 2.5)"
                        fill="#8e8e8e"
                      />
                    </g>
                  </g>
                </g>
              </MenuIcon>
            }
          >
            {translateFunction("Compare")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
            }}
            icon={
              <MenuIcon>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Request Log"
                  role="img"
                  className="w-5 h-5"
                >
                  <rect
                    x="3"
                    y="4"
                    width="14"
                    height="12"
                    rx="2"
                    stroke="#404040"
                    strokeWidth="1"
                    fill="none"
                  />
                  <rect
                    x="6"
                    y="7"
                    width="8"
                    height="2"
                    rx="1"
                    fill="#8e8e8e"
                  />
                  <rect
                    x="6"
                    y="11"
                    width="5"
                    height="2"
                    rx="1"
                    fill="#8e8e8e"
                  />
                </svg>
              </MenuIcon>
            }
          >
            <a href="/requests-log" target="_blank" className="text-[12px]">
              {translateFunction("Request Log")}
            </a>
          </MenuItem>
          <MenuItem
            icon={<></>}
            onClick={() => {
              setMenuOpen(false);
              deleteCookie("redemed_ids");
            }}
          >
            {translateFunction("Reset Redeemed Products")}
          </MenuItem>
        </>
        {shouldShowLogout() && (
          <MenuItem
            dataCy="logout"
            onClick={handleLogout}
            icon={
              <MenuIcon>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </MenuIcon>
            }
          >
            {loading ? <Spinner /> : translateFunction("Logout")}
          </MenuItem>
        )}
        {userChat?.id && (
          <MenuItem
            dataCy="change-chat-token"
            icon={<></>}
            onClick={() => {
              let user = { ...userChat, access_token: "skajdklajsd" };
              setCookie(COOKIE_NAMES.USER_CHAT, user);
            }}
          >
            {translateFunction("Make Chat Token Expired")}
          </MenuItem>
        )}
        {userStories?.id && (
          <MenuItem
            dataCy="change-chat-token"
            icon={<></>}
            onClick={() => {
              let user = { ...userStories, access_token: "skajdklajsd" };
              setCookie(COOKIE_NAMES.USER_STORIES, user);
            }}
          >
            {translateFunction("Make Stories Token Expired")}
          </MenuItem>
        )}
        <MenuItem icon={<></>}>
          <Reffer />
        </MenuItem>
      </div>

      {showNotifications && (
        <NotificationsPanel
          closeWindow={() => setMenuOpen(false)}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showWishList && <WishListPanel onClose={() => setShowWishList(false)} />}
    </>
  );
};

export default Menu;
const Reffer = () => {
  if (typeof window === "undefined") return <></>;
  let reffere = getCookie("referer");

  return (
    <div>
      Reffere: {reffere?.toString()} - {getReferralSource(reffere)}
    </div>
  );
};
