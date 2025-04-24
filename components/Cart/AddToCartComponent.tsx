import React, { useEffect, useState } from "react";

function AddToCartComponent({ color, size, product, enable }) {
  const [selectedColor, setSelectedColor] = useState(color);
  const [slectedSize, setSelectedSize] = useState(size);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState();
  useEffect(() => {
    return () => {};
  });
  return <div></div>;
}

export default AddToCartComponent;
