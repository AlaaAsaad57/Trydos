import * as React from "react";

const Send = (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M4,12 L20,4 L16,20 L4,12 Z M4,12 L12,12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>
);

export default Send;
