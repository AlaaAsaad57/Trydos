import CategoryIcon from "public/svg/categoryIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { translate } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function CategoryBar(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language").value;
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
