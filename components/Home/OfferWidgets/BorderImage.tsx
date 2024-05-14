import { ReactElement } from "react";

function BorderImage(): ReactElement {
  const getWidth = (): string => {
    return "100%";
  };
  return (
    <svg
      className="image-border absolute z-[1] left-0 top-0"
      xmlns="http://www.w3.org/2000/svg"
      width={getWidth()}
      height={"100%"}
    >
      <g
        id="Rectangle_4745"
        data-name="Rectangle 4745"
        fill="none"
        stroke="#fafafa"
        strokeWidth="0.5"
      >
        <rect
          width={getWidth()}
          height={"calc(100% - 0.5px)"}
          rx="15"
          stroke="none"
        />
        <rect
          x="0.25"
          y="0.25"
          width={getWidth()}
          height={"calc(100% - 0.5px)"}
          rx="14.75"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default BorderImage;
