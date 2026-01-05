import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import ReturnOrderItemIcon from "public/svg/ReturnOrderItemIcon";
import { useAppStore } from "store";

import Spinner from "components/global/Spinner";
import order from "services/order";
import Skeleton from "react-loading-skeleton";

import UploadImageComponent from "./UploadImageComponent";

function ReturnOrderItem({ backToMain, item, setShouldConfirmReturn }: any) {
  const { currency, language, ActivePacks } = useAppStore();
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(null);

  const handleOptionClick = (option) => {
    if (selectedOptions?.id === option.id) {
      setSelectedOptions(null);
    } else {
      setSelectedOptions(option);
    }
  };
  const [images, setImages] = useState<string[]>(item?.return?.img ?? []);
  const [loading, setLoading] = useState(true);
  const getReasons = async () => {
    try {
      setLoading(true);
      let response = await order.getReturnReasons();
      setOptions(response.data.return_reasons);
      if (item?.return?.return_request_product_reason_id) {
        setSelectedOptions(
          response?.data?.return_reasons?.find(
            (s) => s.id === item?.return?.return_request_product_reason_id
          )
        );
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    getReasons();
  }, []);
  const [loadingImage, setLoadinImage] = useState(false);
  const [returnedQty, setReturnedQty] = useState(
    (item.return.return_request_product_quantity &&
      parseInt(item.return.return_request_product_quantity)) ??
      item.qty
  );
  const isRtl = language === "ar" || language === "ku";
  console.log({
    price_fin:
      ((item?.price_after_discount || item.price) / item.qty) * returnedQty -
      (selectedOptions?.is_cost_by_system === 0 ? selectedOptions.cost : 0),
    price: item?.price_after_discount || item.price,
    qty: item?.qty,
    returnedQty,
  });
  return (
    <>
      <div className="flex-col w-full items-center pb-[12px] px-[24px]">
        <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
        <div className="w-[104px] h-[144px] mt-[20px] relative">
          <span
            className="absolute top-0 left-0 z-10 w-full h-[144px] rounded-[15px]"
            style={{
              boxShadow: "inset 0px 3px 6px #ffffff80",
            }}
          ></span>
          <Image
            className="rounded-[15px] h-[144px] object-cover"
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
        <div className="">
          <ReturnOrderItemIcon className="mt-[12px] [&>path]:fill-[#402CDD]" />
        </div>
        <span className="medium text-[14px] mt-[11px] text-[#402CDD]">
          {item?.return?.already_return
            ? translateFunction("Update Return Request For This Product")
            : translateFunction("Return This Product")}
        </span>
        <p
          className={`${
            isRtl && "dir-rtl"
          } text-[#8D8D8D] text-[12px] regular text-center`}
        >
          {translateFunction(
            "You Can Return The Product Without Any Conditions According To The Return Policy And Get A Refund"
          )}
          <span className="bold text-[12px] text-[#8D8D8D] ml-[4px]">
            {RoundPrice({
              num:
                ((item?.price_after_discount || item.price) / item.qty) *
                  returnedQty -
                (selectedOptions?.is_cost_by_system === 0
                  ? selectedOptions.cost
                  : 0),
              rate: currency?.exchange_rate,
              language: language,
              returnNumber: true,
              points: currency?.decimal_digits,
            })}
          </span>
          <span className="text-[#8D8D8D] mx-[4px]">{currency?.symbol}</span>
          {translateFunction("To Your Account")}.
        </p>
        <span className="border-[#C4C2C280] border-b-[1px] w-full mt-[12px]" />
      </div>

      <div className="flex-row rounded-[12px] bg-white  border border-[#E6E6E680] items-center justify-center mt-[20px] w-full max-w-[350px]">
        {returnedQty > 1 ? (
          <button
            onClick={() => setReturnedQty(Math.max(1, returnedQty - 1))}
            className="flex items-center justify-center w-[20px] h-[40px] rounded-l-[12px] bg-[#5d5d5d] border border-[#E6E6E680] border-r-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
          >
            <span className="text-white text-[18px] light">−</span>
          </button>
        ) : (
          <span className="w-[20px]"></span>
        )}
        <div
          className="flex-row flex items-center justify-center flex-1 gap-[5px] px-[5px]"
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          <span className=" text-[#1d1d1d] text-[10px]">
            {translateFunction("enter number of pieces you want to return")}
          </span>
          <div className=" w-[60px] h-[40px] items-center flex text-center text-[14px] font-medium text-[#1D1D1D]   transition-all duration-200">
            {returnedQty}
          </div>
        </div>
        {item.qty > returnedQty ? (
          <button
            onClick={() => {
              setReturnedQty(Math.max(1, returnedQty + 1));
            }}
            className="flex items-center justify-center w-[20px] h-[40px] rounded-r-[12px] bg-[#5d5d5d] border border-[#E6E6E680] border-r-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
          >
            <span className="text-white text-[18px] light">+</span>
          </button>
        ) : (
          <span className="w-[20px]"></span>
        )}
      </div>
      <div className="flex-row w-full items-center justify-center mt-[30px]">
        <p className="text-[#8D8D8D] text-[12px] regular text-center">
          {translateFunction("Why Was The Product Return?")}
          <span className="text-[#402CDD] mx-[4px] cursor-pointer">
            {translateFunction("Learn More Tips.")}
          </span>
        </p>
      </div>
      <div className="flex-row w-full flex-wrap items-center mt-[12px] gap-y-[10px]  gap-x-[12px] pr-[50px]  pl-[24px]">
        {loading ? (
          <OptionsSkeleton />
        ) : (
          options.map((option, index) => (
            <div
              key={option?.id}
              className={`${
                option.is_cost_by_system === 0 &&
                option.cost > item.product_details.offer_price &&
                "opacity-65"
              } px-[12px] w-auto regular text-[12px] text-[#5D5C5D] flex-row h-[39px] justify-start items-center rounded-[12px] bg-[#F8F8F8] `}
              style={{
                flex: "0 1 auto",
                border:
                  selectedOptions?.id === option.id
                    ? "1px solid #402CDD80"
                    : "none",
              }}
              onClick={() => {
                if (option.is_cost_by_system === 0) {
                  if (option.cost > item.product_details.offer_price) {
                    return;
                  }
                }
                handleOptionClick(option);
              }}
            >
              <div className="flex gap-[3px]">
                <span className="regular text-[12px] text-[#8D8D8D]">
                  {option.reason_ae_en}
                </span>
                {option.is_cost_by_system === 0 && (
                  <span data-cy="reason-cost">
                    (
                    {RoundPrice({
                      num: option.cost,
                      rate: currency?.exchange_rate,
                      language: language,
                      returnNumber: true,
                    })}{" "}
                    {currency.symbol})
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {selectedOptions && (
        <>
          <span className="border-[#C4C2C280] border-b-[1px] w-full mt-[12px]" />
          <UploadImageComponent
            removeImageAction={async (i) => {
              try {
                if (item.return.return_request_product_id) {
                  setLoading(true);
                  await order.removeImage({
                    return_request_product_id:
                      item.return.return_request_product_id,
                    img: i,
                  });
                  setLoading(false);
                }
              } catch (error) {
                setLoading(false);
                throw error;
              }
            }}
            loading={loadingImage}
            setLoading={setLoadinImage}
            images={images}
            setImages={setImages}
          />
        </>
      )}
      <div className="flex-row px-[24px] w-full mt-[15px]">
        <div
          className={`w-full h-[53px] items-center justify-center  flex cursor-pointer ${
            !selectedOptions || images.length === 0
              ? "bg-[#D3D3D3] "
              : "bg-[#402CDD] "
          } rounded-[20px] text-[16px] text-[#fff] medium`}
          onClick={() => {
            if (loadingImage) return;
            if (!selectedOptions || images.length === 0) {
              backToMain();
            } else {
              setShouldConfirmReturn({
                item: {
                  ...item,
                  qty: returnedQty,
                  quantity: (item as any)?.qty,
                },
                images: images,
                reasons: selectedOptions,
                additon_cost: selectedOptions?.is_cost_by_system === 0,
                qty: returnedQty,
                update: item?.return?.already_return,
                return_request_product_id:
                  item?.return?.return_request_product_id,
              });
              //   setConfirmationData({
              //     enable: true,
              //     currentAddress: addressLists?.find((s) => s.id === address_id),
              //     newAddress: addressLists?.find(
              //       (s) => s.id === selectedAddressId
              //     ),
              //   });
            }
          }}
        >
          {loadingImage ? (
            <Spinner />
          ) : (
            <>
              {!selectedOptions || images.length === 0
                ? translateFunction("Close")
                : translateFunction("Return Request")}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ReturnOrderItem;

const OptionsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 7 }).map((s, i) => (
        <div
          className={`px-[12px] w-[70px] max-w-[70px] regular text-[12px] text-[#5D5C5D] flex-row h-[39px] justify-start items-center rounded-[12px]  `}
        >
          <Skeleton
            key={i}
            width={70}
            height={40}
            borderRadius={12}
            style={{
              flex: "0 1 auto",
            }}
          ></Skeleton>
        </div>
      ))}
    </>
  );
};
