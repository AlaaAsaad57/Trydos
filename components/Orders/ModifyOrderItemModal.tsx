import { useEffect, useRef, useState } from "react";
import LargeColorIcon from "public/svg/LargeColorIcon.svg";
import Spinner from "components/global/Spinner";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { ColorListPropsType } from "models/componentType/ColorListPropsType";
import { ModifyOrderItemModalPropsType } from "models/componentType/ModifyOrderItemModalPropsType";
import { SizeListPropsType } from "models/componentType/SizeListPropsType";
import order from "services/order";
export const ModifyOrderItemModal = ({
  type,
  confirmationData,
  setConfirmationData,
  orderItem,
  getOrderDetails,
  close,
}: ModifyOrderItemModalPropsType) => {
  const [loading, setLoading] = useState(false);
  const isChanged = () => {
    if (
      (type === "Color" &&
        confirmationData?.currentColor?.toLowerCase() !==
          confirmationData?.newColor?.toLowerCase()) ||
      (type === "Size" &&
        confirmationData?.currentSize?.toLowerCase() !==
          confirmationData?.newSize?.toLowerCase())
    )
      return true;
    else return false;
  };
  const ConfirmChange = async () => {
    setLoading(true);
    await order.changeOrderItemVariant({
      choice_1: confirmationData?.newSize ?? "",
      color: confirmationData?.productDetails?.colors?.find(
        (s) => s.option === confirmationData.newColor
      )?.color,
      order_detail_id: confirmationData?.detail_id,
    });
    setLoading(false);
    setConfirmationData(false);
    getOrderDetails();
    close();
  };

  return (
    <div
      className={`z-[9999999999999] pb-[70px] px-[24px] w-full flex-col ${
        confirmationData.loading ? "justify-start pt-[30px]" : "justify-end"
      } items-center h-[calc(100vh)] overflow-auto max-h-[calc(100vh)] fixed top-[0px] left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      {confirmationData?.loading ? (
        <span className="scale-[4]">
          <Spinner />
        </span>
      ) : (
        <div className="flex-col justify-end items-center h-auto">
          <LargeColorIcon />
          <span className="mt-[11px] text-[#D3D3D3] text-[16px] medium">
            {translateFunction(`Cahnge Below ${type}`)}
          </span>
          <div
            style={{
              border: "#D3D3D380 1px solid",
            }}
            className={`flex-col pl-[10px] relative h-auto max-w-[600px]  min-h-[138px] items-center justify-center  mt-[12px] rounded-[15px]  w-full `}
          >
            <div className="w-auto h-[98px] flex-col items-center justify-center">
              <img
                className="w-[70px] h-[70px] object-cover rounded-full"
                src={GetImageUrl(
                  confirmationData?.productDetails?.sync_color_images?.find(
                    (s) =>
                      s.color_name?.toLowerCase() ===
                      confirmationData?.currentColor?.toLowerCase()
                  )?.images[0]
                )}
              />
              <span className="text-[#fff] text-[14px] medium mt-[9px]">
                {type === "Color"
                  ? confirmationData?.productDetails?.sync_color_images?.find(
                      (s) =>
                        s.color_name?.toLowerCase() ===
                        confirmationData?.currentColor?.toLowerCase()
                    )?.color_name
                  : confirmationData?.currentSize}
              </span>
            </div>
          </div>
          <span className="text-[#fff] text-[16px] medium mt-[15px]">
            {translateFunction(`To New ${type}`)}
          </span>
          <div
            style={{
              border: "#FFFFFF80 1px solid",
            }}
            className={`flex-col overflow-hidden pl-[10px] relative h-auto max-w-[600px]  min-h-[138px] items-center justify-center  mt-[12px] rounded-[15px]  w-full `}
          >
            {type === "Color" ? (
              <ColorList
                currentColor={confirmationData?.currentColor}
                newColor={confirmationData?.newColor}
                colors={confirmationData?.productDetails?.sync_color_images}
                setColor={(e) => {
                  setConfirmationData({ ...confirmationData, newColor: e });
                }}
              />
            ) : (
              <SizeList
                currentSize={confirmationData?.currentSize}
                newSize={confirmationData?.newSize}
                setSize={(e) => {
                  setConfirmationData({ ...confirmationData, newSize: e });
                }}
                image={orderItem?.image}
                sizes={
                  confirmationData?.productDetails?.choice_options?.[0]?.options
                }
              />
            )}
          </div>
          <p className="text-[14px] text-white regular mt-[40px]">
            {translateFunction("I Read And Agree To")}
            <a
              target="_blank"
              href="#"
              className="ml-[4px] medium text-[14px] text-white underline"
            >
              {translateFunction(`The Change ${type} Terms.`)}
            </a>
          </p>
          <p className="text-[14px] text-white medium mt-[40px] text-center ">
            {translateFunction(
              `We Will Ignore The First ${type} And Send Your Order To The New Address.`
            )}
          </p>
          <div
            className={`cursor-pointer mt-[10px] w-full h-[50px] rounded-[15px]  text-[16px] bold flex items-center justify-center ${
              isChanged()
                ? "bg-[#F8F8F8] text-[#402CDD]"
                : "bg-[#C4C2C2] text-[#fff]"
            }`}
            style={{
              border: isChanged() && "1px solid #402CDD80",
            }}
            onClick={() => {
              if (isChanged()) {
                ConfirmChange();
              }
            }}
          >
            {translateFunction("Yes, I Agree")}
          </div>
          <div
            className="cursor-pointer w-full h-[50px] text-[#fff] text-[16px] regular flex items-center justify-center"
            onClick={() => {
              setConfirmationData(false);
            }}
          >
            {translateFunction("Cancel")}
          </div>
        </div>
      )}
    </div>
  );
};
export const ColorList = ({
  colors,
  setColor,
  currentColor,
  newColor,
}: ColorListPropsType) => {
  const isActive = (name) => {
    if (!newColor) return name?.toLowerCase() === currentColor?.toLowerCase();
    else if (newColor?.toLowerCase() === name?.toLowerCase()) return true;
    else return false;
  };
  return (
    <HortiznalScrollBar
      className="w-full h-[98px] flex-row gap-[10px] pt-[1px]"
      id="color-list-container"
    >
      {colors?.map((s) => (
        <div
          key={s.color_name}
          className="w-auto h-[98px] flex-col items-center justify-center"
          onClick={() => {
            setColor(s?.color_name);
          }}
        >
          <img
            style={{
              border: isActive(s?.color_name)
                ? "1px solid #402CDDef"
                : "1px solid #ffffffef",
            }}
            className="min-w-[70px] min-h-[70px] object-cover rounded-full max-w-[70px] max-h-[70px]"
            src={GetImageUrl(s?.images[0])}
          />
          <span
            className={`${
              isActive(s.color_name)
                ? "text-[#402CDD] medium"
                : "text-[#5D5C5D] regular"
            } text-[14px]  mt-[9px]`}
          >
            {s?.color_name}
          </span>
        </div>
      ))}
    </HortiznalScrollBar>
  );
};
export const SizeList = ({
  sizes,
  setSize,
  currentSize,
  newSize,
  image,
}: SizeListPropsType) => {
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
        className="w-full h-[98px] flex-row gap-[10px] mt-[1px]"
        id="color-list-container"
      >
        {sizes?.map((s) => (
          <div
            key={s?.name}
            className="w-auto h-[98px] flex-col items-center justify-center pt-[1px]"
            onClick={() => {
              setSize(s?.name);
            }}
          >
            <img
              style={{
                border: isActive(s?.name)
                  ? "1px solid #402CDDef"
                  : "1px solid #ffffffef",
              }}
              className="min-w-[70px] min-h-[70px] object-cover rounded-full max-w-[70px] max-h-[70px]"
              src={GetImageUrl(image)}
            />
            <span
              className={`${
                isActive(s?.name)
                  ? "text-[#402CDD] medium"
                  : "text-[#5D5C5D] regular"
              } text-[14px]  mt-[9px]`}
            >
              {s?.name}
            </span>
          </div>
        ))}
      </HortiznalScrollBar>
    </div>
  );
};
