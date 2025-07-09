"use client";
import { getConfiguredImage, translateFunction } from "utils/functions";
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
import { GetImageUrl } from "utils/tinyUtils";
import { UserData } from "utils/cookies/cookie-manager";
import { useUserData } from "hooks/useUserData";

function UserNavTopSection({
  initialUserData,
}: {
  initialUserData: {
    userData: UserData | null;
    userChat: UserData | null;
    userStories: UserData | null;
  };
}) {
  // State to track if component is mounted (client-side)

  const { userData, userChat, userStories } = useUserData({ initialUserData });
  // Handle mounting and cookie access
  const getUserType = () => {
    if (userData) {
      if (userData.phone === "0" || !userData.phone) {
        return "NEW_USER";
      } else {
        if (userData.is_phone_verified === 1 && userChat?.id && userStories?.id)
          return "authed-user";
        else return "Verified User";
      }
    } else {
      return "NEW_USER";
    }
  };
  const UserActiveIcon = () => {
    if (getUserType() === "NEW_USER") {
      return (
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
            className={`regular`}
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
      );
    } else if (getUserType() === "Verified User") {
      return (
        <div
          data-testid="login-text"
          data-cy="login-icon"
          className="nav-question-item"
          onClick={() => {
            setShouldAuthinticated(true);
            window.history.pushState({ isPopup: true }, "open Login");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16.413"
            height="16.412"
            viewBox="0 0 16.413 16.412"
          >
            <g
              id="Group_3290"
              data-name="Group 3290"
              transform="translate(-37.223 -62.334)"
            >
              <g
                id="Group_3166"
                data-name="Group 3166"
                transform="translate(42.657 68.141)"
              >
                <g
                  id="Group_3165"
                  data-name="Group 3165"
                  transform="translate(0 0)"
                >
                  <path
                    id="Path_15412"
                    data-name="Path 15412"
                    d="M34.744,30.414a.684.684,0,0,0-.968,0l-2.939,2.939-1.228-1.228a.685.685,0,1,0-.968.968l1.71,1.712a.684.684,0,0,0,.968,0l3.425-3.423a.684.684,0,0,0,0-.968Z"
                    transform="translate(-28.418 -30.213)"
                    fill="#707070"
                    stroke="#3c3c3c"
                    strokeWidth="0.111"
                  />
                </g>
              </g>
              <path
                id="Path_15413"
                data-name="Path 15413"
                d="M15.332,7.332A.667.667,0,0,0,14.665,8a6.668,6.668,0,1,1-1.936-4.7.667.667,0,1,0,.945-.94A8,8,0,1,0,16,8a.667.667,0,0,0-.667-.667Z"
                transform="translate(37.438 62.538)"
                fill={"none"}
                stroke="#707070"
                strokeWidth="0.4"
              />
            </g>
          </svg>
          <span
            className={`regular`}
            style={{
              display: "flex",
              color: "#707070",
              fontSize: "14px",
              marginLeft: "5px",
              cursor: "pointer",
              left: "-8px",
            }}
          >
            {translate("Verify", language)}
          </span>
        </div>
      );
    } else {
      return <></>;
    }
  };

  const {
    enableCart,
    disableAddToCartOption,
    language,
    enable_search,
    localCart,
    loginOpen,
    setLoginOpen: openLogin,
    setShouldAuthinticated,
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

  // Show loading/skeleton until mounted to prevent hydration mismatch

  return (
    <div
      className={`${enable_search && "hidden"} user-nav-container`}
      data-cy="Nav_CartIcon_LogIn"
    >
      <div
        className="nav-question-item cart-icon-selector cursor-pointer relative"
        data-cy="cart_icon_button"
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

      {(!userData || getUserType() === "NEW_USER") && (
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
        </>
      )}
      {<UserActiveIcon />}
      <div
        className="flex flex-row"
        style={{ marginLeft: "10px", cursor: "pointer" }}
      >
        {userChat ? (
          <AuthNavSection
            userData={userData}
            onClick={() => setMenuOpen(!menuOpen)}
          />
        ) : (
          <div className="nav-question-item">
            <Image
              src={
                userData?.image || userData?.image
                  ? getConfiguredImage({
                      src: GetImageUrl(userData?.image || userData?.image),
                      width: 30,
                      height: 30,
                      q: 80,
                    })
                  : "/svg/userIcon.svg"
              }
              quality={90}
              width={30}
              data-cy="avatar-options"
              className="avatar-user-image object-cover object-center"
              onClick={() => setMenuOpen(!menuOpen)}
              height={30}
              alt="user-icon"
            />
          </div>
        )}
      </div>
      {menuOpen && <Menu user={userData} setMenuOpen={setMenuOpen} />}
    </div>
  );
}

export default UserNavTopSection;
