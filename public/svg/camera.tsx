import * as React from "react";

const Camera = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g stroke="none" stroke-width="1" fill="none" fillRule="evenodd">
      <path
        d="M12,12 C13.1,12 14,11.1 14,10 C14,8.9 13.1,8 12,8 C10.9,8 10,8.9 10,10 C10,11.1 10.9,12 12,12 Z M12,14 C9.79,14 8,12.21 8,10 C8,7.79 9.79,6 12,6 C14.21,6 16,7.79 16,10 C16,12.21 14.21,14 12,14 Z"
        fill="#4A5568"
      ></path>
      <path
        d="M20,4 L4,4 C2.9,4 2,4.9 2,6 L2,18 C2,19.1 2.9,20 4,20 L20,20 C21.1,20 22,19.1 22,18 L22,6 C22,4.9 21.1,4 20,4 Z M20,18 L4,18 L4,6 L20,6 L20,18 Z"
        fill="#4A5568"
      ></path>
    </g>
  </svg>
);

export default Camera;
