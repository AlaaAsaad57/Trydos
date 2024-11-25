import NextLink from "Hooks/NextLink";
import React, { useEffect } from "react";
import { encode_utf8 } from "utils/functions";
import CartIcon from "public/svg/CartIcon.svg";
import { useDispatch } from "node_modules/react-redux/es";
function ProductToOldCart({ data }) {
  const dispatch = useDispatch();

  const openCart = () => {
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: true });
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
