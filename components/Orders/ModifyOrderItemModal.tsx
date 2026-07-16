
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { findVariation, GetImageUrl } from "utils/tinyUtils";

import { showErrorNotification } from "store/notifications/reducer";

export const ColorList = ({
  colors,
  setColor,
  currentColor,
  newColor,
  sizes,
  current_size,
  item,
  variations,
}) => {
  const isActive = (color) => {
    if (!newColor)
      return color?.color_name?.toLowerCase() === currentColor?.toLowerCase();
    else if (
      newColor?.toLowerCase() === color?.color_name?.toLowerCase() ||
      newColor?.toLowerCase() === color?.color_option?.toLowerCase()
    )
      return true;
    else return false;
  };
  return (
    <HortiznalScrollBar
      className="w-full h-[98px] flex-row gap-[10px] pt-px"
      id="color-list-container"
    >
      {colors?.map((s) => {
        let variation = findVariation(
          variations,
          colors,
          sizes,
          s?.color_name,
          current_size,
        );
        let disabled =
          s?.color_name?.toLowerCase() === currentColor?.toLowerCase()
            ? false
            : variation?.qty < item.qty;

        return (
          <div
            key={s.color_name}
            className={`${disabled} w-auto h-[98px] flex-col items-center justify-center`}
            onClick={() => {
              if (!disabled) setColor(s?.color_option);
              else
                showErrorNotification(
                  translateFunction("this option dosent have enough quantity"),
                );
            }}
          >
            <img
              style={{
                border: isActive(s)
                  ? "1px solid #402CDDef"
                  : "1px solid #ffffffef",
              }}
              className="min-w-[70px] min-h-[70px] object-cover rounded-full max-w-[70px] max-h-[70px]"
              src={getConfiguredImage({
                src: GetImageUrl(s?.images[0]),
                width: 70,
                height: 70,
                q: 100,
              })}
            />
            <span
              className={`${
                isActive(s) ? "text-[#402CDD] medium" : "text-[#5D5C5D] regular"
              } text-[14px]  mt-[9px]`}
            >
              {s?.color_name}
            </span>
          </div>
        );
      })}
    </HortiznalScrollBar>
  );
};
export const SizeList = ({
  sizes,
  setSize,
  currentSize,
  newSize,
  image,
  colors,
  currentColor,
  item,
  variations,
}: any) => {
  const isActive = (name) => {
    if (!newSize) return name?.toLowerCase() === currentSize?.toLowerCase();
    else {
      return name?.toLowerCase() === newSize?.toLowerCase();
    }
  };

  return (
    <div
      data-cy="countainer_ofSize_scroller"
      className="flex-row h-[96px] max-h-[96px] w-full  relative"
    >
      <HortiznalScrollBar
        className="w-full h-[98px] flex-row gap-[10px] mt-px"
        id="color-list-container"
      >
        {sizes?.map((s) => {
          let variation = findVariation(
            variations,
            colors,
            sizes,
            currentColor,
            s,
          );
          let disabled =
            s?.name?.toLowerCase() === currentSize?.toLowerCase()
              ? false
              : variation?.qty < item.qty;

          return (
            <div
              key={s}
              className={`${
                disabled && "opacity-75"
              } w-auto h-[98px] flex-col items-center justify-center pt-px`}
              onClick={() => {
                if (!disabled) setSize(s);
                else
                  showErrorNotification(
                    translateFunction(
                      "this option dosent have enough quantity",
                    ),
                  );
              }}
            >
              <img
                style={{
                  border: isActive(s)
                    ? "1px solid #402CDDef"
                    : "1px solid #ffffffef",
                }}
                className="min-w-[70px] min-h-[70px] object-cover rounded-full max-w-[70px] max-h-[70px]"
                src={getConfiguredImage({
                  src: GetImageUrl(image),
                  width: 70,
                  height: 70,
                  q: 100,
                })}
              />
              <span
                className={`${
                  isActive(s)
                    ? "text-[#402CDD] medium"
                    : "text-[#5D5C5D] regular"
                } text-[14px]  mt-[9px]`}
              >
                {s}
              </span>
            </div>
          );
        })}
      </HortiznalScrollBar>
    </div>
  );
};
