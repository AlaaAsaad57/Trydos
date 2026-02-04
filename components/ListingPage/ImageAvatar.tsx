import Image from "next/image";
import { getConfiguredImage } from "utils/functions";

function ImageAvatar({ image, width, height, alt, isActive, name, priority }) {
  return (
    <div className="image-avatar h-full relative select-none overflow-visible w-full rounded-50 flex no-navigate">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        className="no-navigate absolute top-0 left-0 z-5 overflow-visible"
        viewBox="0 0 35 35"
      >
        <g
          id="Ellipse_5"
          data-name="Ellipse 5"
          fill="none"
          stroke={name}
          strokeWidth="0.5"
        >
          <circle cx="50%" cy="50%" r="50%" stroke="none" />
          <circle cx="50%" cy="50%" r="50%" fill="none" />
        </g>
      </svg>

      <div className="shadow-inset-avatar rounded-50 absolute w-full h-full" />
      <Image
        loading="eager"
        width={50}
        height={50}
        src={getConfiguredImage({ src: image, width: 50, height: 50 })}
        alt={alt || "alt"}
        className="w-full no-navigate"
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

export default ImageAvatar;
