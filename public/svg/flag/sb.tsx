import * as React from "react";

const Sb = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 800 400"
    {...props}
  >
    <path fill="#0051ba" d="M0 400V0h800z" />
    <path fill="#215b33" d="M0 400h800V0z" />
    <path stroke="#fcd116" stroke-width="36" d="M0 400 800 0" />
    <g transform="translate(140 120)">
      <g id="d" fill="#fff">
        <g id="c">
          <g id="b">
            <path id="a" d="M0-40V0h20z" transform="rotate(18 0 -40)" />
            <use xlinkHref="#a" transform="scale(-1 1)" />
          </g>
          <use xlinkHref="#b" transform="rotate(72)" />
        </g>
        <use xlinkHref="#b" transform="rotate(-72)" />
        <use xlinkHref="#c" transform="rotate(144)" />
      </g>
      <g id="f" transform="rotate(40.6)">
        <use xlinkHref="#d" id="e" x="-104" transform="rotate(-40.6 -104 0)" />
        <use xlinkHref="#e" x="208" />
      </g>
      <use xlinkHref="#f" transform="scale(-1 1)" />
    </g>
  </svg>
);

export default Sb;
