import React from "react";

function ProductItem({ product }) {
  return (
    <div className="result-product flex-row">
      <div className="image-result">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="34"
          height="50"
          viewBox="0 0 34 50"
        >
          <g
            id="Rectangle_5686"
            data-name="Rectangle 5686"
            fill="none"
            stroke="#388cff"
            strokeWidth="0.3"
          >
            <path
              d="M15,0H29a5,5,0,0,1,5,5V45a5,5,0,0,1-5,5H15A15,15,0,0,1,0,35V15A15,15,0,0,1,15,0Z"
              stroke="none"
            />
            <path
              d="M15,.15H29A4.85,4.85,0,0,1,33.85,5V45A4.85,4.85,0,0,1,29,49.85H15A14.85,14.85,0,0,1,.15,35V15A14.85,14.85,0,0,1,15,.15Z"
              fill="none"
            />
          </g>
        </svg>

        <img src={product.photo} />
      </div>
      <div className="result-product-text">{product.name}</div>
    </div>
  );
}

export default ProductItem;
