"use client";
import { ProductInterface } from "models/product";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { encode_utf8 } from "utils/functions";

function ProductDetailsText({
  details,
  product,
}: {
  details: string;
  product: ProductInterface;
}) {
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
      <div id="details"></div>
      {!show && (
        <span
          className="read-more"
          onClick={() => {
            setShow(true);
            encode_utf8({
              element: document.querySelectorAll(
                `.product-details-text #details`
              ),
              s: details,
            });
          }}
        >
          Read More{" "}
        </span>
      )}
    </div>
  );
}

export default ProductDetailsText;
