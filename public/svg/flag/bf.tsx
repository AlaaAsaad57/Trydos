import * as React from "react";

const Bf = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 900 600"
    {...props}
  >
    <path fill="#009e49" d="M0 0h900v600H0z" />
    <path fill="#ef2b2d" d="M0 0h900v300H0z" />
    <g fill="#fcd116" transform="translate(450 300)">
      <g id="b">
        <path id="a" d="M0-100V0h50" transform="rotate(18 0 -100)" />
        <use xlinkHref="#a" transform="scale(-1 1)" />
      </g>
      <use xlinkHref="#b" transform="rotate(72)" />
      <use xlinkHref="#b" transform="rotate(144)" />
      <use xlinkHref="#b" transform="rotate(216)" />
      <use xlinkHref="#b" transform="rotate(288)" />
    </g>
  </svg>
);

export default Bf;
