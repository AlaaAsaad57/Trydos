import * as React from "react";

const Point = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="25"
    height="25"
    viewBox="0 0 25 25"
    {...props}
  >
    <g transform="matrix(1, 0, 0, 1, 0, 0)">
      <circle
        id="Ellipse_355-2"
        data-name="Ellipse 355"
        cx="3.5"
        cy="3.5"
        r="3.5"
        transform="translate(9 6)"
        fill="#007cff"
      />
    </g>
  </svg>
);

export default Point;
