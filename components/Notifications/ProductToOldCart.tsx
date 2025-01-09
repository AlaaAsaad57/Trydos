"use client";

import React from "react";
import { useDispatch } from "react-redux/es";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
function ProductToOldCart({ data }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCart = () => {
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: true });

    const newParams = new URLSearchParams(searchParams);
    newParams.set("cart", "true");

    // Use router.push with pathname and updated query
    router.push(`${pathname}?${newParams.toString()}`);
  };
  return (
    <div className="flex-col" onClick={() => openCart()}>
      <div className="regular p-2">{data.boutique_description}</div>
      <div className="flex-row items-center">
        <div className="b-icon">
          <img width={20} height={20} src={"svg/CartIcon.svg"} />
        </div>
        <div className={`regular inline ml-2 boutique-desc-notification`}>
          {data.product_name}{" "}
          <span className="ml-1">has converted to old cart</span>
        </div>
      </div>
    </div>
  );
}

export default ProductToOldCart;
