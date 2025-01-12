import React, { useEffect } from "react";
import { translateFunction } from "utils/functions";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";

import home from "services/home";
import { useParams } from "next/navigation";
function ShowMessageAuth() {
  const dispatch = useDispatch();
  const loginAction = () => {
    localStorage.clear();
    Object.keys(Cookies.get()).forEach(function (cookieName) {
      var neededAttributes = {
        // Here you pass the same attributes that were used when the cookie was created
        // and are required when removing the cookie
      };
      Cookies.remove(cookieName, neededAttributes);
    });
    dispatch({ type: "CANCEL-AUTH", payload: true });
    document.documentElement.style.overflow = "initial";
    dispatch({ type: "LOGIN-OPEN", payload: true });
  };
  const loginGuest = async () => {
    localStorage.clear();
    Object.keys(Cookies.get()).forEach(function (cookieName) {
      var neededAttributes = {
        // Here you pass the same attributes that were used when the cookie was created
        // and are required when removing the cookie
      };
      Cookies.remove(cookieName, neededAttributes);
    });
    dispatch({ type: "CANCEL-AUTH" });

    dispatch({ type: "INFO_EXPIRED_TOKEN", payload: false });
    document.documentElement.style.overflow = "initial";
    await home.registerForExpire();
  };
  useEffect(() => {
    dispatch({ type: "ENABLE-CART", payload: false });

    document.documentElement.scrollTo({ top: 0 });
    document.documentElement.style.overflow = "hidden";
  }, []);
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <>
      <div
        className="fixed min-w-[100vw] z-[999999998] min-h-[100vh] opacity-40 bg-[black]"
        onClick={() => {
          loginGuest();
        }}
      />
      <div className="absolute top-16 left-0 right-0 mx-auto my-0 bg-[#fafafa] rounded-md p-3 flex-col w-[300px] z-[999999999]">
        <div className="regular pb-4 text-[#5d5d5d]">
          {translate(
            "your session has expired please login again or continue as guest"
          )}
        </div>
        <div className="flex-row w-full justify-between">
          <div
            className="bg-[#5d5d5d] text-[#fafafa] regular p-3 rounded-md cursor-pointer"
            onClick={() => {
              loginAction();
            }}
          >
            {translate("Login")}
          </div>
          {/* <div
            className="bg-[#5d5d5d] text-[#fafafa] regular p-3 rounded-md cursor-pointer"
            onClick={() => {
              loginGuest();
            }}
          >
            {translate("Continue as Guest")}
          </div> */}
        </div>
      </div>
    </>
  );
}

export default ShowMessageAuth;
