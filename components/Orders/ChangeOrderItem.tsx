import React, { useEffect, useState } from "react";
import {
  getConfiguredImage,
  LogError,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import Image from "next/image";

import { ColorList, SizeList } from "./ModifyOrderItemModal";
import { GetImageUrl, isSameColor, pollinateInput } from "utils/tinyUtils";

import { fetchData } from "utils/fetchData";
import { showErrorNotification } from "store/notifications/reducer";
import { useAppStore } from "store";
import { REQUESTS_DATA } from "utils/Requests";
import ChangeOrderItemSkeleton from "components/skeleton/loaders/ChangeOrderItemSkeleton";
import { OrderInterface } from "utils/types/OrderInterface";

function ChangeOrderItem({
  item,
  order_id,
  backToMain,
  setShouldConfirmChange,
  shouldConfirmChange,
}: {
  item: OrderInterface["details"][0];
  order_id: number;
  [key: string]: any;
}) {
  const [loading, setLoading] = useState(false);
  const CancelQty = async () => {
    try {
      setShouldConfirmChange({
        order_id: order_id,
        item_id: item?.id,
        qty: item.qty - qty,
        type: "CancelQty",
      });
    } catch (error) {
      setLoading(false);
    }
  };
  const { language } = useAppStore();
  const [tabs, setTabs] = useState<string>(
    item?.variation?.[0]?.color
      ? "Change Color"
      : item?.variation?.[0]?.Size
        ? "Change Size"
        : "Change Qty",
  );
  let optinsTabs = [
    {
      name: "Change Color",
      isExist: item?.variation?.[0]?.color,
    },
    {
      name: "Change Size",
      isExist: item?.variation?.[0]?.Size,
    },
    {
      name: "Change Qty",
      isExist: true,
    },
  ];
  const [color, setColor] = useState<string>(
    item?.variation?.[0]?.color_options,
  );

  const [size, setSize] = useState<string>(item?.variation?.[0]?.size_options);
  const getVariant = () => {
    if (!productData?.variation || productData?.variation?.length === 0)
      return { ...productData };
    let variation = [];
    if (color) variation.push(color);
    if (size) variation.push(size);

    let variationText = variation.join("-");
    let selected_vartion = productData?.variation?.find(
      (s) => s.type?.toLowerCase() === variationText?.toLowerCase(),
    );

    return selected_vartion;
  };
  const [qty, setQty] = useState<number>(item?.qty);
  const [productData, setProductData] = useState<any>(null);
  useEffect(() => {
    getProductDetails();
  }, []);
  getVariant();
  const getProductDetails = async () => {
    try {
      let [data1, data2] = await Promise.all([
        (async () => {
          let response = await fetchData({
            url: `/web/product/qtyPriceDetails/${item?.product_slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS,
            method: "GET",
            server: "market",
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
        (async () => {
          let response = await fetchData({
            url: `/web/product/globalDetails/${item?.product_slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_GLOBAL_DETAILS,
            method: "GET",
            server: "market",
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
      ]);
      setProductData({ ...data1.data, ...data2.data });
    } catch (err) {
      LogError({
        error: err,
        scenario: "Error in getProductDetails in ChangeOrderItem ",
      });
      console.error(err);
    }
  };

  if (!productData) {
    return <ChangeOrderItemSkeleton />;
  }

  const isChanged = () => {
    if (productData?.sync_color_images) {
      let selectedColor = productData?.sync_color_images
        ?.map((s) => {
          return { color_name: s.color_name, color_option: s.color_option };
        })
        .filter((s) => color === s.color_name || color === s.color_option)[0];
      let previousColor = productData?.sync_color_images
        ?.map((s) => {
          return { color_name: s.color_name, color_option: s.color_option };
        })
        ?.filter(
          (s) =>
            item?.variation?.[0]?.color === s.color_name ||
            item?.variation?.[0]?.color === s.color_option,
        )[0];
      if (!isSameColor(selectedColor, previousColor)) {
        return true;
      }
    }
    if (size !== item?.variation?.[0]?.size_options) {
      return true;
    }
    if (qty !== item?.qty) {
      return true;
    }
    return false;
  };
  const isChangedQtyOnly = () => {
    if (qty !== item?.qty) {
      return true;
    }
    return false;
  };
  const renderSection = () => {
    if (tabs === "Change Color")
      return (
        <ChangeColorWidget
          item={item}
          productData={productData}
          color={color}
          setColor={setColor}
        />
      );
    if (tabs === "Change Size")
      return (
        <ChangeSizeWidget
          item={item}
          productData={productData}
          size={size}
          setSize={setSize}
        />
      );
    if (tabs === "Change Qty")
      return (
        <ChangeQtyWidget
          item={item}
          productData={productData}
          qty={qty}
          setQty={setQty}
        />
      );
  };
  const canNavigateToNextTab = () => {
    return isChanged();
  };
  return (
    <>
      <div className="flex-col w-full items-center  pb-[12px] px-[24px]">
        <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px]">
          <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
          <div className="w-[104px] h-[144px] mt-[20px] relative">
            <span
              className="absolute top-0 left-0 z-10 w-full h-[144px] rounded-[15px]"
              style={{
                boxShadow: "inset 0px 3px 6px #ffffff80",
              }}
            ></span>
            <Image
              className="rounded-[15px]  h-[144px] object-cover"
              style={{
                border: "1px solid #ffffff80",
              }}
              src={getConfiguredImage({
                src: GetImageUrl(item.image),
                width: 104,
                height: 144,
                q: 100,
              })}
              width={104}
              height={144}
              alt={item?.product_details?.name || "Image"}
            />
          </div>
          <div className="relative flex w-[30px] h-[30px] items-center justify-center mt-[12px]">
            <img
              src="/icons/ChangeOrderItemIcon.svg"
              className="absolute top-0 left-0 right-0 mx-auto my-0"
            />
            <Image
              alt={item?.product_details?.name || "Image"}
              width={20}
              height={20}
              className="rounded-full h-[20px] w-[20px] object-cover ddd"
              src={getConfiguredImage({
                src: GetImageUrl(item.image),
                width: 20,
                height: 20,
                q: 100,
              })}
            />
          </div>
          <span className="medium text-[14px] mt-[11px] text-[#1d1d1d]">
            {translateFunction("Change Product Request")}
          </span>
          <span className="regular text-[12px] mt-[11px] text-[#8D8D8D] text-center gap-[4px]">
            {translateFunction(
              "You Can Change Size, Color, Qty Of  The Product Without Any Conditions According To The Change Policy",
            )}
            {isChanged() && (
              <pre
                className="text-[#1d1d1d] medium gap-[4px]"
                data-cy="new-price-after-change-label"
              >
                {translateFunction("New Price")}:{" "}
                <span data-cy="new-price-after-change-value">
                  {RoundPrice({
                    num: getVariant()?.offer_price * qty,
                    language: language,
                  })}
                </span>
              </pre>
            )}
          </span>
        </div>
      </div>
      <div className="flex-row bg-[#F8F8F8] rounded-[20px] h-[50px] mt-[10px] w-full">
        {optinsTabs.map((s, i) => {
          if (s.isExist) {
            return (
              <div
                key={s.name}
                className="flex-row flex-1 basis-0 text-center rounded-[20px] items-center justify-center h-[50px] text-[14px] medium text-[#1D1D1D]"
                style={{
                  border: tabs === s.name ? "1px solid #402CDD80" : "none",
                  opacity: canNavigateToNextTab() && tabs !== s.name ? 0.5 : 1,
                }}
                onClick={() => {
                  if (canNavigateToNextTab()) {
                    showErrorNotification(
                      translateFunction("Confirm the Changes First"),
                    );
                  } else {
                    setTabs(s.name);
                  }
                }}
              >
                {translateFunction(s.name)}
              </div>
            );
          }
        })}
      </div>
      {renderSection()}
      <div
        className={`w-full min-h-[53px] items-center justify-center  flex cursor-pointer ${
          !isChanged() ? "bg-[#D3D3D3] " : "bg-[#402CDD] "
        } rounded-[20px] text-[16px] text-[#fff] medium`}
        onClick={() => {
          if (isChangedQtyOnly()) {
            CancelQty();
            return;
          }
          if (!isChanged()) {
            backToMain();
          } else {
            if (tabs === "Change Color") {
              setShouldConfirmChange({
                ...shouldConfirmChange,
                type: "Color",
                currentColor: item?.variation?.[0]?.color,
                currentSize: item?.variation?.[0]?.Size,
                newColor: color,
                newSize: size,
                productDetails: productData,
                detail_id: item?.id,
              });
            }
            if (tabs === "Change Size") {
              setShouldConfirmChange({
                ...shouldConfirmChange,
                type: "Size",
                currentColor: item?.variation?.[0]?.color,
                currentSize: item?.variation?.[0]?.Size,
                newColor: color,
                newSize: size,
                productDetails: productData,
                detail_id: item?.id,
              });
            }
          }
        }}
      >
        {!isChanged()
          ? translateFunction("Close")
          : translateFunction("Change Request")}
      </div>
    </>
  );
}

export default ChangeOrderItem;
const ChangeColorWidget = ({ color, setColor, item, productData }) => {
  return (
    <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px] px-[24px] mt-[10px]">
      <div className="relative">
        <Image
          alt={item.name || "Image"}
          width={70}
          height={70}
          className="w-[70px] h-[70px] object-cover rounded-full"
          src={getConfiguredImage({
            src: GetImageUrl(item.image),
            width: 70,
            height: 70,
            q: 100,
          })}
        />
        <span
          className="absolute top-0 left-0 h-[70px] w-[70px] rounded-full z-10"
          style={{
            boxShadow: "inset 0px 3px 6px #ffffff80",
            border: "1px solid #ffffff80",
          }}
        />
      </div>
      <span className="text-[#1d1d1d] text-[14px] regular mt-[9px] flex-row items-center w-full border-[#E6E6E680] border-b-[1px] pb-[12px] justify-center text-center">
        {translateFunction("Change From")}
        <span className="mx-[4px]">{item?.variation?.color}</span>
      </span>
      <span className="text-[#1d1d1d] text-[14px] regular mt-[9px] flex-row items-center w-full justify-center text-center">
        {translateFunction("To New Color?")}
      </span>
      <ColorList
        item={item}
        variations={productData?.variation}
        colors={productData?.sync_color_images?.filter((s) =>
          productData.colors?.find(
            (color) =>
              color.option === s.color_option || color.name === s.color_name,
          ),
        )}
        setColor={setColor}
        sizes={productData?.choice_options?.[0]?.options || []}
        current_size={item?.variation?.[0]?.Size}
        currentColor={item?.variation?.[0]?.color}
        newColor={color}
      />
    </div>
  );
};
const ChangeSizeWidget = ({ size, setSize, item, productData }) => {
  return (
    <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px] px-[24px] mt-[10px]">
      <div className="relative">
        <Image
          alt={item.name || "Image"}
          width={70}
          height={70}
          className="w-[70px] h-[70px] object-cover rounded-full"
          src={getConfiguredImage({
            src: GetImageUrl(item.image),
            width: 70,
            height: 70,
            q: 100,
          })}
        />
        <span
          className="absolute top-0 left-0 h-[70px] w-[70px] rounded-full z-10"
          style={{
            boxShadow: "inset 0px 3px 6px #ffffff80",
            border: "1px solid #ffffff80",
          }}
        />
      </div>
      <span className="text-[#1d1d1d] text-[14px] regular mt-[9px] flex-row items-center w-full border-[#E6E6E680] border-b-[1px] pb-[12px] justify-center text-center">
        {translateFunction("Change From")}
        <span className="mx-[4px]">{item?.variation?.[0]?.Size}</span>
      </span>
      <span className="text-[#1d1d1d] text-[14px] regular mt-[9px] flex-row items-center w-full justify-center text-center">
        {translateFunction("To New Size?")}
      </span>
      <SizeList
        item={item}
        variations={productData?.variation}
        image={getConfiguredImage({
          src: item.image,
          width: 70,
          height: 70,
          q: 100,
        })}
        currentColor={item?.variation?.[0]?.color}
        colors={productData?.sync_color_images}
        sizes={productData?.choice_options?.[0]?.options}
        setSize={setSize}
        currentSize={item?.variation?.[0]?.Size}
        newSize={size}
      />
    </div>
  );
};
const ChangeQtyWidget = ({
  qty,
  setQty,
  item,
  productData,
}: {
  qty: number;
  setQty: (qty: number) => void;
  item: any;
  productData: any;
}) => {
  return (
    <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px] px-[24px] mt-[10px]">
      <div className="relative">
        <Image
          alt={item.name || "Image"}
          width={70}
          height={70}
          className="w-[70px] h-[70px] object-cover rounded-full"
          src={getConfiguredImage({
            src: GetImageUrl(item.image),
            width: 70,
            height: 70,
            q: 100,
          })}
        />
        <span
          className="absolute top-0 left-0 h-[70px] w-[70px] rounded-full z-10"
          style={{
            boxShadow: "inset 0px 3px 6px #ffffff80",
            border: "1px solid #ffffff80",
          }}
        />
      </div>
      <span className="text-[#1d1d1d] text-[14px] regular mt-[9px] flex-row items-center w-full border-[#E6E6E680] border-b-[1px] pb-[12px] justify-center text-center">
        {translateFunction("Change From")}
        <span className="mx-[4px]">{item?.qty}</span>
        <span className="medium">{translateFunction("Qty")}</span>
      </span>
      <div className="flex-row items-center justify-center mt-[20px] w-full max-w-[200px]">
        <button
          onClick={() => setQty(Math.max(0, qty - 1))}
          className="flex items-center justify-center w-[40px] h-[40px] rounded-l-[12px] bg-[#F8F8F8] border border-[#E6E6E680] border-r-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
        >
          <span className="text-[#1D1D1D] text-[18px] light">−</span>
        </button>
        <input
          type="number"
          value={qty}
          onChange={(e) => {
            if (parseInt(pollinateInput(e.target.value)) > item.qty) {
              showErrorNotification(
                translateFunction(
                  "You Can't Change Qty To Higher Than The Current Qty",
                ),
              );
            } else {
              setQty(Math.max(0, parseInt(pollinateInput(e.target.value))));
            }
          }}
          className="flex-1 h-[40px] text-center text-[16px] font-medium text-[#1D1D1D] bg-white border-t border-b border-[#E6E6E680] focus:outline-none focus:border-[#402CDD] focus:ring-1 focus:ring-[#402CDD80] transition-all duration-200"
          min="1"
        />
        {item.qty !== qty && (
          <button
            onClick={() => setQty(Math.min(item.qty, qty + 1))}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-r-[12px] bg-[#F8F8F8] border border-[#E6E6E680] border-l-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
          >
            <span className="text-[#1D1D1D] text-[18px] light">+</span>
          </button>
        )}
      </div>
      <span className="text-[#8D8D8D] text-[12px] regular mt-[8px] text-center">
        {translateFunction("Select quantity")}
      </span>
    </div>
  );
};
