import React, { useState } from "react";
import Cookies from "js-cookie";
import { changeToken } from "store/homepage/cachedActions";
import { Sendevent, translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import { useParams } from "node_modules/next/navigation";
import { changeAppLanguage } from "store/homepage/actions";
import { useDispatch, useSelector } from "node_modules/react-redux/es";
import NotificationsPanel from "../Notifications/NotificationsPanel";
import OrdersPanel from "../Orders/OrdersPanel";

interface MenuProps {
  user: any;
}

const MenuIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

const LanguageSelector: React.FC = () => {
  const { lang } = useParams();
  const dispatch = useDispatch();
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );

  const isSelected = (val: string) => language === val;

  const handleLanguageChange = (newLang: string) => {
    dispatch(changeAppLanguage(newLang));
    window.location.href = window.location.href.replace(
      // @ts-ignore
      lang,
      // @ts-ignore
      `${lang.split("-")[0]}-${newLang}`
    );
  };

  const currentLang = Array.isArray(lang) ? lang[0] : lang;

  return (
    <div
      className="flex-row justify-between items-center"
      style={{ padding: "10px 15px", cursor: "pointer", color: "#333" }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <MenuIcon>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </MenuIcon>
        <span>{translateFunction("Language")}</span>
      </div>
      <div className="flex-row ml-4">
        {["tr", "ar", "en"].map((langCode) => (
          <div
            key={langCode}
            className={`${
              isSelected(langCode) ? "border-[#3da5b0] border-[1px]" : ""
            } flex p-1 cursor-pointer`}
            onClick={() => handleLanguageChange(langCode)}
          >
            <img
              src={`/svg/${
                langCode === "en" ? "uk" : langCode === "ar" ? "uae" : langCode
              }.svg`}
              width={20}
              height={langCode === "en" ? 13 : 10}
              className={langCode === "en" ? "scale-125" : ""}
              alt={`${langCode} language`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuItem: React.FC<{
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  dataCy?: string;
  icon: React.ReactNode;
}> = ({ onClick, href, children, dataCy, icon }) => {
  const style = {
    padding: "10px 15px",
    cursor: "pointer",
    color: "#333",
    display: "flex",
    alignItems: "center",
  };

  if (href) {
    return (
      <NextLink data-cy={dataCy} style={style} href={href}>
        {icon}
        {children}
      </NextLink>
    );
  }

  return (
    <div data-cy={dataCy} style={style} onClick={onClick}>
      {icon}
      {children}
    </div>
  );
};

const Menu: React.FC<MenuProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const { lang } = useParams();

  const handleLogout = () => {
    Sendevent({
      event: "button_clicked",
      value: "me_nav_bar_button",
    });
    localStorage.clear();
    changeToken({ key: "DEVICE-TOKEN", deleteOption: true });
    changeToken({ key: "MARKET-TOKEN", deleteOption: true });
    changeToken({ key: "token", deleteOption: true });
    Cookies.remove("DEVICE-TOKEN");
    Cookies.remove("MARKET-TOKEN");
    Cookies.remove("token");
    window.location.reload();
  };

  return (
    <>
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
        <LanguageSelector />
        {user ? (
          <>
            <MenuItem
              dataCy="Settings-Icon"
              href={`/${lang}/settings`}
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
              dataCy="Notifications-Icon"
              onClick={() => setShowNotifications(!showNotifications)}
              icon={
                <MenuIcon>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </MenuIcon>
              }
            >
              {translateFunction("Notifications")}
            </MenuItem>
            <MenuItem
              dataCy="Orders-Icon"
              onClick={() => setShowOrders(!showOrders)}
              icon={
                <MenuIcon>
                  <path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" />
                </MenuIcon>
              }
            >
              {translateFunction("Orders")}
            </MenuItem>
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
              {translateFunction("Logout")}
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              href={`/${lang}/settings`}
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
              dataCy="Notifications-Icon"
              onClick={() => setShowNotifications(!showNotifications)}
              icon={
                <MenuIcon>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </MenuIcon>
              }
            >
              {translateFunction("Notifications")}
            </MenuItem>
            <MenuItem
              dataCy="Orders-Icon"
              onClick={() => setShowOrders(!showOrders)}
              icon={
                <MenuIcon>
                  <path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" />
                </MenuIcon>
              }
            >
              {translateFunction("Orders")}
            </MenuItem>
          </>
        )}
      </div>

      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}
      {showOrders && <OrdersPanel onClose={() => setShowOrders(false)} />}
    </>
  );
};

export default Menu;
