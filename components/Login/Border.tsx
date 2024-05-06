import React from "react";

function Border({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      <g
        id="Rectangle_4748"
        data-name="Rectangle 4748"
        fill="none"
        stroke="#707070"
        stroke-width="0.5"
        stroke-dasharray="3 3"
      >
        <rect width="100%" height="100%" rx="20" stroke="none" />
        <rect
          x="0.25"
          y="0.25"
          width="calc(100% - 0.5px)"
          height="calc(100% - 0.5px)"
          rx="19.75"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default Border;
