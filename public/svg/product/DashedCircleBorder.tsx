import * as React from "react";

const DashedCircleBorder = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="calc(100%)"
    height="calc(100%)"
    {...props}
  >
    <g
      id="Ellipse_283"
      data-name="Ellipse 283"
      fill="none"
      stroke="#6b6b6b"
      strokeWidth="0.5"
      stroke-dasharray="3 3"
    >
      <circle
        cx="calc(100% / 2)"
        cy="calc(100% / 2)"
        r="calc(100% / 2)"
        stroke="none"
      />
      <circle
        cx="calc(100% / 2)"
        cy="calc(100% / 2)"
        r="calc(100% / 2)"
        fill="none"
      />
    </g>
  </svg>
);

export default DashedCircleBorder;
