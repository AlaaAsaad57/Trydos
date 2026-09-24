import { useState } from "react";

import { translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import NotificationSkeleton from "components/skeleton/NotificationSkeleton";

import { useParams, usePathname } from "next/navigation";

const NotificationsPanel = dynamic(
  () => import("../Notifications/NotificationsPanel"),
  {
    ssr: false,
    loading: () => <NotificationSkeleton />,
  },
);
import Spinner from "components/global/Spinner";

import { clearAllUserData } from "utils/tinyUtils";
import dynamic from "next/dynamic";

import { useAppStore } from "store";

const MenuIcon = ({ children ,isRtl}) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={isRtl?{marginLeft:'8px'}:{ marginRight: "8px" }}
  >
    {children}
  </svg>
);

const MenuItem = ({
  onClick = () => {},
  href = null,
  children,
  dataCy = "",
  data = {},
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

  if (href && pathname !== href) {
    return (
      <NextLink
        onClick={() => {
          onClick();
        }}
        data={data}
        data-pw={dataCy}
        style={style}
        href={href}
      >
        {icon}
        {children}
      </NextLink>
    );
  }

  return (
    <div
      data-pw={dataCy}
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

const Menu = ({ user, setMenuOpen ,isRtl}) => {
  const { setLoggingOut } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const { lang } = useParams();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoggingOut(true);
    setLoading(true);

    // 1. Clear cookies, storage and store, and tear down push delivery to this
    //    device. Everything remote is either same-origin (the cookie deletes) or
    //    off the critical path (the account-side FCM detach, which
    //    /api/auth/logout runs after responding) — so no backend can slow this
    //    down. See `clearAllUserData`.
    await clearAllUserData();

    // 2. Reset store auth state explicitly
    const { cancelAuth } = useAppStore.getState();
    cancelAuth(); // pass NO argument — full reset, not "expired"

    // 3. Reload immediately — no need for 2s delay
    if (
      window.location.pathname.includes("/seller") ||
      window.location.pathname.includes("/settings")
    ) {
      window.location.href = `/${lang}`;
    } else {
      window.location.reload();
    }
  };
  // Read from the `user` prop, not from `auth.getUser()`.
  //
  // `auth.getUser()` is `useAppStore.getState().userProfile` — a one-off read,
  // not a subscription. This menu is mounted only while it is open
  // (`{menuOpen && <Menu …/>}`, `UserNavTopSection.tsx`), and the profile is
  // filled by a client fetch after the page is already interactive. So a
  // shopper who opened the menu before that fetch landed got a menu with no way
  // to sign out, and it never appeared: the value was read once, at a moment
  // when there was nothing to read, and nothing made this read it again.
  // Closing and reopening the menu was the only cure, and no shopper knows to
  // do that.
  //
  // The `user` prop is the same value taken the reactive way: `useUserData`
  // subscribes to `state.userProfile` and falls back to `/api/auth/me`
  // (`hooks/useUserData.tsx`), and the parent already passes it in. So this is
  // the value that was always meant to be used here.
  //
  // Found by AUTH-03 and PROF-08, which reported it in these words: "offered no
  // sign-out while it was open, and offered it as soon as it was closed and
  // opened again".
  const shouldShowLogout = () => {
    if (loading) return true;
    if (!user) return false;
    return Boolean(user.phone) && user.phone !== "0";
  };
  const pathname = usePathname();
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
          right:'10px',
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
            data={{
              is_settings: true,
            }}
            onClick={() => {
              setMenuOpen(false);
            }}
            href={`/${lang}/settings`}
            icon={
              <MenuIcon isRtl={isRtl}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </MenuIcon>
            }
          >
            {translateFunction("Settings")}
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
              <MenuIcon isRtl={isRtl} data-pw="Notifications-svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </MenuIcon>
            }
          >
            {translateFunction("Notifications")}
          </MenuItem>
          <MenuItem
            dataCy="Compare-Icon"
            data={{
              is_compare: true,
            }}
            onClick={() => {
              setMenuOpen(false);
            }}
            href={`/${lang}/compare`}
            icon={
              <MenuIcon isRtl={isRtl}>
                <g id="Mask_Group_364" data-name="Mask Group 364">
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
        </>
        {shouldShowLogout() && (
          <MenuItem
            dataCy="logout"
            onClick={handleLogout}
            icon={
              <MenuIcon isRtl={isRtl}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </MenuIcon>
            }
          >
            {loading ? <Spinner /> : translateFunction("Logout")}
          </MenuItem>
        )}
      </div>

      {showNotifications && (
        <NotificationsPanel
          closeWindow={() => setMenuOpen(false)}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

export default Menu;
