"use client";
import { ProductDetailsTextProps } from "models/componentType/productTypes/ProductDetailsTextPropsType";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppStore } from "store";
function ProductDetailsText({
  details,
  product,
  language,
}: ProductDetailsTextProps) {
  const { setActiveColorDetails } = useAppStore();
  const { lang } = useParams();
  const searchParams = useSearchParams();
  // @ts-ignore

  const isLongText = details?.length > 95;
  const [show, setShow] = useState(true);

  useEffect(() => {
    const color = searchParams.get("color");
    if (color) {
      const selectedColor = product?.find((s) => s.color_name === color);
      if (selectedColor) {
        setActiveColorDetails(selectedColor);
      }
    }
  }, [searchParams, product]);

  // const toggleText = () => {
  //   const newShowState = !show;
  //   if (newShowState) {
  //     GAevent({
  //       action: GA_EVENT_NAMES.READ_MORE,
  //       params: {
  //         user_id_custom: auth.UserID(),
  //         ...paramsGA,
  //       },
  //     });
  //   }
  //   setShow(newShowState);
  //   // Sendevent({
  //   //   event: GA_EVENT_NAMES.CLICK,
  //   //   value: newShowState
  //   //     ? GA_CLICK_EVENT_VALUES.READ_MORE_BUTTON
  //   //     : GA_CLICK_EVENT_VALUES.READ_LESS_BUTTON,
  //   // });
  // };
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className={`${isRtl ? "dir-rtl" : ""} product-details-text`}>
      <div
        id="details"
        className="have-arabic "
        dangerouslySetInnerHTML={{
          __html: show
            ? details
            : details
            ? details?.substring(0, 95) + "..."
            : "",
        }}
      />
      {/* {isLongText && (
        <span className="read-more" onClick={toggleText}>
          {translate(show ? "Read Less" : "Read More")}
        </span>
      )} */}
    </div>
  );
}

export default ProductDetailsText;
