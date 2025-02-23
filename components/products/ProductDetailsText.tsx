"use client";
import { ProductInterface } from "models/product";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Sendevent, translateFunction } from "utils/functions";

function ProductDetailsText({ details, product }: { details: string; product: ProductInterface }) {
  const { lang } = useParams();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  // @ts-ignore
  const languageVariable = lang?.split("-")[1];
  const translate = useMemo(() => (key: string) => translateFunction(key, languageVariable), [languageVariable]);

  const isLongText = details.length > 95;
  const [show, setShow] = useState(false);

  useEffect(() => {
    const color = searchParams.get("color");
    if (color) {
      const selectedColor = product.sync_color_images?.find(s => s.color_name === color);
      if (selectedColor) {
        dispatch({ type: "SET-ACTIVE-COLOR-DETAILS", payload: selectedColor });
      }
    }
  }, [searchParams, dispatch, product.sync_color_images]);

  const toggleText = () => {
    const newShowState = !show;
    setShow(newShowState);
    Sendevent({ event: "button_clicked", value: newShowState ? "read_more_button" : "read_less_button" });
  };

  return (
    <div className="product-details-text">
      <div
        id="details"
        className="have-arabic"
        dangerouslySetInnerHTML={{ __html: show ? details : details.substring(0, 95) + "..." }}
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
