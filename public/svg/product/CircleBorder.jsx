import React from "react";

function CircleBorder({ color }) {
  return (
    <svg
      className="circel-border absolute"
      xmlns="http://www.w3.org/2000/svg"
      width="calc(100%)"
      height="calc(100%)"
    >
      <g
        id="Ellipse_283"
        data-name="Ellipse 283"
        fill="none"
        stroke="#fff"
        stroke-width="0.5"
      >
        <circle
          cx="calc(100% / 2)"
          cy="calc(100% / 2)"
          r="calc(100% / 2)"
          stroke={color}
        />
        <circle cx="calc(100% / 2)" cy="calc(100% / 2)" fill="none" />
      </g>
    </svg>
  );
}

export default CircleBorder;
