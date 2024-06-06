import React from "react";

const MockAnimated = ({ show, children, ...props }) => {
  return React.createElement("div", { ...props }, show ? children : null);
};

const MockReactMountAnimation = {
  default: {
    div: MockAnimated,
  },
};

export default MockReactMountAnimation;
