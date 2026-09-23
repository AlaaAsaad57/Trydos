import React from "react";
import { XD_ICON_SIZE, type XdIconName } from "./xdIcons";

/**
 * One icon cut out of the XD file (public/assets/demo/xd/<name>.svg).
 *
 * It is drawn at the size the designer drew it, unless `size` asks for a
 * different width (the height follows). A plain <img>: the icons are static,
 * and keeping them out of the JavaScript keeps the demo bundle small.
 */
export default function XdIcon({
  name,
  size,
  className = "",
  style,
}: {
  name: XdIconName;
  /** Width in design px. Omit it for the size in the file. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const box = XD_ICON_SIZE[name];
  const width = size ?? box.w;
  const height = size ? (size * box.h) / box.w : box.h;
  return (
    <img
      src={`/assets/demo/xd/${name}.svg`}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={width}
      height={height}
      className={`block select-none pointer-events-none ${className}`}
      style={{ width, height, ...style }}
    />
  );
}
