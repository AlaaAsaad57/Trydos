import { AnimatedComponentPropstype } from "models/componentType/AnimatedComponentPropsType";
import { useTransition, animated } from "react-spring";

export const AnimatedComponent = ({ show, children, ...rest }: AnimatedComponentPropstype) => {
  const transition = useTransition(show, {
    from: { x: -800 },
    enter: { x: 0 },
    leave: { x: 800 },
    config: {
      bounce: 0,
      clamp: false,
      precision: 0,
      friction: 10,
    },
  });
  return (
    <>
      {transition((style, item) =>
        item ? (
          <animated.div
            style={style}
            data-testid="animated-container"
            className="animated-container"
          >
            {children}
          </animated.div>
        ) : (
          <></>
        )
      )}
    </>
  );
};
