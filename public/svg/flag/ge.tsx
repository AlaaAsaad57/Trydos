import * as React from "react";

const Ge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 300 200"
    {...props}
  >
    <defs>
      <g id="c">
        <clipPath id="a">
          <path d="M-109 104a104 104 0 0 0 0-208h218a104 104 0 0 0 0 208z" />
        </clipPath>
        <path
          id="b"
          d="M-55 74a55 55 0 0 1 110 0V-74a55 55 0 0 1-110 0z"
          clipPath="url(#a)"
        />
        <use xlinkHref="#b" transform="rotate(90)" />
      </g>
    </defs>
    <path d="M0 0h300v200H0z" style="fill:#fff" />
    <path d="M130 0v80H0v40h130v80h40v-80h130V80H170V0h-40z" style="fill:red" />
    <use xlinkHref="#c" fill="red" transform="translate(64.45 39.45)" />
    <use xlinkHref="#c" fill="red" transform="translate(235.55 160.55)" />
    <use xlinkHref="#c" fill="red" transform="translate(235.55 39.45)" />
    <use xlinkHref="#c" fill="red" transform="translate(64.45 160.55)" />
  </svg>
);

export default Ge;
