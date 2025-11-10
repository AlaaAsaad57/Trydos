import * as React from "react";

const Ve = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 180 120"
    {...props}
  >
    <defs>
      <g id="d" transform="translate(0 -36)">
        <g id="c">
          <g id="b">
            <path
              id="a"
              fill="#fff"
              d="M0-5v5h3z"
              transform="rotate(18 0 -5)"
            />
            <use xlinkHref="#a" transform="scale(-1 1)" />
          </g>
          <use xlinkHref="#b" transform="rotate(72)" />
        </g>
        <use xlinkHref="#b" transform="rotate(-72)" />
        <use xlinkHref="#c" transform="rotate(144)" />
      </g>
    </defs>
    <path fill="#cf142b" d="M0 0h180v120H0z" />
    <path fill="#00247d" d="M0 0h180v80H0z" />
    <path fill="#fc0" d="M0 0h180v40H0z" />
    <g transform="translate(90 84)">
      <g id="f">
        <g id="e">
          <use xlinkHref="#d" transform="rotate(10)" />
          <use xlinkHref="#d" transform="rotate(30)" />
        </g>
        <use xlinkHref="#e" transform="rotate(40)" />
      </g>
      <use xlinkHref="#f" transform="rotate(-80)" />
    </g>
  </svg>
);

export default Ve;
