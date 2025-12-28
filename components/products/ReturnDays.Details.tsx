import Skeleton from "react-loading-skeleton";

import { translateFunction } from "utils/functions";

async function ReturnDaysDetails({
  language,
  globalPromise,
  StarttingSettingPromise,
}) {
  let [productData, starttingSetting] = await Promise.all([
    globalPromise,
    StarttingSettingPromise,
  ]);

  return (
    <span className="text-[#1d1d1d] regular text-[9px]">
      {translateFunction("within", language)}
      {starttingSetting ? (
        (starttingSetting?.shipping_duration_days || 0) +
        productData?.shipping_days
      ) : (
        <Skeleton width={20} height={14} />
      )}
      {translateFunction(
        "Days After Receiving The Product, You Can Return It Without Conditions Or Reasons With Complete Ease And",
        language
      )}
      <span className="meduim text-[#388CFF] px-[4px]">
        {translateFunction("get the Amount back", language)}
      </span>
    </span>
  );
}

export default ReturnDaysDetails;
