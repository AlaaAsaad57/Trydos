import React from "react";

import Cube from "react-cube-navigation";

export interface CubeCarouselProps {
  /** Currently active slide index */
  index: number;

  enableGestures?: boolean;
  /** Called when user navigates to another slide */
  onChange: (newIndex: number) => void;
  /** Pixel width of every slide */
  width: number;
  /** Pixel height of every slide */
  height: number;
  /** Disable body scroll while dragging – kept for API parity */
  lockScrolling?: boolean;
  /** Not used – kept for API parity */
  scaleRange?: [number, number];
  /** Return `true` if the provided index has a next slide */
  hasNext?: (i: number) => boolean;
  /** Render slide content */
  renderItem: (index: number, active: boolean) => React.ReactNode;
}

const CubeCarousel = ({
  lockScrolling = true,
  enableGestures = true,
  ...rest
}) => {
  return (
    <Cube
      lockScrolling={lockScrolling}
      enableGestures={enableGestures}
      {...(rest as CubeCarouselProps)}
    />
  );
};

export default CubeCarousel;
