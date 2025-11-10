import * as React from "react";

const An = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="-27 -14 54 36"
    {...props}
  >
    <path fill="#fff" d="M-27-14h54v36h-54z" />
    <path fill="#dc171d" d="M-6-14H6v36H-6z" />
    <path
      fill="#00007b"
      d="M-27-2h54v12h-54z"
      style="fill:#012a87;fill-opacity:1"
    />
    <g id="c" fill="#fff" transform="scale(1.5)">
      <g id="b">
        <path id="a" d="M0 0v1h.5z" transform="rotate(18 3.157 -.5)" />
        <use xlinkHref="#a" transform="scale(-1 1)" />
      </g>
      <use xlinkHref="#b" transform="rotate(72)" />
      <use xlinkHref="#b" transform="rotate(-72)" />
      <use xlinkHref="#b" transform="rotate(144)" />
      <use xlinkHref="#b" transform="rotate(-144)" />
    </g>
    <g id="d">
      <use xlinkHref="#c" transform="translate(8 3.314)" />
      <use xlinkHref="#c" transform="translate(3.314 8)" />
    </g>
    <use xlinkHref="#d" transform="scale(-1 1)" />
  </svg>
);

export default An;
