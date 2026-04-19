import { getConfiguredImage, GetImageUrl } from "utils/server";

function ImageCircel({
  term,
  name,
  image = null,
  value,
  size = 70,
  isActive,
  color = null,
}) {
  return (
    <div className="flex flex-col w-auto gap-[4px]">
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: isActive ? `1px solid ##FF5F61` : `1px solid #fff`,
          backgroundColor: color ?? "transparent",
        }}
        className="rounded-full relative flex items-center justify-center"
        data-filter={term}
        data-filter-value={value?.replace("#", "")}
      >
        <span
          data-filter={term}
          data-filter-value={value?.replace("#", "")}
          style={{
            boxShadow: `inset 0px 4px 6px #ffffff80, 0px 3px 3px #0000000a`,
          }}
          className="absolute rounded-full w-full h-full z-0"
        ></span>
        {isActive && (
          <span className="absolute top-0 left-0">
            <img src="/icons/ActiveCategoryIcon.svg" />
          </span>
        )}
        {image && (
          <img
            className="object-cover object-center rounded-full"
            src={getConfiguredImage({
              src: GetImageUrl(image),
              height: 100,
              width: 100,
            })}
          />
        )}
        {!image && !color && (
          <span className="text-[12px] bold text-[#505050]">{name}</span>
        )}
      </div>
      <span className="regular text-[12px] text-[#8E8E8E]">{name}</span>
    </div>
  );
}

export default ImageCircel;
