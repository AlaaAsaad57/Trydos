import * as React from "react";

const Sy = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 180 120"
    {...props}
  >
    <path d="M0 0h180v120H0z" />
    <path fill="#fff" d="M0 0h180v80H0z" />
    <path fill="#ce1126" d="M0 0h180v40H0z" />
    <g id="d" fill="#007a3d">
      <g id="c">
        <g id="b">
          <path id="a" d="M54 47v13h8" transform="rotate(18 54 47)" />
          <use xlinkHref="#a" x="-108" transform="scale(-1 1)" />
        </g>
        <use xlinkHref="#b" transform="rotate(72 54 60)" />
      </g>
      <use xlinkHref="#b" transform="rotate(-72 54 60)" />
      <use xlinkHref="#c" transform="rotate(144 54 60)" />
    </g>
    <use xlinkHref="#d" x="72" />
  </svg>
);

export default Sy;
