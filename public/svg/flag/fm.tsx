import * as React from "react";

const Fm = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="-19 -10 38 20"
    {...props}
  >
    <path fill="#75b2dd" d="M-19-10h38v20h-38z" />
    <g id="c" fill="#fff" transform="translate(0 -6)">
      <g id="b">
        <path id="a" d="M0-2v2h1" transform="rotate(18 0 -2)" />
        <use xlinkHref="#a" transform="scale(-1 1)" />
      </g>
      <use xlinkHref="#b" transform="rotate(72)" />
      <use xlinkHref="#b" transform="rotate(144)" />
      <use xlinkHref="#b" transform="rotate(216)" />
      <use xlinkHref="#b" transform="rotate(288)" />
    </g>
    <use xlinkHref="#c" transform="rotate(90)" />
    <use xlinkHref="#c" transform="rotate(180)" />
    <use xlinkHref="#c" transform="rotate(270)" />
  </svg>
);

export default Fm;
