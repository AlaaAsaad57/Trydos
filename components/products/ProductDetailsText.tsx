"use client";
import React, { useEffect, useState } from "react";
import { encode_utf8 } from "utils/functions";

function ProductDetailsText({ details }: { details: string }) {
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
