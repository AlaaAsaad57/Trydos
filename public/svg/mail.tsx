import * as React from "react";

const Mail = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <path
        d="M20,4 L4,4 C2.8954305,4 2,4.8954305 2,6 L2,18 C2,19.1045695 2.8954305,20 4,20 L20,20 C21.1045695,20 22,19.1045695 22,18 L22,6 C22,4.8954305 21.1045695,4 20,4 Z"
        fill="#4A5568"
      ></path>
      <path
        d="M20,6 L12,12 L4,6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        stroke-linejoin="round"
      ></path>
    </g>
  </svg>
);

export default Mail;
