import FreeShippingIcon from "public/svg/product/FreeShipping.svg";
import { useParams } from "next/navigation";
import { translateFunction } from "utils/functions";
function FreeShippingOption() {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <div
      className={`product-colors product-sizes flex-col align-start relative`}
    >
      <div className="colors-label flex-row align-center">
        <FreeShippingIcon />
        <div className="flex-col" style={{ marginLeft: "20px" }}>
          <span>{translate("Free Shipping")}</span>
          <span className="label-description">
            {translate("Shipping Is Completely Free Without Any Extras")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FreeShippingOption;
