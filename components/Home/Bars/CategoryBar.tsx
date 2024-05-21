import CategoryIcon from "public/svg/categoryIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { translate } from "utils/functions";
import { ReactElement } from "react";
import Cookies from "js-cookie";
function CategoryBar(): ReactElement {
  const language = Cookies.get("language");
  return (
    <div className={`home-bar`}>
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
