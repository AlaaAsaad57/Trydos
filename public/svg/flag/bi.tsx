import * as React from "react";

const Bi = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 500 300"
    {...props}
  >
    <defs>
      <use xlinkHref="#a" id="f" x="250" y="106" />
      <g id="a" fill="#1eb53a">
        <g id="e">
          <g id="d">
            <g id="c">
              <path id="b" d="M0-20V0h20" transform="rotate(30 0 -20)" />
              <use xlinkHref="#b" transform="scale(-1 1)" />
            </g>
            <use xlinkHref="#c" transform="rotate(120)" />
            <use xlinkHref="#c" transform="rotate(240)" />
          </g>
          <use xlinkHref="#d" transform="rotate(180)" />
        </g>
        <use xlinkHref="#e" fill="#ce1126" transform="scale(.82)" />
      </g>
    </defs>
    <path fill="#ce1126" d="M0 0h500L0 300h500z" />
    <path fill="#1eb53a" d="M0 0v300L500 0v300z" />
    <path stroke="#fff" stroke-width="40" d="m0 0 500 300m0-300L0 300" />
    <circle cx="250" cy="150" r="85" fill="#fff" />
    <use xlinkHref="#f" />
    <use xlinkHref="#f" transform="rotate(120 250 150)" />
    <use xlinkHref="#f" transform="rotate(240 250 150)" />
  </svg>
);

export default Bi;
