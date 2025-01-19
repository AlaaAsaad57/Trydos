"use client";
import { ProductInterface } from "models/product";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { encode_utf8, Sendevent, translateFunction } from "utils/functions";

function ProductDetailsText({
  details,
  product,
}: {
  details: string;
  product: ProductInterface;
}) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  useEffect(() => {
    if (searchParams.get("color"))
      dispatch({
        type: "SET-ACTIVE-COLOR-DETAILS",
        payload: product.sync_color_images?.filter(
          (s) => s.color_name === searchParams.get("color")
        )[0],
      });
  }, []);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (details) {
      encode_utf8({
        element: document.querySelectorAll(`.product-details-text #details`),
        s: details.substring(0, 95) + "...",
      });
    }
  }, []);
  return (
    <div className="product-details-text">
      <div id="details" className="have-arabic"></div>
      {!show ? (
        <span
          className="read-more"
          onClick={() => {
            Sendevent({ event: "button_clicked", value: "read_more_button" });
            setShow(true);
            encode_utf8({
              element: document.querySelectorAll(
                `.product-details-text #details`
              ),
              s: details,
            });
          }}
        >
          {translate("Read More")}{" "}
        </span>
      ) : (
        <span
          className="read-more"
          onClick={() => {
            Sendevent({ event: "button_clicked", value: "read_less_button" });
            setShow(false);
            encode_utf8({
              element: document.querySelectorAll(
                `.product-details-text #details`
              ),
              s: details.substring(0, 95) + "...",
            });
          }}
        >
          {translate("Read Less")}{" "}
        </span>
      )}
    </div>
  );
}

export default ProductDetailsText;
