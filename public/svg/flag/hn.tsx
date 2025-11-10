import * as React from "react";

const Hn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 72 36"
    {...props}
  >
    <path d="M0 0h72v36H0z" style="fill:#0073cf" />
    <path d="M0 12h72v12H0z" style="fill:#fff" />
    <g id="c" fill="#0073cf" transform="matrix(2 0 0 2 36 18)">
      <g id="b">
        <path id="a" d="M0 0v1h.5z" transform="rotate(18 3.157 -.5)" />
        <use xlinkHref="#a" transform="scale(-1 1)" />
      </g>
      <use xlinkHref="#b" transform="rotate(72)" />
      <use xlinkHref="#b" transform="rotate(-72)" />
      <use xlinkHref="#b" transform="rotate(144)" />
      <use xlinkHref="#b" transform="rotate(-144)" />
    </g>
    <use xlinkHref="#c" transform="translate(10 -3.2)" />
    <use xlinkHref="#c" transform="translate(10 2.8)" />
    <use xlinkHref="#c" transform="translate(-10 -3.2)" />
    <use xlinkHref="#c" transform="translate(-10 2.8)" />
  </svg>
);

export default Hn;
