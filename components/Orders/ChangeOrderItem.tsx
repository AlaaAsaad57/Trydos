import React, { useEffect, useState } from "react";
import { getConfiguredImage, translateFunction } from "utils/functions";
import Image from "next/image";
import ChangeOrderItemIcon from "public/svg/ChangeOrderItemIcon.svg";
import { AxiosGet } from "utils/AxiosApi";
import Spinner from "components/global/Spinner";
import { ColorList, SizeList } from "./ModifyOrderItemModal";

function ChangeOrderItem({
  item,
  backToMain,
  setShouldConfirmChange,
  changeOrderItem,
}) {
  const [tabs, setTabs] = useState<string>(
    item?.variation?.color
      ? "Change Color"
      : item?.variation?.Size
      ? "Change Size"
      : "Change Qty"
  );
  let optinsTabs = [
    {
      name: "Change Color",
      isExist: item?.variation?.color,
    },
    {
      name: "Change Size",
      isExist: item?.variation?.Size,
    },
    {
      name: "Change Qty",
      isExist: true,
    },
  ];
  const [color, setColor] = useState<string>(item?.variation?.color);
  const [size, setSize] = useState<string>(item?.variation?.Size);
  const [qty, setQty] = useState<number>(item?.qty);
  const [productData, setProductData] = useState<any>(null);
  useEffect(() => {
    getProductDetails();
  }, []);
  const getProductDetails = async () => {
    let [data1, data2] = await Promise.all([
      AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/qtyPriceDetails/${item?.product_slug}`,
        title: "Get Product Vriantes",
      }),
      AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/globalDetails/${item?.product_slug}`,
        title: "GEt Product Global Details",
      }),
    ]);
    setProductData({ ...data1, ...data2 });
  };

  const isChanged = () => {
    if (color !== item?.variation?.color) {
      return true;
    }
    if (size !== item?.variation?.Size) {
      return true;
    }
    if (qty !== item?.qty) {
      return true;
    }
    return false;
  };
  const renderSection = () => {
    if (!productData)
      return (
        <div className="flex-col w-full items-center  border-[#E6E6E680] h-[100px] border-b-[1px] pt-[40px] px-[24px]">
          <span className="scale-[4]">
            <Spinner />
          </span>
        </div>
      );
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
                src: item.image,
                width: 104,
                height: 144,
                q: 100,
              })}
              width={104}
              height={144}
              alt={item.name}
            />
          </div>
          <div className="relative flex w-[30px] h-[30px] items-center justify-center mt-[12px]">
            <ChangeOrderItemIcon className="absolute top-0 left-0 right-0 mx-auto my-0" />
            <Image
              alt={item.name}
              width={20}
              height={20}
              className="rounded-full h-[20px] w-[20px] object-cover"
              src={getConfiguredImage({
                src: item.image,
                width: 20,
                height: 20,
                q: 100,
              })}
            />
          </div>
          <span className="medium text-[14px] mt-[11px] text-[#1d1d1d]">
            {translateFunction("Change Product Request")}
          </span>
          <span className="regular text-[12px] mt-[11px] text-[#8D8D8D] text-center">
            {translateFunction(
              "You Can Change Size, Color, Qty Of  The Product Without Any Conditions According To The Change Policy"
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
                }}
                onClick={() => {
                  setTabs(s.name);
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
          if (!isChanged()) {
            backToMain();
          } else {
            changeOrderItem({
              id: item.id,
              color: color,
              size: size,
              qty: qty,
              image:
                productData?.sync_color_images?.find(
                  (s) => s.color_name?.toLowerCase() === color?.toLowerCase()
                )?.images?.[0] || productData?.images[0],
            });
            setShouldConfirmChange(true);
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
export const ChangeColorWidget = ({
  color,
  setColor,
  item,
  productData,
}: {
  color: string;
  setColor: (color: string) => void;
  item: any;
  productData: any;
}) => {
  return (
    <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px] px-[24px] mt-[10px]">
      <div className="relative">
        <Image
          alt={item.name}
          width={70}
          height={70}
          className="w-[70px] h-[70px] object-cover rounded-full"
          src={getConfiguredImage({
            src: item.image,
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
        colors={productData?.sync_color_images}
        setColor={setColor}
        currentColor={item?.variation?.color}
        newColor={color}
      />
    </div>
  );
};
export const ChangeSizeWidget = ({
  size,
  setSize,
  item,
  productData,
}: {
  size: string;
  setSize: (size: string) => void;
  item: any;
  productData: any;
}) => {
  return (
    <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px] px-[24px] mt-[10px]">
      <div className="relative">
        <Image
          alt={item.name}
          width={70}
          height={70}
          className="w-[70px] h-[70px] object-cover rounded-full"
          src={getConfiguredImage({
            src: item.image,
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
        <span className="mx-[4px]">{item?.variation?.Size}</span>
      </span>
      <span className="text-[#1d1d1d] text-[14px] regular mt-[9px] flex-row items-center w-full justify-center text-center">
        {translateFunction("To New Size?")}
      </span>
      <SizeList
        image={getConfiguredImage({
          src: item.image,
          width: 70,
          height: 70,
          q: 100,
        })}
        sizes={
          productData?.choice_options?.filter(
            (s) => s.title?.toLowerCase() === "size"
          )[0]?.options
        }
        setSize={setSize}
        currentSize={item?.variation?.Size}
        newSize={size}
      />
    </div>
  );
};
export const ChangeQtyWidget = ({
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
          alt={item.name}
          width={70}
          height={70}
          className="w-[70px] h-[70px] object-cover rounded-full"
          src={getConfiguredImage({
            src: item.image,
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
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="flex items-center justify-center w-[40px] h-[40px] rounded-l-[12px] bg-[#F8F8F8] border border-[#E6E6E680] border-r-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
        >
          <span className="text-[#1D1D1D] text-[18px] light">−</span>
        </button>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="flex-1 h-[40px] text-center text-[16px] font-medium text-[#1D1D1D] bg-white border-t border-b border-[#E6E6E680] focus:outline-none focus:border-[#402CDD] focus:ring-1 focus:ring-[#402CDD80] transition-all duration-200"
          min="1"
        />
        <button
          onClick={() => setQty(qty + 1)}
          className="flex items-center justify-center w-[40px] h-[40px] rounded-r-[12px] bg-[#F8F8F8] border border-[#E6E6E680] border-l-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
        >
          <span className="text-[#1D1D1D] text-[18px] light">+</span>
        </button>
      </div>
      <span className="text-[#8D8D8D] text-[12px] regular mt-[8px] text-center">
        {translateFunction("Select quantity")}
      </span>
    </div>
  );
};
