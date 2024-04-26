import CategoryIcon from "public/svg/categoryIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import { ReactElement } from "react";
function CategoryBar(): ReactElement {
  const language: string = useSelector((state: any) => state.homepage.language);
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  return (
    <div className={`home-bar ${loginOpen && "hide-offers"}`}>
      <CategoryIcon />
      <BarDescribtion
        name={translate("Category", language)}
        desc={translate(
          "Enjoy Shopping From All Categories & Products From Various Brands",
          language
        )}
      />
    </div>
  );
}

export default CategoryBar;
