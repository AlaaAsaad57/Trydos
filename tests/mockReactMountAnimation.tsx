import React from "react";

// Mock Animated component
const MockAnimated = ({ show, children, ...props }) => {
  return React.createElement("div", { ...props }, show ? children : null);
};

// Mock the entire react-mount-animation module
const MockReactMountAnimation = {
  default: {
    div: MockAnimated,
  },
};

export default MockReactMountAnimation;
