import { useEffect, useState } from "react";
import CategoriesBar from "./CategoriesBar";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage } from "store/homepage/actions";
interface NavbarProps {
  init: string;
}
function Navbar({ init }: NavbarProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const language = useSelector((state: any) => state.homepage.language);
  const dispatch = useDispatch();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    Cookies.set("country", init.split("-")[0]);
    dispatch(
      changeAppLanguage(
        init.split("-")[1] ||
          languageCookies ||
          language ||
          process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE
      )
    );
  };
  useEffect(() => {
    initFunc();
  }, []);
  return (
    <div className="home-navbar">
      <Logo animated={false} style={false} key={1} />
      <CategoriesBar key={2} forMobile={false} />
      {
        <UserNavTopSection
          loginOpen={loginOpen}
          openLogin={(e) => setLoginOpen(e)}
        />
      }
    </div>
  );
}

export default Navbar;
