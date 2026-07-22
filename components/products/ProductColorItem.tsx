"use client";
import Image from "next/image";
import NextLink from "components/global/NextLink";
import { useLiveColor } from "hooks/useLiveColor";

const Border = ({ active }: { active: boolean }) => (
  <svg
    className="absolute top-0 left-0 z-40"
    xmlns="http://www.w3.org/2000/svg"
    width="50"
    height="73"
    viewBox="0 0 50 73"
  >
    <g id="Path_23648" data-name="Path 23648" fill="none">
      <path
        d="M6,0H44a6,6,0,0,1,6,6V67a6,6,0,0,1-6,6H6a6,6,0,0,1-6-6V6A6,6,0,0,1,6,0Z"
        stroke="none"
      />
      <path
        d="M 6 0.5 C 2.967288970947266 0.5 0.5 2.967292785644531 0.5 6 L 0.5 67 C 0.5 70.03270721435547 2.967288970947266 72.5 6 72.5 L 44 72.5 C 47.03271102905273 72.5 49.5 70.03270721435547 49.5 67 L 49.5 6 C 49.5 2.967292785644531 47.03271102905273 0.5 44 0.5 L 6 0.5 M 6 0 L 44 0 C 47.3137092590332 0 50 2.686286926269531 50 6 L 50 67 C 50 70.31369781494141 47.3137092590332 73 44 73 L 6 73 C 2.686290740966797 73 0 70.31369781494141 0 67 L 0 6 C 0 2.686286926269531 2.686290740966797 0 6 0 Z"
        stroke="none"
        fill={active ? "#513AAF" : "#d3d3d3"}
      />
    </g>
  </svg>
);

// One color thumbnail. Active state is derived from the live `?color` param on
// the client (useLiveColor) because query-only navigations reuse the stale
// server render and the server-computed activeColor never updates.
function ProductColorItem({
  colorKeys,
  serverColor,
  href,
  imgSrc,
  alt,
  trend,
}) {
  const liveColor = useLiveColor(serverColor);
  const isActive = colorKeys?.includes(liveColor);
  const content = (
    <>
      {trend && (
        <span className="absolute top-[-6px] left-[-2px] z-50">
          <img src="/icons/TrendColorIcon.svg" />
        </span>
      )}
      <Border active={Boolean(isActive)} />
      <Image
        src={imgSrc}
        width={50}
        height={73}
        className="w-[50px] h-[73px] rounded-[6px] select-none"
        alt={alt ?? ""}
      />
    </>
  );
  const className =
    "min-w-[50px] w-[50px] h-[73px] relative select-none cursor-pointer";
  if (isActive) return <div className={className}>{content}</div>;
  return (
    <NextLink disableScroll={false} href={href} className={className}>
      {content}
    </NextLink>
  );
}

export default ProductColorItem;
