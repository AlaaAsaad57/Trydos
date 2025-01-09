import BarDescribtion from "./BarDescribtion";
import { translateFunction } from "utils/functions";
import { cookies } from "next/headers";
function BrandsBar() {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;
  return (
    <div className={`home-bar`}>
      <img src={"/svg/starIcon.svg"} alt="star icon" />
      <BarDescribtion
        name={translateFunction("Brands", language)}
        desc={translateFunction("Best Offers From Brands", language)}
      />
    </div>
  );
}

export default BrandsBar;
