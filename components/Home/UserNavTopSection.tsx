"use client";
import { translateFunction } from "utils/functions";
import { useState } from "react";
import Image from "next/image";
import AuthNavSection from "./AuthNavSection";
import CartIcon from "public/svg/CartIcon.svg";
import {
  usePathname,
  useSearchParams,
  useRouter,
  useParams,
} from "next/navigation";
import Menu from "./Menu";
import { useAppStore } from "store";

function UserNavTopSection() {
  const {
    enableCart,
    disableAddToCartOption,
    language,
    user,
    enable_search,
    localCart,
    loginOpen,
    setLoginOpen: openLogin,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const enableCartAction = (s) => {
    disableAddToCartOption();
    if (typeof window !== "undefined")
      window.history.pushState({ isPopup: true }, "open Cart");
    enableCart(s);
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");

      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
  };

  return (
    <div
      className={`${enable_search && "hidden"} user-nav-container`}
      data-cy="Nav_CartIcon_LogIn"
    >
      {/* {user && (
        <div
          className="nav-question-item"
          style={{ marginRight: "30px", marginLeft: "0px" }}
        >
          <NotificationsTest />
        </div>
      )} */}
      <div
        className="nav-question-item cart-icon-selector cursor-pointer relative"
        style={{ marginRight: "30px", marginLeft: "0px" }}
        onClick={() => enableCartAction(true)}
      >
        {localCart?.length > 0 && (
          <div className="bg-green-500 right-[-8px] top-[-4px] text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center ">
            {localCart.length}
          </div>
        )}
        <CartIcon data-cy="cartIcon_mainPage" />
      </div>
      {!user && (
        <>
          <div className={`welcome-user ${language + "-medium"}`}>
            <span className={`${language + "-medium"}`}>
              {" "}
              {translate("Hello", language)}{" "}
            </span>
            <span className={`${language + "-medium"}`}>,</span>{" "}
            <span className={`${language + "-light"}`}>
              {translate("Welcome", language)}
            </span>
          </div>
          <div className="nav-question-item">
            <img
              src="/svg/questionIcon.svg"
              width={15}
              height={15}
              alt="info icon"
            />
            <span
              className={`${language + "-light"}`}
              style={{
                display: "flex",
                color: "rgba(248, 85, 85, 1)",
                fontSize: "14px",
                marginLeft: "5px",
                cursor: "pointer",
              }}
            >
              {translate(
                `${loginOpen ? "Can We Know You ?" : "Why We Know You ?"}`,
                language
              )}
            </span>
          </div>
          <div
            data-testid="login-text"
            data-cy="login-icon"
            className="nav-question-item"
            onClick={() => {
              openLogin(true);
              window.history.pushState({ isPopup: true }, "open Login");
            }}
          >
            <img src="/svg/login.svg" width={15} height={15} alt="login" />
            <span
              className={`${language + "-regular"}`}
              style={{
                display: "flex",
                color: "#707070",
                fontSize: "14px",
                marginLeft: "5px",
                cursor: "pointer",
                left: "-8px",
              }}
            >
              {translate("Login", language)}
            </span>
          </div>
        </>
      )}
      <div
        className="flex flex-row"
        style={{ marginLeft: "10px", cursor: "pointer" }}
      >
        {user ? (
          <AuthNavSection onClick={() => setMenuOpen(!menuOpen)} />
        ) : (
          <div className="nav-question-item">
            <Image
              src="/svg/userIcon.svg"
              quality={70}
              width={30}
              data-cy="avatar-options"
              onClick={() => setMenuOpen(!menuOpen)}
              height={30}
              alt="user-icon"
            />
          </div>
        )}
      </div>
      {menuOpen && <Menu user={user} setMenuOpen={setMenuOpen} />}
    </div>
  );
}

export default UserNavTopSection;
