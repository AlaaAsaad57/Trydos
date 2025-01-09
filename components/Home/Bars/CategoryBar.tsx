import BarDescribtion from "./BarDescribtion";
import { translateFunction } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function CategoryBar(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;
  return (
    <div className={`home-bar`}>
      <img src={"/svg/categoryIcon.svg"} alt="category offer icon" />
      <BarDescribtion
        name={translateFunction("Category", language)}
        desc={translateFunction(
          "Enjoy Shopping From All Categories & Products From Various Brands",
          language
        )}
      />
    </div>
  );
}

export default CategoryBar;
