import { FunctionComponent } from "react";
import Animated from "react-mount-animation";

export const AnimatedComponent: FunctionComponent<{
  show: boolean;
  children: React.ReactNode;
}> = ({ show, children }) => {
  console.log(children, "children");
  return (
    <Animated.div
      show={show}
      mountAnim="0% {opacity: 0} 100% {opacity: 1}"
      unmountAnim="0% {opacity: 1} 100% {opacity: 0}"
      style={{ animationFillMode: "forwards" }}
    >
      {show && <div data-testid="animated-container">{children}</div>}
    </Animated.div>
  );
};
