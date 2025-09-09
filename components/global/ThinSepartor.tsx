import React from "react";

function ThinSepartor({ className = "", style = {} }) {
  return (
    <svg
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="0.5"
    >
      <line
        id="Line_1011"
        data-name="Line 1011"
        x2="100%"
        transform="translate(0 0.25)"
        fill="none"
        stroke="#d3d3d3"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export default ThinSepartor;
