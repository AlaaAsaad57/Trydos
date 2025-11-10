import * as React from "react";

const HeartFill = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width="30"
    height="30"
    viewBox="0 0 450 450"
    style="
    /* transform: translateY(-4px); */
"
    {...props}
  >
    <path
      d="M365.4 59.628c60.56 0 109.6 49.03 109.6 109.47 0 109.47-109.6 171.8-219.06 281.271C146.47 340.898 37 278.568 37 169.099c0-60.44 49.04-109.47 109.47-109.47 54.73 0 82.1 27.37 109.47 82.1 27.36-54.73 54.73-82.101 109.46-82.101"
      style="fill: rgb(255, 121, 121);"
    ></path>
  </svg>
);

export default HeartFill;
