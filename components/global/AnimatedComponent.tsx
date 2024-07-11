import Animated from "react-mount-animation";

export const AnimatedComponent = ({ show, children, ...rest }) => {
  return (
    <Animated.div
      {...rest}
      show={show}
      mountAnim="0% {opacity: 0} 100% {opacity: 1}"
      unmountAnim="0% {opacity: 1} 100% {opacity: 0}"
      style={{ animationFillMode: "forwards" }}
    >
      {show && <div data-testid="animated-container">{children}</div>}
    </Animated.div>
  );
};
