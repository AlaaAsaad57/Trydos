import React from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: package includes its own declaration file
import Cube from "react-cube-navigation";

/**
 * This wrapper simply re-exports the `Cube` component from the
 * `react-cube-navigation` package while maintaining the exact same prop
 * surface that the rest of the codebase expects. This means we can keep the
 * local import path (`./CubeCarousel`) unchanged in existing files.
 */

export interface CubeCarouselProps {
  /** Currently active slide index */
  index: number;
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

const CubeCarousel: React.FC<CubeCarouselProps> = ({
  lockScrolling = true,
  ...rest
}) => {
  return <Cube lockScrolling={lockScrolling} {...rest} />;
};

export default CubeCarousel;
