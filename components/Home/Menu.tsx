import React, { useState } from "react";
import Cookies from "js-cookie";
import { changeToken } from "store/homepage/cachedActions";
import { Sendevent, translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import { useParams } from "node_modules/next/navigation";
import { changeAppLanguage } from "store/homepage/actions";
import { useDispatch, useSelector } from "node_modules/react-redux/es";
// import SettingsModal from "./SettingsModal"; // Import the SettingsModal component

interface MenuProps {
  user: any;
}

const Menu: React.FC<MenuProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsModalOpen(true); // Open settings modal
  };

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
  const { lang } = useParams();
  const dispatch = useDispatch();
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const isSelected = (val) => {
    return language === val;
  };
  return (
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
      <div
        className=""
        style={{
          padding: "10px 15px",
          cursor: "pointer",
          color: "#333",
        }}
        // Handle logout
      >
        <div className="flex-row justify-between items-center">
          {/* @ts-ignore */}
          <span> {translateFunction("Language", lang.split("-")[1])}</span>
          <div className="flex-row ml-4">
            <div
              className={`${
                isSelected("tr") && "border-[#3da5b0] border-[1px]"
              } flex p-1 cursor-pointer`}
              onClick={() => {
                dispatch(changeAppLanguage("tr"));
                window.location.href = window.location.href.replace(
                  // @ts-ignore
                  lang,
                  // @ts-ignore
                  `${lang.split("-")[0]}-tr`
                );
              }}
            >
              <img
                src={"/svg/tr.svg"}
                width={20}
                height={10}
                alt="turkish language"
              />
            </div>
            <div
              className={`${
                isSelected("ar") && "border-[#3da5b0] border-[1px]"
              } flex p-1 cursor-pointer`}
              onClick={() => {
                dispatch(changeAppLanguage("ar"));
                window.location.href = window.location.href.replace(
                  // @ts-ignore
                  lang,
                  // @ts-ignore
                  `${lang.split("-")[0]}-ar`
                );
              }}
            >
              <img
                src={"/svg/uae.svg"}
                width={20}
                height={10}
                alt="arabic language"
              />
            </div>
            <div
              className={`flex p-1 cursor-pointer ${
                isSelected("en") && "border-[#3da5b0] border-[1px]"
              }`}
              onClick={() => {
                dispatch(changeAppLanguage("en"));
                window.location.href = window.location.href.replace(
                  // @ts-ignore
                  lang,
                  // @ts-ignore
                  `${lang.split("-")[0]}-en`
                );
              }}
            >
              <img
                src={"/svg/uk.svg"}
                width={20}
                className="scale-125"
                height={13}
                alt="english language"
              />
            </div>
          </div>
        </div>
      </div>
      {user ? (
        <>
          <NextLink
            data-cy="Settings-Icon"
            style={{
              padding: "10px 15px",
              cursor: "pointer",
              color: "#333",
            }}
            href={`/${lang}/settings`} // Open settings modal for non-logged-in users
          >
            Settings
          </NextLink>
          <div
            data-cy="logout"
            style={{
              padding: "10px 15px",
              cursor: "pointer",
              color: "#333",
            }}
            onClick={handleLogout} // Handle logout
          >
            Logout
          </div>
        </>
      ) : (
        <NextLink
          style={{
            padding: "10px 15px",
            cursor: "pointer",
            color: "#333",
          }}
          href={`/${lang}/settings`} // Open settings modal for non-logged-in users
          // Open settings modal for non-logged-in users
        >
          Settings
        </NextLink>
      )}

      {/* Settings Modal */}
    </div>
  );
};

export default Menu;
