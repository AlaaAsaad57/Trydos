import Image from "next/image";
import { memo } from "react";
import { getConfiguredImage } from "utils/functions";

function ImageAvatar({
  image,
  width,
  height,
  alt,
  isActive,
  name,
}: {
  image: string;
  width: number;
  height: number;
  alt: string;
  isActive: boolean;
  name: string;
}) {
  return (
    <div className="image-avatar">
      {isActive ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 35 35"
        >
          <g
            id="Ellipse_5"
            data-name="Ellipse 5"
            fill="none"
            stroke={name === "blue" ? "#0048AC" : name}
            strokeWidth="0.5"
          >
            <circle cx="50%" cy="50%" r="50%" stroke="none" />
            <circle cx="50%" cy="50%" r="50%" fill="none" />
          </g>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 35 35"
        >
          <g
            id="Ellipse_5"
            data-name="Ellipse 5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.5"
          >
            <circle cx="50%" cy="50%" r="50%" stroke="none" />
            <circle cx="50%" cy="50%" r="50%" fill="none" />
          </g>
        </svg>
      )}
      {isActive && (
        <div className="avatar-text-element" style={{ color: name }}>
          {name}
        </div>
      )}
      <div className="shadow-inset-avatar" />
      <Image
        loading="eager"
        unoptimized
        src={getConfiguredImage({ src: image, width: 400, height: 580 })}
        fill
        alt={alt || "alt"}
        style={{
          borderRadius: "50%",
          zIndex: "3",
          height: "100%",
          objectPosition: "center top",
          objectFit: "cover",
        }}
      />
    </div>
  );
}

export default memo(ImageAvatar);
