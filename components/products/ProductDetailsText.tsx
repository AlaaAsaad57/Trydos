"use client";
import { ProductInterface } from "models/product";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

function ProductDetailsText({
  details,
  product,
}: {
  details: string;
  product: ProductInterface["sync_color_images"];
}) {
  const { setActiveColorDetails } = useAppStore();
  const { lang } = useParams();
  const searchParams = useSearchParams();
  // @ts-ignore
  const languageVariable = lang?.split("-")[1];
  const translate = useMemo(
    () => (key: string) => translateFunction(key, languageVariable),
    [languageVariable]
  );

  const isLongText = details?.length > 95;
  const [show, setShow] = useState(false);

  useEffect(() => {
    const color = searchParams.get("color");
    if (color) {
      const selectedColor = product?.find((s) => s.color_name === color);
      if (selectedColor) {
        setActiveColorDetails(selectedColor);
      }
    }
  }, [searchParams, product]);

  const toggleText = () => {
    const newShowState = !show;
    setShow(newShowState);
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: newShowState
    //     ? GA_CLICK_EVENT_VALUES.READ_MORE_BUTTON
    //     : GA_CLICK_EVENT_VALUES.READ_LESS_BUTTON,
    // });
  };

  return (
    <div className="product-details-text">
      <div
        id="details"
        className="have-arabic"
        dangerouslySetInnerHTML={{
          __html: show
            ? details
            : details
            ? details?.substring(0, 95) + "..."
            : "",
        }}
      />
      {isLongText && (
        <span className="read-more" onClick={toggleText}>
          {translate(show ? "Read Less" : "Read More")}
        </span>
      )}
    </div>
  );
}

export default ProductDetailsText;
