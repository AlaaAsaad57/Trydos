import React, { useState } from "react";
import Cookies from "js-cookie";
import { changeToken } from "store/homepage/cachedActions";
import { Sendevent, translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import { useParams, usePathname } from "next/navigation";
import { changeAppLanguage } from "store/homepage/actions";
import { useDispatch, useSelector } from "react-redux";
import NotificationsPanel from "../Notifications/NotificationsPanel";

import WishListPanel from "../WishList/WishListPanel";
import CountrySelector from "components/global/CountrySelector";
import { useRouter } from "next-nprogress-bar";

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
          <path
            d="M20.58 19.37L17.59 11.01C17.38 10.46 16.91 10.12 16.37 10.12C15.83 10.12 15.37 10.46 15.14 11.03L12.16 19.37C12.02 19.76 12.22 20.19 12.61 20.33C13 20.47 13.43 20.27 13.57 19.88L14.19 18.15H18.54L19.16 19.88C19.27 20.19 19.56 20.38 19.87 20.38C19.95 20.38 20.04 20.37 20.12 20.34C20.51 20.2 20.71 19.77 20.57 19.38L20.58 19.37ZM14.74 16.64L16.38 12.05L18.02 16.64H14.74ZM12.19 7.85C9.92999 11.42 7.89 13.58 5.41 15.02C5.29 15.09 5.16 15.12 5.04 15.12C4.78 15.12 4.53 14.99 4.39 14.75C4.18 14.39 4.3 13.93 4.66 13.73C6.75999 12.51 8.48 10.76 10.41 7.86H4.12C3.71 7.86 3.37 7.52 3.37 7.11C3.37 6.7 3.71 6.36 4.12 6.36H7.87V4.38C7.87 3.97 8.21 3.63 8.62 3.63C9.02999 3.63 9.37 3.97 9.37 4.38V6.36H13.12C13.53 6.36 13.87 6.7 13.87 7.11C13.87 7.52 13.53 7.86 13.12 7.86H12.18L12.19 7.85ZM12.23 15.12C12.1 15.12 11.97 15.09 11.85 15.02C11.2 14.64 10.57 14.22 9.97999 13.78C9.64999 13.53 9.58 13.06 9.83 12.73C10.08 12.4 10.55 12.33 10.88 12.58C11.42 12.99 12.01 13.37 12.61 13.72C12.97 13.93 13.09 14.39 12.88 14.75C12.74 14.99 12.49 15.12 12.23 15.12Z"
            fill="currentColor"
          />
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
              width={30}
              height={langCode === "en" ? 15 : 20}
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
  const pathname = usePathname();

  if (href && !pathname.includes(href)) {
    return (
      <NextLink data-cy={dataCy} style={style} href={href}>
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

const Menu: React.FC<MenuProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showWishList, setShowWishList] = useState(false);
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
        <div className="items-center gap-4 flex">
          <CountrySelector init={Array.isArray(lang) ? lang[0] : lang} />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
        </div>

        <>
          <MenuItem
            dataCy="Settings-Icon"
            href={`/${lang}/setting`}
            onClick={() => {}}
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
            onClick={() => setShowWishList(!showWishList)}
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
            onClick={() => setShowNotifications(!showNotifications)}
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
            onClick={() => {}}
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
        </>
        {user && (
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
        )}
      </div>

      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}

      {showWishList && <WishListPanel onClose={() => setShowWishList(false)} />}
    </>
  );
};

export default Menu;
