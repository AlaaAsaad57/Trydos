import * as React from "react";

const Spinn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 43 43" role="status" {...props}>
    <circle
      cx="21.5"
      cy="21.5"
      r="20"
      fill="none"
      strokeWidth="3"
      strokeDasharray={"126, 126"}
      strokeDashoffset={"0"}
    ></circle>
    <circle
      cx="21.5"
      cy="21.5"
      r="20"
      fill="none"
      strokeWidth="3"
      strokeDasharray={"126, 126"}
      strokeDashoffset={"75.6"}
    ></circle>
  </svg>
);

export default Spinn;
